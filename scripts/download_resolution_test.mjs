process.env.NODE_ENV = "test";

const {
  __createMediaReferenceForTest,
  __extractDownloadCandidatesForTest,
  __mediaReferenceTargetForTest,
  __resetMediaReferenceTtlForTest,
} = await import("../server/app.mjs");

try {
  const html = `
    <html><body>
      <a href="https://video.downet.net/stream/master.m3u8">مشاهدة</a>
      <a href="https://files.downet.net/download/episode-01.mp4">تحميل MP4</a>
    </body></html>`;

  const candidates = __extractDownloadCandidatesForTest(
    html,
    "https://akwam.ss/download/example",
  );
  if (!candidates.includes("https://files.downet.net/download/episode-01.mp4")) {
    throw new Error("DIRECT_DOWNLOAD_MP4_NOT_DISCOVERED");
  }

  const ref = __createMediaReferenceForTest(
    "https://video.downet.net/stream/master.m3u8",
    "https://akwam.ss/watch/example",
    {
      title: "Episode 1",
      downloadUrl: "https://files.downet.net/download/episode-01.mp4",
      downloadReferer: "https://akwam.ss/download/example",
    },
  );

  const playbackTarget = __mediaReferenceTargetForTest(ref, false);
  const downloadTarget = __mediaReferenceTargetForTest(ref, true);
  if (playbackTarget !== "https://video.downet.net/stream/master.m3u8") {
    throw new Error("PLAYBACK_TARGET_CHANGED");
  }
  if (downloadTarget !== "https://files.downet.net/download/episode-01.mp4") {
    throw new Error("DOWNLOAD_TARGET_NOT_INDEPENDENT");
  }

  console.log("Independent watch/download resolution regression passed");
} finally {
  __resetMediaReferenceTtlForTest();
}
