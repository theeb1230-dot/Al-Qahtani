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
    final file = File('${temp.path}${Platform.pathSeparator}Spider Man Brand New Day.mp4');
    await file.writeAsBytes(List<int>.filled(64, 3));
    DownloadedFileInfo? opened;

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: DownloadLibrarySection(
          service: service,
          onOpen: (item) async => opened = item,
        ),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.textContaining('Spider Man Brand New Day'), findsOneWidget);
    await tester.tap(find.textContaining('Spider Man Brand New Day'));
    await tester.pumpAndSettle();

    expect(opened, isNotNull);
    expect(opened!.path, file.path);
    expect(opened!.bytes, 64);
  });

  testWidgets('missing file is removed from visible completed list instead of opening', (tester) async {
    final file = File('${temp.path}${Platform.pathSeparator}gone.mp4');
    await file.writeAsBytes(List<int>.filled(32, 1));
    var opened = false;

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: DownloadLibrarySection(
          service: service,
          onOpen: (_) async => opened = true,
        ),
      ),
    ));
    await tester.pumpAndSettle();
    expect(find.text('gone.mp4'), findsOneWidget);

    await file.delete();
    await tester.tap(find.text('gone.mp4'));
    await tester.pumpAndSettle();

    expect(opened, isFalse);
    expect(find.text('gone.mp4'), findsNothing);
    expect(find.textContaining('الملف المحمّل غير موجود'), findsOneWidget);
  });
}
