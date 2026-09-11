# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The checked-in original archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs here.
- Historical `https://akwam.ss/...` links are part of the original Basri cinema content contract and are not an integration with the separate akwam-indexer repository.
- Matches/news use the original Basri workers.
- Cinema remains on the original Basri chain. The historical cinema Worker currently returns `403 FORBIDDEN_ORIGIN`; the backend therefore uses the same original content source through a server-side compatibility fallback rather than changing provider projects.

## Current state
- PRs #17 through #26 are merged.
- Current `main` before PR #27: `9196676cafbf22ef8e1f655db3e134989b3e3d5a`.
- Active PR #27: `Restore original Basri download UX safely` on `feat/restore-safe-download-27`.
- No cross-project Theeb/akwam-indexer runtime dependency is present.

## PR #25: bounded series playback recovery
PR #25 was squash-merged as `7af710d0c07507e55014b150e61278f3c49a7cdf`. Deployed series playback smoke now tries at most three playable episode candidates with 45-second bounds instead of failing the deployment because one upstream episode timed out. It still fails if none produce a real proxied source and still requires `/api/cinema/media?id=...`, Safari `206`, `Content-Range`, and `Accept-Ranges: bytes`. Post-merge remote runtime passed against `https://al-qahtani-api.onrender.com`.

## PR #26: original Basri download contract recovered
PR #26 was squash-merged as `9196676cafbf22ef8e1f655db3e134989b3e3d5a` after all gates passed. `scripts/original_download_contract.py` and `.github/workflows/original-download-contract.yml` now read the checked-in baseline archive directly and protect the recovered behavior.

Recovered original behavior:
- episode choice offers both `مشاهدة` and `تحميل`;
- `prepareEpisodeChoice(ep)` resolves the selected episode first and only enables Download when `media_src` exists;
- `downloadChosenEpisode()` assigns the resolved `media_src` and calls `startDownload()`;
- `setupPlayer(data)` also uses the same resolved `media_src` as the downloadable resource;
- `startDownload()` calls optional `window.Android.downloadFile(...)` when available, otherwise clicks a temporary `<a download>` element.

Therefore the historical Basri UI did not require a separate static download provider contract. Playback media itself is the download resource.

## PR #27: safe restoration of the original download UX
PR #27 restores the original semantics without re-exposing upstream media URLs:
- `albasri-cinema.html` now shows Watch/Download choices after an episode is resolved;
- direct movies show Download beside Watch when a safe `media_path` exists;
- the browser accepts only `media_path` values beginning with `/api/cinema/media?id=`;
- download uses the same short-lived Al-Qahtani media reference plus `download=1`;
- optional `window.Android.downloadFile()` receives only the Al-Qahtani proxy URL;
- normal web download uses a temporary `<a download>` pointing only at the Al-Qahtani proxy URL;
- `server/index.mjs` marks `download=1` media responses with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff` before delegating to the existing range-aware media proxy;
- raw `akwam.ss` / `downet.net` media URLs remain hidden.

Regression gates added/extended:
- `scripts/mobile_webkit_smoke.mjs` proves episode and movie Download buttons on iPhone WebKit, captures the Android bridge target, and rejects upstream-host leakage;
- `scripts/local_backend_smoke.mjs` verifies bounded download bytes, attachment disposition, and `nosniff` through the same opaque media reference;
- `scripts/remote_movie_playback_smoke.mjs` now verifies a real movie download by fetching only `bytes=0-1023` through `download=1`.

Evidence on PR #27 head `c62d1c84b39c43c80d7c655d903c1a2e91c4514e` before this documentation commit:
- Web smoke run `34615886598`: success.
- Live provider smoke run `34615886548`: success, including local backend download attachment contract.
- Original Basri download contract run `34615886517`: success.
- Mobile WebKit smoke run `34615886592`: success.
- Remote movie playback run `34615886499`: success against the PR candidate backend.
- Real candidate movie `The Beloved` resolved from `basri-direct` with media path `/api/cinema/media?id=...` and zero fabricated episodes.
- Safari media probe returned `206`, `Content-Range: bytes 0-1023/1147681720`, `Accept-Ranges: bytes`.
- Safe download probe returned `206`, `Content-Disposition: attachment; filename="al-qahtani-media"`, `X-Content-Type-Options: nosniff`, and the same bounded `Content-Range` through `/api/cinema/media?id=...&download=1`.

All final-head gates must pass again after this documentation commit before PR #27 can be merged.

## Proven live Web parity
The deployed path has already proven backend health, matches, Basri news, Arabic search, all 12 visible cinema categories, series details/episodes, direct movie details, series and movie playback through the Al-Qahtani media proxy, Safari byte ranges, and iPhone WebKit series/movie navigation. PR #27 must additionally prove the download path after merge and Render auto-deploy before download parity is declared live.

## Security and regression boundaries
- Direct upstream media URLs stay hidden behind short-lived backend references.
- Browser-controlled arbitrary external URLs are forbidden for playback/download.
- Source/media host allowlists and SSRF protections remain in force.
- Worker/session tokens stay server-side.
- CORS and Safari Range forwarding remain active.
- `.downet.net` legacy TLS compatibility stays narrowly scoped; other TLS remains strict.
- Ad/pop-up/tracking and legacy Android Intent/deep-link regressions remain prohibited.

## Render evidence and limitation
- External deployed-runtime tests target `https://al-qahtani-api.onrender.com` and provide live behavior evidence.
- The Render connector has no selected workspace and explicitly forbids guessing one, so no direct deployment-ID/log claim is made from the connector until a workspace is explicitly selected by the user.

## Next run goals
1. Require all final-head PR #27 gates to pass, then squash-merge PR #27.
2. Wait for Render/GitHub Pages on the merge commit and require the push-triggered Remote movie playback smoke to prove live `download=1` bounded bytes plus attachment/nosniff headers.
3. Require post-merge Remote runtime, Web smoke, Mobile WebKit, Original Basri download contract, and Pages deployment to remain green.
4. Add negative backend tests for invalid/expired media references on the download path, ensuring no arbitrary URL or host can be injected.
5. Improve download filename metadata only if it can be derived safely without exposing upstream URLs or weakening Content-Disposition controls.
6. Inspect Player.html against the recovered original baseline and decide whether the player-level Download action also needs restoration without duplicating unsafe raw-media behavior.
7. Preserve all category/search/details/series/movie/playback/Safari Range gates while download work continues.
8. Begin Flutter only after the deployed Web download path is proven, using the Al-Qahtani backend as the sole app-facing runtime surface.
9. Preserve Android Mobile, Android TV D-Pad/remote, and iOS behavior without Theeb/akwam-indexer provider dependencies.
10. Continue maintenance after stability: parser drift, provider health, security, performance, and regressions.
