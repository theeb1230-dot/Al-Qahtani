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

async function checkDownload(mediaPath) {
  const sep = String(mediaPath).includes("?") ? "&" : "?";
  const response = await get(`${mediaPath}${sep}download=1`, 120000, { Range: "bytes=0-1023", Accept: "*/*" });
  ok(response.response.status === 206 || response.response.status === 200,
    "backend safe download reuses proxied media reference", { status: response.response.status });
  ok((response.response.headers.get("content-disposition") || "").startsWith("attachment;"),
    "backend safe download forces attachment disposition", {
      disposition: response.response.headers.get("content-disposition") || "",
    });
  ok((response.response.headers.get("x-content-type-options") || "").toLowerCase() === "nosniff",
    "backend safe download disables MIME sniffing");
}

try {
  if (!ok(await waitHealth(), "backend health reports original Basri cinema chain")) process.exit(1);

  const matches = await get("/api/matches", 60000);
  ok(matches.response.ok && matches.data?.success === true && Array.isArray(matches.data?.data) && matches.data.data.length > 0,
    "backend matches", { status: matches.response.status, count: matches.data?.data?.length });

  const search = await get("/api/cinema/search?q=" + encodeURIComponent("الذئب الوحيد"));
  ok(search.response.ok && search.data?.status === "success" && ["basri-worker", "basri-direct"].includes(search.data?.source) && Array.isArray(search.data?.data),
    "backend cinema search uses Basri chain", { status: search.response.status, source: search.data?.source, count: search.data?.data?.length });

  const category = await get("/api/cinema/category?type=series&name=" + encodeURIComponent("أجنبية") + "&url=" + encodeURIComponent("https://akwam.ss/series?section=30"), 120000);
  if (!ok(category.response.ok && category.data?.status === "success" && ["basri-worker", "basri-direct"].includes(category.data?.source) && Array.isArray(category.data?.data) && category.data.data.length > 0,
    "backend cinema category returns real items", { status: category.response.status, source: category.data?.source, count: category.data?.data?.length })) process.exitCode = 1;

  const candidate = (search.data?.data || []).find(item => item?.href) || (category.data?.data || []).find(item => item?.href);
  if (!ok(Boolean(candidate?.href), "backend cinema produced a details candidate")) process.exitCode = 1;
  if (candidate?.href) {
    const details = await get("/api/cinema/details?ref=" + encodeURIComponent(candidate.href));
    if (ok(details.response.ok && details.data?.status === "success" && ["basri-worker", "basri-direct"].includes(details.data?.source),
      "backend Basri details", { status: details.response.status, source: details.data?.source, episodes: details.data?.episodes?.length, media: Boolean(details.data?.media_path) })) {
      const episode = (details.data?.episodes || []).find(item => item?.link && item?.watch_available !== false);
      if (episode) {
        const play = await get("/api/cinema/details?ref=" + encodeURIComponent(episode.link));
        if (ok(play.response.ok && play.data?.status === "success" && Boolean(play.data?.media_path),
          "backend episode resolves proxied playback", { status: play.response.status, source: play.data?.source, mediaPath: play.data?.media_path || "" })) {
          ok(String(play.data.media_path).startsWith("/api/cinema/media?id="), "direct media stays behind Al-Qahtani proxy");
          const media = await get(play.data.media_path, 120000, { Range: "bytes=0-1023", Accept: "*/*" });
          ok(media.response.status === 206 || media.response.status === 200,
            "backend media proxy accepts Safari range request", {
              status: media.response.status,
              contentRange: media.response.headers.get("content-range") || "",
              acceptRanges: media.response.headers.get("accept-ranges") || "",
              contentType: media.response.headers.get("content-type") || "",
            });
          await checkDownload(play.data.media_path);
        }
      } else if (ok(Boolean(details.data?.media_path), "movie/direct detail includes playback media when no episodes", { mediaPath: details.data?.media_path || "" })) {
        await checkDownload(details.data.media_path);
      }
    }
  }
} finally {
  child.kill("SIGTERM");
}
