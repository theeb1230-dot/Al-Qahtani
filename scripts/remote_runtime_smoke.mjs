#!/usr/bin/env node

const BASE = "https://al-qahtani-api.onrender.com";
const ORIGIN = "https://theeb1230-dot.github.io";

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
      if (last.response.ok && last.data?.status === "ok") return last;
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
          media: Boolean(result.data?.media_src || result.data?.media_path),
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

async function requirePlayback(details) {
  if (!details?.data) {
    assert(false, "remote playback has details payload");
    return;
  }
  const episodes = Array.isArray(details.data.episodes) ? details.data.episodes : [];
  const episode = episodes.find((item) => item?.watch_available !== false && item?.link);
  if (!episode) {
    assert(false, "remote playback sample exposes a playable episode", { episodes: episodes.length });
    return;
  }

  let play;
  if (String(episode.link).startsWith("provider:")) {
    play = await request(
      "/api/cinema/provider-play?ref=" + encodeURIComponent(episode.link) +
      "&title=" + encodeURIComponent(details.data.movie_title || "") +
      "&episode=" + encodeURIComponent(episode.num || ""),
      { timeoutMs: 180_000 },
    );
  } else {
    play = await request("/api/cinema/details?ref=" + encodeURIComponent(episode.link), { timeoutMs: 120_000 });
  }

  const playable = play.response.ok && play.data?.status === "success" && Boolean(play.data?.media_src || play.data?.media_path);
  if (!assert(playable, "remote playback resolves a real source", {
    status: play.response.status,
    state: play.data?.status,
    message: play.data?.message || "",
    provider: play.data?.provider || "",
  })) return;

  const mediaUrl = String(play.data?.media_src || play.data?.media_path || "");
  if (!assert(mediaUrl.includes("/api/cinema/media?session=") || mediaUrl.includes("/api/cinema/provider-media?id="), "playback remains behind Al-Qahtani media proxy", { mediaUrl })) return;

  const url = mediaUrl.startsWith("http") ? mediaUrl : BASE + mediaUrl;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(url, {
      headers: { Origin: ORIGIN, Range: "bytes=0-1023" },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    const contentRange = response.headers.get("content-range");
    const acceptRanges = response.headers.get("accept-ranges");
    assert(response.status === 206 && Boolean(contentRange || acceptRanges), "Safari media proxy serves a byte range", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentRange,
      acceptRanges,
    });
    if (response.body) {
      const reader = response.body.getReader();
      await reader.read();
      await reader.cancel();
    }
  } finally {
    clearTimeout(timer);
  }
}

async function requireCategory({ type, name, url }) {
  const result = await request(
    "/api/cinema/category?type=" + encodeURIComponent(type) +
    "&name=" + encodeURIComponent(name) +
    "&url=" + encodeURIComponent(url),
    { timeoutMs: 180_000 },
  );
  assert(result.response.ok && result.data?.status === "success" && Array.isArray(result.data?.data) && result.data.data.length > 0, `deployed ${type} ${name} category returns real items`, {
    source: result.data?.source,
    count: result.data?.data?.length,
    ms: result.ms,
  });
}

try {
  const health = await waitForHealth();
  assert(true, "deployed backend health", { ms: health.ms });

  const matches = await request("/api/matches", { timeoutMs: 90_000 });
  assert(matches.response.ok && matches.data?.success === true && Array.isArray(matches.data?.data), "deployed matches", {
    status: matches.response.status,
    count: matches.data?.data?.length,
    ms: matches.ms,
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

  const odyssey = await search("The Odyssey");
  const odysseyItems = odyssey.data?.data || [];
  assert(odyssey.response.ok && odyssey.data?.status === "success" && odysseyItems.length > 0, "deployed The Odyssey search returns real items", {
    source: odyssey.data?.source,
    count: odysseyItems.length,
    ms: odyssey.ms,
  });
  await openAnyDetails(odysseyItems, "deployed The Odyssey opens details");

  const categories = [
    { type: "series", name: "أجنبية", url: "https://akwam.ss/series?section=30" },
    { type: "series", name: "عربية", url: "https://akwam.ss/series?section=29" },
    { type: "series", name: "تركية", url: "https://akwam.ss/series?section=32" },
    { type: "series", name: "آسيوية", url: "https://akwam.ss/series?section=33" },
    { type: "series", name: "أنمي", url: "https://akwam.ss/series?category=30" },
    { type: "series", name: "رمضان", url: "https://akwam.ss/series?category=87" },
    { type: "movie", name: "أجنبية", url: "https://akwam.ss/movies?section=30" },
    { type: "movie", name: "عربية", url: "https://akwam.ss/movies?section=29" },
    { type: "movie", name: "هندية", url: "https://akwam.ss/movies?section=31" },
    { type: "movie", name: "آسيوية", url: "https://akwam.ss/movies?section=33" },
    { type: "movie", name: "تركية", url: "https://akwam.ss/movies?section=32" },
    { type: "movie", name: "أنمي", url: "https://akwam.ss/movies?category=30" },
  ];
  for (const category of categories) await requireCategory(category);
} catch (error) {
  console.error("REMOTE_RUNTIME_FATAL", error);
  process.exitCode = 1;
}