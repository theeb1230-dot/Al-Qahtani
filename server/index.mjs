import http from "node:http";
import crypto from "node:crypto";
import { createTheebFetch } from "./theeb-fetch.mjs";
import { pickEpisodeByNumber } from "./provider-episode-context.mjs";

const nativeFetch = globalThis.fetch.bind(globalThis);
const THEEB_ORIGIN = "https://theeb-arab-api.onrender.com";
const SERVICE_TOKEN = String(process.env.THEEB_SERVICE_TOKEN || "").trim();
const ALLOWED_ORIGINS = new Set([
  "https://theeb1230-dot.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);
const providerMedia = new Map();

globalThis.fetch = createTheebFetch({
  nativeFetch,
  origin: THEEB_ORIGIN,
  serviceToken: SERVICE_TOKEN,
});

function applyCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (origin && ALLOWED_ORIGINS.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type,Content-Length,Content-Range,Accept-Ranges");
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

function log(event, data = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

async function getJson(url, timeoutMs = 45_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal, cache: "no-store" });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data };
  } finally {
    clearTimeout(timer);
  }
}

function storeMedia(url) {
  const id = crypto.randomBytes(18).toString("base64url");
  providerMedia.set(id, { url, expiresAt: Date.now() + 15 * 60_000 });
  if (providerMedia.size > 200) {
    const now = Date.now();
    for (const [key, value] of providerMedia) if (value.expiresAt <= now) providerMedia.delete(key);
  }
  return id;
}

function proxiedMedia(source, provider) {
  const mediaId = storeMedia(source.direct_url);
  return {
    status: "success",
    source: "provider-episode",
    provider,
    media_src: `https://al-qahtani-api.onrender.com/api/cinema/provider-media?id=${encodeURIComponent(mediaId)}`,
    media_type: /\.m3u8(?:$|\?)/i.test(source.direct_url) ? "m3u8" : "stream",
    is_iframe: false,
    quality: source.quality || null,
  };
}

async function providerEpisodeCandidate(provider, target) {
  if (!provider || !target) return null;
  const episode = await getJson(
    `${THEEB_ORIGIN}/api/providers/${encodeURIComponent(provider)}/episode/${encodeURIComponent(String(target))}`,
    45_000,
  ).catch(() => null);
  if (!episode?.response?.ok || !episode.data) return null;

  const details = episode.data;
  const options = Array.isArray(details.watch_options) ? details.watch_options : [];
  for (const option of options) {
    if (!option?.watch_id) continue;
    const watch = await getJson(
      `${THEEB_ORIGIN}/api/providers/${encodeURIComponent(provider)}/watch/${encodeURIComponent(String(option.watch_id))}/${encodeURIComponent(String(details.episode?.id || target))}`,
      45_000,
    ).catch(() => null);
    const source = (watch?.data?.sources || []).find((item) => item?.direct_url);
    if (source?.direct_url) return proxiedMedia({ ...source, quality: source.quality || option.quality || null }, provider);
  }

  const embed = options.find((option) => option?.can_watch !== false && option?.page_url && ["embed", "external_player"].includes(option.type));
  if (embed) {
    return {
      status: "success",
      source: "provider-episode",
      provider,
      media_src: embed.page_url,
      media_type: "embed",
      is_iframe: true,
    };
  }
  return null;
}

