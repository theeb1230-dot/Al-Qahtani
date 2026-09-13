import assert from "node:assert/strict";
import { createTmdbRuntime, __tmdbTest } from "../server/tmdb-runtime.mjs";

assert.equal(__tmdbTest.yearFrom("2008-01-20"), 2008);
assert.equal(__tmdbTest.yearFrom(""), null);
assert.equal(__tmdbTest.ratingFrom(8.86), 8.9);
assert.equal(__tmdbTest.normalizeResult({ media_type: "person", id: 1 }), null);

const calls = [];
const runtime = createTmdbRuntime({
  apiKey: "test-key",
  now: () => 1_000,
  fetchImpl: async (url) => {
    calls.push(url.toString());
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          results: [
            {
              media_type: "tv",
              id: 1396,
              name: "Breaking Bad",
              first_air_date: "2008-01-20",
              poster_path: "/poster.jpg",
              vote_average: 8.86,
            },
            {
              media_type: "movie",
              id: 603,
              title: "The Matrix",
              release_date: "1999-03-30",
              poster_path: null,
              vote_average: 8.2,
            },
            { media_type: "person", id: 99, name: "Ignore" },
          ],
        };
      },
    };
  },
});

const first = await runtime.search("Breaking");
assert.equal(first.status, "success");
assert.equal(first.source, "tmdb");
assert.equal(first.data.length, 2);
assert.deepEqual(first.data[0], {
  id: "1396",
  title: "Breaking Bad",
  poster: "https://image.tmdb.org/t/p/w342/poster.jpg",
  type: "series",
  year: 2008,
  rating: 8.9,
  source: "tmdb",
  ref: "tmdb:tv:1396",
});
assert.equal(first.data[1].ref, "tmdb:movie:603");
assert.equal(calls.length, 1);
assert.match(calls[0], /api_key=test-key/);
assert.match(calls[0], /language=ar-SA/);
assert.match(calls[0], /include_adult=false/);

const cached = await runtime.search("Breaking");
assert.deepEqual(cached, first);
assert.equal(calls.length, 1, "search should use short-lived cache");

const disabled = createTmdbRuntime({ apiKey: "", fetchImpl: async () => { throw new Error("should not call"); } });
assert.equal(disabled.status().configured, false);
await assert.rejects(() => disabled.search("Matrix"), /TMDB_NOT_CONFIGURED/);

const empty = await runtime.search("a");
assert.deepEqual(empty.data, []);

console.log("tmdb runtime tests passed");
