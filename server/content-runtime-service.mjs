import {
  PRODUCT_VERSION,
  TtlCache,
  ProviderHealthRegistry,
  buildRuntimeEnvelope,
  normalizeCatalogItem,
  normalizeMatch,
} from "./content-runtime.mjs";
import { resolveCatalogCategory } from "./catalog-categories.mjs";

const DEFAULT_MATCH_TTL_MS = 15_000;
const DEFAULT_CATALOG_TTL_MS = 30_000;
const DEFAULT_STALE_IF_ERROR_MS = 5 * 60_000;
const DEFAULT_FETCH_ATTEMPTS = 2;
const HOME_SECTION_LIMIT = 8;
const HOME_CONCURRENCY = 2;
const HOME_SECTIONS = Object.freeze([
  Object.freeze({ id: "series-foreign", title: "مسلسلات أجنبية", type: "series" }),
  Object.freeze({ id: "series-arabic", title: "مسلسلات عربية", type: "series" }),
  Object.freeze({ id: "movie-foreign", title: "أفلام أجنبية", type: "movie" }),
  Object.freeze({ id: "movie-arabic", title: "أفلام عربية", type: "movie" }),
]);

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function providerName(payload, fallback) {
  const value = String(payload?.source || fallback || "basri-original").trim();
  return value || "basri-original";
}

function cacheKey(prefix, value = "") {
  return `${prefix}:${String(value).trim().toLowerCase()}`;
}

async function mapBounded(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(items.length || 1, Number(concurrency) || 1));
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}

export function createContentRuntimeService({
  fetchMatches,
  searchCatalog,
  fetchCategory,
  now = () => Date.now(),
  cache = new TtlCache({ maxEntries: 96 }),
  health = new ProviderHealthRegistry({ failureThreshold: 3, cooldownMs: 30_000 }),
  matchTtlMs = DEFAULT_MATCH_TTL_MS,
  catalogTtlMs = DEFAULT_CATALOG_TTL_MS,
  staleIfErrorMs = DEFAULT_STALE_IF_ERROR_MS,
  fetchAttempts = DEFAULT_FETCH_ATTEMPTS,
} = {}) {
  if (typeof fetchMatches !== "function") throw new TypeError("fetchMatches is required");
  if (typeof searchCatalog !== "function") throw new TypeError("searchCatalog is required");
  if (typeof fetchCategory !== "function") throw new TypeError("fetchCategory is required");

  const maxStaleMs = Math.max(0, Number(staleIfErrorMs) || 0);
  const attempts = Math.max(1, Math.min(3, Math.trunc(Number(fetchAttempts) || DEFAULT_FETCH_ATTEMPTS)));

  async function execute({ kind, key, ttlMs, fallbackProvider, fetcher, normalize }) {
    const stamp = now();
    const cachedEntry = typeof cache.peek === "function" ? cache.peek(key, stamp) : undefined;
    if (cachedEntry && !cachedEntry.expired) {
      const cached = cachedEntry.value;
      return buildRuntimeEnvelope({
        kind,
        data: cached.data,
        source: cached.source,
        health: health.snapshot(cached.source, stamp),
        cached: true,
        stale: false,
        generatedAt: cached.generatedAt,
      });
    }

    let source = fallbackProvider;
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const started = now();
      try {
        const payload = await fetcher();
        source = providerName(payload, fallbackProvider);
        const data = normalize(payload);
        const finished = now();
        health.recordSuccess(source, { latencyMs: Math.max(0, finished - started), now: finished });
        cache.set(key, { data, source, generatedAt: finished }, ttlMs, finished);
        return buildRuntimeEnvelope({
          kind,
          data,
          source,
          health: health.snapshot(source, finished),
          cached: false,
          stale: false,
          generatedAt: finished,
        });
      } catch (error) {
        lastError = error;
        const failedAt = now();
        health.recordFailure(source || fallbackProvider, { now: failedAt });
      }
    }

    if (cachedEntry?.value && cachedEntry.expired && maxStaleMs > 0 && stamp - cachedEntry.expiresAt <= maxStaleMs) {
      const stale = cachedEntry.value;
      return buildRuntimeEnvelope({
        kind,
        data: stale.data,
        source: stale.source,
        health: health.snapshot(stale.source, now()),
        cached: true,
        stale: true,
        generatedAt: stale.generatedAt,
      });
    }

    throw lastError || new Error("RUNTIME_FETCH_FAILED");
  }

  const service = {
    version: PRODUCT_VERSION,
    health,
    cache,

    async matches() {
      return execute({
        kind: "matches",
        key: "matches:today",
        ttlMs: matchTtlMs,
        fallbackProvider: "basri-matches",
        fetcher: fetchMatches,
        normalize: (payload) => unwrapList(payload).map(normalizeMatch),
      });
    },

    async search(query) {
      const q = String(query || "").trim();
      if (!q) return buildRuntimeEnvelope({ kind: "search", data: [], source: "basri-original", health: null });
      return execute({
        kind: "search",
        key: cacheKey("search", q),
        ttlMs: catalogTtlMs,
        fallbackProvider: "basri-cinema",
        fetcher: () => searchCatalog(q),
        normalize: (payload) => unwrapList(payload).map(normalizeCatalogItem).filter((item) => item.ref),
      });
    },

    async category(ref, page = 1) {
      const category = resolveCatalogCategory(ref);
      const pageNumber = Math.max(1, Number(page) || 1);
      if (!category) return buildRuntimeEnvelope({ kind: "category", data: [], source: "basri-original", health: null });
      return execute({
        kind: "category",
        key: cacheKey("category", `${category.id}|${pageNumber}`),
        ttlMs: catalogTtlMs,
        fallbackProvider: "basri-cinema",
        fetcher: () => fetchCategory(category.sourceUrl, pageNumber),
        normalize: (payload) => unwrapList(payload).map(normalizeCatalogItem).filter((item) => item.ref),
      });
    },

    async home() {
      const generatedAt = now();
      const matchesPromise = service.matches()
        .then((result) => ({ status: result.stale ? "stale" : "ready", cached: result.cached, stale: result.stale, data: result.data.slice(0, 12) }))
        .catch(() => ({ status: "unavailable", cached: false, stale: false, data: [] }));

      const sectionsPromise = mapBounded(HOME_SECTIONS, HOME_CONCURRENCY, async (section) => {
        try {
          const result = await service.category(section.id, 1);
          return {
            id: section.id,
            title: section.title,
            type: section.type,
            status: result.stale ? "stale" : "ready",
            cached: result.cached,
            stale: result.stale,
            data: result.data.slice(0, HOME_SECTION_LIMIT),
          };
        } catch {
          return {
            id: section.id,
            title: section.title,
            type: section.type,
            status: "unavailable",
            cached: false,
            stale: false,
            data: [],
          };
        }
      });

      const [matches, sections] = await Promise.all([matchesPromise, sectionsPromise]);
      const partial = matches.status === "unavailable" || sections.some((section) => section.status === "unavailable");
      const stale = matches.status === "stale" || sections.some((section) => section.status === "stale");
      return buildRuntimeEnvelope({
        kind: "home",
        data: { matches, sections, partial, stale },
        source: "al-qahtani-runtime",
        health: null,
        cached: matches.cached && sections.every((section) => section.cached || section.status === "unavailable"),
        stale,
        generatedAt,
      });
    },

    status() {
      return {
        status: "ok",
        version: PRODUCT_VERSION,
        cache_entries: cache.size,
        resilience: {
          fetch_attempts: attempts,
          stale_if_error_ms: maxStaleMs,
        },
        providers: health.summary(now()),
      };
    },
  };

  return service;
}
