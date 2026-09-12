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
