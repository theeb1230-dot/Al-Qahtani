class CatalogItem {
  const CatalogItem({required this.id, required this.title, required this.poster, required this.type, required this.ref});
  final String id;
  final String title;
  final String poster;
  final String type;
  final String ref;

  factory CatalogItem.fromJson(Map<String, dynamic> json) => CatalogItem(
        id: '${json['id'] ?? ''}',
        title: '${json['title'] ?? 'بدون عنوان'}',
        poster: '${json['poster'] ?? ''}',
        type: '${json['type'] ?? 'series'}',
        ref: '${json['ref'] ?? ''}',
      );
}

class EpisodeItem {
  const EpisodeItem({
    required this.id,
    required this.number,
    required this.title,
    required this.ref,
    required this.watchAvailable,
  });

  final String id;
  final int number;
  final String title;
  final String ref;
  final bool watchAvailable;

  factory EpisodeItem.fromJson(Map<String, dynamic> json) {
    final parsedNumber = int.tryParse('${json['episode_number'] ?? json['num'] ?? json['number'] ?? ''}');
    return EpisodeItem(
      id: '${json['episode_id'] ?? json['id'] ?? ''}',
      number: parsedNumber == null || parsedNumber < 1 ? 1 : parsedNumber,
      title: '${json['title'] ?? json['name'] ?? ''}',
      ref: '${json['ref'] ?? json['link'] ?? json['href'] ?? ''}',
      watchAvailable: json['watch_available'] != false,
    );
  }
}

class TitleDetails {
  const TitleDetails({
    required this.title,
    required this.poster,
    required this.episodes,
    required this.mediaPath,
    required this.mediaType,
    required this.playbackUnavailable,
    required this.playbackReason,
  });

  final String title;
  final String poster;
  final List<EpisodeItem> episodes;
  final String mediaPath;
  final String mediaType;
  final bool playbackUnavailable;
  final String playbackReason;

  bool get hasEpisodes => episodes.isNotEmpty;
  bool get hasDirectMedia => mediaPath.isNotEmpty;

  factory TitleDetails.fromJson(Map<String, dynamic> json) {
    final rawEpisodes = json['episodes'];
    final episodes = rawEpisodes is List
        ? rawEpisodes
            .whereType<Map>()
            .map((item) => EpisodeItem.fromJson(item.cast<String, dynamic>()))
            .toList(growable: false)
        : const <EpisodeItem>[];
    return TitleDetails(
      title: '${json['movie_title'] ?? json['title'] ?? 'التفاصيل'}',
      poster: '${json['poster'] ?? ''}',
      episodes: episodes,
      mediaPath: '${json['media_path'] ?? ''}',
      mediaType: '${json['media_type'] ?? ''}',
      playbackUnavailable: json['playback_unavailable'] == true,
      playbackReason: '${json['playback_reason'] ?? ''}',
    );
  }
}

class MatchItem {
  const MatchItem({required this.home, required this.away, required this.time, required this.status});
  final String home;
  final String away;
  final String time;
  final String status;

  factory MatchItem.fromJson(Map<String, dynamic> json) {
    final team1 = (json['team1'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{};
    final team2 = (json['team2'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{};
    return MatchItem(
      home: '${team1['name'] ?? ''}',
      away: '${team2['name'] ?? ''}',
      time: '${json['time'] ?? ''}',
      status: '${json['status'] ?? 'scheduled'}',
    );
  }
}

class RuntimeEnvelope<T> {
  const RuntimeEnvelope({required this.version, required this.kind, required this.data});
  final String version;
  final String kind;
  final T data;
}
