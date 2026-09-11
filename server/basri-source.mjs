const SOURCE_ORIGIN = "https://akwam.ss";
const SOURCE_HOST = "akwam.ss";
const MEDIA_HOST_SUFFIXES = [".downet.net"];
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

function decodeEntities(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value = "") {
  return decodeEntities(String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function absoluteUrl(value, base = SOURCE_ORIGIN) {
  try { return new URL(decodeEntities(value), base).href; } catch { return ""; }
}

function safeHeaderUrl(value = "") {
  try { return new URL(String(value)).href; } catch { return encodeURI(String(value)); }
}

export function assertSourceUrl(value, { allowMedia = false } = {}) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const sourceOk = url.protocol === "https:" && host === SOURCE_HOST;
  const mediaOk = allowMedia && url.protocol === "https:" && MEDIA_HOST_SUFFIXES.some(suffix => host.endsWith(suffix));
  if (!sourceOk && !mediaOk) throw new Error("UNSAFE_CINEMA_SOURCE_URL");
  return url;
}

export async function fetchSourceHtml(value, { referer = SOURCE_ORIGIN + "/", timeoutMs = 30_000 } = {}) {
  const url = assertSourceUrl(value);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": UA,
        Referer: safeHeaderUrl(referer),
      },
    });
    if (!response.ok) throw new Error(`CINEMA_SOURCE_HTTP_${response.status}`);
    return { html: await response.text(), url: response.url || url.href };
  } finally {
    clearTimeout(timer);
  }
}

function contentKind(url) {
  try {
    const path = new URL(url).pathname;
    if (path.startsWith("/series/")) return "series";
    if (path.startsWith("/movie/") || path.startsWith("/movies/")) return "movie";
  } catch {}
  return "series";
}

