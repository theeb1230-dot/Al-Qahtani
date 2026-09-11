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
    const response = await fetch(BASE + path, { headers: { Accept: "application/json", Origin: ORIGIN, ...extraHeaders }, signal: ctl.signal, cache: "no-store" });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data, text };
  } finally {
    clearTimeout(timer);
  }
}

function ok(cond, name, detail = {}) {
  if (!cond) { console.error("FAIL", name, detail); process.exitCode = 1; return false; }
  console.log("PASS", name, detail); return true;
}

async function waitHealth() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const x = await get("/health", 3000);
      if (x.response.ok && x.data?.cinema_source === "basri-worker") return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

try {
  if (!ok(await waitHealth(), "backend health reports Basri cinema source")) process.exit(1);
  const matches = await get("/api/matches", 60000);
  ok(matches.response.ok && matches.data?.success === true && Array.isArray(matches.data?.data), "backend matches", { status: matches.response.status, count: matches.data?.data?.length });

  const search = await get("/api/cinema/search?q=" + encodeURIComponent("الذئب الوحيد"));
  ok(search.response.ok && search.data?.status === "success" && search.data?.source === "basri-worker" && Array.isArray(search.data?.data), "backend cinema search uses Basri worker", { status: search.response.status, count: search.data?.data?.length });

  const category = await get("/api/cinema/category?type=series&name=" + encodeURIComponent("أنمي") + "&url=" + encodeURIComponent("https://akwam.ss/series?category=30"), 120000);
  ok(category.response.ok && category.data?.status === "success" && category.data?.source === "basri-worker" && Array.isArray(category.data?.data), "backend cinema category uses original Basri contract", { status: category.response.status, count: category.data?.data?.length });

  const candidate = (search.data?.data || []).find(item => item?.href) || (category.data?.data || []).find(item => item?.href);
  if (candidate?.href) {
    const details = await get("/api/cinema/details?ref=" + encodeURIComponent(candidate.href));
    ok(details.response.ok && details.data?.status === "success" && details.data?.source === "basri-worker", "backend Basri details", { status: details.response.status, episodes: details.data?.episodes?.length, media: Boolean(details.data?.media_path || details.data?.media_src) });
    const episode = (details.data?.episodes || []).find(item => item?.link && item?.watch_available !== false);
    if (episode) {
      const play = await get("/api/cinema/details?ref=" + encodeURIComponent(episode.link));
      ok(play.response.ok && play.data?.status === "success", "backend Basri episode details/playback", { status: play.response.status, mediaPath: play.data?.media_path || "", iframe: Boolean(play.data?.is_iframe) });
      if (play.data?.media_path) ok(String(play.data.media_path).startsWith("/api/cinema/media?id="), "direct media stays behind Al-Qahtani proxy");
    }
  } else {
    console.log("SKIP details/playback: original cinema worker returned no sample item in this run");
  }
} finally {
  child.kill("SIGTERM");
}
