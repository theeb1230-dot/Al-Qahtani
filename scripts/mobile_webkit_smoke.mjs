#!/usr/bin/env node
import { spawn } from "node:child_process";
import { webkit, devices } from "playwright";

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const BACKEND = "https://al-qahtani-api.onrender.com";
const sampleRef = `legacy:${encodeURIComponent("https://akwam.ss/series/sample-show")}`;
const episodeRef = `legacy:${encodeURIComponent("https://akwam.ss/episode/sample-show-1")}`;
const movieRef = `legacy:${encodeURIComponent("https://akwam.ss/movie/sample-movie")}`;
const seriesPoster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3C/svg%3E";
const moviePoster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3C/svg%3E";

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
    if (u.pathname === "/api/v1/category") {
      const categoryId = u.searchParams.get("ref") || "";
      const isMovie = categoryId.startsWith("movie-");
      return json(route, {
        status: "success",
        version: "1.0.1",
        kind: "category",
        source: "basri-direct",
        cached: false,
        health: { name: "basri-direct", score: 100 },
        data: isMovie
          ? [{ title: "فيلم اختبار 2026", poster: moviePoster, type: "movie", ref: movieRef }]
          : [{ title: "مسلسل اختبار", poster: seriesPoster, type: "series", ref: sampleRef }],
      });
    }
    if (u.pathname === "/api/cinema/search") {
      return json(route, {
        status: "success",
        source: "basri-direct",
        data: [{ title: "مسلسل اختبار", img: seriesPoster, is_series: true, href: sampleRef }],
      });
    }
    if (u.pathname === "/api/cinema/details") {
      const ref = u.searchParams.get("ref") || "";
      if (ref === movieRef) {
        return json(route, {
          status: "success",
          source: "basri-direct",
          movie_title: "فيلم اختبار 2026",
          poster: moviePoster,
          episodes: [],
          media_path: "/api/cinema/media?id=webkit-movie",
          media_type: "stream",
          is_iframe: false,
        });
      }
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
        poster: seriesPoster,
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
          "content-range": "bytes 0-11/12",
          "accept-ranges": "bytes",
          "content-length": "12",
          ...(u.searchParams.get("download") === "1" ? { "content-disposition": 'attachment; filename="al-qahtani-media"' } : {}),
        },
        body: Buffer.from([0, 0, 0, 12, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]),
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

async function installAndroidDownloadCapture(page) {
  await page.evaluate(() => {
    window.__capturedDownload = "";
    window.Android = { downloadFile(url) { window.__capturedDownload = String(url || ""); } };
  });
}

async function assertTypedPlayerSource(page, expectedUrl, label) {
  const source = page.locator("#player video source");
  await source.waitFor({ state: "attached" });
  const src = await source.getAttribute("src");
  const type = await source.getAttribute("type");
  assert(src === expectedUrl, `${label} opens secured backend media in Player`, { src });
  assert(type === "video/mp4", `${label} gives Safari an explicit MP4 MIME hint`, { type });
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
  assert(await page.locator("#mediaGrid .item").count() === 1, "series category renders a result");
  await assertNoHorizontalOverflow(page, "series category grid");

  await page.locator("#mediaGrid .item").first().click();
  await page.locator("#episodesWrap").waitFor({ state: "visible" });
  assert((await page.locator("#title").textContent()) === "مسلسل اختبار", "series details title renders");
  assert((await page.locator("#kind").textContent()) === "مسلسل", "series kind renders");
  assert((await page.locator("#poster").getAttribute("src")) === seriesPoster, "series poster metadata survives navigation");
  assert(await page.locator("#episodes .ep").count() === 2, "episode buttons render");
  assert((await page.locator("#episodes .ep").first().textContent()) === "الحلقة 1", "episode number metadata renders");
  await assertNoHorizontalOverflow(page, "series details view");

  await page.locator("#episodes .ep").first().click();
  await page.locator("#episodeModal.show").waitFor({ state: "visible" });
  assert(!(await page.locator("#choiceDownloadBtn").isHidden()), "episode choice restores original download action");
  assert((await page.locator("#choiceTitle").textContent())?.includes("الحلقة 1"), "episode choice identifies selected episode");
  await installAndroidDownloadCapture(page);
  await page.locator("#choiceDownloadBtn").click();
  let downloadUrl = await page.evaluate(() => window.__capturedDownload);
  assert(downloadUrl === `${BACKEND}/api/cinema/media?id=webkit-smoke&download=1`, "episode download uses opaque Al-Qahtani reference", { downloadUrl });
  assert(!downloadUrl.includes("akwam.ss") && !downloadUrl.includes("downet.net"), "episode download does not leak upstream host", { downloadUrl });

  await Promise.all([
    page.waitForURL(/Player\.html\?/),
    page.locator("#choiceWatchBtn").click(),
  ]);
  await assertTypedPlayerSource(page, `${BACKEND}/api/cinema/media?id=webkit-smoke`, "episode");
  await assertNoHorizontalOverflow(page, "series player");

  await page.goto(`${BASE}/albasri-cinema.html`, { waitUntil: "domcontentloaded" });
  await page.locator("#movieCats .cat").first().click();
  await page.locator("#mediaGrid .item").waitFor({ state: "visible" });
  assert(await page.locator("#mediaGrid .item").count() === 1, "movie category renders a result");
  assert((await page.locator("#mediaGrid .badge").first().textContent()) === "فيلم", "movie card keeps movie kind");
  await page.locator("#mediaGrid .item").first().click();
  await page.locator("#actions .primary").waitFor({ state: "visible" });
  assert((await page.locator("#title").textContent()) === "فيلم اختبار 2026", "movie details title renders");
  assert((await page.locator("#kind").textContent()) === "فيلم", "movie details kind renders");
  assert((await page.locator("#poster").getAttribute("src")) === moviePoster, "movie poster metadata survives navigation");
  assert(await page.locator("#episodesWrap").isHidden(), "movie direct-watch path does not fabricate episodes");
  assert((await page.locator("#actions .primary").textContent()) === "مشاهدة", "movie direct-watch action renders");
  assert(await page.locator("#actions .download").count() === 1, "movie restores download action beside watch");
  await assertNoHorizontalOverflow(page, "movie details view");

  await installAndroidDownloadCapture(page);
  await page.locator("#actions .download").click();
  downloadUrl = await page.evaluate(() => window.__capturedDownload);
  assert(downloadUrl === `${BACKEND}/api/cinema/media?id=webkit-movie&download=1`, "movie download uses opaque Al-Qahtani reference", { downloadUrl });
  assert(!downloadUrl.includes("akwam.ss") && !downloadUrl.includes("downet.net"), "movie download does not leak upstream host", { downloadUrl });

  await Promise.all([
    page.waitForURL(/Player\.html\?/),
    page.locator("#actions .primary").click(),
  ]);
  await assertTypedPlayerSource(page, `${BACKEND}/api/cinema/media?id=webkit-movie`, "movie");
  await assertNoHorizontalOverflow(page, "movie player");

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
