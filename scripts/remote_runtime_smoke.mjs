#!/usr/bin/env node
import { buildDownloadContentDisposition } from "../server/download-filename.mjs";

const BASE = "https://al-qahtani-api.onrender.com";
const ORIGIN = "https://theeb1230-dot.github.io";
const NEWS = "https://news.albesriali03.workers.dev/";
const BASRI_ORIGIN = "https://www.albasritv.abrdns.com";

const CATEGORIES = [
  ["series", "أجنبية", "https://akwam.ss/series?section=30"],
  ["series", "عربية", "https://akwam.ss/series?section=29"],
  ["series", "تركية", "https://akwam.ss/series?section=32"],
  ["series", "آسيوية", "https://akwam.ss/series?section=33"],
  ["series", "أنمي", "https://akwam.ss/series?category=30"],
  ["series", "رمضان", "https://akwam.ss/series?category=87"],
  ["movie", "أجنبية", "https://akwam.ss/movies?section=30"],
  ["movie", "عربية", "https://akwam.ss/movies?section=29"],
  ["movie", "هندية", "https://akwam.ss/movies?section=31"],
  ["movie", "آسيوية", "https://akwam.ss/movies?section=33"],
  ["movie", "تركية", "https://akwam.ss/movies?section=32"],
  ["movie", "أنمي", "https://akwam.ss/movies?category=30"],
];

