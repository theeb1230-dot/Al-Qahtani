import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("albasri-cinema.html", "utf8");
const api = fs.readFileSync("web/core/api-client.js", "utf8");
const config = fs.readFileSync("web/core/catalog-config.js", "utf8");

assert.match(api, /getCinemaCategory\(type,name,categoryId="",page=1\)/, "cinema category API must accept a category ID and page argument");
assert.match(api, /\/api\/v1\/category\?ref=/, "cinema category API must use the versioned runtime route");
assert.match(api, /[&?]p=/, "cinema category API must forward page to backend");
assert.doesNotMatch(config, /https:\/\/akwam\.ss/i, "browser category config must not expose Basri source URLs");
assert.match(config, /series-foreign/, "browser category config must use opaque category IDs");
assert.match(config, /movie-anime/, "browser category config must include opaque movie category IDs");
assert.match(html, /IntersectionObserver/, "category view must use viewport-driven incremental loading");
assert.match(html, /loadNextCategoryPage/, "category view must have a bounded next-page loader");
assert.match(html, /currentCategoryPage\+1/, "category loader must advance one page at a time");
assert.match(html, /raw\.length<30/, "category loader must treat a short page as the source end");
assert.match(html, /categorySeen/, "category loader must deduplicate repeated upstream items");
assert.match(html, /categoryLoading/, "category loader must guard concurrent duplicate requests");
assert.match(html, /categoryRequestId/, "category loader must ignore stale responses after navigation");
assert.match(html, /resetCategoryPaging\(\);const q=/, "search must cancel category infinite-scroll state");
assert.match(html, /مرّر للأسفل لتحميل 30 عملًا إضافيًا/, "category UI must explain the next 30-item batch");

console.log("category infinite-scroll tests passed");
