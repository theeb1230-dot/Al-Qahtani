#!/usr/bin/env node
import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["server/index.mjs"], {
  env: { ...process.env, PORT: "3137" },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", d => process.stdout.write("[backend] " + d));
child.stderr.on("data", d => process.stderr.write("[backend] " + d));

const BASE = "http://127.0.0.1:3137";
const ORIGIN = "https://theeb1230-dot.github.io";

async function get(path, timeoutMs = 120000, extraHeaders = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const response = await fetch(BASE + path, {
      headers: { Accept: "application/json", Origin: ORIGIN, ...extraHeaders },
      signal: ctl.signal,
      cache: "no-store",
    });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data, text };
  } finally { clearTimeout(timer); }
}

function ok(cond, name, detail = {}) {
  if (!cond) { console.error("FAIL", name, detail); process.exitCode = 1; return false; }
  console.log("PASS", name, detail); return true;
}

async function waitHealth() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const x = await get("/health", 3000);
      if (x.response.ok && x.data?.cinema_source === "basri-original") return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function checkRejectedDownload(path, label) {
  const result = await get(path, 10000, { Range: "bytes=0-1023", Accept: "*/*" });
  ok(result.response.status === 404, `${label} is rejected before any upstream fetch`, {
    status: result.response.status,
    body: result.text.slice(0, 160),
  });
  ok(result.data?.status === "error" && result.data?.message === "MEDIA_REFERENCE_EXPIRED",
    `${label} returns the opaque media-reference error contract`);
  ok(!(result.response.headers.get("content-disposition") || ""),
    `${label} does not receive attachment headers`);
  ok(!(result.response.headers.get("x-content-type-options") || ""),
    `${label} does not receive download MIME headers`);
  ok((result.response.headers.get("content-type") || "").toLowerCase().includes("application/json"),
    `${label} remains a JSON error response`);
}

async function verifyDownload(mediaPath) {
  const sep = String(mediaPath).includes("?") ? "&" : "?";
  const result = await get(`${mediaPath}${sep}download=1`, 120000, { Range: "bytes=0-1023", Accept: "*/*" });
  return {
    passed: (result.response.status === 206 || result.response.status === 200)
      && (result.response.headers.get("content-disposition") || "").startsWith("attachment;")
      && (result.response.headers.get("x-content-type-options") || "").toLowerCase() === "nosniff",
    status: result.response.status,
    disposition: result.response.headers.get("content-disposition") || "",
    nosniff: result.response.headers.get("x-content-type-options") || "",
  };
}

async function verifyPlaybackCandidate(episode, index) {
  try {
    const play = await get("/api/cinema/details?ref=" + encodeURIComponent(episode.link), 120000);
    if (!(play.response.ok && play.data?.status === "success" && Boolean(play.data?.media_path))) {
      console.warn("PLAYBACK_CANDIDATE_NO_MEDIA", { index, status: play.response.status, state: play.data?.status });
      return null;
    }
    const mediaPath = String(play.data.media_path || "");
    if (!mediaPath.startsWith("/api/cinema/media?id=")) {
      console.warn("PLAYBACK_CANDIDATE_UNSAFE_MEDIA_PATH", { index, mediaPath });
      return null;
    }
    const media = await get(mediaPath, 120000, { Range: "bytes=0-1023", Accept: "*/*" });
    if (!(media.response.status === 206 || media.response.status === 200)) {
      console.warn("PLAYBACK_CANDIDATE_RANGE_FAILED", {
        index,
        status: media.response.status,
        contentRange: media.response.headers.get("content-range") || "",
        acceptRanges: media.response.headers.get("accept-ranges") || "",
      });
      return null;
    }
    const download = await verifyDownload(mediaPath);
    if (!download.passed) {
      console.warn("PLAYBACK_CANDIDATE_DOWNLOAD_FAILED", { index, ...download });
      return null;
    }
    return { play, media, download, index };
  } catch (error) {
    console.warn("PLAYBACK_CANDIDATE_ERROR", { index, error: String(error) });
    return null;
  }
}