export function parseCatalog(html = "") {
  const out = [];
  const seen = new Set();
  const boxRe = /<div\s+class=["'][^"']*entry-box\s+entry-box-1[^"']*["'][^>]*>([\s\S]*?)(?=<div\s+class=["'][^"']*entry-box\s+entry-box-1|$)/gi;
  let match;
  while ((match = boxRe.exec(html))) {
    const block = match[1];
    const hrefMatch = block.match(/<a[^>]+href=["'](https:\/\/akwam\.ss\/(?:series|movie|movies)\/[^"']+)["'][^>]*class=["'][^"']*(?:box|play)[^"']*["']/i)
      || block.match(/href=["'](https:\/\/akwam\.ss\/(?:series|movie|movies)\/[^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = decodeEntities(hrefMatch[1]);
    if (seen.has(href)) continue;
    seen.add(href);
    const imgMatch = block.match(/<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/i)
      || block.match(/<img[^>]+alt=["']([^"']*)["'][^>]+(?:data-src|src)=["']([^"']+)["']/i);
    let img = "";
    let alt = "";
    if (imgMatch) {
      if (/^https?:/i.test(imgMatch[1]) || imgMatch[1].startsWith("/")) { img = absoluteUrl(imgMatch[1]); alt = imgMatch[2] || ""; }
      else { alt = imgMatch[1] || ""; img = absoluteUrl(imgMatch[2] || ""); }
    }
    const titleMatch = block.match(/<h3[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
    const yearMatch = block.match(/<span[^>]*class=["'][^"']*badge[^"']*secondary[^"']*["'][^>]*>\s*(\d{4})\s*<\/span>/i);
    const title = stripTags(titleMatch?.[1] || alt || "بدون عنوان");
    out.push({ title, img, is_series: contentKind(href) !== "movie", href, year: yearMatch?.[1] || null });
  }
  return out;
}

function parseJsonLd(html = "") {
  const objects = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(m[1].trim());
      if (Array.isArray(value)) objects.push(...value); else objects.push(value);
    } catch {}
  }
  return objects;
}

function pageTitle(html = "") {
  const ld = parseJsonLd(html).find(x => x && typeof x === "object" && (x.name || x.headline));
  if (ld?.name || ld?.headline) return String(ld.name || ld.headline);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return stripTags(title?.[1] || "");
}

function pagePoster(html = "") {
  const ld = parseJsonLd(html).find(x => x && typeof x === "object" && x.image);
  if (Array.isArray(ld?.image) && ld.image[0]) return absoluteUrl(ld.image[0]);
  if (typeof ld?.image === "string") return absoluteUrl(ld.image);
  const img = html.match(/<img[^>]+(?:class=["'][^"']*(?:poster|movie-poster|img-fluid)[^"']*["'][^>]+)?(?:data-src|src)=["']([^"']+)["']/i);
  return img ? absoluteUrl(img[1]) : "";
}

export function parseDetails(html = "", pageUrl = "") {
  const episodes = [];
  const seen = new Set();
  for (const m of html.matchAll(/href=["'](https:\/\/akwam\.ss\/episode\/[^"']+)["']/gi)) {
    const href = decodeEntities(m[1]);
    if (seen.has(href)) continue;
    seen.add(href);
    const numMatch = decodeURIComponent(href).match(/(?:الحلقة-|episode[-_/]?)(\d+)/i) || decodeURIComponent(href).match(/\/(\d+)(?:[^\d]*)$/);
    episodes.push({ num: Number(numMatch?.[1] || episodes.length + 1), link: href, watch_available: true });
  }
  episodes.sort((a, b) => Number(a.num) - Number(b.num));
  return {
    status: "success",
    source: "basri-direct",
    movie_title: pageTitle(html),
    poster: pagePoster(html),
    episodes,
    page_url: pageUrl,
  };
}

export function parseEpisode(html = "", pageUrl = "") {
  const watch = [];
  const downloads = [];
  for (const m of html.matchAll(/<a[^>]+href=["'](https:\/\/akwam\.ss\/(watch|download)\/[^"']+)["'][^>]*>/gi)) {
    const url = decodeEntities(m[1]);
    const kind = m[2].toLowerCase();
    const block = html.slice(m.index, Math.min(html.length, m.index + 700));
    const size = stripTags(block.match(/font-size-14[^>]*>([\s\S]*?)<\/span>/i)?.[1] || "");
    if (kind === "watch" && !watch.includes(url)) watch.push(url);
    if (kind === "download" && !downloads.some(x => x.url === url)) downloads.push({ url, size: size || null });
  }
  return { status: "success", source: "basri-direct", movie_title: pageTitle(html), watch, downloads, page_url: pageUrl };
}

export function parseWatch(html = "", pageUrl = "") {
  const candidates = [];
  for (const re of [
    /<source[^>]+src=["']([^"']+)["']/gi,
    /<video[^>]+src=["']([^"']+)["']/gi,
    /(?:file|src)\s*[:=]\s*["'](https?:\/\/[^"']+)["']/gi,
  ]) {
    for (const m of html.matchAll(re)) {
      const url = absoluteUrl(m[1], pageUrl || SOURCE_ORIGIN);
      if (!url || candidates.includes(url)) continue;
      try { assertSourceUrl(url, { allowMedia: true }); candidates.push(url); } catch {}
    }
  }
  return { status: candidates.length ? "success" : "error", source: "basri-direct", media_src: candidates[0] || "", candidates, movie_title: pageTitle(html), page_url: pageUrl };
}

export async function directCategory(sourceUrl, page = 1) {
  const url = assertSourceUrl(sourceUrl);
  if (page > 1) url.searchParams.set("page", String(page));
  const { html } = await fetchSourceHtml(url.href);
  return parseCatalog(html);
}

export async function directSearch(query) {
  const url = new URL("/search", SOURCE_ORIGIN);
  url.searchParams.set("q", String(query || "").trim());
  const { html } = await fetchSourceHtml(url.href);
  return parseCatalog(html);
}

export async function directDetails(target) {
  const url = assertSourceUrl(target);
  const { html } = await fetchSourceHtml(url.href);
  if (url.pathname.startsWith("/episode/")) return parseEpisode(html, url.href);
  return parseDetails(html, url.href);
}

export async function directWatch(target, referer = SOURCE_ORIGIN + "/") {
  const url = assertSourceUrl(target);
  if (!url.pathname.startsWith("/watch/")) throw new Error("BAD_WATCH_REFERENCE");
  const { html } = await fetchSourceHtml(url.href, { referer });
  return parseWatch(html, url.href);
}

export const BasriSource = Object.freeze({ origin: SOURCE_ORIGIN, userAgent: UA });
