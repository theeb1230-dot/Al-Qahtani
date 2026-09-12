import 'dart:io';

import 'package:al_qahtani/src/download_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

void main() {
  test('pre-existing partial resumes from the exact byte on a later attempt', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-persistent-resume-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });

    final partial = File('${root.path}${Platform.pathSeparator}.qahtani-series_ref_episode_5.part');
    await partial.writeAsBytes(<int>[1, 2, 3, 4, 5]);

    final client = _LaterAttemptClient();
    final service = DownloadService(client: client, directoryProvider: () async => root);
    addTearDown(service.close);

    final result = await service.download(
      Uri.parse('https://al-qahtani-api.onrender.com/api/cinema/media?id=fresh-opaque&download=1'),
      fallbackName: 'Episode 5',
      resumeKey: 'series/ref:episode:5',
    );

    expect(client.rangeHeader, 'bytes=5-');
    expect(result.bytes, 10);
    expect(result.path, endsWith('episode-5.mp4'));
    expect(await File(result.path).readAsBytes(), <int>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(await partial.exists(), isFalse);
  });

  test('invalid resume range deletes the stale partial instead of corrupting output', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-invalid-resume-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });

    final partial = File('${root.path}${Platform.pathSeparator}.qahtani-series_ref_episode_5.part');
    await partial.writeAsBytes(<int>[1, 2, 3, 4, 5]);

    final service = DownloadService(
      client: _InvalidRangeClient(),
      directoryProvider: () async => root,
    );
    addTearDown(service.close);

    await expectLater(
      service.download(
        Uri.parse('https://al-qahtani-api.onrender.com/api/cinema/media?id=fresh-opaque&download=1'),
        fallbackName: 'Episode 5',
        resumeKey: 'series/ref:episode:5',
      ),
      throwsA(isA<DownloadException>().having((e) => e.code, 'code', 'INVALID_RESUME_RANGE')),
    );

    expect(await partial.exists(), isFalse);
  });
}

class _LaterAttemptClient extends http.BaseClient {
  String? rangeHeader;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    rangeHeader = request.headers['range'];
    return http.StreamedResponse(
      Stream.value(<int>[6, 7, 8, 9, 10]),
      206,
      request: request,
      contentLength: 5,
      headers: const {
        'content-range': 'bytes 5-9/10',
        'content-length': '5',
        'content-disposition': 'attachment; filename="episode-5.mp4"',
        'accept-ranges': 'bytes',
      },
    );
  }
}

class _InvalidRangeClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    return http.StreamedResponse(
      Stream.value(<int>[6, 7, 8, 9, 10]),
      206,
      request: request,
      contentLength: 5,
      headers: const {
        'content-range': 'bytes 6-10/11',
        'content-length': '5',
        'content-disposition': 'attachment; filename="episode-5.mp4"',
        'accept-ranges': 'bytes',
      },
    );
  }
}
