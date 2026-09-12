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

  return {
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

    status() {
      return {
        status: "ok",
        version: PRODUCT_VERSION,
        cache_entries: cache.size,
        providers: health.summary(now()),
      };
    },
  };
}
