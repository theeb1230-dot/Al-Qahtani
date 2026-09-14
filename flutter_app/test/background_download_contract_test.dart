import 'dart:async';

import 'package:al_qahtani/src/background_download_contract.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('background coordinator validates download references and tracks native lifecycle events', () async {
    final bridge = _FakeBridge();
    final coordinator = BackgroundDownloadCoordinator(bridge);
    addTearDown(() async {
      await coordinator.dispose();
      await bridge.dispose();
    });

    final request = BackgroundDownloadRequest(
      taskId: 'episode-7',
      uri: Uri.parse('https://example.test/api/cinema/media?id=opaque&download=1'),
      resumeKey: 'series:1:episode:7',
      fallbackName: 'Episode 7',
    );

    await coordinator.enqueue(request);
    expect(bridge.enqueued, same(request));
    expect(coordinator.stateFor('episode-7')?.state, BackgroundDownloadState.queued);

    bridge.emit(const BackgroundDownloadEvent(
      taskId: 'episode-7',
      state: BackgroundDownloadState.running,
      receivedBytes: 50,
      totalBytes: 100,
    ));
    await Future<void>.delayed(Duration.zero);
    expect(coordinator.stateFor('episode-7')?.receivedBytes, 50);

    bridge.emit(const BackgroundDownloadEvent(
      taskId: 'episode-7',
      state: BackgroundDownloadState.completed,
      receivedBytes: 100,
      totalBytes: 100,
    ));
    await Future<void>.delayed(Duration.zero);
    expect(coordinator.stateFor('episode-7')?.state, BackgroundDownloadState.completed);
  });

  test('background coordinator rejects non-runtime download references', () async {
    final bridge = _FakeBridge();
    final coordinator = BackgroundDownloadCoordinator(bridge);
    addTearDown(() async {
      await coordinator.dispose();
      await bridge.dispose();
    });

    await expectLater(
      coordinator.enqueue(BackgroundDownloadRequest(
        taskId: 'bad',
        uri: Uri.parse('https://example.test/video.mp4'),
        resumeKey: 'bad',
        fallbackName: 'bad.mp4',
      )),
      throwsA(isA<BackgroundDownloadException>().having((e) => e.code, 'code', 'INVALID_DOWNLOAD_REFERENCE')),
    );
  });
}

class _FakeBridge implements BackgroundDownloadBridge {
  final StreamController<BackgroundDownloadEvent> _events = StreamController<BackgroundDownloadEvent>.broadcast();
  BackgroundDownloadRequest? enqueued;
  String? cancelled;

  @override
  Stream<BackgroundDownloadEvent> get events => _events.stream;

  @override
  Future<void> enqueue(BackgroundDownloadRequest request) async {
    enqueued = request;
  }

  @override
  Future<void> cancel(String taskId) async {
    cancelled = taskId;
  }

  void emit(BackgroundDownloadEvent event) => _events.add(event);
  Future<void> dispose() => _events.close();
}
