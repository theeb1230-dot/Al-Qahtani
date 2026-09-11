# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The checked-in original archive `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployed tests are required before claiming Web parity.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs here.
- Historical `https://akwam.ss/...` links are part of the original Basri cinema content contract and are not an integration with the separate akwam-indexer repository.
- Matches/news use the original Basri workers.
- Cinema stays on the original Basri chain. The historical cinema Worker currently returns `403 FORBIDDEN_ORIGIN`; the backend uses the same original content source through a server-side compatibility fallback rather than switching provider projects.

## Current state
- PRs #17 through #37 are merged.
- Product `main` at the start of the current PR: `aa3042477b67cbf3d4e77234687962fa828bd131` (`Gate backend CORS boundary`).
- Active PR: #38 `Verify deployed trusted download titles` on `test/deployed-download-title-38`.
- No cross-project Theeb/akwam-indexer runtime dependency is present.
- Live Web parity, including playback and the recovered Basri-style download flow, remains proven through the deployed Al-Qahtani backend.

## Engineering state carried forward
- Search/category/details/episodes/playback use the original Basri chain with server-side fallback to the historical `akwam.ss` source when the origin-locked cinema Worker fails.
- Direct upstream media URLs remain hidden behind short-lived opaque `/api/cinema/media?id=...` references.
- Production opaque media references expire after 15 minutes and fail closed after expiry.
- Browser-controlled arbitrary external URLs are forbidden for playback/download.
- Safari Range handling is mandatory: proxied media preserves HTTP 206, `Content-Range`, and `Accept-Ranges: bytes`.
- `.downet.net` legacy TLS compatibility is narrowly scoped; other TLS remains strict.
- Worker/session tokens stay server-side.
- Invalid/expired references remain JSON errors and never receive download decoration.
- Original Basri movie/episode Download UX uses the same resolved media as playback, through the Al-Qahtani proxy only.
- iPhone WebKit gates cover viewport, category/search/details/episodes/movie/player navigation.
- Ads/popups/tracking and legacy Android Intent/deep-link regressions remain prohibited.

## Recent merged work
### PR #33 — trusted download filenames
Merged product change as `238f510ba3e16eabfc69b6013842bec7ba231233`.
- Download names come only from trusted Basri title metadata stored server-side inside the opaque media reference.
- Upstream media URL/path structure and browser-supplied filename data are never trusted as filename sources.
- Arabic/Unicode titles use RFC 5987 `filename*=UTF-8''...` with a bounded ASCII fallback.
- Path separators, quotes, reserved filename characters, control characters and CR/LF are removed.
- Empty/dot-only names fall back to `al-qahtani-media`; names are capped at 120 characters.
- Successful `download=1` responses get trusted `Content-Disposition` plus `X-Content-Type-Options: nosniff` only after upstream media validation.

### PR #34 — trusted filename evidence recorded
Merged as `74d58617c7fc1b86b4f78ff3793cf6d390f11df8`. Main push gates were green, including Web smoke, Mobile WebKit, Remote runtime, Remote movie playback, Original Basri download contract, Media reference expiry, Trusted download filename, and GitHub Pages deployment.

### PR #36 — original player contract proven
Merged as `32f7dfb1b57727a829bc2deb4732816818a8914d`.
- `scripts/original_player_contract.py` reads `Player.html` and `bsr-Player.html` directly from the preserved original ZIP.
- CI proved both original players accept `url`, `title`, and `live` context but have no player-level Download UI/contract: no Arabic Download label, HTML `download` attribute, `download=1` behavior, `download_options`, or `Content-Disposition` handling.
- Therefore current `Player.html` must not invent a Download control; the original Download action belongs to the cinema details/episode flow already restored through the opaque backend media reference.
- The legacy original player contained application handoff material; the cleaned current product must not reintroduce Intent/deep-link behavior.

