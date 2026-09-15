import 'dart:async';

/// Native boundary for background download execution.
///
/// Native completion is never equivalent to a user-visible completed download.
/// A completion verifier must confirm the final local file before this contract
/// exposes [BackgroundDownloadState.completed].
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

enum BackgroundDownloadState { queued, running, paused, verifying, completed, failed, cancelled }

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

  BackgroundDownloadEvent copyWith({
    BackgroundDownloadState? state,
    int? receivedBytes,
    int? totalBytes,
    String? errorCode,
  }) {
    return BackgroundDownloadEvent(
      taskId: taskId,
      state: state ?? this.state,
      receivedBytes: receivedBytes ?? this.receivedBytes,
      totalBytes: totalBytes ?? this.totalBytes,
      errorCode: errorCode ?? this.errorCode,
    );
  }
}

typedef BackgroundCompletionVerifier = Future<bool> Function(BackgroundDownloadEvent event);

class BackgroundDownloadCoordinator {
  BackgroundDownloadCoordinator(
    this.bridge, {
    BackgroundCompletionVerifier? completionVerifier,
  }) : _completionVerifier = completionVerifier ?? _rejectUnverifiedCompletion {
    _subscription = bridge.events.listen((event) {
      unawaited(_onEvent(event));
    });
  }

  final BackgroundDownloadBridge bridge;
  final BackgroundCompletionVerifier _completionVerifier;
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
    _publish(BackgroundDownloadEvent(taskId: request.taskId, state: BackgroundDownloadState.queued));
    await bridge.enqueue(request);
  }

  Future<void> cancel(String taskId) async {
    if (taskId.trim().isEmpty) throw const BackgroundDownloadException('INVALID_BACKGROUND_TASK');
    await bridge.cancel(taskId);
  }

  Future<void> _onEvent(BackgroundDownloadEvent event) async {
    final previous = _latest[event.taskId];
    if (previous != null && _isTerminal(previous.state)) return;
    _validateProgress(event);

    if (event.state != BackgroundDownloadState.completed) {
      _publish(event);
      return;
    }

    // A native/background task saying "completed" only means transfer ended.
    // User-visible completion is gated on final local-file verification.
    _publish(event.copyWith(state: BackgroundDownloadState.verifying));
    var verified = false;
    try {
      verified = await _completionVerifier(event);
    } catch (_) {
      verified = false;
    }
    final current = _latest[event.taskId];
    if (current != null && _isTerminal(current.state)) return;
    if (verified) {
      _publish(event);
    } else {
      _publish(event.copyWith(
        state: BackgroundDownloadState.failed,
        errorCode: 'FINAL_FILE_VERIFICATION_FAILED',
      ));
    }
  }

  void _validateProgress(BackgroundDownloadEvent event) {
    if (event.receivedBytes < 0 || (event.totalBytes != null && event.totalBytes! < event.receivedBytes)) {
      throw const BackgroundDownloadException('INVALID_BACKGROUND_PROGRESS');
    }
  }

  void _publish(BackgroundDownloadEvent event) {
    _latest[event.taskId] = event;
    _controller.add(event);
  }

  static Future<bool> _rejectUnverifiedCompletion(BackgroundDownloadEvent _) async => false;

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
