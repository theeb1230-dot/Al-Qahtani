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

function posterUrl(path, size = "w342") {
  const value = text(path);
  return value ? `https://image.tmdb.org/t/p/${size}${value}` : "";
}

function normalizeResult(item = {}) {
  const mediaType = text(item.media_type);
  if (mediaType !== "movie" && mediaType !== "tv") return null;
  const id = Number(item.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  const series = mediaType === "tv";
  const title = text(series ? item.name : item.title);
  if (!title) return null;
  const releaseDate = text(series ? item.first_air_date : item.release_date);
  return {
    id: String(id),
    title,
    poster: posterUrl(item.poster_path),
    type: series ? "series" : "movie",
    year: yearFrom(releaseDate),
    rating: ratingFrom(item.vote_average),
    source: "tmdb",
    ref: `tmdb:${mediaType}:${id}`,
  };
}

function parseRef(value) {
  const match = text(value).match(/^tmdb:(movie|tv):(\d+)$/);
  if (!match) throw new Error("TMDB_BAD_REFERENCE");
  const id = Number(match[2]);
  if (!Number.isInteger(id) || id <= 0) throw new Error("TMDB_BAD_REFERENCE");
  return { mediaType: match[1], id };
}

function normalizeDetails(body = {}, mediaType, id) {
  const series = mediaType === "tv";
  const title = text(series ? body.name : body.title);
  if (!title) throw new Error("TMDB_INVALID_DETAILS");
  const releaseDate = text(series ? body.first_air_date : body.release_date);
  const seasons = series && Array.isArray(body.seasons)
    ? body.seasons
        .map((season) => ({
          season_number: Number(season?.season_number),
          name: text(season?.name),
          episode_count: Number(season?.episode_count) || 0,
          air_date: text(season?.air_date),
          poster: posterUrl(season?.poster_path),
        }))
        .filter((season) => Number.isInteger(season.season_number) && season.season_number >= 0)
    : [];
  return {
    status: "success",
    source: "tmdb",
    data: {
      id: String(id),
      ref: `tmdb:${mediaType}:${id}`,
      type: series ? "series" : "movie",
      title,
      original_title: text(series ? body.original_name : body.original_title),
      overview: text(body.overview),
      poster: posterUrl(body.poster_path, "w500"),
      backdrop: posterUrl(body.backdrop_path, "w780"),
      year: yearFrom(releaseDate),
      release_date: releaseDate,
      rating: ratingFrom(body.vote_average),
      runtime_minutes: series ? null : Number(body.runtime) || null,
      number_of_seasons: series ? Number(body.number_of_seasons) || seasons.length : null,
      number_of_episodes: series ? Number(body.number_of_episodes) || null : null,
      seasons,
    },
  };
}

function normalizeSeason(body = {}, id, seasonNumber) {
  const rawEpisodes = Array.isArray(body.episodes) ? body.episodes : [];
  const episodes = rawEpisodes
    .map((episode) => {
      const number = Number(episode?.episode_number);
      if (!Number.isInteger(number) || number < 1) return null;
      return {
        id: String(episode?.id ?? ""),
        episode_number: number,
        season_number: seasonNumber,
        title: text(episode?.name) || `الحلقة ${number}`,
        overview: text(episode?.overview),
        air_date: text(episode?.air_date),
        rating: ratingFrom(episode?.vote_average),
        still: posterUrl(episode?.still_path, "w500"),
        ref: `tmdb:tv:${id}:s${seasonNumber}:e${number}`,
      };
    })
    .filter(Boolean);
  return {
    status: "success",
    source: "tmdb",
    data: {
      id: String(body.id ?? ""),
      series_ref: `tmdb:tv:${id}`,
      season_number: seasonNumber,
      name: text(body.name) || `الموسم ${seasonNumber}`,
      overview: text(body.overview),
      poster: posterUrl(body.poster_path, "w500"),
      episodes,
    },
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
    while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  }

  async function request(path, params = {}) {
    if (!configured()) throw new Error("TMDB_NOT_CONFIGURED");
    if (typeof fetchImpl !== "function") throw new Error("TMDB_FETCH_UNAVAILABLE");
    const url = new URL(path, TMDB_ORIGIN);
    url.searchParams.set("api_key", text(apiKey));
    url.searchParams.set("language", "ar-SA");
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && String(value) !== "") url.searchParams.set(key, String(value));
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

  async function cachedRequest(key, resolver) {
    prune();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) return cached.value;
    const value = await resolver();
    cache.set(key, { expiresAt: now() + cacheTtlMs, value });
    prune();
    return value;
  }

  async function search(query) {
    const q = text(query);
    if (q.length < 2) return { status: "success", source: "tmdb", data: [] };
    const key = `search:${q.toLocaleLowerCase("ar")}`;
    return cachedRequest(key, async () => {
      const body = await request("/3/search/multi", { query: q, include_adult: "false" });
      const seen = new Set();
      const data = [];
      for (const raw of Array.isArray(body.results) ? body.results : []) {
        const item = normalizeResult(raw);
        if (!item || !seen.add(item.ref)) continue;
        data.push(item);
      }
      return { status: "success", source: "tmdb", data };
    });
  }

  async function details(ref) {
    const { mediaType, id } = parseRef(ref);
    return cachedRequest(`details:${mediaType}:${id}`, async () => {
      const body = await request(`/3/${mediaType}/${id}`);
      return normalizeDetails(body, mediaType, id);
    });
  }

  async function season(ref, seasonNumber) {
    const { mediaType, id } = parseRef(ref);
    if (mediaType !== "tv") throw new Error("TMDB_SEASON_REQUIRES_SERIES");
    const seasonValue = Number(seasonNumber);
    if (!Number.isInteger(seasonValue) || seasonValue < 0 || seasonValue > 100) throw new Error("TMDB_BAD_SEASON");
    return cachedRequest(`season:${id}:${seasonValue}`, async () => {
      const body = await request(`/3/tv/${id}/season/${seasonValue}`);
      return normalizeSeason(body, id, seasonValue);
    });
  }

  return Object.freeze({ status, search, details, season });
}

export const __tmdbTest = Object.freeze({
  normalizeResult,
  normalizeDetails,
  normalizeSeason,
  parseRef,
  yearFrom,
  ratingFrom,
});
