import 'package:al_qahtani/src/library_store.dart';
import 'package:al_qahtani/src/models.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  const item = CatalogItem(
    id: 'title-1',
    title: 'عمل تجريبي',
    poster: 'poster',
    type: 'series',
    ref: 'opaque:title-1',
  );

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('favorites persist stable content refs only', () async {
    final store = await LocalLibraryStore.create();
    await store.toggleFavorite(item);
    expect(store.isFavorite(item.ref), isTrue);

    final reloaded = await LocalLibraryStore.create();
    expect(reloaded.favorites.single.ref, item.ref);
    expect(reloaded.favorites.single.title, item.title);
  });

  test('history separates episodes and exposes continue watching', () async {
    final store = await LocalLibraryStore.create();
    await store.recordProgress(
      item: item,
      position: const Duration(minutes: 4),
      duration: const Duration(minutes: 20),
      episodeId: '89517',
      episodeNumber: 7,
    );
    await store.recordProgress(
      item: item,
      position: const Duration(minutes: 2),
      duration: const Duration(minutes: 20),
      episodeId: '101847',
      episodeNumber: 8,
    );

    expect(store.history, hasLength(2));
    expect(store.continueWatching, hasLength(2));
    expect(store.resumePosition(item.ref, episodeId: '89517'), const Duration(minutes: 4));
    expect(store.history.map((entry) => entry.episodeNumber), containsAll(<int?>[7, 8]));
  });

  test('completed content is excluded from continue watching', () async {
    final store = await LocalLibraryStore.create();
    await store.recordProgress(
      item: item,
      position: const Duration(minutes: 19, seconds: 30),
      duration: const Duration(minutes: 20),
    );
    expect(store.history, hasLength(1));
    expect(store.continueWatching, isEmpty);
  });
}
