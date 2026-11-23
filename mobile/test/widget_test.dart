

import 'package:flutter_test/flutter_test.dart';
import 'package:campussave/main.dart';

void main() {
  testWidgets('CampusSave application test', (WidgetTester tester) async {
    await tester.pumpWidget(const CampusSaveApp());

    expect(find.text('CampusSave'), findsWidgets);
  });
}
