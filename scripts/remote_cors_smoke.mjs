#!/usr/bin/env node

const BASE = process.env.AL_QAHTANI_BASE || "https://al-qahtani-api.onrender.com";
const ALLOWED = "https://theeb1230-dot.github.io";
const REJECTED = [
  "https://evil.example",
  "https://theeb1230-dot.github.io.evil.example",
  "null",
];

function check(condition, message, detail = {}) {
  if (!condition) {
    console.error("FAIL", message, detail);
    process.exitCode = 1;
    return false;
  }
  console.log("PASS", message, detail);
  return true;
}

async function request(path, { origin, method = "GET", headers = {}, timeoutMs = 20000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const response = await fetch(BASE + path, {
      method,
      headers: {
        ...(origin === undefined ? {} : { Origin: origin }),
        ...headers,
      },
      redirect: "manual",
      cache: "no-store",
      signal: ctl.signal,
    });
    const text = method === "OPTIONS" ? "" : await response.text();
    return { response, text };
  } finally {
    clearTimeout(timer);
  }
}

function noGrant(response, label) {
  check(response.headers.get("access-control-allow-origin") === null, `${label} receives no ACAO`);
  check(response.headers.get("access-control-allow-credentials") === null, `${label} receives no credentialed CORS`);
}

function exactGrant(response, label) {
  check(response.headers.get("access-control-allow-origin") === ALLOWED, `${label} receives exact ACAO`, {
    acao: response.headers.get("access-control-allow-origin"),
  });
  check(/(?:^|,\s*)Origin(?:,|$)/i.test(response.headers.get("vary") || ""), `${label} varies by Origin`);
  check(response.headers.get("access-control-allow-credentials") === null, `${label} stays non-credentialed`);
}

try {
  const health = await request("/health", { origin: ALLOWED });
  check(health.response.status === 200, "deployed health is reachable", { status: health.response.status, base: BASE });
  exactGrant(health.response, "allowed deployed health");

  for (const origin of REJECTED) {
    const result = await request("/health", { origin });
    check(result.response.status === 200, `deployed health remains functional for rejected Origin ${origin}`, { status: result.response.status });
    noGrant(result.response, `rejected deployed health ${origin}`);
  }

  const rejectedPreflight = await request("/api/cinema/media?id=fake", {
    origin: REJECTED[0],
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "Range, Content-Type",
    },
  });
  check(rejectedPreflight.response.status === 204, "deployed rejected preflight remains syntactically valid", { status: rejectedPreflight.response.status });
  noGrant(rejectedPreflight.response, "rejected deployed preflight");

  const allowedPreflight = await request("/api/cinema/media?id=fake", {
    origin: ALLOWED,
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "Range, Content-Type",
    },
  });
  check(allowedPreflight.response.status === 204, "deployed allowed preflight succeeds", { status: allowedPreflight.response.status });
  exactGrant(allowedPreflight.response, "allowed deployed preflight");
  check(/Range/i.test(allowedPreflight.response.headers.get("access-control-allow-headers") || ""), "deployed allowed preflight exposes Range request header");

  for (const origin of REJECTED.slice(0, 2)) {
    const result = await request("/api/cinema/media?id=not-a-real-reference&download=1", { origin });
    check(result.response.status === 404, `deployed rejected media error stays 404 for ${origin}`, { status: result.response.status });
    noGrant(result.response, `rejected deployed media error ${origin}`);
    check(result.response.headers.get("content-disposition") === null, "rejected deployed media error has no attachment header");
    check(result.response.headers.get("x-content-type-options") === null, "rejected deployed media error has no download-only nosniff header");
    check(/^application\/json\b/i.test(result.response.headers.get("content-type") || ""), "rejected deployed media error remains JSON");
    let payload = null;
    try { payload = JSON.parse(result.text); } catch {}
    check(payload?.message === "MEDIA_REFERENCE_EXPIRED", "rejected deployed media error keeps opaque-reference contract", { payload });
  }

  const allowedMediaError = await request("/api/cinema/media?id=not-a-real-reference&download=1", { origin: ALLOWED });
  check(allowedMediaError.response.status === 404, "allowed-origin deployed invalid media remains 404");
  exactGrant(allowedMediaError.response, "allowed-origin deployed media error");
  check(allowedMediaError.response.headers.get("content-disposition") === null, "allowed-origin invalid media still has no attachment header");

  console.log("PASS deployed CORS boundary matches deterministic local policy without touching content providers");
} catch (error) {
  console.error("REMOTE_CORS_FATAL", error);
  process.exitCode = 1;
}
