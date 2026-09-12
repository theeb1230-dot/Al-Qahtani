import 'package:flutter/material.dart';
import 'api_client.dart';
import 'app_target.dart';
import 'models.dart';
import 'player_page.dart';

class DetailsPage extends StatefulWidget {
  const DetailsPage({super.key, required this.api, required this.item});
  final AlQahtaniApi api;
  final CatalogItem item;

  @override
  State<DetailsPage> createState() => _DetailsPageState();
}

class _DetailsPageState extends State<DetailsPage> {
  late Future<TitleDetails> future;

  @override
  void initState() {
    super.initState();
    future = widget.api.details(widget.item.ref);
  }

  void retry() => setState(() => future = widget.api.details(widget.item.ref));

  void _openDirect(TitleDetails details) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PlayerPage(
          api: widget.api,
          title: details.title,
          mediaPath: details.mediaPath,
          mediaType: details.mediaType,
        ),
      ),
    );
  }

  void _openEpisode(EpisodeItem episode) {
    if (episode.ref.isEmpty || !episode.watchAvailable) return;
    final label = episode.title.trim().isEmpty ? 'الحلقة ${episode.number}' : episode.title;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PlayerPage(
          api: widget.api,
          title: label,
          sourceRef: episode.ref,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.item.title)),
      body: FutureBuilder<TitleDetails>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || snapshot.data == null) {
            return Center(
              child: FilledButton.icon(
                onPressed: retry,
                icon: const Icon(Icons.refresh),
                label: const Text('تعذر تحميل التفاصيل، أعد المحاولة'),
              ),
            );
          }
          final details = snapshot.data!;
          return ListView(
            padding: EdgeInsets.all(isTvTarget ? 28 : 16),
            children: [
              if (details.poster.isNotEmpty)
                ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 420),
                  child: Image.network(details.poster, fit: BoxFit.contain),
                ),
              const SizedBox(height: 16),
              Text(
                details.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              if (details.hasEpisodes) ...[
                Text('الحلقات', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                ...details.episodes.map(
                  (episode) => _EpisodeTile(
                    episode: episode,
                    onTap: () => _openEpisode(episode),
                  ),
                ),
              ] else if (details.hasDirectMedia)
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.play_circle_outline),
                    title: const Text('مشاهدة داخل التطبيق'),
                    subtitle: const Text('المصدر يمر عبر Al-Qahtani media proxy دون كشف العنوان الأصلي.'),
                    trailing: const Icon(Icons.play_arrow),
                    onTap: () => _openDirect(details),
                  ),
                )
              else if (details.playbackUnavailable)
                const ListTile(
                  leading: Icon(Icons.info_outline),
                  title: Text('المشاهدة غير متاحة من هذا المصدر حاليًا'),
                  subtitle: Text('لن يتم فتح روابط خارجية أو تسريب عنوان المصدر.'),
                )
              else
                const ListTile(title: Text('لا توجد حلقات أو وسائط متاحة حاليًا')),
            ],
          );
        },
      ),
    );
  }
}

class _EpisodeTile extends StatelessWidget {
  const _EpisodeTile({required this.episode, required this.onTap});
  final EpisodeItem episode;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final label = episode.title.trim().isEmpty ? 'الحلقة ${episode.number}' : episode.title;
    final enabled = episode.watchAvailable && episode.ref.isNotEmpty;
    return Card(
      child: ListTile(
        enabled: enabled,
        leading: CircleAvatar(child: Text('${episode.number}')),
        title: Text(label),
        subtitle: const Text('رقم الحلقة منفصل عن معرف المصدر الداخلي'),
        trailing: enabled ? const Icon(Icons.play_arrow) : const Icon(Icons.block),
        onTap: enabled ? onTap : null,
      ),
    );
  }
}
