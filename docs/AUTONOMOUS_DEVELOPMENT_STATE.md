# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The checked-in original archive `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployed tests are required before claiming parity.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs here.
- Historical `https://akwam.ss/...` links are part of the original Basri content contract, not an integration with the separate akwam-indexer repository.
- Matches/news use original Basri workers; cinema remains on the original Basri chain with server-side compatibility fallback to the historical source when the origin-locked cinema Worker returns `403 FORBIDDEN_ORIGIN`.

## Current state
- PRs #17 through #40 are merged.
- Product `main`: `d44b8a81d60b69d3330d90c6b2cfd3051c52fd99` (`Verify deployed CORS boundary`).
- Active PR: #41 `Record deployed CORS and parser evidence` on `docs/deployed-cors-evidence-41`.
- No cross-project Theeb/akwam-indexer runtime dependency is present.
- Live Web parity remains proven through the deployed Al-Qahtani backend.

## Proven engineering boundaries
- Search/category/details/episodes/playback use the original Basri chain.
- Direct upstream media URLs stay hidden behind short-lived opaque `/api/cinema/media?id=...` references.
- Opaque references expire after 15 minutes and fail closed.
- Source/media host allowlists and SSRF protections remain in force.
- Safari Range proxying preserves HTTP 206, `Content-Range`, and `Accept-Ranges: bytes`.
- `.downet.net` legacy TLS compatibility is narrowly scoped.
- Invalid/expired references remain JSON errors and never gain download decoration.
- Trusted download filenames come only from sanitized Basri title metadata stored with the server-side media reference.
- iPhone WebKit gates cover viewport, category/search/details/episodes/movie/player navigation.
- Ads/popups/tracking and legacy Android Intent/deep-link regressions remain prohibited.
- Current `Player.html` must not invent a Download control: the original ZIP evidence proves Download belonged to cinema details/episode flow, not the player itself.

## Recent merged work
### PR #36 — original player contract
Merged as `32f7dfb1b57727a829bc2deb4732816818a8914d`.
- CI reads original `Player.html` and `bsr-Player.html` from the preserved ZIP.
- Both original players accept `url`, `title`, and `live` but have no player-level Download UI/contract.
- Legacy application handoff material from the original player must not be reintroduced.

### PR #37 — deterministic CORS boundary
Merged as `aa3042477b67cbf3d4e77234687962fa828bd131`.
- Only exact origin `https://theeb1230-dot.github.io` receives ACAO; credentialed CORS remains disabled.
- Arbitrary, lookalike, and `Origin: null` requests receive no ACAO on health success, preflight, media/download errors, or generic 404s.
- Rejected media/download references remain JSON without attachment/download-only headers.

### PR #38 — deployed trusted download titles
Merged as `ac9aab5dc911f6f4c78e56f9a33fc754588ec360`.
- Real movie and episode downloads must produce `Content-Disposition` exactly from trusted Basri title metadata, remain CR/LF-safe and bounded, preserve `nosniff`, and keep Range behavior.
- One final-head Live provider failure was an upstream media HTTP 500; rerunning only the failed workflow without code changes succeeded, proving a transient upstream failure rather than a regression.

### PR #39 — deployed trusted-title evidence recorded
Merged as `fa70d4145cacc7766cb3f8f0649c69744f324753`.
- Remote runtime run `34632926737` proved a deployed episode `1 - Tracker الموسم الثالث` returned HTTP 206 with exact trusted-title `Content-Disposition`, `nosniff`, CR/LF safety, and bounded header length.
- Remote movie run `34632926827` proved the same class of behavior for a real deployed movie.
- The same live runtime run proved all six series and six movie categories return real items and open details.

### PR #40 — deployed CORS boundary
Merged as `d44b8a81d60b69d3330d90c6b2cfd3051c52fd99`.
- Added `scripts/remote_cors_smoke.mjs` and `.github/workflows/remote-cors-smoke.yml`.
- PR candidate run `34633317917` passed before merge.
- Post-merge deployed run `34633434822` passed after the Render auto-deploy wait against `https://al-qahtani-api.onrender.com`.
- Deployed health returns exact ACAO only for `https://theeb1230-dot.github.io`, with `Vary: Origin` and no credentialed CORS.
- `https://evil.example`, the lookalike `https://theeb1230-dot.github.io.evil.example`, and `Origin: null` receive no ACAO.
- Rejected preflight receives no ACAO; allowed preflight returns exact ACAO and allows the `Range` request header.
- Rejected invalid media/download references remain 404 JSON `MEDIA_REFERENCE_EXPIRED`, with no ACAO, no `Content-Disposition`, and no download-only `nosniff` decoration.
- Allowed-origin invalid media still receives the legitimate ACAO grant but no attachment header.
- The deployed CORS smoke deliberately does not touch Basri content providers.

## Parser drift inspection
- Current `server/basri-source.mjs` still parses catalog cards, series/movie details, episode watch/download links, and watch-page media with the strict historical source/media allowlists.
- No concrete parser drift was found in this run. The deployed runtime immediately before this inspection successfully parsed search, all 12 visible categories, series episodes, movie details, and real playback from the current Basri HTML.
- Therefore no speculative regex/parser rewrite was made. Parser changes require demonstrated drift or failing live evidence, not aesthetic preference.

## Proven live Web parity
The deployed path has proven:
- backend health;
- matches and Basri news;
- Arabic search;
- all 12 visible cinema categories;
- series details and episodes;
- direct movie details;
- series and movie playback through the Al-Qahtani media proxy;
- Safari byte-range handling;
- iPhone WebKit series/movie navigation and viewport behavior;
- original Basri-style movie/episode Download UX through opaque Al-Qahtani media references;
- trusted Arabic/Unicode download filenames derived from Basri metadata;
- exact deployed CORS behavior for allowed and rejected origins.

## Render evidence and limitation
- External deployed-runtime tests target `https://al-qahtani-api.onrender.com` and prove behavior after workflow auto-deploy waits.
- Direct Render workspace inspection is intentionally not claimed. The connector exposes both `My Workspace` and `بيانات` with no selected workspace; autonomous execution must not guess which owns Al-Qahtani.

## Flutter readiness
- Web parity is now sufficiently proven to begin Flutter incrementally.
- Repository code search currently finds no existing Flutter scaffold (`pubspec.yaml` / Flutter `lib/` app) on `main`; do not pretend one exists or wholesale rewrite the project blindly.
- Flutter must be introduced as a faithful client over the proven Al-Qahtani backend, preserving Android Mobile, Android TV D-Pad/remote, and iOS behavior without Theeb/akwam-indexer dependencies.

## Next run goals
1. Finish PR #41 and merge only after all gates are green.
2. Re-inspect repository tree for any historical Flutter scaffold or mobile assets before creating new Flutter files.
3. If none exists, introduce the smallest Flutter foundation that preserves the existing product boundary and consumes only the Al-Qahtani backend contract.
4. Start with shared API/domain models and navigation rather than duplicating provider scraping inside Flutter.
5. Preserve Arabic/RTL and map the proven Web sections without dropping matches, news, cinema search/categories/details/episodes/playback/download.
6. Keep Android TV as a first-class target with D-Pad/focus semantics from the start.
7. Keep iOS media playback/download constraints aligned with the proven Safari/backend Range contract.
8. Add Flutter analyze/test/build gates before claiming mobile parity.
9. Continue parser/provider-health maintenance without speculative source changes.
10. Treat GitHub state, the preserved Basri archive, and deployed runtime tests as authoritative over this handoff.
