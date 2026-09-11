#!/usr/bin/env node
import { spawn } from "node:child_process";
import { webkit, devices } from "playwright";

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;
const TRUSTED = "https://al-qahtani-api.onrender.com/api/cinema/media?id=player-guard";
const SPOOFED = "https://evil.example/api/cinema/media?id=player-guard";

const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(`${BASE}/Player.html`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("player static server did not start");
}

function assert(condition, message, detail = {}) {
  if (!condition) throw new Error(`${message} ${JSON.stringify(detail)}`);
  console.log("PASS", message, detail);
}

let browser;
try {
  await waitServer();
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();

  await page.goto(`${BASE}/Player.html?url=${encodeURIComponent(TRUSTED)}&type=stream`, { waitUntil: "domcontentloaded" });
  await page.locator("#player video").waitFor({ state: "attached" });
  assert(!(await page.locator("#download").isHidden()), "trusted Al-Qahtani media reference exposes player download action");

  await page.evaluate(() => {
    window.__capturedDownload = "";
    window.Android = { downloadFile(url) { window.__capturedDownload = String(url || ""); } };
  });
  await page.locator("#download").click();
  const captured = await page.evaluate(() => window.__capturedDownload);
  assert(captured === `${TRUSTED}&download=1`, "player download reuses opaque Al-Qahtani media reference", { captured });

  await page.goto(`${BASE}/Player.html?url=${encodeURIComponent(SPOOFED)}&type=stream`, { waitUntil: "domcontentloaded" });
  await page.locator("#player video").waitFor({ state: "attached" });
  assert(await page.locator("#download").isHidden(), "spoofed external origin cannot expose player download action");

  await page.goto(`${BASE}/Player.html?url=${encodeURIComponent("https://cdn.example/video.mp4")}&type=mp4`, { waitUntil: "domcontentloaded" });
  assert(await page.locator("#download").isHidden(), "arbitrary direct media cannot expose player download action");

  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
