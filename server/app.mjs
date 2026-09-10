import http from "node:http";

const MATCHES = "https://api.albasritv1.workers.dev/";
const THEEB = "https://theeb-arab-api.onrender.com";
const LEGACY_CINEMA = "https://albas.albesriali03.workers.dev/";
const LEGACY_ORIGIN = "https://www.albasritv.abrdns.com";
const LEGACY_REFERER = `${LEGACY_ORIGIN}/2026/09/movies-series.html`;

const ALLOWED_ORIGINS = new Set([
  "https://theeb1230-dot.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

const CATEGORY_ALIASES = {
  "أنمي": ["anime", "انمي", "أنيمي"],
  "أجنبية": ["english", "foreign"],
  "عربية": ["عربي", "arabic"],
  "تركية": ["تركي", "turkish"],
  "آسيوية": ["asian", "كوري", "ياباني"],
  "هندية": ["هندي", "indian"],
  "رمضان": ["رمضانية"],
};

function applyCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Range");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length,Content-Range,Accept-Ranges,Content-Type",
  );
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function log(event, data = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

async function fetchTextJson(url, init = {}, timeoutMs = 45_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {}
    return { response, data, text };
  } finally {
    clearTimeout(timer);
  }
}

function legacyMatchHeaders(token = "") {
  const headers = {
    Accept: "application/json",
    Origin: LEGACY_ORIGIN,
    Referer: LEGACY_REFERER,
    "X-BSR-Page": "/2026/09/matches.html",
  };
  if (token) headers["X-BSR-Token"] = token;
  return headers;
}

async function getMatchToken() {
  const result = await fetchTextJson(`${MATCHES}session`, {
    headers: legacyMatchHeaders(),
  });
  if (!result.response.ok || !result.data?.token) {
    throw new Error(`MATCH_SESSION_${result.response.status}`);
  }
  return String(result.data.token);
}

async function getMatches() {
  const token = await getMatchToken();
  const result = await fetchTextJson(MATCHES, {
    headers: legacyMatchHeaders(token),
  });
  if (!result.response.ok) throw new Error(`MATCH_LIST_${result.response.status}`);
  return result.data;
}

async function getMatchServers(target) {
  const url = new URL(target);
  if (url.origin !== new URL(MATCHES).origin) throw new Error("BAD_MATCH_TARGET");
  const token = await getMatchToken();
  const result = await fetchTextJson(url.href, {
    headers: legacyMatchHeaders(token),
  });
  if (!result.response.ok) throw new Error(`MATCH_SERVERS_${result.response.status}`);
  return result.data;
}

function mapLibrary(items = []) {
  return items.map((item) => ({
    title: item.title,
    img: item.image || "",
    is_series: item.content_type !== "movie",
    href: `theeb:canonical:${item.id}`,
    year: item.year || null,
  }));
}

function encodeDiscovery(item, query = "") {
  return encodeURIComponent(JSON.stringify({
    provider: item.provider,
    id: item.provider_series_id,
    source: item.source_url || "",
    type: item.content_type || item.type || "series",
    title: item.title || item.display_title || "",
    display_title: item.display_title || item.title || "",
    query,
  }));
}

function mapDiscovered(items = [], query = "") {
  return items.map((item) => ({
    title: item.display_title || item.title,
    img: item.image || "",
    is_series: (item.content_type || item.type) !== "movie",
    href: `theeb:discover:${encodeDiscovery(item, query)}`,
    year: item.year || null,
  }));
}

function mapLegacy(items = []) {
  return items
    .map((item) => {
      const raw = item.href || item.url || item.link || "";
      return {
        title: item.title || item.name || "بدون عنوان",
        img: item.img || item.image || item.poster || "",
        is_series: item.is_series !== false,
        href: raw ? `legacy:${encodeURIComponent(raw)}` : "",
        year: item.year || null,
      };
    })
    .filter((item) => item.href);
}

async function getLegacyCinemaToken() {
  const result = await fetchTextJson(`${LEGACY_CINEMA}session`, {
    headers: {
      Accept: "application/json",
      Origin: LEGACY_ORIGIN,
      Referer: LEGACY_REFERER,
    },
  }, 15_000);
  return result.response.ok && result.data?.token ? String(result.data.token) : "";
}

async function legacyCinema(action, params = {}) {
  const token = await getLegacyCinemaToken();
  if (!token) return [];
  const query = new URLSearchParams({ action, token, ...params });
  const result = await fetchTextJson(`${LEGACY_CINEMA}?${query}`, {
    headers: {
      Accept: "application/json",
      Origin: LEGACY_ORIGIN,
      Referer: LEGACY_REFERER,
    },
  }, 30_000);
  return result.response.ok && result.data?.status === "success"
    ? mapLegacy(result.data.data || [])
    : [];
}

async function legacyDetails(url) {
  const token = await getLegacyCinemaToken();
  if (!token) throw new Error("LEGACY_SESSION");
  const query = new URLSearchParams({ action: "series", series: url, token });
  const result = await fetchTextJson(`${LEGACY_CINEMA}?${query}`, {
    headers: {
      Accept: "application/json",
      Origin: LEGACY_ORIGIN,
      Referer: LEGACY_REFERER,
    },
  }, 45_000);
  if (!result.response.ok || result.data?.status !== "success") {
    throw new Error(`LEGACY_DETAILS_${result.response.status}`);
  }
  return result.data;
}

async function cinemaSearch(query) {
  let result = await fetchTextJson(
    `${THEEB}/v1/search?q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } },
  );
  let items = result.data?.data?.items || [];
  if (items.length) return { status: "success", source: "library", data: mapLibrary(items) };

  result = await fetchTextJson(
    `${THEEB}/v1/discover?q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } },
    60_000,
  );
  items = result.data?.data?.items || [];
  if (items.length) {
    return { status: "success", source: "discover", data: mapDiscovered(items, query) };
  }

  const legacy = await legacyCinema("search", { q: query });
  return { status: "success", source: legacy.length ? "legacy" : "empty", data: legacy };
}

