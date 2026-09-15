import 'dart:io';

class StorageQuotaPolicy {
  const StorageQuotaPolicy({required this.maxBytes, this.reserveBytes = 0})
      : assert(maxBytes >= 0),
        assert(reserveBytes >= 0),
        assert(reserveBytes <= maxBytes);

  final int maxBytes;
  final int reserveBytes;

  int get usableBytes => maxBytes - reserveBytes;
}

class StorageCleanupResult {
  const StorageCleanupResult({required this.beforeBytes, required this.afterBytes, required this.deletedPaths});

  final int beforeBytes;
  final int afterBytes;
  final List<String> deletedPaths;
}

class StorageQuotaManager {
  const StorageQuotaManager({required this.directoryProvider, required this.policy});

  final Future<Directory> Function() directoryProvider;
  final StorageQuotaPolicy policy;

  Future<int> usedBytes() async {
    final directory = await directoryProvider();
    if (!await directory.exists()) return 0;
    var total = 0;
    await for (final entity in directory.list(followLinks: false)) {
      if (entity is! File) continue;
      final stat = await entity.stat();
      if (stat.type == FileSystemEntityType.file) total += stat.size;
    }
    return total;
  }

  Future<StorageCleanupResult> enforce({Set<String> protectedPaths = const <String>{}}) async {
    final directory = await directoryProvider();
    if (!await directory.exists()) {
      return const StorageCleanupResult(beforeBytes: 0, afterBytes: 0, deletedPaths: <String>[]);
    }
    final files = <FileStatEntry>[];
    await for (final entity in directory.list(followLinks: false)) {
      if (entity is! File || protectedPaths.contains(entity.path)) continue;
      final stat = await entity.stat();
      if (stat.type != FileSystemEntityType.file) continue;
      files.add(FileStatEntry(path: entity.path, bytes: stat.size, modifiedAt: stat.modified));
    }
    var total = await usedBytes();
    final before = total;
    if (total <= policy.usableBytes) {
      return StorageCleanupResult(beforeBytes: before, afterBytes: total, deletedPaths: const <String>[]);
    }
    files.sort((a, b) => a.modifiedAt.compareTo(b.modifiedAt));
    final deleted = <String>[];
    for (final entry in files) {
      if (total <= policy.usableBytes) break;
      final file = File(entry.path);
      if (!await file.exists()) continue;
      await file.delete();
      total -= entry.bytes;
      deleted.add(entry.path);
    }
    return StorageCleanupResult(beforeBytes: before, afterBytes: total, deletedPaths: List.unmodifiable(deleted));
  }
}

class FileStatEntry {
  const FileStatEntry({required this.path, required this.bytes, required this.modifiedAt});
  final String path;
  final int bytes;
  final DateTime modifiedAt;
}
