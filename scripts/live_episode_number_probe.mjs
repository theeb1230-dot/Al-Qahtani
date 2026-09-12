#!/usr/bin/env node
import { directSearch, directDetails, directCategory } from "../server/basri-source.mjs";

function fail(message, detail = {}) {
  console.error("FAIL", message, detail);
  process.exitCode = 1;
}

function validateEpisodes(label, title, episodes = []) {
  if (!episodes.length) {
    fail("live series has no parsed episodes", { label, title });
    return false;
  }

  const nums = episodes.map(ep => Number(ep.episode_number ?? ep.num));
  const ids = episodes.map(ep => String(ep.episode_id || ""));
  const links = episodes.map(ep => String(ep.link || ""));

  if (nums.some(n => !Number.isFinite(n) || n <= 0 || n > 1000)) {
    fail("source IDs or invalid values leaked into displayed episode numbers", { label, title, nums: nums.slice(0, 20) });
    return false;
  }

  const monotonic = nums.every((n, i) => i === 0 || n >= nums[i - 1]);
  if (!monotonic) {
    fail("episode numbers are not sorted logically", { label, title, nums: nums.slice(0, 30) });
    return false;
  }

  const uniqueNumbers = new Set(nums);
  if (uniqueNumbers.size !== nums.length) {
    fail("duplicate display episode numbers detected", { label, title, nums: nums.slice(0, 30) });
    return false;
  }

  const obviousIdLeak = ids.some((id, i) => id && id === String(nums[i]) && Number(id) > 1000);
  if (obviousIdLeak) {
    fail("internal source ID used as display episode number", { label, title, nums: nums.slice(0, 10), ids: ids.slice(0, 10) });
    return false;
  }

  const hrefIds = links.map(link => link.match(/\/episode\/(\d+)(?:\/|$)/i)?.[1] || "");
  const separated = hrefIds.some((id, i) => id && id !== String(nums[i]));
  if (!separated) {
    fail("probe did not prove source episode IDs remain separate from display numbers", { label, title, nums: nums.slice(0, 10), ids: hrefIds.slice(0, 10) });
    return false;
  }

  console.log("PASS live episode normalization", {
    label,
    title,
    count: episodes.length,
    first: nums.slice(0, 8),
    sourceIds: hrefIds.slice(0, 3),
  });
  return true;
}

async function validateSearchSeries() {
  const query = "حلم أشرف الموسم الثاني مدبلج";
  const results = await directSearch(query);
  const candidate = results.find(item => item.is_series && /حلم\s*أشرف/i.test(String(item.title || ""))) || results.find(item => item.is_series);
  if (!candidate) {
    fail("live search series candidate missing", { query, count: results.length });
    return;
  }
  const details = await directDetails(candidate.href);
  validateEpisodes("search:حلم أشرف", candidate.title, Array.isArray(details.episodes) ? details.episodes : []);
}

const categories = [
  ["مسلسلات أجنبية", "https://akwam.ss/series?section=30"],
  ["مسلسلات عربية", "https://akwam.ss/series?section=29"],
  ["مسلسلات تركية", "https://akwam.ss/series?section=32"],
  ["مسلسلات آسيوية", "https://akwam.ss/series?section=33"],
  ["مسلسلات أنمي", "https://akwam.ss/series?category=30"],
  ["مسلسلات رمضان", "https://akwam.ss/series?category=87"],
];

async function validateCategory(label, url) {
  const items = await directCategory(url);
  if (!items.length) {
    fail("live series category is empty", { label, url });
    return;
  }

  let lastError = "";
  for (const item of items.filter(x => x.is_series).slice(0, 5)) {
    try {
      const details = await directDetails(item.href);
      const episodes = Array.isArray(details.episodes) ? details.episodes : [];
      if (!episodes.length) continue;
      validateEpisodes(label, item.title, episodes);
      return;
    } catch (error) {
      lastError = String(error?.message || error);
    }
  }
  fail("no episode-bearing series found in bounded category candidates", { label, url, count: items.length, lastError });
}

await validateSearchSeries().catch(error => fail("live search episode probe failed", { error: String(error?.message || error) }));

// Bounded concurrency: at most two live category chains at once.
for (let i = 0; i < categories.length; i += 2) {
  await Promise.all(categories.slice(i, i + 2).map(([label, url]) =>
    validateCategory(label, url).catch(error => fail("live category episode probe failed", { label, error: String(error?.message || error) })),
  ));
}

if (!process.exitCode) console.log("PASS multi-category live episode numbering regression");
if (process.exitCode) process.exit(process.exitCode);
