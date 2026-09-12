import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import 'api_client.dart';
import 'app_target.dart';
import 'media_format_policy.dart';
import 'models.dart';

class MatchPlayerPage extends StatefulWidget {
  const MatchPlayerPage({super.key, required this.api, required this.match});

  final AlQahtaniApi api;
  final MatchItem match;

  @override
  State<MatchPlayerPage> createState() => _MatchPlayerPageState();
}

class _MatchPlayerPageState extends State<MatchPlayerPage> {
  List<MatchServer> _servers = const [];
  MatchServer? _selected;
  VideoPlayerController? _controller;
  bool _loadingServers = true;
  bool _loadingMedia = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadServers();
  }

  Future<void> _loadServers() async {
    setState(() {
      _loadingServers = true;
      _error = null;
    });
    try {
      final servers = await widget.api.matchServers(widget.match.ref);
      if (!mounted) return;
      setState(() {
        _servers = servers;
        _loadingServers = false;
      });
      if (servers.isEmpty) {
        setState(() => _error = 'لا يوجد مصدر بث متاح لهذه المباراة حاليًا');
        return;
      }
      await _play(servers.first);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingServers = false;
        _error = 'تعذر تجهيز خوادم المباراة. أعد المحاولة بعد قليل.';
      });
    }
  }

  Future<void> _play(MatchServer server) async {
    if (_loadingMedia) return;
    setState(() {
      _loadingMedia = true;
      _error = null;
      _selected = server;
    });
    VideoPlayerController? next;
    try {
      final playback = await widget.api.resolveMatchPlayback(server.ref);
      next = VideoPlayerController.networkUrl(
        widget.api.mediaUri(playback.mediaPath),
        formatHint: videoFormatHintForRuntimeMedia(playback.mediaType),
      );
      await next.initialize();
      await next.play();
      if (!mounted) {
        await next.dispose();
        return;
      }
      final previous = _controller;
      setState(() {
        _controller = next;
        _loadingMedia = false;
      });
      await previous?.dispose();
    } catch (_) {
      await next?.dispose();
      if (!mounted) return;
      setState(() {
        _loadingMedia = false;
        _error = 'تعذر تشغيل هذا السيرفر داخل التطبيق. جرّب سيرفرًا آخر.';
      });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    return Scaffold(
      appBar: AppBar(title: Text('${widget.match.home} × ${widget.match.away}')),
      body: FocusTraversalGroup(
        child: ListView(
          padding: EdgeInsets.all(isTvTarget ? 28 : 16),
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: controller != null && controller.value.isInitialized
                      ? Stack(
                          fit: StackFit.expand,
                          children: [
                            Center(
                              child: AspectRatio(
                                aspectRatio: controller.value.aspectRatio <= 0 ? 16 / 9 : controller.value.aspectRatio,
                                child: VideoPlayer(controller),
                              ),
                            ),
                            PositionedDirectional(
                              start: 10,
                              bottom: 10,
                              child: FilledButton.tonalIcon(
                                onPressed: () async {
                                  if (controller.value.isPlaying) {
                                    await controller.pause();
                                  } else {
                                    await controller.play();
                                  }
                                  if (mounted) setState(() {});
                                },
                                icon: Icon(controller.value.isPlaying ? Icons.pause : Icons.play_arrow),
                                label: Text(controller.value.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'),
                              ),
                            ),
                          ],
                        )
                      : Center(
                          child: _loadingServers || _loadingMedia
                              ? const CircularProgressIndicator()
                              : const Icon(Icons.sports_soccer, size: 64),
                        ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            if (_error != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline),
                      const SizedBox(width: 10),
                      Expanded(child: Text(_error!)),
                      if (_servers.isEmpty)
                        TextButton(onPressed: _loadServers, child: const Text('إعادة المحاولة')),
                    ],
                  ),
                ),
              ),
            if (_servers.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('خوادم البث', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _servers
                    .map((server) => ChoiceChip(
                          selected: identical(server, _selected) || server.ref == _selected?.ref,
                          onSelected: _loadingMedia ? null : (_) => _play(server),
                          label: Text(server.name),
                        ))
                    .toList(growable: false),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
