import 'package:flutter/material.dart';
import 'api_client.dart';
import 'app_target.dart';
import 'download_service.dart';
import 'library_store.dart';
import 'models.dart';
import 'player_page.dart';
import 'route_focus_restorer.dart';

class DetailsPage extends StatefulWidget {
  const DetailsPage({super.key, required this.api, required this.store, required this.item});
  final AlQahtaniApi api;
  final LocalLibraryStore store;
  final CatalogItem item;

  @override
  State<DetailsPage> createState() => _DetailsPageState();
}

class _DetailsPageState extends State<DetailsPage> {
  late Future<TitleDetails> future;
  final DownloadService _downloads = DownloadService();
  final Set<String> _activeDownloads = <String>{};
  final FocusNode _directPlayFocus = FocusNode(debugLabel: 'details-direct-play');
  final Map<String, FocusNode> _episodeFocusNodes = <String, FocusNode>{};

  @override
  void initState() {
    super.initState();
    future = widget.api.details(widget.item.ref);
  }

  @override
  void dispose() {
    _directPlayFocus.dispose();
    for (final node in _episodeFocusNodes.values) {
      node.dispose();
    }
    _downloads.close();
    super.dispose();
  }

  void retry() => setState(() => future = widget.api.details(widget.item.ref));

  FocusNode _episodeFocus(EpisodeItem episode) {
    final key = '${episode.id}:${episode.number}';
    return _episodeFocusNodes.putIfAbsent(
      key,
      () => FocusNode(debugLabel: 'details-episode-$key'),
    );
  }

  Future<void> _openDirect(TitleDetails details) async {
    await RouteFocusRestorer.push<void>(
      context,
      returnFocus: _directPlayFocus,
      route: MaterialPageRoute(
        builder: (_) => PlayerPage(
          api: widget.api,
          store: widget.store,
          item: widget.item,
          title: details.title,
          mediaPath: details.mediaPath,
          mediaType: details.mediaType,
        ),
      ),
    );
  }

  Future<void> _openEpisode(EpisodeItem episode, FocusNode returnFocus) async {
    if (episode.ref.isEmpty || !episode.watchAvailable) return;
    final label = episode.title.trim().isEmpty ? 'الحلقة ${episode.number}' : episode.title;
    await RouteFocusRestorer.push<void>(
      context,
      returnFocus: returnFocus,
      route: MaterialPageRoute(
        builder: (_) => PlayerPage(
          api: widget.api,
          store: widget.store,
          item: widget.item,
          title: label,
          sourceRef: episode.ref,
          episodeId: episode.id,
          episodeNumber: episode.number,
        ),
      ),
    );
  }

