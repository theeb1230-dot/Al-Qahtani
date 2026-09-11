#!/usr/bin/env node

const BASE = process.env.AL_QAHTANI_BASE || "https://al-qahtani-api.onrender.com";
const ORIGIN = "https://theeb1230-dot.github.io";
const LABEL = BASE.includes("127.0.0.1") || BASE.includes("localhost") ? "candidate" : "deployed";
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

async function waitForHealth() {
  let last;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      last = await request("/health", { timeoutMs: 15000 });
      if (last.response.ok && last.data?.status === "ok" && last.data?.cinema_source === "basri-original") return last;
    } catch (error) { last = { error }; }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`BACKEND_NOT_READY_${String(last?.response?.status || last?.error || "unknown")}`);
}

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
    pass(`${LABEL} movie Safari byte range`, { status: response.status, contentRange, acceptRanges, contentType });
    try { await response.body?.cancel(); } catch {}
  } finally {
    clearTimeout(timer);
  }
}

async function probeDownload(mediaPath) {
  const sep = mediaPath.includes("?") ? "&" : "?";
  const path = `${mediaPath}${sep}download=1`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60000);
  try {
    const response = await fetch(BASE + path, {
      headers: { Origin: ORIGIN, Range: "bytes=0-1023" },
      cache: "no-store",
      redirect: "follow",
      signal: ctl.signal,
    });
    const disposition = response.headers.get("content-disposition") || "";
    const nosniff = response.headers.get("x-content-type-options") || "";
    const contentRange = response.headers.get("content-range") || "";
    if (![200, 206].includes(response.status)) throw new Error(`DOWNLOAD_STATUS_${response.status}`);
    if (!disposition.toLowerCase().startsWith("attachment;")) throw new Error(`BAD_DOWNLOAD_DISPOSITION_${disposition}`);
    if (nosniff.toLowerCase() !== "nosniff") throw new Error(`BAD_DOWNLOAD_NOSNIFF_${nosniff}`);
    if (response.status === 206 && !/^bytes 0-1023\//.test(contentRange)) throw new Error(`BAD_DOWNLOAD_RANGE_${contentRange}`);
    pass(`${LABEL} movie bounded download stays behind proxy`, {
      status: response.status,
      disposition,
      nosniff,
      contentRange,
      path,
    });
    try { await response.body?.cancel(); } catch {}
  } finally {
    clearTimeout(timer);
  }
}

const health = await waitForHealth();
pass(`${LABEL} backend health`, { ms: health.ms, base: BASE });

let playable = null;
const diagnostics = [];
for (const [name, sourceUrl] of MOVIE_CATEGORIES) {
  const categoryPath = "/api/cinema/category?type=movie&name=" + encodeURIComponent(name) + "&url=" + encodeURIComponent(sourceUrl);
  const category = await request(categoryPath);
  const items = Array.isArray(category.data?.data) ? category.data.data : [];
  const categoryDiagnostic = { category: name, status: category.response.status, count: items.length, source: category.data?.source || "", samples: [] };
  diagnostics.push(categoryDiagnostic);
  if (!category.response.ok || category.data?.status !== "success" || items.length === 0) continue;

  for (const item of items.filter(x => x?.href).slice(0, 4)) {
    const details = await request("/api/cinema/details?ref=" + encodeURIComponent(item.href));
    categoryDiagnostic.samples.push({ title: item.title || "", status: details.response.status, state: details.data?.status || "", message: details.data?.message || "", media: Boolean(details.data?.media_path), downloads: details.data?.download_options?.length || 0 });
    if (!details.response.ok || details.data?.status !== "success") continue;
    const mediaPath = String(details.data?.media_path || "");
    if (!mediaPath.startsWith("/api/cinema/media?id=")) continue;
    playable = {
      category: name,
      title: details.data?.movie_title || item.title || "",
      source: details.data?.source || "",
      mediaPath,
      episodes: Array.isArray(details.data?.episodes) ? details.data.episodes.length : 0,
      downloadOptions: Array.isArray(details.data?.download_options) ? details.data.download_options.length : 0,
      ms: details.ms,
    };
    break;
  }
  if (playable) break;
}

if (!playable) {
  fail(`${LABEL} movie resolves real proxied playback`, { diagnostics });
  process.exit(1);
}
if (playable.episodes !== 0) {
  fail(`${LABEL} movie does not fabricate episodic structure`, playable);
  process.exit(1);
}
pass(`${LABEL} movie resolves real proxied playback`, playable);
await probeRange(playable.mediaPath);
await probeDownload(playable.mediaPath);