async function request(path, { timeoutMs = 120_000, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(BASE + path, {
      headers: { Accept: "application/json", Origin: ORIGIN, ...headers },
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data, text, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

async function externalJson(url, { timeoutMs = 60_000, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, { headers, cache: "no-store", signal: controller.signal });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data, text, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

function assert(condition, name, detail = {}) {
  if (!condition) {
    console.error("FAIL", name, detail);
    process.exitCode = 1;
    return false;
  }
  console.log("PASS", name, detail);
  return true;
}

async function waitForHealth() {
  let last;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      last = await request("/health", { timeoutMs: 45_000 });
      if (last.response.ok && last.data?.status === "ok" && last.data?.cinema_source === "basri-original") return last;
    } catch (error) {
      last = { error };
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
  }
  throw new Error(`backend did not become healthy: ${String(last?.error || last?.response?.status || "unknown")}`);
}

async function search(query) {
  return request("/api/cinema/search?q=" + encodeURIComponent(query), { timeoutMs: 120_000 });
}

async function openAnyDetails(items, label) {
  const candidates = (items || []).filter((item) => item?.href).slice(0, 3);
  let last = null;
  for (const item of candidates) {
    try {
      const result = await request("/api/cinema/details?ref=" + encodeURIComponent(item.href), { timeoutMs: 120_000 });
      last = result;
      if (result.response.ok && result.data?.status === "success") {
        console.log("PASS", label, {
          title: result.data?.movie_title || item.title,
          source: result.data?.source,
          episodes: result.data?.episodes?.length || 0,
          media: Boolean(result.data?.media_path),
          ms: result.ms,
        });
        return result;
      }
      console.warn("DETAIL_CANDIDATE_FAILED", { title: item.title, status: result.response.status, body: result.text.slice(0, 180) });
    } catch (error) {
      console.warn("DETAIL_CANDIDATE_ERROR", { title: item.title, error: String(error) });
    }
  }
  assert(false, label, { status: last?.response?.status, body: last?.text?.slice(0, 200) });
  return null;
}

async function resolvePlayback(details) {
  if (details?.response?.ok && details.data?.status === "success" && details.data?.media_path) return details;

  const candidates = (Array.isArray(details?.data?.episodes) ? details.data.episodes : [])
    .filter((item) => item?.watch_available !== false && item?.link)
    .slice(0, 3);

  let last = null;
  for (const [index, episode] of candidates.entries()) {
    try {
      const play = await request("/api/cinema/details?ref=" + encodeURIComponent(episode.link), { timeoutMs: 45_000 });
      last = play;
      if (play.response.ok && play.data?.status === "success" && play.data?.media_path) {
        if (index > 0) {
          console.log("PASS remote playback recovered with bounded episode candidate", {
            candidate: index + 1,
            episode: episode.num || null,
            ms: play.ms,
          });
        }
        return play;
      }
      console.warn("PLAYBACK_CANDIDATE_FAILED", {
        candidate: index + 1,
        episode: episode.num || null,
        status: play.response.status,
        state: play.data?.status || "",
        message: play.data?.message || "",
        ms: play.ms,
      });
    } catch (error) {
      console.warn("PLAYBACK_CANDIDATE_ERROR", {
        candidate: index + 1,
        episode: episode.num || null,
        error: String(error?.message || error),
      });
    }
  }
  return last;
}

async function probeTrustedDownload(mediaUrl, trustedTitle) {
  const separator = mediaUrl.includes("?") ? "&" : "?";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(BASE + mediaUrl + separator + "download=1", {
      headers: { Origin: ORIGIN, Range: "bytes=0-1023" },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    const disposition = response.headers.get("content-disposition") || "";
    const expected = buildDownloadContentDisposition(trustedTitle || "al-qahtani-media");
    const nosniff = response.headers.get("x-content-type-options") || "";
    assert([200, 206].includes(response.status), "deployed episode download returns bounded media", { status: response.status });
    assert(disposition === expected, "deployed episode download Content-Disposition uses trusted Basri title", { trustedTitle, disposition, expected });
    assert(!/[\r\n]/.test(disposition), "deployed episode download Content-Disposition is CR/LF-safe");
    assert(disposition.length <= 512, "deployed episode download Content-Disposition is bounded", { length: disposition.length });
    assert(nosniff.toLowerCase() === "nosniff", "deployed episode download remains nosniff");
    try { await response.body?.cancel(); } catch {}
  } finally {
    clearTimeout(timer);
  }
}

async function requirePlayback(details) {
  if (!details?.data) {
    assert(false, "remote playback has details payload");
    return;
  }

  const play = await resolvePlayback(details);
  const playable = Boolean(play?.response?.ok && play.data?.status === "success" && play.data?.media_path);
  if (!assert(playable, "remote playback resolves a real proxied source", {
    status: play?.response?.status,
    state: play?.data?.status,
    message: play?.data?.message || "",
    mediaPath: play?.data?.media_path || "",
    attemptedEpisodes: (details.data.episodes || []).filter((item) => item?.watch_available !== false && item?.link).slice(0, 3).length,
  })) return;

  const mediaUrl = String(play.data.media_path);
  if (!assert(mediaUrl.startsWith("/api/cinema/media?id="), "playback remains behind Al-Qahtani media proxy", { mediaUrl })) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(BASE + mediaUrl, {
      headers: { Origin: ORIGIN, Range: "bytes=0-1023" },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    assert(response.status === 206, "Safari media proxy returns byte range", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentRange: response.headers.get("content-range"),
      acceptRanges: response.headers.get("accept-ranges"),
    });
    assert(/^bytes 0-1023\//.test(response.headers.get("content-range") || ""), "Safari media proxy preserves Content-Range", {
      contentRange: response.headers.get("content-range") || "",
    });
    assert((response.headers.get("accept-ranges") || "").toLowerCase() === "bytes", "Safari media proxy advertises byte ranges");
    if (response.body) {
      const reader = response.body.getReader();
      await reader.read();
      await reader.cancel();
    }
  } finally {
    clearTimeout(timer);
  }

  await probeTrustedDownload(mediaUrl, play.data?.movie_title || details.data?.movie_title || "al-qahtani-media");
}

async function category(type, name, url) {
  return request(
    "/api/cinema/category?type=" + encodeURIComponent(type) + "&name=" + encodeURIComponent(name) + "&url=" + encodeURIComponent(url),
    { timeoutMs: 120_000 },
  );
}

try {
  const health = await waitForHealth();
  assert(true, "deployed backend health reports original Basri chain", { ms: health.ms });

  const matches = await request("/api/matches", { timeoutMs: 90_000 });
  assert(matches.response.ok && matches.data?.success === true && Array.isArray(matches.data?.data) && matches.data.data.length > 0, "deployed matches", {
    status: matches.response.status,
    count: matches.data?.data?.length,
    ms: matches.ms,
  });

  const news = await externalJson(NEWS + "?_=" + Date.now(), {
    headers: {
      Accept: "application/json",
      Origin: BASRI_ORIGIN,
      Referer: BASRI_ORIGIN + "/2026/09/news.html",
      "X-BSR-Page": "/2026/09/news.html",
    },
  });
  assert(news.response.ok && news.data && (news.data.status === "success" || news.data.success === true), "deployed Basri news worker", {
    status: news.response.status,
    ms: news.ms,
  });

  const wolf = await search("الذئب الوحيد");
  const wolfItems = wolf.data?.data || [];
  assert(wolf.response.ok && wolf.data?.status === "success" && wolfItems.length > 0, "deployed Arabic search returns real items", {
    source: wolf.data?.source,
    count: wolfItems.length,
    ms: wolf.ms,
  });
  const wolfDetails = await openAnyDetails(wolfItems, "deployed Arabic search opens details");
  await requirePlayback(wolfDetails);

  for (const [type, name, url] of CATEGORIES) {
    const result = await category(type, name, url);
    const items = Array.isArray(result.data?.data) ? result.data.data : [];
    const label = `deployed ${type} category ${name}`;
    const populated = assert(result.response.ok && result.data?.status === "success" && items.length > 0, label, {
      source: result.data?.source,
      count: items.length,
      ms: result.ms,
    });
    if (populated) await openAnyDetails(items, `${label} opens details`);
  }
} catch (error) {
  console.error("REMOTE_RUNTIME_FATAL", error);
  process.exitCode = 1;
}
