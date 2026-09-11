import test from "node:test";
import assert from "node:assert/strict";
import { decodeProviderEpisodeRef, encodeProviderEpisodeRef, pickEpisodeByNumber } from "../server/provider-episode-context.mjs";

test("provider episode refs preserve title and episode number", () => {
  const ref = encodeProviderEpisodeRef({
    provider: "akwam",
    target: "https://example.test/e/20",
    title: "الذئب الوحيد الموسم الأول",
    episodeNumber: 20,
  });
  const decoded = decodeProviderEpisodeRef(ref);
  assert.deepEqual(decoded, {
    provider: "akwam",
    target: "https://example.test/e/20",
    title: "الذئب الوحيد الموسم الأول",
    episodeNumber: "20",
  });
  assert.equal(ref.includes("الذئب الوحيد"), false);
});

test("episode matching is stable across numeric/string numbers", () => {
  const episodes = [
    { num: 1, link: "one" },
    { num: "2", link: "two" },
    { number: 3, link: "three" },
  ];
  assert.equal(pickEpisodeByNumber(episodes, "2")?.link, "two");
  assert.equal(pickEpisodeByNumber(episodes, 3)?.link, "three");
  assert.equal(pickEpisodeByNumber(episodes, 9), null);
});

test("malformed provider context fails closed", () => {
  assert.equal(decodeProviderEpisodeRef("providerctx:%7Bbad"), null);
  assert.equal(decodeProviderEpisodeRef("providerctx:%7B%7D"), null);
  assert.equal(decodeProviderEpisodeRef("provider:akwam:episode:1"), null);
});
