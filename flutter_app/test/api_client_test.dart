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

  test('news stays behind Al-Qahtani runtime and maps opaque refs', () async {
    final client = MockClient((request) async {
      expect(request.url.host, 'runtime.example');
      if (request.url.path == '/api/v1/news') {
        return http.Response(
          jsonEncode({
            'status': 'success',
            'version': '1.0.1',
            'kind': 'news',
            'data': [
              {'id': 'opaque-news-1', 'ref': 'opaque-news-1', 'title': 'خبر تجريبي', 'date': 'اليوم', 'description': 'وصف'},
            ],
          }),
          200,
        );
      }
      expect(request.url.path, '/api/v1/news/article');
      expect(request.url.queryParameters['ref'], 'opaque-news-1');
      return http.Response(
        jsonEncode({
          'status': 'success',
          'version': '1.0.1',
          'kind': 'news-article',
          'data': {'ref': 'opaque-news-1', 'title': 'خبر تجريبي', 'date': 'اليوم', 'paragraphs': ['الفقرة الأولى']},
        }),
        200,
      );
    });
    final api = AlQahtaniApi(client: client, baseUri: Uri.parse('https://runtime.example'));
    final items = await api.news();
    expect(items.single.ref, 'opaque-news-1');
    final article = await api.newsArticle(items.single.ref);
    expect(article.paragraphs, ['الفقرة الأولى']);
    expect(article.ref, isNot(contains('http')));
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
