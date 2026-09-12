#!/usr/bin/env node

const NEWS = "https://news.albesriali03.workers.dev/";
const ORIGIN = "https://www.albasritv.abrdns.com";

function redact(value = "") {
  return String(value)
    .replace(/https?:\/\/[^\s"'`)<>]+/gi, "[url]")
    .replace(/\s+/g, " ")
    .trim();
}

async function get(url, accept) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: ctl.signal,
      headers: {
        Accept: accept,
        Origin: ORIGIN,
        Referer: ORIGIN + "/2026/09/news.html",
        "X-BSR-Page": "/2026/09/news.html",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
      },
    });
    return { response, text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

const root = await get(NEWS + "?_=" + Date.now(), "application/json");
let json = null;
try { json = JSON.parse(root.text); } catch {}
const data = json?.data;
const rootItems = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : Array.isArray(json?.items) ? json.items : [];
console.log("NEWS_ROOT", {
  status: root.response.status,
  contentType: root.response.headers.get("content-type") || "",
  keys: json && typeof json === "object" ? Object.keys(json).slice(0, 20) : [],
  dataKeys: data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data).slice(0, 20) : [],
  count: rootItems.length,
  bytes: root.text.length,
});

const source = await get(NEWS + "?action=source&_=" + Date.now(), "text/html,application/xhtml+xml,*/*;q=0.8");
const sourceText = source.text;
const title = sourceText.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, " ").trim() || "";
const markers = [];
for (const line of sourceText.split(/\r?\n/)) {
  if (!/(YS_NEWS_BRIDGE|postMessage|items|fetch\(|loadMore|article|news|source)/i.test(line)) continue;
  const clean = redact(line).slice(0, 500);
  if (clean && !markers.includes(clean)) markers.push(clean);
  if (markers.length >= 30) break;
}

const cardSnippets = [];
for (const match of sourceText.matchAll(/<a\b[^>]*href=["'][^"']*\/ar\/news\/\d+\/[^"']*["'][^>]*>[\s\S]{0,1600}?<\/a>/gi)) {
  const snippet = redact(match[0]).slice(0, 1600);
  if (snippet && !cardSnippets.includes(snippet)) cardSnippets.push(snippet);
  if (cardSnippets.length >= 3) break;
}

console.log("NEWS_SOURCE", {
  status: source.response.status,
  contentType: source.response.headers.get("content-type") || "",
  bytes: sourceText.length,
  title: redact(title).slice(0, 180),
  markers,
  cardSnippets,
});

if (!root.response.ok || !source.response.ok) process.exitCode = 1;
