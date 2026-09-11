#!/usr/bin/env node
import { parseWatch } from "../server/basri-source.mjs";

function assert(condition, message, detail = {}) {
  if (!condition) {
    console.error("FAIL", message, detail);
    process.exitCode = 1;
    return false;
  }
  console.log("PASS", message, detail);
  return true;
}

const html = `
<video poster="https://img.downet.net/thumb/default.jpg">
  <source src="https://s1.downet.net/download/token/movie.mkv">
</video>
<script src="https://akwam.ss/style/assets/js/player.js"></script>
<img src="https://img.downet.net/thumb/32x32/default.jpg">
<script>const src = "https://s2.downet.net/media/token/movie.mp4";</script>
<script>const file = "https://s3.downet.net/media/token/movie.m3u8";</script>
`;

const parsed = parseWatch(html, "https://akwam.ss/watch/1/2/example");
assert(parsed.status === "success", "watch parser finds media candidates", parsed);
assert(parsed.candidates.length === 3, "watch parser excludes page assets", { candidates: parsed.candidates });
assert(parsed.candidates[0].endsWith("movie.m3u8"), "HLS is preferred when present", { first: parsed.candidates[0] });
assert(parsed.candidates[1].endsWith("movie.mp4"), "MP4 is preferred before Matroska", { second: parsed.candidates[1] });
assert(parsed.candidates[2].endsWith("movie.mkv"), "Matroska remains visible for server-side classification", { third: parsed.candidates[2] });
assert(!parsed.candidates.some(url => /\.(?:jpg|js)$/i.test(url)), "image/script assets never become media candidates");

if (process.exitCode) process.exit(process.exitCode);
