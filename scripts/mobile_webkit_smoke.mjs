#!/usr/bin/env node
import { spawn } from "node:child_process";
import { webkit, devices } from "playwright";

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const BACKEND = "https://al-qahtani-api.onrender.com";
const sampleRef = `legacy:${encodeURIComponent("https://akwam.ss/series/sample-show")}`;
const episodeRef = `legacy:${encodeURIComponent("https://akwam.ss/episode/sample-show-1")}`;

const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", d => process.stdout.write(`[http] ${d}`));
server.stderr.on("data", d => process.stderr.write(`[http] ${d}`));

async function waitServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const r = await fetch(`${BASE}/albasri-cinema.html`);
      if (r.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("static server did not start");
}

function json(route, data, status = 200) {
  return route.fulfill({ status, contentType: "application/json; charset=utf-8", body: JSON.stringify(data) });
}

async function installBackendMocks(page) {
  await page.route(`${BACKEND}/**`, async route => {
    const u = new URL(route.request().url());
    if (u.pathname === "/api/cinema/category" || u.pathname === "/api/cinema/search") {
      return json(route, {
        status: "success",
        source: "basri-direct",
        data: [{ title: "مسلسل اختبار", img: "", is_series: true, href: sampleRef }],
      });
    }
    if (u.pathname === "/api/cinema/details") {
      const ref = u.searchParams.get("ref") || "";
      if (ref === episodeRef) {
        return json(route, {
          status: "success",
          source: "basri-direct",
          movie_title: "مسلسل اختبار",
          episodes: [],
          media_path: "/api/cinema/media?id=webkit-smoke",
          media_type: "stream",
          is_iframe: false,
        });
      }
      return json(route, {
        status: "success",
        source: "basri-direct",
        movie_title: "مسلسل اختبار",
        poster: "",
        episodes: [
          { num: 1, link: episodeRef, watch_available: true },
          { num: 2, link: episodeRef, watch_available: true },
        ],
      });
    }
    if (u.pathname === "/api/cinema/media") {
      return route.fulfill({
        status: 206,
        headers: {
          "content-type": "video/mp4",
          "content-range": "bytes 0-3/4",
          "accept-ranges": "bytes",
          "content-length": "4",
        },
        body: Buffer.from([0, 0, 0, 0]),
      });
    }
    return json(route, { status: "error", message: "UNEXPECTED_WEBKIT_SMOKE_ROUTE" }, 404);
  });
}

function assert(cond, message, detail = {}) {
  if (!cond) throw new Error(`${message} ${JSON.stringify(detail)}`);
  console.log("PASS", message, detail);
}

async function assertNoHorizontalOverflow(page, label) {
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  assert(m.scrollWidth <= m.innerWidth + 1, `${label} fits iPhone viewport`, m);
}

let browser;
try {
  await waitServer();
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  await installBackendMocks(page);

  await page.goto(`${BASE}/albasri-cinema.html`, { waitUntil: "domcontentloaded" });
  await assertNoHorizontalOverflow(page, "cinema home");
  assert(await page.locator("#seriesCats .cat").count() >= 6, "series categories render");
  assert(await page.locator("#movieCats .cat").count() >= 6, "movie categories render");

  await page.locator("#seriesCats .cat").first().click();
  await page.locator("#mediaGrid .item").waitFor({ state: "visible" });
  assert(await page.locator("#mediaGrid .item").count() === 1, "category renders a result");
  await assertNoHorizontalOverflow(page, "category grid");

  await page.locator("#mediaGrid .item").first().click();
  await page.locator("#episodesWrap").waitFor({ state: "visible" });
  assert((await page.locator("#title").textContent()) === "مسلسل اختبار", "details title renders");
  assert(await page.locator("#episodes .ep").count() === 2, "episode buttons render");
  await assertNoHorizontalOverflow(page, "details view");

  await Promise.all([
    page.waitForURL(/Player\.html\?/),
    page.locator("#episodes .ep").first().click(),
  ]);
  await page.locator("#player video").waitFor({ state: "attached" });
  const src = await page.locator("#player video").getAttribute("src");
  assert(src === `${BACKEND}/api/cinema/media?id=webkit-smoke`, "episode opens secured backend media in Player", { src });
  await assertNoHorizontalOverflow(page, "player");

  await page.goto(`${BASE}/albasri-cinema.html`, { waitUntil: "domcontentloaded" });
  await page.locator("#q").fill("الذئب الوحيد");
  await page.locator("#searchBtn").click();
  await page.locator("#mediaGrid .item").waitFor({ state: "visible" });
  assert((await page.locator("#gridTitle").textContent())?.includes("الذئب الوحيد"), "search transition preserves query label");
  await page.locator("#mediaGrid .item").first().click();
  await page.locator("#episodesWrap").waitFor({ state: "visible" });
  assert(await page.locator("#episodes .ep").count() === 2, "search result opens episode details");

  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
