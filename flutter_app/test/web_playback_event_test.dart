import 'package:al_qahtani/src/web_playback_event.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('accepts playback progress without exposing source material', () {
    final event = WebPlaybackEvent.tryParse('{"type":"progress","position":12.5,"duration":100}');
    expect(event, isNotNull);
    expect(event!.type, 'progress');
    expect(event.position, const Duration(milliseconds: 12500));
    expect(event.duration, const Duration(seconds: 100));
    expect(event.isPlaybackEvidence, isTrue);
  });

  test('rejects unknown or malformed host messages', () {
    expect(WebPlaybackEvent.tryParse('{"type":"url","value":"https://upstream.example"}'), isNull);
    expect(WebPlaybackEvent.tryParse('not-json'), isNull);
  });

  test('sanitizes invalid timing values', () {
    final event = WebPlaybackEvent.tryParse('{"type":"playing","position":-5,"duration":"NaN"}');
    expect(event, isNotNull);
    expect(event!.position, Duration.zero);
    expect(event.duration, Duration.zero);
  });
}
