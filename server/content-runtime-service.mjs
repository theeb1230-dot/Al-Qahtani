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
} = {}) {
  if (typeof fetchMatches !== "function") throw new TypeError("fetchMatches is required");
  if (typeof searchCatalog !== "function") throw new TypeError("searchCatalog is required");
  if (typeof fetchCategory !== "function") throw new TypeError("fetchCategory is required");

  async function execute({ kind, key, ttlMs, fallbackProvider, fetcher, normalize }) {
    const stamp = now();
    const cached = cache.get(key, stamp);
    if (cached) {
      return buildRuntimeEnvelope({
        kind,
        data: cached.data,
        source: cached.source,
        health: health.snapshot(cached.source, stamp),
        cached: true,
        generatedAt: cached.generatedAt,
      });
    }

    const started = now();
    let source = fallbackProvider;
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
        generatedAt: finished,
      });
    } catch (error) {
      const failedAt = now();
      health.recordFailure(source || fallbackProvider, { now: failedAt });
      throw error;
    }
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
        .then((result) => ({ status: "ready", cached: result.cached, data: result.data.slice(0, 12) }))
        .catch(() => ({ status: "unavailable", cached: false, data: [] }));

      const sectionsPromise = mapBounded(HOME_SECTIONS, HOME_CONCURRENCY, async (section) => {
        try {
          const result = await service.category(section.id, 1);
          return {
            id: section.id,
            title: section.title,
            type: section.type,
            status: "ready",
            cached: result.cached,
            data: result.data.slice(0, HOME_SECTION_LIMIT),
          };
        } catch {
          return {
            id: section.id,
            title: section.title,
            type: section.type,
            status: "unavailable",
            cached: false,
            data: [],
          };
        }
      });

      const [matches, sections] = await Promise.all([matchesPromise, sectionsPromise]);
      const partial = matches.status !== "ready" || sections.some((section) => section.status !== "ready");
      return buildRuntimeEnvelope({
        kind: "home",
        data: { matches, sections, partial },
        source: "al-qahtani-runtime",
        health: null,
        cached: matches.cached && sections.every((section) => section.cached || section.status !== "ready"),
        generatedAt,
      });
    },

    status() {
      return {
        status: "ok",
        version: PRODUCT_VERSION,
        cache_entries: cache.size,
        providers: health.summary(now()),
      };
    },
  };

  return service;
}
