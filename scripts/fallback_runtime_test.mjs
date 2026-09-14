import assert from "node:assert/strict";
import { FallbackPlaybackRuntime } from "../server/fallback-runtime.mjs";

let now = 1_700_000_000_000;
const runtime = new FallbackPlaybackRuntime({ ttlMs: 5_000, now: () => now });

const first = runtime.resolve({ tmdbId: 1396, type: "tv", season: 1, episode: 1 });
assert.equal(first.status, "success");
assert.match(first.data.ref, /^fallback:[A-Za-z0-9_-]{20,64}$/);
assert.equal(first.data.media_type, "embed");
assert.equal(JSON.stringify(first).includes("https://"), false, "public resolve response must not leak provider URL");

const internal = runtime.inspect(first.data.ref);
assert.equal(internal.identity.tmdbId, 1396);
assert.equal(internal.identity.season, 1);
assert.equal(internal.identity.episode, 1);
assert.match(internal.target, /^https:\/\//);

let probedTarget = "";
const probe = await runtime.probe(first.data.ref, {
  fetchImpl: async (target, init) => {
    probedTarget = String(target);
    assert.equal(init.redirect, "manual");
    assert.equal(init.headers.Range, "bytes=0-1023");
    return {
      status: 206,
      headers: {
        get(name) {
          const key = String(name).toLowerCase();
          if (key === "content-type") return "video/mp4";
          if (key === "content-range") return "bytes 0-1023/4096";
          if (key === "accept-ranges") return "bytes";
          return null;
        },
      },
      body: { cancel: async () => {} },
    };
  },
});
assert.match(probedTarget, /^https:\/\//, "server probe must receive the internal provider target");
assert.equal(probe.status, "success");
assert.equal(probe.data.ref, first.data.ref);
assert.equal(probe.data.playable_candidate, true);
assert.equal(probe.data.container, "mp4");
assert.equal(probe.data.range206, true);
assert.equal(probe.data.accept_ranges, true);
assert.equal(probe.data.status_code, 206);
assert.equal(JSON.stringify(probe).includes("https://"), false, "probe response must not leak provider URL");
assert.equal(JSON.stringify(probe).includes(internal.providerId), false, "probe response must not leak provider identity");

assert.throws(() => runtime.recordSuccess(first.data.ref, {}), /PLAYBACK_SIGNAL_REQUIRED/);
assert.deepEqual(runtime.recordSuccess(first.data.ref, { playbackSignal: true, latencyMs: 120, container: "embed" }), { status: "success" });

const second = runtime.recordFailure(first.data.ref);
assert.notEqual(second.data.ref, first.data.ref);
assert.equal(JSON.stringify(second).includes("https://"), false);
assert.notEqual(runtime.inspect(second.data.ref).providerId, internal.providerId);

assert.throws(() => runtime.resolve({ tmdbId: "1;evil", type: "movie" }), /INVALID_TMDB_ID/);
assert.throws(() => runtime.resolve({ tmdbId: 10, type: "tv", season: 0, episode: 1 }), /INVALID_SEASON/);
assert.throws(() => runtime.inspect("fallback:not-valid"), /BAD_FALLBACK_REFERENCE/);
await assert.rejects(() => runtime.probe("fallback:not-valid", { fetchImpl: async () => { throw new Error("should not run"); } }), /BAD_FALLBACK_REFERENCE/);

now += 5_001;
assert.throws(() => runtime.inspect(second.data.ref), /FALLBACK_REFERENCE_EXPIRED/);

console.log("fallback_runtime_test: ok");
