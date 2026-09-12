import 'package:flutter/material.dart';

class RouteFocusRestorer {
  const RouteFocusRestorer._();

  static Future<T?> push<T>(
    BuildContext context, {
    required Route<T> route,
    required FocusNode returnFocus,
  }) async {
    final result = await Navigator.of(context).push<T>(route);
    if (context.mounted && returnFocus.canRequestFocus) {
      returnFocus.requestFocus();
    }
    return result;
  }
}
