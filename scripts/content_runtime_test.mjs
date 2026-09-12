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

assert.equal(PRODUCT_VERSION, "1.0.14");

const cache = new TtlCache({ maxEntries: 2 });
cache.set("matches", { ok: true }, 1000, 10_000);
assert.deepEqual(cache.get("matches", 10_500), { ok: true });
assert.equal(cache.get("matches", 11_001), undefined);
cache.set("peek", { ok: "stale" }, 100, 12_000);
const stalePeek = cache.peek("peek", 12_101);
assert.equal(stalePeek.expired, true);
assert.deepEqual(stalePeek.value, { ok: "stale" });
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
  competition: "لا ليغا",
  channel: "beIN Sports",
  link: "match-ref",
});
assert.equal(match.status, "ended");
assert.equal(match.team1.goals, 2);
assert.equal(match.team2.goals, 1);
assert.equal(match.team2.logo, "logo2.png");
assert.equal(match.competition, "لا ليغا");
assert.equal(match.ref, "match-ref");

const absentScore = normalizeMatch({
  id: "m2",
  team1: { name: "فريق أ", goals: "" },
  team2: { name: "فريق ب" },
  priority: 3,
});
assert.equal(absentScore.team1.goals, null);
assert.equal(absentScore.team2.goals, null);

const placeholderEndedScore = normalizeMatch({
  id: "m-placeholder",
  team1: { name: "راسينج سانتاندير", goals: "0" },
  team2: { name: "ألافيس", goals: "0" },
  status: "انتهت",
  priority: 3,
});
assert.equal(placeholderEndedScore.status, "ended");
assert.equal(placeholderEndedScore.team1.goals, null);
assert.equal(placeholderEndedScore.team2.goals, null);

const topLevelScore = normalizeMatch({
  id: "m3",
  team1: { name: "الزمالك" },
  team2: { name: "إيه إس بورت" },
  home_score: "2",
  away_score: "0",
  priority: 1,
});
assert.equal(topLevelScore.status, "live");
assert.equal(topLevelScore.team1.goals, 2);
assert.equal(topLevelScore.team2.goals, 0);

const liveZeroScore = normalizeMatch({
  id: "m4",
  team1: { name: "فريق حي 1", goals: "0" },
  team2: { name: "فريق حي 2", goals: "0" },
  status: "live",
  priority: 1,
});
assert.equal(liveZeroScore.team1.goals, 0);
assert.equal(liveZeroScore.team2.goals, 0);

const envelope = buildRuntimeEnvelope({ kind: "matches", data: [match], source: "basri-original", health: health.summary(3000), generatedAt: 0 });
assert.equal(envelope.status, "success");
assert.equal(envelope.version, "1.0.14");
assert.equal(envelope.cached, false);
assert.equal(envelope.stale, false);
assert.equal(envelope.generated_at, "1970-01-01T00:00:00.000Z");
assert.equal(envelope.data.length, 1);
assert.equal(envelope.source, "basri-original");
assert.equal(Array.isArray(envelope.health), true);

console.log("content runtime foundation: ok");
