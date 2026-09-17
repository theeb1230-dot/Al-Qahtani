import 'package:al_qahtani/src/cycle_feature_policy.dart';
import 'package:al_qahtani/src/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('search state fails closed to Basri and restores filters/scroll', () {
    const initial = SearchCycleState(query: 'Dune', source: 'basri', type: 'movie', year: 2024, scrollOffset: 640);
    expect(initial.canOfferFallback, isTrue);
    final restored = initial.copyWith(source: 'unknown');
    expect(restored.source, 'basri');
    expect(restored.type, 'movie');
    expect(restored.year, 2024);
    expect(restored.scrollOffset, 640);
  });

  test('TMDB never auto-offers another fallback', () {
    const state = SearchCycleState(query: 'Dune', source: 'tmdb');
    expect(state.canOfferFallback, isFalse);
  });

  test('type/year filtering is stable and dedupes opaque refs', () {
    const movie = CatalogItem(id: '1', title: 'Dune', poster: '', type: 'movie', ref: 'opaque:1', year: 2024);
    const oldMovie = CatalogItem(id: '2', title: 'Dune', poster: '', type: 'movie', ref: 'opaque:2', year: 2021);
    const series = CatalogItem(id: '3', title: 'Dune', poster: '', type: 'series', ref: 'opaque:3', year: 2024);
    final filtered = filterSearchResults(const [movie, movie, oldMovie, series], const SearchCycleState(type: 'movie', year: 2024));
    expect(filtered, [movie]);
  });

  test('resume requires real nontrivial incomplete progress', () {
    expect(shouldOfferResume(position: const Duration(seconds: 4), duration: const Duration(minutes: 10)), isFalse);
    expect(shouldOfferResume(position: const Duration(minutes: 2), duration: const Duration(minutes: 10)), isTrue);
    expect(shouldOfferResume(position: const Duration(minutes: 10), duration: const Duration(minutes: 10)), isFalse);
  });

  test('request generations reject stale work after cancellation', () {
    final generations = RequestGeneration();
    final first = generations.next();
    final second = generations.next();
    expect(generations.isCurrent(first), isFalse);
    expect(generations.isCurrent(second), isTrue);
    generations.cancelOutstanding();
    expect(generations.isCurrent(second), isFalse);
  });

  test('Arabic player states expose no provider internals', () {
    for (final state in PlayerConnectionState.values) {
      final label = playerConnectionArabic(state);
      expect(label, isNotEmpty);
      expect(label.toLowerCase(), isNot(contains('http')));
      expect(label.toLowerCase(), isNot(contains('provider')));
    }
  });

  test('accessibility and timeout budgets remain bounded', () {
    expect(minimumPrimaryTouchTarget, greaterThanOrEqualTo(48));
    expect(networkUiTimeout, lessThanOrEqualTo(const Duration(seconds: 30)));
    expect(maxLocalSearchHistory, 12);
  });
}
