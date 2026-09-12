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
  const DownloadedFileInfo({
    required this.name,
    required this.bytes,
    required this.modifiedAt,
  });

  final String name;
  final int bytes;
  final DateTime modifiedAt;
}

typedef DownloadDirectoryProvider = Future<Directory> Function();
typedef DownloadProgressCallback = void Function(DownloadProgress progress);

class DownloadService {
  DownloadService({http.Client? client, DownloadDirectoryProvider? directoryProvider})
      : _client = client ?? http.Client(),
        _directoryProvider = directoryProvider ?? _defaultDirectory;

  final http.Client _client;
  final DownloadDirectoryProvider _directoryProvider;

  static Future<Directory> _defaultDirectory() async {
    final root = await getApplicationDocumentsDirectory();
    return Directory('${root.path}${Platform.pathSeparator}AlQahtani${Platform.pathSeparator}Downloads');
  }

  Future<DownloadResult> download(
    Uri uri, {
    String fallbackName = 'al-qahtani-media',
    DownloadProgressCallback? onProgress,
  }) async {
    if (uri.path != '/api/cinema/media' || uri.queryParameters['download'] != '1') {
      throw const DownloadException('INVALID_DOWNLOAD_REFERENCE');
    }

    final request = http.Request('GET', uri)..headers['accept'] = '*/*';
    final response = await _client.send(request).timeout(const Duration(seconds: 30));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw DownloadException('HTTP_${response.statusCode}');
    }

    final total = _responseLength(response.headers);
    final directory = await _downloadDirectory(create: true);
    final fileName = _trustedFileName(response.headers['content-disposition']) ?? _sanitizeFileName(fallbackName);
    final finalFile = File('${directory.path}${Platform.pathSeparator}$fileName');
    final tempFile = File('${finalFile.path}.part');

    var bytes = 0;
    IOSink? sink;
    try {
      sink = tempFile.openWrite(mode: FileMode.writeOnly);
      onProgress?.call(DownloadProgress(receivedBytes: 0, totalBytes: total));
      final stream = response.stream.timeout(
        const Duration(seconds: 30),
        onTimeout: (eventSink) => eventSink.addError(const DownloadException('DOWNLOAD_STALLED')),
      );
      await for (final chunk in stream) {
        bytes += chunk.length;
        sink.add(chunk);
        onProgress?.call(DownloadProgress(receivedBytes: bytes, totalBytes: total));
      }
      await sink.flush();
      await sink.close();
      sink = null;
      if (bytes == 0) throw const DownloadException('EMPTY_DOWNLOAD');
      if (total != null && bytes < total) throw const DownloadException('INCOMPLETE_DOWNLOAD');
      if (await finalFile.exists()) await finalFile.delete();
      await tempFile.rename(finalFile.path);
      return DownloadResult(path: finalFile.path, bytes: bytes);
    } catch (_) {
      try {
        await sink?.close();
      } catch (_) {}
      if (await tempFile.exists()) await tempFile.delete();
      rethrow;
    }
  }

  static int? _responseLength(Map<String, String> headers) {
    final direct = int.tryParse(headers['content-length'] ?? '');
    if (direct != null && direct > 0) return direct;
    final range = headers['content-range'];
    if (range != null) {
      final match = RegExp(r'/([0-9]+)$').firstMatch(range.trim());
      final value = match == null ? null : int.tryParse(match.group(1)!);
      if (value != null && value > 0) return value;
    }
    return null;
  }

  Future<List<DownloadedFileInfo>> listDownloads() async {
    final directory = await _downloadDirectory(create: false);
    if (!await directory.exists()) return const [];

    final items = <DownloadedFileInfo>[];
    await for (final entity in directory.list(followLinks: false)) {
      if (entity is! File || entity.path.endsWith('.part')) continue;
      final stat = await entity.stat();
      if (stat.type != FileSystemEntityType.file || stat.size <= 0) continue;
      items.add(DownloadedFileInfo(
        name: _baseName(entity.path),
        bytes: stat.size,
        modifiedAt: stat.modified,
      ));
    }
    items.sort((a, b) => b.modifiedAt.compareTo(a.modifiedAt));
    return List.unmodifiable(items);
  }

  Future<bool> deleteDownload(String name) async {
    if (!_isSafeStoredName(name)) throw const DownloadException('INVALID_STORED_FILENAME');
    final directory = await _downloadDirectory(create: false);
    if (!await directory.exists()) return false;
    final file = File('${directory.path}${Platform.pathSeparator}$name');
    if (!await file.exists()) return false;
    await file.delete();
    return true;
  }

  Future<Directory> _downloadDirectory({required bool create}) async {
    final directory = await _directoryProvider();
    if (create) await directory.create(recursive: true);
    return directory;
  }

  static bool _isSafeStoredName(String value) {
    if (value.isEmpty || value == '.' || value == '..') return false;
    if (value.contains('/') || value.contains('\\')) return false;
    return _sanitizeFileName(value) == value && !value.endsWith('.part');
  }

  static String _baseName(String path) {
    final normalized = path.replaceAll('\\', '/');
    return normalized.substring(normalized.lastIndexOf('/') + 1);
  }

  static String? _trustedFileName(String? disposition) {
    if (disposition == null || disposition.isEmpty) return null;
    final utf8Match = RegExp("filename\\*=UTF-8''([^;]+)", caseSensitive: false).firstMatch(disposition);
    if (utf8Match != null) {
      final decoded = Uri.decodeComponent(utf8Match.group(1)!);
      final safe = _sanitizeFileName(decoded);
      if (safe.isNotEmpty) return safe;
    }
    final plainMatch = RegExp('filename="?([^";]+)"?', caseSensitive: false).firstMatch(disposition);
    if (plainMatch != null) {
      final safe = _sanitizeFileName(plainMatch.group(1)!);
      if (safe.isNotEmpty) return safe;
    }
    return null;
  }

  static String _sanitizeFileName(String value) {
    final normalized = value.trim().replaceAll(RegExp(r'[\\/:*?"<>|\x00-\x1F]'), '_');
    final compact = normalized.replaceAll(RegExp(r'\s+'), ' ');
    return compact.isEmpty ? 'al-qahtani-media' : compact;
  }

  void close() => _client.close();
}

class DownloadException implements Exception {
  const DownloadException(this.code);
  final String code;
  @override
  String toString() => 'DownloadException($code)';
}
