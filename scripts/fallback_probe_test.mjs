import assert from "node:assert/strict";
import { classifyFallbackProbeResponse, probeFallbackTarget } from "../server/fallback-probe.mjs";

function headers(values = {}) {
  const normalized = new Map(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]));
  return { get: (key) => normalized.get(String(key).toLowerCase()) || null };
}

assert.deepEqual(
  classifyFallbackProbeResponse({
    status: 206,
    contentType: "video/mp4",
    contentRange: "bytes 0-1023/4096",
    acceptRanges: "bytes",
  }),
  {
    reachable: true,
    kind: "direct",
    playable: true,
    container: "mp4",
    range206: true,
    acceptRanges: true,
    redirect: false,
  },
);

assert.equal(classifyFallbackProbeResponse({ status: 200, contentType: "application/vnd.apple.mpegurl" }).container, "hls");
assert.equal(classifyFallbackProbeResponse({ status: 200, contentType: "video/mp2t" }).container, "mpeg-ts");
assert.equal(classifyFallbackProbeResponse({ status: 200, contentType: "text/html; charset=utf-8" }).kind, "embed");
assert.equal(classifyFallbackProbeResponse({ status: 302, location: "https://redirect.invalid/" }).kind, "redirect");
assert.equal(classifyFallbackProbeResponse({ status: 200, contentType: "application/json" }).playable, false, "HTTP 200 alone must not be playable evidence");

let cancelled = false;
let observedOptions;
let now = 1000;
const direct = await probeFallbackTarget("https://example.com/video", {
  timeoutMs: 500,
  now: () => (now += 25),
  fetchImpl: async (_url, options) => {
    observedOptions = options;
    return {
      status: 206,
      headers: headers({
        "content-type": "video/mp4",
        "content-range": "bytes 0-1023/8384",
        "accept-ranges": "bytes",
      }),
      body: { cancel: async () => { cancelled = true; } },
    };
  },
});
assert.equal(observedOptions.method, "GET");
assert.equal(observedOptions.redirect, "manual", "probe must not follow upstream redirects");
assert.equal(observedOptions.headers.Range, "bytes=0-1023", "probe must be byte-bounded");
assert.equal(direct.kind, "direct");
assert.equal(direct.container, "mp4");
assert.equal(direct.range206, true);
assert.equal(cancelled, true, "probe body should be cancelled after header classification");
assert.equal(JSON.stringify(direct).includes("https://"), false, "probe result must not leak upstream URL");

const networkError = await probeFallbackTarget("https://example.com/video", {
  fetchImpl: async () => { throw new Error("offline"); },
});
assert.equal(networkError.reachable, false);
assert.equal(networkError.kind, "network-error");
assert.equal(networkError.playable, false);

await assert.rejects(() => probeFallbackTarget("http://example.com/video"), /FALLBACK_PROBE_HTTPS_REQUIRED/);

console.log("fallback_probe_test: ok");
