import 'dart:convert';
import 'package:http/http.dart' as http;
import 'models.dart';

class AlQahtaniApi {
  AlQahtaniApi({http.Client? client, Uri? baseUri})
      : _client = client ?? http.Client(),
        _baseUri = baseUri ?? Uri.parse('https://al-qahtani-api.onrender.com');

  final http.Client _client;
  final Uri _baseUri;

  Future<List<MatchItem>> matches() async {
    final json = await _getJson('/api/v1/matches');
    return _list(json['data']).map(MatchItem.fromJson).toList(growable: false);
  }

  Future<List<CatalogItem>> category(String categoryId, {int page = 1}) async {
    final json = await _getJson('/api/v1/category', {'ref': categoryId, 'p': '$page'});
    return _list(json['data']).map(CatalogItem.fromJson).toList(growable: false);
  }

  Future<List<CatalogItem>> search(String query) async {
    final json = await _getJson('/api/v1/search', {'q': query.trim()});
    return _list(json['data']).map(CatalogItem.fromJson).toList(growable: false);
  }

  Future<Map<String, dynamic>> _getJson(String path, [Map<String, String>? query]) async {
    final uri = _baseUri.replace(path: path, queryParameters: query);
    final response = await _client.get(uri, headers: const {'accept': 'application/json'}).timeout(const Duration(seconds: 30));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException('HTTP ${response.statusCode}');
    }
    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) throw const ApiException('INVALID_JSON');
    if (decoded['status'] != 'success') throw ApiException('${decoded['message'] ?? 'RUNTIME_ERROR'}');
    return decoded;
  }

  static List<Map<String, dynamic>> _list(dynamic value) => value is List
      ? value.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList(growable: false)
      : const <Map<String, dynamic>>[];

  void close() => _client.close();
}

class ApiException implements Exception {
  const ApiException(this.code);
  final String code;
  @override
  String toString() => 'ApiException($code)';
}
