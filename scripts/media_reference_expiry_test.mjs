#!/usr/bin/env node

process.env.NODE_ENV = "test";

const {
  createServer,
  __setMediaReferenceTtlForTest,
  __resetMediaReferenceTtlForTest,
  __createMediaReferenceForTest,
} = await import("../server/app.mjs");

function assert(condition, message, detail = {}) {
  if (!condition) {
    console.error("FAIL", message, detail);
    process.exitCode = 1;
    return false;
  }
  console.log("PASS", message, detail);
  return true;
}

const server = createServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

try {
  __setMediaReferenceTtlForTest(25);
  const mediaPath = __createMediaReferenceForTest("https://expiry-test.downet.net/video.mp4");
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  await new Promise((resolve) => setTimeout(resolve, 60));

  const response = await fetch(base + mediaPath + "&download=1", {
    headers: {
      Accept: "*/*",
      Origin: "https://theeb1230-dot.github.io",
      Range: "bytes=0-1023",
    },
    cache: "no-store",
  });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}

  assert(response.status === 404, "expired opaque media reference is rejected before upstream access", {
    status: response.status,
    body: text.slice(0, 160),
  });
  assert(data?.status === "error" && data?.message === "MEDIA_REFERENCE_EXPIRED",
    "expired media reference preserves opaque error contract");
  assert((response.headers.get("content-type") || "").toLowerCase().includes("application/json"),
    "expired media reference remains a JSON error response");
  assert(!(response.headers.get("content-disposition") || ""),
    "expired media reference never receives download attachment headers");
  assert(!(response.headers.get("x-content-type-options") || ""),
    "expired media reference never receives download MIME decoration");
} finally {
  __resetMediaReferenceTtlForTest();
  await new Promise((resolve) => server.close(resolve));
}

if (process.exitCode) process.exit(process.exitCode);
