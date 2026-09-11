#!/usr/bin/env node
import { spawn } from "node:child_process";
import { webkit, devices } from "playwright";

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;
const MEDIA = "https://al-qahtani-api.onrender.com/api/cinema/media?id=webkit-ts";
const PACKET = 188;
const PACKETS_PER_SECOND = 100;
const TOTAL_PACKETS = 10_000;
const TOTAL_BYTES = TOTAL_PACKETS * PACKET;
const EXPECTED_DURATION = TOTAL_PACKETS / PACKETS_PER_SECOND;
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

function writePcr(packet, base) {
  const value = Math.floor(base) % 8589934592;
  packet[6] = Math.floor(value / 33554432) & 0xff;
  packet[7] = Math.floor(value / 131072) & 0xff;
  packet[8] = Math.floor(value / 512) & 0xff;
  packet[9] = Math.floor(value / 2) & 0xff;
  packet[10] = ((value & 1) << 7) | 0x7e;
  packet[11] = 0;
}

function makeRange(start, end) {
  const length = end - start + 1;
  const body = Buffer.alloc(length);
  const firstPacket = Math.ceil(start / PACKET);
  const lastPacket = Math.floor((end - (PACKET - 1)) / PACKET);
  for (let index = firstPacket; index <= lastPacket; index += 1) {
    const globalOffset = index * PACKET;
    const local = globalOffset - start;
    if (local < 0 || local + PACKET > body.length) continue;
    body[local] = 0x47;
    body[local + 1] = 0x41;
    body[local + 2] = 0x00;
    body[local + 3] = 0x30;
    body[local + 4] = 7;
    body[local + 5] = index % 10 === 0 ? 0x10 : 0x00;
    if (index % 10 === 0) writePcr(body.subarray(local, local + PACKET), (index / PACKETS_PER_SECOND) * 90000);
  }
  return body;
}

function parseRange(value = "") {
  const match = String(value).match(/bytes=(\d+)-(\d*)/i);
  if (!match) return { start: 0, end: Math.min(TOTAL_BYTES - 1, 4095) };
  const start = Math.max(0, Math.min(TOTAL_BYTES - 1, Number(match[1])));
  const requestedEnd = match[2] ? Number(match[2]) : TOTAL_BYTES - 1;
  return { start, end: Math.max(start, Math.min(TOTAL_BYTES - 1, requestedEnd)) };
}

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
    const { start, end } = parseRange(route.request().headers().range || "");
    const body = makeRange(start, end);
    await route.fulfill({
      status: 206,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-expose-headers": "Content-Type,Content-Length,Content-Range,Accept-Ranges",
        "content-type": "application/octet-stream",
        "accept-ranges": "bytes",
        "content-range": `bytes ${start}-${end}/${TOTAL_BYTES}`,
        "content-length": String(body.length),
      },
      body,
    });
  });

  const url = `${BASE}/Player.html?url=${encodeURIComponent(MEDIA)}&type=stream`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const video = page.locator("#player video");
  await video.waitFor({ state: "attached", timeout: 15_000 });

  const src = await video.getAttribute("src");
  if (!String(src || "").startsWith("blob:")) throw new Error(`EXPECTED_HLS_BLOB_SOURCE_GOT_${src}`);

  const manifest = await page.evaluate(async () => {
    const blobs = window.__createdObjectUrlBlobs || [];
    const blob = blobs.find(item => item?.type === "application/vnd.apple.mpegurl") || blobs[0];
    return {
      src: document.querySelector("#player video")?.getAttribute("src") || "",
      text: blob ? await blob.text() : "",
      blobType: blob?.type || "",
    };
  });

  if (manifest.blobType !== "application/vnd.apple.mpegurl") throw new Error(`WRONG_HLS_BLOB_TYPE_${manifest.blobType}`);
  if (!manifest.text.startsWith("#EXTM3U\n")) throw new Error(`MISSING_EXTM3U_${manifest.text.slice(0, 80)}`);
  if (!manifest.text.includes(MEDIA)) throw new Error("HLS_MANIFEST_MISSING_OPAQUE_MEDIA_URL");
  if (manifest.text.includes("akwam.ss") || manifest.text.includes("downet.net")) throw new Error("HLS_MANIFEST_LEAKS_UPSTREAM_HOST");
  if (manifest.text.includes("43200")) throw new Error("HLS_MANIFEST_STILL_USES_SYNTHETIC_12H_DURATION");

  const durationMatch = manifest.text.match(/#EXTINF:([0-9.]+),/);
  const targetMatch = manifest.text.match(/#EXT-X-TARGETDURATION:(\d+)/);
  const duration = Number(durationMatch?.[1] || 0);
  const targetDuration = Number(targetMatch?.[1] || 0);
  if (!(duration >= EXPECTED_DURATION - 2 && duration <= EXPECTED_DURATION + 2)) {
    throw new Error(`TRANSPORT_DERIVED_DURATION_OUT_OF_RANGE_${duration}`);
  }
  if (targetDuration !== Math.ceil(duration)) throw new Error(`TARGET_DURATION_MISMATCH_${targetDuration}_${duration}`);

  const status = await page.locator("#status").textContent();
  if (!String(status || "").includes("MPEG-TS")) throw new Error(`MISSING_MPEGTS_STATUS_${status}`);
  if (!String(status || "").includes("HLS")) throw new Error(`MISSING_HLS_STATUS_${status}`);

  console.log("PASS iPhone WebKit wraps MPEG-TS with transport-derived HLS duration", {
    videoSrc: manifest.src,
    duration,
    targetDuration,
    expected: EXPECTED_DURATION,
  });
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
