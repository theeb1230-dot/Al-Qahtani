import 'dart:io';

import 'package:al_qahtani/src/download_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

void main() {
  test('rejects explicit HTML responses before marking download complete', () async {
    final root = await Directory.systemTemp.createTemp('qahtani-html-response-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final service = DownloadService(
      client: _SingleResponseClient(
        body: '<html><body>Forbidden</body></html>'.codeUnits,
        contentType: 'text/html; charset=utf-8',
        filename: 'episode.mp4',
      ),
      directoryProvider: () async => root,
    );
    addTearDown(service.close);

    await expectLater(
      service.download(
        Uri.parse('https://example.invalid/api/cinema/media?id=x&download=1'),
        fallbackName: 'Episode',
      ),
      throwsA(isA<DownloadException>().having((e) => e.code, 'code', 'INVALID_MEDIA_RESPONSE')),
    );
    expect(await root.list().toList(), isEmpty);
  });

  test('rejects HTML payload disguised as octet-stream and deletes final file', () async {
    final root = await Directory.systemTemp.createTemp('qahtani-disguised-html-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final body = List<int>.filled(1024, 0x20)
      ..setRange(0, 21, '<html>Access denied</html>'.codeUnits.take(21));
    final service = DownloadService(
      client: _SingleResponseClient(
        body: body,
        contentType: 'application/octet-stream',
        filename: 'episode.mp4',
      ),
      directoryProvider: () async => root,
    );
    addTearDown(service.close);

    await expectLater(
      service.download(
        Uri.parse('https://example.invalid/api/cinema/media?id=x&download=1'),
        fallbackName: 'Episode',
      ),
      throwsA(isA<DownloadException>().having((e) => e.code, 'code', 'INVALID_MEDIA_FILE')),
    );
    expect(await File('${root.path}${Platform.pathSeparator}episode.mp4').exists(), isFalse);
  });

  test('accepts MP4 signature and exposes only validated files in library', () async {
    final root = await Directory.systemTemp.createTemp('qahtani-mp4-signature-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final body = <int>[0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D, ...List<int>.filled(128, 1)];
    final service = DownloadService(
      client: _SingleResponseClient(
        body: body,
        contentType: 'application/octet-stream',
        filename: 'episode.mp4',
      ),
      directoryProvider: () async => root,
    );
    addTearDown(service.close);

    final result = await service.download(
      Uri.parse('https://example.invalid/api/cinema/media?id=x&download=1'),
      fallbackName: 'Episode',
    );
    expect(result.bytes, body.length);
    final items = await service.listDownloads();
    expect(items, hasLength(1));
    expect(items.single.name, 'episode.mp4');
  });

  test('re-resolves stale iOS absolute path by safe basename in current container', () async {
    final root = await Directory.systemTemp.createTemp('qahtani-path-reresolve-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final file = File('${root.path}${Platform.pathSeparator}episode.mp4');
    await file.writeAsBytes(<int>[0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D]);
    final service = DownloadService(directoryProvider: () async => root);
    addTearDown(service.close);

    final resolved = await service.resolveStoredReference(
      '/private/var/mobile/Containers/Data/Application/OLD-CONTAINER/Documents/AlQahtani/Downloads/episode.mp4',
    );
    expect(resolved?.path, file.path);
  });

  test('library hides unreadable or non-media completed-looking files', () async {
    final root = await Directory.systemTemp.createTemp('qahtani-invalid-library-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    await File('${root.path}${Platform.pathSeparator}fake.mp4')
        .writeAsString('<html><body>Access denied</body></html>');
    final service = DownloadService(directoryProvider: () async => root);
    addTearDown(service.close);

    expect(await service.listDownloads(), isEmpty);
    expect(await service.verifiedDownload('fake.mp4'), isNull);
  });
}

class _SingleResponseClient extends http.BaseClient {
  _SingleResponseClient({
    required this.body,
    required this.contentType,
    required this.filename,
  });

  final List<int> body;
  final String contentType;
  final String filename;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    return http.StreamedResponse(
      Stream<List<int>>.value(body),
      200,
      request: request,
      contentLength: body.length,
      headers: {
        'content-type': contentType,
        'content-length': '${body.length}',
        'content-disposition': 'attachment; filename="$filename"',
      },
    );
  }
}
