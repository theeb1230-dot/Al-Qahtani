import 'dart:convert';

class WebPlaybackEvent {
  const WebPlaybackEvent({
    required this.type,
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.errorCode = '',
  });

  final String type;
  final Duration position;
  final Duration duration;
  final String errorCode;

  bool get isPlaybackEvidence => type == 'playing' || type == 'progress' || type == 'ended';

  static WebPlaybackEvent? tryParse(String message) {
    try {
      final decoded = jsonDecode(message);
      if (decoded is! Map<String, dynamic>) return null;
      final type = '${decoded['type'] ?? ''}'.trim().toLowerCase();
      if (!const {'playing', 'progress', 'ended', 'error'}.contains(type)) return null;
      final positionSeconds = _seconds(decoded['position']);
      final durationSeconds = _seconds(decoded['duration']);
      return WebPlaybackEvent(
        type: type,
        position: Duration(milliseconds: (positionSeconds * 1000).round()),
        duration: Duration(milliseconds: (durationSeconds * 1000).round()),
        errorCode: '${decoded['code'] ?? ''}'.trim(),
      );
    } catch (_) {
      return null;
    }
  }

  static double _seconds(Object? value) {
    final parsed = value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
    if (!parsed.isFinite || parsed < 0) return 0;
    return parsed;
  }
}
