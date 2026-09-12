import assert from "node:assert/strict";
import { createNewsRuntime, parseNewsSourceHtml } from "../server/news-runtime.mjs";

const sourceHtml = `<!doctype html><html><head>
<link rel="canonical" href="https://source.example/ar/news/" />
<script type="application/ld+json">{
  "@context":"https://schema.org",
  "@type":"ItemList",
  "numberOfItems":2,
  "itemListElement":[
    {"@type":"ListItem","position":1,"name":"عنوان الخبر الأول","item":"https://source.example/ar/news/101/story-one/"},
    {"@type":"ListItem","position":2,"name":"عنوان الخبر الثاني","item":"https://source.example/ar/news/102/story-two/"}
  ]
}</script></head><body>
<a href="https://source.example/ar/news/101/story-one/" class="news-item big-news-card">
  <h2 class="news-title">عنوان الخبر الأول</h2>
  <div class="news-date"><span>2026-09-12</span></div>
  <p class="big-news-lead">وصف الخبر الأول</p>
</a>
<a href="https://source.example/ar/news/102/story-two/" class="news-item">
  <h3 class="news-title">عنوان الخبر الثاني</h3>
  <div class="news-date"><span>2026-09-11</span></div>
</a>
</body></html>`;

const parsedSource = parseNewsSourceHtml(sourceHtml);
assert.equal(parsedSource.length, 2);
assert.equal(parsedSource[0].title, "عنوان الخبر الأول");
assert.equal(parsedSource[0].date, "2026-09-12");
assert.equal(parsedSource[0].description, "وصف الخبر الأول");
assert.equal(parsedSource[1].title, "عنوان الخبر الثاني");
assert.equal(parseNewsSourceHtml(sourceHtml.replaceAll("source.example", "evil.example").replace('href="https://evil.example/ar/news/"', 'href="https://source.example/ar/news/"')).length, 0, "cross-origin source items are rejected");

let now = 1_000;
const requests = [];
const runtime = createNewsRuntime({
  now: () => now,
  workerBase: "https://news.example/",
  fetchImpl: async (url) => {
    requests.push(String(url));
    const parsed = new URL(url);
    if (parsed.searchParams.get("action") === "article") {
      assert.equal(parsed.searchParams.get("url"), "https://source.example/ar/news/101/story-one/");
      return new Response(JSON.stringify({
        status: "success",
        data: { data: { title: "تفاصيل الخبر", date: "اليوم", paragraphs: ["فقرة 1", "فقرة 2"] } },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (parsed.searchParams.get("action") === "source") {
      return new Response(sourceHtml, { status: 200, headers: { "content-type": "text/html" } });
    }
    return new Response(JSON.stringify({ status: "success", name: "news", source: true, article: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  },
});

const list = await runtime.list();
assert.equal(list.status, "success");
assert.equal(list.kind, "news");
assert.equal(list.version, "1.0.10");
assert.equal(list.data.length, 2);
assert.ok(list.data[0].ref);
assert.equal(list.data[0].title, "عنوان الخبر الأول");
assert.equal(list.data[0].date, "2026-09-12");
assert.equal(list.data[0].description, "وصف الخبر الأول");
assert.equal(JSON.stringify(list).includes("source.example"), false, "news list must not expose source URLs");

const article = await runtime.article(list.data[0].ref);
assert.equal(article.kind, "news-article");
assert.equal(article.version, "1.0.10");
assert.deepEqual(article.data.paragraphs, ["فقرة 1", "فقرة 2"]);
assert.equal(JSON.stringify(article).includes("source.example"), false, "article response must not expose source URLs");
assert.equal(requests.length, 3, "metadata root, source fallback and article are requested in order");
assert.match(requests[1], /action=source/);

now += 31 * 60_000;
await assert.rejects(() => runtime.article(list.data[0].ref), /NEWS_REFERENCE_EXPIRED/);
console.log("news runtime regression passed");
