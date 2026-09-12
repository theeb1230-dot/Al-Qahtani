import 'package:al_qahtani/src/player_controls.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('TV player starts focused on play and D-Pad moves across controls', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: PlayerControls(
          isPlaying: false,
          isTv: true,
          onRewind: () {},
          onTogglePlay: () {},
          onForward: () {},
        ),
      ),
    ));
    await tester.pump();

    final play = tester.widget<IconButton>(find.byKey(const Key('player-play-toggle')));
    final forward = tester.widget<IconButton>(find.byKey(const Key('player-forward')));
    final rewind = tester.widget<IconButton>(find.byKey(const Key('player-rewind')));

    expect(play.focusNode?.hasFocus, isTrue);

    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(forward.focusNode?.hasFocus, isTrue);

    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    expect(play.focusNode?.hasFocus, isTrue);

    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    expect(rewind.focusNode?.hasFocus, isTrue);
  });

  testWidgets('mobile player controls do not steal autofocus', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: PlayerControls(
          isPlaying: true,
          isTv: false,
          onRewind: () {},
          onTogglePlay: () {},
          onForward: () {},
        ),
      ),
    ));
    await tester.pump();

    final play = tester.widget<IconButton>(find.byKey(const Key('player-play-toggle')));
    expect(play.autofocus, isFalse);
  });
}
