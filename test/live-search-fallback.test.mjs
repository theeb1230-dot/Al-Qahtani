import test from "node:test";
import assert from "node:assert/strict";
import { categoryQueries, mapLiveSearchPayload, protectedLiveSearch } from "../server/live-search-fallback.mjs";

const payload = {
  searched_providers: 3,
  successful_providers: 2,
  failed_providers: 1,
  groups: [
    {
      title: "الذئب الوحيد",
      providers: [
        { provider: "akwam", provider_series_id: "wolf", title: "الذئب الوحيد", type: "series", image: "https://img/wolf.jpg" },
        { provider: "akwam", provider_series_id: "wolf", title: "الذئب الوحيد", type: "series" },
        { provider: "wecima", provider_series_id: "wolf-movie", title: "الذئب الوحيد", type: "movie" },
      ],
    },
  ],
};

test("maps protected live-search groups into cinema discovery references", () => {
  const items = mapLiveSearchPayload(payload, "الذئب الوحيد", "series");
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "الذئب الوحيد");
  assert.equal(items[0].is_series, true);
  assert.match(items[0].href, /^theeb:discover:/);
  const decoded = JSON.parse(decodeURIComponent(items[0].href.slice("theeb:discover:".length)));
  assert.equal(decoded.provider, "akwam");
  assert.equal(decoded.id, "wolf");
  assert.equal(decoded.query, "الذئب الوحيد");
});

test("category query variants cover Arabic and provider-friendly aliases", () => {
  const anime = categoryQueries("series", "أنمي");
  assert.ok(anime.includes("أنمي"));
  assert.ok(anime.includes("مسلسل أنمي"));
  assert.ok(anime.includes("anime"));
  const indian = categoryQueries("movie", "هندية");
  assert.ok(indian.includes("فيلم هندية"));
  assert.ok(indian.includes("indian"));
});

test("protected fallback requires server token and does not expose it in results", async () => {
  const token = "server-secret-token";
  let receivedToken = "";
  const items = await protectedLiveSearch({
    query: "الذئب الوحيد",
    type: "series",
    serviceToken: token,
    requestJson: async (_query, serviceToken) => {
      receivedToken = serviceToken;
      return { response: { ok: true, status: 200 }, data: payload };
    },
  });
  assert.equal(receivedToken, token);
  assert.equal(items.length, 1);
  assert.equal(JSON.stringify(items).includes(token), false);
});

test("protected fallback is disabled fail-closed when service token is absent", async () => {
  let called = false;
  const items = await protectedLiveSearch({
    query: "The Odyssey",
    serviceToken: "",
    requestJson: async () => { called = true; },
  });
  assert.deepEqual(items, []);
  assert.equal(called, false);
});
