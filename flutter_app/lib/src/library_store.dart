import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

class WatchEntry {
  const WatchEntry({required this.contentRef, required this.contentId, required this.title, required this.poster, required this.type, required this.positionMs, required this.durationMs, required this.updatedAtMs, this.episodeId = '', this.episodeNumber});
  final String contentRef; final String contentId; final String title; final String poster; final String type;
  final int positionMs; final int durationMs; final int updatedAtMs; final String episodeId; final int? episodeNumber;
  String get key => episodeId.isEmpty ? contentRef : '$contentRef::$episodeId';
  double get progress => durationMs <= 0 ? 0 : (positionMs / durationMs).clamp(0, 1);
  CatalogItem get catalogItem => CatalogItem(id: contentId, title: title, poster: poster, type: type, ref: contentRef);
  Map<String, dynamic> toJson() => {'content_ref': contentRef, 'content_id': contentId, 'title': title, 'poster': poster, 'type': type, 'position_ms': positionMs, 'duration_ms': durationMs, 'updated_at_ms': updatedAtMs, 'episode_id': episodeId, 'episode_number': episodeNumber};
  factory WatchEntry.fromJson(Map<String, dynamic> json) => WatchEntry(contentRef: '${json['content_ref'] ?? ''}', contentId: '${json['content_id'] ?? ''}', title: '${json['title'] ?? ''}', poster: '${json['poster'] ?? ''}', type: '${json['type'] ?? ''}', positionMs: int.tryParse('${json['position_ms'] ?? 0}') ?? 0, durationMs: int.tryParse('${json['duration_ms'] ?? 0}') ?? 0, updatedAtMs: int.tryParse('${json['updated_at_ms'] ?? 0}') ?? 0, episodeId: '${json['episode_id'] ?? ''}', episodeNumber: int.tryParse('${json['episode_number'] ?? ''}'));
}

class LocalLibraryStore extends ChangeNotifier {
  LocalLibraryStore._(this._prefs);
  static const _favoritesKey = 'library.favorites.v1';
  static const _historyKey = 'library.history.v1';
  static const _searchHistoryKey = 'search.history.v1';
  static const _searchSourceKey = 'search.source.v1';
  static const _librarySortKey = 'library.sort.v1';
  static const _historyLimit = 80;
  static const _searchHistoryLimit = 12;

  final SharedPreferences _prefs;
  final Map<String, CatalogItem> _favorites = {};
  final Map<String, WatchEntry> _history = {};
  final List<String> _searchHistory = [];
  String _searchSource = 'basri';
  String _librarySort = 'recent';

  static Future<LocalLibraryStore> create() async { final store = LocalLibraryStore._(await SharedPreferences.getInstance()); store._load(); return store; }
  List<CatalogItem> get favorites => List.unmodifiable(_favorites.values);
  List<String> get searchHistory => List.unmodifiable(_searchHistory);
  String get searchSource => _searchSource;
  String get librarySort => _librarySort;
  List<WatchEntry> get history { final values = _history.values.toList()..sort((a, b) => b.updatedAtMs.compareTo(a.updatedAtMs)); return List.unmodifiable(values); }
  List<WatchEntry> get continueWatching => history.where((entry) => entry.positionMs >= 5000 && (entry.durationMs <= 0 || entry.progress < .95)).toList(growable: false);
  bool isFavorite(String contentRef) => _favorites.containsKey(contentRef);
  Duration resumePosition(String contentRef, {String episodeId = ''}) { final key = episodeId.isEmpty ? contentRef : '$contentRef::$episodeId'; return Duration(milliseconds: _history[key]?.positionMs ?? 0); }

