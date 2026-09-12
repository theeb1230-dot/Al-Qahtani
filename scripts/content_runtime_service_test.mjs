import assert from "node:assert/strict";
import { createContentRuntimeService } from "../server/content-runtime-service.mjs";

let clock = 1_000;
let matchCalls = 0;
let searchCalls = 0;
let categoryCalls = 0;

const service = createContentRuntimeService({
  now: () => clock,
  matchTtlMs: 1_000,
  catalogTtlMs: 2_000,
  fetchMatches: async () => {
    matchCalls += 1;
    clock += 25;
    return {
      success: true,
      data: [{
        link: "https://api.albasritv1.workers.dev/?id=7",
        priority: 2,
        time: "03:00",
        team1: { name: "راسينج", logo: "https://example.invalid/a.png" },
        team2: { name: "ألافيس", logo: "https://example.invalid/b.png" },
      }],
    };
  },
  searchCatalog: async (query) => {
    searchCalls += 1;
    clock += 40;
    return {
      status: "success",
      source: "basri-direct",
      data: [{ title: `نتيجة ${query}`, img: "poster.jpg", is_series: true, href: "legacy:https%3A%2F%2Fakwam.ss%2Fseries%2Fdemo" }],
    };
  },
  fetchCategory: async (ref, page) => {
    categoryCalls += 1;
    clock += 30;
    return {
      status: "success",
      source: "basri-worker",
      data: [{ title: `صفحة ${page}`, image: "poster.jpg", is_series: false, href: ref }],
    };
  },
});

const firstMatches = await service.matches();
assert.equal(firstMatches.version, "1.0.1");
assert.equal(firstMatches.kind, "matches");
assert.equal(firstMatches.cached, false);
assert.equal(firstMatches.data.length, 1);
assert.equal(firstMatches.data[0].team1.name, "راسينج");
assert.equal(firstMatches.health.successes, 1);
assert.equal(firstMatches.health.lastLatencyMs, 25);

const cachedMatches = await service.matches();
assert.equal(cachedMatches.cached, true);
assert.equal(matchCalls, 1);

clock += 1_001;
const refreshedMatches = await service.matches();
assert.equal(refreshedMatches.cached, false);
assert.equal(matchCalls, 2);

const search = await service.search("الذئب الوحيد");
assert.equal(search.kind, "search");
assert.equal(search.source, "basri-direct");
assert.equal(search.data[0].type, "series");
assert.equal(search.data[0].title, "نتيجة الذئب الوحيد");
assert.equal(searchCalls, 1);

const cachedSearch = await service.search(" الذئب الوحيد ");
assert.equal(cachedSearch.cached, true);
assert.equal(searchCalls, 1);

const emptySearch = await service.search(" ");
assert.deepEqual(emptySearch.data, []);
assert.equal(searchCalls, 1);

const category = await service.category("legacy:https%3A%2F%2Fakwam.ss%2Fmovie%2Fdemo", 2);
assert.equal(category.kind, "category");
assert.equal(category.source, "basri-worker");
assert.equal(category.data[0].type, "movie");
assert.equal(categoryCalls, 1);

const status = service.status();
assert.equal(status.status, "ok");
assert.equal(status.version, "1.0.1");
assert.ok(status.cache_entries >= 2);
assert.ok(status.providers.some((provider) => provider.name === "basri-direct"));
assert.ok(status.providers.some((provider) => provider.name === "basri-worker"));

console.log("content runtime service tests passed");
