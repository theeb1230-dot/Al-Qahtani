import 'package:al_qahtani/src/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('catalog runtime mapping keeps poster year and opaque ref', () {
    final item = CatalogItem.fromJson({
      'id': 'demo',
      'title': 'عمل تجريبي',
      'poster': 'https://cdn.example/poster.jpg',
      'type': 'series',
      'year': 2026,
      'ref': 'opaque:demo',
    });
    expect(item.title, 'عمل تجريبي');
    expect(item.poster, 'https://cdn.example/poster.jpg');
    expect(item.year, 2026);
    expect(item.type, 'series');
    expect(item.ref, 'opaque:demo');
  });

  test('catalog poster accepts worker img alias', () {
    final item = CatalogItem.fromJson({
      'title': 'نتيجة بحث',
      'img': 'https://cdn.example/search.jpg',
      'type': 'movie',
      'ref': 'opaque:search',
    });
    expect(item.poster, 'https://cdn.example/search.jpg');
  });

  test('episode mapping never uses internal id as the display number', () {
    final episode = EpisodeItem.fromJson({
      'episode_id': '89517',
      'episode_number': 7,
      'title': 'الحلقة السابعة',
      'ref': 'legacy:opaque-episode',
      'watch_available': true,
    });
    expect(episode.id, '89517');
    expect(episode.number, 7);
    expect(episode.number.toString(), isNot(episode.id));
    expect(episode.ref, 'legacy:opaque-episode');
  });

  test('title details maps episodes and opaque direct media path', () {
    final details = TitleDetails.fromJson({
      'movie_title': 'عمل تجريبي',
      'poster': 'https://cdn.example/poster.jpg',
      'episodes': [
        {'episode_id': '101847', 'episode_number': 1, 'link': 'legacy:episode-1'}
      ],
      'media_path': '/api/cinema/media?id=opaque',
      'media_type': 'm3u8',
    });
    expect(details.title, 'عمل تجريبي');
    expect(details.episodes.single.number, 1);
    expect(details.episodes.single.id, '101847');
    expect(details.mediaPath, '/api/cinema/media?id=opaque');
  });

  test('match runtime maps real score, logos and opaque ref', () {
    final match = MatchItem.fromJson({
      'team1': {'name': 'راسينج سانتاندير', 'logo': 'https://cdn.example/racing.png', 'goals': 2},
      'team2': {'name': 'ألافيس', 'logo': 'https://cdn.example/alaves.png', 'goals': 1},
      'time': '03:00',
      'status': 'ended',
      'ref': 'match:opaque',
    });
    expect(match.home, 'راسينج سانتاندير');
    expect(match.away, 'ألافيس');
    expect(match.homeGoals, 2);
    expect(match.awayGoals, 1);
    expect(match.hasScore, true);
    expect(match.homeLogo, contains('racing.png'));
    expect(match.ref, 'match:opaque');
  });

  test('authoritative top-level match score wins over nested placeholders in Flutter', () {
    final match = MatchItem.fromJson({
      'team1': {'name': 'راسينج سانتاندير', 'goals': 0},
      'team2': {'name': 'ألافيس', 'goals': 0},
      'home_score': 2,
      'away_score': 1,
      'status': 'ended',
      'ref': 'match:authoritative',
    });
    expect(match.homeGoals, 2);
    expect(match.awayGoals, 1);
    expect(match.hasScore, true);
  });

  test('explicit authoritative 0-0 remains a legitimate ended result in Flutter', () {
    final match = MatchItem.fromJson({
      'team1': {'name': 'فريق أ', 'goals': 7},
      'team2': {'name': 'فريق ب', 'goals': 4},
      'home_score': 0,
      'away_score': 0,
      'status': 'ended',
      'ref': 'match:draw',
    });
    expect(match.homeGoals, 0);
    expect(match.awayGoals, 0);
    expect(match.hasScore, true);
  });

  test('ended nested-only 0-0 placeholder stays unknown in Flutter', () {
    final match = MatchItem.fromJson({
      'team1': {'name': 'فريق أ', 'goals': 0},
      'team2': {'name': 'فريق ب', 'goals': 0},
      'status': 'ended',
      'ref': 'match:placeholder',
    });
    expect(match.homeGoals, isNull);
    expect(match.awayGoals, isNull);
    expect(match.hasScore, false);
  });

  test('live authoritative score stays mutable and non-zero in Flutter', () {
    final first = MatchItem.fromJson({
      'team1': {'name': 'فريق أ', 'goals': 0},
      'team2': {'name': 'فريق ب', 'goals': 0},
      'homeScore': 1,
      'awayScore': 0,
      'status': 'live',
      'ref': 'match:live',
    });
    final second = MatchItem.fromJson({
      'team1': {'name': 'فريق أ', 'goals': 0},
      'team2': {'name': 'فريق ب', 'goals': 0},
      'homeScore': 1,
      'awayScore': 1,
      'status': 'live',
      'ref': 'match:live',
    });
    expect(first.homeGoals, 1);
    expect(first.awayGoals, 0);
    expect(second.homeGoals, 1);
    expect(second.awayGoals, 1);
  });

  test('missing match score stays absent instead of becoming 0-0', () {
    final match = MatchItem.fromJson({
      'team1': {'name': 'فريق أ', 'goals': ''},
      'team2': {'name': 'فريق ب'},
      'status': 'ended',
      'ref': 'match:opaque2',
    });
    expect(match.homeGoals, isNull);
    expect(match.awayGoals, isNull);
    expect(match.hasScore, false);
  });

  test('match server and playback expose opaque references only', () {
    final server = MatchServer.fromJson({'ref': 'server:opaque', 'name': 'Web Server 1', 'type': 'm3u8'});
    final playback = MatchPlayback.fromJson({'media_path': '/api/matches/media?id=opaque', 'media_type': 'm3u8', 'server_name': 'Web Server 1'});
    expect(server.ref, startsWith('server:'));
    expect(playback.mediaPath, startsWith('/api/matches/media?'));
  });
}