  Future<void> _download({required String key, required String title, String mediaPath = '', String sourceRef = ''}) async {
    if (_activeDownloads.contains(key)) return;
    setState(() => _activeDownloads.add(key));
    try {
      var resolvedPath = mediaPath;
      if (resolvedPath.isEmpty) {
        final resolved = await widget.api.resolvePlayback(sourceRef);
        resolvedPath = resolved.mediaPath;
      }
      final uri = widget.api.mediaUri(resolvedPath, download: true);
      final result = await _downloads.download(uri, fallbackName: title);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('اكتمل التنزيل داخل مساحة التطبيق • ${(result.bytes / (1024 * 1024)).toStringAsFixed(1)} MB'),
      ));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('تعذر تنزيل هذا المصدر حاليًا. لم يتم فتح رابط خارجي.'),
      ));
    } finally {
      if (mounted) setState(() => _activeDownloads.remove(key));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.store,
      builder: (context, _) => Scaffold(
        appBar: AppBar(
          title: Text(widget.item.title),
          actions: [
            IconButton(
              tooltip: widget.store.isFavorite(widget.item.ref) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة',
              onPressed: () => widget.store.toggleFavorite(widget.item),
              icon: Icon(widget.store.isFavorite(widget.item.ref) ? Icons.favorite : Icons.favorite_border),
            ),
          ],
        ),
        body: FutureBuilder<TitleDetails>(
          future: future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
            if (snapshot.hasError || snapshot.data == null) {
              return Center(child: FilledButton.icon(onPressed: retry, icon: const Icon(Icons.refresh), label: const Text('تعذر تحميل التفاصيل، أعد المحاولة')));
            }
            final details = snapshot.data!;
            return ListView(
              padding: EdgeInsets.all(isTvTarget ? 28 : 16),
              children: [
                if (details.poster.isNotEmpty) ConstrainedBox(constraints: const BoxConstraints(maxHeight: 420), child: Image.network(details.poster, fit: BoxFit.contain)),
                const SizedBox(height: 16),
                Text(details.title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                if (details.hasEpisodes) ...[
                  Text('الحلقات', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  ...details.episodes.map((episode) {
                    final key = 'episode:${episode.id}:${episode.number}';
                    final focusNode = _episodeFocus(episode);
                    return _EpisodeTile(
                      episode: episode,
                      focusNode: focusNode,
                      downloading: _activeDownloads.contains(key),
                      onTap: () => _openEpisode(episode, focusNode),
                      onDownload: () => _download(
                        key: key,
                        title: '${details.title} - الحلقة ${episode.number}',
                        sourceRef: episode.ref,
                      ),
                    );
                  }),
                ] else if (details.hasDirectMedia) ...[
                  Card(child: ListTile(
                    focusNode: _directPlayFocus,
                    leading: const Icon(Icons.play_circle_outline),
                    title: const Text('مشاهدة داخل التطبيق'),
                    subtitle: const Text('المصدر يمر عبر Al-Qahtani media proxy دون كشف العنوان الأصلي.'),
                    trailing: const Icon(Icons.play_arrow),
                    onTap: () => _openDirect(details),
                  )),
                  Card(child: ListTile(
                    leading: _activeDownloads.contains('direct')
                        ? const SizedBox.square(dimension: 24, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.download_outlined),
                    title: Text(_activeDownloads.contains('direct') ? 'جاري التنزيل…' : 'تنزيل داخل التطبيق'),
                    subtitle: const Text('يستخدم نفس media reference المعتم ومسار Download الموثوق.'),
                    onTap: _activeDownloads.contains('direct')
                        ? null
                        : () => _download(key: 'direct', title: details.title, mediaPath: details.mediaPath),
                  )),
                ] else if (details.playbackUnavailable)
                  const ListTile(leading: Icon(Icons.info_outline), title: Text('المشاهدة غير متاحة من هذا المصدر حاليًا'), subtitle: Text('لن يتم فتح روابط خارجية أو تسريب عنوان المصدر.'))
                else
                  const ListTile(title: Text('لا توجد حلقات أو وسائط متاحة حاليًا')),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _EpisodeTile extends StatelessWidget {
  const _EpisodeTile({required this.episode, required this.focusNode, required this.onTap, required this.onDownload, required this.downloading});
  final EpisodeItem episode;
  final FocusNode focusNode;
  final VoidCallback onTap;
  final VoidCallback onDownload;
  final bool downloading;

  @override
  Widget build(BuildContext context) {
    final label = episode.title.trim().isEmpty ? 'الحلقة ${episode.number}' : episode.title;
    final enabled = episode.watchAvailable && episode.ref.isNotEmpty;
    return Card(child: ListTile(
      focusNode: focusNode,
      enabled: enabled,
      leading: CircleAvatar(child: Text('${episode.number}')),
      title: Text(label),
      subtitle: const Text('رقم الحلقة منفصل عن معرف المصدر الداخلي'),
      trailing: enabled
          ? Wrap(
              spacing: 4,
              children: [
                IconButton(
                  tooltip: downloading ? 'جاري التنزيل' : 'تنزيل الحلقة',
                  onPressed: downloading ? null : onDownload,
                  icon: downloading
                      ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.download_outlined),
                ),
                IconButton(tooltip: 'تشغيل الحلقة', onPressed: onTap, icon: const Icon(Icons.play_arrow)),
              ],
            )
          : const Icon(Icons.block),
      onTap: enabled ? onTap : null,
    ));
  }
}
