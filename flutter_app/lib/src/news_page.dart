import 'package:flutter/material.dart';
import 'api_client.dart';
import 'app_target.dart';
import 'models.dart';

class NewsPage extends StatefulWidget {
  const NewsPage({super.key, required this.api});
  final AlQahtaniApi api;

  @override
  State<NewsPage> createState() => _NewsPageState();
}

class _NewsPageState extends State<NewsPage> {
  late Future<List<NewsItem>> future = widget.api.news();

  void retry() => setState(() => future = widget.api.news());

  @override
  Widget build(BuildContext context) => FutureBuilder<List<NewsItem>>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _NewsMessage(message: 'تعذر تحميل الأخبار حاليًا', onRetry: retry);
          }
          final items = snapshot.data ?? const <NewsItem>[];
          if (items.isEmpty) {
            return _NewsMessage(message: 'لا توجد أخبار متاحة الآن', onRetry: retry);
          }
          return RefreshIndicator(
            onRefresh: () async {
              final next = widget.api.news();
              setState(() => future = next);
              await next;
            },
            child: ListView.separated(
              padding: EdgeInsets.all(isTvTarget ? 24 : 12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  child: ListTile(
                    contentPadding: EdgeInsets.all(isTvTarget ? 18 : 12),
                    title: Text(item.title, maxLines: 3, overflow: TextOverflow.ellipsis),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (item.date.isNotEmpty) Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(item.date),
                        ),
                        if (item.description.isNotEmpty) Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(item.description, maxLines: 3, overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_left),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => NewsArticlePage(api: widget.api, item: item)),
                    ),
                  ),
                );
              },
            ),
          );
        },
      );
}

class NewsArticlePage extends StatelessWidget {
  const NewsArticlePage({super.key, required this.api, required this.item});
  final AlQahtaniApi api;
  final NewsItem item;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('الخبر')),
        body: FutureBuilder<NewsArticle>(
          future: api.newsArticle(item.ref),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return const _NewsMessage(message: 'تعذر تحميل تفاصيل الخبر');
            }
            final article = snapshot.data!;
            return ListView(
              padding: EdgeInsets.all(isTvTarget ? 28 : 18),
              children: [
                Text(article.title.isEmpty ? item.title : article.title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                if ((article.date.isEmpty ? item.date : article.date).isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(article.date.isEmpty ? item.date : article.date,
                      style: Theme.of(context).textTheme.bodySmall),
                ],
                const SizedBox(height: 18),
                if (article.paragraphs.isEmpty)
                  Text(item.description.isEmpty ? 'لا يتوفر نص إضافي لهذا الخبر.' : item.description)
                else
                  ...article.paragraphs.map((paragraph) => Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: Text(paragraph, style: const TextStyle(height: 1.8)),
                      )),
              ],
            );
          },
        ),
      );
}

class _NewsMessage extends StatelessWidget {
  const _NewsMessage({required this.message, this.onRetry});
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center),
              if (onRetry != null) ...[
                const SizedBox(height: 12),
                FilledButton.tonal(onPressed: onRetry, child: const Text('إعادة المحاولة')),
              ],
            ],
          ),
        ),
      );
}
