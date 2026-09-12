import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class DownloadResult {
  const DownloadResult({required this.path, required this.bytes});

  final String path;
  final int bytes;
}

typedef DownloadDirectoryProvider = Future<Directory> Function();

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

  Future<DownloadResult> download(Uri uri, {String fallbackName = 'al-qahtani-media'}) async {
    if (uri.path != '/api/cinema/media' || uri.queryParameters['download'] != '1') {
      throw const DownloadException('INVALID_DOWNLOAD_REFERENCE');
    }

    final request = http.Request('GET', uri)..headers['accept'] = '*/*';
    final response = await _client.send(request).timeout(const Duration(seconds: 30));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw DownloadException('HTTP_${response.statusCode}');
    }

    final directory = await _directoryProvider();
    await directory.create(recursive: true);
    final fileName = _trustedFileName(response.headers['content-disposition']) ?? _sanitizeFileName(fallbackName);
    final finalFile = File('${directory.path}${Platform.pathSeparator}$fileName');
    final tempFile = File('${finalFile.path}.part');

    var bytes = 0;
    try {
      final sink = tempFile.openWrite(mode: FileMode.writeOnly);
      await for (final chunk in response.stream) {
        bytes += chunk.length;
        sink.add(chunk);
      }
      await sink.close();
      if (bytes == 0) throw const DownloadException('EMPTY_DOWNLOAD');
      if (await finalFile.exists()) await finalFile.delete();
      await tempFile.rename(finalFile.path);
      return DownloadResult(path: finalFile.path, bytes: bytes);
    } catch (_) {
      if (await tempFile.exists()) await tempFile.delete();
      rethrow;
    }
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
