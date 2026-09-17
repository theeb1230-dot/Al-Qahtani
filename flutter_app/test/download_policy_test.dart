import 'package:flutter/foundation.dart';

import 'models.dart';

@immutable
class SearchCycleState {
  const SearchCycleState({this.query = '', this.source = 'basri', this.type = 'all', this.year, this.scrollOffset = 0});
  final String query; final String source; final String type; final int? year; final double scrollOffset;
  SearchCycleState copyWith({String? query, String? source, String? type, int? year, bool clearYear = false, double? scrollOffset}) {
    final safeSource = source == 'tmdb' ? 'tmdb' : 'basri';
    final requestedType = type ?? this.type;
    final safeType = const {'all', 'movie', 'series'}.contains(requestedType) ? requestedType : 'all';
    return SearchCycleState(query: query ?? this.query, source: source == null ? this.source : safeSource, type: safeType, year: clearYear ? null : (year ?? this.year), scrollOffset: (scrollOffset ?? this.scrollOffset).clamp(0, double.infinity));
  }
  bool get canOfferFallback => source == 'basri' && query.trim().length >= 2;
  bool get showEmptyFallbackCta => canOfferFallback;
  Map<String, Object?> toLocalState() => {'query': query, 'source': source, 'type': type, 'year': year, 'scroll': scrollOffset};
  factory SearchCycleState.fromLocalState(Map<String, Object?> value) => const SearchCycleState().copyWith(query: '${value['query'] ?? ''}', source: '${value['source'] ?? 'basri'}', type: '${value['type'] ?? 'all'}', year: value['year'] is int ? value['year'] as int : null, clearYear: value['year'] == null, scrollOffset: value['scroll'] is num ? (value['scroll'] as num).toDouble() : 0);
}

List<CatalogItem> filterSearchResults(Iterable<CatalogItem> values, SearchCycleState state) {
  final seen = <String>{}; final out = <CatalogItem>[];
  for (final item in values) {
    if (state.type != 'all' && item.type != state.type) continue;
    if (state.year != null && item.year != state.year) continue;
    final key = item.ref.trim().isNotEmpty ? item.ref.trim() : '${item.source}|${item.type}|${item.title.trim().toLowerCase()}|${item.year ?? ''}';
    if (!seen.add(key)) continue; out.add(item);
  }
  return List.unmodifiable(out);
}

@immutable
class OpaquePlaybackRef {
  const OpaquePlaybackRef._(this.value);
  final String value;
  static OpaquePlaybackRef parse(String raw) {
    final value = raw.trim();
    if (!RegExp(r'^fallback:[A-Za-z0-9_-]{20,64}$').hasMatch(value)) throw const FormatException('INVALID_OPAQUE_PLAYBACK_REF');
    if (value.contains('://') || value.contains('?') || value.contains('#')) throw const FormatException('PLAYBACK_REF_LEAKAGE');
    return OpaquePlaybackRef._(value);
  }
}

@immutable
class BoundedPlaybackRecovery {
  const BoundedPlaybackRecovery({this.maxAttempts = 3}) : assert(maxAttempts >= 1 && maxAttempts <= 5);
  final int maxAttempts;
  bool mayRecover({required int attempt, required bool playerFailure}) => playerFailure && attempt >= 1 && attempt < maxAttempts;
  bool mayRecordSuccess({required bool playbackSignal, required bool playing}) => playbackSignal && playing;
}

enum PlayerConnectionState { connecting, recovering, playing, error }
String playerConnectionArabic(PlayerConnectionState state) => switch (state) { PlayerConnectionState.connecting => 'جاري الاتصال…', PlayerConnectionState.recovering => 'جاري استعادة التشغيل…', PlayerConnectionState.playing => 'يعمل الآن', PlayerConnectionState.error => 'تعذر التشغيل' };

bool shouldOfferResume({required Duration position, required Duration duration}) {
  if (position < const Duration(seconds: 5)) return false;
  if (duration <= Duration.zero) return true;
  if (position >= duration) return false;
  return position.inMilliseconds / duration.inMilliseconds < .95;
}

class RequestGeneration { int _value = 0; int next() => ++_value; void cancelOutstanding() => ++_value; bool isCurrent(int generation) => generation == _value; }

@immutable
class StableUiState<T> {
  const StableUiState._(this.kind, {this.data, this.message});
  final String kind; final T? data; final String? message;
  const StableUiState.loading() : this._('loading');
  const StableUiState.empty() : this._('empty');
  const StableUiState.data(T value) : this._('data', data: value);
  const StableUiState.error(String message) : this._('error', message: message);
}

String normalizeFocusToken(String value) {
  final safe = value.trim().replaceAll(RegExp(r'[^A-Za-z0-9_.:-]'), '');
  return safe.length <= 96 ? safe : safe.substring(0, 96);
}

const double minimumPrimaryTouchTarget = 48;
const Duration networkUiTimeout = Duration(seconds: 30);
const int maxLocalSearchHistory = 12;
const int maxImageCacheEntries = 160;
const int maxConcurrentImageRequests = 6;