### PR #37 — backend CORS boundary
Merged as `aa3042477b67cbf3d4e77234687962fa828bd131`.
- Added `scripts/cors_boundary_test.mjs` and `.github/workflows/cors-boundary.yml`.
- Exact allowed origin `https://theeb1230-dot.github.io` receives the CORS grant while credentialed CORS remains disabled.
- Arbitrary, lookalike, and `Origin: null` requests receive no `Access-Control-Allow-Origin` on health success, preflight, media/download errors, and generic 404s.
- Invalid media/download references remain JSON and never gain `Content-Disposition` or download-only headers.
- Final PR head passed CORS boundary, Web smoke, Live provider, Mobile WebKit, Remote movie playback, Original Basri player/download contracts, Media reference expiry, and Trusted download filename gates before merge.

## Active PR #38 — live trusted download title evidence
Branch: `test/deployed-download-title-38`.

Changes:
- `scripts/remote_movie_playback_smoke.mjs` now derives the expected `Content-Disposition` from the trusted Basri movie title using the same server filename contract and requires an exact deployed/candidate match.
- The movie download header must be `attachment`, CR/LF-safe, bounded to a defensive header-size ceiling, `nosniff`, and compatible with the existing bounded Range probe.
- `scripts/remote_runtime_smoke.mjs` now applies the same trusted-title assertion to a real series episode after main is deployed to Render, proving the episode media reference retained the trusted title through the deployed backend.
- Initial PR head `628837678b787b522e24aa9b12cf3bbbcdf7b594` passed Remote movie playback smoke run `34632555979`, proving a real movie candidate produced the exact trusted-title `Content-Disposition`. The same head also passed Web smoke, Live provider smoke, CORS boundary, Original Basri player contract, Original Basri download contract, Media reference expiry, Trusted download filename, and Mobile WebKit.
- Post-merge `Remote runtime smoke` is the required final deployed episode-title proof because that workflow runs only on `main` after the Render auto-deploy wait.

## Proven live Web parity
The deployed path has proven:
- backend health;
- matches and Basri news;
- Arabic search;
- all 12 visible cinema categories;
- series details and episodes;
- direct movie details;
- series and movie playback through the Al-Qahtani media proxy;
- Safari HTTP byte-range handling;
- iPhone WebKit series/movie navigation and viewport gates;
- original Basri-style movie/episode Download UX through an opaque Al-Qahtani proxy reference;
- bounded deployed download bytes with attachment and nosniff headers.

## Security and regression boundaries
- Source/media host allowlists and SSRF protections remain in force.
- Direct media URLs stay hidden.
- Opaque references expire and fail closed.
- Trusted download filenames are metadata-bound and sanitized server-side.
- Rejected media/download requests must not gain download headers.
- CORS grants are exact-origin only; lookalike, `null`, and arbitrary origins must remain browser-inaccessible.
- Credentialed CORS remains disabled.
- Safari Range forwarding remains active.
- Player-level Download controls must not be invented absent original baseline evidence.
- Legacy Android Intent/deep-link behavior must not be reintroduced.
- No Theeb/akwam-indexer provider dependency may be introduced.

## Render evidence and limitation
- External deployed-runtime tests target `https://al-qahtani-api.onrender.com` and prove live behavior after the workflow's Render auto-deploy wait.
- Direct Render workspace inspection is intentionally not claimed. The connector exposes `My Workspace` and `بيانات` with no selected workspace; autonomous execution must not guess which owns Al-Qahtani.

## Next run goals
1. Finish PR #38 only after all current-head gates are green; merge it before opening any new PR.
2. Require post-merge Remote runtime smoke to prove a real deployed episode download uses the exact trusted Basri title and remains CR/LF-safe/bounded.
3. Inspect parser drift and provider health for current Basri HTML without changing provider projects.
4. Preserve all search/category/details/series/movie/playback/download/Safari Range/iPhone WebKit/CORS gates during hardening.
5. Consider a low-traffic deployed negative-CORS probe only if it adds evidence beyond the deterministic local gate without stressing providers.
6. Keep current `Player.html` web-native and free of legacy Intent/deep-link behavior; do not add a player Download control absent original evidence.
7. Begin Flutter only as a faithful client over the proven Al-Qahtani backend; do not introduce Theeb/akwam-indexer dependencies.
8. Migrate Flutter flows incrementally with parity gates rather than rewriting the product wholesale.
9. Preserve Android Mobile, Android TV D-Pad/remote, and iOS constraints.
10. Continue security/performance/maintenance work after stable releases; GitHub and deployed tests remain source of truth over this handoff.
