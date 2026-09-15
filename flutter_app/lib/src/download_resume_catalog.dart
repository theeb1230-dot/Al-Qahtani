import 'dart:io';

class ResumeCandidate {
  const ResumeCandidate({required this.path, required this.resumeKey, required this.bytes, required this.modifiedAt});

  final String path;
  final String resumeKey;
  final int bytes;
  final DateTime modifiedAt;
}

class DownloadResumeCatalog {
  const DownloadResumeCatalog(this.directoryProvider);

  final Future<Directory> Function() directoryProvider;

  Future<List<ResumeCandidate>> list() async {
    final directory = await directoryProvider();
    if (!await directory.exists()) return const <ResumeCandidate>[];
    final result = <ResumeCandidate>[];
    await for (final entity in directory.list(followLinks: false)) {
      if (entity is! File) continue;
      final name = _baseName(entity.path);
      if (!name.startsWith('.qahtani-') || !name.endsWith('.part')) continue;
      final stat = await entity.stat();
      if (stat.type != FileSystemEntityType.file || stat.size <= 0) continue;
      final encodedKey = name.substring('.qahtani-'.length, name.length - '.part'.length);
      result.add(ResumeCandidate(
        path: entity.path,
        resumeKey: encodedKey.replaceAll('_', ' '),
        bytes: stat.size,
        modifiedAt: stat.modified,
      ));
    }
    result.sort((a, b) => b.modifiedAt.compareTo(a.modifiedAt));
    return List.unmodifiable(result);
  }

  Future<bool> discard(String path) async {
    final directory = await directoryProvider();
    final normalizedRoot = directory.absolute.path;
    final file = File(path);
    final absolute = file.absolute.path;
    if (!absolute.startsWith('$normalizedRoot${Platform.pathSeparator}')) {
      throw const ResumeCatalogException('OUTSIDE_DOWNLOAD_DIRECTORY');
    }
    final name = _baseName(absolute);
    if (!name.startsWith('.qahtani-') || !name.endsWith('.part')) {
      throw const ResumeCatalogException('INVALID_PARTIAL_FILE');
    }
    if (!await file.exists()) return false;
    await file.delete();
    return true;
  }

  static String _baseName(String path) {
    final normalized = path.replaceAll('\\', '/');
    return normalized.substring(normalized.lastIndexOf('/') + 1);
  }
}

class ResumeCatalogException implements Exception {
  const ResumeCatalogException(this.code);
  final String code;
  @override
  String toString() => 'ResumeCatalogException($code)';
}
