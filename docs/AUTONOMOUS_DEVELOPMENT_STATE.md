# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is an independent project derived from the original Al-Basri web project.
- It must not depend on `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, or any Theeb provider/search/playback API.
- The original Basri workers/contracts are the content/runtime source of truth for matches, cinema and news, with Al-Qahtani backend acting only as a secure proxy where browser exposure would be unsafe.
- The historical category URLs passed to the Basri cinema worker are part of that original Basri contract; they are not an integration with the separate `akwam-indexer` repository.

## Current state
- `main` is at `77672755fc5171e898e087297edbf8579e8719a9` after PR #15.
- PR #16 was closed without merge after the product boundary was corrected.
- Active branch: `fix/restore-basri-cinema-17`.
- The branch removes the cross-project Theeb runtime wrapper and restores cinema search/category/details/episode calls to the original Basri cinema worker contract.

## Completed in this run
- Confirmed there were no open PRs before starting the corrective branch.
- Re-read the original pre-Theeb `albasri-cinema.html` and `web/core/api-client.js`; both used the original Basri cinema worker `https://albas.albesriali03.workers.dev/` with `session`, `action=genre`, `action=search` and `action=series` contracts.
- Replaced `server/app.mjs` so cinema now uses only the Basri worker session/token flow. Tokens remain server-side and are not returned to the browser.
- Preserved the dedicated Al-Qahtani backend for CORS isolation, match proxying and Safari-compatible media proxying.
- Added opaque, short-lived backend media references so direct media URLs are not exposed to the browser; Range requests are forwarded and range/content headers are preserved.
- Simplified `server/index.mjs` to run the Basri-only backend directly.
- Removed `server/theeb-fetch.mjs` and its Theeb-specific test file.
- Updated `scripts/live_provider_smoke.mjs` so it probes only the original Basri matches/cinema/news providers.
- Updated `scripts/local_backend_smoke.mjs` to verify that search/category/details use `source: basri-worker` and that direct media remains behind `/api/cinema/media?id=...`.
- Updated Web smoke CI with a hard guard rejecting future Theeb/Akwam-project integration strings.

## Preserved behavior
- Matches remain on the original Basri match worker and keep server discovery.
- News remains on the readable Basri news worker bridge with no ad-network runtime code.
- Cinema keeps the original Basri category/search/details contract and the same category source URLs used by the original project.
- `Player.html` remains web-native and does not launch the legacy Android application package.
- No ad/pop-up/tracking runtime is reintroduced.

## Gates still required
- Open PR #17 and run Web smoke plus Live provider smoke.
- Repair any CI failure on the same branch only.
- Merge only after required PR gates are green.
- After merge, verify Render/GitHub Pages deploy the exact merge commit.
- Run deployed runtime smoke against the live site and backend: matches, news, all cinema categories, search, details, episodes, playback and Safari byte-range handling.
- Do not report success to the user until the live deployed path works.
- Flutter remains blocked until live Web parity is proven.

## Next run goals
1. Open PR #17 from `fix/restore-basri-cinema-17` and inspect every changed file for accidental Theeb references.
2. Run Web smoke and Live provider smoke; fix failures on the same branch.
3. Verify the Basri cinema session/search/category/details contracts still accept server-side Origin/Referer/X-BSR headers.
4. If a search/category returns an empty array, diagnose the Basri worker response rather than introducing another provider project.
5. Normalize any original Basri episode/result shapes that differ from the current UI contract without dropping fields.
6. Confirm direct media is proxied and Safari `Range: bytes=0-1023` returns 200/206 with useful headers.
7. Keep matches and news green as regression controls.
8. Merge only when PR gates are green, then verify exact deployment commit.
9. Run the full deployed browser/runtime gate from GitHub Pages through Render to the Basri workers.
10. Begin Flutter only after that deployed Web gate is green.
