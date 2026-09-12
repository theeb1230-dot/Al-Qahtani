enum AppTarget { mobile, tv, ios }

AppTarget parseAppTarget(String value) {
  switch (value.trim().toLowerCase()) {
    case 'tv':
      return AppTarget.tv;
    case 'ios':
      return AppTarget.ios;
    case 'mobile':
    default:
      return AppTarget.mobile;
  }
}

const String appTargetValue = String.fromEnvironment(
  'AL_QAHTANI_TARGET',
  defaultValue: 'mobile',
);

final AppTarget appTarget = parseAppTarget(appTargetValue);

bool get isTvTarget => appTarget == AppTarget.tv;
