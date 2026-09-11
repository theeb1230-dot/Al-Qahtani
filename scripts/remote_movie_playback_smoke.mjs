#!/usr/bin/env node

const BASE = "https://al-qahtani-api.onrender.com";
const ORIGIN = "https://theeb1230-dot.github.io";
const MOVIE_CATEGORIES = [
  ["أجنبية", "https://akwam.ss/movies?section=30"],
  ["عربية", "https://akwam.ss/movies?section=29"],
  ["هندية", "https://akwam.ss/movies?section=31"],
  ["آسيوية", "https://akwam.ss/movies?section=33"],
  ["تركية", "https://akwam.ss/movies?section=32"],
  ["أنمي", "https://akwam.ss/movies?category=30"],
];

async function request(path, { timeoutMs = 120000, headers = {} } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(BASE + path, {
      headers: { Accept: "application/json", Origin: ORIGIN, ...headers },
      cache: "no-store",
      redirect: "follow",
      signal: ctl.signal,
    });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data, text, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

function pass(name, detail = {}) { console.log("PASS", name, detail); }
function fail(name, detail = {}) { console.error("FAIL", name, detail); process.exitCode = 1; }

async function probeRange(mediaPath) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60000);
  try {
    const response = await fetch(BASE + mediaPath, {
      headers: { Origin: ORIGIN, Range: "bytes=0-1023" },
      cache: "no-store",
      redirect: "follow",
      signal: ctl.signal,
    });
    const contentRange = response.headers.get("content-range") || "";
    const acceptRanges = response.headers.get("accept-ranges") || "";
    const contentType = response.headers.get("content-type") || "";
    if (response.status !== 206) throw new Error(`RANGE_STATUS_${response.status}`);
    if (!/^bytes 0-1023\//.test(contentRange)) throw new Error(`BAD_CONTENT_RANGE_${contentRange}`);
    if (acceptRanges.toLowerCase() !== "bytes") throw new Error(`BAD_ACCEPT_RANGES_${acceptRanges}`);
    pass("deployed movie Safari byte range", { status: response.status, contentRange, acceptRanges, contentType });
    try { await response.body?.cancel(); } catch {}
  } finally {
    clearTimeout(timer);
  }
}

const health = await request("/health", { timeoutMs: 45000 });
if (!health.response.ok || health.data?.status !== "ok" || health.data?.cinema_source !== "basri-original") {
  fail("deployed backend health", { status: health.response.status, body: health.text.slice(0, 200) });
  process.exit(1);
}
pass("deployed backend health", { ms: health.ms });

let playable = null;
const diagnostics = [];
for (const [name, sourceUrl] of MOVIE_CATEGORIES) {
  const categoryPath = "/api/cinema/category?type=movie&name=" + encodeURIComponent(name) + "&url=" + encodeURIComponent(sourceUrl);
  const category = await request(categoryPath);
  const items = Array.isArray(category.data?.data) ? category.data.data : [];
  diagnostics.push({ category: name, status: category.response.status, count: items.length, source: category.data?.source || "" });
  if (!category.response.ok || category.data?.status !== "success" || items.length === 0) continue;

  for (const item of items.filter(x => x?.href).slice(0, 4)) {
    const details = await request("/api/cinema/details?ref=" + encodeURIComponent(item.href));
    if (!details.response.ok || details.data?.status !== "success") continue;
    const mediaPath = String(details.data?.media_path || "");
    if (!mediaPath.startsWith("/api/cinema/media?id=")) continue;
    playable = {
      category: name,
      title: details.data?.movie_title || item.title || "",
      source: details.data?.source || "",
      mediaPath,
      episodes: Array.isArray(details.data?.episodes) ? details.data.episodes.length : 0,
      ms: details.ms,
    };
    break;
  }
  if (playable) break;
}

if (!playable) {
  fail("deployed movie resolves real proxied playback", { diagnostics });
  process.exit(1);
}
if (playable.episodes !== 0) {
  fail("deployed movie does not fabricate episodic structure", playable);
  process.exit(1);
}
pass("deployed movie resolves real proxied playback", playable);
await probeRange(playable.mediaPath);
