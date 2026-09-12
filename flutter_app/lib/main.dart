import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'src/api_client.dart';
import 'src/app_target.dart';
import 'src/details_page.dart';
import 'src/download_library_section.dart';
import 'src/library_store.dart';
import 'src/models.dart';
import 'src/news_page.dart';
import 'src/player_page.dart';

const _brandBlack = Color(0xFF090A0C);
const _brandPanel = Color(0xFF151619);
const _brandGold = Color(0xFFD5AE55);
const _brandGoldSoft = Color(0xFFB88C3D);

void main() => runApp(const AlQahtaniApp());

class AlQahtaniApp extends StatefulWidget {
  const AlQahtaniApp({super.key});
  @override State<AlQahtaniApp> createState() => _AlQahtaniAppState();
}

class _AlQahtaniAppState extends State<AlQahtaniApp> {
  late final Future<LocalLibraryStore> storeFuture = LocalLibraryStore.create();
  @override
  Widget build(BuildContext context) {
    final scheme = ColorScheme.fromSeed(seedColor: _brandGold, brightness: Brightness.dark, surface: _brandPanel);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'القحطاني',
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: _brandBlack,
        colorScheme: scheme,
        appBarTheme: const AppBarTheme(backgroundColor: _brandBlack, foregroundColor: Colors.white, centerTitle: true),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: _brandPanel,
          indicatorColor: _brandGold.withValues(alpha: .22),
          labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(color: states.contains(WidgetState.selected) ? _brandGold : Colors.white70)),
          iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(color: states.contains(WidgetState.selected) ? _brandGold : Colors.white70)),
        ),
        cardTheme: const CardThemeData(color: _brandPanel),
        visualDensity: isTvTarget ? VisualDensity.comfortable : VisualDensity.standard,
      ),
      home: Directionality(
        textDirection: TextDirection.rtl,
        child: FutureBuilder<LocalLibraryStore>(
          future: storeFuture,
          builder: (context, snapshot) {
            if (!snapshot.hasData) return const Scaffold(body: Center(child: CircularProgressIndicator(color: _brandGold)));
            return Shell(store: snapshot.data!);
          },
        ),
      ),
    );
  }
}

void openDetails(BuildContext context, AlQahtaniApi api, LocalLibraryStore store, CatalogItem item) {
  Navigator.of(context).push(MaterialPageRoute(builder: (_) => DetailsPage(api: api, store: store, item: item)));
}

class _BrandTitle extends StatelessWidget {
  const _BrandTitle();
  @override
  Widget build(BuildContext context) => const Row(mainAxisSize: MainAxisSize.min, children: [
        Text('ق', style: TextStyle(color: _brandGold, fontSize: 30, fontWeight: FontWeight.w800)),
        SizedBox(width: 8),
        Text('القحطاني', style: TextStyle(fontWeight: FontWeight.w700)),
      ]);
}

class Shell extends StatefulWidget {
  const Shell({super.key, required this.store});
  final LocalLibraryStore store;
  @override State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int index = 0;
  final api = AlQahtaniApi();
  @override void dispose() { api.close(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final pages = [
      MatchesPage(api: api, store: widget.store),
      NewsPage(api: api),
      CatalogPage(api: api, store: widget.store, title: 'الأفلام', categoryId: 'movie-foreign'),
      CatalogPage(api: api, store: widget.store, title: 'المسلسلات', categoryId: 'series-foreign'),
      SearchPage(api: api, store: widget.store),
      LibraryPage(api: api, store: widget.store),
    ];
    final content = IndexedStack(index: index, children: pages);
    return Scaffold(
      appBar: const AppBar(title: _BrandTitle()),
      body: isTvTarget
          ? FocusTraversalGroup(child: Row(children: [
              _TvNavigation(selectedIndex: index, onSelected: (value) => setState(() => index = value)),
              const VerticalDivider(width: 1), Expanded(child: content),
            ]))
          : content,
      bottomNavigationBar: isTvTarget ? null : NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.sports_soccer), label: 'المباريات'),
          NavigationDestination(icon: Icon(Icons.newspaper_outlined), selectedIcon: Icon(Icons.newspaper), label: 'الأخبار'),
          NavigationDestination(icon: Icon(Icons.movie_outlined), label: 'الأفلام'),
          NavigationDestination(icon: Icon(Icons.live_tv_outlined), label: 'المسلسلات'),
          NavigationDestination(icon: Icon(Icons.search), label: 'البحث'),
          NavigationDestination(icon: Icon(Icons.bookmark_outline), selectedIcon: Icon(Icons.bookmark), label: 'مكتبتي'),
        ],
      ),
    );
  }
}

