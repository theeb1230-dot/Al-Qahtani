import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { createServer } from "./app.mjs";
import { createNewsRuntime } from "./news-runtime.mjs";
import { normalizeMatch } from "./content-runtime.mjs";

const MATCHES = "https://api.albasritv1.workers.dev/";
const MATCH_PAGE = "/2026/09/matches.html";
const MATCH_TTL_MS = 15 * 60_000;
const MATCH_LOGO_HOSTS = new Set(["kooorracity.com", "www.kooorracity.com"]);
const matchRefs = new Map();
const mediaRefs = new Map();
const logoRefs = new Map();

function id() { return crypto.randomBytes(18).toString("base64url"); }
function now() { return Date.now(); }
function sweep() {
  const stamp = now();
  for (const map of [matchRefs, mediaRefs, logoRefs]) for (const [key, value] of map) if (value.expiresAt <= stamp) map.delete(key);
}
setInterval(sweep, 60_000).unref?.();

function applyLogoCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (["https://theeb1230-dot.github.io", "http://localhost:8000", "http://127.0.0.1:8000"].includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
}

function sendRuntimeJson(req, res, status, payload) {
  applyLogoCors(req, res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  return res.end(JSON.stringify(payload));
}

function safeHttpsUrl(value) {
  const url = new URL(String(value || ""));
  if (url.protocol !== "https:") throw new Error("UNSAFE_MATCH_URL");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) throw new Error("UNSAFE_MATCH_HOST");
  return url;
}

function isAllowedMatchLogoUrl(value) {
  try {
    const url = safeHttpsUrl(value);
    return MATCH_LOGO_HOSTS.has(url.hostname.toLowerCase()) && url.pathname.startsWith("/wp-content/uploads/");
  } catch { return false; }
}

function storeLogo(value) {
  if (!isAllowedMatchLogoUrl(value)) return "";
  const key = id();
  logoRefs.set(key, { url: String(value), expiresAt: now() + MATCH_TTL_MS });
  return `/api/matches/logo?id=${encodeURIComponent(key)}`;
}

