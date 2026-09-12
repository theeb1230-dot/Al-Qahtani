#!/usr/bin/env node

import { PRODUCT_VERSION } from "../server/content-runtime.mjs";

const BASE = "https://al-qahtani-api.onrender.com";
const ORIGIN = "https://theeb1230-dot.github.io";

function assert(condition, name, detail = {}) {
  if (!condition) {
    console.error("FAIL", name, detail);
    process.exitCode = 1;
    return false;
  }
  console.log("PASS", name, detail);
  return true;
}

function containsSensitiveRuntimeField(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsSensitiveRuntimeField);
  return Object.entries(value).some(([key, child]) => {
    if (/token|secret|authorization|credential|session/i.test(key)) return true;
    return containsSensitiveRuntimeField(child);
  });
}

async function request(path, { timeoutMs = 90_000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(BASE + path, {
      headers: { Accept: "application/json", Origin: ORIGIN },
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data, text, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

async function waitForVersionedRuntime() {
  let last = null;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      last = await request("/api/runtime/status", { timeoutMs: 30_000 });
      if (last.response.ok && last.data?.status === "ok" && last.data?.version === PRODUCT_VERSION) return last;
    } catch (error) {
      last = { error };
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(15_000, attempt * 2_000)));
  }
  throw new Error(`runtime ${PRODUCT_VERSION} did not become ready: ${String(last?.error || last?.response?.status || "unknown")}; observed=${String(last?.data?.version || "none")}`);
}

try {
  const status = await waitForVersionedRuntime();
  assert(status.response.ok && status.data?.version === PRODUCT_VERSION, `deployed runtime status reports ${PRODUCT_VERSION}`, {
    status: status.response.status,
    cacheEntries: status.data?.cache_entries,
    providers: Array.isArray(status.data?.providers) ? status.data.providers.length : null,
    ms: status.ms,
  });
  assert(!containsSensitiveRuntimeField(status.data), "runtime status does not expose secret/session fields");

  const firstMatches = await request("/api/v1/matches");
  const matchData = firstMatches.data;
  assert(firstMatches.response.ok && matchData?.status === "success" && matchData?.version === PRODUCT_VERSION && matchData?.kind === "matches", `deployed v1 matches contract ${PRODUCT_VERSION}`, {
    source: matchData?.source,
    cached: matchData?.cached,
    stale: matchData?.stale,
    count: Array.isArray(matchData?.data) ? matchData.data.length : null,
    ms: firstMatches.ms,
  });
  assert(Array.isArray(matchData?.data), "deployed v1 matches data is normalized list");
  assert(!containsSensitiveRuntimeField(matchData), "deployed v1 matches do not expose secret/session fields");

  const secondMatches = await request("/api/v1/matches");
  assert(secondMatches.response.ok && secondMatches.data?.status === "success" && secondMatches.data?.version === PRODUCT_VERSION, "deployed v1 matches second request succeeds", {
    cached: secondMatches.data?.cached,
    stale: secondMatches.data?.stale,
    ms: secondMatches.ms,
  });
  assert(secondMatches.data?.cached === true || firstMatches.data?.cached === true, "deployed short-lived matches cache becomes observable", {
    firstCached: firstMatches.data?.cached,
    secondCached: secondMatches.data?.cached,
  });

  for (const searchCase of [
    { query: "الذئب الوحيد", requireItems: true },
    { query: "The Odyssey", requireItems: false },
  ]) {
    const query = searchCase.query;
    const search = await request("/api/v1/search?q=" + encodeURIComponent(query), { timeoutMs: 120_000 });
    const data = search.data;
    assert(search.response.ok && data?.status === "success" && data?.version === PRODUCT_VERSION && data?.kind === "search", `deployed v1 search contract ${PRODUCT_VERSION}: ${query}`, {
      source: data?.source,
      cached: data?.cached,
      stale: data?.stale,
      count: Array.isArray(data?.data) ? data.data.length : null,
      ms: search.ms,
    });
    assert(Array.isArray(data?.data), `deployed v1 search returns normalized list: ${query}`);
    if (searchCase.requireItems) {
      assert(data.data.length > 0, `deployed v1 search returns current source items: ${query}`);
    } else {
      console.log("INFO deployed v1 search source-dependent count", { query, count: data.data.length });
    }
    assert((data?.data || []).every((item) => item && typeof item.title === "string" && typeof item.ref === "string" && item.ref.startsWith("legacy:")), `deployed v1 search items are normalized: ${query}`);
    assert(!containsSensitiveRuntimeField(data), `deployed v1 search does not expose secret/session fields: ${query}`);
  }

  const categoryRef = "https://akwam.ss/series?section=30";
  const category = await request("/api/v1/category?ref=" + encodeURIComponent(categoryRef) + "&p=1", { timeoutMs: 120_000 });
  assert(category.response.ok && category.data?.status === "success" && category.data?.version === PRODUCT_VERSION && category.data?.kind === "category", `deployed v1 category contract ${PRODUCT_VERSION}`, {
    source: category.data?.source,
    cached: category.data?.cached,
    stale: category.data?.stale,
    count: Array.isArray(category.data?.data) ? category.data.data.length : null,
    ms: category.ms,
  });
  assert(Array.isArray(category.data?.data) && category.data.data.length > 0, "deployed v1 category returns real items");
  assert(!containsSensitiveRuntimeField(category.data), "deployed v1 category does not expose secret/session fields");

  const health = await request("/api/runtime/status");
  assert(health.response.ok && health.data?.version === PRODUCT_VERSION && Array.isArray(health.data?.providers), "deployed runtime health summary remains structured", {
    version: health.data?.version,
    providers: health.data?.providers?.map((item) => ({ name: item.name, score: item.score, circuit: item.circuitOpen })) || [],
  });
} catch (error) {
  console.error("REMOTE_RUNTIME_V1_FATAL", error);
  process.exitCode = 1;
}
