#!/usr/bin/env node
import { spawn } from "node:child_process";
import { webkit, devices } from "playwright";

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;
const MEDIA = "https://al-qahtani-api.onrender.com/api/cinema/media?id=webkit-ts";
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

function makeTsProbe() {
  const bytes = Buffer.alloc(4096);
  for (let offset = 0; offset < bytes.length; offset += 188) bytes[offset] = 0x47;
  bytes[1] = 0x40;
  bytes[2] = 0x00;
  bytes[3] = 0x10;
  return bytes;
}

let browser;
try {
  await waitServer();
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  const ts = makeTsProbe();

  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    window.__createdObjectUrlBlobs = [];
    URL.createObjectURL = blob => {
      window.__createdObjectUrlBlobs.push(blob);
      return original(blob);
    };
  });

  await page.route("https://al-qahtani-api.onrender.com/api/cinema/media**", async route => {
    const range = route.request().headers().range || "";
    const isProbe = range.includes("0-4095");
    const body = isProbe ? ts : ts.subarray(0, 1880);
    await route.fulfill({
      status: 206,
      headers: {
        "content-type": "application/octet-stream",
        "accept-ranges": "bytes",
        "content-range": `bytes 0-${body.length - 1}/1147681720`,
        "content-length": String(body.length),
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
    };
  });

  if (manifest.blobType !== "application/vnd.apple.mpegurl") throw new Error(`WRONG_HLS_BLOB_TYPE_${manifest.blobType}`);
  if (!manifest.text.startsWith("#EXTM3U\n")) throw new Error(`MISSING_EXTM3U_${manifest.text.slice(0, 80)}`);
  if (!manifest.text.includes(MEDIA)) throw new Error("HLS_MANIFEST_MISSING_OPAQUE_MEDIA_URL");
  if (manifest.text.includes("akwam.ss") || manifest.text.includes("downet.net")) throw new Error("HLS_MANIFEST_LEAKS_UPSTREAM_HOST");

  const status = await page.locator("#status").textContent();
  if (!String(status || "").includes("MPEG-TS")) throw new Error(`MISSING_MPEGTS_STATUS_${status}`);
  if (!String(status || "").includes("HLS")) throw new Error(`MISSING_HLS_STATUS_${status}`);

  console.log("PASS iPhone WebKit wraps opaque MPEG-TS media in HLS", {
    videoSrc: manifest.src,
    manifestHasOpaqueMedia: true,
  });
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
