#!/usr/bin/env node
import { directSearch, directDetails } from "../server/basri-source.mjs";

function fail(message, detail = {}) {
  console.error("FAIL", message, detail);
  process.exitCode = 1;
}

const query = "حلم أشرف الموسم الثاني مدبلج";
const results = await directSearch(query);
const candidate = results.find(item => item.is_series && /حلم\s*أشرف/i.test(String(item.title || ""))) || results.find(item => item.is_series);
if (!candidate) {
  fail("live series candidate missing", { query, count: results.length });
} else {
  const details = await directDetails(candidate.href);
  const episodes = Array.isArray(details.episodes) ? details.episodes : [];
  const nums = episodes.map(ep => Number(ep.episode_number || ep.num)).filter(Number.isFinite);
  const ids = episodes.map(ep => String(ep.episode_id || "")).filter(Boolean);
  console.log("INFO live episode normalization", { title: candidate.title, count: episodes.length, first: nums.slice(0, 8), ids: ids.slice(0, 3) });
  if (!episodes.length) fail("live series has no parsed episodes", { href: candidate.href });
  if (nums.some(n => n <= 0 || n > 1000)) fail("source IDs leaked into displayed episode numbers", { nums: nums.slice(0, 20) });
  const monotonic = nums.every((n, i) => i === 0 || n >= nums[i - 1]);
  if (!monotonic) fail("episode numbers are not sorted logically", { nums: nums.slice(0, 30) });
  const distinctIds = ids.some((id, i) => nums[i] && id !== String(nums[i]));
  if (!distinctIds) fail("probe did not prove episode IDs remain separate from display numbers", { nums: nums.slice(0, 10), ids: ids.slice(0, 10) });
  if (!process.exitCode) console.log("PASS live episode numbers are normalized independently from source IDs");
}

if (process.exitCode) process.exit(process.exitCode);