async function resolveDetailsCandidate(items) {
  const refs = [...new Set(items.filter(item => item?.href).map(item => item.href))].slice(0, 3);
  for (let i = 0; i < refs.length; i += 1) {
    try {
      const details = await get("/api/cinema/details?ref=" + encodeURIComponent(refs[i]), 90000);
      if (details.response.ok && details.data?.status === "success" && ["basri-worker", "basri-direct"].includes(details.data?.source)) {
        return { details, attempted: i + 1 };
      }
      console.warn("DETAILS_CANDIDATE_REJECTED", {
        index: i + 1,
        status: details.response.status,
        source: details.data?.source,
        state: details.data?.status,
      });
    } catch (error) {
      console.warn("DETAILS_CANDIDATE_ERROR", { index: i + 1, error: String(error) });
    }
  }
  return { details: null, attempted: refs.length };
}

try {
  if (!ok(await waitHealth(), "backend health reports original Basri cinema chain")) process.exit(1);

  await checkRejectedDownload(
    "/api/cinema/media?id=definitely-not-a-real-reference&download=1",
    "invalid download reference",
  );
  await checkRejectedDownload(
    "/api/cinema/media?id=" + encodeURIComponent("https://evil.example/video.mp4") + "&download=1",
    "URL-shaped fake media id",
  );
  await checkRejectedDownload(
    "/api/cinema/media?url=" + encodeURIComponent("https://evil.example/video.mp4") + "&download=1",
    "arbitrary url query",
  );

  const matches = await get("/api/matches", 60000);
  ok(matches.response.ok && matches.data?.success === true && Array.isArray(matches.data?.data) && matches.data.data.length > 0,
    "backend matches", { status: matches.response.status, count: matches.data?.data?.length });

  const search = await get("/api/cinema/search?q=" + encodeURIComponent("الذئب الوحيد"));
  ok(search.response.ok && search.data?.status === "success" && ["basri-worker", "basri-direct"].includes(search.data?.source) && Array.isArray(search.data?.data),
    "backend cinema search uses Basri chain", { status: search.response.status, source: search.data?.source, count: search.data?.data?.length });

  const category = await get("/api/cinema/category?type=series&name=" + encodeURIComponent("أجنبية") + "&url=" + encodeURIComponent("https://akwam.ss/series?section=30"), 120000);
  if (!ok(category.response.ok && category.data?.status === "success" && ["basri-worker", "basri-direct"].includes(category.data?.source) && Array.isArray(category.data?.data) && category.data.data.length > 0,
    "backend cinema category returns real items", { status: category.response.status, source: category.data?.source, count: category.data?.data?.length })) process.exitCode = 1;

  const detailCandidates = [...(search.data?.data || []), ...(category.data?.data || [])];
  if (!ok(detailCandidates.some(item => item?.href), "backend cinema produced details candidates")) process.exitCode = 1;

  const resolved = await resolveDetailsCandidate(detailCandidates);
  const details = resolved.details;
  if (ok(Boolean(details), "backend Basri details resolves within bounded candidates", { attempted: resolved.attempted })) {
    const episodes = (details.data?.episodes || []).filter(item => item?.link && item?.watch_available !== false).slice(0, 3);
    if (episodes.length) {
      let verified = null;
      for (let i = 0; i < episodes.length && !verified; i += 1) verified = await verifyPlaybackCandidate(episodes[i], i + 1);
      if (ok(Boolean(verified), "backend finds a playable episode within bounded candidates", { attempted: episodes.length, selected: verified?.index || null })) {
        ok(String(verified.play.data.media_path).startsWith("/api/cinema/media?id="), "direct media stays behind Al-Qahtani proxy");
        ok(verified.media.response.status === 206 || verified.media.response.status === 200,
          "backend media proxy accepts Safari range request", {
            status: verified.media.response.status,
            contentRange: verified.media.response.headers.get("content-range") || "",
            acceptRanges: verified.media.response.headers.get("accept-ranges") || "",
            contentType: verified.media.response.headers.get("content-type") || "",
          });
        ok(verified.download.passed, "backend safe download reuses proxied media reference", verified.download);
      }
    } else if (ok(Boolean(details.data?.media_path), "movie/direct detail includes playback media when no episodes", { mediaPath: details.data?.media_path || "" })) {
      const download = await verifyDownload(details.data.media_path);
      ok(download.passed, "backend safe download reuses proxied media reference", download);
    }
  }
} finally {
  child.kill("SIGTERM");
}
