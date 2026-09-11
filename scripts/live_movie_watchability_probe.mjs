#!/usr/bin/env node
import { directDetails, directWatch } from "../server/basri-source.mjs";
import { createServer } from "../server/app.mjs";

const TARGET = "https://akwam.ss/movie/11343/grand-theft-auto-vi-an-extended-look";

const details = await directDetails(TARGET);
console.log("INFO movie details", {
  title: details.movie_title,
  watch: details.watch,
  downloads: details.downloads,
});
if (!Array.isArray(details.watch) || details.watch.length === 0) throw new Error("MOVIE_HAS_NO_WATCH_LINK");

for (const watchUrl of details.watch.slice(0, 2)) {
  const watch = await directWatch(watchUrl, TARGET);
  console.log("INFO watch parse", { watchUrl, status: watch.status, mediaType: watch.media_type, candidates: watch.candidates });
  if (!Array.isArray(watch.candidates) || watch.candidates.length === 0) throw new Error("WATCH_HAS_NO_MEDIA_CANDIDATES");
  if (watch.candidates.some(url => /\.(?:jpe?g|png|svg|js)(?:$|\?)/i.test(url))) throw new Error("WATCH_PARSER_LEAKED_PAGE_ASSET");
  if (!watch.candidates.every(url => /\.(?:mkv|mp4|m3u8|ts|m2ts|webm)(?:$|\?)/i.test(url))) throw new Error("WATCH_PARSER_RETURNED_NON_MEDIA_URL");
}

const server = createServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
try {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("BACKEND_ADDRESS_UNAVAILABLE");
  const base = `http://127.0.0.1:${address.port}`;
  const ref = `legacy:${encodeURIComponent(TARGET)}`;
  const response = await fetch(`${base}/api/cinema/details?ref=${encodeURIComponent(ref)}`, {
    headers: { Origin: "https://theeb1230-dot.github.io" },
  });
  const data = await response.json();
  console.log("INFO backend movie classification", {
    status: response.status,
    source: data.source,
    mediaType: data.media_type,
    hasMediaPath: Boolean(data.media_path),
  });
  if (!response.ok || data.status !== "success") throw new Error("BACKEND_DETAILS_FAILED");
  if (!data.media_path || !String(data.media_path).startsWith("/api/cinema/media?id=")) throw new Error("PLAYABLE_MOVIE_MISSING_OPAQUE_MEDIA_PATH");
  if (data.media_type !== "stream") throw new Error(`EXPECTED_MPEGTS_STREAM_GOT_${data.media_type}`);
  const serialized = JSON.stringify(data);
  if (serialized.includes("downet.net") || serialized.includes("akwam.ss/watch/") || serialized.includes("akwam.ss/download/")) throw new Error("DETAILS_RESPONSE_LEAKS_UPSTREAM_MEDIA_URL");

  const play = await fetch(base + data.media_path, {
    headers: {
      Origin: "https://theeb1230-dot.github.io",
      Range: "bytes=0-4095",
    },
  });
  const playBytes = new Uint8Array(await play.arrayBuffer());
  const disposition = play.headers.get("content-disposition") || "";
  const contentRange = play.headers.get("content-range") || "";
  const acceptRanges = play.headers.get("accept-ranges") || "";
  const looksTs = playBytes.length >= 188 && playBytes[0] === 0x47 && (playBytes.length < 376 || playBytes[188] === 0x47);
  console.log("INFO proxied playback", { status: play.status, disposition, contentRange, acceptRanges, looksTs, bytes: playBytes.length });
  if (play.status !== 206 && play.status !== 200) throw new Error(`PLAYBACK_PROXY_STATUS_${play.status}`);
  if (disposition) throw new Error(`PLAYBACK_MUST_NOT_BE_ATTACHMENT_${disposition}`);
  if (!looksTs) throw new Error("PLAYBACK_BYTES_ARE_NOT_MPEGTS");
  if (!contentRange && play.status === 206) throw new Error("PLAYBACK_RANGE_MISSING_CONTENT_RANGE");

  const download = await fetch(base + data.media_path + "&download=1", {
    headers: {
      Origin: "https://theeb1230-dot.github.io",
      Range: "bytes=0-255",
    },
  });
  try {
    const downloadDisposition = download.headers.get("content-disposition") || "";
    console.log("INFO explicit download", { status: download.status, disposition: downloadDisposition });
    if (!/attachment/i.test(downloadDisposition)) throw new Error("EXPLICIT_DOWNLOAD_MISSING_ATTACHMENT");
  } finally {
    try { await download.body?.cancel(); } catch {}
  }

  console.log("PASS problematic movie stays playable while upstream attachment semantics are stripped from normal playback");
} finally {
  await new Promise(resolve => server.close(resolve));
}
