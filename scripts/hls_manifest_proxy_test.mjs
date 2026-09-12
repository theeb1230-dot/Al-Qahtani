process.env.NODE_ENV = "test";

const {
  __rewriteHlsManifestForTest,
  __resetMediaReferenceTtlForTest,
} = await import("../server/app.mjs");

try {
  const manifest = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-KEY:METHOD=AES-128,URI=\"keys/key.bin\"",
    "#EXT-X-MAP:URI=\"init.mp4\"",
    "#EXTINF:6.0,",
    "segment-001.ts",
    "#EXT-X-STREAM-INF:BANDWIDTH=1200000",
    "variant/playlist.m3u8",
    "#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID=\"audio\",URI=\"audio/track.m3u8\"",
    "#EXT-X-ENDLIST",
  ].join("\n");

  const rewritten = __rewriteHlsManifestForTest(
    manifest,
    "https://video.downet.net/path/master.m3u8",
    { title: "Episode 1" },
  );

  if (!rewritten.startsWith("#EXTM3U")) throw new Error("HLS_HEADER_LOST");
  if (rewritten.includes("downet.net")) throw new Error("UPSTREAM_URL_LEAKED");
  if (rewritten.includes("segment-001.ts") || rewritten.includes("keys/key.bin") || rewritten.includes("variant/playlist.m3u8")) {
    throw new Error("HLS_CHILD_URI_NOT_REWRITTEN");
  }

  const refs = rewritten.match(/\/api\/cinema\/media\?id=[A-Za-z0-9_%.-]+/g) || [];
  if (refs.length !== 5) throw new Error(`EXPECTED_5_OPAQUE_REFS_GOT_${refs.length}`);
  if (new Set(refs).size !== refs.length) throw new Error("OPAQUE_REFS_NOT_UNIQUE");

  console.log("HLS manifest opaque proxy regression passed");
} finally {
  __resetMediaReferenceTtlForTest();
}
