import 'package:al_qahtani/src/route_focus_restorer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('restores focus to invoking control after route pop', (tester) async {
    final focusNode = FocusNode(debugLabel: 'return-target');
    addTearDown(focusNode.dispose);

    await tester.pumpWidget(MaterialApp(
      home: Builder(
        builder: (context) => Scaffold(
          body: TextButton(
            focusNode: focusNode,
            onPressed: () {
              RouteFocusRestorer.push<void>(
                context,
                returnFocus: focusNode,
                route: MaterialPageRoute<void>(
                  builder: (_) => Scaffold(
                    body: TextButton(
                      key: const Key('close-player'),
                      onPressed: () => Navigator.of(_).pop(),
                      child: const Text('إغلاق'),
                    ),
                  ),
                ),
              );
            },
            child: const Text('تشغيل'),
          ),
        ),
      ),
    ));

    await tester.tap(find.text('تشغيل'));
    await tester.pumpAndSettle();
    expect(focusNode.hasFocus, isFalse);

    await tester.tap(find.byKey(const Key('close-player')));
    await tester.pumpAndSettle();
    expect(focusNode.hasFocus, isTrue);
  });
}
