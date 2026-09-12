import 'package:al_qahtani/src/api_client.dart';
import 'package:al_qahtani/src/app_target.dart';
import 'package:al_qahtani/src/details_page.dart';
import 'package:al_qahtani/src/library_store.dart';
import 'package:al_qahtani/src/models.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _FakeApi extends AlQahtaniApi {
  _FakeApi(this.response);

  final TitleDetails response;

  @override
  Future<TitleDetails> details(String ref) async => response;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('episode actions keep a deterministic TV focus surface', (tester) async {
    SharedPreferences.setMockInitialValues(const {});
    final store = await LocalLibraryStore.create();
    final api = _FakeApi(const TitleDetails(
      title: 'مسلسل تجريبي',
      poster: '',
      episodes: [
        EpisodeItem(
          id: 'ep-1',
          number: 1,
          title: 'الحلقة الأولى',
          ref: 'opaque-episode-ref',
          watchAvailable: true,
        ),
      ],
      mediaPath: '',
      mediaType: '',
      playbackUnavailable: false,
      playbackReason: '',
    ));

    await tester.pumpWidget(MaterialApp(
      home: DetailsPage(
        api: api,
        store: store,
        item: const CatalogItem(
          id: 'show-1',
          title: 'مسلسل تجريبي',
          poster: '',
          type: 'series',
          ref: 'opaque-show-ref',
        ),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('episode-play-ep-1')), findsOneWidget);
    expect(find.byKey(const ValueKey('episode-download-ep-1')), findsOneWidget);

    final playTile = tester.widget<ListTile>(find.byKey(const ValueKey('episode-play-ep-1')));
    expect(playTile.focusNode, isNotNull);
    playTile.focusNode!.requestFocus();
    await tester.pump();
    expect(playTile.focusNode!.hasFocus, isTrue);

    if (isTvTarget) {
      expect(find.byKey(const ValueKey('episode-play-button-ep-1')), findsNothing);
      final downloadButton = tester.widget<IconButton>(find.byKey(const ValueKey('episode-download-ep-1')));
      expect(downloadButton.focusNode, isNotNull);
      expect(downloadButton.focusNode!.debugLabel, contains('details-episode-download'));
    } else {
      expect(find.byKey(const ValueKey('episode-play-button-ep-1')), findsOneWidget);
    }
  });
}
