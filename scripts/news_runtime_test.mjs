import assert from "node:assert/strict";
import { createNewsRuntime } from "../server/news-runtime.mjs";

let now = 1_000;
const requests = [];
const runtime = createNewsRuntime({
  now: () => now,
  workerBase: "https://news.example/",
  fetchImpl: async (url) => {
    requests.push(String(url));
    const parsed = new URL(url);
    if (parsed.searchParams.get("action") === "article") {
      assert.equal(parsed.searchParams.get("url"), "https://source.example/article-1");
      return new Response(JSON.stringify({
        status: "success",
        data: { data: { title: "تفاصيل الخبر", date: "اليوم", paragraphs: ["فقرة 1", "فقرة 2"] } },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({
      status: "success",
      data: { data: [{ url: "https://source.example/article-1", title: "عنوان الخبر", date: "اليوم", description: "وصف مختصر" }] },
    }), { status: 200, headers: { "content-type": "application/json" } });
  },
});

const list = await runtime.list();
assert.equal(list.status, "success");
assert.equal(list.kind, "news");
assert.equal(list.data.length, 1);
assert.ok(list.data[0].ref);
assert.equal(JSON.stringify(list).includes("source.example"), false, "news list must not expose source URLs");

const article = await runtime.article(list.data[0].ref);
assert.equal(article.kind, "news-article");
assert.deepEqual(article.data.paragraphs, ["فقرة 1", "فقرة 2"]);
assert.equal(JSON.stringify(article).includes("source.example"), false, "article response must not expose source URLs");
assert.equal(requests.length, 2);

now += 31 * 60_000;
await assert.rejects(() => runtime.article(list.data[0].ref), /NEWS_REFERENCE_EXPIRED/);
console.log("news runtime regression passed");
