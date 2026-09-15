import 'dart:async';

import 'package:al_qahtani/src/background_download_contract.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('background coordinator exposes completed only after final-file verification', () async {
    final bridge = _FakeBridge();
    var verified = false;
    final coordinator = BackgroundDownloadCoordinator(
      bridge,
      completionVerifier: (event) async {
        expect(event.receivedBytes, 100);
        expect(event.totalBytes, 100);
        await Future<void>.delayed(Duration.zero);
        return verified;
      },
    );
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
    expect(coordinator.stateFor('episode-7')?.state, BackgroundDownloadState.verifying);
    await Future<void>.delayed(Duration.zero);
    expect(coordinator.stateFor('episode-7')?.state, BackgroundDownloadState.failed);
    expect(coordinator.stateFor('episode-7')?.errorCode, 'FINAL_FILE_VERIFICATION_FAILED');

    final verifiedBridge = _FakeBridge();
    verified = true;
    final verifiedCoordinator = BackgroundDownloadCoordinator(
      verifiedBridge,
      completionVerifier: (_) async => verified,
    );
    addTearDown(() async {
      await verifiedCoordinator.dispose();
      await verifiedBridge.dispose();
    });
    await verifiedCoordinator.enqueue(BackgroundDownloadRequest(
      taskId: 'movie-1',
      uri: Uri.parse('https://example.test/api/cinema/media?id=opaque2&download=1'),
      resumeKey: 'movie:1',
      fallbackName: 'Movie 1',
    ));
    verifiedBridge.emit(const BackgroundDownloadEvent(
      taskId: 'movie-1',
      state: BackgroundDownloadState.completed,
      receivedBytes: 838400000,
      totalBytes: 838400000,
    ));
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);
    expect(verifiedCoordinator.stateFor('movie-1')?.state, BackgroundDownloadState.completed);
  });

  test('background coordinator rejects native completion when no verifier is installed', () async {
    final bridge = _FakeBridge();
    final coordinator = BackgroundDownloadCoordinator(bridge);
    addTearDown(() async {
      await coordinator.dispose();
      await bridge.dispose();
    });
    await coordinator.enqueue(BackgroundDownloadRequest(
      taskId: 'movie-unverified',
      uri: Uri.parse('https://example.test/api/cinema/media?id=opaque&download=1'),
      resumeKey: 'movie:unverified',
      fallbackName: 'movie.mp4',
    ));
    bridge.emit(const BackgroundDownloadEvent(
      taskId: 'movie-unverified',
      state: BackgroundDownloadState.completed,
      receivedBytes: 10,
      totalBytes: 10,
    ));
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);
    expect(coordinator.stateFor('movie-unverified')?.state, BackgroundDownloadState.failed);
    expect(coordinator.stateFor('movie-unverified')?.errorCode, 'FINAL_FILE_VERIFICATION_FAILED');
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