class _TvNavigation extends StatelessWidget {
  const _TvNavigation({required this.selectedIndex, required this.onSelected});
  final int selectedIndex; final ValueChanged<int> onSelected;
  @override
  Widget build(BuildContext context) => NavigationRail(
    extended: true, minExtendedWidth: 190, selectedIndex: selectedIndex, onDestinationSelected: onSelected,
    destinations: const [
      NavigationRailDestination(icon: Icon(Icons.sports_soccer), label: Text('المباريات')),
      NavigationRailDestination(icon: Icon(Icons.newspaper_outlined), selectedIcon: Icon(Icons.newspaper), label: Text('الأخبار')),
      NavigationRailDestination(icon: Icon(Icons.movie_outlined), label: Text('الأفلام')),
      NavigationRailDestination(icon: Icon(Icons.live_tv_outlined), label: Text('المسلسلات')),
      NavigationRailDestination(icon: Icon(Icons.search), label: Text('البحث')),
      NavigationRailDestination(icon: Icon(Icons.bookmark_outline), selectedIcon: Icon(Icons.bookmark), label: Text('مكتبتي')),
    ],
  );
}

String _matchStatusLabel(String status) {
  switch (status.trim().toLowerCase()) {
    case 'live': return 'جاري الآن';
    case 'ended': return 'انتهت';
    case 'scheduled': return 'لم تبدأ';
    default: return status;
  }
}

String _localizedMatchTime(String time) => time.replaceAll(RegExp(r'\bPM\b', caseSensitive: false), 'م').replaceAll(RegExp(r'\bAM\b', caseSensitive: false), 'ص');

class MatchesPage extends StatelessWidget {
  const MatchesPage({super.key, required this.api, required this.store});
  final AlQahtaniApi api;
  final LocalLibraryStore store;

  Future<void> _openMatch(BuildContext context, MatchItem match) async {
    if (match.ref.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('مصدر المباراة غير متاح حاليًا')));
      return;
    }
    showDialog<void>(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator(color: _brandGold)));
    try {
      final playback = await api.resolveMatchPlayback(match.ref);
      if (!context.mounted) return;
      Navigator.of(context, rootNavigator: true).pop();
      final item = CatalogItem(id: match.id, title: '${match.home} × ${match.away}', poster: '', type: 'match', ref: match.ref);
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => PlayerPage(
            api: api,
            store: store,
            item: item,
            title: '${match.home} × ${match.away}',
            mediaPath: playback.mediaPath,
            mediaType: playback.mediaType,
          )));
    } catch (_) {
      if (!context.mounted) return;
      Navigator.of(context, rootNavigator: true).pop();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تعذر تشغيل المباراة حاليًا. جرّب مرة أخرى بعد قليل.')));
    }
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<List<MatchItem>>(
    future: api.matches(),
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator(color: _brandGold));
      if (snapshot.hasError) return const _ErrorState('تعذر تحميل المباريات حاليًا');
      final items = snapshot.data ?? const [];
      if (items.isEmpty) return const _ErrorState('لا توجد مباريات متاحة الآن');
      return ListView.builder(
        padding: EdgeInsets.all(isTvTarget ? 24 : 12), itemCount: items.length,
        itemBuilder: (context, i) {
          final m = items[i];
          final time = _localizedMatchTime(m.time);
          final status = _matchStatusLabel(m.status);
          final score = m.hasScore ? '${m.homeGoals} - ${m.awayGoals}' : (m.status == 'ended' ? 'النتيجة غير متاحة' : '');
          return Card(
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: () => _openMatch(context, m),
              canRequestFocus: true,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(children: [
                  _TeamBadge(name: m.home, logo: m.homeLogo, api: api),
                  Expanded(child: Column(children: [
                    if (m.competition.isNotEmpty) Text(m.competition, style: const TextStyle(color: Colors.white54, fontSize: 12), textAlign: TextAlign.center),
                    const SizedBox(height: 6),
                    Text(score.isNotEmpty ? score : time, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text([if (score.isNotEmpty && time.isNotEmpty) time, status].where((e) => e.isNotEmpty).join(' • '), style: TextStyle(color: m.status == 'live' ? Colors.redAccent : Colors.white60)),
                  ])),
                  _TeamBadge(name: m.away, logo: m.awayLogo, api: api),
                ]),
              ),
            ),
          );
        },
      );
    },
  );
}

