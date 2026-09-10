# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` remains the behavioral baseline.

## Current state
- `main` is at `f329a2bac5ef6278c3e35e11cdc9ca0553877c35`, the squash merge of PR #11.
- Active PR: #12 `Retry transient provider playback failures` on `fix/provider-playback-retry-12`.
- Al-Qahtani Render service `https://al-qahtani-api.onrender.com` auto-deployed `f329a2bac5ef6278c3e35e11cdc9ca0553877c35` and reached `live`.
- Theeb Engine is `https://theeb-arab-api.onrender.com`, live on `38720273d43acbe7fcf072a3cdaf8c6b1659b1b1`.
- Protected `/api/providers/*` calls use server-only `THEEB_SERVICE_TOKEN`; browser code never receives the credential.

## Completed / diagnosed in this run
- Re-audited main, branches, PRs, Actions runs, Render services/deploys/logs, backend code and documentation.
- Reproduced the post-PR #10 deployed runtime failure. A later retry proved the all-empty search/category state was transient: `الذئب الوحيد`, `The Odyssey`, and anime returned live discovery results once Theeb providers recovered.
- Isolated the deterministic Odyssey details failure from the transient discovery failure. Render logs showed ArabSeed and WeCima discovery URLs on redirected hosts were rejected by Theeb provider-target validation with HTTP 400.
- PR #11 added `server/theeb-fetch.mjs` with bounded retry for HTTP-200 empty `/v1/discover`, fresh/stale in-memory cache, bounded cache size, and structured recovery diagnostics.
- PR #11 preserved fail-closed provider auth and SSRF validation; it did not broadly allowlist redirect domains.
- PR #11 changed discovered movie resolution to use stable `provider_series_id` before volatile `source_url`.
- Added deterministic Node tests for discovery retry/cache and provider-only bearer injection; Web smoke runs them.
- PR #11 Web smoke and Live provider E2E passed, then PR #11 was squash-merged as `f329a2bac5ef6278c3e35e11cdc9ca0553877c35`.
- Render deployed that exact merge commit and the post-main `Remote runtime smoke` passed end to end for its current assertions:
  - backend health passed;
  - matches returned 12 items;
  - `الذئب الوحيد` returned two search items and opened provider details with 20 episodes;
  - `The Odyssey` returned two items and opened details as `provider-movie`;
  - anime category returned one real item.
- The same deployed gate still exposed a separate playback limitation: the selected Akwam episode returned `PROVIDER_EPISODE_UNAVAILABLE`. Theeb logs show `/api/providers/akwam/episode/:id` returned HTTP 500, so this is after successful search/details and is not the same bug.
- PR #12 now retries protected provider GET calls only for transient transport/408/429/5xx outcomes using bounded backoff. HTTP 400 provider-target/security failures remain fail-closed and are not retried.
- Added deterministic tests proving provider 500→200 recovery and proving HTTP 400 is attempted only once.

## Preserved original behavior
- Matches: session acquisition, server discovery, HLS/MP4/embed playback and periodic refresh.
- News: readable non-obfuscated bridge/incremental loading and article details without ad-network runtime code.
- Cinema: categories, search, details, episodes, watch/download entry points, canonical/discovery/legacy/provider fallbacks.
- `Player.html` stays web-native and does not launch `com.bsr.player.pro`.
- Safari media paths stay behind Al-Qahtani Range-aware proxies.

## Known limitations / gates not yet passed
- PR #12 must pass Web smoke and Live provider smoke before merge.
- `PROVIDER_EPISODE_UNAVAILABLE` may be transient, but retries alone are not sufficient evidence of playback parity. If the deployed gate still gets no source, the next fix must try alternate provider candidates for the same content/episode before final failure.
- The current remote playback assertion validates the response contract even when state is `error`; this must be tightened once alternate-provider playback fallback exists.
- Safari byte-range media probing is still skipped whenever the selected live sample yields no playable media URL.
- Download-option UX remains incomplete.
- Flutter migration stays blocked until live Web playback, not just search/details, is proven.

## Next run goals
1. Finish PR #12 Web smoke and Live provider smoke; fix failures only on `fix/provider-playback-retry-12`.
2. Merge PR #12 only when both gates are green and verify Render deploys the exact merge commit.
3. Re-run the deployed runtime gate and inspect whether Akwam episode resolution recovers under bounded provider retries.
4. If playback still fails, preserve content context in episode references and try alternate discovered providers for the same episode before returning `NO_PLAYABLE_SOURCE`.
5. Tighten the remote playback gate to require a real playable source when at least one provider advertises one; stop treating an error contract as playback success.
6. Exercise Safari `Range: bytes=0-1023` through `/api/cinema/media` or `/api/cinema/provider-media` when a live direct source exists and require 200/206 plus range headers.
7. Add provider-health diagnostics separating 200-empty, timeout, 4xx validation, 5xx provider failure and no-playable-source without logging secrets.
8. Expand matches/news regression smoke while cinema work continues.
9. Add browser-level GitHub Pages navigation coverage after playback is green.
10. Only after live Web search → details → episodes → playback is proven, start Flutter Android Mobile/Android TV/iOS and gated release workflows.
