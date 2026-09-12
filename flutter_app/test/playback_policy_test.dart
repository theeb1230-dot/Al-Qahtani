import 'package:al_qahtani/src/playback_policy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('playback speed policy exposes bounded supported values', () {
    expect(supportedPlaybackSpeeds, [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]);
    expect(isSupportedPlaybackSpeed(1.5), isTrue);
    expect(isSupportedPlaybackSpeed(3.0), isFalse);
    expect(playbackSpeedLabel(1.0), '1x');
    expect(playbackSpeedLabel(1.25), '1.25x');
  });
}