async function cinemaCategory(type, name, sourceUrl = "") {
  const kind = type === "movie" ? "فيلم" : "مسلسل";
  const queries = [...new Set([
    name,
    `${kind} ${name}`,
    `${name} ${kind}`,
    ...(CATEGORY_ALIASES[name] || []),
  ].filter(Boolean))];

  const settled = await Promise.allSettled(
    queries.map((query) => fetchTextJson(
      `${THEEB}/v1/discover?q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } },
      40_000,
    )),
  );

  const seen = new Set();
  const merged = [];
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value.data?.data?.items || []) {
      const key = `${item.provider || ""}:${item.provider_series_id || ""}`;
      if (!item.provider_series_id || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
      if (merged.length >= 36) break;
    }
    if (merged.length >= 36) break;
  }

  if (merged.length) {
    return { status: "success", source: "discover", data: mapDiscovered(merged, name) };
  }
  const legacy = sourceUrl
    ? await legacyCinema("genre", { genre: sourceUrl, p: "1" })
    : [];
  return { status: "success", source: legacy.length ? "legacy" : "empty", data: legacy };
}

async function canonicalDetails(id) {
  const [seriesResult, episodeResult] = await Promise.all([
    fetchTextJson(`${THEEB}/v1/series/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
    }),
    fetchTextJson(`${THEEB}/v1/series/${encodeURIComponent(id)}/episodes`, {
      headers: { Accept: "application/json" },
    }),
  ]);
  if (!seriesResult.response.ok) throw new Error(`SERIES_${seriesResult.response.status}`);
  const series = seriesResult.data?.data || {};
  const episodes = episodeResult.data?.data?.items || [];
  return {
    status: "success",
    source: "canonical",
    movie_title: series.title || "",
    poster: series.image || "",
    episodes: episodes.map((episode) => ({
      num: episode.episode_number || episode.id,
      id: episode.id,
      link: `theeb:episode:${episode.id}`,
      watch_available: episode.watch_available,
      download_available: episode.download_available,
    })),
  };
}

async function providerSeriesDetails(provider, id, source = "") {
  if (!/^[a-z0-9_-]+$/i.test(String(provider)) || !id) return null;
  const target = source || id;
  const result = await fetchTextJson(
    `${THEEB}/api/providers/${encodeURIComponent(provider)}/series/${encodeURIComponent(String(target))}`,
    { headers: { Accept: "application/json" } },
    45_000,
  );
  if (!result.response.ok || !result.data?.series) {
    log("provider_details_rejected", { provider, id, target, status: result.response.status });
    return null;
  }
  const data = result.data;
  const episodes = Array.isArray(data.episodes) ? data.episodes : [];
  return {
    status: "success",
    source: "provider",
    provider,
    movie_title: data.series.title || "",
    poster: data.series.image || "",
    description: data.series.description || "",
    episodes: episodes.map((episode, index) => ({
      num: episode.number || index + 1,
      id: episode.id,
      link: `provider:${encodeURIComponent(provider)}:episode:${encodeURIComponent(String(episode.source_url || episode.id || episode.page_url || ""))}`,
      watch_available: true,
      download_available: false,
    })),
  };
}