  List<CatalogItem> sortedFavorites() {
    final values = _favorites.values.toList();
    if (_librarySort == 'title') values.sort((a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
    return List.unmodifiable(values);
  }

  List<WatchEntry> sortedContinueWatching() {
    final values = continueWatching.toList();
    if (_librarySort == 'title') values.sort((a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
    if (_librarySort == 'progress') values.sort((a, b) => b.progress.compareTo(a.progress));
    return List.unmodifiable(values);
  }

  Future<void> setSearchSource(String value) async {
    final normalized = value == 'tmdb' ? 'tmdb' : 'basri';
    if (_searchSource == normalized) return;
    _searchSource = normalized; await _prefs.setString(_searchSourceKey, normalized); notifyListeners();
  }

  Future<void> rememberSearch(String value) async {
    final normalized = value.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (normalized.length < 2) return;
    _searchHistory.removeWhere((item) => item.toLowerCase() == normalized.toLowerCase());
    _searchHistory.insert(0, normalized);
    if (_searchHistory.length > _searchHistoryLimit) _searchHistory.removeRange(_searchHistoryLimit, _searchHistory.length);
    await _prefs.setStringList(_searchHistoryKey, _searchHistory); notifyListeners();
  }

  Future<void> clearSearchHistory() async { _searchHistory.clear(); await _prefs.remove(_searchHistoryKey); notifyListeners(); }

  Future<void> setLibrarySort(String value) async {
    final normalized = const {'recent', 'title', 'progress'}.contains(value) ? value : 'recent';
    if (_librarySort == normalized) return;
    _librarySort = normalized; await _prefs.setString(_librarySortKey, normalized); notifyListeners();
  }

  Future<void> toggleFavorite(CatalogItem item) async { if (item.ref.isEmpty) return; if (_favorites.containsKey(item.ref)) { _favorites.remove(item.ref); } else { _favorites[item.ref] = item; } await _persistFavorites(); notifyListeners(); }

  Future<void> recordProgress({required CatalogItem item, required Duration position, required Duration duration, String episodeId = '', int? episodeNumber}) async {
    if (item.ref.isEmpty) return;
    final entry = WatchEntry(contentRef: item.ref, contentId: item.id, title: item.title, poster: item.poster, type: item.type, positionMs: position.inMilliseconds, durationMs: duration.inMilliseconds, updatedAtMs: DateTime.now().millisecondsSinceEpoch, episodeId: episodeId, episodeNumber: episodeNumber);
    _history[entry.key] = entry;
    final ordered = history; if (ordered.length > _historyLimit) { for (final old in ordered.skip(_historyLimit)) { _history.remove(old.key); } }
    await _persistHistory(); notifyListeners();
  }

  Future<void> clearHistory() async { _history.clear(); await _prefs.remove(_historyKey); notifyListeners(); }

  void _load() {
    for (final raw in _prefs.getStringList(_favoritesKey) ?? const <String>[]) { try { final json = jsonDecode(raw) as Map<String, dynamic>; final item = CatalogItem.fromJson(json); if (item.ref.isNotEmpty) _favorites[item.ref] = item; } catch (_) {} }
    for (final raw in _prefs.getStringList(_historyKey) ?? const <String>[]) { try { final json = jsonDecode(raw) as Map<String, dynamic>; final entry = WatchEntry.fromJson(json); if (entry.contentRef.isNotEmpty) _history[entry.key] = entry; } catch (_) {} }
    final seen = <String>{};
    for (final raw in _prefs.getStringList(_searchHistoryKey) ?? const <String>[]) { final value = raw.trim(); final key = value.toLowerCase(); if (value.length >= 2 && seen.add(key) && _searchHistory.length < _searchHistoryLimit) _searchHistory.add(value); }
    _searchSource = _prefs.getString(_searchSourceKey) == 'tmdb' ? 'tmdb' : 'basri';
    final sort = _prefs.getString(_librarySortKey) ?? 'recent'; _librarySort = const {'recent', 'title', 'progress'}.contains(sort) ? sort : 'recent';
  }

  Future<void> _persistFavorites() => _prefs.setStringList(_favoritesKey, _favorites.values.map((item) => jsonEncode({'id': item.id, 'title': item.title, 'poster': item.poster, 'type': item.type, 'ref': item.ref})).toList(growable: false));
  Future<void> _persistHistory() => _prefs.setStringList(_historyKey, history.map((entry) => jsonEncode(entry.toJson())).toList(growable: false));
}
