import 'dart:io';

abstract interface class FileExportBridge {
  Future<ExportedFile> export({required File source, required String suggestedName});
}

class ExportedFile {
  const ExportedFile({required this.uri, required this.bytes});
  final Uri uri;
  final int bytes;
}

class DownloadFileExporter {
  const DownloadFileExporter(this.bridge);
  final FileExportBridge bridge;

  Future<ExportedFile> exportPath(String path, {String? suggestedName}) async {
    final file = File(path);
    if (!await file.exists()) throw const FileExportException('SOURCE_NOT_FOUND');
    final stat = await file.stat();
    if (stat.type != FileSystemEntityType.file || stat.size <= 0) {
      throw const FileExportException('SOURCE_INVALID');
    }
    final name = _sanitize(suggestedName ?? _baseName(path));
    if (name.isEmpty) throw const FileExportException('INVALID_EXPORT_NAME');
    return bridge.export(source: file, suggestedName: name);
  }

  static String _baseName(String path) {
    final normalized = path.replaceAll('\\', '/');
    return normalized.substring(normalized.lastIndexOf('/') + 1);
  }

  static String _sanitize(String value) {
    return value.trim().replaceAll(RegExp(r'[\\/:*?"<>|\x00-\x1F]'), '_');
  }
}

class FileExportException implements Exception {
  const FileExportException(this.code);
  final String code;
  @override
  String toString() => 'FileExportException($code)';
}
