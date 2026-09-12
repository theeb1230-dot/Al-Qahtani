import 'dart:async';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class DownloadResult {
  const DownloadResult({required this.path, required this.bytes});
  final String path;
  final int bytes;
}

class DownloadProgress {
  const DownloadProgress({required this.receivedBytes, this.totalBytes});
  final int receivedBytes;
  final int? totalBytes;
  double? get fraction => totalBytes == null || totalBytes! <= 0 ? null : (receivedBytes / totalBytes!).clamp(0.0, 1.0).toDouble();
}

class DownloadedFileInfo {
  const DownloadedFileInfo({required this.name, required this.bytes, required this.modifiedAt});
  final String name;
  final int bytes;
  final DateTime modifiedAt;
}

class DownloadCancellationToken {
  final Completer<void> _cancelled = Completer<void>();
  bool get isCancelled => _cancelled.isCompleted;
  Future<void> get whenCancelled => _cancelled.future;
  void cancel() { if (!_cancelled.isCompleted) _cancelled.complete(); }
}

typedef DownloadDirectoryProvider = Future<Directory> Function();
typedef DownloadProgressCallback = void Function(DownloadProgress progress);
typedef DownloadReconnectDelay = Future<void> Function(int attempt, DownloadCancellationToken? token);

class DownloadService {
  DownloadService({http.Client? client, DownloadDirectoryProvider? directoryProvider, DownloadReconnectDelay? reconnectDelay})
      : _client = client ?? http.Client(),
        _directoryProvider = directoryProvider ?? _defaultDirectory,
        _reconnectDelayOverride = reconnectDelay;
  final http.Client _client;
  final DownloadDirectoryProvider _directoryProvider;
  final DownloadReconnectDelay? _reconnectDelayOverride;
  static const int _maxReconnectAttempts = 4;

  static Future<Directory> _defaultDirectory() async {
    final root = await getApplicationDocumentsDirectory();
    return Directory('${root.path}${Platform.pathSeparator}AlQahtani${Platform.pathSeparator}Downloads');
  }

  Future<DownloadResult> download(Uri uri, {String fallbackName = 'al-qahtani-media', String? resumeKey, DownloadProgressCallback? onProgress, DownloadCancellationToken? cancellationToken}) async {
    if (uri.path != '/api/cinema/media' || uri.queryParameters['download'] != '1') throw const DownloadException('INVALID_DOWNLOAD_REFERENCE');
    _throwIfCancelled(cancellationToken);
    final directory = await _downloadDirectory(create: true);
    final tempFile = File('${directory.path}${Platform.pathSeparator}${_resumeFileName(resumeKey ?? fallbackName)}');
    var bytes = await tempFile.exists() ? await tempFile.length() : 0;
    int? total;
    var reconnectAttempt = 0;
    File? finalFile;

    Future<void> cleanupPartial() async { if (await tempFile.exists()) await tempFile.delete(); }
    try {
      while (true) {
        _throwIfCancelled(cancellationToken);
        http.StreamedResponse response;
        try {
          response = await _send(uri, offset: bytes, cancellationToken: cancellationToken);
        } catch (error) {
          if (_canReconnect(error, reconnectAttempt, bytes)) { reconnectAttempt++; await _reconnectDelay(reconnectAttempt, cancellationToken); continue; }
          rethrow;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          final error = DownloadException('HTTP_${response.statusCode}');
          if (_canReconnect(error, reconnectAttempt, bytes)) { reconnectAttempt++; await _reconnectDelay(reconnectAttempt, cancellationToken); continue; }
          throw error;
        }
        var append = bytes > 0;
        if (append && response.statusCode == 206) {
          if (_contentRangeStart(response.headers['content-range']) != bytes) throw const DownloadException('INVALID_RESUME_RANGE');
        } else if (append && response.statusCode == 200) {
          append = false; bytes = 0; total = null;
        } else if (append) {
          throw const DownloadException('RESUME_NOT_SUPPORTED');
        }
        total = _mergeTotal(total, _responseLength(response.headers));
        final fileName = _trustedFileName(response.headers['content-disposition']) ?? _sanitizeFileName(fallbackName);
        finalFile ??= File('${directory.path}${Platform.pathSeparator}$fileName');
        IOSink? sink;
        StreamIterator<List<int>>? iterator;
        Object? streamError;
        try {
          sink = tempFile.openWrite(mode: append ? FileMode.append : FileMode.writeOnly);
          onProgress?.call(DownloadProgress(receivedBytes: bytes, totalBytes: total));
          iterator = StreamIterator<List<int>>(response.stream.timeout(const Duration(seconds: 30), onTimeout: (eventSink) => eventSink.addError(const DownloadException('DOWNLOAD_STALLED'))));
          while (await _moveNextOrCancel(iterator, cancellationToken)) { final chunk = iterator.current; bytes += chunk.length; sink.add(chunk); onProgress?.call(DownloadProgress(receivedBytes: bytes, totalBytes: total)); }
          await sink.flush(); await sink.close(); sink = null;
        } catch (error) {
          streamError = error;
          try { await iterator?.cancel(); } catch (_) {}
          try { await sink?.close(); } catch (_) {}
        }
        if (streamError != null) {
          if (_canReconnect(streamError, reconnectAttempt, bytes)) { reconnectAttempt++; await _reconnectDelay(reconnectAttempt, cancellationToken); continue; }
          throw streamError;
        }
        if (bytes == 0) throw const DownloadException('EMPTY_DOWNLOAD');
        if (total != null && bytes < total) {
          if (reconnectAttempt < _maxReconnectAttempts && bytes > 0) { reconnectAttempt++; await _reconnectDelay(reconnectAttempt, cancellationToken); continue; }
          throw const DownloadException('INCOMPLETE_DOWNLOAD');
        }
        if (total != null && bytes > total) throw const DownloadException('INVALID_DOWNLOAD_LENGTH');
        final completedFile = finalFile;
        if (await completedFile.exists()) await completedFile.delete();
        await tempFile.rename(completedFile.path);
        return DownloadResult(path: completedFile.path, bytes: bytes);
      }
    } catch (error) {
      if (!_preservePartial(error, bytes)) await cleanupPartial();
      rethrow;
    }
  }

