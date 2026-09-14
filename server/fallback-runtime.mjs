import crypto from "node:crypto";
import { FallbackProviderPool, buildFallbackProviderUrl } from "./fallback-providers.mjs";
import { probeFallbackTarget } from "./fallback-probe.mjs";

const DEFAULT_TTL_MS = 10 * 60_000;
const MAX_REFS = 256;

function positiveInt(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(`INVALID_${field.toUpperCase()}`);
  return number;
}

function normalizeIdentity({ tmdbId, type, season, episode } = {}) {
  const id = positiveInt(tmdbId, "tmdb_id");
  if (type === "movie") return Object.freeze({ tmdbId: id, type: "movie" });
  if (type !== "series" && type !== "tv") throw new Error("INVALID_MEDIA_TYPE");
  return Object.freeze({
    tmdbId: id,
    type: "series",
    season: positiveInt(season, "season"),
    episode: positiveInt(episode, "episode"),
  });
}

export class FallbackPlaybackRuntime {
  constructor({ pool = new FallbackProviderPool(), ttlMs = DEFAULT_TTL_MS, now = () => Date.now() } = {}) {
    this.pool = pool;
    this.ttlMs = Math.max(1_000, Math.min(Number(ttlMs) || DEFAULT_TTL_MS, 30 * 60_000));
    this.now = now;
    this.refs = new Map();
  }

  status() {
    return { status: "ok", configured: true, opaque_refs: true, providers: this.pool.ranked(this.now()).length };
  }

  resolve(identityInput) {
    const identity = normalizeIdentity(identityInput);
    const provider = this.pool.ranked(this.now()).find((item) => item.available);
    if (!provider) throw new Error("NO_FALLBACK_PROVIDER_AVAILABLE");
    const target = buildFallbackProviderUrl(provider.id, identity);
    const id = crypto.randomBytes(18).toString("base64url");
    const expiresAt = this.now() + this.ttlMs;
    this.refs.set(id, { providerId: provider.id, identity, target: target.href, expiresAt });
    this.#sweep();
    return {
      status: "success",
      source: "fallback",
      data: {
        ref: `fallback:${id}`,
        expires_at: expiresAt,
        media_type: "embed",
      },
    };
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
    const result = await probeFallbackTarget(entry.target, {
      fetchImpl,
      timeoutMs,
      now: this.now,
    });
    return {
      status: "success",
      source: "fallback",
      data: {
        ref: String(ref),
        expires_at: entry.expiresAt,
        reachable: result.reachable === true,
        kind: result.kind,
        playable_candidate: result.playable === true,
        container: result.container,
        range206: result.range206 === true,
        accept_ranges: result.acceptRanges === true,
        redirect: result.redirect === true,
        latency_ms: result.latencyMs,
        status_code: result.statusCode,
      },
    };
  }

  recordFailure(ref) {
    const entry = this.inspect(ref);
    this.pool.recordPlaybackFailure(entry.providerId, { now: this.now() });
    return this.next(ref);
  }

  recordSuccess(ref, evidence = {}) {
    const entry = this.inspect(ref);
    if (!evidence.playbackSignal) throw new Error("PLAYBACK_SIGNAL_REQUIRED");
    this.pool.recordPlaybackSuccess(entry.providerId, {
      latencyMs: evidence.latencyMs,
      container: evidence.container,
      range206: evidence.range206 === true,
      safariPlayable: evidence.safariPlayable === true,
      now: this.now(),
    });
    return { status: "success" };
  }

  next(ref) {
    const current = this.inspect(ref);
    const ranked = this.pool.ranked(this.now()).filter((item) => item.available && item.id !== current.providerId);
    if (!ranked.length) throw new Error("NO_FALLBACK_PROVIDER_AVAILABLE");
    const provider = ranked[0];
    const target = buildFallbackProviderUrl(provider.id, current.identity);
    const id = crypto.randomBytes(18).toString("base64url");
    const expiresAt = this.now() + this.ttlMs;
    this.refs.set(id, { providerId: provider.id, identity: current.identity, target: target.href, expiresAt });
    this.#sweep();
    return { status: "success", source: "fallback", data: { ref: `fallback:${id}`, expires_at: expiresAt, media_type: "embed" } };
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

export function createFallbackPlaybackRuntime(options) {
  return new FallbackPlaybackRuntime(options);
}
