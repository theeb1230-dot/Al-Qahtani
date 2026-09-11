#!/usr/bin/env node
const MATCHES = "https://api.albasritv1.workers.dev/";
const NEWS = "https://news.albesriali03.workers.dev/";
const CINEMA = "https://albas.albesriali03.workers.dev/";
const LEGACY_ORIGIN = "https://www.albasritv.abrdns.com";
const LEGACY_REFERER = LEGACY_ORIGIN + "/2026/09/movies-series.html";

async function json(url, init = {}) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { ok: res.ok, status: res.status, data, text: text.slice(0, 300), ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
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

const basriHeaders = extra => ({ Accept: "application/json", Origin: LEGACY_ORIGIN, Referer: LEGACY_REFERER, ...extra });

async function matchesSmoke() {
  const session = await json(MATCHES + "session", { headers: basriHeaders({ "X-BSR-Page": "/2026/09/matches.html" }) });
  if (!assert(session.ok && session.data?.success === true && session.data?.token, "matches session", { status: session.status, ms: session.ms, body: session.text })) return;
  const token = String(session.data.token);
  const list = await json(MATCHES, { headers: basriHeaders({ "X-BSR-Page": "/2026/09/matches.html", "X-BSR-Token": token }) });
  assert(list.ok && list.data?.success === true && Array.isArray(list.data?.data), "matches list", { status: list.status, ms: list.ms, count: list.data?.data?.length, body: list.text });
}

async function cinemaSmoke() {
  const session = await json(CINEMA + "session", { headers: basriHeaders({ "X-BSR-Page": "/2026/09/movies-series.html" }) });
  if (!assert(session.ok && session.data?.status === "success" && session.data?.token, "cinema session", { status: session.status, ms: session.ms, body: session.text })) return;
  const token = encodeURIComponent(String(session.data.token));
  const genreUrl = encodeURIComponent("https://akwam.ss/series?section=30");
  const genre = await json(CINEMA + "?action=genre&genre=" + genreUrl + "&p=1&token=" + token, { headers: basriHeaders({ "X-BSR-Page": "/2026/09/movies-series.html" }) });
  assert(genre.ok && genre.data?.status === "success" && Array.isArray(genre.data?.data), "cinema category", { status: genre.status, ms: genre.ms, count: genre.data?.data?.length, body: genre.text });

  const search = await json(CINEMA + "?action=search&q=" + encodeURIComponent("الذئب الوحيد") + "&token=" + token, { headers: basriHeaders({ "X-BSR-Page": "/2026/09/movies-series.html" }) });
  assert(search.ok && search.data?.status === "success" && Array.isArray(search.data?.data), "cinema search contract", { status: search.status, ms: search.ms, count: search.data?.data?.length, body: search.text });

  const sample = (search.data?.data || []).find(x => x?.href) || (genre.data?.data || []).find(x => x?.href);
  if (sample?.href) {
    const details = await json(CINEMA + "?action=series&series=" + encodeURIComponent(sample.href) + "&token=" + token, { headers: basriHeaders({ "X-BSR-Page": "/2026/09/movies-series.html" }) });
    assert(details.ok && details.data?.status === "success", "cinema details", { status: details.status, ms: details.ms, episodes: details.data?.episodes?.length, media: Boolean(details.data?.media_src), iframe: Boolean(details.data?.is_iframe), body: details.text });
  }
}

async function newsSmoke() {
  const result = await json(NEWS + "?_=" + Date.now(), { headers: basriHeaders({ "X-BSR-Page": "/2026/09/news.html" }) });
  const shapeOk = result.ok && result.data && (result.data.status === "success" || result.data.success === true);
  assert(shapeOk, "news JSON endpoint", { status: result.status, ms: result.ms, body: result.text });
}

await matchesSmoke().catch(e => { console.error("FAIL matches smoke", e); process.exitCode = 1; });
await cinemaSmoke().catch(e => { console.error("FAIL cinema smoke", e); process.exitCode = 1; });
await newsSmoke().catch(e => { console.error("FAIL news smoke", e); process.exitCode = 1; });
