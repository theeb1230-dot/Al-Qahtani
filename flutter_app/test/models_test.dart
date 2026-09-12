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