async function proxyMatchLogo(req, res, url) {
  applyLogoCors(req, res);
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); return res.end(); }
  if (req.method !== "GET") return sendRuntimeJson(req, res, 405, { error: "METHOD_NOT_ALLOWED" });
  const entry = logoRefs.get(url.searchParams.get("id") || "");
  if (!entry || entry.expiresAt <= now()) return sendRuntimeJson(req, res, 410, { error: "MATCH_LOGO_REFERENCE_EXPIRED" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const upstream = await fetch(entry.url, { signal: controller.signal, redirect: "follow", headers: { Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8", Referer: "https://kooorracity.com/", "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1" } });
    if (!upstream.ok || !isAllowedMatchLogoUrl(upstream.url)) return sendRuntimeJson(req, res, 502, { error: "MATCH_LOGO_UPSTREAM" });
    const type = String(upstream.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("image/")) return sendRuntimeJson(req, res, 502, { error: "MATCH_LOGO_NOT_IMAGE" });
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) return sendRuntimeJson(req, res, 502, { error: "MATCH_LOGO_SIZE" });
    res.writeHead(200, { "Content-Type": type, "Content-Length": String(bytes.length), "Cache-Control": "public, max-age=21600, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" });
    return res.end(bytes);
  } catch { return sendRuntimeJson(req, res, 504, { error: "MATCH_LOGO_TIMEOUT" }); }
  finally { clearTimeout(timer); }
}

function matchHeaders(token = "") {
  return {
    Accept: "application/json",
    Origin: "https://www.albasritv.abrdns.com",
    Referer: `https://www.albasritv.abrdns.com${MATCH_PAGE}`,
    "X-BSR-Page": MATCH_PAGE,
    ...(token ? { "X-BSR-Token": token } : {}),
  };
}

async function matchToken() {
  const response = await fetch(`${MATCHES}session`, { headers: matchHeaders(), cache: "no-store" });
  const json = await response.json();
  if (!response.ok || !json?.token) throw new Error(`MATCH_SESSION_${response.status}`);
  return String(json.token);
}

async function matchWorker(target = MATCHES) {
  const token = await matchToken();
  const response = await fetch(target, { headers: matchHeaders(token), cache: "no-store", redirect: "follow" });
  if (!response.ok) throw new Error(`MATCH_WORKER_${response.status}`);
  return response.json();
}

function listPayload(payload) { return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []; }

async function runtimeMatches() {
  const payload = await matchWorker();
  const data = listPayload(payload).map((raw) => {
    const target = String(raw?.link || raw?.url || "");
    const normalized = normalizeMatch(raw);
    let ref = "";
    if (target) {
      const parsed = new URL(target, MATCHES);
      if (parsed.origin === new URL(MATCHES).origin) {
        const key = id();
        matchRefs.set(key, { target: parsed.href, expiresAt: now() + MATCH_TTL_MS });
        ref = `match:${key}`;
      }
    }
    return {
      ...normalized,
      ref,
      team1: { ...normalized.team1, logo: storeLogo(normalized.team1.logo) },
      team2: { ...normalized.team2, logo: storeLogo(normalized.team2.logo) },
    };
  });
  return { status: "success", version: "1.0.13", kind: "matches", source: "basri-matches", cached: false, generated_at: new Date().toISOString(), health: null, data };
}

function serverCandidates(payload) {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.servers) ? payload.servers : [];
  const out = [];
  for (const row of rows) {
    if (!row) continue;
    if (typeof row === "string") out.push({ name: "سيرفر المباراة", url: row, type: "" });
    else {
      const url = String(row.url || row.src || row.link || row.file || "");
      if (url) out.push({ name: String(row.name || row.title || "سيرفر المباراة"), url, type: String(row.type || "") });
    }
  }
  return out;
}

function extractMediaUrls(html, base) {
  const found = [];
  const re = /(?:https?:\/\/[^"'\s<>]+|(?:src|file)\s*[:=]\s*["']([^"']+)["'])/gi;
  for (const match of String(html || "").matchAll(re)) {
    const raw = match[1] || match[0].replace(/^(?:src|file)\s*[:=]\s*["']?/i, "").replace(/["']$/, "");
    try {
      const value = new URL(raw, base).href;
      if (/\.(?:m3u8|mp4|ts|m2ts)(?:$|\?)/i.test(value) && !found.includes(value)) found.push(value);
    } catch {}
  }
  return found;
}

async function resolveServerCandidate(candidate) {
  let target = safeHttpsUrl(candidate.url);
  if (/\.(?:m3u8|mp4|ts|m2ts)(?:$|\?)/i.test(target.pathname + target.search)) return { url: target.href, type: candidate.type };
  const response = await fetch(target, { redirect: "follow", cache: "no-store", headers: { Accept: "text/html,application/xhtml+xml,application/vnd.apple.mpegurl,video/*,*/*;q=0.8", Referer: `https://www.albasritv.abrdns.com${MATCH_PAGE}`, "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1" } });
  target = safeHttpsUrl(response.url);
  const type = String(response.headers.get("content-type") || "").toLowerCase();
  if (type.includes("mpegurl") || type.startsWith("video/")) return { url: target.href, type };
  const html = await response.text();
  for (const value of extractMediaUrls(html, target.href)) {
    try { return { url: safeHttpsUrl(value).href, type: value.includes(".m3u8") ? "m3u8" : value.includes(".mp4") ? "mp4" : "stream" }; } catch {}
  }
  return null;
}

async function resolveMatchPlayback(ref) {
  if (!ref.startsWith("match:")) throw new Error("BAD_MATCH_REFERENCE");
  const key = ref.slice(6);
  const entry = matchRefs.get(key);
  if (!entry || entry.expiresAt <= now()) throw new Error("MATCH_REFERENCE_EXPIRED");
  const payload = await matchWorker(entry.target);
  const candidates = serverCandidates(payload);
  for (const candidate of candidates) {
    try {
      const resolved = await resolveServerCandidate(candidate);
      if (!resolved) continue;
      const mediaId = id();
      mediaRefs.set(mediaId, { url: resolved.url, referer: entry.target, name: candidate.name, expiresAt: now() + MATCH_TTL_MS });
      const type = /m3u8|mpegurl/i.test(resolved.type || resolved.url) ? "m3u8" : /mp4/i.test(resolved.type || resolved.url) ? "mp4" : "stream";
      return { status: "success", data: { media_path: `/api/v1/matches/media?id=${encodeURIComponent(mediaId)}`, media_type: type, server_name: candidate.name } };
    } catch {}
  }
  throw new Error("NO_PLAYABLE_MATCH_MEDIA");
}

function hlsProxyPath(raw, base, referer) {
  const target = safeHttpsUrl(new URL(raw, base).href);
  const key = id();
  mediaRefs.set(key, { url: target.href, referer, name: "HLS", expiresAt: now() + MATCH_TTL_MS });
  return `/api/v1/matches/media?id=${encodeURIComponent(key)}`;
}

async function proxyMatchMedia(req, res, url) {
  applyLogoCors(req, res);
  const entry = mediaRefs.get(url.searchParams.get("id") || "");
  if (!entry || entry.expiresAt <= now()) return sendRuntimeJson(req, res, 410, { status: "error", message: "MATCH_MEDIA_REFERENCE_EXPIRED" });
  const headers = { Accept: "*/*", Referer: entry.referer, "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1" };
  if (req.headers.range) headers.Range = req.headers.range;
  const upstream = await fetch(entry.url, { headers, redirect: "follow", cache: "no-store" });
  if (!upstream.ok && upstream.status !== 206) return sendRuntimeJson(req, res, upstream.status, { status: "error", message: `MATCH_MEDIA_${upstream.status}` });
  const type = String(upstream.headers.get("content-type") || "");
  if (type.toLowerCase().includes("mpegurl") || /\.m3u8(?:$|\?)/i.test(entry.url)) {
    const text = await upstream.text();
    if (!text.trimStart().startsWith("#EXTM3U")) return sendRuntimeJson(req, res, 502, { status: "error", message: "INVALID_MATCH_HLS" });
    const base = upstream.url;
    const rewritten = text.split(/\r?\n/).map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) return line.replace(/URI="([^"]+)"/gi, (_, raw) => `URI="${hlsProxyPath(raw, base, base)}"`);
      return hlsProxyPath(trimmed, base, base);
    }).join("\n");
    const body = Buffer.from(rewritten);
    res.writeHead(200, { "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8", "Content-Length": String(body.length), "Cache-Control": "no-store" });
    return res.end(body);
  }
  const passthrough = {};
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) passthrough[name] = value;
  }
  res.writeHead(upstream.status, { ...passthrough, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  if (upstream.body) for await (const chunk of upstream.body) res.write(chunk);
  return res.end();
}

async function handleNewsRuntime(req, res, url, newsRuntime) {
  applyLogoCors(req, res);
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); return res.end(); }
  if (req.method !== "GET") return sendRuntimeJson(req, res, 405, { status: "error", message: "METHOD_NOT_ALLOWED" });
  try {
    if (url.pathname === "/api/v1/news") return sendRuntimeJson(req, res, 200, await newsRuntime.list());
    if (url.pathname === "/api/v1/news/article") {
      const ref = String(url.searchParams.get("ref") || "").trim();
      if (!ref) return sendRuntimeJson(req, res, 400, { status: "error", message: "MISSING_NEWS_REFERENCE" });
      return sendRuntimeJson(req, res, 200, await newsRuntime.article(ref));
    }
  } catch (error) {
    const message = String(error?.message || "NEWS_RUNTIME_FAILED");
    const status = message === "NEWS_REFERENCE_EXPIRED" ? 410 : 502;
    return sendRuntimeJson(req, res, status, { status: "error", message });
  }
}

