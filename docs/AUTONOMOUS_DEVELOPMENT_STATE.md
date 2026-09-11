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
- PRs #17 through #38 are merged.
- Product `main`: `ac9aab5dc911f6f4c78e56f9a33fc754588ec360` (`Verify deployed trusted download titles`).
- Active PR: #39 `Record deployed trusted title evidence` on `docs/postmerge-evidence-39`.
- No cross-project Theeb/akwam-indexer runtime dependency is present.
- Live Web parity remains proven through the deployed Al-Qahtani backend.

## Engineering state
- Search/category/details/episodes/playback use the original Basri chain with server-side fallback to historical `akwam.ss` pages when the origin-locked cinema Worker fails.
- Direct upstream media URLs stay hidden behind short-lived opaque `/api/cinema/media?id=...` references.
- Opaque media references expire after 15 minutes and fail closed.
- Source/media host allowlists and SSRF protections remain in force.
- Safari Range proxying preserves HTTP 206, `Content-Range`, and `Accept-Ranges: bytes`.
- `.downet.net` legacy TLS compatibility is narrowly scoped; all unrelated TLS remains strict.
- Invalid/expired references remain JSON errors and never gain download decoration.
- Trusted download filenames come only from sanitized Basri title metadata stored with the server-side media reference.
- iPhone WebKit gates cover viewport, category/search/details/episodes/movie/player navigation.
- Ads/popups/tracking and legacy Android Intent/deep-link regressions remain prohibited.

## Recent merged work
### PR #36 — original player contract proven
Merged as `32f7dfb1b57727a829bc2deb4732816818a8914d`.
- `scripts/original_player_contract.py` reads `Player.html` and `bsr-Player.html` directly from the preserved original ZIP.
- CI proved both original players accept `url`, `title`, and `live` context but have no player-level Download UI/contract: no Arabic Download label, HTML `download` attribute, `download=1` behavior, `download_options`, or `Content-Disposition` handling.
- Current `Player.html` therefore must not invent a Download control; Download belongs to the cinema details/episode flow already restored through the opaque media reference.
- The cleaned product must not reintroduce legacy application Intent/deep-link behavior from the old Basri player.

### PR #37 — backend CORS boundary
Merged as `aa3042477b67cbf3d4e77234687962fa828bd131`.
- Added deterministic exact-origin CORS tests.
- Only `https://theeb1230-dot.github.io` receives an ACAO grant; credentialed CORS remains disabled.
- Arbitrary, lookalike, and `Origin: null` requests receive no ACAO on health success, preflight, media/download errors, or generic 404s.
- Rejected media/download references remain JSON without `Content-Disposition` or download-only MIME headers.

### PR #38 — deployed trusted download titles
Merged as `ac9aab5dc911f6f4c78e56f9a33fc754588ec360`.
- `scripts/remote_movie_playback_smoke.mjs` requires a real movie download `Content-Disposition` to exactly equal the server contract derived from the trusted Basri movie title, remain CR/LF-safe and bounded, preserve `nosniff`, and keep Range behavior.
- `scripts/remote_runtime_smoke.mjs` applies the same trusted-title assertion to a real series episode after Render auto-deploy.
- Final PR head initially had one Live provider smoke failure caused by the media upstream returning HTTP 500 during the local proxy Range/download step. The direct Basri chain and every unrelated gate passed; rerunning only the failed workflow without changing code succeeded completely, confirming a transient upstream/media failure rather than a regression.
- PR #38 was merged only after the rerun and all final-head gates were green.

## Post-merge deployed evidence for PR #38
Main push `ac9aab5dc911f6f4c78e56f9a33fc754588ec360` proved the change against the deployed backend at `https://al-qahtani-api.onrender.com`.

### Remote movie playback
- Run `34632926827` completed successfully after the Render auto-deploy wait.
- Real deployed movie playback, Safari Range, and trusted-title download header assertions passed.

### Remote runtime / real episode title
- Run `34632926737` completed successfully after the Render auto-deploy wait.
- Search `الذئب الوحيد` returned real items through `basri-direct`.
- Series details opened `Tracker الموسم الثالث` with 14 episodes.
- A real episode resolved to an opaque `/api/cinema/media?id=...` reference.
- Safari Range returned HTTP `206`, `Content-Range: bytes 0-1023/350455536`, and `Accept-Ranges: bytes`.
- A bounded deployed episode download returned HTTP `206` and `nosniff`.
- Trusted episode title: `1 - Tracker الموسم الثالث`.
- Actual `Content-Disposition` exactly matched the trusted-title contract: `attachment; filename="1 - Tracker"; filename*=UTF-8''1%20-%20Tracker%20%D8%A7%D9%84%D9%85%D9%88%D8%B3%D9%85%20%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB`.
- The deployed header was CR/LF-safe and bounded to 146 characters.
- All six series and six movie categories returned real items and opened details successfully in the same deployed run.

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
- original Basri-style movie/episode Download UX through opaque Al-Qahtani media references;
- trusted Arabic/Unicode `Content-Disposition` derived from Basri metadata on real deployed movie/episode downloads;
- CR/LF-safe bounded download headers with `nosniff`.

## Security and regression boundaries
- Direct media URLs stay hidden.
- Browser-controlled arbitrary external media URLs remain forbidden.
- Opaque references expire and fail closed.
- Trusted download filenames are metadata-bound and sanitized server-side.
- Rejected media/download requests must not gain download headers.
- CORS grants are exact-origin only; lookalike, `null`, and arbitrary origins remain browser-inaccessible.
- Credentialed CORS remains disabled.
- Safari Range forwarding remains active.
- Player-level Download controls must not be invented absent original baseline evidence.
- Legacy Android Intent/deep-link behavior must not be reintroduced.
- No Theeb/akwam-indexer provider dependency may be introduced.

## Render evidence and limitation
- External deployed-runtime tests target `https://al-qahtani-api.onrender.com` and prove live behavior after workflow auto-deploy waits.
- Direct Render workspace inspection is intentionally not claimed. The connector exposes `My Workspace` and `بيانات` with no selected workspace; autonomous execution must not guess which owns Al-Qahtani.

## Next run goals
1. Finish PR #39 and merge only after its gates are green.
2. Inspect current Basri HTML/parser drift with bounded live samples; strengthen parsing only if concrete drift is demonstrated.
3. Preserve all search/category/details/series/movie/playback/download/Safari Range/iPhone WebKit/CORS gates during parser hardening.
4. Add low-traffic deployed negative-CORS evidence only if it contributes beyond deterministic local tests without touching providers unnecessarily.
5. Keep `Player.html` web-native and free of legacy Intent/deep-link behavior; do not add a player Download control absent baseline evidence.
6. Begin Flutter only as a faithful client over the proven Al-Qahtani backend; do not introduce Theeb/akwam-indexer dependencies.
7. Migrate Flutter flows incrementally with parity gates rather than rewriting the product wholesale.
8. Preserve Android Mobile, Android TV D-Pad/remote, and iOS constraints.
9. Continue security/performance/provider-health maintenance after stable releases.
10. Treat GitHub state, the preserved Basri archive, and deployed runtime tests as authoritative over this handoff.
