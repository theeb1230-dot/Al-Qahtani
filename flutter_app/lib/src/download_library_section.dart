import 'package:flutter/material.dart';

import 'app_target.dart';
import 'download_service.dart';

class DownloadLibrarySection extends StatefulWidget {
  const DownloadLibrarySection({super.key});

  @override
  State<DownloadLibrarySection> createState() => _DownloadLibrarySectionState();
}

class _DownloadLibrarySectionState extends State<DownloadLibrarySection> {
  late final DownloadService _service = DownloadService();
  List<DownloadedFileInfo> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  @override
  void dispose() {
    _service.close();
    super.dispose();
  }

  Future<void> _reload() async {
    if (mounted) setState(() { _loading = true; _error = null; });
    try {
      final items = await _service.listDownloads();
      if (!mounted) return;
      setState(() { _items = items; _loading = false; });
    } catch (_) {
      if (!mounted) return;
      setState(() { _loading = false; _error = 'تعذر قراءة التنزيلات المحلية'; });
    }
  }

  Future<void> _delete(DownloadedFileInfo item) async {
    try {
      await _service.deleteDownload(item.name);
      await _reload();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم حذف التنزيل من الجهاز')));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تعذر حذف التنزيل')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(children: [
          Expanded(child: Text('التنزيلات', style: Theme.of(context).textTheme.titleLarge)),
          IconButton(
            tooltip: 'تحديث التنزيلات',
            onPressed: _loading ? null : _reload,
            icon: const Icon(Icons.refresh),
          ),
        ]),
        if (_loading) const LinearProgressIndicator(),
        if (_error != null) ListTile(leading: const Icon(Icons.error_outline), title: Text(_error!)),
        if (!_loading && _error == null && _items.isEmpty)
          const ListTile(title: Text('لا توجد ملفات محمّلة بعد')),
        ..._items.map((item) => Card(
              child: ListTile(
                leading: const Icon(Icons.download_done),
                title: Text(item.name, maxLines: 2, overflow: TextOverflow.ellipsis),
                subtitle: Text(_formatBytes(item.bytes)),
                trailing: IconButton(
                  autofocus: false,
                  tooltip: 'حذف من الجهاز',
                  onPressed: () => _delete(item),
                  icon: const Icon(Icons.delete_outline),
                ),
                contentPadding: EdgeInsets.symmetric(horizontal: isTvTarget ? 20 : 12, vertical: isTvTarget ? 8 : 2),
              ),
            )),
      ],
    );
  }

  static String _formatBytes(int bytes) {
    if (bytes >= 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    if (bytes >= 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    if (bytes >= 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '$bytes B';
  }
}