class _TeamBadge extends StatelessWidget {
  const _TeamBadge({required this.name, required this.logo, required this.api});
  final String name; final String logo; final AlQahtaniApi api;
  @override
  Widget build(BuildContext context) => SizedBox(
    width: isTvTarget ? 180 : 105,
    child: Column(children: [
      SizedBox(
        width: 58, height: 58,
        child: logo.isEmpty
            ? const Icon(Icons.shield_outlined, size: 42, color: _brandGold)
            : Image.network(api.runtimeUri(logo).toString(), fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.shield_outlined, color: _brandGold)),
      ),
      const SizedBox(height: 6),
      Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w700)),
    ]),
  );
}

class CatalogPage extends StatefulWidget {
  const CatalogPage({super.key, required this.api, required this.store, required this.title, required this.categoryId});
  final AlQahtaniApi api; final LocalLibraryStore store; final String title; final String categoryId;
  @override State<CatalogPage> createState() => _CatalogPageState();
}

class _CatalogPageState extends State<CatalogPage> {
  final controller = ScrollController(); final items = <CatalogItem>[]; final seen = <String>{};
  int page = 0; bool loading = false; bool done = false; String? error; int requestGeneration = 0;
  @override void initState() { super.initState(); controller.addListener(_onScroll); _loadMore(); }
  @override void dispose() { requestGeneration += 1; controller.dispose(); super.dispose(); }
  void _onScroll() { if (controller.position.extentAfter < (isTvTarget ? 1000 : 600)) _loadMore(); }
  Future<void> _loadMore() async {
    if (loading || done) return; final generation = requestGeneration;
    setState(() { loading = true; error = null; });
    try {
      final next = await widget.api.category(widget.categoryId, page: page + 1);
      if (!mounted || generation != requestGeneration) return;
      final fresh = next.where((e) => e.ref.isNotEmpty && seen.add(e.ref)).toList(growable: false);
      setState(() { page += 1; items.addAll(fresh); done = next.length < 30 || fresh.isEmpty; loading = false; });
    } catch (_) {
      if (mounted && generation == requestGeneration) setState(() { loading = false; error = 'تعذر تحميل المزيد. اسحب للأسفل للمحاولة مجددًا.'; });
    }
  }
  Future<void> _refresh() async {
    requestGeneration += 1;
    setState(() { items.clear(); seen.clear(); page = 0; done = false; loading = false; error = null; });
    await _loadMore();
  }
  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: _refresh,
    child: GridView.builder(
      controller: controller, padding: EdgeInsets.all(isTvTarget ? 24 : 12),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: isTvTarget ? 5 : 2, childAspectRatio: isTvTarget ? .68 : .62, crossAxisSpacing: isTvTarget ? 18 : 10, mainAxisSpacing: isTvTarget ? 18 : 10),
      itemCount: items.length + 1,
      itemBuilder: (context, i) {
        if (i == items.length) return Center(child: loading ? const CircularProgressIndicator(color: _brandGold) : Text(error ?? (done ? 'تم عرض كل الأعمال المتاحة' : '')));
        final item = items[i];
        return _CatalogCard(item: item, onTap: () => openDetails(context, widget.api, widget.store, item));
      },
    ),
  );
}

class _CatalogCard extends StatelessWidget {
  const _CatalogCard({required this.item, required this.onTap});
  final CatalogItem item; final VoidCallback onTap;
  @override Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onTap,
      canRequestFocus: true,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Expanded(child: item.poster.isEmpty ? const ColoredBox(color: Color(0xFF1A1A1C), child: Icon(Icons.movie_outlined, color: _brandGold)) : Image.network(item.poster, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFF1A1A1C), child: Icon(Icons.movie_outlined, color: _brandGold)))),
        Padding(padding: EdgeInsets.all(isTvTarget ? 12 : 8), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
          if (item.year != null) Text('${item.year}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
        ])),
      ]),
    ),
  );
}

