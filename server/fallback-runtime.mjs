import crypto from "node:crypto";
import { FallbackProviderPool, buildFallbackProviderUrl } from "./fallback-providers.mjs";
import { probeFallbackTarget } from "./fallback-probe.mjs";

const DEFAULT_TTL_MS = 10 * 60_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const MAX_REFS = 256;
const DIRECT_MEDIA_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/mp2t", "mpeg-ts"],
]);

function positiveInt(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(`INVALID_${field.toUpperCase()}`);
  return number;
}

function normalizeIdentity({ tmdbId, type, season, episode } = {}) {
  const id = positiveInt(tmdbId, "tmdb_id");
  if (type === "movie") return Object.freeze({ tmdbId: id, type: "movie" });
  if (type !== "series" && type !== "tv") throw new Error("INVALID_MEDIA_TYPE");
  return Object.freeze({ tmdbId: id, type: "series", season: positiveInt(season, "season"), episode: positiveInt(episode, "episode") });
}

function normalizeRange(value) {
  const range = String(value || "").trim();
  if (!range) return "bytes=0-";
  if (!/^bytes=\d*-\d*$/.test(range) || range === "bytes=-") throw new Error("BAD_FALLBACK_RANGE");
  return range;
}

function contentTypeOf(response) {
  return String(response?.headers?.get?.("content-type") || "").split(";", 1)[0].trim().toLowerCase();
}

export class FallbackPlaybackRuntime {
  constructor({ pool = new FallbackProviderPool(), ttlMs = DEFAULT_TTL_MS, maxAttempts = DEFAULT_MAX_ATTEMPTS, now = () => Date.now() } = {}) {
    this.pool = pool;
    this.ttlMs = Math.max(1_000, Math.min(Number(ttlMs) || DEFAULT_TTL_MS, 30 * 60_000));
    this.maxAttempts = Math.max(1, Math.min(Number(maxAttempts) || DEFAULT_MAX_ATTEMPTS, 5));
    this.now = now;
    this.refs = new Map();
  }

  status() {
    return { status: "ok", configured: true, opaque_refs: true, providers: this.pool.ranked(this.now()).length, max_attempts: this.maxAttempts };
  }

  resolve(identityInput) {
    const identity = normalizeIdentity(identityInput);
    const provider = this.pool.ranked(this.now()).find((item) => item.available);
    if (!provider) throw new Error("NO_FALLBACK_PROVIDER_AVAILABLE");
    return this.#createRef(provider, identity, 1);
  }

  inspect(ref) {
    const id = this.#id(ref);
    const entry = this.refs.get(id);
    if (!entry || entry.expiresAt <= this.now()) {
      this.refs.delete(id);
      throw new Error("FALLBACK_REFERENCE_EXPIRED");
    }
    return { ...entry };
  }

  async probe(ref, { fetchImpl = globalThis.fetch, timeoutMs = 2_500 } = {}) {
    const entry = this.inspect(ref);
    const result = await probeFallbackTarget(entry.target, { fetchImpl, timeoutMs, now: this.now });
    return { status: "success", source: "fallback", data: { ref: String(ref), expires_at: entry.expiresAt, attempt: entry.attempt, max_attempts: this.maxAttempts, reachable: result.reachable === true, kind: result.kind, playable_candidate: result.playable === true, container: result.container, range206: result.range206 === true, accept_ranges: result.acceptRanges === true, redirect: result.redirect === true, latency_ms: result.latencyMs, status_code: result.statusCode } };
  }