function decodeLegacyProviderRef(ref) {
  const match = String(ref || "").match(/^provider:([^:]+):episode:(.+)$/);
  if (!match) return null;
  try {
    return { provider: decodeURIComponent(match[1]), target: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

async function providerEpisodeWithFallback(ref, title, episodeNumber) {
  const primary = decodeLegacyProviderRef(ref);
  if (!primary) return { status: "error", message: "BAD_PROVIDER_REFERENCE" };

  const direct = await providerEpisodeCandidate(primary.provider, primary.target);
  if (direct) return direct;

  const lookup = String(title || "").trim();
  if (!lookup || !String(episodeNumber || "").trim()) {
    return { status: "error", message: "PROVIDER_EPISODE_UNAVAILABLE" };
  }

  const discovery = await getJson(`${THEEB_ORIGIN}/v1/discover?q=${encodeURIComponent(lookup)}`, 60_000).catch(() => null);
  const items = discovery?.data?.data?.items || [];
  const seen = new Set([primary.provider]);
  for (const candidate of items.slice(0, 8)) {
    const provider = String(candidate?.provider || "").trim();
    const seriesId = String(candidate?.provider_series_id || "").trim();
    if (!provider || !seriesId || seen.has(provider) || (candidate.content_type || candidate.type) === "movie") continue;
    seen.add(provider);

    const series = await getJson(
      `${THEEB_ORIGIN}/api/providers/${encodeURIComponent(provider)}/series/${encodeURIComponent(seriesId)}`,
      45_000,
    ).catch(() => null);
    if (!series?.response?.ok || !Array.isArray(series.data?.episodes)) continue;

    const episode = pickEpisodeByNumber(series.data.episodes, episodeNumber);
    if (!episode) continue;
    const target = String(episode.source_url || episode.id || episode.page_url || "").trim();
    if (!target) continue;

    const resolved = await providerEpisodeCandidate(provider, target);
    if (resolved) {
      log("provider_episode_fallback_success", { from: primary.provider, to: provider, episode: String(episodeNumber) });
      return resolved;
    }
  }

  log("provider_episode_fallback_exhausted", { provider: primary.provider, episode: String(episodeNumber), candidates: items.length });
  return { status: "error", message: "NO_PLAYABLE_SOURCE" };
}

async function providerMovieCandidate(candidate) {
  if (!candidate?.provider || !candidate?.id) return null;
  const target = String(candidate.id || candidate.source);
  const episode = await getJson(
    `${THEEB_ORIGIN}/api/providers/${encodeURIComponent(candidate.provider)}/episode/${encodeURIComponent(target)}`,
    45_000,
  ).catch(() => null);
  if (!episode?.response?.ok || !episode.data?.episode) return null;

  const details = episode.data;
  let media = null;
  for (const option of Array.isArray(details.watch_options) ? details.watch_options : []) {
    if (!option?.watch_id) continue;
    const watch = await getJson(
      `${THEEB_ORIGIN}/api/providers/${encodeURIComponent(candidate.provider)}/watch/${encodeURIComponent(String(option.watch_id))}/${encodeURIComponent(String(details.episode.id || candidate.id))}`,
      45_000,
    ).catch(() => null);
    const source = (watch?.data?.sources || []).find((item) => item?.direct_url);
    if (source?.direct_url) {
      const mediaId = storeMedia(source.direct_url);
      media = {
        media_src: `https://al-qahtani-api.onrender.com/api/cinema/provider-media?id=${encodeURIComponent(mediaId)}`,
        media_type: /\.m3u8(?:$|\?)/i.test(source.direct_url) ? "m3u8" : "stream",
        is_iframe: false,
      };
      break;
    }
  }

  return {
    status: "success",
    source: "provider-movie",
    provider: candidate.provider,
    movie_title: details.episode.title || candidate.title || candidate.display_title || "",
    poster: details.episode.image || candidate.image || "",
    description: details.episode.description || "",
    episodes: [],
    ...media,
  };
}

async function movieDetailsFromDiscovery(encoded) {
  let primary;
  try { primary = JSON.parse(decodeURIComponent(encoded)); } catch { return null; }
  if (primary?.type !== "movie") return null;

  const lookup = primary.query || primary.title || primary.display_title || "";
  const candidates = [primary];
  if (lookup) {
    const discovery = await getJson(`${THEEB_ORIGIN}/v1/discover?q=${encodeURIComponent(lookup)}`, 60_000).catch(() => null);
    for (const item of discovery?.data?.data?.items || []) {
      if ((item.content_type || item.type) !== "movie") continue;
      candidates.push({
        provider: item.provider,
        id: item.provider_series_id,
        source: item.source_url || "",
        type: "movie",
        title: item.title || item.display_title || lookup,
        display_title: item.display_title || item.title || lookup,
        image: item.image || "",
      });
    }
  }

  const seen = new Set();
  let metadataOnly = null;
  for (const candidate of candidates) {
    const key = `${candidate.provider}:${candidate.id}`;
    if (!candidate.provider || !candidate.id || seen.has(key)) continue;
    seen.add(key);
    const result = await providerMovieCandidate(candidate).catch(() => null);
    if (!result) continue;
    if (result.media_src) return result;
    if (!metadataOnly) metadataOnly = result;
  }
  return metadataOnly;
}

async function proxyProviderMedia(req, res, id) {
  const entry = providerMedia.get(id);
  if (!entry || entry.expiresAt <= Date.now()) {
    providerMedia.delete(id);
    return json(res, 404, { status: "error", message: "MEDIA_REFERENCE_EXPIRED" });
  }
  let target;
  try { target = new URL(entry.url); } catch { return json(res, 400, { status: "error", message: "BAD_MEDIA_REFERENCE" }); }
  if (!/^https?:$/.test(target.protocol)) return json(res, 400, { status: "error", message: "BAD_MEDIA_SCHEME" });

  const headers = { Accept: "*/*" };
  if (req.headers.range) headers.Range = req.headers.range;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const upstream = await nativeFetch(target, { headers, signal: controller.signal, redirect: "follow", cache: "no-store" });
    if (!upstream.ok && upstream.status !== 206) return json(res, upstream.status, { status: "error", message: `MEDIA_UPSTREAM_${upstream.status}` });
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
    if (!res.headersSent) return json(res, 502, { status: "error", message: "MEDIA_PROXY_FAILED" });
    res.destroy(error);
  } finally {
    clearTimeout(timer);
  }
}

const { createServer } = await import("./app.mjs");
const appServer = createServer();
const delegate = appServer.listeners("request")[0];
const server = http.createServer(async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/cinema/provider-media") {
    return proxyProviderMedia(req, res, url.searchParams.get("id") || "");
  }
  if (url.pathname === "/api/cinema/provider-play") {
    const result = await providerEpisodeWithFallback(
      url.searchParams.get("ref") || "",
      url.searchParams.get("title") || "",
      url.searchParams.get("episode") || "",
    ).catch(() => ({ status: "error", message: "NO_PLAYABLE_SOURCE" }));
    return json(res, 200, result);
  }
  if (url.pathname === "/api/cinema/details") {
    const ref = url.searchParams.get("ref") || "";
    if (ref.startsWith("theeb:discover:")) {
      const movie = await movieDetailsFromDiscovery(ref.slice("theeb:discover:".length)).catch(() => null);
      if (movie) return json(res, 200, movie);
    }
  }
  return delegate(req, res);
});

const port = Number(process.env.PORT || 3000);
server.listen(port, "0.0.0.0", () => {
  console.log(`Al-Qahtani backend listening on ${port}`);
});