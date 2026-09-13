import 'dart:io';

import 'package:al_qahtani/src/download_library_section.dart';
import 'package:al_qahtani/src/download_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late Directory temp;
  late DownloadService service;

  setUp(() async {
    temp = await Directory.systemTemp.createTemp('qahtani-download-library-');
    service = DownloadService(directoryProvider: () async => temp);
  });

  tearDown(() async {
    service.close();
    if (await temp.exists()) await temp.delete(recursive: true);
  });

  test('listDownloads returns stable verified local path', () async {
    final file = File('${temp.path}${Platform.pathSeparator}movie.mp4');
    await file.writeAsBytes(List<int>.filled(16, 7));

    final items = await service.listDownloads();
    expect(items, hasLength(1));
    expect(items.single.name, 'movie.mp4');
    expect(items.single.path, file.path);
    expect(items.single.bytes, 16);
    expect((await service.verifiedDownload('movie.mp4'))?.path, file.path);
  });

  testWidgets('tap on completed download invokes local open path', (tester) async {
    final item = DownloadedFileInfo(
      name: 'Spider Man Brand New Day.mp4',
      path: '/private/app/Downloads/Spider Man Brand New Day.mp4',
      bytes: 64,
      modifiedAt: DateTime(2026, 9, 13),
    );
    final fake = _FakeDownloadService(item: item);
    DownloadedFileInfo? opened;

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: DownloadLibrarySection(
          service: fake,
          onOpen: (value) async { opened = value; },
        ),
      ),
    ));
    await tester.pump();
    await tester.pump();

    expect(find.textContaining('Spider Man Brand New Day'), findsOneWidget);
    await tester.tap(find.textContaining('Spider Man Brand New Day'));
    await tester.pump();

    expect(opened, isNotNull);
    expect(opened!.path, item.path);
    expect(opened!.bytes, 64);
    fake.close();
  });

  testWidgets('missing file is removed from visible completed list instead of opening', (tester) async {
    final item = DownloadedFileInfo(
      name: 'gone.mp4',
      path: '/private/app/Downloads/gone.mp4',
      bytes: 32,
      modifiedAt: DateTime(2026, 9, 13),
    );
    final fake = _FakeDownloadService(item: item, missing: true);
    var opened = false;

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: DownloadLibrarySection(
          service: fake,
          onOpen: (_) async { opened = true; },
        ),
      ),
    ));
    await tester.pump();
    await tester.pump();
    expect(find.text('gone.mp4'), findsOneWidget);

    await tester.tap(find.text('gone.mp4'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 350));

    expect(opened, isFalse);
    expect(find.text('gone.mp4'), findsNothing);
    expect(find.textContaining('الملف المحمّل غير موجود'), findsOneWidget);
    fake.close();
  });
}

class _FakeDownloadService extends DownloadService {
  _FakeDownloadService({required this.item, this.missing = false});

  final DownloadedFileInfo item;
  final bool missing;
  bool _missingObserved = false;

  @override
  Future<List<DownloadedFileInfo>> listDownloads() async {
    if (_missingObserved) return const [];
    return [item];
  }

  @override
  Future<File?> verifiedDownload(String name) async {
    if (missing) {
      _missingObserved = true;
      return null;
    }
    return File(item.path);
  }

  @override
  Future<bool> deleteDownload(String name) async => true;
}
