import 'dart:convert';
import 'dart:io';

class M3uCacheEntry {
  const M3uCacheEntry({required this.key, required this.content, required this.savedAt, required this.expiresAt});

  final String key;
  final String content;
  final DateTime savedAt;
  final DateTime expiresAt;

  bool get isExpired => DateTime.now().toUtc().isAfter(expiresAt);
}

class M3uCacheEngine {
  const M3uCacheEngine(this.directoryProvider);

  final Future<Directory> Function() directoryProvider;

  Future<void> put(String key, String content, {Duration ttl = const Duration(hours: 6)}) async {
    final normalized = _normalizeKey(key);
    _validateM3u(content);
    final directory = await directoryProvider();
    await directory.create(recursive: true);
    final now = DateTime.now().toUtc();
    final payload = <String, Object>{
      'key': normalized,
      'content': content,
      'savedAt': now.toIso8601String(),
      'expiresAt': now.add(ttl).toIso8601String(),
    };
    final file = File('${directory.path}${Platform.pathSeparator}${_fileName(normalized)}');
    final temp = File('${file.path}.tmp');
    await temp.writeAsString(jsonEncode(payload), flush: true);
    if (await file.exists()) await file.delete();
    await temp.rename(file.path);
  }

  Future<M3uCacheEntry?> get(String key, {bool allowExpired = false}) async {
    final normalized = _normalizeKey(key);
    final directory = await directoryProvider();
    final file = File('${directory.path}${Platform.pathSeparator}${_fileName(normalized)}');
    if (!await file.exists()) return null;
    try {
      final decoded = jsonDecode(await file.readAsString());
      if (decoded is! Map<String, dynamic>) return null;
      final entry = M3uCacheEntry(
        key: decoded['key'] as String,
        content: decoded['content'] as String,
        savedAt: DateTime.parse(decoded['savedAt'] as String),
        expiresAt: DateTime.parse(decoded['expiresAt'] as String),
      );
      _validateM3u(entry.content);
      if (!allowExpired && entry.isExpired) return null;
      return entry;
    } catch (_) {
      return null;
    }
  }

  Future<String?> resolveForOffline(String key) async => (await get(key, allowExpired: true))?.content;

  Future<int> purgeExpired() async {
    final directory = await directoryProvider();
    if (!await directory.exists()) return 0;
    var removed = 0;
    await for (final entity in directory.list(followLinks: false)) {
      if (entity is! File || !entity.path.endsWith('.m3u-cache.json')) continue;
      try {
        final decoded = jsonDecode(await entity.readAsString()) as Map<String, dynamic>;
        final expiresAt = DateTime.parse(decoded['expiresAt'] as String);
        if (DateTime.now().toUtc().isAfter(expiresAt)) {
          await entity.delete();
          removed += 1;
        }
      } catch (_) {
        await entity.delete();
        removed += 1;
      }
    }
    return removed;
  }

  static void _validateM3u(String content) {
    if (!content.trimLeft().startsWith('#EXTM3U')) throw const M3uCacheException('INVALID_M3U');
  }

  static String _normalizeKey(String key) {
    final value = key.trim();
    if (value.isEmpty) throw const M3uCacheException('INVALID_CACHE_KEY');
    return value;
  }

  static String _fileName(String key) {
    var hash = 0x811c9dc5;
    for (final byte in utf8.encode(key)) {
      hash ^= byte;
      hash = (hash * 0x01000193) & 0xffffffff;
    }
    return '${hash.toRadixString(16)}.m3u-cache.json';
  }
}

class M3uCacheException implements Exception {
  const M3uCacheException(this.code);
  final String code;
  @override
  String toString() => 'M3uCacheException($code)';
}
