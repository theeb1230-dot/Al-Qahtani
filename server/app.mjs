import http from "node:http";
import crypto from "node:crypto";

const MATCHES = "https://api.albasritv1.workers.dev/";
const CINEMA = "https://albas.albesriali03.workers.dev/";
const BASRI_ORIGIN = "https://www.albasritv.abrdns.com";
const BASRI_REFERER = `${BASRI_ORIGIN}/2026/09/movies-series.html`;

const ALLOWED_ORIGINS = new Set([
  "https://theeb1230-dot.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

const mediaRefs = new Map();
let cinemaToken = "";
let cinemaTokenExpiresAt = 0;
let cinemaSessionPromise = null;

function applyCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (origin && ALLOWED_ORIGINS.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type,Content-Length,Content-Range,Accept-Ranges");
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

function log(event, data = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

async function fetchTextJson(url, init = {}, timeoutMs = 45_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store", redirect: "follow" });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data, text };
  } finally {
    clearTimeout(timer);
  }
}

function basriHeaders(extra = {}) {
  return {
    Accept: "application/json",
    Origin: BASRI_ORIGIN,
    Referer: BASRI_REFERER,
    "X-BSR-Page": "/2026/09/movies-series.html",
    ...extra,
  };
}

async function getMatchToken() {
  const result = await fetchTextJson(`${MATCHES}session`, { headers: basriHeaders({ "X-BSR-Page": "/2026/09/matches.html" }) });
  if (!result.response.ok || !result.data?.token) throw new Error(`MATCH_SESSION_${result.response.status}`);
  return String(result.data.token);
}

async function getMatches() {
  const token = await getMatchToken();
  const result = await fetchTextJson(MATCHES, { headers: basriHeaders({ "X-BSR-Page": "/2026/09/matches.html", "X-BSR-Token": token }) });
  if (!result.response.ok) throw new Error(`MATCH_LIST_${result.response.status}`);
  return result.data;
}

async function getMatchServers(target) {
  const url = new URL(target);
  if (url.origin !== new URL(MATCHES).origin) throw new Error("BAD_MATCH_TARGET");
  const token = await getMatchToken();
  const result = await fetchTextJson(url.href, { headers: basriHeaders({ "X-BSR-Page": "/2026/09/matches.html", "X-BSR-Token": token }) });
  if (!result.response.ok) throw new Error(`MATCH_SERVERS_${result.response.status}`);
  return result.data;
}

async function ensureCinemaSession(force = false) {
  const now = Date.now();
  if (!force && cinemaToken && cinemaTokenExpiresAt > now + 10_000) return cinemaToken;
  if (!force && cinemaSessionPromise) return cinemaSessionPromise;
  cinemaSessionPromise = (async () => {
    const result = await fetchTextJson(`${CINEMA}session`, { headers: basriHeaders() }, 20_000);
    if (!result.response.ok || !result.data?.token) throw new Error(`CINEMA_SESSION_${result.response.status}`);
    cinemaToken = String(result.data.token);
    const expiresAt = Number(result.data.expiresAt || result.data.expires_at || 0);
    cinemaTokenExpiresAt = expiresAt > 10_000_000_000 ? expiresAt : expiresAt > 0 ? expiresAt * 1000 : Date.now() + 5 * 60_000;
    return cinemaToken;
  })();
  try { return await cinemaSessionPromise; } finally { cinemaSessionPromise = null; }
}

async function cinemaRequest(action, params = {}, retry = true) {
  const token = await ensureCinemaSession(false);
  const query = new URLSearchParams({ action, token, ...params });
  const result = await fetchTextJson(`${CINEMA}?${query}`, { headers: basriHeaders() }, 60_000);
  if (retry && result.response.status === 401) {
    cinemaToken = "";
    cinemaTokenExpiresAt = 0;
    await ensureCinemaSession(true);
    return cinemaRequest(action, params, false);
  }
  if (!result.response.ok) throw new Error(`CINEMA_${action.toUpperCase()}_${result.response.status}`);
  if (result.data?.status !== "success") throw new Error(`CINEMA_${action.toUpperCase()}_REJECTED`);
  return result.data;
}

function normalizeCatalog(items = []) {
  return items.map((item) => {
    const raw = item.href || item.url || item.link || "";
    return {
      title: item.title || item.name || "بدون عنوان",
      img: item.img || item.image || item.poster || "",
      is_series: item.is_series !== false,
      href: raw ? `legacy:${encodeURIComponent(raw)}` : "",
      year: item.year || null,
    };
  }).filter((item) => item.href);
}

function storeMedia(url) {
  const id = crypto.randomBytes(18).toString("base64url");
  mediaRefs.set(id, { url, expiresAt: Date.now() + 15 * 60_000 });
  if (mediaRefs.size > 256) {
    const now = Date.now();
    for (const [key, value] of mediaRefs) if (value.expiresAt <= now) mediaRefs.delete(key);
  }
  return id;
}

function normalizeDetails(data = {}) {
  const normalized = { ...data, status: "success", source: "basri-worker" };
  const episodes = Array.isArray(data.episodes) ? data.episodes : [];
  normalized.episodes = episodes.map((episode, index) => {
    const raw = episode.link || episode.url || episode.href || episode.id || "";
    return {
      ...episode,
      num: episode.num || episode.number || index + 1,
      link: raw ? `legacy:${encodeURIComponent(String(raw))}` : "",
      watch_available: episode.watch_available !== false && Boolean(raw),
    };
  });
  if (data.media_src && !data.is_iframe) {
    const id = storeMedia(String(data.media_src));
    normalized.media_src = `/api/cinema/media?id=${encodeURIComponent(id)}`;
    normalized.media_type = data.media_type || (/\.m3u8(?:$|\?)/i.test(String(data.media_src)) ? "m3u8" : "stream");
  }
  return normalized;
}

async function cinemaSearch(query) {
  const data = await cinemaRequest("search", { q: query });
  return { status: "success", source: "basri-worker", data: normalizeCatalog(data.data || []) };
}

async function cinemaCategory(sourceUrl, page = 1) {
  if (!sourceUrl) return { status: "success", source: "basri-worker", data: [] };
  const data = await cinemaRequest("genre", { genre: sourceUrl, p: String(page || 1) });
  return { status: "success", source: "basri-worker", data: normalizeCatalog(data.data || []) };
}

async function cinemaDetails(ref) {
  if (!ref.startsWith("legacy:")) throw new Error("BAD_CINEMA_REFERENCE");
  const target = decodeURIComponent(ref.slice("legacy:".length));
  const data = await cinemaRequest("series", { series: target });
  return normalizeDetails(data);
}

async function proxyMedia(req, res, id) {
  const entry = mediaRefs.get(id);
  if (!entry || entry.expiresAt <= Date.now()) {
    mediaRefs.delete(id);
    return sendJson(res, 404, { status: "error", message: "MEDIA_REFERENCE_EXPIRED" });
  }
  let target;
  try { target = new URL(entry.url); } catch { return sendJson(res, 400, { status: "error", message: "BAD_MEDIA_REFERENCE" }); }
  if (!/^https?:$/.test(target.protocol)) return sendJson(res, 400, { status: "error", message: "BAD_MEDIA_SCHEME" });
  const headers = { Accept: "*/*", Referer: BASRI_REFERER };
  if (req.headers.range) headers.Range = req.headers.range;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const upstream = await fetch(target, { headers, signal: controller.signal, redirect: "follow", cache: "no-store" });
    if (!upstream.ok && upstream.status !== 206) return sendJson(res, upstream.status, { status: "error", message: `MEDIA_UPSTREAM_${upstream.status}` });
    applyCors(req, res);
    for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = upstream.status;
    if (!upstream.body) return res.end();
    for await (const chunk of upstream.body) res.write(chunk);
    res.end();
  } catch (error) {
    if (!res.headersSent) return sendJson(res, 502, { status: "error", message: "MEDIA_PROXY_FAILED" });
    res.destroy(error);
  } finally {
    clearTimeout(timer);
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const url = new URL(req.url, "http://localhost");
    const started = Date.now();
    try {
      if (url.pathname === "/health") return sendJson(res, 200, { status: "ok", cinema_source: "basri-worker" });
      if (url.pathname === "/api/matches") return sendJson(res, 200, await getMatches());
      if (url.pathname === "/api/matches/servers") return sendJson(res, 200, await getMatchServers(url.searchParams.get("url") || ""));
      if (url.pathname === "/api/cinema/search") return sendJson(res, 200, await cinemaSearch((url.searchParams.get("q") || "").trim()));
      if (url.pathname === "/api/cinema/category") return sendJson(res, 200, await cinemaCategory(url.searchParams.get("url") || "", Number(url.searchParams.get("p") || 1)));
      if (url.pathname === "/api/cinema/details") return sendJson(res, 200, await cinemaDetails(url.searchParams.get("ref") || ""));
      if (url.pathname === "/api/cinema/media") return proxyMedia(req, res, url.searchParams.get("id") || "");
      return sendJson(res, 404, { error: "NOT_FOUND" });
    } catch (error) {
      log("request_failed", { path: url.pathname, ms: Date.now() - started, error: String(error?.message || error) });
      return sendJson(res, 502, { status: "error", message: String(error?.message || "UPSTREAM_FAILED") });
    }
  });
}
