import http from "node:http";
import https from "node:https";
import crypto from "node:crypto";
import {
  assertSourceUrl,
  directCategory,
  directSearch,
  directDetails,
  directWatch,
  BasriSource,
} from "./basri-source.mjs";
import { buildDownloadContentDisposition, sanitizeDownloadFilename } from "./download-filename.mjs";
import { createContentRuntimeService } from "./content-runtime-service.mjs";

const MATCHES = "https://api.albasritv1.workers.dev/";
const CINEMA = "https://albas.albesriali03.workers.dev/";
const BASRI_ORIGIN = "https://www.albasritv.abrdns.com";
const BASRI_REFERER = `${BASRI_ORIGIN}/2026/09/movies-series.html`;
const DEFAULT_MEDIA_REF_TTL_MS = 15 * 60_000;

const ALLOWED_ORIGINS = new Set([
  "https://theeb1230-dot.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

const mediaRefs = new Map();
let mediaRefTtlMs = DEFAULT_MEDIA_REF_TTL_MS;
let cinemaToken = "";
let cinemaTokenExpiresAt = 0;
let cinemaSessionPromise = null;

function requireTestMode() {
  if (process.env.NODE_ENV !== "test") throw new Error("TEST_ONLY_MEDIA_REFERENCE_HOOK");
}

export function __setMediaReferenceTtlForTest(ttlMs) {
  requireTestMode();
  const value = Number(ttlMs);
  if (!Number.isFinite(value) || value < 1 || value > DEFAULT_MEDIA_REF_TTL_MS) throw new Error("INVALID_TEST_MEDIA_REFERENCE_TTL");
  mediaRefTtlMs = value;
}

export function __resetMediaReferenceTtlForTest() {
  requireTestMode();
  mediaRefTtlMs = DEFAULT_MEDIA_REF_TTL_MS;
  mediaRefs.clear();
}

function applyCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (origin && ALLOWED_ORIGINS.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type,Content-Length,Content-Range,Accept-Ranges,Content-Disposition");
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

function log(event, data = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

function safeHeaderUrl(value) {
  const raw = String(value || "");
  try {
    const url = new URL(raw);
    url.pathname = url.pathname.split("/").map(segment => encodeURIComponent(decodeURIComponent(segment))).join("/");
    return url.href;
  } catch {
    return encodeURI(raw);
  }
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

function basriHeaders(page = "/2026/09/movies-series.html", extra = {}) {
  return {
    Accept: "application/json",
    Origin: BASRI_ORIGIN,
    Referer: `${BASRI_ORIGIN}${page}`,
    "X-BSR-Page": page,
    ...extra,
  };
}

async function getMatchToken() {
  const result = await fetchTextJson(`${MATCHES}session`, { headers: basriHeaders("/2026/09/matches.html") });
  if (!result.response.ok || !result.data?.token) throw new Error(`MATCH_SESSION_${result.response.status}`);
  return String(result.data.token);
}

async function getMatches() {
  const token = await getMatchToken();
  const result = await fetchTextJson(MATCHES, { headers: basriHeaders("/2026/09/matches.html", { "X-BSR-Token": token }) });
  if (!result.response.ok) throw new Error(`MATCH_LIST_${result.response.status}`);
  return result.data;
}

async function getMatchServers(target) {
  const url = new URL(target);
  if (url.origin !== new URL(MATCHES).origin) throw new Error("BAD_MATCH_TARGET");
  const token = await getMatchToken();
  const result = await fetchTextJson(url.href, { headers: basriHeaders("/2026/09/matches.html", { "X-BSR-Token": token }) });
  if (!result.response.ok) throw new Error(`MATCH_SERVERS_${result.response.status}`);
  return result.data;
}

async function ensureCinemaSession(force = false) {
  const now = Date.now();
  if (!force && cinemaToken && cinemaTokenExpiresAt > now + 10_000) return cinemaToken;
  if (!force && cinemaSessionPromise) return cinemaSessionPromise;
  cinemaSessionPromise = (async () => {
    const result = await fetchTextJson(`${CINEMA}session`, { headers: { Accept: "application/json" } }, 15_000);
    if (!result.response.ok || !result.data?.token) throw new Error(`CINEMA_SESSION_${result.response.status}`);
    cinemaToken = String(result.data.token);
    const expiresAt = Number(result.data.expiresAt || 0);
    cinemaTokenExpiresAt = expiresAt > 10_000_000_000 ? expiresAt : expiresAt > 0 ? expiresAt * 1000 : Date.now() + 5 * 60_000;
    return cinemaToken;
  })();
  try { return await cinemaSessionPromise; } finally { cinemaSessionPromise = null; }
}

async function cinemaWorkerRequest(action, params = {}, retry = true) {
  const token = await ensureCinemaSession(false);
  const query = new URLSearchParams({ action, token, ...params });
  const result = await fetchTextJson(`${CINEMA}?${query}`, { headers: { Accept: "application/json" } }, 45_000);
  if (retry && result.response.status === 401) {
    cinemaToken = "";
    cinemaTokenExpiresAt = 0;
    await ensureCinemaSession(true);
    return cinemaWorkerRequest(action, params, false);
  }
  if (!result.response.ok) throw new Error(`CINEMA_${action.toUpperCase()}_${result.response.status}`);
  if (result.data?.status !== "success") throw new Error(`CINEMA_${action.toUpperCase()}_REJECTED`);
  return result.data;
}

async function workerOrDirect(label, workerFn, directFn) {
  try {
    const data = await workerFn();
    const count = Array.isArray(data?.data) ? data.data.length : null;
    if (count === 0) throw new Error(`${label}_EMPTY`);
    return { data, source: "basri-worker" };
  } catch (error) {
    log("cinema_worker_fallback", { label, reason: String(error?.message || error) });
    return { data: await directFn(), source: "basri-direct" };
  }
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

function storeMedia(url, referer = BasriSource.origin + "/", metadata = {}) {
  const parsed = assertSourceUrl(url, { allowMedia: true });
  const id = crypto.randomBytes(18).toString("base64url");
  const downloadName = sanitizeDownloadFilename(metadata.title || metadata.filename || "al-qahtani-media");
  mediaRefs.set(id, { url: parsed.href, referer, downloadName, expiresAt: Date.now() + mediaRefTtlMs });
  if (mediaRefs.size > 256) {
    const now = Date.now();
    for (const [key, value] of mediaRefs) if (value.expiresAt <= now) mediaRefs.delete(key);
  }
  return id;
}

export function __createMediaReferenceForTest(url, referer = BasriSource.origin + "/", metadata = {}) {
  requireTestMode();
  return `/api/cinema/media?id=${encodeURIComponent(storeMedia(url, referer, metadata))}`;
}

function wrapEpisodes(episodes = []) {
  return episodes.map((episode, index) => {
    const raw = episode.link || episode.url || episode.href || "";
    return {
      ...episode,
      num: Number(episode.num || episode.number || index + 1),
      link: raw ? `legacy:${encodeURIComponent(String(raw))}` : "",
      watch_available: episode.watch_available !== false && Boolean(raw),
    };
  });
}

function normalizeWorkerDetails(data = {}) {
  const normalized = { ...data, status: "success", source: "basri-worker", episodes: wrapEpisodes(data.episodes || []) };
  if (data.media_src && !data.is_iframe) {
    const title = data.movie_title || data.title || "al-qahtani-media";
    const id = storeMedia(String(data.media_src), BASRI_REFERER, { title });
    normalized.media_path = `/api/cinema/media?id=${encodeURIComponent(id)}`;
    delete normalized.media_src;
    normalized.media_type = data.media_type || "stream";
  }
  return normalized;
}

async function cinemaSearch(query) {
  const result = await workerOrDirect(
    "search",
    () => cinemaWorkerRequest("search", { q: query }),
    () => directSearch(query),
  );
  const items = result.source === "basri-worker" ? (result.data.data || []) : result.data;
  return { status: "success", source: result.source, data: normalizeCatalog(items) };
}

async function cinemaCategory(sourceUrl, page = 1) {
  if (!sourceUrl) return { status: "success", source: "basri-direct", data: [] };
  assertSourceUrl(sourceUrl);
  const result = await workerOrDirect(
    "category",
    () => cinemaWorkerRequest("genre", { genre: sourceUrl, p: String(page || 1) }),
    () => directCategory(sourceUrl, page),
  );
  const items = result.source === "basri-worker" ? (result.data.data || []) : result.data;
  return { status: "success", source: result.source, data: normalizeCatalog(items) };
}

const contentRuntime = createContentRuntimeService({
  fetchMatches: getMatches,
  searchCatalog: cinemaSearch,
  fetchCategory: cinemaCategory,
});

function requestMedia(target, headers, { allowBrokenChain = false, redirects = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(target, {
      method: "GET",
      headers,
      rejectUnauthorized: !allowBrokenChain,
    }, (response) => {
      const status = Number(response.statusCode || 0);
      const location = response.headers.location;
      if ([301, 302, 303, 307, 308].includes(status) && location && redirects < 4) {
        response.resume();
        try {
          const next = assertSourceUrl(new URL(location, target).href, { allowMedia: true });
          resolve(requestMedia(next, headers, { allowBrokenChain, redirects: redirects + 1 }));
        } catch (error) {
          reject(error);
        }
        return;
      }
      resolve(response);
    });
    request.setTimeout(60_000, () => request.destroy(new Error("MEDIA_UPSTREAM_TIMEOUT")));
    request.on("error", reject);
    request.end();
  });
}

async function openMedia(target, headers) {
  try {
    return await requestMedia(target, headers);
  } catch (error) {
    const tlsCodes = new Set(["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT"]);
    const host = target.hostname.toLowerCase();
    if (!tlsCodes.has(String(error?.code || "")) || !host.endsWith(".downet.net")) throw error;
    log("media_tls_compat", { host, code: String(error.code) });
    return requestMedia(target, headers, { allowBrokenChain: true });
  }
}

function classifyMediaBytes(bytes, contentType = "") {
  const type = String(contentType || "").toLowerCase();
  const mp4 = bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp";
  const matroska = bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  const mpegTs = bytes.length >= 188 && bytes[0] === 0x47 && (bytes.length < 376 || bytes[188] === 0x47);
  const hls = bytes.subarray(0, 64).toString("utf8").trimStart().startsWith("#EXTM3U");
  if (hls || type.includes("mpegurl")) return "hls";
  if (mp4 || type.includes("video/mp4")) return "mp4";
  if (mpegTs || type.includes("video/mp2t")) return "mpeg-ts";
  if (matroska || type.includes("matroska") || type.includes("webm")) return "matroska-webm";
  return "unknown";
}

async function inspectMediaCandidate(value, referer) {
  const target = assertSourceUrl(value, { allowMedia: true });
  const upstream = await openMedia(target, {
    Accept: "*/*",
    Range: "bytes=0-4095",
    Referer: safeHeaderUrl(referer || BasriSource.origin + "/"),
    "User-Agent": BasriSource.userAgent,
  });
  const status = Number(upstream.statusCode || 0);
  if (status < 200 || status >= 300) {
    upstream.resume();
    return { playable: false, kind: "unknown", status, reason: `MEDIA_UPSTREAM_${status}` };
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of upstream) {
    const remaining = 4096 - size;
    if (remaining <= 0) break;
    const slice = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
    chunks.push(slice);
    size += slice.length;
    if (size >= 4096) {
      upstream.destroy();
      break;
    }
  }
  const bytes = Buffer.concat(chunks, size);
  const contentType = String(upstream.headers["content-type"] || "");
  const contentDisposition = String(upstream.headers["content-disposition"] || "");
  const kind = classifyMediaBytes(bytes, contentType);
  const attachment = /attachment/i.test(contentDisposition);
  const playable = ["hls", "mp4", "mpeg-ts"].includes(kind);
  return { playable, kind, status, attachment, contentType, contentDisposition };
}

async function resolveDirectWatch(details, target) {
  const unsupported = [];
  for (const watchUrl of (details.watch || []).slice(0, 3)) {
    let watch;
    try {
      watch = await directWatch(watchUrl, target);
    } catch (error) {
      log("cinema_watch_parse_failed", { reason: String(error?.message || error) });
      continue;
    }
    for (const candidate of (watch.candidates || []).slice(0, 4)) {
      try {
        const inspection = await inspectMediaCandidate(candidate, watchUrl);
        if (inspection.playable) return { watchUrl, candidate, inspection, watch };
        unsupported.push({ kind: inspection.kind, attachment: inspection.attachment === true });
      } catch (error) {
        log("cinema_media_probe_failed", { host: new URL(candidate).hostname, code: String(error?.code || ""), reason: String(error?.message || error) });
      }
    }
  }
  return { unsupported };
}

async function directDetailsResolved(target) {
  const details = await directDetails(target);
  if (Array.isArray(details.episodes) && details.episodes.length) {
    return { ...details, episodes: wrapEpisodes(details.episodes) };
  }
  if (Array.isArray(details.watch) && details.watch.length) {
    const resolved = await resolveDirectWatch(details, target);
    if (resolved.candidate) {
      const title = details.movie_title || resolved.watch?.movie_title || "al-qahtani-media";
      const id = storeMedia(resolved.candidate, resolved.watchUrl, { title });
      const mediaType = resolved.inspection.kind === "hls" ? "m3u8" : resolved.inspection.kind === "mp4" ? "mp4" : "stream";
      return {
        status: "success",
        source: "basri-direct",
        movie_title: title,
        poster: details.poster || "",
        episodes: [],
        media_path: `/api/cinema/media?id=${encodeURIComponent(id)}`,
        media_type: mediaType,
        is_iframe: false,
      };
    }
    const kinds = [...new Set((resolved.unsupported || []).map(item => item.kind).filter(kind => kind && kind !== "unknown"))];
    return {
      status: "success",
      source: "basri-direct",
      movie_title: details.movie_title || "التفاصيل",
      poster: details.poster || "",
      episodes: [],
      playback_unavailable: true,
      playback_reason: kinds.length ? "UNSUPPORTED_MEDIA_CONTAINER" : "NO_PLAYABLE_MEDIA",
      unsupported_media_types: kinds,
    };
  }
  return { ...details, episodes: wrapEpisodes(details.episodes || []) };
}

async function cinemaDetails(ref) {
  if (!ref.startsWith("legacy:")) throw new Error("BAD_CINEMA_REFERENCE");
  const target = decodeURIComponent(ref.slice("legacy:".length));
  assertSourceUrl(target);
  try {
    const data = await cinemaWorkerRequest("series", { series: target });
    return normalizeWorkerDetails(data);
  } catch (error) {
    log("cinema_details_direct_fallback", { reason: String(error?.message || error), targetType: new URL(target).pathname.split("/")[1] || "" });
    return directDetailsResolved(target);
  }
}

async function proxyMedia(req, res, id) {
  const entry = mediaRefs.get(id);
  if (!entry || entry.expiresAt <= Date.now()) {
    mediaRefs.delete(id);
    return sendJson(res, 404, { status: "error", message: "MEDIA_REFERENCE_EXPIRED" });
  }
  const target = assertSourceUrl(entry.url, { allowMedia: true });
  const headers = {
    Accept: "*/*",
    Referer: safeHeaderUrl(entry.referer || BasriSource.origin + "/"),
    "User-Agent": BasriSource.userAgent,
  };
  if (req.headers.range) headers.Range = req.headers.range;
  try {
    const upstream = await openMedia(target, headers);
    const status = Number(upstream.statusCode || 502);
    if (status < 200 || status >= 300) {
      upstream.resume();
      return sendJson(res, status, { status: "error", message: `MEDIA_UPSTREAM_${status}` });
    }
    applyCors(req, res);
    for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
      const value = upstream.headers[name];
      if (value) res.setHeader(name, value);
    }
    if (!upstream.headers["content-type"]) res.setHeader("Content-Type", "video/mp4");
    const requestUrl = new URL(req.url || "/", "http://localhost");
    if (requestUrl.searchParams.get("download") === "1") {
      res.setHeader("Content-Disposition", buildDownloadContentDisposition(entry.downloadName));
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = status;
    for await (const chunk of upstream) res.write(chunk);
    res.end();
  } catch (error) {
    log("media_proxy_failed", { host: target.hostname, code: String(error?.code || ""), error: String(error?.message || error) });
    if (!res.headersSent) return sendJson(res, 502, { status: "error", message: "MEDIA_PROXY_FAILED" });
    res.destroy(error);
  }
}

export function createServer({ runtimeService = contentRuntime } = {}) {
  return http.createServer(async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const url = new URL(req.url, "http://localhost");
    const started = Date.now();
    try {
      if (url.pathname === "/health") return sendJson(res, 200, { status: "ok", cinema_source: "basri-original" });
      if (url.pathname === "/api/runtime/status") return sendJson(res, 200, runtimeService.status());
      if (url.pathname === "/api/v1/matches") return sendJson(res, 200, await runtimeService.matches());
      if (url.pathname === "/api/v1/search") return sendJson(res, 200, await runtimeService.search((url.searchParams.get("q") || "").trim()));
      if (url.pathname === "/api/v1/category") return sendJson(res, 200, await runtimeService.category(url.searchParams.get("ref") || "", Number(url.searchParams.get("p") || 1)));
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
