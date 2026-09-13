import 'package:al_qahtani/src/api_client.dart';
import 'package:al_qahtani/src/details_page.dart';
import 'package:al_qahtani/src/download_service.dart';
import 'package:al_qahtani/src/library_store.dart';
import 'package:al_qahtani/src/models.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

class RecordingDownloadService extends DownloadService {
  RecordingDownloadService() : super(client: MockClient((_) async => http.Response('', 500)));

  final List<String> resumeKeys = <String>[];
  final List<Uri> uris = <Uri>[];

  @override
  Future<DownloadResult> download(
    Uri uri, {
    String fallbackName = 'al-qahtani-media',
    String? resumeKey,
    DownloadProgressCallback? onProgress,
    DownloadCancellationToken? cancellationToken,
  }) async {
    uris.add(uri);
    resumeKeys.add(resumeKey ?? '');
    onProgress?.call(const DownloadProgress(receivedBytes: 1024, totalBytes: 1024));
    return const DownloadResult(path: '/tmp/fake.mp4', bytes: 1024);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  Future<LocalLibraryStore> createStore() => LocalLibraryStore.create();

  testWidgets('direct details download passes stable catalog resume identity to DownloadService', (tester) async {
    final api = AlQahtaniApi(
      baseUri: Uri.parse('https://runtime.example'),
      client: MockClient((request) async {
        expect(request.url.path, '/api/cinema/details');
        return http.Response(
          '{"status":"success","movie_title":"فيلم","media_path":"/api/cinema/media?ref=opaque-direct","media_type":"mp4"}',
          200,
          headers: const {'content-type': 'application/json'},
        );
      }),
    );
    final downloads = RecordingDownloadService();
    final store = await createStore();
    const item = CatalogItem(
      id: 'movie-501',
      title: 'فيلم',
      poster: '',
      type: 'movie',
      ref: 'opaque-title-direct',
    );

    await tester.pumpWidget(MaterialApp(home: DetailsPage(api: api, store: store, item: item, downloads: downloads)));
    await tester.pumpAndSettle();
    await tester.tap(find.text('تنزيل داخل التطبيق'));
    await tester.pumpAndSettle();

    expect(downloads.resumeKeys, <String>['movie-501:direct']);
    expect(downloads.resumeKeys.single, isNot(contains('opaque-title-direct')));
    expect(downloads.uris.single.path, '/api/cinema/media');
    expect(downloads.uris.single.queryParameters['download'], '1');

    api.close();
    downloads.close();
    store.dispose();
  });

  testWidgets('episode download passes episode_id and episode_number without source ref', (tester) async {
    final api = AlQahtaniApi(
      baseUri: Uri.parse('https://runtime.example'),
      client: MockClient((request) async {
        if (request.url.path == '/api/cinema/details' && request.url.queryParameters['ref'] == 'series-ref') {
          return http.Response(
            '{"status":"success","movie_title":"مسلسل","episodes":[{"episode_id":"ep-9","episode_number":9,"title":"الحلقة 9","ref":"opaque-episode","watch_available":true}]}',
            200,
            headers: const {'content-type': 'application/json'},
          );
        }
        if (request.url.path == '/api/cinema/details' && request.url.queryParameters['ref'] == 'opaque-episode') {
          return http.Response(
            '{"status":"success","movie_title":"الحلقة 9","media_path":"/api/cinema/media?ref=opaque-media","media_type":"mp4"}',
            200,
            headers: const {'content-type': 'application/json'},
          );
        }
        return http.Response('{"status":"error"}', 404);
      }),
    );
    final downloads = RecordingDownloadService();
    final store = await createStore();
    const item = CatalogItem(
      id: 'series-88',
      title: 'مسلسل',
      poster: '',
      type: 'series',
      ref: 'series-ref',
    );

    await tester.pumpWidget(MaterialApp(home: DetailsPage(api: api, store: store, item: item, downloads: downloads)));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('episode-download-ep-9')));
    await tester.pumpAndSettle();

    expect(downloads.resumeKeys, <String>['series-88:episode:ep-9:9']);
    expect(downloads.resumeKeys.single, isNot(contains('opaque-episode')));
    expect(downloads.uris.single.path, '/api/cinema/media');
    expect(downloads.uris.single.queryParameters['download'], '1');

    api.close();
    downloads.close();
    store.dispose();
  });
}
