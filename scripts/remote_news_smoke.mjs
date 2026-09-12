#!/usr/bin/env node

const BASE = "https://al-qahtani-api.onrender.com";
const ORIGIN = "https://theeb1230-dot.github.io";

function fail(message, detail = {}) {
  console.error("FAIL", message, detail);
  process.exitCode = 1;
}

async function request(path, timeoutMs = 90_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(BASE + path, {
      headers: { Accept: "application/json", Origin: ORIGIN },
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data, text };
  } finally {
    clearTimeout(timer);
  }
}

function leaksUpstream(value) {
  const text = JSON.stringify(value || {});
  return /news\.albesriali03\.workers\.dev|https?:\/\/[^\s"']+(?:article|news)/i.test(text);
}

try {
  let list;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    list = await request("/api/v1/news", 30_000).catch(() => null);
    if (list?.response?.ok && list.data?.status === "success" && list.data?.kind === "news" && Array.isArray(list.data?.data)) break;
    await new Promise((resolve) => setTimeout(resolve, Math.min(15_000, attempt * 2_000)));
  }

  if (!list?.response?.ok || list.data?.status !== "success" || list.data?.kind !== "news" || !Array.isArray(list.data?.data)) {
    fail("deployed news list contract unavailable", { status: list?.response?.status, body: list?.text?.slice(0, 300) });
  } else {
    console.log("PASS deployed news list", { count: list.data.data.length });
    if (leaksUpstream(list.data)) fail("news list leaked upstream URL");
    const item = list.data.data.find((entry) => entry?.ref);
    if (!item) {
      fail("deployed news list returned no opaque reference");
    } else {
      if (/^https?:/i.test(String(item.ref))) fail("news reference must be opaque", { ref: item.ref });
      const article = await request("/api/v1/news/article?ref=" + encodeURIComponent(item.ref));
      if (!article.response.ok || article.data?.status !== "success" || article.data?.kind !== "news-article") {
        fail("deployed news article contract unavailable", { status: article.response.status, body: article.text.slice(0, 300) });
      } else {
        console.log("PASS deployed news article", { paragraphs: article.data?.data?.paragraphs?.length ?? 0 });
        if (leaksUpstream(article.data)) fail("news article leaked upstream URL");
      }
    }
  }
} catch (error) {
  fail("remote news smoke fatal", { error: String(error?.message || error) });
}