async function providerEpisode(provider, id) {
  const episodeResult = await fetchTextJson(
    `${THEEB}/api/providers/${encodeURIComponent(provider)}/episode/${encodeURIComponent(String(id))}`,
    { headers: { Accept: "application/json" } },
    45_000,
  );
  if (!episodeResult.response.ok || !episodeResult.data) {
    return { status: "error", message: "PROVIDER_EPISODE_UNAVAILABLE" };
  }

  const data = episodeResult.data;
  const options = Array.isArray(data.watch_options) ? data.watch_options : [];
  const embed = options.find((option) => option.can_watch !== false && option.page_url && ["embed", "external_player"].includes(option.type));
  if (embed) {
    return {
      status: "success",
      media_src: embed.page_url,
      media_type: "embed",
      is_iframe: true,
      provider,
    };
  }

  for (const option of options) {
    if (!option.watch_id) continue;
    const watchResult = await fetchTextJson(
      `${THEEB}/api/providers/${encodeURIComponent(provider)}/watch/${encodeURIComponent(String(option.watch_id))}/${encodeURIComponent(String(data.episode?.id || id))}`,
      { headers: { Accept: "application/json" } },
      45_000,
    );
    const playable = (watchResult.data?.sources || []).find((source) => source.direct_url);
    if (playable) {
      return {
        status: "success",
        media_src: playable.direct_url,
        media_type: /m3u8/i.test(playable.direct_url) ? "m3u8" : "stream",
        is_iframe: false,
        provider,
        quality: playable.quality || option.quality || null,
      };
    }
  }
  return { status: "error", message: "NO_PLAYABLE_SOURCE" };
}

async function findCanonicalByTitle(title) {
  if (!title) return null;
  const result = await fetchTextJson(
    `${THEEB}/v1/search?q=${encodeURIComponent(title)}`,
    { headers: { Accept: "application/json" } },
    30_000,
  );
  const items = result.data?.data?.items || [];
  const normalized = String(title).trim().toLowerCase();
  const exact = items.find((item) => String(item.title || "").trim().toLowerCase() === normalized);
  return exact?.id || items[0]?.id || null;
}

async function tryImportCandidate(candidate) {
  let created;
  try {
    created = await fetchTextJson(`${THEEB}/v1/imports`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: candidate.provider,
        provider_series_id: String(candidate.id),
      }),
    }, 45_000);
  } catch (error) {
    log("import_transport_failed", { provider: candidate.provider, id: candidate.id, error: String(error) });
    return null;
  }
  if (!created.response.ok || !created.data?.data?.job_id) return null;

  const jobId = created.data.data.job_id;
  for (let index = 0; index < 18; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, index < 2 ? 400 : 1_000));
    const job = await fetchTextJson(`${THEEB}/v1/imports/${encodeURIComponent(jobId)}`, {
      headers: { Accept: "application/json" },
    }, 12_000);
    const state = job.data?.data;
    if (state?.status === "completed" && state.result?.canonical_series_id) {
      return state.result.canonical_series_id;
    }
    if (["failed", "cancelled"].includes(state?.status)) {
      log("import_terminal", { provider: candidate.provider, id: candidate.id, status: state.status });
      return null;
    }
  }
  return null;
}

