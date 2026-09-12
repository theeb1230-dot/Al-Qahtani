import assert from "node:assert/strict";
import {
  PRODUCT_VERSION,
  TtlCache,
  ProviderHealthRegistry,
  normalizeCatalogItem,
  normalizeEpisode,
  normalizeMatch,
  buildRuntimeEnvelope,
} from "../server/content-runtime.mjs";

assert.equal(PRODUCT_VERSION, "1.0.13");

const cache = new TtlCache({ maxEntries: 2 });
cache.set("matches", { ok: true }, 1000, 10_000);
assert.deepEqual(cache.get("matches", 10_500), { ok: true });
assert.equal(cache.get("matches", 11_001), undefined);
cache.set("a", 1, 1000, 20_000);
cache.set("b", 2, 1000, 20_000);
cache.set("c", 3, 1000, 20_000);
assert.equal(cache.size, 2);
assert.equal(cache.get("a", 20_001), undefined);

const health = new ProviderHealthRegistry({ failureThreshold: 2, cooldownMs: 5000 });
health.recordSuccess("basri-direct", { latencyMs: 120, capabilities: { range206: true, safariPlayable: true, container: "mpeg-ts" }, now: 1000 });
health.recordSuccess("basri-worker", { latencyMs: 800, now: 1000 });
assert.equal(health.rank(["basri-worker", "basri-direct"], 1000)[0].name, "basri-direct");
health.recordFailure("basri-worker", { now: 2000 });
health.recordFailure("basri-worker", { now: 2100 });
assert.equal(health.isAvailable("basri-worker", 3000), false);
assert.equal(health.snapshot("basri-worker", 3000).circuitOpen, true);
assert.equal(health.isAvailable("basri-worker", 8000), true);

assert.deepEqual(normalizeCatalogItem({ name: "Test", image: "poster.jpg", is_series: false, href: "legacy:x", year: "2026" }), {
  id: "legacy:x",
  title: "Test",
  poster: "poster.jpg",
  type: "movie",
  year: 2026,
  ref: "legacy:x",
});

const episode = normalizeEpisode({ id: 89517, num: 2, title: "الحلقة الثانية", link: "legacy:episode" }, 8);
assert.equal(episode.episode_id, "89517");
assert.equal(episode.episode_number, 2);
assert.equal(episode.ref, "legacy:episode");
assert.equal(episode.watch_available, true);

const match = normalizeMatch({
  id: "m1",
  team1: { name: "راسينج سانتاندير", logo: "logo1.png", goals: "2" },
  team2: { name: "ألافيس", image: "logo2.png", goals: 1 },
  time: "03:00",
  priority: 3,
  status: "ended",
  competition: "لا ليغا",
  channel: "beIN Sports",
});
assert.equal(match.status, "ended");
assert.equal(match.team1.goals, 2);
assert.equal(match.team2.goals, 1);
assert.equal(match.team2.logo, "logo2.png");
assert.equal(match.competition, "لا ليغا");

const scorelessEnded = normalizeMatch({
  id: "m2",
  team1: { name: "فريق أ" },
  team2: { name: "فريق ب" },
  status: "ended",
  priority: 3,
});
assert.equal(scorelessEnded.team1.goals, null);
assert.equal(scorelessEnded.team2.goals, null);
assert.notEqual(`${scorelessEnded.team1.goals}-${scorelessEnded.team2.goals}`, "0-0");

const liveScore = normalizeMatch({
  team1: { name: "فريق ج", score: "3" },
  team2: { name: "فريق د", score: "2" },
  status: "live",
  priority: 1,
});
assert.equal(liveScore.status, "live");
assert.equal(liveScore.team1.goals, 3);
assert.equal(liveScore.team2.goals, 2);

const envelope = buildRuntimeEnvelope({ kind: "matches", data: [match], source: "basri-original", health: health.summary(3000), generatedAt: 0 });
assert.equal(envelope.status, "success");
assert.equal(envelope.version, "1.0.13");
assert.equal(envelope.generated_at, "1970-01-01T00:00:00.000Z");
assert.equal(envelope.data.length, 1);
assert.equal(envelope.source, "basri-original");
assert.equal(Array.isArray(envelope.health), true);

console.log("content runtime foundation: ok");