  Future<http.StreamedResponse> _send(Uri uri, {required int offset, DownloadCancellationToken? cancellationToken}) {
    final request = http.Request('GET', uri)..headers['accept'] = '*/*';
    if (offset > 0) request.headers['range'] = 'bytes=$offset-';
    return _awaitOrCancel(_client.send(request).timeout(const Duration(seconds: 30)), cancellationToken);
  }

  static bool _canReconnect(Object error, int attempts, int bytes) {
    if (attempts >= _maxReconnectAttempts || bytes <= 0) return false;
    if (error is DownloadException) {
      if (error.code == 'DOWNLOAD_CANCELLED' || error.code == 'RESUME_NOT_SUPPORTED') return false;
      if (error.code == 'DOWNLOAD_STALLED' || error.code == 'INCOMPLETE_DOWNLOAD') return true;
      if (error.code.startsWith('HTTP_5') || error.code == 'HTTP_408' || error.code == 'HTTP_429') return true;
      return false;
    }
    return error is SocketException || error is TimeoutException || error is http.ClientException;
  }

  static bool _preservePartial(Object error, int bytes) {
    if (bytes <= 0) return false;
    if (error is DownloadException) {
      if (error.code == 'DOWNLOAD_STALLED' || error.code == 'INCOMPLETE_DOWNLOAD') return true;
      if (error.code.startsWith('HTTP_5') || error.code == 'HTTP_408' || error.code == 'HTTP_429') return true;
      return false;
    }
    return error is SocketException || error is TimeoutException || error is http.ClientException;
  }

  Future<void> _reconnectDelay(int attempt, DownloadCancellationToken? token) {
    final override = _reconnectDelayOverride;
    if (override != null) return override(attempt, token);
    return _awaitOrCancel(Future<void>.delayed(Duration(milliseconds: 500 * attempt.clamp(1, _maxReconnectAttempts))), token);
  }

