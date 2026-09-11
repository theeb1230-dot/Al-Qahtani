#!/usr/bin/env node
import { spawn } from "node:child_process";
import { webkit, devices } from "playwright";

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;
const MEDIA = "https://al-qahtani-api.onrender.com/api/cinema/media?id=webkit-ts";
const TOTAL_BYTES = 10_000_000;
const SAMPLE_BYTES = 262_144;
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { stdio: "ignore" });

async function waitServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const r = await fetch(`${BASE}/Player.html`);
      if (r.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("static server did not start");
}

function writePts(bytes, offset, pts) {
  bytes[offset] = 0x21 | (Math.floor(pts / 2 ** 29) & 0x0e);
  bytes[offset + 1] = Math.floor(pts / 2 ** 22) & 0xff;
  bytes[offset + 2] = ((Math.floor(pts / 2 ** 15) & 0x7f) << 1) | 1;
  bytes[offset + 3] = Math.floor(pts / 2 ** 7) & 0xff;
  bytes[offset + 4] = ((pts & 0x7f) << 1) | 1;
}

function makeTsSample(length, startPts, endPts) {
  const packets = Math.ceil(length / 188);
  const bytes = Buffer.alloc(packets * 188);
  const step = packets > 1 ? (endPts - startPts) / (packets - 1) : 0;
  for (let i = 0; i < packets; i += 1) {
    const offset = i * 188;
    bytes[offset] = 0x47;
    bytes[offset + 1] = 0x40;
    bytes[offset + 2] = 0x00;
    bytes[offset + 3] = 0x10;
    const p = offset + 4;
    bytes[p] = 0x00;
    bytes[p + 1] = 0x00;
    bytes[p + 2] = 0x01;
    bytes[p + 3] = 0xe0;
    bytes[p + 4] = 0x00;
    bytes[p + 5] = 0x00;
    bytes[p + 6] = 0x80;
    bytes[p + 7] = 0x80;
    bytes[p + 8] = 0x05;
    writePts(bytes, p + 9, Math.round(startPts + step * i));
  }
  return bytes.subarray(0, length);
}

const headSample = makeTsSample(SAMPLE_BYTES, 0, 2_700_000); // 0..30 seconds
const tailSample = makeTsSample(SAMPLE_BYTES, 9_000_000, 10_800_000); // 100..120 seconds

let browser;
try {
  await waitServer();
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();

  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    window.__createdObjectUrlBlobs = [];
    URL.createObjectURL = blob => {
      window.__createdObjectUrlBlobs.push(blob);
      return original(blob);
    };
  });

  await page.route("https://al-qahtani-api.onrender.com/api/cinema/media**", async route => {
    const range = route.request().headers().range || "bytes=0-4095";
    const match = range.match(/bytes=(\d+)-(\d+)/);
    const start = Number(match?.[1] || 0);
    const requestedEnd = Number(match?.[2] || Math.min(TOTAL_BYTES - 1, start + 4095));
    const end = Math.min(TOTAL_BYTES - 1, requestedEnd);
    const length = Math.max(1, end - start + 1);
    const isTail = start >= TOTAL_BYTES - SAMPLE_BYTES;
    const source = isTail ? tailSample : headSample;
    const body = source.subarray(0, Math.min(length, source.length));
    await route.fulfill({
      status: 206,
      headers: {
        "content-type": "application/octet-stream",
        "accept-ranges": "bytes",
        "content-range": `bytes ${start}-${start + body.length - 1}/${TOTAL_BYTES}`,
        "content-length": String(body.length),
        "access-control-allow-origin": "*",
        "access-control-expose-headers": "Content-Type, Content-Length, Content-Range, Accept-Ranges",
      },
      body,
    });
  });

  const url = `${BASE}/Player.html?url=${encodeURIComponent(MEDIA)}&type=stream`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const video = page.locator("#player video");
  await video.waitFor({ state: "attached" });

  const src = await video.getAttribute("src");
  if (!String(src || "").startsWith("blob:")) throw new Error(`EXPECTED_HLS_BLOB_SOURCE_GOT_${src}`);

  const manifest = await page.evaluate(async () => {
    const blobs = window.__createdObjectUrlBlobs || [];
    const blob = blobs.find(item => item?.type === "application/vnd.apple.mpegurl") || blobs[0];
    return {
      src: document.querySelector("#player video")?.getAttribute("src") || "",
      text: blob ? await blob.text() : "",
      blobType: blob?.type || "",
      probedDuration: document.querySelector("#status")?.dataset?.mpegTsDuration || "",
    };
  });

  if (manifest.blobType !== "application/vnd.apple.mpegurl") throw new Error(`WRONG_HLS_BLOB_TYPE_${manifest.blobType}`);
  if (!manifest.text.startsWith("#EXTM3U\n")) throw new Error(`MISSING_EXTM3U_${manifest.text.slice(0, 80)}`);
  if (!manifest.text.includes(MEDIA)) throw new Error("HLS_MANIFEST_MISSING_OPAQUE_MEDIA_URL");
  if (manifest.text.includes("akwam.ss") || manifest.text.includes("downet.net")) throw new Error("HLS_MANIFEST_LEAKS_UPSTREAM_HOST");
  if (manifest.text.includes("43200")) throw new Error("HLS_MANIFEST_STILL_USES_FAKE_12_HOUR_DURATION");
  if (!manifest.text.includes("#EXT-X-PLAYLIST-TYPE:VOD")) throw new Error("KNOWN_DURATION_MUST_USE_VOD_PLAYLIST");
  if (!manifest.text.includes("#EXT-X-ENDLIST")) throw new Error("KNOWN_DURATION_VOD_MUST_END");

  const seconds = Number(manifest.probedDuration);
  if (!Number.isFinite(seconds) || seconds < 110 || seconds > 130) throw new Error(`BAD_PROBED_DURATION_${manifest.probedDuration}`);
  const extinf = Number(manifest.text.match(/#EXTINF:([0-9.]+)/)?.[1] || 0);
  if (extinf < 110 || extinf > 130) throw new Error(`BAD_MANIFEST_DURATION_${extinf}`);

  console.log("PASS iPhone WebKit wraps opaque MPEG-TS media in HLS with measured duration", {
    videoSrc: manifest.src,
    durationSeconds: seconds,
    manifestDuration: extinf,
    manifestHasOpaqueMedia: true,
  });
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
