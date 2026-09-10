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

export function createTheebFetch({
  nativeFetch = globalThis.fetch.bind(globalThis),
  origin = DEFAULT_ORIGIN,
  serviceToken = "",
  retries = 2,
  retryDelaysMs = [250, 750],
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

  async function waitForRetry(attempt) {
    const delay = retryDelaysMs[Math.min(attempt, retryDelaysMs.length - 1)] ?? 500;
    await wait(Math.max(0, delay));
  }

  return async function theebFetch(input, init = {}) {
    const url = inputUrl(input);
    if (!url || url.origin !== origin) return nativeFetch(input, init);

    const method = methodOf(input, init);
    if (url.pathname.startsWith("/api/providers/")) {
      const headers = inheritedHeaders(input, init);
      if (serviceToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${serviceToken}`);
      }
      const requestInit = { ...init, headers };
      if (method !== "GET") return nativeFetch(input, requestInit);

      let lastResponse = null;
      let lastError = null;
      const attempts = Math.max(1, retries + 1);
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          const response = await nativeFetch(input, requestInit);
          lastResponse = response;
          if (!retryableStatus(response.status)) {
            if (attempt > 0) {
              log("theeb_provider_recovered", { path: url.pathname, attempt: attempt + 1, status: response.status });
            }
            return response;
          }
          log("theeb_provider_http_error", { path: url.pathname, attempt: attempt + 1, status: response.status });
        } catch (error) {
          lastError = error;
          log("theeb_provider_transport_error", { path: url.pathname, attempt: attempt + 1, error: String(error?.message || error) });
        }
        if (attempt + 1 < attempts) await waitForRetry(attempt);
      }
      if (lastResponse) return lastResponse;
      throw lastError || new Error("THEEB_PROVIDER_UNAVAILABLE");
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
    const attempts = Math.max(1, retries + 1);
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await nativeFetch(input, init);
        lastResponse = response;
        if (response.ok) {
          const inspected = await inspectDiscovery(response);
          if (inspected.items.length > 0) {
            const body = await response.clone().text();
            cache.set(key, {
              storedAt: now(),
              body,
              headers: Array.from(response.headers.entries()),
            });
            trimCache();
            if (attempt > 0) {
              log("theeb_discovery_recovered", { query: url.searchParams.get("q") || "", attempt: attempt + 1, count: inspected.items.length });
            }
            return response;
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

      if (attempt + 1 < attempts) await waitForRetry(attempt);
    }

    if (cached && timestamp - cached.storedAt <= staleTtlMs) {
      log("theeb_discovery_stale_hit", { query: url.searchParams.get("q") || "", age_ms: timestamp - cached.storedAt });
      return responseFromCache(cached);
    }
    if (lastResponse) return lastResponse;
    throw lastError || new Error("THEEB_DISCOVERY_UNAVAILABLE");
  };
}