  static int? _mergeTotal(int? current, int? next) { if (next == null || next <= 0) return current; if (current == null) return next; if (current != next) throw const DownloadException('DOWNLOAD_LENGTH_CHANGED'); return current; }
  static int? _contentRangeStart(String? header) { if (header == null) return null; final match = RegExp(r'^bytes\s+([0-9]+)-[0-9]+/[0-9*]+$', caseSensitive: false).firstMatch(header.trim()); return match == null ? null : int.tryParse(match.group(1)!); }
  static void _throwIfCancelled(DownloadCancellationToken? token) { if (token?.isCancelled ?? false) throw const DownloadException('DOWNLOAD_CANCELLED'); }
  static Future<T> _awaitOrCancel<T>(Future<T> operation, DownloadCancellationToken? token) async { if (token == null) return operation; _throwIfCancelled(token); final result = await Future.any<Object>([operation.then<Object>((value) => _DownloadValue<T>(value)), token.whenCancelled.then<Object>((_) => const _DownloadCancelled())]); if (result is _DownloadCancelled) throw const DownloadException('DOWNLOAD_CANCELLED'); return (result as _DownloadValue<T>).value; }
  static Future<bool> _moveNextOrCancel(StreamIterator<List<int>> iterator, DownloadCancellationToken? token) async { if (token == null) return iterator.moveNext(); _throwIfCancelled(token); final result = await Future.any<Object>([iterator.moveNext().then<Object>((value) => _DownloadValue<bool>(value)), token.whenCancelled.then<Object>((_) => const _DownloadCancelled())]); if (result is _DownloadCancelled) { await iterator.cancel(); throw const DownloadException('DOWNLOAD_CANCELLED'); } return (result as _DownloadValue<bool>).value; }
  static int? _responseLength(Map<String, String> headers) { final range = headers['content-range']; if (range != null) { final match = RegExp(r'/([0-9]+)$').firstMatch(range.trim()); final value = match == null ? null : int.tryParse(match.group(1)!); if (value != null && value > 0) return value; } final direct = int.tryParse(headers['content-length'] ?? ''); return direct != null && direct > 0 ? direct : null; }

  Future<List<DownloadedFileInfo>> listDownloads() async { final directory = await _downloadDirectory(create: false); if (!await directory.exists()) return const []; final items = <DownloadedFileInfo>[]; await for (final entity in directory.list(followLinks: false)) { if (entity is! File || entity.path.endsWith('.part')) continue; final stat = await entity.stat(); if (stat.type != FileSystemEntityType.file || stat.size <= 0) continue; items.add(DownloadedFileInfo(name: _baseName(entity.path), bytes: stat.size, modifiedAt: stat.modified)); } items.sort((a, b) => b.modifiedAt.compareTo(a.modifiedAt)); return List.unmodifiable(items); }
  Future<bool> deleteDownload(String name) async { if (!_isSafeStoredName(name)) throw const DownloadException('INVALID_STORED_FILENAME'); final directory = await _downloadDirectory(create: false); if (!await directory.exists()) return false; final file = File('${directory.path}${Platform.pathSeparator}$name'); if (!await file.exists()) return false; await file.delete(); return true; }
  Future<Directory> _downloadDirectory({required bool create}) async { final directory = await _directoryProvider(); if (create) await directory.create(recursive: true); return directory; }
  static bool _isSafeStoredName(String value) => value.isNotEmpty && value != '.' && value != '..' && !value.contains('/') && !value.contains('\\') && _sanitizeFileName(value) == value && !value.endsWith('.part');
  static String _resumeFileName(String value) { var safe = _sanitizeFileName(value).replaceAll(' ', '_'); if (safe.length > 96) safe = safe.substring(0, 96); return '.qahtani-$safe.part'; }
  static String _baseName(String path) { final normalized = path.replaceAll('\\', '/'); return normalized.substring(normalized.lastIndexOf('/') + 1); }
  static String? _trustedFileName(String? disposition) { if (disposition == null || disposition.isEmpty) return null; final utf8Match = RegExp("filename\\*=UTF-8''([^;]+)", caseSensitive: false).firstMatch(disposition); if (utf8Match != null) { final safe = _sanitizeFileName(Uri.decodeComponent(utf8Match.group(1)!)); if (safe.isNotEmpty) return safe; } final plainMatch = RegExp('filename="?([^";]+)"?', caseSensitive: false).firstMatch(disposition); if (plainMatch != null) { final safe = _sanitizeFileName(plainMatch.group(1)!); if (safe.isNotEmpty) return safe; } return null; }
  static String _sanitizeFileName(String value) { final normalized = value.trim().replaceAll(RegExp(r'[\\/:*?"<>|\x00-\x1F]'), '_'); final compact = normalized.replaceAll(RegExp(r'\s+'), ' '); return compact.isEmpty ? 'al-qahtani-media' : compact; }
  void close() => _client.close();
}

class _DownloadValue<T> { const _DownloadValue(this.value); final T value; }
class _DownloadCancelled { const _DownloadCancelled(); }
class DownloadException implements Exception { const DownloadException(this.code); final String code; @override String toString() => 'DownloadException($code)'; }
