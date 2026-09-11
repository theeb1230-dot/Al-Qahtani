#!/usr/bin/env node

const BASE = process.env.AL_QAHTANI_BASE || "https://al-qahtani-api.onrender.com";
const ORIGIN = "https://theeb1230-dot.github.io";
const MOVIE_CATEGORIES = [
  ["أجنبية", "https://akwam.ss/movies?section=30"],
  ["عربية", "https://akwam.ss/movies?section=29"],
  ["هندية", "https://akwam.ss/movies?section=31"],
  ["آسيوية", "https://akwam.ss/movies?section=33"],
  ["تركية", "https://akwam.ss/movies?section=32"],
  ["أنمي", "https://akwam.ss/movies?category=30"],
];

async function request(path, { headers = {}, timeoutMs = 60000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(BASE + path, {
      headers: { Origin: ORIGIN, ...headers },
      cache: "no-store",
      redirect: "follow",
      signal: ctl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function json(path) {
  const response = await request(path, { headers: { Accept: "application/json" }, timeoutMs: 120000 });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { response, data };
}

function classify(bytes, contentType) {
  const type = String(contentType || "").toLowerCase();
  const mp4 = bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
  const matroska = bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  let text = "";
  try { text = new TextDecoder().decode(bytes.slice(0, 64)).trimStart(); } catch {}
  const hls = text.startsWith("#EXTM3U");
  if (mp4) return "mp4";
  if (matroska) return "matroska-webm";
  if (hls) return "hls";
  if (type.includes("video/mp4")) return "mp4-by-mime";
  if (type.includes("matroska") || type.includes("webm")) return "matroska-webm-by-mime";
  if (type.includes("mpegurl")) return "hls-by-mime";
  return "unknown";
}

let selected = null;
for (const [name, sourceUrl] of MOVIE_CATEGORIES) {
  const category = await json("/api/cinema/category?type=movie&name=" + encodeURIComponent(name) + "&url=" + encodeURIComponent(sourceUrl));
  const items = Array.isArray(category.data?.data) ? category.data.data : [];
  if (!category.response.ok || category.data?.status !== "success") continue;
  for (const item of items.filter(x => x?.href).slice(0, 4)) {
    const details = await json("/api/cinema/details?ref=" + encodeURIComponent(item.href));
    const mediaPath = String(details.data?.media_path || "");
    if (details.response.ok && details.data?.status === "success" && mediaPath.startsWith("/api/cinema/media?id=")) {
      selected = { category: name, title: details.data?.movie_title || item.title || "", mediaPath };
      break;
    }
  }
  if (selected) break;
}

if (!selected) throw new Error("NO_LIVE_MOVIE_MEDIA_REFERENCE");

const media = await request(selected.mediaPath, { headers: { Range: "bytes=0-4095" } });
const contentRange = media.headers.get("content-range") || "";
const acceptRanges = media.headers.get("accept-ranges") || "";
const contentType = media.headers.get("content-type") || "";
const bytes = new Uint8Array(await media.arrayBuffer());
const container = classify(bytes, contentType);
const magicHex = Array.from(bytes.slice(0, 16)).map(v => v.toString(16).padStart(2, "0")).join("");

console.log("LIVE_IOS_MEDIA", {
  category: selected.category,
  title: selected.title,
  status: media.status,
  contentRange,
  acceptRanges,
  contentType,
  container,
  magicHex,
});

if (media.status !== 206) throw new Error(`SAFARI_RANGE_STATUS_${media.status}`);
if (!/^bytes 0-4095\//.test(contentRange)) throw new Error(`SAFARI_CONTENT_RANGE_${contentRange}`);
if (acceptRanges.toLowerCase() !== "bytes") throw new Error(`SAFARI_ACCEPT_RANGES_${acceptRanges}`);
if (!bytes.length) throw new Error("EMPTY_MEDIA_PROBE");

if (!["mp4", "mp4-by-mime", "hls", "hls-by-mime"].includes(container)) {
  throw new Error(`IOS_SAFARI_INCOMPATIBLE_CONTAINER_${container}; contentType=${contentType}; magic=${magicHex}`);
}
