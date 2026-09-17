import 'package:al_qahtani/src/cycle_feature_policy.dart';
import 'package:al_qahtani/src/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('search state fails closed to Basri and restores filters/scroll', () {
    const initial = SearchCycleState(query: 'Dune', source: 'basri', type: 'movie', year: 2024, scrollOffset: 640);
    final restored = SearchCycleState.fromLocalState(initial.toLocalState());
    expect(restored.canOfferFallback, isTrue); expect(restored.source, 'basri'); expect(restored.type, 'movie'); expect(restored.year, 2024); expect(restored.scrollOffset, 640);
    expect(restored.copyWith(source: 'unknown').source, 'basri');
  });
  test('TMDB never auto-offers another fallback', () { const state = SearchCycleState(query: 'Dune', source: 'tmdb'); expect(state.canOfferFallback, isFalse); expect(state.showEmptyFallbackCta, isFalse); });
  test('empty Basri result can expose explicit fallback CTA', () { const state = SearchCycleState(query: 'Dune', source: 'basri'); expect(state.showEmptyFallbackCta, isTrue); });
  test('type/year filtering is stable and dedupes opaque refs', () {
    const movie = CatalogItem(id: '1', title: 'Dune', poster: '', type: 'movie', ref: 'opaque:1', year: 2024);
    const oldMovie = CatalogItem(id: '2', title: 'Dune', poster: '', type: 'movie', ref: 'opaque:2', year: 2021);
    const series = CatalogItem(id: '3', title: 'Dune', poster: '', type: 'series', ref: 'opaque:3', year: 2024);
    expect(filterSearchResults(const [movie, movie, oldMovie, series], const SearchCycleState(type: 'movie', year: 2024)), [movie]);
  });
  test('opaque playback refs reject URLs query and fragments', () {
    expect(OpaquePlaybackRef.parse('fallback:abcdefghijklmnopqrstuv').value, 'fallback:abcdefghijklmnopqrstuv');
    for (final value in ['https://provider.test/a', 'fallback:abc?token=x', 'fallback:abc#x', 'fallback:short']) { expect(() => OpaquePlaybackRef.parse(value), throwsFormatException); }
  });
  test('bounded recovery requires real player failure and playing evidence', () {
    const policy = BoundedPlaybackRecovery(maxAttempts: 3);
    expect(policy.mayRecover(attempt: 1, playerFailure: false), isFalse); expect(policy.mayRecover(attempt: 1, playerFailure: true), isTrue); expect(policy.mayRecover(attempt: 3, playerFailure: true), isFalse);
    expect(policy.mayRecordSuccess(playbackSignal: true, playing: false), isFalse); expect(policy.mayRecordSuccess(playbackSignal: true, playing: true), isTrue);
  });
  test('resume requires real nontrivial incomplete progress', () { expect(shouldOfferResume(position: const Duration(seconds: 4), duration: const Duration(minutes: 10)), isFalse); expect(shouldOfferResume(position: const Duration(minutes: 2), duration: const Duration(minutes: 10)), isTrue); expect(shouldOfferResume(position: const Duration(minutes: 10), duration: const Duration(minutes: 10)), isFalse); });
  test('request generations reject stale work after cancellation', () { final generations = RequestGeneration(); final first = generations.next(); final second = generations.next(); expect(generations.isCurrent(first), isFalse); expect(generations.isCurrent(second), isTrue); generations.cancelOutstanding(); expect(generations.isCurrent(second), isFalse); });
  test('Arabic player states expose no provider internals', () { for (final state in PlayerConnectionState.values) { final label = playerConnectionArabic(state); expect(label, isNotEmpty); expect(label.toLowerCase(), isNot(contains('http'))); expect(label.toLowerCase(), isNot(contains('provider'))); } });
  test('stable UI states are explicit', () { expect(const StableUiState<int>.loading().kind, 'loading'); expect(const StableUiState<int>.empty().kind, 'empty'); expect(const StableUiState<int>.error('x').kind, 'error'); expect(const StableUiState<int>.data(7).data, 7); });
  test('focus tokens and accessibility/performance budgets remain bounded', () { expect(normalizeFocusToken('library:item 1'), 'library:item1'); expect(normalizeFocusToken('x' * 120).length, 96); expect(minimumPrimaryTouchTarget, greaterThanOrEqualTo(48)); expect(networkUiTimeout, lessThanOrEqualTo(const Duration(seconds: 30))); expect(maxLocalSearchHistory, 12); expect(maxImageCacheEntries, lessThanOrEqualTo(200)); expect(maxConcurrentImageRequests, lessThanOrEqualTo(8)); });
}
