import 'dart:convert';

import 'package:al_qahtani/src/api_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  test('resolvePlayback accepts only backend-issued opaque media path', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/cinema/details');
      expect(request.url.queryParameters['ref'], 'legacy:episode-1');
      return http.Response(
        jsonEncode({
          'status': 'success',
          'movie_title': 'الحلقة 1',
          'episodes': const [],
          'media_path': '/api/cinema/media?id=opaque-short-lived',
          'media_type': 'm3u8',
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    final api = AlQahtaniApi(client: client, baseUri: Uri.parse('https://runtime.example'));
    final resolved = await api.resolvePlayback('legacy:episode-1');
    expect(resolved.mediaPath, '/api/cinema/media?id=opaque-short-lived');
    expect(api.mediaUri(resolved.mediaPath).host, 'runtime.example');
  });

  test('mediaUri rejects arbitrary upstream urls', () {
    final api = AlQahtaniApi(baseUri: Uri.parse('https://runtime.example'));
    expect(
      () => api.mediaUri('https://evil.example/video.mp4'),
      throwsA(isA<ApiException>()),
    );
    api.close();
  });

  test('resolvePlayback fails closed when details contain no playable media', () async {
    final client = MockClient((request) async => http.Response(
          jsonEncode({
            'status': 'success',
            'movie_title': 'غير متاح',
            'episodes': const [],
            'playback_unavailable': true,
            'playback_reason': 'NO_PLAYABLE_MEDIA',
          }),
          200,
          headers: {'content-type': 'application/json'},
        ));
    final api = AlQahtaniApi(client: client, baseUri: Uri.parse('https://runtime.example'));
    await expectLater(
      api.resolvePlayback('legacy:unavailable'),
      throwsA(predicate((error) => error is ApiException && error.code == 'NO_PLAYABLE_MEDIA')),
    );
  });
}