async function discoverAlternatives(query) {
  if (!query) return [];
  const result = await fetchTextJson(
    `${THEEB}/v1/discover?q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } },
    60_000,
  );
  return (result.data?.data?.items || []).map((item) => ({
    provider: item.provider,
    id: item.provider_series_id,
    source: item.source_url || "",
    type: item.content_type || item.type || "series",
    title: item.title || item.display_title || query,
    display_title: item.display_title || item.title || query,
    query,
  }));
}

async function discoveredDetails(ref) {
  const primary = JSON.parse(decodeURIComponent(ref));
  const lookup = primary.query || primary.title || primary.display_title || "";
  const alternatives = await discoverAlternatives(lookup).catch(() => []);
  const seen = new Set();
  const candidates = [];
  for (const candidate of [primary, ...alternatives]) {
    const key = `${candidate.provider}:${candidate.id}`;
    if (!candidate.provider || !candidate.id || seen.has(key)) continue;
    seen.add(key);
    candidates.push(candidate);
  }
  log("detail_candidates", { query: lookup, candidates: candidates.map((item) => `${item.provider}:${item.id}`) });

  for (const candidate of candidates.slice(0, 4)) {
    const direct = await providerSeriesDetails(candidate.provider, candidate.id, candidate.source).catch(() => null);
    if (direct) {
      log("provider_details_success", { provider: candidate.provider, id: candidate.id });
      return direct;
    }
    const canonicalId = await tryImportCandidate(candidate);
    if (canonicalId) return canonicalDetails(canonicalId);
  }

  const canonicalId = await findCanonicalByTitle(primary.title || lookup);
  if (canonicalId) return canonicalDetails(canonicalId);
  throw new Error("DETAILS_UNAVAILABLE");
}

async function episodePlayback(id) {
  const episodeId = Number(id);
  if (!Number.isSafeInteger(episodeId) || episodeId < 1) throw new Error("BAD_EPISODE");
  const created = await fetchTextJson(`${THEEB}/v1/playback/sessions`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      canonical_episode_id: episodeId,
      quality: "auto",
      client: { platform: "web", version: "al-qahtani-web" },
    }),
  }, 60_000);
  if (!created.response.ok) throw new Error(`PLAYBACK_CREATE_${created.response.status}`);
  let session = created.data?.data;
  if (!session) throw new Error("PLAYBACK_EMPTY");

  for (let index = 0; index < 10 && session.state === "planning"; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    const polled = await fetchTextJson(`${THEEB}/v1/playback/sessions/${encodeURIComponent(session.id)}`, {
      headers: { Accept: "application/json" },
    }, 15_000);
    if (polled.data?.data) session = polled.data.data;
  }
  if (session.state !== "ready" || !session.id) {
    return { status: "error", message: "NO_PLAYABLE_SOURCE" };
  }
  return {
    status: "success",
    media_path: `/api/cinema/media?session=${encodeURIComponent(session.id)}`,
    media_type: "stream",
    is_iframe: false,
    playback_session_id: session.id,
  };
}

async function proxyMedia(req, res, sessionId) {
  if (!/^[A-Za-z0-9._:-]{1,200}$/.test(sessionId)) {
    return sendJson(res, 400, { status: "error", message: "BAD_SESSION" });
  }
  const headers = { Accept: "*/*" };
  if (req.headers.range) headers.Range = req.headers.range;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const upstream = await fetch(
      `${THEEB}/v1/playback/sessions/${encodeURIComponent(sessionId)}/media`,
      { headers, signal: controller.signal, redirect: "follow", cache: "no-store" },
    );
    if (!upstream.ok && upstream.status !== 206) {
      return sendJson(res, upstream.status, {
        status: "error",
        message: `MEDIA_UPSTREAM_${upstream.status}`,
      });
    }
    applyCors(req, res);
    for (const header of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
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
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    const url = new URL(req.url, "http://localhost");
    const started = Date.now();
    try {
      if (url.pathname === "/health") return sendJson(res, 200, { status: "ok" });
      if (url.pathname === "/api/matches") return sendJson(res, 200, await getMatches());
      if (url.pathname === "/api/matches/servers") return sendJson(res, 200, await getMatchServers(url.searchParams.get("url") || ""));
      if (url.pathname === "/api/cinema/search") return sendJson(res, 200, await cinemaSearch((url.searchParams.get("q") || "").trim()));
      if (url.pathname === "/api/cinema/category") return sendJson(res, 200, await cinemaCategory(url.searchParams.get("type") || "series", (url.searchParams.get("name") || "").trim(), url.searchParams.get("url") || ""));
      if (url.pathname === "/api/cinema/media") return proxyMedia(req, res, url.searchParams.get("session") || "");
      if (url.pathname === "/api/cinema/details") {
        const ref = url.searchParams.get("ref") || "";
        if (ref.startsWith("theeb:canonical:")) return sendJson(res, 200, await canonicalDetails(ref.split(":").pop()));
        if (ref.startsWith("theeb:discover:")) return sendJson(res, 200, await discoveredDetails(ref.slice("theeb:discover:".length)));
        if (ref.startsWith("theeb:episode:")) return sendJson(res, 200, await episodePlayback(ref.split(":").pop()));
        if (ref.startsWith("provider:")) {
          const match = ref.match(/^provider:([^:]+):episode:(.+)$/);
          if (match) return sendJson(res, 200, await providerEpisode(decodeURIComponent(match[1]), decodeURIComponent(match[2])));
        }
        if (ref.startsWith("legacy:")) return sendJson(res, 200, await legacyDetails(decodeURIComponent(ref.slice(7))));
        return sendJson(res, 400, { status: "error", message: "BAD_REFERENCE" });
      }
      return sendJson(res, 404, { error: "NOT_FOUND" });
    } catch (error) {
      log("request_failed", { path: url.pathname, ms: Date.now() - started, error: String(error?.message || error) });
      return sendJson(res, 502, { status: "error", message: String(error?.message || "UPSTREAM_FAILED") });
    }
  });
}