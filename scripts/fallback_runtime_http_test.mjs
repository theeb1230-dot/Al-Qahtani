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
  async openDirectMedia(ref, { range } = {}) {
    assert.equal(ref, opaqueRef);
    assert.equal(range, "bytes=10-13");
    const response = new Response(new Uint8Array([10, 11, 12, 13]), {
      status: 206,
      headers: {
        "content-type": "video/mp4",
        "content-length": "4",
        "content-range": "bytes 10-13/100",
        "accept-ranges": "bytes",
      },
    });
    return {
      response,
      meta: {
        ref,
        container: "mp4",
        status: 206,
        contentType: "video/mp4",
        contentLength: "4",
        contentRange: "bytes 10-13/100",
        acceptRanges: "bytes",
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

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "127.0.0.1", port: address.port, path, headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ res, body: Buffer.concat(chunks) }));
    });
    req.on("error", reject);
  });
}

try {
  const probeResult = await request(
    `/api/v1/fallback/probe?ref=${encodeURIComponent(opaqueRef)}`,
    { Origin: "https://theeb1230-dot.github.io" },
  );
  assert.equal(probeResult.res.statusCode, 200);
  assert.equal(probeResult.res.headers["access-control-allow-origin"], "https://theeb1230-dot.github.io");
  const payload = JSON.parse(probeResult.body.toString("utf8"));
  assert.equal(payload.data.ref, opaqueRef);
  assert.equal(payload.data.container, "mp4");
  assert.equal(payload.data.status_code, 206);
  assert.equal(probeResult.body.includes(Buffer.from("https://api.")), false, "public probe response must not expose provider target URLs");
  assert.equal(probeResult.body.includes(Buffer.from("providerId")), false, "public probe response must not expose provider identity");

  const mediaResult = await request(
    `/api/v1/fallback/media?ref=${encodeURIComponent(opaqueRef)}`,
    { Origin: "https://theeb1230-dot.github.io", Range: "bytes=10-13" },
  );
  assert.equal(mediaResult.res.statusCode, 206);
  assert.equal(mediaResult.res.headers["content-type"], "video/mp4");
  assert.equal(mediaResult.res.headers["content-range"], "bytes 10-13/100");
  assert.equal(mediaResult.res.headers["accept-ranges"], "bytes");
  assert.equal(mediaResult.res.headers["x-al-qahtani-container"], "mp4");
  assert.equal(mediaResult.res.headers["access-control-allow-origin"], "https://theeb1230-dot.github.io");
  assert.equal(mediaResult.res.headers["access-control-expose-headers"].includes("Content-Range"), true);
  assert.deepEqual([...mediaResult.body], [10, 11, 12, 13]);
  assert.equal(mediaResult.body.includes(Buffer.from("https://")), false, "proxied media body must not serialize an upstream URL");

  console.log("fallback_runtime_http_test: ok");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
