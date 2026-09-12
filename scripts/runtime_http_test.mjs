import assert from "node:assert/strict";
import { createServer } from "../server/app.mjs";

const calls = { matches: 0, search: 0, category: 0 };
const runtimeService = {
  status() {
    return { status: "ok", version: "1.0.1", cache_entries: 0, providers: [] };
  },
  async matches() {
    calls.matches += 1;
    return { status: "success", version: "1.0.1", kind: "matches", source: "basri-matches", cached: false, health: null, data: [] };
  },
  async search(query) {
    calls.search += 1;
    return { status: "success", version: "1.0.1", kind: "search", source: "basri-original", cached: false, health: null, data: [{ id: query, title: query, ref: `legacy:${encodeURIComponent(query)}` }] };
  },
  async category(ref, page) {
    calls.category += 1;
    return { status: "success", version: "1.0.1", kind: "category", source: "basri-original", cached: false, health: null, data: [{ id: `${page}`, title: ref, ref }] };
  },
};

const server = createServer({ runtimeService });
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

try {
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  const statusResponse = await fetch(`${base}/api/runtime/status`);
  assert.equal(statusResponse.status, 200);
  assert.equal(statusResponse.headers.get("cache-control"), "no-store");
  const status = await statusResponse.json();
  assert.equal(status.version, "1.0.1");

  const matches = await (await fetch(`${base}/api/v1/matches`)).json();
  assert.equal(matches.kind, "matches");
  assert.equal(matches.version, "1.0.1");
  assert.equal(calls.matches, 1);

  const search = await (await fetch(`${base}/api/v1/search?q=${encodeURIComponent("الذئب الوحيد")}`)).json();
  assert.equal(search.kind, "search");
  assert.equal(search.data[0].title, "الذئب الوحيد");
  assert.equal(calls.search, 1);

  const categoryRef = "legacy:https%3A%2F%2Fakwam.ss%2Fseries%3Fsection%3D30";
  const category = await (await fetch(`${base}/api/v1/category?ref=${encodeURIComponent(categoryRef)}&p=2`)).json();
  assert.equal(category.kind, "category");
  assert.equal(category.data[0].id, "2");
  assert.equal(calls.category, 1);

  const oldRoute = await fetch(`${base}/api/not-a-route`);
  assert.equal(oldRoute.status, 404);

  console.log("runtime HTTP route tests passed");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
