import 'package:flutter/foundation.dart';

import 'models.dart';

@immutable
class SearchCycleState {
  const SearchCycleState({
    this.query = '',
    this.source = 'basri',
    this.type = 'all',
    this.year,
    this.scrollOffset = 0,
  });

  final String query;
  final String source;
  final String type;
  final int? year;
  final double scrollOffset;

  SearchCycleState copyWith({String? query, String? source, String? type, int? year, bool clearYear = false, double? scrollOffset}) {
    final safeSource = source == 'tmdb' ? 'tmdb' : 'basri';
    final requestedType = type ?? this.type;
    final safeType = const {'all', 'movie', 'series'}.contains(requestedType) ? requestedType : 'all';
    return SearchCycleState(
      query: query ?? this.query,
      source: source == null ? this.source : safeSource,
      type: safeType,
      year: clearYear ? null : (year ?? this.year),
      scrollOffset: (scrollOffset ?? this.scrollOffset).clamp(0, double.infinity),
    );
  }

  bool get canOfferFallback => source == 'basri' && query.trim().length >= 2;
}

List<CatalogItem> filterSearchResults(Iterable<CatalogItem> values, SearchCycleState state) {
  final seen = <String>{};
  final out = <CatalogItem>[];
  for (final item in values) {
    if (state.type != 'all' && item.type != state.type) continue;
    if (state.year != null && item.year != state.year) continue;
    final key = item.ref.trim().isNotEmpty
        ? item.ref.trim()
        : '${item.source}|${item.type}|${item.title.trim().toLowerCase()}|${item.year ?? ''}';
    if (!seen.add(key)) continue;
    out.add(item);
  }
  return List.unmodifiable(out);
}

enum PlayerConnectionState { connecting, recovering, playing, error }

String playerConnectionArabic(PlayerConnectionState state) => switch (state) {
  PlayerConnectionState.connecting => 'جاري الاتصال…',
  PlayerConnectionState.recovering => 'جاري استعادة التشغيل…',
  PlayerConnectionState.playing => 'يعمل الآن',
  PlayerConnectionState.error => 'تعذر التشغيل',
};

bool shouldOfferResume({required Duration position, required Duration duration}) {
  if (position < const Duration(seconds: 5)) return false;
  if (duration <= Duration.zero) return true;
  if (position >= duration) return false;
  return position.inMilliseconds / duration.inMilliseconds < .95;
}

@immutable
class RequestGeneration {
  int _value = 0;
  int next() => ++_value;
  void cancelOutstanding() => ++_value;
  bool isCurrent(int generation) => generation == _value;
}

const double minimumPrimaryTouchTarget = 48;
const Duration networkUiTimeout = Duration(seconds: 30);
const int maxLocalSearchHistory = 12;
