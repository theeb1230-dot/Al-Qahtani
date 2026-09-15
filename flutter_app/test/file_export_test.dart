import 'dart:io';

import 'package:al_qahtani/src/file_export.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('export abstraction validates local file and delegates safe suggested name', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-export-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final source = File('${root.path}${Platform.pathSeparator}movie.mp4');
    await source.writeAsBytes(<int>[1, 2, 3, 4]);

    final bridge = _FakeExportBridge();
    final exporter = DownloadFileExporter(bridge);
    final result = await exporter.exportPath(source.path, suggestedName: 'Movie: 1?.mp4');

    expect(bridge.suggestedName, 'Movie_ 1_.mp4');
    expect(result.bytes, 4);
    expect(result.uri.scheme, 'file');
  });

  test('export abstraction rejects missing source', () async {
    final exporter = DownloadFileExporter(_FakeExportBridge());
    await expectLater(
      exporter.exportPath('/definitely/missing/file.mp4'),
      throwsA(isA<FileExportException>().having((e) => e.code, 'code', 'SOURCE_NOT_FOUND')),
    );
  });
}

class _FakeExportBridge implements FileExportBridge {
  String? suggestedName;

  @override
  Future<ExportedFile> export({required File source, required String suggestedName}) async {
    this.suggestedName = suggestedName;
    return ExportedFile(uri: source.uri, bytes: await source.length());
  }
}
