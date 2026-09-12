import 'package:flutter/material.dart';
import 'api_client.dart';
import 'app_target.dart';
import 'models.dart';

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
                ...details.episodes.map((episode) => _EpisodeTile(episode: episode)),
              ] else if (details.hasDirectMedia)
                const ListTile(
                  leading: Icon(Icons.play_circle_outline),
                  title: Text('مصدر مشاهدة مباشر متاح'),
                  subtitle: Text('سيتم ربطه بالمشغل الداخلي في مرحلة Player التالية.'),
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
  const _EpisodeTile({required this.episode});
  final EpisodeItem episode;

  @override
  Widget build(BuildContext context) {
    final label = episode.title.trim().isEmpty ? 'الحلقة ${episode.number}' : episode.title;
    return Card(
      child: ListTile(
        enabled: episode.watchAvailable && episode.ref.isNotEmpty,
        leading: CircleAvatar(child: Text('${episode.number}')),
        title: Text(label),
        subtitle: const Text('رقم الحلقة منفصل عن معرف المصدر الداخلي'),
        trailing: episode.watchAvailable ? const Icon(Icons.play_arrow) : const Icon(Icons.block),
        onTap: episode.watchAvailable ? () {} : null,
      ),
    );
  }
}
