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

let directCalls = 0;
const direct = await runtime.openDirectMedia(first.data.ref, {
  range: "bytes=1024-2047",
  fetchImpl: async (target, init) => {
    assert.equal(String(target), internal.target);
    assert.equal(init.redirect, "manual");
    directCalls += 1;
    if (directCalls === 1) {
      assert.equal(init.headers.Range, "bytes=0-1023");
      return new Response(new Uint8Array([0, 0, 0, 16, 102, 116, 121, 112, 105, 115, 111, 109]), {
        status: 206,
        headers: {
          "content-type": "video/mp4",
          "content-range": "bytes 0-1023/4096",
          "accept-ranges": "bytes",
        },
      });
    }
    assert.equal(init.headers.Range, "bytes=1024-2047");
    return new Response(new Uint8Array([1, 2, 3, 4]), {
      status: 206,
      headers: {
        "content-type": "video/mp4",
        "content-length": "4",
        "content-range": "bytes 1024-1027/4096",
        "accept-ranges": "bytes",
      },
    });
  },
});
assert.equal(directCalls, 2);
assert.equal(direct.meta.container, "mp4");
assert.equal(direct.meta.status, 206);
assert.equal(direct.meta.contentRange, "bytes 1024-1027/4096");
assert.equal(direct.meta.acceptRanges, "bytes");
assert.equal(JSON.stringify(direct.meta).includes("https://"), false, "direct-media metadata must not leak provider target");
assert.deepEqual([...new Uint8Array(await direct.response.arrayBuffer())], [1, 2, 3, 4]);

await assert.rejects(() => runtime.openDirectMedia(first.data.ref, {
  range: "bytes=0-1,4-5",
  fetchImpl: async (_target, init) => {
    if (init.headers.Range === "bytes=0-1023") {
      return new Response(new Uint8Array([0, 0, 0, 16, 102, 116, 121, 112, 105, 115, 111, 109]), {
        status: 206,
        headers: { "content-type": "video/mp4", "content-range": "bytes 0-1023/4096" },
      });
    }
    throw new Error("should reject range before second request");
  },
}), /BAD_FALLBACK_RANGE/);

await assert.rejects(() => runtime.openDirectMedia(first.data.ref, {
  fetchImpl: async () => new Response("#EXTM3U\n#EXT-X-VERSION:3\n", {
    status: 200,
    headers: { "content-type": "application/vnd.apple.mpegurl" },
  }),
}), /FALLBACK_HLS_PROXY_PENDING/);

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
