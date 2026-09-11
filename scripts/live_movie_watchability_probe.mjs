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
  const ref = `legacy:${encodeURIComponent(TARGET)}`;
  const response = await fetch(`http://127.0.0.1:${address.port}/api/cinema/details?ref=${encodeURIComponent(ref)}`, {
    headers: { Origin: "https://theeb1230-dot.github.io" },
  });
  const data = await response.json();
  console.log("INFO backend movie classification", {
    status: response.status,
    source: data.source,
    playbackUnavailable: data.playback_unavailable,
    playbackReason: data.playback_reason,
    unsupportedMediaTypes: data.unsupported_media_types,
    hasMediaPath: Boolean(data.media_path),
  });
  if (!response.ok || data.status !== "success") throw new Error("BACKEND_DETAILS_FAILED");
  if (data.media_path) throw new Error("UNSUPPORTED_MOVIE_EXPOSED_AS_PLAYABLE_MEDIA");
  if (data.playback_unavailable !== true) throw new Error("UNSUPPORTED_MOVIE_NOT_MARKED_UNAVAILABLE");
  if (data.playback_reason !== "UNSUPPORTED_MEDIA_CONTAINER") throw new Error(`WRONG_UNAVAILABLE_REASON_${data.playback_reason}`);
  if (!Array.isArray(data.unsupported_media_types) || !data.unsupported_media_types.includes("matroska-webm")) throw new Error("MISSING_MATROSKA_CLASSIFICATION");
  const serialized = JSON.stringify(data);
  if (serialized.includes("downet.net") || serialized.includes("akwam.ss/watch/") || serialized.includes("akwam.ss/download/")) throw new Error("DETAILS_RESPONSE_LEAKS_UPSTREAM_MEDIA_URL");
  console.log("PASS problematic movie is preserved as content but blocked from unsupported Safari playback");
} finally {
  await new Promise(resolve => server.close(resolve));
}
