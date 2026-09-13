import 'dart:io';

import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class LocalDownloadPlayerPage extends StatefulWidget {
  const LocalDownloadPlayerPage({
    super.key,
    required this.file,
    required this.title,
  });

  final File file;
  final String title;

  @override
  State<LocalDownloadPlayerPage> createState() => _LocalDownloadPlayerPageState();
}

class _LocalDownloadPlayerPageState extends State<LocalDownloadPlayerPage> {
  VideoPlayerController? _controller;
  String? _error;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      if (!await widget.file.exists() || await widget.file.length() <= 0) {
        throw const FileSystemException('LOCAL_DOWNLOAD_MISSING');
      }
      final controller = VideoPlayerController.file(widget.file);
      _controller = controller;
      await controller.initialize().timeout(const Duration(seconds: 20));
      if (!mounted || controller != _controller) return;
      setState(() => _ready = true);
      await controller.play();
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'تعذر تشغيل الملف المحمّل. قد يكون الملف مفقودًا أو غير صالح.');
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
      appBar: AppBar(title: Text(widget.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: SafeArea(
        child: Center(
          child: _error != null
              ? Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, size: 48),
                      const SizedBox(height: 12),
                      Text(_error!, textAlign: TextAlign.center),
                    ],
                  ),
                )
              : !_ready || controller == null
                  ? const CircularProgressIndicator()
                  : Column(
                      children: [
                        Expanded(
                          child: Center(
                            child: AspectRatio(
                              aspectRatio: controller.value.aspectRatio > 0 ? controller.value.aspectRatio : 16 / 9,
                              child: VideoPlayer(controller),
                            ),
                          ),
                        ),
                        _LocalControls(controller: controller),
                      ],
                    ),
        ),
      ),
    );
  }
}

class _LocalControls extends StatefulWidget {
  const _LocalControls({required this.controller});
  final VideoPlayerController controller;

  @override
  State<_LocalControls> createState() => _LocalControlsState();
}

class _LocalControlsState extends State<_LocalControls> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_changed);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_changed);
    super.dispose();
  }

  void _changed() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final value = widget.controller.value;
    final durationMs = value.duration.inMilliseconds;
    final positionMs = value.position.inMilliseconds.clamp(0, durationMs > 0 ? durationMs : 0);
    return Material(
      color: Colors.black87,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: [
            IconButton(
              tooltip: value.isPlaying ? 'إيقاف مؤقت' : 'تشغيل',
              onPressed: () async {
                if (value.isPlaying) {
                  await widget.controller.pause();
                } else {
                  await widget.controller.play();
                }
              },
              icon: Icon(value.isPlaying ? Icons.pause : Icons.play_arrow),
            ),
            Expanded(
              child: Slider(
                min: 0,
                max: durationMs > 0 ? durationMs.toDouble() : 1,
                value: durationMs > 0 ? positionMs.toDouble() : 0,
                onChanged: durationMs <= 0 ? null : (next) => widget.controller.seekTo(Duration(milliseconds: next.round())),
              ),
            ),
            Text('${_clock(value.position)} / ${_clock(value.duration)}'),
          ],
        ),
      ),
    );
  }

  static String _clock(Duration value) {
    final total = value.inSeconds;
    final hours = total ~/ 3600;
    final minutes = (total % 3600) ~/ 60;
    final seconds = total % 60;
    if (hours > 0) return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
