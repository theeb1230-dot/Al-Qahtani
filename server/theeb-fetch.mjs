const DEFAULT_ORIGIN = "https://theeb-arab-api.onrender.com";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inputUrl(input) {
  try {
    return new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  } catch {
    return null;
  }
}

function inheritedHeaders(input, init) {
  const inherited = input instanceof Request ? input.headers : undefined;
  return new Headers(init.headers || inherited || {});
}

function methodOf(input, init) {
  return String(init.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
}

function retryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function inspectDiscovery(response) {
  let data = null;
  try {
    data = await response.clone().json();
  } catch {}
  const items = Array.isArray(data?.data?.items) ? data.data.items : [];
  return {
    items,
    diagnostics: {
      searched: Number(data?.data?.searched_providers || 0),
      successful: Number(data?.data?.successful_providers || 0),
      failed: Number(data?.data?.failed_providers || 0),
    },
  };
}

function responseFromCache(entry) {
  const headers = new Headers(entry.headers);
  headers.set("X-Al-Qahtani-Discovery-Cache", "stale");
  return new Response(entry.body, { status: 200, headers });
}

function liveSearchItems(data, query) {
  const results = Array.isArray(data?.results) ? data.results : [];
  return results
    .map((item) => ({
      provider: String(item.provider || item.search_provider || ""),
      provider_series_id: String(item.provider_series_id || ""),
      title: String(item.title || ""),
      display_title: String(item.title || ""),
      source_url: item.source_url || null,
      image: item.image || item.poster || null,
      year: item.year ? String(item.year) : null,
      content_type: item.type === "movie" ? "movie" : "series",
      match_score: Number(item.match_score || 0),
      match_level: String(item.match_level || "weak"),
      query,
    }))
    .filter((item) => item.provider && item.provider_series_id && item.title);
}

export function createTheebFetch({
  nativeFetch = globalThis.fetch.bind(globalThis),
  origin = DEFAULT_ORIGIN,
  serviceToken = "",
  retries = 2,
  retryDelaysMs = [250, 750],
  discoveryRetries = 4,
  discoveryRetryDelaysMs = [750, 1500, 3000, 6000],
  freshTtlMs = 10 * 60_000,
  staleTtlMs = 60 * 60_000,
  maxEntries = 120,
  now = () => Date.now(),
  wait = sleep,
  log = (event, data) => console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data })),
} = {}) {
  const cache = new Map();

  function trimCache() {
    const timestamp = now();
    for (const [key, value] of cache) {
      if (timestamp - value.storedAt > staleTtlMs) cache.delete(key);
    }
    while (cache.size > maxEntries) cache.delete(cache.keys().next().value);
  }

  function cacheResponse(key, response) {
    return response.clone().text().then((body) => {
      cache.set(key, {
        storedAt: now(),
        body,
        headers: Array.from(response.headers.entries()),
      });
      trimCache();
      return response;
    });
  }

  async function waitForRetry(attempt, delays = retryDelaysMs) {
    const delay = delays[Math.min(attempt, delays.length - 1)] ?? 500;
    await wait(Math.max(0, delay));
  }

  async function protectedGet(input, init, url) {
    const headers = inheritedHeaders(input, init);
    if (serviceToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${serviceToken}`);
    }
    const requestInit = { ...init, headers };
    const attempts = Math.max(1, retries + 1);
    let lastResponse = null;
    let lastError = null;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await nativeFetch(input, requestInit);
        lastResponse = response;
        if (!retryableStatus(response.status)) {
          if (attempt > 0) {
            log("theeb_protected_recovered", { path: url.pathname, attempt: attempt + 1, status: response.status });
          }
          return response;
        }
        log("theeb_protected_http_error", { path: url.pathname, attempt: attempt + 1, status: response.status });
      } catch (error) {
        lastError = error;
        log("theeb_protected_transport_error", { path: url.pathname, attempt: attempt + 1, error: String(error?.message || error) });
      }
      if (attempt + 1 < attempts) await waitForRetry(attempt);
    }
    if (lastResponse) return lastResponse;
    throw lastError || new Error("THEEB_PROTECTED_ROUTE_UNAVAILABLE");
  }

  async function liveSearchFallback(query) {
    if (!serviceToken || !query) {
      log("theeb_live_search_skipped", { query, reason: serviceToken ? "empty_query" : "missing_service_token" });
      return null;
    }
    const url = new URL("/api/search", origin);
    url.searchParams.set("q", query);
    const headers = new Headers({ Accept: "application/json" });
    headers.set("Authorization", `Bearer ${serviceToken}`);
    try {
      const response = await nativeFetch(url, { headers, cache: "no-store" });
      if (!response.ok) {
        log("theeb_live_search_http_error", { query, status: response.status });
        return null;
      }
      let data = null;
      try {
        data = await response.json();
      } catch {
        log("theeb_live_search_invalid_json", { query });
        return null;
      }
      const items = liveSearchItems(data, query);
      if (!items.length) {
        log("theeb_live_search_empty", {
          query,
          searched: Number(data?.searched_providers || 0),
          successful: Number(data?.successful_providers || 0),
          failed: Number(data?.failed_providers || 0),
        });
        return null;
      }
      log("theeb_live_search_recovered", { query, count: items.length });
      return new Response(JSON.stringify({
        data: {
          query,
          count: items.length,
          searched_providers: Number(data?.searched_providers || 0),
          successful_providers: Number(data?.successful_providers || 0),
          failed_providers: Number(data?.failed_providers || 0),
          items,
        },
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Al-Qahtani-Discovery-Fallback": "live-search",
        },
      });
    } catch (error) {
      log("theeb_live_search_transport_error", { query, error: String(error?.message || error) });
      return null;
    }
  }

  return async function theebFetch(input, init = {}) {
    const url = inputUrl(input);
    if (!url || url.origin !== origin) return nativeFetch(input, init);

    const method = methodOf(input, init);
    const protectedRoute = url.pathname.startsWith("/api/providers/") || url.pathname === "/api/search" || url.pathname.startsWith("/api/resolve");
    if (protectedRoute) {
      if (method !== "GET") {
        const headers = inheritedHeaders(input, init);
        if (serviceToken && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${serviceToken}`);
        return nativeFetch(input, { ...init, headers });
      }
      return protectedGet(input, init, url);
    }

    if (method !== "GET" || url.pathname !== "/v1/discover") {
      return nativeFetch(input, init);
    }

    const key = url.href;
    const cached = cache.get(key);
    const timestamp = now();
    if (cached && timestamp - cached.storedAt <= freshTtlMs) {
      const headers = new Headers(cached.headers);
      headers.set("X-Al-Qahtani-Discovery-Cache", "fresh");
      return new Response(cached.body, { status: 200, headers });
    }

    let lastResponse = null;
    let lastError = null;
    const attempts = Math.max(1, discoveryRetries + 1);
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await nativeFetch(input, init);
        lastResponse = response;
        if (response.ok) {
          const inspected = await inspectDiscovery(response);
          if (inspected.items.length > 0) {
            if (attempt > 0) {
              log("theeb_discovery_recovered", { query: url.searchParams.get("q") || "", attempt: attempt + 1, count: inspected.items.length });
            }
            return cacheResponse(key, response);
          }
          log("theeb_discovery_empty", {
            query: url.searchParams.get("q") || "",
            attempt: attempt + 1,
            ...inspected.diagnostics,
          });
        } else if (!retryableStatus(response.status)) {
          return response;
        } else {
          log("theeb_discovery_http_error", { query: url.searchParams.get("q") || "", attempt: attempt + 1, status: response.status });
        }
      } catch (error) {
        lastError = error;
        log("theeb_discovery_transport_error", { query: url.searchParams.get("q") || "", attempt: attempt + 1, error: String(error?.message || error) });
      }

      if (attempt + 1 < attempts) await waitForRetry(attempt, discoveryRetryDelaysMs);
    }

    const query = url.searchParams.get("q") || "";
    const liveFallback = await liveSearchFallback(query);
    if (liveFallback) return cacheResponse(key, liveFallback);

    if (cached && timestamp - cached.storedAt <= staleTtlMs) {
      log("theeb_discovery_stale_hit", { query, age_ms: timestamp - cached.storedAt });
      return responseFromCache(cached);
    }
    log("theeb_discovery_exhausted", {
      query,
      attempts,
      status: lastResponse?.status || null,
      cached: Boolean(cached),
      transport_error: lastError ? String(lastError?.message || lastError) : null,
    });
    if (lastResponse) return lastResponse;
    throw lastError || new Error("THEEB_DISCOVERY_UNAVAILABLE");
  };
}
