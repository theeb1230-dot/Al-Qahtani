import 'package:al_qahtani/src/details_page.dart';
import 'package:al_qahtani/src/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('resume identity separates direct downloads for different catalog items', () {
    const first = CatalogItem(
      id: 'movie-101',
      title: 'عنوان متشابه',
      poster: '',
      type: 'movie',
      ref: 'opaque-a',
    );
    const second = CatalogItem(
      id: 'movie-202',
      title: 'عنوان متشابه',
      poster: '',
      type: 'movie',
      ref: 'opaque-b',
    );

    expect(buildDownloadResumeKey(first, 'direct'), 'movie-101:direct');
    expect(buildDownloadResumeKey(second, 'direct'), 'movie-202:direct');
    expect(buildDownloadResumeKey(first, 'direct'), isNot(buildDownloadResumeKey(second, 'direct')));
  });

  test('resume identity separates episodes and never depends on provider ref', () {
    const item = CatalogItem(
      id: 'series-77',
      title: 'مسلسل',
      poster: '',
      type: 'series',
      ref: 'https://provider.example/secret-path',
    );

    final episode5 = buildDownloadResumeKey(item, 'episode:ep-5:5');
    final episode6 = buildDownloadResumeKey(item, 'episode:ep-6:6');

    expect(episode5, 'series-77:episode:ep-5:5');
    expect(episode6, 'series-77:episode:ep-6:6');
    expect(episode5, isNot(contains('provider.example')));
    expect(episode5, isNot(equals(episode6)));
  });

  test('resume identity has a deterministic non-ref fallback when catalog id is missing', () {
    const item = CatalogItem(
      id: '',
      title: 'فيلم تجريبي',
      poster: '',
      type: 'movie',
      ref: 'https://provider.example/private',
      year: 2026,
    );

    final key = buildDownloadResumeKey(item, 'direct');
    expect(key, 'movie:فيلم تجريبي:2026:direct');
    expect(key, isNot(contains('provider.example')));
  });
}
