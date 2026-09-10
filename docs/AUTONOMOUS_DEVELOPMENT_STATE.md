# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` remains the behavioral baseline.

## Current state
- PR #9 was merged to `main` as `1260a6385722345327e8a7478b467c15d5f64c5a` after Web smoke and Live provider/backend E2E passed.
- Render auto-deployed that exact commit to `https://al-qahtani-api.onrender.com`; the deploy reached `live` and logs confirm `node server/index.mjs` now boots the refactored `server/app.mjs` runtime.
- Theeb Engine `theeb-arab-api` is deployed with service-token authentication support, and both Render services have the same server-to-server `THEEB_SERVICE_TOKEN` configured without exposing it to the browser or repository.
- Active branch: `test/remote-runtime-smoke-10`.

## Completed in this run
- Re-audited `main`, branches, the open PR, CI, Render service state and handoff documentation before continuing.
- Found the runtime split that explained why some GitHub fixes did not affect production: Render executed `server/index.mjs` while newer provider-details/media-proxy logic lived in `server/app.mjs`.
- Replaced `server/index.mjs` with a small runtime entrypoint that starts `createServer()` from `server/app.mjs`.
- Added server-only authorization injection for protected Theeb Engine `/api/providers/*` requests using `THEEB_SERVICE_TOKEN`; the token is never sent to GitHub Pages or committed to GitHub.
- Configured the same service token on `al-qahtani-api` and `theeb-arab-api` in Render. The Theeb Engine deployment completed successfully.
- Kept public `/v1/*` calls public while protecting provider recovery paths behind server-to-server Bearer authentication.
- Preserved the Range-aware `/api/cinema/media` proxy for Safari playback so the browser does not talk directly to protected/upstream media endpoints.
- Updated local CI so public smoke tests do not require secrets; protected recovery remains validated only when the service token is present.
- Web smoke and Live provider/backend E2E passed on PR #9, then PR #9 was squash-merged.
- Verified Render auto-deployed merge commit `1260a6385722345327e8a7478b467c15d5f64c5a` and reported it live.
- Added `scripts/remote_runtime_smoke.mjs` to test the actual deployed Render backend, not localhost only. It covers backend health, matches, Arabic search `الذئب الوحيد`, details fallback across multiple results, optional episode playback and byte-range media proxying, `The Odyssey`, and the anime category.
- Added `.github/workflows/remote-runtime-smoke.yml` and included the remote smoke script in static syntax validation.

## Preserved original behavior
- Matches: session acquisition, server discovery, HLS/MP4/embed playback and periodic refresh.
- News: source bridge/incremental loading and article details.
- Cinema: categories, search, details, episodes, watch/download entry points, with fallback across canonical/discovery/legacy/provider paths.
- Legacy player utility remains only as a web compatibility tool and does not launch `com.bsr.player.pro`.

## Known limitations
- Remote deployed runtime smoke is being introduced now; do not claim full Safari parity until that gate passes against the live Render backend.
- Provider availability is inherently variable. CI must distinguish an upstream empty/no-playable-source condition from a repository regression.
- Free Render services can cold-start; runtime probes include bounded retries/timeouts instead of treating the first slow request as a permanent failure.
- Download option UX is not complete yet.
- Flutter migration remains intentionally blocked until the live web chain is proven from search/category through details/episodes/playback.

## Next run goals
1. Run PR CI for `test/remote-runtime-smoke-10` and inspect the exact live Render failures, if any.
2. Require `الذئب الوحيد` and `The Odyssey` to return real search items and at least one detail result from the deployed backend.
3. Require the anime category to return real items, not merely `status: success` with an empty array.
4. When a live playable episode exists, verify the Al-Qahtani media proxy accepts Safari-style HTTP Range requests and never exposes the service token.
5. Add remote match server availability sampling across all current matches and classify empty server lists separately from transport/auth failures.
6. Add browser-level GitHub Pages navigation coverage for matches, search, category, details and Player routing.
7. Add short-lived backend cache/deduplication for search/category/detail requests to reduce cold-start/upstream jitter.
8. Finish download-option open flow through Theeb Engine without exposing temporary raw provider URLs.
9. Only after all live web runtime gates are green, initialize Flutter against the same Al-Qahtani backend contracts.
10. Then add Android Mobile, Android TV D-pad/focus, iOS unsigned IPA CI, and gated GitHub Releases.
