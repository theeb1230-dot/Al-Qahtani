# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs in this project.
- Historical `https://akwam.ss/...` links are part of the original Basri cinema content contract. Their use here is not an integration with the separate `akwam-indexer` repository.
- Matches/news use the original Basri workers.
- Cinema remains on the original Basri content chain. The historical cinema worker currently returns `403 FORBIDDEN_ORIGIN`, so the Al-Qahtani backend uses a server-side compatibility fallback over the same original content source instead of switching to another project/provider.

## Current state
- PR #17 `Restore original Basri cinema runtime` merged.
- PR #18 `Fix deployed Basri parity gate` merged.
- PR #19 `Record deployed Web parity success` merged.
- PR #20 `Add iPhone WebKit cinema navigation gate` merged.
- PR #21 `Cover iPhone movie playback flow` merged.
- Current `main`: `4ba1aa9af329ef3c29db428ea22a297c51c65149`.
- No cross-project Theeb/akwam-indexer provider dependency is present in the runtime path.

## What PR #21 added
- Extended `scripts/mobile_webkit_smoke.mjs` from the episodic series path to the direct movie path.
- The iPhone WebKit gate now covers movie category -> movie details -> direct watch action -> `Player.html`.
- Added assertions for series/movie kind labels, non-empty poster metadata, episode numbering, direct-movie behavior without fabricated episodes, and secured backend media URLs.
- Both episodic series playback and direct movie playback must remain behind `https://al-qahtani-api.onrender.com/api/cinema/media?id=...` rather than exposing raw provider media URLs.
- Existing iPhone viewport overflow assertions remain active for cinema home, category grids, details, and player views.

## CI evidence
PR #21 head `6c94b2499ba0b3dc6131b5372f8e6b5e9310cebc` passed:
- Web smoke #91.
- Live provider smoke #63.
- Mobile WebKit smoke #5.

After PR #21 was squash-merged, `main` became `4ba1aa9af329ef3c29db428ea22a297c51c65149` and passed:
- Deploy GitHub Pages #21.
- Web smoke #92.
- Remote runtime smoke #13 against the live backend.
- Mobile WebKit smoke #6.

## Deployed Web parity status
Web parity remains proven for the Basri restoration path:
- backend health;
- live matches;
- Basri news worker;
- Arabic search;
- cinema categories;
- details and episodes;
- playback resolving through the Al-Qahtani media proxy;
- Safari HTTP byte-range handling;
- all 12 visible cinema categories returning content in the deployed remote runtime gate.

The browser-level WebKit gate now additionally proves deterministic iPhone navigation for both:
- series -> episode -> Player;
- movie -> direct watch -> Player.

## Root causes fixed/contained
- Removed cross-project Theeb/akwam-indexer runtime integration.
- Restored category/search/details/episodes/watch behavior from the Basri chain.
- Historical cinema worker origin lock (`403 FORBIDDEN_ORIGIN`) is handled server-side with same-source fallback.
- Arabic URL Referers are percent-encoded before Node HTTP requests.
- Legacy `.downet.net` media TLS compatibility remains scoped to the already allowlisted host and known certificate-chain failures; other TLS remains strict.
- Direct media URLs remain hidden behind short-lived `/api/cinema/media?id=...` references.
- CORS and Safari byte-range forwarding are preserved.
- iPhone-width horizontal overflow is covered by WebKit regression tests.

## Render evidence and limitation this run
- The public backend remains `https://al-qahtani-api.onrender.com` and Remote runtime smoke #13 passed against it after the PR #21 merge.
- Direct Render workspace/deploy/log inspection was not available in this run because the Render connector had no workspace selected and explicitly requires user workspace confirmation before selecting one. No claim is made that Render deploy logs were inspected in this run.
- This limitation does not invalidate the external live-runtime evidence from GitHub Actions, but exact Render deployment-ID/commit parity should be rechecked once workspace access is available.

## Original archive/download review status
- The original archive is still stored as `albasritv.github.io-main.zip` in the repository and remains the baseline.
- Binary archive content could not be inspected through the current GitHub text/blob connector path in this run, so the historical download-flow contract is not yet claimed as verified.
- Do not invent or expose a download UI until the original behavior is recovered and secured.

## Next run goals
1. Reconfirm there is no open PR and that `main` remains green before new work.
2. Verify deployed direct-movie playback with a real movie result through details -> media proxy -> HTTP Range, rather than relying only on deterministic browser mocks for the movie branch.
3. Inspect the original `albasritv.github.io-main.zip` with a binary-capable path and document the exact Basri download contract, including watch/download URLs and UI behavior.
4. If the original product exposes downloads, preserve them through a safe Al-Qahtani backend contract without leaking tokens or allowing arbitrary external URLs/SSRF.
5. Add regression tests for any restored download behavior before exposing it in the browser UI.
6. Keep the ad/pop-up/tracking/deep-link guards active and keep Basri worker/session secrets out of browser files.
7. Recheck exact Render deployment commit/logs when workspace selection is available; do not infer deploy parity from stale deployment IDs.
8. Preserve the WebKit movie/series metadata and viewport gates during subsequent UI work.
9. With Web parity now proven, begin Flutter only as a faithful client over the established Al-Qahtani backend after the remaining original download contract is understood; keep Android Mobile, Android TV D-Pad/remote, and iOS free of cross-project provider dependencies.
10. Update this handoff with exact PR/commit/CI/Render/live evidence at the end of the next run.
