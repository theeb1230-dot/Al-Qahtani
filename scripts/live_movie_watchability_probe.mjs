#!/usr/bin/env node
import { directDetails, directWatch, fetchSourceHtml } from "../server/basri-source.mjs";

const TARGET = "https://akwam.ss/movie/11343/grand-theft-auto-vi-an-extended-look";
const SAFARI_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

function classify(bytes, contentType = "") {
  const type = String(contentType || "").toLowerCase();
  const mp4 = bytes.length >= 12 && Buffer.from(bytes.subarray(4, 8)).toString("ascii") === "ftyp";
  const ts = bytes.length >= 188 && bytes[0] === 0x47 && (bytes.length < 376 || bytes[188] === 0x47);
  const hls = Buffer.from(bytes.subarray(0, 64)).toString("utf8").trimStart().startsWith("#EXTM3U");
  const matroska = bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (mp4 || type.includes("video/mp4")) return "mp4";
  if (ts || type.includes("video/mp2t")) return "mpeg-ts";
  if (hls || type.includes("mpegurl")) return "hls";
  if (matroska || type.includes("matroska") || type.includes("webm")) return "matroska-webm";
  return "unknown";
}

async function probeMedia(url, referer) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Range: "bytes=0-4095",
        Referer: referer,
        "User-Agent": SAFARI_UA,
        Accept: "*/*",
      },
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    return {
      status: response.status,
      contentType: response.headers.get("content-type") || "",
      contentDisposition: response.headers.get("content-disposition") || "",
      contentRange: response.headers.get("content-range") || "",
      acceptRanges: response.headers.get("accept-ranges") || "",
      finalUrl: response.url,
      bytes: bytes.length,
      kind: classify(bytes, response.headers.get("content-type") || ""),
      first16: Buffer.from(bytes.subarray(0, 16)).toString("hex"),
    };
  } finally {
    clearTimeout(timer);
  }
}

const details = await directDetails(TARGET);
console.log("INFO movie details", {
  title: details.movie_title,
  watch: details.watch,
  downloads: details.downloads,
});
if (!Array.isArray(details.watch) || details.watch.length === 0) throw new Error("MOVIE_HAS_NO_WATCH_LINK");

let playable = 0;
for (const watchUrl of details.watch.slice(0, 3)) {
  const watch = await directWatch(watchUrl, TARGET);
  console.log("INFO watch parse", { watchUrl, status: watch.status, candidates: watch.candidates });
  for (const media of (watch.candidates || []).slice(0, 3)) {
    try {
      const result = await probeMedia(media, watchUrl);
      console.log("INFO media probe", { watchUrl, mediaHost: new URL(media).hostname, ...result });
      if (["mp4", "mpeg-ts", "hls"].includes(result.kind) && [200, 206].includes(result.status) && !/attachment/i.test(result.contentDisposition)) playable += 1;
    } catch (error) {
      const code = String(error?.cause?.code || error?.code || "");
      console.log("INFO media probe failed", { watchUrl, mediaHost: new URL(media).hostname, code, message: String(error?.message || error) });
    }
  }
}

if (!playable) throw new Error("MOVIE_WATCH_LINKS_RESOLVE_TO_NO_PLAYABLE_MEDIA");
console.log("PASS problematic movie resolves at least one playable watch source", { playable });
