import 'package:al_qahtani/src/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('catalog runtime mapping keeps opaque ref separate from display fields', () {
    final item = CatalogItem.fromJson({
      'id': 'demo',
      'title': 'عمل تجريبي',
      'poster': 'https://cdn.example/poster.jpg',
      'type': 'series',
      'ref': 'opaque:demo',
    });
    expect(item.title, 'عمل تجريبي');
    expect(item.type, 'series');
    expect(item.ref, 'opaque:demo');
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

  test('match runtime mapping normalizes teams without source URLs', () {
    final match = MatchItem.fromJson({
      'team1': {'name': 'فريق أ'},
      'team2': {'name': 'فريق ب'},
      'time': '03:00',
      'status': 'scheduled',
    });
    expect(match.home, 'فريق أ');
    expect(match.away, 'فريق ب');
    expect(match.status, 'scheduled');
  });
}
