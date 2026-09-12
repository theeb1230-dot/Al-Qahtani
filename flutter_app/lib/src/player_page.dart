import 'dart:async';

import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import 'api_client.dart';
import 'app_target.dart';
import 'library_store.dart';
import 'media_format_policy.dart';
import 'models.dart';
import 'player_controls.dart';

class PlayerPage extends StatefulWidget {
  const PlayerPage({
    super.key,
    required this.api,
    required this.store,
    required this.item,
    required this.title,
    this.sourceRef = '',
    this.mediaPath = '',
    this.mediaType = '',
    this.episodeId = '',
    this.episodeNumber,
  });

  final AlQahtaniApi api;
  final LocalLibraryStore store;
  final CatalogItem item;
  final String title;
  final String sourceRef;
  final String mediaPath;
  final String mediaType;
  final String episodeId;
  final int? episodeNumber;

  @override
  State<PlayerPage> createState() => _PlayerPageState();
}

class _PlayerPageState extends State<PlayerPage> {
  VideoPlayerController? _controller;
  Timer? _progressTimer;
  String _status = 'جاري تجهيز المشاهدة…';
  bool _failed = false;
  double _playbackSpeed = 1.0;

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
      final controller = VideoPlayerController.networkUrl(
        widget.api.mediaUri(mediaPath),
        formatHint: videoFormatHintForRuntimeMedia(mediaType),
      );
      _controller = controller;
      await controller.initialize();
      await controller.setPlaybackSpeed(_playbackSpeed);
      if (!mounted) return;
      final resume = widget.store.resumePosition(widget.item.ref, episodeId: widget.episodeId);
      if (resume >= const Duration(seconds: 5) && (controller.value.duration <= Duration.zero || resume < controller.value.duration)) {
        await controller.seekTo(resume);
      }
      setState(() {
        _failed = false;
        _status = 'جاهز للمشاهدة • ${runtimeMediaLabel(mediaType)}';
      });
      _progressTimer?.cancel();
      _progressTimer = Timer.periodic(const Duration(seconds: 5), (_) => _saveProgress());
      await controller.play();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _failed = true;
        _status = 'تعذر تشغيل هذا المصدر داخل التطبيق حاليًا';
      });
    }
  }

  Future<void> _saveProgress() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;
    await widget.store.recordProgress(
      item: widget.item,
      position: controller.value.position,
      duration: controller.value.duration,
      episodeId: widget.episodeId,
      episodeNumber: widget.episodeNumber,
    );
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

  Future<void> _togglePlay(VideoPlayerController controller) async {
    if (controller.value.isPlaying) {
      await controller.pause();
    } else {
      await controller.play();
    }
  }

  Future<void> _setPlaybackSpeed(double speed) async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;
    await controller.setPlaybackSpeed(speed);
    if (!mounted) return;
    setState(() => _playbackSpeed = speed);
  }

  @override
  void dispose() {
    _progressTimer?.cancel();
    _saveProgress();
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
              padding: EdgeInsets.all(isTvTarget ? 28 : 16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (activeController != null)
                    AspectRatio(
                      aspectRatio: activeController.value.aspectRatio > 0 ? activeController.value.aspectRatio : 16 / 9,
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
                      allowScrubbing: !isTvTarget,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    if (isTvTarget)
                      const Padding(
                        padding: EdgeInsets.only(bottom: 10),
                        child: Text('استخدم أزرار الريموت للتنقل، والرجوع/التقديم يتم بخطوات 10 ثوانٍ.'),
                      ),
                    ValueListenableBuilder<VideoPlayerValue>(
                      valueListenable: activeController,
                      builder: (context, value, _) => PlayerControls(
                        isPlaying: value.isPlaying,
                        isTv: isTvTarget,
                        playbackSpeed: _playbackSpeed,
                        onRewind: () => _seekBy(const Duration(seconds: -10)),
                        onTogglePlay: () => _togglePlay(activeController),
                        onForward: () => _seekBy(const Duration(seconds: 10)),
                        onPlaybackSpeedChanged: _setPlaybackSpeed,
                      ),
                    ),
                  ],
                  if (_failed) ...[
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      autofocus: isTvTarget,
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
                    const Text('لا يتم فتح تطبيق خارجي أو كشف عنوان المصدر الحقيقي عند الفشل.', textAlign: TextAlign.center),
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
