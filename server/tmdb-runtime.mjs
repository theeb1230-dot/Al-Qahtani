const TMDB_ORIGIN = "https://api.themoviedb.org";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_CACHE_TTL_MS = 5 * 60_000;
const MAX_CACHE_ENTRIES = 100;

function text(value) {
  return String(value ?? "").trim();
}

function yearFrom(value) {
  const raw = text(value);
  if (!raw) return null;
  const match = raw.match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function ratingFrom(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 10) / 10;
}

function normalizeResult(item = {}) {
  const mediaType = text(item.media_type);
  if (mediaType !== "movie" && mediaType !== "tv") return null;
  const id = Number(item.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  const series = mediaType === "tv";
  const title = text(series ? item.name : item.title);
  if (!title) return null;
  const posterPath = text(item.poster_path);
  const releaseDate = text(series ? item.first_air_date : item.release_date);
  return {
    id: String(id),
    title,
    poster: posterPath ? `https://image.tmdb.org/t/p/w342${posterPath}` : "",
    type: series ? "series" : "movie",
    year: yearFrom(releaseDate),
    rating: ratingFrom(item.vote_average),
    source: "tmdb",
    ref: `tmdb:${mediaType}:${id}`,
  };
}

export function createTmdbRuntime({
  apiKey = process.env.TMDB_API_KEY || "",
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
  now = () => Date.now(),
} = {}) {
  const cache = new Map();

  function configured() {
    return Boolean(text(apiKey));
  }

  function status() {
    return {
      status: "success",
      source: "tmdb",
      configured: configured(),
    };
  }

  function prune() {
    const current = now();
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= current) cache.delete(key);
    }
    while (cache.size > MAX_CACHE_ENTRIES) {
      cache.delete(cache.keys().next().value);
    }
  }

  async function request(path, params = {}) {
    if (!configured()) throw new Error("TMDB_NOT_CONFIGURED");
    if (typeof fetchImpl !== "function") throw new Error("TMDB_FETCH_UNAVAILABLE");
    const url = new URL(path, TMDB_ORIGIN);
    url.searchParams.set("api_key", text(apiKey));
    url.searchParams.set("language", "ar-SA");
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && String(value) !== "") {
        url.searchParams.set(key, String(value));
      }
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        redirect: "follow",
      });
      if (!response.ok) throw new Error(`TMDB_HTTP_${response.status}`);
      const body = await response.json();
      if (!body || typeof body !== "object") throw new Error("TMDB_INVALID_JSON");
      return body;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("TMDB_TIMEOUT");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function search(query) {
    const q = text(query);
    if (q.length < 2) return { status: "success", source: "tmdb", data: [] };
    prune();
    const key = q.toLocaleLowerCase("ar");
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) return cached.value;
    const body = await request("/3/search/multi", {
      query: q,
      include_adult: "false",
    });
    const seen = new Set();
    const data = [];
    for (const raw of Array.isArray(body.results) ? body.results : []) {
      const item = normalizeResult(raw);
      if (!item || !seen.add(item.ref)) continue;
      data.push(item);
    }
    const value = { status: "success", source: "tmdb", data };
    cache.set(key, { expiresAt: now() + cacheTtlMs, value });
    prune();
    return value;
  }

  return Object.freeze({ status, search });
}

export const __tmdbTest = Object.freeze({ normalizeResult, yearFrom, ratingFrom });
