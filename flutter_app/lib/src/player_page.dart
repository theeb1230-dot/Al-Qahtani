import 'dart:async';

import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'api_client.dart';
import 'app_target.dart';
import 'library_store.dart';
import 'media_format_policy.dart';
import 'models.dart';
import 'player_controls.dart';
import 'web_playback_event.dart';

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
  WebViewController? _webController;
  Timer? _progressTimer;
  Timer? _nativeStartupTimer;
  Timer? _webStartupTimer;
  String _status = 'جاري تجهيز المشاهدة…';
  String _resolvedMediaPath = '';
  String _resolvedMediaType = '';
  bool _failed = false;
  bool _usingWebFallback = false;
  bool _nativeFailureInFlight = false;
  bool _webPlaybackStarted = false;
  double _playbackSpeed = 1.0;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    _nativeStartupTimer?.cancel();
    _webStartupTimer?.cancel();
    _nativeFailureInFlight = false;
    _webPlaybackStarted = false;
    try {
      var mediaPath = widget.mediaPath;
      var mediaType = widget.mediaType;
      if (mediaPath.isEmpty) {
        final TitleDetails resolved = await widget.api.resolvePlayback(widget.sourceRef);
        mediaPath = resolved.mediaPath;
        mediaType = resolved.mediaType;
      }
      _resolvedMediaPath = mediaPath;
      _resolvedMediaType = mediaType;
      if (!mounted) return;
      final controller = VideoPlayerController.networkUrl(
        widget.api.mediaUri(mediaPath),
        formatHint: videoFormatHintForRuntimeMedia(mediaType),
      );
      _controller = controller;
      controller.addListener(_nativeValueChanged);
      await controller.initialize().timeout(const Duration(seconds: 25));
      await controller.setPlaybackSpeed(_playbackSpeed);
      if (!mounted || controller != _controller) return;
      final resume = widget.store.resumePosition(widget.item.ref, episodeId: widget.episodeId);
      if (resume >= const Duration(seconds: 5) && (controller.value.duration <= Duration.zero || resume < controller.value.duration)) {
        await controller.seekTo(resume);
      }
      setState(() {
        _failed = false;
        _usingWebFallback = false;
        _status = 'جاهز للمشاهدة • ${runtimeMediaLabel(mediaType)}';
      });
      _progressTimer?.cancel();
      _progressTimer = Timer.periodic(const Duration(seconds: 5), (_) => _saveProgress());
      await controller.play();
      _nativeStartupTimer = Timer(const Duration(seconds: 12), () {
        if (!mounted || controller != _controller || _usingWebFallback) return;
        final value = controller.value;
        final neverStarted = value.position < const Duration(milliseconds: 500) && !value.isPlaying;
        if (value.hasError || neverStarted) {
          unawaited(_fallbackFromNative('تعذر بدء التشغيل بالمشغل الأصلي'));
        }
      });
    } catch (_) {
      await _fallbackFromNative('تعذر تشغيل هذا المصدر داخل المشغل الأصلي');
    }
  }

  void _nativeValueChanged() {
    final controller = _controller;
    if (controller == null || _usingWebFallback || _nativeFailureInFlight) return;
    if (controller.value.hasError) {
      unawaited(_fallbackFromNative('تعذر استمرار التشغيل بالمشغل الأصلي'));
    }
  }

  Future<void> _fallbackFromNative(String failureMessage) async {
    if (_nativeFailureInFlight) return;
    _nativeFailureInFlight = true;
    _nativeStartupTimer?.cancel();
    final controller = _controller;
    if (controller != null) {
      controller.removeListener(_nativeValueChanged);
      try {
        await controller.pause();
      } catch (_) {}
      try {
        await controller.dispose();
      } catch (_) {}
    }
    _controller = null;
    _progressTimer?.cancel();
    if (!mounted) return;
    if (!isTvTarget && _resolvedMediaPath.isNotEmpty) {
      await _startInternalWebFallback();
      return;
    }
    setState(() {
      _failed = true;
      _usingWebFallback = false;
      _status = failureMessage;
    });
    _nativeFailureInFlight = false;
  }

  Future<void> _startInternalWebFallback() async {
    final opaqueMedia = widget.api.mediaUri(_resolvedMediaPath);
    final resume = widget.store.resumePosition(widget.item.ref, episodeId: widget.episodeId);
    final playerUri = Uri.parse('https://theeb1230-dot.github.io/Al-Qahtani/Player.html').replace(
      queryParameters: {
        'url': opaqueMedia.toString(),
        'type': _resolvedMediaType.trim().isEmpty ? 'stream' : _resolvedMediaType,
        'name': widget.title,
        if (resume >= const Duration(seconds: 5)) 'resume': '${resume.inMilliseconds / 1000}',
      },
    );
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF101827))
      ..addJavaScriptChannel('AlQahtaniPlayer', onMessageReceived: _handleWebPlaybackMessage)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (request) {
          final uri = Uri.tryParse(request.url);
          if (uri == null) return NavigationDecision.prevent;
          final allowed = uri.host == 'theeb1230-dot.github.io' || uri.host == 'al-qahtani-api.onrender.com';
          return allowed ? NavigationDecision.navigate : NavigationDecision.prevent;
        },
        onWebResourceError: (error) {
          final isMainFrame = error.isForMainFrame ?? true;
          if (!mounted || !_usingWebFallback || !isMainFrame) return;
          _webStartupTimer?.cancel();
          setState(() {
            _failed = true;
            _usingWebFallback = false;
            _status = 'تعذر تشغيل المصدر في المشغلين الأصلي والويب الداخلي';
          });
        },
      ))
      ..loadRequest(playerUri);
    if (!mounted) return;
    setState(() {
      _webController = controller;
      _usingWebFallback = true;
      _webPlaybackStarted = false;
      _failed = false;
      _status = 'جارٍ تجربة محرك الويب الداخلي…';
    });
    _webStartupTimer?.cancel();
    _webStartupTimer = Timer(const Duration(seconds: 25), () {
      if (!mounted || !_usingWebFallback || _webPlaybackStarted) return;
      setState(() {
        _failed = true;
        _usingWebFallback = false;
        _status = 'لم يبدأ تشغيل المصدر داخل المهلة المحددة';
      });
    });
    _nativeFailureInFlight = false;
  }

  void _handleWebPlaybackMessage(JavaScriptMessage message) {
    final event = WebPlaybackEvent.tryParse(message.message);
    if (event == null || !mounted || !_usingWebFallback) return;
    switch (event.type) {
      case 'playing':
        _webStartupTimer?.cancel();
        if (!_webPlaybackStarted) {
          setState(() {
            _webPlaybackStarted = true;
            _failed = false;
            _status = 'يعمل الآن عبر محرك الويب الداخلي';
          });
        }
        break;
      case 'progress':
      case 'ended':
        if (!_webPlaybackStarted || event.position < const Duration(milliseconds: 500)) return;
        unawaited(widget.store.recordProgress(
          item: widget.item,
          position: event.position,
          duration: event.duration,
          episodeId: widget.episodeId,
          episodeNumber: widget.episodeNumber,
        ));
        break;
      case 'error':
        _webStartupTimer?.cancel();
        setState(() {
          _failed = true;
          _usingWebFallback = false;
          _status = _webPlaybackStarted ? 'انقطع التشغيل داخل محرك الويب الداخلي' : 'تعذر بدء التشغيل داخل محرك الويب الداخلي';
        });
        break;
    }
  }

  Future<void> _saveProgress() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized || !controller.value.isPlaying) return;
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
    _nativeStartupTimer?.cancel();
    _webStartupTimer?.cancel();
    _progressTimer?.cancel();
    _saveProgress();
    _controller?.removeListener(_nativeValueChanged);
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
                  if (_usingWebFallback && _webController != null)
                    Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(18), child: WebViewWidget(controller: _webController!)))
                  else if (activeController != null)
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
                  if (_usingWebFallback)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text('المصدر يبقى خلف وسيط القحطاني ولا يتم فتح تطبيق خارجي.', textAlign: TextAlign.center),
                    ),
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
                        _webController = null;
                        _webStartupTimer?.cancel();
                        setState(() {
                          _failed = false;
                          _usingWebFallback = false;
                          _webPlaybackStarted = false;
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
