import 'package:al_qahtani/src/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('catalog runtime mapping keeps poster and opaque ref separate', () {
    final item = CatalogItem.fromJson({
      'id': 'demo', 'title': 'عمل تجريبي', 'poster': 'https://cdn.example/poster.jpg',
      'type': 'series', 'ref': 'opaque:demo', 'year': 2026,
    });
    expect(item.title, 'عمل تجريبي');
    expect(item.poster, contains('poster.jpg'));
    expect(item.year, 2026);
    expect(item.ref, 'opaque:demo');
  });

  test('episode mapping never uses internal id as the display number', () {
    final episode = EpisodeItem.fromJson({
      'episode_id': '89517', 'episode_number': 7, 'title': 'الحلقة السابعة',
      'ref': 'legacy:opaque-episode', 'watch_available': true,
    });
    expect(episode.id, '89517');
    expect(episode.number, 7);
    expect(episode.number.toString(), isNot(episode.id));
  });

  test('title details maps episodes and opaque direct media path', () {
    final details = TitleDetails.fromJson({
      'movie_title': 'عمل تجريبي', 'poster': 'https://cdn.example/poster.jpg',
      'episodes': [{'episode_id': '101847', 'episode_number': 1, 'link': 'legacy:episode-1'}],
      'media_path': '/api/cinema/media?id=opaque', 'media_type': 'm3u8',
    });
    expect(details.episodes.single.number, 1);
    expect(details.mediaPath, '/api/cinema/media?id=opaque');
  });

  test('match mapping preserves real score and opaque match reference', () {
    final match = MatchItem.fromJson({
      'id': 'm1', 'ref': 'match:opaque',
      'team1': {'name': 'راسينغ سانتاندير', 'goals': 2, 'logo': '/api/matches/logo?id=a'},
      'team2': {'name': 'ألافيس', 'goals': 1, 'logo': '/api/matches/logo?id=b'},
      'time': '03:00', 'status': 'ended',
    });
    expect(match.homeGoals, 2);
    expect(match.awayGoals, 1);
    expect(match.hasScore, isTrue);
    expect(match.ref, 'match:opaque');
  });

  test('missing score stays unknown instead of becoming false 0-0', () {
    final match = MatchItem.fromJson({
      'team1': {'name': 'فريق أ'}, 'team2': {'name': 'فريق ب'}, 'status': 'ended',
    });
    expect(match.homeGoals, isNull);
    expect(match.awayGoals, isNull);
    expect(match.hasScore, isFalse);
  });

  test('match playback accepts only opaque runtime media path shape', () {
    final playback = MatchPlayback.fromJson({
      'media_path': '/api/v1/matches/media?id=opaque', 'media_type': 'm3u8', 'server_name': 'السيرفر الرئيسي',
    });
    expect(playback.mediaPath, startsWith('/api/v1/matches/media?'));
    expect(playback.mediaType, 'm3u8');
  });
}