class SearchPage extends StatefulWidget {
  const SearchPage({super.key, required this.api, required this.store}); final AlQahtaniApi api; final LocalLibraryStore store;
  @override State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final query = TextEditingController();
  List<CatalogItem> items = const [];
  bool loading = false; bool submitted = false; String? error; Timer? debounce; int generation = 0;
  @override void dispose() { generation += 1; debounce?.cancel(); query.dispose(); super.dispose(); }
  void onQueryChanged(String value) {
    debounce?.cancel();
    final q = value.trim();
    if (q.isEmpty) { generation += 1; setState(() { items = const []; loading = false; submitted = false; error = null; }); return; }
    if (q.length < 2) return;
    debounce = Timer(const Duration(milliseconds: 450), () => run(q));
  }
  Future<void> run([String? requested]) async {
    final q = (requested ?? query.text).trim(); if (q.isEmpty) return;
    final request = ++generation; setState(() { loading = true; submitted = true; error = null; });
    try {
      final result = await widget.api.search(q);
      if (!mounted || request != generation || q != query.text.trim()) return;
      setState(() { items = result; loading = false; });
    } catch (_) {
      if (!mounted || request != generation) return;
      setState(() { items = const []; loading = false; error = 'تعذر البحث حاليًا. أعد المحاولة.'; });
    }
  }
  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.all(isTvTarget ? 24 : 12),
    child: Column(children: [
      TextField(
        controller: query, textInputAction: TextInputAction.search, onChanged: onQueryChanged, onSubmitted: (_) => run(),
        decoration: InputDecoration(hintText: 'ابحث عن فيلم أو مسلسل', suffixIcon: IconButton(onPressed: loading ? null : () => run(), icon: const Icon(Icons.search))),
      ),
      if (loading) const LinearProgressIndicator(color: _brandGold),
      const SizedBox(height: 10),
      Expanded(child: error != null
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Text(error!, textAlign: TextAlign.center), const SizedBox(height: 12), FilledButton.tonal(onPressed: () => run(), child: const Text('إعادة المحاولة'))]))
          : submitted && !loading && items.isEmpty
              ? const Center(child: Text('لا توجد نتائج لهذا البحث حاليًا'))
              : !submitted
                  ? const Center(child: Text('اكتب اسم فيلم أو مسلسل للبحث'))
                  : GridView.builder(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: isTvTarget ? 5 : 2, childAspectRatio: .63, crossAxisSpacing: 10, mainAxisSpacing: 10),
                      itemCount: items.length,
                      itemBuilder: (context, i) => _CatalogCard(item: items[i], onTap: () => openDetails(context, widget.api, widget.store, items[i])),
                    )),
    ]),
  );
}

class LibraryPage extends StatelessWidget {
  const LibraryPage({super.key, required this.api, required this.store});
  final AlQahtaniApi api; final LocalLibraryStore store;
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: store,
    builder: (context, _) {
      final favorites = store.favorites; final watching = store.continueWatching; final history = store.history;
      return ListView(padding: EdgeInsets.all(isTvTarget ? 24 : 12), children: [
        Text('المفضلة', style: Theme.of(context).textTheme.titleLarge),
        if (favorites.isEmpty) const ListTile(title: Text('لا توجد عناصر مفضلة بعد')),
        ...favorites.map((item) => ListTile(leading: const Icon(Icons.favorite, color: _brandGold), title: Text(item.title), onTap: () => openDetails(context, api, store, item))),
        const SizedBox(height: 18),
        Text('أكمل المشاهدة', style: Theme.of(context).textTheme.titleLarge),
        if (watching.isEmpty) const ListTile(title: Text('لا توجد مشاهدة غير مكتملة')),
        ...watching.map((entry) => ListTile(leading: const Icon(Icons.play_circle_outline), title: Text(entry.title), subtitle: LinearProgressIndicator(value: entry.durationMs > 0 ? entry.progress : null), onTap: () => openDetails(context, api, store, entry.catalogItem))),
        const SizedBox(height: 18), const DownloadLibrarySection(), const SizedBox(height: 18),
        Row(children: [Expanded(child: Text('السجل', style: Theme.of(context).textTheme.titleLarge)), if (history.isNotEmpty) TextButton(onPressed: store.clearHistory, child: const Text('مسح السجل'))]),
        if (history.isEmpty) const ListTile(title: Text('سجل المشاهدة فارغ')),
        ...history.map((entry) => ListTile(leading: const Icon(Icons.history), title: Text(entry.title), subtitle: Text(entry.episodeNumber == null ? 'آخر مشاهدة' : 'الحلقة ${entry.episodeNumber}'), onTap: () => openDetails(context, api, store, entry.catalogItem))),
      ]);
    },
  );
}

class _ErrorState extends StatelessWidget {
  const _ErrorState(this.message); final String message;
  @override Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(message, textAlign: TextAlign.center)));
}
