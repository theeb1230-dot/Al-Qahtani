import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import 'api_client.dart';
import 'models.dart';

class PlayerPage extends StatefulWidget {
  const PlayerPage({
    super.key,
    required this.api,
    required this.title,
    this.sourceRef = '',
    this.mediaPath = '',
    this.mediaType = '',
  });

  final AlQahtaniApi api;
  final String title;
  final String sourceRef;
  final String mediaPath;
  final String mediaType;

  @override
  State<PlayerPage> createState() => _PlayerPageState();
}

class _PlayerPageState extends State<PlayerPage> {
  VideoPlayerController? _controller;
  String _status = 'جاري تجهيز المشاهدة…';
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      var mediaPath = widget.mediaPath;
      var mediaType = widget.mediaType;
      if (mediaPath.isEmpty) {
        final TitleDetails resolved = await widget.api.resolvePlayback(widget.sourceRef);
        mediaPath = resolved.mediaPath;
        mediaType = resolved.mediaType;
      }
      if (!mounted) return;
      final controller = VideoPlayerController.networkUrl(widget.api.mediaUri(mediaPath));
      _controller = controller;
      await controller.initialize();
      if (!mounted) return;
      setState(() {
        _failed = false;
        _status = mediaType.isEmpty ? 'جاهز للمشاهدة' : 'جاهز للمشاهدة • $mediaType';
      });
      await controller.play();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _failed = true;
        _status = 'تعذر تشغيل هذا المصدر داخل التطبيق حاليًا';
      });
    }
  }

  Future<void> _seekBy(Duration delta) async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;
    final duration = controller.value.duration;
    var target = controller.value.position + delta;
    if (target < Duration.zero) target = Duration.zero;
    if (duration > Duration.zero && target > duration) target = duration;
    await controller.seekTo(target);
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    final activeController = controller?.value.isInitialized == true ? controller : null;
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (activeController != null)
                    AspectRatio(
                      aspectRatio: activeController.value.aspectRatio > 0
                          ? activeController.value.aspectRatio
                          : 16 / 9,
                      child: VideoPlayer(activeController),
                    )
                  else if (_failed)
                    const Icon(Icons.error_outline, size: 72)
                  else
                    const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(_status, textAlign: TextAlign.center),
                  if (activeController != null) ...[
                    const SizedBox(height: 12),
                    VideoProgressIndicator(
                      activeController,
                      allowScrubbing: true,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    Wrap(
                      alignment: WrapAlignment.center,
                      spacing: 12,
                      children: [
                        IconButton.filledTonal(
                          tooltip: 'رجوع 10 ثوانٍ',
                          onPressed: () => _seekBy(const Duration(seconds: -10)),
                          icon: const Icon(Icons.replay_10),
                        ),
                        ValueListenableBuilder<VideoPlayerValue>(
                          valueListenable: activeController,
                          builder: (context, value, _) => IconButton.filled(
                            tooltip: value.isPlaying ? 'إيقاف مؤقت' : 'تشغيل',
                            onPressed: () => value.isPlaying
                                ? activeController.pause()
                                : activeController.play(),
                            icon: Icon(value.isPlaying ? Icons.pause : Icons.play_arrow),
                          ),
                        ),
                        IconButton.filledTonal(
                          tooltip: 'تقديم 10 ثوانٍ',
                          onPressed: () => _seekBy(const Duration(seconds: 10)),
                          icon: const Icon(Icons.forward_10),
                        ),
                      ],
                    ),
                  ],
                  if (_failed) ...[
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: () {
                        _controller?.dispose();
                        _controller = null;
                        setState(() {
                          _failed = false;
                          _status = 'جاري إعادة المحاولة…';
                        });
                        _initialize();
                      },
                      icon: const Icon(Icons.refresh),
                      label: const Text('إعادة المحاولة'),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'لا يتم فتح تطبيق خارجي أو كشف عنوان المصدر الحقيقي عند الفشل.',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