  async openDirectMedia(ref, { fetchImpl = globalThis.fetch, range, timeoutMs = 8_000 } = {}) {
    const entry = this.inspect(ref);
    const probe = await probeFallbackTarget(entry.target, { fetchImpl, timeoutMs: Math.min(Math.max(Number(timeoutMs) || 2_500, 250), 5_000), now: this.now });
    if (probe.redirect) throw new Error("FALLBACK_MEDIA_REDIRECT_REJECTED");
    if (!probe.playable || probe.kind !== "direct") throw new Error("FALLBACK_MEDIA_NOT_DIRECT");
    if (probe.container === "hls") throw new Error("FALLBACK_HLS_PROXY_PENDING");
    if (!["mp4", "mpeg-ts"].includes(probe.container)) throw new Error("FALLBACK_MEDIA_UNSUPPORTED");

    const controller = new AbortController();
    const timeout = Math.min(Math.max(Number(timeoutMs) || 8_000, 500), 15_000);
    const timer = setTimeout(() => controller.abort(), timeout);
    let response;
    try {
      response = await fetchImpl(entry.target, { method: "GET", redirect: "manual", cache: "no-store", signal: controller.signal, headers: { Accept: "video/mp4,video/mp2t,application/octet-stream;q=0.8,*/*;q=0.1", Range: normalizeRange(range) } });
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("FALLBACK_MEDIA_TIMEOUT");
      throw new Error("FALLBACK_MEDIA_NETWORK_ERROR");
    } finally { clearTimeout(timer); }

    const status = Number(response?.status || 0);
    if ([301, 302, 303, 307, 308].includes(status)) { await response?.body?.cancel?.().catch?.(() => {}); throw new Error("FALLBACK_MEDIA_REDIRECT_REJECTED"); }
    if (status !== 200 && status !== 206) { await response?.body?.cancel?.().catch?.(() => {}); throw new Error("FALLBACK_MEDIA_BAD_STATUS"); }
    const contentType = contentTypeOf(response);
    const container = DIRECT_MEDIA_TYPES.get(contentType);
    if (!container) { await response?.body?.cancel?.().catch?.(() => {}); throw new Error("FALLBACK_MEDIA_UNSUPPORTED"); }
    if (probe.container !== container) { await response?.body?.cancel?.().catch?.(() => {}); throw new Error("FALLBACK_MEDIA_CLASSIFICATION_CHANGED"); }
    return { response, meta: { ref: String(ref), expiresAt: entry.expiresAt, attempt: entry.attempt, container, status, contentType, contentLength: response.headers.get("content-length"), contentRange: response.headers.get("content-range"), acceptRanges: response.headers.get("accept-ranges") } };
  }

  recordFailure(ref, evidence = {}) {
    const entry = this.inspect(ref);
    if (evidence.playerFailure !== true) throw new Error("PLAYER_FAILURE_EVIDENCE_REQUIRED");
    if (entry.attempt >= this.maxAttempts) throw new Error("FALLBACK_ATTEMPT_LIMIT_REACHED");
    this.pool.recordPlaybackFailure(entry.providerId, { now: this.now() });
    return this.next(ref);
  }

  recordSuccess(ref, evidence = {}) {
    const entry = this.inspect(ref);
    if (evidence.playbackSignal !== true || evidence.playing !== true) throw new Error("PLAYING_EVIDENCE_REQUIRED");
    this.pool.recordPlaybackSuccess(entry.providerId, { latencyMs: evidence.latencyMs, container: evidence.container, range206: evidence.range206 === true, safariPlayable: evidence.safariPlayable === true, now: this.now() });
    return { status: "success" };
  }

  next(ref) {
    const current = this.inspect(ref);
    if (current.attempt >= this.maxAttempts) throw new Error("FALLBACK_ATTEMPT_LIMIT_REACHED");
    const ranked = this.pool.ranked(this.now()).filter((item) => item.available && item.id !== current.providerId);
    if (!ranked.length) throw new Error("NO_FALLBACK_PROVIDER_AVAILABLE");
    return this.#createRef(ranked[0], current.identity, current.attempt + 1);
  }

  #createRef(provider, identity, attempt) {
    const target = buildFallbackProviderUrl(provider.id, identity);
    const id = crypto.randomBytes(18).toString("base64url");
    const expiresAt = this.now() + this.ttlMs;
    this.refs.set(id, { providerId: provider.id, identity, target: target.href, expiresAt, attempt });
    this.#sweep();
    return { status: "success", source: "fallback", data: { ref: `fallback:${id}`, expires_at: expiresAt, media_type: "embed", attempt, max_attempts: this.maxAttempts } };
  }

  #id(ref) {
    const value = String(ref || "").trim();
    if (!value.startsWith("fallback:")) throw new Error("BAD_FALLBACK_REFERENCE");
    const id = value.slice("fallback:".length);
    if (!/^[A-Za-z0-9_-]{20,64}$/.test(id)) throw new Error("BAD_FALLBACK_REFERENCE");
    return id;
  }

  #sweep() {
    const now = this.now();
    for (const [id, entry] of this.refs) if (entry.expiresAt <= now) this.refs.delete(id);
    while (this.refs.size > MAX_REFS) this.refs.delete(this.refs.keys().next().value);
  }
}

export function createFallbackPlaybackRuntime(options) { return new FallbackPlaybackRuntime(options); }
