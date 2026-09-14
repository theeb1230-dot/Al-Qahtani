import 'dart:async';

/// Native boundary for background download execution.
///
/// The Dart layer owns intent/state semantics. Platform implementations are
/// responsible for mapping these calls to iOS/Android background facilities.
abstract interface class BackgroundDownloadBridge {
  Future<void> enqueue(BackgroundDownloadRequest request);
  Future<void> cancel(String taskId);
  Stream<BackgroundDownloadEvent> get events;
}

class BackgroundDownloadRequest {
  const BackgroundDownloadRequest({
    required this.taskId,
    required this.uri,
    required this.resumeKey,
    required this.fallbackName,
  });

  final String taskId;
  final Uri uri;
  final String resumeKey;
  final String fallbackName;
}

enum BackgroundDownloadState { queued, running, paused, completed, failed, cancelled }

class BackgroundDownloadEvent {
  const BackgroundDownloadEvent({
    required this.taskId,
    required this.state,
    this.receivedBytes = 0,
    this.totalBytes,
    this.errorCode,
  });

  final String taskId;
  final BackgroundDownloadState state;
  final int receivedBytes;
  final int? totalBytes;
  final String? errorCode;
}

class BackgroundDownloadCoordinator {
  BackgroundDownloadCoordinator(this.bridge) {
    _subscription = bridge.events.listen(_onEvent);
  }

  final BackgroundDownloadBridge bridge;
  final Map<String, BackgroundDownloadEvent> _latest = <String, BackgroundDownloadEvent>{};
  final StreamController<BackgroundDownloadEvent> _controller = StreamController<BackgroundDownloadEvent>.broadcast();
  late final StreamSubscription<BackgroundDownloadEvent> _subscription;

  Stream<BackgroundDownloadEvent> get events => _controller.stream;

  BackgroundDownloadEvent? stateFor(String taskId) => _latest[taskId];

  Future<void> enqueue(BackgroundDownloadRequest request) async {
    if (request.taskId.trim().isEmpty || request.resumeKey.trim().isEmpty) {
      throw const BackgroundDownloadException('INVALID_BACKGROUND_TASK');
    }
    if (request.uri.path != '/api/cinema/media' || request.uri.queryParameters['download'] != '1') {
      throw const BackgroundDownloadException('INVALID_DOWNLOAD_REFERENCE');
    }
    final queued = BackgroundDownloadEvent(taskId: request.taskId, state: BackgroundDownloadState.queued);
    _onEvent(queued);
    await bridge.enqueue(request);
  }

  Future<void> cancel(String taskId) async {
    if (taskId.trim().isEmpty) throw const BackgroundDownloadException('INVALID_BACKGROUND_TASK');
    await bridge.cancel(taskId);
  }

  void _onEvent(BackgroundDownloadEvent event) {
    final previous = _latest[event.taskId];
    if (previous != null && _isTerminal(previous.state)) return;
    if (event.receivedBytes < 0 || (event.totalBytes != null && event.totalBytes! < event.receivedBytes)) {
      throw const BackgroundDownloadException('INVALID_BACKGROUND_PROGRESS');
    }
    _latest[event.taskId] = event;
    _controller.add(event);
  }

  static bool _isTerminal(BackgroundDownloadState state) =>
      state == BackgroundDownloadState.completed ||
      state == BackgroundDownloadState.failed ||
      state == BackgroundDownloadState.cancelled;

  Future<void> dispose() async {
    await _subscription.cancel();
    await _controller.close();
  }
}

class BackgroundDownloadException implements Exception {
  const BackgroundDownloadException(this.code);
  final String code;
  @override
  String toString() => 'BackgroundDownloadException($code)';
}
