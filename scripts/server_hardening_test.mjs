import assert from "node:assert/strict";
import http from "node:http";
import zlib from "node:zlib";
import { once } from "node:events";
import {
  createRateLimiter,
  maybeCompress,
  startMediaRefSweeper,
  sweepExpiredMediaRefs,
} from "../server/hardening.mjs";
import { createServer } from "../server/app.mjs";

const refs = new Map([
  ["expired", { expiresAt: 99 }],
  ["live", { expiresAt: 101 }],
]);
assert.equal(sweepExpiredMediaRefs(refs, 100), 1);
assert.equal(refs.has("expired"), false);
assert.equal(refs.has("live"), true);

const timedRefs = new Map([["soon", { expiresAt: Date.now() - 1 }]]);
const logs = [];
const timer = startMediaRefSweeper(timedRefs, 15, { logger: (value) => logs.push(value) });
await new Promise((resolve) => setTimeout(resolve, 35));
clearInterval(timer);
assert.equal(timedRefs.size, 0);
assert.ok(logs.some((line) => line.includes("media_refs_swept")));

const limiter = createRateLimiter({ windowMs: 1_000, max: 2 });
assert.equal(limiter("client", 1_000).ok, true);
assert.equal(limiter("client", 1_001).ok, true);
const limited = limiter("client", 1_002);
assert.equal(limited.ok, false);
assert.equal(limited.remaining, 0);
assert.ok(limited.retryAfterSec >= 1);
assert.equal(limiter("client", 2_001).ok, true);

const bigPayload = JSON.stringify({ payload: "x".repeat(4_096) });
const compressed = maybeCompress({ headers: { "accept-encoding": "gzip, deflate" } }, bigPayload);
assert.equal(compressed.encoding, "gzip");
assert.equal(zlib.gunzipSync(compressed.body).toString(), bigPayload);
assert.equal(maybeCompress({ headers: {} }, bigPayload), null);
assert.equal(maybeCompress({ headers: { "accept-encoding": "gzip" } }, "small"), null);

const runtimeService = {
  status: () => ({ status: "ok" }),
  matches: async () => ({ status: "success", data: [] }),
  search: async () => ({ status: "success", data: [{ title: "x".repeat(4_096) }] }),
  category: async () => ({ status: "success", data: [] }),
};

const server = createServer({ runtimeService });
server.listen(0, "127.0.0.1");
await once(server, "listening");
const { port } = server.address();

const response = await new Promise((resolve, reject) => {
  const req = http.get({
    host: "127.0.0.1",
    port,
    path: "/api/v1/search?q=test",
    headers: {
      Origin: "https://theeb1230-dot.github.io",
      "Accept-Encoding": "gzip",
    },
  }, (res) => {
    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => resolve({ res, body: Buffer.concat(chunks) }));
  });
  req.on("error", reject);
});
server.close();
await once(server, "close");

assert.equal(response.res.statusCode, 200);
assert.equal(response.res.headers["content-encoding"], "gzip");
assert.match(String(response.res.headers.vary || ""), /Origin/i);
assert.match(String(response.res.headers.vary || ""), /Accept-Encoding/i);
assert.ok(Number(response.res.headers["x-ratelimit-remaining"]) >= 0);
const decoded = JSON.parse(zlib.gunzipSync(response.body).toString("utf8"));
assert.equal(decoded.status, "success");
assert.equal(decoded.data[0].title.length, 4_096);

console.log("PASS server hardening: sweeper + rate limiter + gzip integration");
