const List<double> supportedPlaybackSpeeds = <double>[0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

bool isSupportedPlaybackSpeed(double value) => supportedPlaybackSpeeds.contains(value);

String playbackSpeedLabel(double value) {
  if (value == value.roundToDouble()) return '${value.toInt()}x';
  return '${value}x';
}
