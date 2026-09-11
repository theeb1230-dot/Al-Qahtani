# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs in this project.
- The original Basri project behavior is the compatibility baseline.
- Matches/news continue to use the original Basri workers.
- Cinema keeps the original Basri content chain. The historical cinema worker currently returns `403 FORBIDDEN_ORIGIN` even for the original Basri origin, so the backend uses a server-side direct compatibility fallback for the same original chain while keeping source/media URLs behind Al-Qahtani.

## Current state
- `main` is still `77672755fc5171e898e087297edbf8579e8719a9` until PR #17 is merged.
- Active PR: #17 `Restore original Basri cinema runtime`.
- Active branch: `fix/restore-basri-cinema-17`.
- Current branch head before this handoff update: `a88cb2500fa1f38214b656378b2089428416736a`.

## Root causes established
- Matches provider is healthy and returns live match data.
- News provider is healthy.
- The legacy cinema worker `https://albas.albesriali03.workers.dev/` returns `403 FORBIDDEN_ORIGIN` for the historical Basri origin.
- The underlying original cinema source chain remains reachable server-side: category -> search -> series details -> episodes -> watch -> media.
- Arabic slugs caused raw non-ASCII Referer values that Node rejected; Referers are now percent-encoded.
- The resolved legacy media host has an incomplete TLS certificate chain (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`). Browser-facing media therefore remains behind Al-Qahtani. The proxy first uses normal certificate verification and only retries with broken-chain compatibility for the already allowlisted `.downet.net` media host and only for known certificate-chain errors. All other upstream TLS verification remains strict.

## Completed on PR #17
- Removed cross-project Theeb/akwam-indexer runtime integration.
- Restored the original Basri product boundary and same-source cinema behavior.
- Added strict source/media host allowlisting.
- Added server-side fallback for category, search, details, episodes and watch resolution when the historical cinema worker is forbidden/errors/returns empty.
- Kept worker/session handling server-side.
- Preserved opaque short-lived `/api/cinema/media?id=...` references so direct media URLs stay out of the browser UI.
- Preserved CORS and Safari byte-range semantics.
- Added real-data live probes that reject `200 + []` as success for populated category paths.
- Verified live source chain reaches real content, details, episodes, watch page and a real media source.
- Added local backend E2E through proxied playback.
- Added scoped TLS compatibility for the legacy allowlisted media host.
- Verified Safari-style `Range: bytes=0-1023` returns HTTP 206 through the Al-Qahtani proxy with `Content-Range: bytes 0-1023/350455536` and `Accept-Ranges: bytes`.
- Search fallback returned 4 real results in the latest local E2E run.
- Category fallback returned 24 real items.
- Details fallback returned real episodes (14 in the selected E2E candidate); the independent direct source probe also confirmed another series with 7 episodes.
- Matches remained healthy with 8 live entries in the same CI run.
- News JSON endpoint remained healthy.

## Current CI state
- Web smoke run #80: SUCCESS on PR #17 head `a88cb2500fa1f38214b656378b2089428416736a`.
- Live provider smoke run #56: SUCCESS on the same head.
- Live provider smoke confirmed category/search/details/episode/watch/media resolution and did not hide the upstream certificate defect.
- Local backend E2E confirmed the compatibility proxy returns a real 206 byte range rather than merely returning a media URL.

## Render state
- Production service: `al-qahtani-api` (`srv-dagunkmq1p3s73919jn0`) on Render Frankfurt, auto-deploy enabled from `main`.
- Current live deploy before PR #17 merge is still main commit `77672755fc5171e898e087297edbf8579e8719a9`.
- Do not claim deployed Web parity until PR #17 is merged, Render reports the exact merge commit live, and remote smoke passes against the deployed endpoint/site.

## Required gate after merge
1. Confirm Render deploys the exact merged main commit.
2. Run deployed remote smoke through GitHub Pages/Render.
3. Verify search produces real results.
4. Verify every visible movie/series category returns cards.
5. Verify details and episode lists.
6. Verify real playback through `/api/cinema/media` with Safari Range semantics.
7. Verify matches and news again after deploy.
8. Compare the deployed UI against the iPhone Safari regression symptoms.
9. Keep Flutter blocked until deployed Web parity is proven.

## Next run goals
1. Merge PR #17 now that both current-head workflows are green.
2. Confirm the exact merge SHA on `main`.
3. Wait for/inspect Render auto-deploy and logs for that exact SHA.
4. Run remote `/health`, matches, cinema search and all visible categories.
5. Open representative movie and series details remotely.
6. Resolve an episode remotely and test `Range: bytes=0-1023` through the deployed proxy.
7. Verify news remotely.
8. Verify GitHub Pages browser configuration targets the Al-Qahtani backend only and contains no Theeb integration.
9. Fix any deployed-only regression on one PR at a time.
10. Start Flutter only after deployed Web parity is green.
