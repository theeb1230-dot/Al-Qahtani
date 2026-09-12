import 'dart:async';
import 'dart:io';

import 'package:al_qahtani/src/download_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  test('download rejects any non Al-Qahtani opaque media path', () async {
    final service = DownloadService(
      client: MockClient((_) async => http.Response('ignored', 200)),
      directoryProvider: () async => Directory.systemTemp.createTemp('al-qahtani-download-test'),
    );
    addTearDown(service.close);

    expect(
      () => service.download(Uri.parse('https://example.com/video.mp4?download=1')),
      throwsA(isA<DownloadException>()),
    );
  });

  test('download requires explicit trusted download semantics', () async {
    final service = DownloadService(
      client: MockClient((_) async => http.Response('ignored', 200)),
      directoryProvider: () async => Directory.systemTemp.createTemp('al-qahtani-download-test'),
    );
    addTearDown(service.close);

    expect(
      () => service.download(Uri.parse('https://al-qahtani-api.onrender.com/api/cinema/media?id=opaque')),
      throwsA(isA<DownloadException>()),
    );
  });

  test('download writes atomically using a sanitized trusted filename', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-download-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final service = DownloadService(
      client: MockClient((request) async {
        expect(request.url.path, '/api/cinema/media');
        expect(request.url.queryParameters['download'], '1');
        return http.Response.bytes(
          <int>[1, 2, 3, 4, 5],
          200,
          headers: {'content-disposition': 'attachment; filename="episode:01?.mp4"'},
        );
      }),
      directoryProvider: () async => root,
    );
    addTearDown(service.close);

    final result = await service.download(
      Uri.parse('https://al-qahtani-api.onrender.com/api/cinema/media?id=opaque&download=1'),
      fallbackName: 'ignored-name',
    );

    expect(result.bytes, 5);
    expect(result.path, endsWith('episode_01_.mp4'));
    expect(await File(result.path).readAsBytes(), <int>[1, 2, 3, 4, 5]);
    expect(await File('${result.path}.part').exists(), isFalse);
  });

  test('interrupted partial response resumes at the exact byte using Range', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-download-resume-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final client = _ResumeClient();
    final service = DownloadService(client: client, directoryProvider: () async => root);
    addTearDown(service.close);

    final result = await service.download(
      Uri.parse('https://al-qahtani-api.onrender.com/api/cinema/media?id=opaque&download=1'),
    );

    expect(client.requests, 2);
    expect(result.bytes, 10);
    expect(await File(result.path).readAsBytes(), <int>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(await File('${result.path}.part').exists(), isFalse);
  });

  test('206 Content-Range total wins over chunk Content-Length and rejects invalid resume ranges', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-download-range-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final service = DownloadService(
      client: MockClient((_) async => http.Response.bytes(
            <int>[1, 2, 3, 4, 5],
            206,
            headers: {
              'content-range': 'bytes 0-4/10',
              'content-length': '5',
              'content-disposition': 'attachment; filename="partial.mp4"',
            },
          )),
      directoryProvider: () async => root,
    );
    addTearDown(service.close);

    await expectLater(
      service.download(Uri.parse('https://al-qahtani-api.onrender.com/api/cinema/media?id=opaque&download=1')),
      throwsA(isA<DownloadException>().having((e) => e.code, 'code', 'INCOMPLETE_DOWNLOAD')),
    );
    expect(root.listSync().whereType<File>(), isEmpty);
  });

  test('cancellation interrupts a streaming download and removes the partial file', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-download-cancel-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final controller = StreamController<List<int>>();
    final service = DownloadService(
      client: _StreamingClient(controller.stream),
      directoryProvider: () async => root,
    );
    addTearDown(() async {
      await controller.close();
      service.close();
    });
    final token = DownloadCancellationToken();
    final firstChunkSeen = Completer<void>();

    final future = service.download(
      Uri.parse('https://al-qahtani-api.onrender.com/api/cinema/media?id=opaque&download=1'),
      cancellationToken: token,
      onProgress: (progress) {
        if (progress.receivedBytes > 0 && !firstChunkSeen.isCompleted) firstChunkSeen.complete();
      },
    );
    controller.add(<int>[1, 2, 3, 4]);
    await firstChunkSeen.future;
    token.cancel();

    await expectLater(
      future,
      throwsA(isA<DownloadException>().having((e) => e.code, 'code', 'DOWNLOAD_CANCELLED')),
    );
    expect(root.listSync().whereType<File>(), isEmpty);
  });

  test('empty downloads fail closed and leave no partial file', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-download-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final service = DownloadService(
      client: MockClient((_) async => http.Response.bytes(const <int>[], 200)),
      directoryProvider: () async => root,
    );
    addTearDown(service.close);

    await expectLater(
      service.download(Uri.parse('https://al-qahtani-api.onrender.com/api/cinema/media?id=opaque&download=1')),
      throwsA(isA<DownloadException>()),
    );
    expect(root.listSync().whereType<File>(), isEmpty);
  });

  test('local download list ignores partial and empty files and sorts newest first', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-download-list-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final oldFile = File('${root.path}${Platform.pathSeparator}old.mp4')..writeAsBytesSync([1]);
    final newFile = File('${root.path}${Platform.pathSeparator}new.mp4')..writeAsBytesSync([1, 2]);
    File('${root.path}${Platform.pathSeparator}ignored.part').writeAsBytesSync([9]);
    File('${root.path}${Platform.pathSeparator}empty.mp4').writeAsBytesSync(const []);
    final now = DateTime.now();
    await oldFile.setLastModified(now.subtract(const Duration(minutes: 2)));
    await newFile.setLastModified(now);

    final service = DownloadService(directoryProvider: () async => root);
    addTearDown(service.close);

    final items = await service.listDownloads();
    expect(items.map((item) => item.name).toList(), ['new.mp4', 'old.mp4']);
    expect(items.first.bytes, 2);
  });

  test('deleteDownload deletes safe local file and rejects unsafe stored names', () async {
    final root = await Directory.systemTemp.createTemp('al-qahtani-download-delete-test');
    addTearDown(() async {
      if (await root.exists()) await root.delete(recursive: true);
    });
    final file = File('${root.path}${Platform.pathSeparator}episode-1.mp4')..writeAsBytesSync([1, 2, 3]);
    final service = DownloadService(directoryProvider: () async => root);
    addTearDown(service.close);

    expect(await service.deleteDownload('episode-1.mp4'), isTrue);
    expect(await file.exists(), isFalse);

    await expectLater(service.deleteDownload('folder/file.mp4'), throwsA(isA<DownloadException>()));
    await expectLater(service.deleteDownload('folder\\file.mp4'), throwsA(isA<DownloadException>()));
    await expectLater(service.deleteDownload('unfinished.part'), throwsA(isA<DownloadException>()));
  });
}

class _ResumeClient extends http.BaseClient {
  int requests = 0;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    requests += 1;
    if (requests == 1) {
      expect(request.headers['range'], isNull);
      return http.StreamedResponse(
        Stream.value(<int>[1, 2, 3, 4, 5]),
        206,
        request: request,
        contentLength: 5,
        headers: const {
          'content-range': 'bytes 0-4/10',
          'content-length': '5',
          'content-disposition': 'attachment; filename="resume.mp4"',
          'accept-ranges': 'bytes',
        },
      );
    }
    expect(request.headers['range'], 'bytes=5-');
    return http.StreamedResponse(
      Stream.value(<int>[6, 7, 8, 9, 10]),
      206,
      request: request,
      contentLength: 5,
      headers: const {
        'content-range': 'bytes 5-9/10',
        'content-length': '5',
        'content-disposition': 'attachment; filename="resume.mp4"',
        'accept-ranges': 'bytes',
      },
    );
  }
}

class _StreamingClient extends http.BaseClient {
  _StreamingClient(this.stream);
  final Stream<List<int>> stream;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    return http.StreamedResponse(
      stream,
      200,
      request: request,
      contentLength: 1024,
      headers: const {'content-disposition': 'attachment; filename="cancel.mp4"'},
    );
  }
}
