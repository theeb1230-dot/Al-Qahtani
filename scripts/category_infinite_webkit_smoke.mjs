#!/usr/bin/env node
import { spawn } from "node:child_process";
import { webkit, devices } from "playwright";

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;
const BACKEND = "https://al-qahtani-api.onrender.com";
const poster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3C/svg%3E";

const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { stdio: ["ignore", "pipe", "pipe"] });
server.stdout.on("data", d => process.stdout.write(`[http] ${d}`));
server.stderr.on("data", d => process.stderr.write(`[http] ${d}`));

async function waitServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(`${BASE}/albasri-cinema.html`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("static server did not start");
}

function assert(condition, message, detail = {}) {
  if (!condition) throw new Error(`${message} ${JSON.stringify(detail)}`);
  console.log("PASS", message, detail);
}

function pageItems(pageNumber) {
  return Array.from({ length: 30 }, (_, index) => {
    const n = ((pageNumber - 1) * 30) + index + 1;
    return {
      title: `عمل ${n}`,
      image: poster,
      type: "series",
      ref: `legacy:${encodeURIComponent(`https://akwam.ss/series/infinite-${n}`)}`,
    };
  });
}

let browser;
try {
  await waitServer();
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  const requestedPages = [];
  const requestedRefs = [];

  await page.route(`${BACKEND}/**`, async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/category") {
      const p = Math.max(1, Number(url.searchParams.get("p") || 1));
      requestedPages.push(p);
      requestedRefs.push(url.searchParams.get("ref") || "");
      return route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ status: "success", version: "1.0.1", kind: "category", source: "basri-direct", data: pageItems(p) }),
      });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ status: "error" }) });
  });

  await page.goto(`${BASE}/albasri-cinema.html`, { waitUntil: "domcontentloaded" });
  await page.locator("#seriesCats .cat").first().click();
  await page.waitForFunction(() => document.querySelectorAll("#mediaGrid .item").length === 30);
  assert(await page.locator("#mediaGrid .item").count() === 30, "first category batch renders exactly 30 items");
  assert(requestedPages[0] === 1, "first category request uses page 1", { requestedPages });
  assert(requestedRefs[0] === "series-foreign", "browser sends opaque category ID instead of upstream URL", { requestedRefs });

  await page.locator("#categoryLoadState").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll("#mediaGrid .item").length >= 60);
  assert(await page.locator("#mediaGrid .item").count() === 60, "reaching item 30 appends the next 30 items");
  assert(requestedPages.includes(2), "infinite scroll requests page 2", { requestedPages });
  assert(requestedRefs.every(ref => ref === "series-foreign"), "all infinite-scroll requests keep the same opaque category ID", { requestedRefs });

  const titles = await page.locator("#mediaGrid .item b").allTextContents();
  assert(new Set(titles).size === titles.length, "appended category cards contain no duplicates", { count: titles.length });
  assert(titles.some(text => text.includes("عمل 60")), "second batch reaches item 60");

  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
