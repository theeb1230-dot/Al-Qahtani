import zlib from "node:zlib";

export function sweepExpiredMediaRefs(mediaRefs, now = Date.now()) {
  let removed = 0;
  for (const [key, value] of mediaRefs) {
    if (!value || Number(value.expiresAt || 0) <= now) {
      mediaRefs.delete(key);
      removed += 1;
    }
  }
  return removed;
}

export function startMediaRefSweeper(mediaRefs, intervalMs = 60_000, { logger = console.log } = {}) {
  if (!(mediaRefs instanceof Map)) throw new TypeError("mediaRefs must be a Map");
  const interval = Number(intervalMs);
  if (!Number.isFinite(interval) || interval < 10) throw new TypeError("intervalMs must be >= 10");

  const timer = setInterval(() => {
    const removed = sweepExpiredMediaRefs(mediaRefs);
    if (removed > 0) {
      logger(JSON.stringify({
        ts: new Date().toISOString(),
        event: "media_refs_swept",
        removed,
        remaining: mediaRefs.size,
      }));
    }
  }, interval);
  timer.unref();
  return timer;
}

export function createRateLimiter({ windowMs = 60_000, max = 120 } = {}) {
  const window = Number(windowMs);
  const limit = Number(max);
  if (!Number.isFinite(window) || window < 1) throw new TypeError("windowMs must be positive");
  if (!Number.isInteger(limit) || limit < 1) throw new TypeError("max must be a positive integer");

  const hits = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of hits) {
      if (!value || value.resetAt <= now) hits.delete(key);
    }
  }, Math.min(Math.max(window, 1_000), 60_000));
  cleanup.unref();

  return function rateLimit(key, now = Date.now()) {
    const id = String(key || "unknown");
    let entry = hits.get(id);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + window };
      hits.set(id, entry);
    }
    entry.count += 1;
    return {
      ok: entry.count <= limit,
      remaining: Math.max(0, limit - entry.count),
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      resetAt: entry.resetAt,
    };
  };
}

export function getClientAddress(req) {
  const forwarded = String(req?.headers?.["x-forwarded-for"] || "")
    .split(",")
    .map((value) => value.trim())
    .find(Boolean);
  return forwarded || String(req?.socket?.remoteAddress || "unknown");
}

export function maybeCompress(req, body, { thresholdBytes = 1_024 } = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  if (payload.byteLength < thresholdBytes) return null;

  const accepted = String(req?.headers?.["accept-encoding"] || "").toLowerCase();
  if (/\bgzip\b/.test(accepted)) {
    return { body: zlib.gzipSync(payload), encoding: "gzip" };
  }
  if (/\bdeflate\b/.test(accepted)) {
    return { body: zlib.deflateSync(payload), encoding: "deflate" };
  }
  return null;
}
