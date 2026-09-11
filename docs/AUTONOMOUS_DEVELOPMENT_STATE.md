# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs in this project.
- The original Basri project behavior is the compatibility baseline.
- Historical `https://akwam.ss/...` links are part of the original Basri cinema content contract. Their use here is not an integration with the separate `akwam-indexer` repository.
- Matches/news use the original Basri workers.
- Cinema remains on the original Basri content chain. The historical cinema worker currently returns `403 FORBIDDEN_ORIGIN`, so the Al-Qahtani backend uses a server-side compatibility fallback over the same original content source rather than switching to another project/provider.

## Current state
- PR #17 `Restore original Basri cinema runtime` merged successfully.
- PR #18 `Fix deployed Basri parity gate` merged successfully.
- PR #19 `Record deployed Web parity success` merged successfully.
- Current `main` before PR #20: `ba0fecedb95d2e371de9ebce64247ddfbc34a561`.
- Render deployment `dep-dahu5cks728c73bq4tt0` is live on that exact `ba0feced...` commit in Frankfurt.
- Main Remote runtime smoke #11 passed against the deployed Render service.
- Active PR #20: `Add iPhone WebKit cinema navigation gate` on branch `test/mobile-webkit-flow-20`.
- PR #20 introduced a real headless WebKit regression gate using an iPhone 13 viewport and uncovered a genuine 17px horizontal overflow in the cinema header.
- The overflow was fixed by allowing the search flex item to shrink (`min-width: 0`).
- On PR #20 head after the fix, Web smoke #88, Live provider smoke #61, and Mobile WebKit smoke #2 are green. A documentation-only commit follows this evidence and therefore CI must be rechecked on the final PR head before merge.

## Root causes fixed/contained
- Removed cross-project Theeb/akwam-indexer runtime integration.
- Restored category/search/details/episodes/watch behavior from the Basri chain.
- Historical cinema worker origin lock (`403 FORBIDDEN_ORIGIN`) is handled server-side with same-source fallback.
- Arabic URL Referers are percent-encoded before Node HTTP requests.
- Legacy `.downet.net` media currently presents an incomplete TLS chain. The media proxy first uses strict TLS and retries with broken-chain compatibility only for the already allowlisted `.downet.net` host and only for known certificate-chain failures. All other TLS remains strict.
- Direct media URLs remain hidden behind short-lived `/api/cinema/media?id=...` references.
- CORS and Safari byte-range forwarding are preserved.
- iPhone-width cinema header horizontal overflow is covered by a WebKit viewport assertion.

## Deployed Web parity evidence
Remote runtime smoke #11 on main `ba0feced...` passed the deployed runtime gate after the documentation merge that followed the Basri restoration.

Earlier full remote parity evidence on the restored runtime established:
- backend health reports `basri-original`;
- matches returned live entries;
- Basri news worker returned HTTP 200/success;
- Arabic search returned real `basri-direct` results;
- search details returned real episodes;
- episode playback resolved to `/api/cinema/media?id=...`;
- Safari range request returned HTTP 206 with `Content-Range` and `Accept-Ranges: bytes`;
- all 12 visible cinema categories returned real cards and opened details remotely.

## Browser regression evidence
PR #20 adds `scripts/mobile_webkit_smoke.mjs` and `.github/workflows/mobile-webkit-smoke.yml`.

The test serves the actual repository web files and mocks only the backend API boundary so that UI/navigation behavior is deterministic. It runs Playwright WebKit with the `iPhone 13` device profile and verifies:
- cinema home has no horizontal viewport overflow;
- series and movie category buttons render;
- category navigation renders a result card;
- result card opens details;
- details render title and episode buttons;
- episode selection navigates to `Player.html`;
- Player receives the secured Al-Qahtani backend media URL rather than a raw provider URL;
- player view fits the iPhone viewport;
- Arabic search transition works and opens episode details.

First Mobile WebKit run failed correctly with `scrollWidth: 407` versus `innerWidth: 390`, exposing the pre-existing header overflow. After the CSS fix, Mobile WebKit smoke #2 passed.

## Render observations
- Service: `al-qahtani-api` / `https://al-qahtani-api.onrender.com`.
- Latest inspected deploy: `dep-dahu5cks728c73bq4tt0`, live on `ba0fecedb95d2e371de9ebce64247ddfbc34a561`.
- Build/start logs were clean and showed the backend listening normally.
- Runtime logs still show expected `CINEMA_SESSION_403` worker-fallback diagnostics for search/category/details because the historical cinema worker remains origin-locked.
- No fatal application error was found in the inspected post-deploy log window.

## CI state
- Main `ba0feced...`: Remote runtime smoke #11 green; Web smoke green.
- PR #20 pre-documentation head `51a49187205f7b1a8a4408dfb965f97efd4735b5`: Web smoke #88 green; Live provider smoke #61 green; Mobile WebKit smoke #2 green.
- Recheck all PR #20 workflows after this documentation commit before merge.

## Next run goals
1. Recheck PR #20 final-head Web smoke, Live provider smoke, and Mobile WebKit smoke; fix only on the same branch if anything regresses.
2. Merge PR #20 only when all final-head gates are green.
3. After merge, verify GitHub Pages deployment and Render deployment use the exact merge commit and rerun the deployed runtime gate.
4. Confirm the deployed GitHub Pages cinema page contains the mobile overflow fix.
5. Extend browser-level coverage to a movie details -> watch -> Player path in addition to series episodes.
6. Verify poster/title/episode-number metadata on the mobile WebKit layout with non-empty realistic fixtures.
7. Review original Basri download behavior and preserve it safely if it is exposed by the current UI contract.
8. Continue ad/pop-up/tracking/deep-link regression checks and keep Worker endpoints out of browser UI files.
9. Only after the merged/deployed WebKit gate remains green, begin Flutter as a faithful client over the proven Al-Qahtani backend for Android Mobile, Android TV and iOS, with no cross-project provider dependency.
10. Update this handoff with exact PR/commit/CI/Render/live evidence at the end of the next run.
