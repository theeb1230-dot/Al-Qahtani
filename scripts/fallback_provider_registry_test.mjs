import assert from "node:assert/strict";
import {
  FallbackProviderPool,
  buildFallbackProviderUrl,
  fallbackProviderCount,
  listFallbackProviders,
} from "../server/fallback-providers.mjs";

assert.equal(fallbackProviderCount(), 27);
const providers = listFallbackProviders();
assert.equal(providers.length, 27);
assert.equal(new Set(providers.map((item) => item.id)).size, 27);
assert.ok(providers.every((item) => item.movie && item.series));
assert.ok(providers.every((item) => !("movieTemplate" in item) && !("seriesTemplate" in item)));

const movie = buildFallbackProviderUrl("vidlink", { tmdbId: 550, type: "movie" });
assert.equal(movie.href, "https://vidlink.pro/embed/movie/550");

const episode = buildFallbackProviderUrl("videasy", { tmdbId: 1396, type: "tv", season: 1, episode: 2 });
assert.equal(episode.href, "https://player.videasy.net/tv/1396/1/2?color=6C63FF");

assert.throws(() => buildFallbackProviderUrl("vidlink", { tmdbId: "1/../../x", type: "movie" }), /INVALID_TMDB_ID/);
assert.throws(() => buildFallbackProviderUrl("vidlink", { tmdbId: 1, type: "tv", season: 0, episode: 1 }), /INVALID_SEASON/);
assert.throws(() => buildFallbackProviderUrl("missing", { tmdbId: 1, type: "movie" }), /UNKNOWN_FALLBACK_PROVIDER/);
assert.throws(() => buildFallbackProviderUrl("vidlink", { tmdbId: 1, type: "clip" }), /INVALID_MEDIA_TYPE/);

const pool = new FallbackProviderPool();
const initial = pool.ranked(1_000);
assert.equal(initial.length, 27);
assert.equal(initial[0].id, "pomfy");

pool.recordPlaybackFailure("pomfy", { now: 2_000 });
pool.recordPlaybackFailure("pomfy", { now: 2_100 });
const afterFailures = pool.ranked(2_200);
assert.equal(afterFailures.find((item) => item.id === "pomfy")?.available, false);
assert.notEqual(afterFailures[0].id, "pomfy");

pool.recordPlaybackSuccess("vidlink", {
  latencyMs: 350,
  container: "hls",
  range206: true,
  safariPlayable: true,
  now: 2_300,
});
assert.equal(pool.ranked(2_400)[0].id, "vidlink");

console.log("fallback provider registry tests passed");
