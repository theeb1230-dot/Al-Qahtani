import 'package:al_qahtani/src/library_store.dart';
import 'package:al_qahtani/src/models.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  const item = CatalogItem(id: 'title-1', title: 'عمل تجريبي', poster: 'poster', type: 'series', ref: 'opaque:title-1');
  const alpha = CatalogItem(id: 'a', title: 'ألف', poster: '', type: 'movie', ref: 'opaque:a');
  const beta = CatalogItem(id: 'b', title: 'باء', poster: '', type: 'movie', ref: 'opaque:b');

  setUp(() { SharedPreferences.setMockInitialValues({}); });

  test('favorites persist stable content refs only', () async {
    final store = await LocalLibraryStore.create(); await store.toggleFavorite(item); expect(store.isFavorite(item.ref), isTrue);
    final reloaded = await LocalLibraryStore.create(); expect(reloaded.favorites.single.ref, item.ref); expect(reloaded.favorites.single.title, item.title);
  });

  test('history separates episodes and exposes continue watching', () async {
    final store = await LocalLibraryStore.create();
    await store.recordProgress(item: item, position: const Duration(minutes: 4), duration: const Duration(minutes: 20), episodeId: '89517', episodeNumber: 7);
    await store.recordProgress(item: item, position: const Duration(minutes: 2), duration: const Duration(minutes: 20), episodeId: '101847', episodeNumber: 8);
    expect(store.history, hasLength(2)); expect(store.continueWatching, hasLength(2)); expect(store.resumePosition(item.ref, episodeId: '89517'), const Duration(minutes: 4)); expect(store.history.map((entry) => entry.episodeNumber), containsAll(<int?>[7, 8]));
  });

  test('completed content is excluded from continue watching', () async {
    final store = await LocalLibraryStore.create(); await store.recordProgress(item: item, position: const Duration(minutes: 19, seconds: 30), duration: const Duration(minutes: 20)); expect(store.history, hasLength(1)); expect(store.continueWatching, isEmpty);
  });

  test('search source is fail-closed to basri and persists explicit tmdb choice', () async {
    final store = await LocalLibraryStore.create(); expect(store.searchSource, 'basri');
    await store.setSearchSource('tmdb'); expect(store.searchSource, 'tmdb');
    final reloaded = await LocalLibraryStore.create(); expect(reloaded.searchSource, 'tmdb');
    await reloaded.setSearchSource('provider-secret'); expect(reloaded.searchSource, 'basri');
  });

  test('local search history is bounded deduped clearable and persisted', () async {
    final store = await LocalLibraryStore.create();
    await store.rememberSearch('  فيلم   عربي '); await store.rememberSearch('فيلم عربي');
    for (var i = 0; i < 20; i++) { await store.rememberSearch('بحث $i'); }
    expect(store.searchHistory.length, 12); expect(store.searchHistory.where((e) => e == 'فيلم عربي').length, lessThanOrEqualTo(1));
    final reloaded = await LocalLibraryStore.create(); expect(reloaded.searchHistory, store.searchHistory);
    await reloaded.clearSearchHistory(); expect(reloaded.searchHistory, isEmpty);
  });

  test('library sorting persists and orders title/progress deterministically', () async {
    final store = await LocalLibraryStore.create(); await store.toggleFavorite(beta); await store.toggleFavorite(alpha);
    await store.setLibrarySort('title'); expect(store.sortedFavorites().map((e) => e.ref), ['opaque:a', 'opaque:b']);
    await store.recordProgress(item: alpha, position: const Duration(minutes: 2), duration: const Duration(minutes: 10));
    await store.recordProgress(item: beta, position: const Duration(minutes: 8), duration: const Duration(minutes: 10));
    await store.setLibrarySort('progress'); expect(store.sortedContinueWatching().first.contentRef, beta.ref);
    final reloaded = await LocalLibraryStore.create(); expect(reloaded.librarySort, 'progress');
  });
}
