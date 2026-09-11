#!/usr/bin/env node
const MATCHES = "https://api.albasritv1.workers.dev/";
const NEWS = "https://news.albesriali03.workers.dev/";
const CINEMA = "https://albas.albesriali03.workers.dev/";
const SOURCE = "https://akwam.ss";
const ORIGIN = "https://www.albasritv.abrdns.com";
const SAFARI_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

async function request(url, init = {}, timeoutMs = 45000) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store", redirect: "follow" });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { ok: res.ok, status: res.status, headers: res.headers, data, text, ms: Date.now() - started, finalUrl: res.url };
  } finally { clearTimeout(timer); }
}

function assert(cond, message, detail = {}) {
  if (!cond) {
    console.error("FAIL", message, detail);
    process.exitCode = 1;
    return false;
  }
  console.log("PASS", message, detail);
  return true;
}

const safeRef = value => {
  const raw = String(value || "");
  try {
    const url = new URL(raw);
    url.pathname = url.pathname.split("/").map(segment => encodeURIComponent(decodeURIComponent(segment))).join("/");
    return url.href;
  } catch {
    return encodeURI(raw);
  }
};
const jsonHeaders = (page, extra = {}) => ({
  Accept: "application/json",
  Origin: ORIGIN,
  Referer: safeRef(ORIGIN + page),
  "X-BSR-Page": page,
  ...extra,
});
const htmlHeaders = (referer = SOURCE + "/") => ({
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7",
  "User-Agent": SAFARI_UA,
  Referer: safeRef(referer),
});

function uniqueMatches(text, re) {
  const out = [];
  for (const m of text.matchAll(re)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

async function matchesSmoke() {
  const page = "/2026/09/matches.html";
  const session = await request(MATCHES + "session", { headers: jsonHeaders(page) });
  if (!assert(session.ok && session.data?.success === true && session.data?.token, "matches session", { status: session.status, ms: session.ms })) return;
  const list = await request(MATCHES, { headers: jsonHeaders(page, { "X-BSR-Token": String(session.data.token) }) });
  if (assert(list.ok && list.data?.success === true && Array.isArray(list.data?.data) && list.data.data.length > 0, "matches list", { status: list.status, count: list.data?.data?.length, ms: list.ms })) {
    const sample = list.data.data.slice(0, 4).map(match => ({
      keys: Object.keys(match || {}),
      team1: match?.team1,
      team2: match?.team2,
      homeLogoFields: Object.fromEntries(Object.entries(match || {}).filter(([key]) => /(?:team1|home).*(?:logo|image|img|badge|crest|icon|photo|avatar)/i.test(key))),
      awayLogoFields: Object.fromEntries(Object.entries(match || {}).filter(([key]) => /(?:team2|away).*(?:logo|image|img|badge|crest|icon|photo|avatar)/i.test(key))),
    }));
    console.log("INFO match logo payload sample", JSON.stringify(sample, null, 2));
  }
}

async function workerProbe() {
  const page = "/2026/09/movies-series.html";
  const probe = await request(CINEMA + "session", { headers: jsonHeaders(page) }, 20000);
  if (probe.ok && probe.data?.token) console.log("INFO cinema worker session available", { status: probe.status, ms: probe.ms });
  else console.log("INFO cinema worker unavailable; backend direct fallback is required", { status: probe.status, message: probe.data?.message || "", ms: probe.ms });
}

async function cinemaDirectSmoke() {
  const category = await request(SOURCE + "/series?section=30", { headers: htmlHeaders() });
  if (!assert(category.ok && category.text.length > 20000, "direct cinema category HTML", { status: category.status, bytes: category.text.length, ms: category.ms })) return;
  const series = uniqueMatches(category.text, /href=["'](https:\/\/akwam\.ss\/series\/[^"']+)["']/gi);
  if (!assert(series.length > 0, "direct cinema category has items", { count: series.length })) return;

  const search = await request(SOURCE + "/search?q=" + encodeURIComponent("الذئب الوحيد"), { headers: htmlHeaders() });
  assert(search.ok, "direct cinema search reachable", { status: search.status, bytes: search.text.length, ms: search.ms });

  const detail = await request(series[0], { headers: htmlHeaders(SOURCE + "/series?section=30") });
  if (!assert(detail.ok, "direct cinema details", { status: detail.status, ms: detail.ms })) return;
  const episodes = uniqueMatches(detail.text, /href=["'](https:\/\/akwam\.ss\/episode\/[^"']+)["']/gi);
  if (!assert(episodes.length > 0, "direct cinema details has episodes", { count: episodes.length })) return;

  const episode = await request(episodes.at(-1), { headers: htmlHeaders(series[0]) });
  if (!assert(episode.ok, "direct cinema episode", { status: episode.status, ms: episode.ms })) return;
  const watch = uniqueMatches(episode.text, /href=["'](https:\/\/akwam\.ss\/watch\/[^"']+)["']/gi);
  if (!assert(watch.length > 0, "direct cinema episode has watch source", { count: watch.length })) return;

  const watchPage = await request(watch[0], { headers: htmlHeaders(episodes.at(-1)) });
  if (!assert(watchPage.ok, "direct cinema watch page", { status: watchPage.status, ms: watchPage.ms })) return;
  const media = uniqueMatches(watchPage.text, /<source[^>]+src=["'](https:\/\/[^"']+)["']/gi);
  if (!assert(media.length > 0, "direct cinema watch resolves media", { count: media.length })) return;

  try {
    const range = await fetch(media[0], {
      method: "GET",
      redirect: "follow",
      headers: { Range: "bytes=0-1023", Referer: safeRef(watch[0]), "User-Agent": SAFARI_UA, Accept: "*/*" },
    });
    try {
      assert(range.status === 206 || range.status === 200, "direct media responds to Safari range probe", {
        status: range.status,
        contentRange: range.headers.get("content-range") || "",
        acceptRanges: range.headers.get("accept-ranges") || "",
        contentType: range.headers.get("content-type") || "",
      });
    } finally {
      try { await range.body?.cancel(); } catch {}
    }
  } catch (error) {
    const code = String(error?.cause?.code || error?.code || "");
    if (["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT"].includes(code)) {
      console.log("INFO direct media has legacy TLS chain; backend proxy compatibility path must handle it", { code });
    } else {
      throw error;
    }
  }
}

async function newsSmoke() {
  const page = "/2026/09/news.html";
  const result = await request(NEWS + "?_=" + Date.now(), { headers: jsonHeaders(page) });
  const shapeOk = result.ok && result.data && (result.data.status === "success" || result.data.success === true);
  assert(shapeOk, "news JSON endpoint", { status: result.status, ms: result.ms });
}

await matchesSmoke().catch(e => { console.error("FAIL matches smoke", e); process.exitCode = 1; });
await workerProbe().catch(e => console.log("INFO cinema worker probe failed", String(e?.message || e)));
await cinemaDirectSmoke().catch(e => { console.error("FAIL direct cinema smoke", e); process.exitCode = 1; });
await newsSmoke().catch(e => { console.error("FAIL news smoke", e); process.exitCode = 1; });
