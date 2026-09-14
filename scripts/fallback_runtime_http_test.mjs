import assert from "node:assert/strict";
import http from "node:http";
import { createAlQahtaniRuntimeServer } from "../server/index-runtime.mjs";

const opaqueRef = "fallback:abcdefghijklmnopqrstuvwx";
const fallbackRuntime = {
  status() { return { status: "ok" }; },
  resolve() { throw new Error("not used"); },
  recordFailure() { throw new Error("not used"); },
  async probe(ref) {
    assert.equal(ref, opaqueRef);
    return {
      status: "success",
      source: "fallback",
      data: {
        ref,
        reachable: true,
        kind: "direct",
        playable_candidate: true,
        container: "mp4",
        range206: true,
        accept_ranges: true,
        redirect: false,
        latency_ms: 12,
        status_code: 206,
      },
    };
  },
};

const tmdbRuntime = {
  status() { return { status: "ok" }; },
  async search() { return { status: "success", data: [] }; },
  async details() { return { status: "success", data: {} }; },
  async season() { return { status: "success", data: [] }; },
};

const baseServer = http.createServer((_req, res) => {
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "error", message: "NOT_FOUND" }));
});

const server = createAlQahtaniRuntimeServer({ baseServer, tmdbRuntime, fallbackRuntime });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();

try {
  const body = await new Promise((resolve, reject) => {
    const req = http.get({
      hostname: "127.0.0.1",
      port: address.port,
      path: `/api/v1/fallback/probe?ref=${encodeURIComponent(opaqueRef)}`,
      headers: { Origin: "https://theeb1230-dot.github.io" },
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        try {
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers["access-control-allow-origin"], "https://theeb1230-dot.github.io");
          resolve(Buffer.concat(chunks).toString("utf8"));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
  });

  const payload = JSON.parse(body);
  assert.equal(payload.data.ref, opaqueRef);
  assert.equal(payload.data.container, "mp4");
  assert.equal(payload.data.status_code, 206);
  assert.equal(body.includes("https://api."), false, "public probe response must not expose provider target URLs");
  assert.equal(body.includes("providerId"), false, "public probe response must not expose provider identity");
  console.log("fallback_runtime_http_test: ok");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
