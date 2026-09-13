import assert from "node:assert/strict";
import { createTmdbRuntime, __tmdbTest } from "../server/tmdb-runtime.mjs";

assert.equal(__tmdbTest.yearFrom("2008-01-20"), 2008);
assert.equal(__tmdbTest.yearFrom(""), null);
assert.equal(__tmdbTest.ratingFrom(8.86), 8.9);
assert.equal(__tmdbTest.normalizeResult({ media_type: "person", id: 1 }), null);
assert.deepEqual(__tmdbTest.parseRef("tmdb:movie:603"), { mediaType: "movie", id: 603 });
assert.throws(() => __tmdbTest.parseRef("legacy:603"), /TMDB_BAD_REFERENCE/);

const calls = [];
const runtime = createTmdbRuntime({
  apiKey: "test-key",
  now: () => 1_000,
  fetchImpl: async (url) => {
    calls.push(url.toString());
    const parsed = new URL(url);
    if (parsed.pathname === "/3/search/multi") {
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
    }
    if (parsed.pathname === "/3/tv/1396") {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            id: 1396,
            name: "Breaking Bad",
            original_name: "Breaking Bad",
            overview: "Overview",
            first_air_date: "2008-01-20",
            poster_path: "/poster.jpg",
            backdrop_path: "/backdrop.jpg",
            vote_average: 8.86,
            number_of_seasons: 5,
            number_of_episodes: 62,
            seasons: [
              { season_number: 1, name: "Season 1", episode_count: 7, air_date: "2008-01-20", poster_path: "/s1.jpg" },
            ],
          };
        },
      };
    }
    if (parsed.pathname === "/3/tv/1396/season/1") {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            id: 3572,
            name: "Season 1",
            overview: "",
            poster_path: "/s1.jpg",
            episodes: [
              { id: 62085, episode_number: 1, name: "Pilot", air_date: "2008-01-20", vote_average: 8.3, still_path: "/e1.jpg" },
              { id: 62086, episode_number: 2, name: "Cat's in the Bag...", air_date: "2008-01-27", vote_average: 8.1, still_path: null },
            ],
          };
        },
      };
    }
    throw new Error(`unexpected path ${parsed.pathname}`);
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

const details = await runtime.details("tmdb:tv:1396");
assert.equal(details.data.ref, "tmdb:tv:1396");
assert.equal(details.data.type, "series");
assert.equal(details.data.number_of_seasons, 5);
assert.equal(details.data.seasons[0].season_number, 1);
assert.equal(details.data.poster, "https://image.tmdb.org/t/p/w500/poster.jpg");
assert.equal(calls.length, 2);

const detailsCached = await runtime.details("tmdb:tv:1396");
assert.deepEqual(detailsCached, details);
assert.equal(calls.length, 2, "details should use short-lived cache");

const season = await runtime.season("tmdb:tv:1396", 1);
assert.equal(season.data.series_ref, "tmdb:tv:1396");
assert.equal(season.data.episodes.length, 2);
assert.equal(season.data.episodes[0].ref, "tmdb:tv:1396:s1:e1");
assert.equal(season.data.episodes[1].episode_number, 2);
assert.equal(calls.length, 3);

await assert.rejects(() => runtime.season("tmdb:movie:603", 1), /TMDB_SEASON_REQUIRES_SERIES/);
await assert.rejects(() => runtime.season("tmdb:tv:1396", -1), /TMDB_BAD_SEASON/);

const disabled = createTmdbRuntime({ apiKey: "", fetchImpl: async () => { throw new Error("should not call"); } });
assert.equal(disabled.status().configured, false);
await assert.rejects(() => disabled.search("Matrix"), /TMDB_NOT_CONFIGURED/);
await assert.rejects(() => disabled.details("tmdb:movie:603"), /TMDB_NOT_CONFIGURED/);

const empty = await runtime.search("a");
assert.deepEqual(empty.data, []);

console.log("tmdb runtime tests passed");
