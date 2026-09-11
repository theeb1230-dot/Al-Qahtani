# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- The original Basri project behavior is the compatibility baseline.
- Matches/news continue to use the original Basri workers.
- Cinema keeps the original Basri category URLs and content behavior, but the legacy cinema worker is currently returning `403 FORBIDDEN_ORIGIN` even for the historical Basri origins. Because the underlying original source remains reachable, the Al-Qahtani backend now has a bounded server-side direct fallback that reproduces the original category/search/details/episode/watch chain without exposing source URLs or media URLs to the browser.

## Current state
- `main` remains at `77672755fc5171e898e087297edbf8579e8719a9` while PR #17 is under repair.
- Active PR: #17 `Restore original Basri cinema runtime`.
- Active branch: `fix/restore-basri-cinema-17`.
- Latest branch work adds direct Basri-source fallback plus CI/runtime probes. Merge is still blocked until both Web smoke and Live provider smoke are green.

## Root cause established
- Matches provider is healthy and returns live match data.
- News provider is healthy.
- The legacy cinema worker `https://albas.albesriali03.workers.dev/` returns `403 FORBIDDEN_ORIGIN` for both historical Basri origins, including the exact host hard-coded in the original archive.
- Direct requests to the original cinema source category are healthy. The live CI probe fetched the foreign-series category successfully, found real content cards, loaded a series details page, discovered seven episodes, loaded an episode, discovered its watch URL, and resolved a real media source.
- A second defect was found while validating Arabic episode paths: Node/undici rejects raw non-ASCII `Referer` header values. Referers are now canonicalized/percent-encoded before server-side requests.

## Completed on PR #17
- Removed the cross-project Theeb runtime integration.
- Restored the original Basri product boundary.
- Added `server/basri-source.mjs` with strict allowlisting for `akwam.ss` and `.downet.net` media only.
- Added server-side fallback for category, search, details, episodes and watch resolution when the legacy cinema worker is forbidden, errors, or returns an empty result.
- Preserved opaque short-lived `/api/cinema/media?id=...` references so direct media URLs stay out of the browser UI.
- Preserved CORS controls and Safari-style byte-range forwarding.
- Added validation that the original source category is genuinely populated instead of accepting `200 + []` as success.
- Added a live chain probe: category -> details -> episode -> watch -> media.
- Added local backend E2E coverage for category -> details -> episode -> proxied playback -> Range request.
- Fixed non-ASCII Referer handling for Arabic paths.
- Web smoke remains green on the repaired architecture.

## Current CI state
- Web smoke has been green on the recent PR revisions.
- The previous Live provider smoke failure was caused by the raw Arabic Referer ByteString exception after the direct chain had already passed category/details/episode discovery. That defect is fixed on the latest branch revision.
- A fresh CI run is required on the current head before merging.

## Required gate before merge
1. Web smoke green on current head.
2. Live provider smoke green on current head, including direct category/details/episode/watch/media and local backend E2E.
3. No regression in matches/news.
4. Merge PR #17 only after both workflows are green.
5. Verify Render deploys the exact merged commit.
6. Run deployed remote runtime smoke through GitHub Pages/Render, including all visible cinema categories, search, details, episodes, playback, and `Range: bytes=0-1023`.
7. Keep Flutter blocked until deployed Web parity is proven.

## Next run goals
1. Inspect the fresh CI runs for the latest PR #17 head.
2. Fix any remaining live/local smoke failure on the same branch only.
3. Confirm direct search parsing returns real results for known queries where the source has matches, without treating empty as a healthy terminal result.
4. Confirm every visible movie/series category returns cards through the backend fallback.
5. Confirm series details preserve title/poster/episode numbering.
6. Confirm episode playback resolves media and the proxy handles Safari Range correctly.
7. Merge PR #17 only after all required checks are green.
8. Verify exact Render deployment commit after merge.
9. Run remote deployed smoke and compare against the iPhone Safari regression symptoms.
10. Start Flutter work only after deployed Web parity is green.
