class CatalogItem {
  const CatalogItem({required this.id, required this.title, required this.poster, required this.type, required this.ref, this.year});
  final String id;
  final String title;
  final String poster;
  final String type;
  final String ref;
  final int? year;

  factory CatalogItem.fromJson(Map<String, dynamic> json) => CatalogItem(
        id: '${json['id'] ?? ''}',
        title: '${json['title'] ?? 'بدون عنوان'}',
        poster: '${json['poster'] ?? json['img'] ?? json['image'] ?? ''}',
        type: '${json['type'] ?? 'series'}',
        ref: '${json['ref'] ?? ''}',
        year: int.tryParse('${json['year'] ?? ''}'),
      );
}

class EpisodeItem {
  const EpisodeItem({required this.id, required this.number, required this.title, required this.ref, required this.watchAvailable});
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
  const TitleDetails({required this.title, required this.poster, required this.episodes, required this.mediaPath, required this.mediaType, required this.playbackUnavailable, required this.playbackReason});
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
        ? rawEpisodes.whereType<Map>().map((item) => EpisodeItem.fromJson(item.cast<String, dynamic>())).toList(growable: false)
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
  const MatchItem({
    required this.id,
    required this.ref,
    required this.home,
    required this.away,
    required this.homeLogo,
    required this.awayLogo,
    required this.homeGoals,
    required this.awayGoals,
    required this.time,
    required this.status,
    required this.competition,
  });
  final String id;
  final String ref;
  final String home;
  final String away;
  final String homeLogo;
  final String awayLogo;
  final int? homeGoals;
  final int? awayGoals;
  final String time;
  final String status;
  final String competition;

  bool get hasScore => homeGoals != null && awayGoals != null;

  factory MatchItem.fromJson(Map<String, dynamic> json) {
    final team1 = (json['team1'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{};
    final team2 = (json['team2'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{};
    int? score(dynamic value) => value == null || '$value'.trim().isEmpty ? null : int.tryParse('$value');
    return MatchItem(
      id: '${json['id'] ?? ''}',
      ref: '${json['ref'] ?? ''}',
      home: '${team1['name'] ?? ''}',
      away: '${team2['name'] ?? ''}',
      homeLogo: '${team1['logo'] ?? ''}',
      awayLogo: '${team2['logo'] ?? ''}',
      homeGoals: score(team1['goals']),
      awayGoals: score(team2['goals']),
      time: '${json['time'] ?? ''}',
      status: '${json['status'] ?? 'scheduled'}',
      competition: '${json['competition'] ?? ''}',
    );
  }
}

class MatchPlayback {
  const MatchPlayback({required this.mediaPath, required this.mediaType, required this.serverName});
  final String mediaPath;
  final String mediaType;
  final String serverName;

  factory MatchPlayback.fromJson(Map<String, dynamic> json) => MatchPlayback(
        mediaPath: '${json['media_path'] ?? ''}',
        mediaType: '${json['media_type'] ?? 'stream'}',
        serverName: '${json['server_name'] ?? 'سيرفر المباراة'}',
      );
}

class NewsItem {
  const NewsItem({required this.id, required this.ref, required this.title, required this.date, required this.description});
  final String id;
  final String ref;
  final String title;
  final String date;
  final String description;
  factory NewsItem.fromJson(Map<String, dynamic> json) => NewsItem(
        id: '${json['id'] ?? ''}', ref: '${json['ref'] ?? ''}', title: '${json['title'] ?? 'بدون عنوان'}',
        date: '${json['date'] ?? ''}', description: '${json['description'] ?? ''}',
      );
}

class NewsArticle {
  const NewsArticle({required this.ref, required this.title, required this.date, required this.paragraphs});
  final String ref;
  final String title;
  final String date;
  final List<String> paragraphs;
  factory NewsArticle.fromJson(Map<String, dynamic> json) {
    final raw = json['paragraphs'];
    return NewsArticle(
      ref: '${json['ref'] ?? ''}', title: '${json['title'] ?? ''}', date: '${json['date'] ?? ''}',
      paragraphs: raw is List ? raw.map((e) => '$e').where((e) => e.trim().isNotEmpty).toList(growable: false) : const [],
    );
  }
}

class RuntimeEnvelope<T> {
  const RuntimeEnvelope({required this.version, required this.kind, required this.data});
  final String version;
  final String kind;
  final T data;
}
