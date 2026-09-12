import crypto from "node:crypto";

const DEFAULT_WORKER = "https://news.albesriali03.workers.dev/";
const REF_TTL_MS = 30 * 60_000;
const MAX_REFS = 1024;

function listFromPayload(payload) {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function articleFromPayload(payload) {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

function safeText(value, max = 20_000) {
  return String(value ?? "").replace(/\u0000/g, "").slice(0, max);
}

function decodeHtml(value = "") {
  return safeText(value, 20_000)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlText(value = "", max = 2_000) {
  return safeText(decodeHtml(String(value).replace(/<[^>]*>/g, " ")), max).replace(/\s+/g, " ").trim();
}

function normalizeParagraphs(value) {
  if (Array.isArray(value)) return value.map((entry) => safeText(entry, 8_000)).filter(Boolean).slice(0, 100);
  const text = safeText(value, 40_000);
  return text ? [text] : [];
}

function sourceOriginFromHtml(html = "") {
  const canonical = String(html).match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1]
    || String(html).match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i)?.[1]
    || "";
  try {
    const url = new URL(decodeHtml(canonical));
    return url.protocol === "https:" ? url.origin : "";
  } catch {
    return "";
  }
}

function safeSourceArticleUrl(value, allowedOrigin) {
  try {
    const url = new URL(decodeHtml(value));
    if (url.protocol !== "https:" || !allowedOrigin || url.origin !== allowedOrigin) return "";
    if (!/^\/ar\/news\/\d+\//i.test(url.pathname)) return "";
    url.hash = "";
    return url.href;
  } catch {
    return "";
  }
}

function parseNewsCards(text, allowedOrigin) {
  const out = [];
  const seen = new Set();
  for (const match of String(text).matchAll(/<a\b([^>]*href=["']([^"']*\/ar\/news\/\d+\/[^"']*)["'][^>]*)>([\s\S]{0,2400}?)<\/a>/gi)) {
    const url = safeSourceArticleUrl(match[2], allowedOrigin);
    if (!url || seen.has(url)) continue;
    const body = match[3] || "";
    const title = htmlText(body.match(/<(?:h2|h3)\b[^>]*class=["'][^"']*news-title[^"']*["'][^>]*>([\s\S]*?)<\/(?:h2|h3)>/i)?.[1] || "", 500);
    if (!title) continue;
    const date = htmlText(body.match(/<div\b[^>]*class=["'][^"']*news-date[^"']*["'][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] || "", 160);
    const description = htmlText(body.match(/<p\b[^>]*class=["'][^"']*(?:big-news-lead|news-lead)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] || "", 2_000);
    seen.add(url);
    out.push({ url, title, date, description });
    if (out.length >= 60) break;
  }
  return out;
}

function parseNewsJsonLd(text, allowedOrigin) {
  const scripts = [...String(text).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const out = [];
  const seen = new Set();
  for (const match of scripts) {
    let payload;
    try { payload = JSON.parse(decodeHtml(match[1]).trim()); } catch { continue; }
    const roots = Array.isArray(payload) ? payload : [payload];
    for (const root of roots) {
      const candidates = root?.["@type"] === "ItemList" ? root.itemListElement : root?.["@graph"]?.find?.((item) => item?.["@type"] === "ItemList")?.itemListElement;
      if (!Array.isArray(candidates)) continue;
      for (const entry of candidates) {
        const rawItem = entry?.item && typeof entry.item === "object" ? entry.item : entry;
        const url = safeSourceArticleUrl(rawItem?.url || rawItem?.item || entry?.item, allowedOrigin);
        if (!url || seen.has(url)) continue;
        seen.add(url);
        out.push({
          url,
          title: safeText(rawItem?.name || entry?.name || "بدون عنوان", 500),
          date: safeText(rawItem?.datePublished || rawItem?.date || "", 160),
          description: safeText(rawItem?.description || "", 2_000),
        });
        if (out.length >= 60) return out;
      }
    }
  }
  return out;
}

export function parseNewsSourceHtml(html = "") {
  const text = String(html || "");
  const allowedOrigin = sourceOriginFromHtml(text);
  if (!allowedOrigin) return [];
  const cards = parseNewsCards(text, allowedOrigin);
  if (cards.length) return cards;
  return parseNewsJsonLd(text, allowedOrigin);
}

export function createNewsRuntime({ fetchImpl = fetch, workerBase = DEFAULT_WORKER, now = () => Date.now() } = {}) {
  const refs = new Map();

  function prune() {
    const current = now();
    for (const [key, entry] of refs) if (entry.expiresAt <= current) refs.delete(key);
    while (refs.size > MAX_REFS) refs.delete(refs.keys().next().value);
  }

  function remember(url) {
    const value = safeText(url, 4_000).trim();
    if (!value) return "";
    prune();
    const id = crypto.randomBytes(18).toString("base64url");
    refs.set(id, { url: value, expiresAt: now() + REF_TTL_MS });
    return id;
  }

  function resolve(ref) {
    prune();
    const entry = refs.get(String(ref || ""));
    if (!entry) throw new Error("NEWS_REFERENCE_EXPIRED");
    return entry.url;
  }

  async function requestJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetchImpl(url, { signal: controller.signal, redirect: "follow", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`NEWS_UPSTREAM_${response.status}`);
      const payload = await response.json();
      if (!(payload?.status === "success" || payload?.success === true)) throw new Error("NEWS_UPSTREAM_REJECTED");
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }

  async function requestSourceHtml() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const url = new URL(workerBase);
      url.searchParams.set("action", "source");
      url.searchParams.set("_", String(now()));
      const response = await fetchImpl(url.href, { signal: controller.signal, redirect: "follow", headers: { Accept: "text/html,application/xhtml+xml" } });
      if (!response.ok) throw new Error(`NEWS_SOURCE_UPSTREAM_${response.status}`);
      const html = await response.text();
      const items = parseNewsSourceHtml(html);
      if (!items.length) throw new Error("NEWS_SOURCE_EMPTY");
      return items;
    } finally {
      clearTimeout(timer);
    }
  }

  async function list() {
    const payload = await requestJson(`${workerBase}?_=${now()}`);
    let sourceItems = listFromPayload(payload);
    if (!sourceItems.length) sourceItems = await requestSourceHtml();
    const items = sourceItems.slice(0, 60).map((item, index) => {
      const ref = remember(item?.url || item?.link || item?.href || "");
      return {
        id: ref || `news-${index + 1}`,
        ref,
        title: safeText(item?.title || item?.name || "بدون عنوان", 500),
        date: safeText(item?.date || "", 160),
        description: safeText(item?.description || item?.summary || "", 2_000),
      };
    }).filter((item) => item.ref);
    return { status: "success", version: "1.0.10", kind: "news", data: items };
  }

  async function article(ref) {
    const source = resolve(ref);
    const url = new URL(workerBase);
    url.searchParams.set("action", "article");
    url.searchParams.set("url", source);
    url.searchParams.set("_", String(now()));
    const payload = await requestJson(url.href);
    const data = articleFromPayload(payload);
    return {
      status: "success",
      version: "1.0.10",
      kind: "news-article",
      data: {
        ref: String(ref),
        title: safeText(data.title || "", 500),
        date: safeText(data.date || "", 160),
        paragraphs: normalizeParagraphs(data.paragraphs || data.content_text || data.content || ""),
      },
    };
  }

  return { list, article };
}
