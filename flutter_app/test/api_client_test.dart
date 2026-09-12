import 'dart:convert';

import 'package:al_qahtani/src/api_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

http.Response jsonResponse(Object value, [int statusCode = 200]) => http.Response.bytes(
      utf8.encode(jsonEncode(value)),
      statusCode,
      headers: const {'content-type': 'application/json; charset=utf-8'},
    );

void main() {
  test('resolvePlayback accepts only backend-issued opaque media path', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/cinema/details');
      expect(request.url.queryParameters['ref'], 'legacy:episode-1');
      return jsonResponse({
        'status': 'success',
        'movie_title': 'الحلقة 1',
        'episodes': const [],
        'media_path': '/api/cinema/media?id=opaque-short-lived',
        'media_type': 'm3u8',
      });
    });
    final api = AlQahtaniApi(client: client, baseUri: Uri.parse('https://runtime.example'));
    final resolved = await api.resolvePlayback('legacy:episode-1');
    expect(resolved.mediaPath, '/api/cinema/media?id=opaque-short-lived');
    expect(api.mediaUri(resolved.mediaPath).host, 'runtime.example');
  });

  test('match logos are routed through the Al-Qahtani runtime proxy', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/v1/matches');
      return jsonResponse({
        'status': 'success',
        'kind': 'matches',
        'data': [
          {
            'team1': {'name': 'الأول', 'logo': 'https://kooorracity.com/wp-content/uploads/team-a.png'},
            'team2': {'name': 'الثاني', 'logo': 'https://kooorracity.com/wp-content/uploads/team-b.png'},
            'time': '3:00 PM',
            'status': 'scheduled',
            'ref': 'opaque-match',
          }
        ],
      });
    });
    final api = AlQahtaniApi(client: client, baseUri: Uri.parse('https://runtime.example'));
    final item = (await api.matches()).single;
    final home = Uri.parse(item.homeLogo);
    final away = Uri.parse(item.awayLogo);
    expect(home.host, 'runtime.example');
    expect(home.path, '/api/matches/logo');
    expect(home.queryParameters['url'], 'https://kooorracity.com/wp-content/uploads/team-a.png');
    expect(away.path, '/api/matches/logo');
    expect(away.queryParameters['url'], 'https://kooorracity.com/wp-content/uploads/team-b.png');
  });

  test('catalog poster runtime paths are resolved against Al-Qahtani API', () async {
    final client = MockClient((request) async => jsonResponse({
          'status': 'success',
          'kind': 'search',
          'data': [
            {
              'id': 'work-1',
              'title': 'عمل تجريبي',
              'poster': '/api/cinema/media?id=opaque-poster',
              'type': 'series',
              'ref': 'legacy:opaque-work',
              'year': 2026,
            }
          ],
        }));
    final api = AlQahtaniApi(client: client, baseUri: Uri.parse('https://runtime.example'));
    final result = await api.search('عمل');
    expect(result.single.poster, 'https://runtime.example/api/cinema/media?id=opaque-poster');
    expect(result.single.year, 2026);
  });

  test('news stays behind Al-Qahtani runtime and maps opaque refs', () async {
    final client = MockClient((request) async {
      expect(request.url.host, 'runtime.example');
      if (request.url.path == '/api/v1/news') {
        return jsonResponse({
          'status': 'success',
          'version': '1.0.5',
          'kind': 'news',
          'data': [
            {'id': 'opaque-news-1', 'ref': 'opaque-news-1', 'title': 'خبر تجريبي', 'date': 'اليوم', 'description': 'وصف'},
          ],
        });
      }
      expect(request.url.path, '/api/v1/news/article');
      expect(request.url.queryParameters['ref'], 'opaque-news-1');
      return jsonResponse({
        'status': 'success',
        'version': '1.0.5',
        'kind': 'news-article',
        'data': {'ref': 'opaque-news-1', 'title': 'خبر تجريبي', 'date': 'اليوم', 'paragraphs': ['الفقرة الأولى']},
      });
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
    final client = MockClient((request) async => jsonResponse({
          'status': 'success',
          'movie_title': 'غير متاح',
          'episodes': const [],
          'playback_unavailable': true,
          'playback_reason': 'NO_PLAYABLE_MEDIA',
        }));
    final api = AlQahtaniApi(client: client, baseUri: Uri.parse('https://runtime.example'));
    await expectLater(
      api.resolvePlayback('legacy:unavailable'),
      throwsA(predicate((error) => error is ApiException && error.code == 'NO_PLAYABLE_MEDIA')),
    );
  });
}