export function createProductionServer({ appServer = createServer(), newsRuntime = createNewsRuntime() } = {}) {
  const [appHandler] = appServer.listeners("request");
  if (typeof appHandler !== "function") throw new Error("APP_REQUEST_HANDLER_MISSING");
  appServer.removeAllListeners("request");
  appServer.on("request", async (req, res) => {
    let wantsDownload = false;
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (url.pathname === "/api/matches/logo") return await proxyMatchLogo(req, res, url);
      if (url.pathname === "/api/v1/matches") return sendRuntimeJson(req, res, 200, await runtimeMatches());
      if (url.pathname === "/api/v1/matches/play") return sendRuntimeJson(req, res, 200, await resolveMatchPlayback(String(url.searchParams.get("ref") || "")));
      if (url.pathname === "/api/v1/matches/media") return await proxyMatchMedia(req, res, url);
      if (url.pathname === "/api/v1/news" || url.pathname === "/api/v1/news/article") return await handleNewsRuntime(req, res, url, newsRuntime);
      wantsDownload = url.pathname === "/api/cinema/media" && url.searchParams.get("download") === "1";
    } catch (error) {
      if (!res.headersSent && String(req.url || "").startsWith("/api/v1/matches")) return sendRuntimeJson(req, res, 502, { status: "error", message: String(error?.message || "MATCH_RUNTIME_FAILED") });
    }

    if (wantsDownload) {
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);
      let decorated = false;
      const decorateValidatedMedia = () => {
        if (decorated || res.statusCode < 200 || res.statusCode >= 300) return;
        const contentType = String(res.getHeader("Content-Type") || "").toLowerCase();
        if (contentType.includes("application/json")) return;
        if (!res.hasHeader("Content-Disposition")) res.setHeader("Content-Disposition", 'attachment; filename="al-qahtani-media"');
        res.setHeader("X-Content-Type-Options", "nosniff");
        decorated = true;
      };
      res.write = (...args) => { decorateValidatedMedia(); return originalWrite(...args); };
      res.end = (...args) => { decorateValidatedMedia(); return originalEnd(...args); };
    }
    return appHandler(req, res);
  });
  return appServer;
}

export function startProductionServer({ port = Number(process.env.PORT || 3000) } = {}) {
  const server = createProductionServer();
  return server.listen(port, "0.0.0.0", () => console.log(`Al-Qahtani backend listening on ${port}`));
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (invokedPath === import.meta.url) startProductionServer();
