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

function normalizeParagraphs(value) {
  if (Array.isArray(value)) return value.map((entry) => safeText(entry, 8_000)).filter(Boolean).slice(0, 100);
  const text = safeText(value, 40_000);
  return text ? [text] : [];
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

  async function request(url) {
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

  async function list() {
    const payload = await request(`${workerBase}?_=${now()}`);
    const items = listFromPayload(payload).slice(0, 60).map((item, index) => {
      const ref = remember(item?.url || item?.link || item?.href || "");
      return {
        id: ref || `news-${index + 1}`,
        ref,
        title: safeText(item?.title || item?.name || "بدون عنوان", 500),
        date: safeText(item?.date || "", 160),
        description: safeText(item?.description || item?.summary || "", 2_000),
      };
    }).filter((item) => item.ref);
    return { status: "success", version: "1.0.5", kind: "news", data: items };
  }

  async function article(ref) {
    const source = resolve(ref);
    const url = new URL(workerBase);
    url.searchParams.set("action", "article");
    url.searchParams.set("url", source);
    url.searchParams.set("_", String(now()));
    const payload = await request(url.href);
    const data = articleFromPayload(payload);
    return {
      status: "success",
      version: "1.0.5",
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
