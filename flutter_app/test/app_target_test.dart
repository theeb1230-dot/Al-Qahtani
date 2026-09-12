import 'package:al_qahtani/src/app_target.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('parseAppTarget', () {
    test('recognizes Android TV target', () {
      expect(parseAppTarget('tv'), AppTarget.tv);
      expect(parseAppTarget(' TV '), AppTarget.tv);
    });

    test('recognizes iOS target', () {
      expect(parseAppTarget('ios'), AppTarget.ios);
    });

    test('defaults unknown and mobile values to mobile', () {
      expect(parseAppTarget('mobile'), AppTarget.mobile);
      expect(parseAppTarget('unexpected'), AppTarget.mobile);
      expect(parseAppTarget(''), AppTarget.mobile);
    });
  });
}
