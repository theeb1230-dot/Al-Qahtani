# Al-Qahtani 1.0.1 Content Runtime

This document records the intended incremental migration path for the 1.0.1 Web/PWA runtime.

## Current slice

`server/content-runtime.mjs` provides the low-level primitives: version metadata, bounded TTL cache, provider health/circuit-breaker state, and normalization helpers.

`server/content-runtime-service.mjs` is the first service layer built on top of those primitives. It deliberately wraps existing Basri-backed fetch functions through dependency injection instead of importing or exposing upstream hosts directly. The current service supports:

- normalized match envelopes;
- normalized search envelopes;
- normalized category envelopes;
- bounded short-lived metadata caching;
- latency/success/failure health accounting;
- provider status summaries;
- product version metadata (`1.0.1`).

This slice does **not** replace the existing HTTP routes yet. That is intentional: the current playback, matches, cinema, media proxy, Safari Range handling, and download paths remain untouched while the service contract is proven independently.

## Next integration slice

The next PR should wire the runtime service into read-only versioned HTTP endpoints alongside the existing routes, not instead of them. Recommended first endpoints:

- `/api/runtime/status`
- `/api/v1/matches`
- `/api/v1/search?q=...`
- `/api/v1/category?ref=...&p=...`

The old `/api/matches` and `/api/cinema/*` endpoints must remain available until live Web/PWA parity is verified against the new runtime contracts.

## Security invariants

- No browser-supplied arbitrary proxy target.
- Existing source/media allowlists remain authoritative.
- Worker/session material stays server-side.
- Short-lived media references remain outside metadata cache semantics.
- Playback and download routes are not cached by the runtime metadata cache.
- No cross-project provider dependency is introduced.
