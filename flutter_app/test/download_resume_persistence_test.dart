import 'dart:io';

import 'package:al_qahtani/src/download_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

const _validMp4Bytes = <int>[
  0x00, 0x00, 0x00, 0x18,
  0x66, 0x74, 0x79, 0x70,
  0x69, 0x73, 0x6f, 0x6d,
  0x00, 0x00, 0x00, 0x00,
  0x69, 0x73, 0x6f, 0x6d,
  0x6d, 0x70, 0x34, 0x32,
];

void main() {
  test('pre-existing partial resumes from the exact byte on a later attempt', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-persistent-resume-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });

    final splitAt = 12;
    final partial = File('${root.path}${Platform.pathSeparator}.qahtani-series_ref_episode_5.part');
    await partial.writeAsBytes(_validMp4Bytes.sublist(0, splitAt));

    final client = _LaterAttemptClient(splitAt: splitAt);
    final service = DownloadService(client: client, directoryProvider: () async => root);
    addTearDown(service.close);

    final result = await service.download(
      Uri.parse('https://al-qahtani-api.onrender.com/api/cinema/media?id=fresh-opaque&download=1'),
      fallbackName: 'Episode 5',
      resumeKey: 'series/ref:episode:5',
    );

    expect(client.rangeHeader, 'bytes=$splitAt-');
    expect(result.bytes, _validMp4Bytes.length);
    expect(result.path, endsWith('episode-5.mp4'));
    expect(await File(result.path).readAsBytes(), _validMp4Bytes);
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
  _LaterAttemptClient({required this.splitAt});

  final int splitAt;
  String? rangeHeader;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    rangeHeader = request.headers['range'];
    final tail = _validMp4Bytes.sublist(splitAt);
    return http.StreamedResponse(
      Stream.value(tail),
      206,
      request: request,
      contentLength: tail.length,
      headers: {
        'content-range': 'bytes $splitAt-${_validMp4Bytes.length - 1}/${_validMp4Bytes.length}',
        'content-length': '${tail.length}',
        'content-disposition': 'attachment; filename="episode-5.mp4"',
        'accept-ranges': 'bytes',
        'content-type': 'video/mp4',
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
