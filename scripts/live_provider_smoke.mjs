#!/usr/bin/env node
const MATCHES = "https://api.albasritv1.workers.dev/";
const NEWS = "https://news.albesriali03.workers.dev/";
const CINEMA = "https://albas.albesriali03.workers.dev/";
const LEGACY_ORIGINS = [
  "https://www.albasritv.abrdns.com",
  "https://albasritv.abrdns.com",
];
const SAFARI_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

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

const headersFor = (origin, page, extra = {}) => ({
  Accept: "application/json",
  Origin: origin,
  Referer: origin + page,
  "X-BSR-Page": page,
  ...extra,
});

const cinemaHeaders = (origin, extra = {}) => headersFor(origin, "/2026/09/movies-series.html", {
  "User-Agent": SAFARI_UA,
  "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Fetch-Site": "cross-site",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
  ...extra,
});

async function matchesSmoke() {
  const origin = LEGACY_ORIGINS[0];
  const page = "/2026/09/matches.html";
  const session = await json(MATCHES + "session", { headers: headersFor(origin, page) });
  if (!assert(session.ok && session.data?.success === true && session.data?.token, "matches session", { status: session.status, ms: session.ms, body: session.text })) return;
  const token = String(session.data.token);
  const list = await json(MATCHES, { headers: headersFor(origin, page, { "X-BSR-Token": token }) });
  assert(list.ok && list.data?.success === true && Array.isArray(list.data?.data), "matches list", { status: list.status, ms: list.ms, count: list.data?.data?.length, body: list.text });
}

async function findCinemaSession() {
  let last = null;
  for (const origin of LEGACY_ORIGINS) {
    const session = await json(CINEMA + "session", { headers: cinemaHeaders(origin) });
    console.log("INFO cinema origin probe", { origin, status: session.status, message: session.data?.message || "", ms: session.ms });
    if (session.ok && session.data?.status === "success" && session.data?.token) return { origin, session };
    last = session;
    if (!(session.status === 403 && session.data?.message === "FORBIDDEN_ORIGIN")) break;
  }
  assert(false, "cinema session", { status: last?.status, body: last?.text });
  return null;
}

async function cinemaSmoke() {
  const selected = await findCinemaSession();
  if (!selected) return;
  const { origin, session } = selected;
  const token = encodeURIComponent(String(session.data.token));
  const genreUrl = encodeURIComponent("https://akwam.ss/series?section=30");
  const genre = await json(CINEMA + "?action=genre&genre=" + genreUrl + "&p=1&token=" + token, { headers: cinemaHeaders(origin) });
  assert(genre.ok && genre.data?.status === "success" && Array.isArray(genre.data?.data), "cinema category", { status: genre.status, ms: genre.ms, count: genre.data?.data?.length, body: genre.text });

  const search = await json(CINEMA + "?action=search&q=" + encodeURIComponent("الذئب الوحيد") + "&token=" + token, { headers: cinemaHeaders(origin) });
  assert(search.ok && search.data?.status === "success" && Array.isArray(search.data?.data), "cinema search contract", { status: search.status, ms: search.ms, count: search.data?.data?.length, body: search.text });

  const sample = (search.data?.data || []).find(x => x?.href) || (genre.data?.data || []).find(x => x?.href);
  if (sample?.href) {
    const details = await json(CINEMA + "?action=series&series=" + encodeURIComponent(sample.href) + "&token=" + token, { headers: cinemaHeaders(origin) });
    assert(details.ok && details.data?.status === "success", "cinema details", { status: details.status, ms: details.ms, episodes: details.data?.episodes?.length, media: Boolean(details.data?.media_src), iframe: Boolean(details.data?.is_iframe), body: details.text });
  } else {
    assert(false, "cinema sample has href", { searchCount: search.data?.data?.length, genreCount: genre.data?.data?.length });
  }
}

async function newsSmoke() {
  const origin = LEGACY_ORIGINS[0];
  const page = "/2026/09/news.html";
  const result = await json(NEWS + "?_=" + Date.now(), { headers: headersFor(origin, page) });
  const shapeOk = result.ok && result.data && (result.data.status === "success" || result.data.success === true);
  assert(shapeOk, "news JSON endpoint", { status: result.status, ms: result.ms, body: result.text });
}

await matchesSmoke().catch(e => { console.error("FAIL matches smoke", e); process.exitCode = 1; });
await cinemaSmoke().catch(e => { console.error("FAIL cinema smoke", e); process.exitCode = 1; });
await newsSmoke().catch(e => { console.error("FAIL news smoke", e); process.exitCode = 1; });
