#!/usr/bin/env node
import assert from "node:assert/strict";
import { createServer } from "../server/app.mjs";

const ALLOWED = "https://theeb1230-dot.github.io";
const EVIL = "https://evil.example";
const LOOKALIKE = "https://theeb1230-dot.github.io.evil.example";

const server = createServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();
const base = `http://127.0.0.1:${address.port}`;

async function request(path, { origin, method = "GET", headers = {} } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(origin === undefined ? {} : { Origin: origin }),
      ...headers,
    },
    redirect: "manual",
  });
  const text = method === "OPTIONS" ? "" : await response.text();
  return { response, text };
}

function assertNoCorsGrant(response, label) {
  assert.equal(response.headers.get("access-control-allow-origin"), null, `${label}: must not grant ACAO`);
  assert.equal(response.headers.get("access-control-allow-credentials"), null, `${label}: credentials must not be enabled`);
}

function assertAllowedCors(response, label) {
  assert.equal(response.headers.get("access-control-allow-origin"), ALLOWED, `${label}: exact allowed origin expected`);
  assert.match(response.headers.get("vary") || "", /(?:^|,\s*)Origin(?:,|$)/i, `${label}: Vary: Origin required`);
  assert.equal(response.headers.get("access-control-allow-credentials"), null, `${label}: credentialed CORS is intentionally disabled`);
}

try {
  {
    const { response } = await request("/health", { origin: ALLOWED });
    assert.equal(response.status, 200);
    assertAllowedCors(response, "allowed health");
  }

  for (const origin of [EVIL, LOOKALIKE, "null"]) {
    const { response } = await request("/health", { origin });
    assert.equal(response.status, 200);
    assertNoCorsGrant(response, `rejected health ${origin}`);
    assert.match(response.headers.get("vary") || "", /(?:^|,\s*)Origin(?:,|$)/i, "rejected responses still vary by Origin");
  }

  {
    const { response } = await request("/api/cinema/search?q=test", {
      origin: EVIL,
      method: "OPTIONS",
      headers: {
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Range, Content-Type",
      },
    });
    assert.equal(response.status, 204);
    assertNoCorsGrant(response, "rejected preflight");
  }

  {
    const { response } = await request("/api/cinema/search?q=test", {
      origin: ALLOWED,
      method: "OPTIONS",
      headers: {
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Range, Content-Type",
      },
    });
    assert.equal(response.status, 204);
    assertAllowedCors(response, "allowed preflight");
    assert.match(response.headers.get("access-control-allow-methods") || "", /GET/);
    assert.match(response.headers.get("access-control-allow-headers") || "", /Range/i);
  }

  for (const origin of [EVIL, LOOKALIKE]) {
    const { response, text } = await request("/api/cinema/media?id=not-a-real-reference&download=1", { origin });
    assert.equal(response.status, 404);
    assertNoCorsGrant(response, `rejected media error ${origin}`);
    assert.equal(response.headers.get("content-disposition"), null, "rejected media reference must not gain download decoration");
    assert.equal(response.headers.get("x-content-type-options"), null, "rejected media reference must not gain download-only headers");
    assert.match(response.headers.get("content-type") || "", /^application\/json\b/i);
    assert.equal(JSON.parse(text).message, "MEDIA_REFERENCE_EXPIRED");
  }

  {
    const { response, text } = await request("/api/cinema/media?id=not-a-real-reference&download=1", { origin: ALLOWED });
    assert.equal(response.status, 404);
    assertAllowedCors(response, "allowed-origin media error");
    assert.equal(response.headers.get("content-disposition"), null);
    assert.equal(response.headers.get("x-content-type-options"), null);
    assert.equal(JSON.parse(text).message, "MEDIA_REFERENCE_EXPIRED");
  }

  {
    const { response } = await request("/does-not-exist", { origin: EVIL });
    assert.equal(response.status, 404);
    assertNoCorsGrant(response, "rejected origin unknown route");
  }

  console.log("PASS CORS grants only exact allowed origins; rejected origins stay browser-inaccessible on success, preflight, media errors, downloads, and 404s");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
