import test from "node:test";
import assert from "node:assert/strict";
import { createTheebFetch } from "../server/theeb-fetch.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const empty = { data: { items: [], searched_providers: 8, successful_providers: 2, failed_providers: 6 } };
const hit = { data: { items: [{ provider: "qask", provider_series_id: "wolf", title: "الذئب الوحيد" }] } };

test("retries a 200-empty discovery response and returns the recovered result", async () => {
  const responses = [jsonResponse(empty), jsonResponse(hit)];
  let calls = 0;
  const fetcher = createTheebFetch({
    nativeFetch: async () => responses[calls++],
    discoveryRetries: 2,
    discoveryRetryDelaysMs: [0, 0],
    wait: async () => {},
    log: () => {},
  });
  const response = await fetcher("https://theeb-arab-api.onrender.com/v1/discover?q=wolf");
  assert.equal(calls, 2);
  assert.deepEqual((await response.json()).data.items, hit.data.items);
});

test("keeps retrying discovery across a short 502 wave before recovering", async () => {
  const responses = [
    jsonResponse({ error: "temporary" }, 502),
    jsonResponse({ error: "temporary" }, 502),
    jsonResponse({ error: "temporary" }, 502),
    jsonResponse(hit),
  ];
  let calls = 0;
  const delays = [];
  const events = [];
  const fetcher = createTheebFetch({
    nativeFetch: async () => responses[calls++],
    retries: 0,
    discoveryRetries: 4,
    discoveryRetryDelaysMs: [750, 1500, 3000, 6000],
    wait: async (ms) => delays.push(ms),
    log: (event) => events.push(event),
  });
  const response = await fetcher("https://theeb-arab-api.onrender.com/v1/discover?q=wolf");
  assert.equal(response.status, 200);
  assert.equal(calls, 4);
  assert.deepEqual(delays, [750, 1500, 3000]);
  assert.equal((await response.json()).data.items.length, 1);
  assert.ok(events.includes("theeb_discovery_recovered"));
});

test("serves a successful discovery from cache during a later empty outage", async () => {
  let clock = 1000;
  let calls = 0;
  const responses = [jsonResponse(hit), jsonResponse(empty), jsonResponse(empty), jsonResponse(empty)];
  const fetcher = createTheebFetch({
    nativeFetch: async () => responses[calls++],
    discoveryRetries: 2,
    discoveryRetryDelaysMs: [0, 0],
    freshTtlMs: 10,
    staleTtlMs: 10_000,
    now: () => clock,
    wait: async () => {},
    log: () => {},
  });
  const first = await fetcher("https://theeb-arab-api.onrender.com/v1/discover?q=wolf");
  assert.equal((await first.json()).data.items.length, 1);
  clock += 20;
  const stale = await fetcher("https://theeb-arab-api.onrender.com/v1/discover?q=wolf");
  assert.equal(stale.headers.get("X-Al-Qahtani-Discovery-Cache"), "stale");
  assert.equal((await stale.json()).data.items.length, 1);
  assert.equal(calls, 4);
});

test("injects the service bearer token only for protected provider routes", async () => {
  const seen = [];
  const fetcher = createTheebFetch({
    serviceToken: "secret-token",
    nativeFetch: async (input, init = {}) => {
      seen.push({ url: String(input), headers: new Headers(init.headers || {}) });
      return jsonResponse({ ok: true });
    },
    log: () => {},
  });
  await fetcher("https://theeb-arab-api.onrender.com/api/providers/qask/episode/1");
  await fetcher("https://theeb-arab-api.onrender.com/v1/search?q=test");
  assert.equal(seen[0].headers.get("Authorization"), "Bearer secret-token");
  assert.equal(seen[1].headers.get("Authorization"), null);
});

test("retries transient 5xx failures from protected provider GET routes", async () => {
  const responses = [jsonResponse({ error: "temporary" }, 500), jsonResponse({ episode: { id: "44" } }, 200)];
  let calls = 0;
  const events = [];
  const fetcher = createTheebFetch({
    serviceToken: "secret-token",
    nativeFetch: async () => responses[calls++],
    retries: 2,
    retryDelaysMs: [0, 0],
    wait: async () => {},
    log: (event) => events.push(event),
  });
  const response = await fetcher("https://theeb-arab-api.onrender.com/api/providers/akwam/episode/44");
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.ok(events.includes("theeb_provider_http_error"));
  assert.ok(events.includes("theeb_provider_recovered"));
});

test("does not retry provider target validation failures", async () => {
  let calls = 0;
  const fetcher = createTheebFetch({
    serviceToken: "secret-token",
    nativeFetch: async () => {
      calls += 1;
      return jsonResponse({ error: "INVALID_PROVIDER_TARGET" }, 400);
    },
    retries: 2,
    wait: async () => {},
    log: () => {},
  });
  const response = await fetcher("https://theeb-arab-api.onrender.com/api/providers/akwam/episode/not-valid");
  assert.equal(response.status, 400);
  assert.equal(calls, 1);
});

test("passes unrelated origins through without mutation", async () => {
  let calls = 0;
  const fetcher = createTheebFetch({
    nativeFetch: async () => {
      calls += 1;
      return jsonResponse({ ok: true });
    },
    serviceToken: "secret-token",
    log: () => {},
  });
  const response = await fetcher("https://example.org/data");
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
});
