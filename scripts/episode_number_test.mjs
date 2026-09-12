#!/usr/bin/env node
import { parseDetails, parseWatch, rankMediaCandidates } from "../server/basri-source.mjs";

function assert(condition, message, detail = {}) {
  if (!condition) {
    console.error("FAIL", message, detail);
    process.exitCode = 1;
    return;
  }
  console.log("PASS", message, detail);
}

const html = `
<html><body>
  <a href="https://akwam.ss/episode/89517/%D8%AD%D9%84%D9%85-%D8%A3%D8%B4%D8%B1%D9%81/%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-1">الحلقة 1</a>
  <a href="https://akwam.ss/episode/89542/hulm-ashraf" aria-label="الحلقة 2">مشاهدة</a>
  <a href="https://akwam.ss/episode/89760/hulm-ashraf"><span>الحلقة 3</span></a>
</body></html>`;

const details = parseDetails(html, "https://akwam.ss/series/123/example");
assert(details.episodes.length === 3, "parses all episode anchors", { count: details.episodes.length });
assert(JSON.stringify(details.episodes.map(x => x.num)) === JSON.stringify([1, 2, 3]), "uses visible/canonical episode numbers instead of source IDs", { nums: details.episodes.map(x => x.num) });
assert(JSON.stringify(details.episodes.map(x => x.episode_number)) === JSON.stringify([1, 2, 3]), "exposes explicit episode_number", { numbers: details.episodes.map(x => x.episode_number) });
assert(JSON.stringify(details.episodes.map(x => x.episode_id)) === JSON.stringify(["89517", "89542", "89760"]), "keeps source IDs separate from displayed episode numbers", { ids: details.episodes.map(x => x.episode_id) });
assert(!details.episodes.some(x => x.num > 1000), "never promotes large source IDs to display numbers", { nums: details.episodes.map(x => x.num) });

const hls = "https://cdn1.downet.net/video/master.m3u8";
const mp4 = "https://cdn1.downet.net/video/movie.mp4";
const ts = "https://cdn1.downet.net/video/movie.ts";
const ranked = rankMediaCandidates([hls, ts, mp4]);
assert(ranked[0] === mp4, "prefers range-friendly MP4 for native app playback/download when available", { ranked });
assert(ranked[1] === hls, "keeps HLS as a supported fallback instead of discarding it", { ranked });

const watch = parseWatch(`
<html><body>
  <video><source src="${hls}"><source src="${mp4}"></video>
</body></html>`, "https://akwam.ss/watch/123/example");
assert(watch.media_src === mp4, "parseWatch returns the native/download-compatible candidate first", { media_src: watch.media_src, media_type: watch.media_type });
assert(watch.media_type === "mp4", "reports the selected media type consistently", { media_type: watch.media_type });

if (process.exitCode) process.exit(process.exitCode);
