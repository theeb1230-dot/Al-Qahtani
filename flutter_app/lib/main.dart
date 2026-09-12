import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'src/api_client.dart';
import 'src/models.dart';

void main() => runApp(const AlQahtaniApp());

class AlQahtaniApp extends StatelessWidget {
  const AlQahtaniApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: const Color(0xFF07111F),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF22D3EE), brightness: Brightness.dark),
      ),
      home: const Directionality(textDirection: TextDirection.rtl, child: Shell()),
    );
  }
}

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int index = 0;
  final api = AlQahtaniApi();
  @override
  void dispose() { api.close(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final pages = [
      RuntimeHome(api: api),
      MatchesPage(api: api),
      CatalogPage(api: api, title: 'الأفلام', categoryId: 'movie-foreign'),
      CatalogPage(api: api, title: 'المسلسلات', categoryId: 'series-foreign'),
      SearchPage(api: api),
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Al-Qahtani')),
      body: IndexedStack(index: index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'الرئيسية'),
          NavigationDestination(icon: Icon(Icons.sports_soccer), label: 'المباريات'),
          NavigationDestination(icon: Icon(Icons.movie_outlined), label: 'الأفلام'),
          NavigationDestination(icon: Icon(Icons.live_tv_outlined), label: 'المسلسلات'),
          NavigationDestination(icon: Icon(Icons.search), label: 'البحث'),
        ],
      ),
    );
  }
}

class RuntimeHome extends StatelessWidget {
  const RuntimeHome({super.key, required this.api});
  final AlQahtaniApi api;
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: const [
      Text('ذيب القحطاني', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
      SizedBox(height: 8),
      Text('نسخة Flutter الجديدة متصلة بطبقة Al-Qahtani Runtime دون كشف مصادر البصري الأصلية.'),
      SizedBox(height: 20),
      _InfoCard(icon: Icons.shield_outlined, title: 'المصادر خلف الـAPI', body: 'التطبيق لا يتعامل مباشرة مع روابط akwam.ss أو Workers أو session URLs.'),
      _InfoCard(icon: Icons.all_inclusive, title: 'تصنيفات بلا حد ثابت', body: 'كل تصنيف يحمل 30 عنصرًا ثم الصفحة التالية تلقائيًا عند الاقتراب من النهاية.'),
    ],
  );
}

class MatchesPage extends StatelessWidget {
  const MatchesPage({super.key, required this.api});
  final AlQahtaniApi api;
  @override
  Widget build(BuildContext context) => FutureBuilder<List<MatchItem>>(
    future: api.matches(),
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
      if (snapshot.hasError) return const _ErrorState('تعذر تحميل المباريات حاليًا');
      final items = snapshot.data ?? const [];
      if (items.isEmpty) return const _ErrorState('لا توجد مباريات متاحة الآن');
      return ListView.builder(
        padding: const EdgeInsets.all(12), itemCount: items.length,
        itemBuilder: (context, i) { final m = items[i]; return Card(child: ListTile(title: Text('${m.home} × ${m.away}'), subtitle: Text('${m.time} • ${m.status}'))); },
      );
    },
  );
}

class CatalogPage extends StatefulWidget {
  const CatalogPage({super.key, required this.api, required this.title, required this.categoryId});
  final AlQahtaniApi api;
  final String title;
  final String categoryId;
  @override State<CatalogPage> createState() => _CatalogPageState();
}

class _CatalogPageState extends State<CatalogPage> {
  final controller = ScrollController();
  final items = <CatalogItem>[];
  final seen = <String>{};
  int page = 0;
  bool loading = false;
  bool done = false;
  String? error;

  @override
  void initState() { super.initState(); controller.addListener(_onScroll); _loadMore(); }
  @override
  void dispose() { controller.dispose(); super.dispose(); }
  void _onScroll() { if (controller.position.extentAfter < 600) _loadMore(); }

  Future<void> _loadMore() async {
    if (loading || done) return;
    setState(() { loading = true; error = null; });
    try {
      final next = await widget.api.category(widget.categoryId, page: page + 1);
      if (!mounted) return;
      final fresh = next.where((e) => e.ref.isNotEmpty && seen.add(e.ref)).toList(growable: false);
      setState(() { page += 1; items.addAll(fresh); done = next.length < 30 || fresh.isEmpty; loading = false; });
    } catch (_) {
      if (mounted) setState(() { loading = false; error = 'تعذر تحميل المزيد. اسحب للأسفل للمحاولة مجددًا.'; });
    }
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: () async { setState(() { items.clear(); seen.clear(); page = 0; done = false; error = null; }); await _loadMore(); },
    child: GridView.builder(
      controller: controller,
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: .62, crossAxisSpacing: 10, mainAxisSpacing: 10),
      itemCount: items.length + 1,
      itemBuilder: (context, i) {
        if (i == items.length) return Center(child: loading ? const CircularProgressIndicator() : Text(error ?? (done ? 'تم عرض كل الأعمال المتاحة' : '')));
        final item = items[i];
        return Card(clipBehavior: Clip.antiAlias, child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Expanded(child: item.poster.isEmpty ? const ColoredBox(color: Color(0xFF132238)) : Image.network(item.poster, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFF132238)))),
          Padding(padding: const EdgeInsets.all(8), child: Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis)),
        ]));
      },
    ),
  );
}

class SearchPage extends StatefulWidget {
  const SearchPage({super.key, required this.api});
  final AlQahtaniApi api;
  @override State<SearchPage> createState() => _SearchPageState();
}
class _SearchPageState extends State<SearchPage> {
  final query = TextEditingController();
  List<CatalogItem> items = const [];
  bool loading = false;
  @override void dispose(){ query.dispose(); super.dispose(); }
  Future<void> run() async { final q = query.text.trim(); if(q.isEmpty) return; setState(()=>loading=true); try { final result = await widget.api.search(q); if(mounted) setState(()=>items=result); } finally { if(mounted) setState(()=>loading=false); } }
  @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.all(12), child: Column(children:[
    TextField(controller: query, textInputAction: TextInputAction.search, onSubmitted: (_)=>run(), decoration: InputDecoration(hintText:'ابحث عن فيلم أو مسلسل', suffixIcon: IconButton(onPressed: run, icon: const Icon(Icons.search)))),
    if(loading) const LinearProgressIndicator(),
    Expanded(child: ListView.builder(itemCount:items.length,itemBuilder:(context,i)=>ListTile(title:Text(items[i].title), subtitle:Text(items[i].type))))
  ]));
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.icon, required this.title, required this.body});
  final IconData icon; final String title; final String body;
  @override Widget build(BuildContext context)=>Card(child:Padding(padding:const EdgeInsets.all(16),child:Row(crossAxisAlignment:CrossAxisAlignment.start,children:[Icon(icon),const SizedBox(width:12),Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(title,style:const TextStyle(fontWeight:FontWeight.bold)),const SizedBox(height:4),Text(body)]))])));
}
class _ErrorState extends StatelessWidget { const _ErrorState(this.message); final String message; @override Widget build(BuildContext context)=>Center(child:Padding(padding:const EdgeInsets.all(24),child:Text(message,textAlign:TextAlign.center))); }
