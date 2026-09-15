import 'dart:io';

import 'package:al_qahtani/src/download_resume_catalog.dart';
import 'package:al_qahtani/src/m3u_cache_engine.dart';
import 'package:al_qahtani/src/storage_quota_manager.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('M3U cache persists, serves offline content, and purges expired entries', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-m3u-cache-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });

    final engine = M3uCacheEngine(() async => root);
    const playlist = '#EXTM3U\n#EXTINF:-1,Channel 1\nhttps://example.test/live.m3u8';

    await engine.put('live-home', playlist, ttl: const Duration(microseconds: -1));
    expect(await engine.get('live-home'), isNull);
    expect(await engine.resolveForOffline('live-home'), playlist);
    expect(await engine.purgeExpired(), 1);
    expect(await engine.resolveForOffline('live-home'), isNull);
  });

  test('storage quota deletes oldest files first while protecting active files', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-quota-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });

    final oldFile = File('${root.path}${Platform.pathSeparator}old.bin');
    final newFile = File('${root.path}${Platform.pathSeparator}new.bin');
    final protected = File('${root.path}${Platform.pathSeparator}active.part');
    await oldFile.writeAsBytes(List<int>.filled(8, 1));
    await newFile.writeAsBytes(List<int>.filled(8, 2));
    await protected.writeAsBytes(List<int>.filled(8, 3));
    await oldFile.setLastModified(DateTime(2020));
    await newFile.setLastModified(DateTime(2021));
    await protected.setLastModified(DateTime(2019));

    final manager = StorageQuotaManager(
      directoryProvider: () async => root,
      policy: const StorageQuotaPolicy(maxBytes: 18),
    );

    final result = await manager.enforce(protectedPaths: <String>{protected.path});
    expect(result.beforeBytes, 24);
    expect(result.deletedPaths, <String>[oldFile.path]);
    expect(await oldFile.exists(), isFalse);
    expect(await newFile.exists(), isTrue);
    expect(await protected.exists(), isTrue);
    expect(result.afterBytes, 16);
  });

  test('resume catalog survives process boundaries by rediscovering partial files', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-resume-catalog-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });

    final partial = File('${root.path}${Platform.pathSeparator}.qahtani-series_1_episode_7.part');
    await partial.writeAsBytes(<int>[1, 2, 3, 4, 5]);

    final catalogAfterRestart = DownloadResumeCatalog(() async => root);
    final entries = await catalogAfterRestart.list();
    expect(entries, hasLength(1));
    expect(entries.single.bytes, 5);
    expect(entries.single.resumeKey, 'series 1 episode 7');
    expect(await catalogAfterRestart.discard(entries.single.path), isTrue);
    expect(await partial.exists(), isFalse);
  });
}
