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
- PRs #17 through #34 and #36 through #40 are merged. PR #35 remains the single active PR because it was opened earlier and must be completed before any new PR.
- Product `main`: `d44b8a81d60b69d3330d90c6b2cfd3051c52fd99` (`Verify deployed CORS boundary`).
- Active PR: #35 `Harden Basri live smoke reliability` on `fix/player-safe-download-35`.
- PR #35 has been reconciled with current `main`; the old base `74d58617...` is no longer treated as authoritative.
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

## Original player contract
PR #36 (`32f7dfb1b57727a829bc2deb4732816818a8914d`) permanently proved from the preserved original ZIP that `Player.html` and `bsr-Player.html` have no player-level Download UI/contract. Download belongs to the cinema details/episode flow. During PR #35 an experimental player Download control was started before this newer baseline evidence landed on `main`; it was then explicitly removed from PR #35 after reconciling with current `main`. The final PR #35 diff does not invent a player Download control.

## PR #35 — Basri smoke reliability hardening
### Root failures observed
1. Earlier PR head `1d5678abf9b855ce3438645089ca1c514ba83f0e` had a Live provider smoke failure after a real episode resolved to an opaque media reference but the first selected upstream media returned HTTP 500 for Range/download. Direct Basri search/category/details/watch checks and unrelated gates still passed.
2. A rerun failed the same brittle first-episode assumption, showing the local smoke needed the same bounded candidate strategy already used by deployed runtime testing.
3. After PR #40 landed on `main`, Remote CORS smoke initially failed with `ECONNREFUSED 127.0.0.1:3139`. The backend log showed `Al-Qahtani backend listening on 3139` immediately after the probe failed, proving a startup race rather than a CORS regression.

### Fixes
- `scripts/local_backend_smoke.mjs` now tries at most three playable episode candidates sequentially. Each candidate still must resolve through `/api/cinema/media?id=...`, pass Safari Range with HTTP 200/206, and pass the safe download attachment/nosniff contract. The smoke still fails if no bounded candidate works.
- `.github/workflows/remote-cors-smoke.yml` now waits for the candidate backend `/health` endpoint before running the CORS probe, eliminating the startup race.
- The PR was merged/reconciled with current `main` so PR #36-#40 work is preserved.
- The experimental player Download UI and its guard test were removed after original-archive evidence showed that behavior did not belong in the player.

### Verified pre-documentation head
Head `cb5a48a6d17361f1de88a2d1d7efbcc563c2829b` produced:
- Live provider smoke run `34634713991`: success.
- Remote CORS smoke run `34634713934`: success.
- Web smoke run `34634714008`: success.
- Remote movie playback smoke run `34634714028`: success.
- Original Basri player contract run `34634713968`: success.
- Original Basri download contract run `34634714006`: success.
- CORS boundary run `34634713983`: success.
- Trusted download filename run `34634713980`: success.
- Media reference expiry run `34634714019`: success.
- Mobile WebKit run `34634714011` was still executing when this handoff update was written; the final documentation-only head must run the full gate set again before merge.

## Recent merged work
### PR #38 — deployed trusted download titles
Merged as `ac9aab5dc911f6f4c78e56f9a33fc754588ec360`. Real movie/episode deployed tests require `Content-Disposition` derived exactly from trusted Basri title metadata, bounded and CR/LF-safe, with `nosniff` and Safari Range preserved.

### PR #39 — deployed title evidence
Merged as `fa70d4145cacc7766cb3f8f0649c69744f324753`. Records successful deployed movie/episode trusted-title evidence and all 12 cinema category parity.

### PR #40 — deployed CORS boundary
Merged as `d44b8a81d60b69d3330d90c6b2cfd3051c52fd99`. Adds low-traffic candidate/deployed CORS smoke without contacting Basri content providers. Exact GitHub Pages origin receives CORS; arbitrary/lookalike/null origins do not. Rejected media/download errors remain JSON without attachment decoration and allowed Range preflight is preserved.

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
- exact-origin CORS boundaries.

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
- Direct Render workspace inspection is not claimed in this run. `Render.list_services` returned `no workspace selected` and explicitly requires user confirmation after listing workspaces; autonomous execution must not guess the workspace.

## Next run goals
1. Merge PR #35 only after every gate on its final documentation head is green.
2. After merge, require GitHub Pages/deployed runtime/CORS gates on the resulting `main` commit before claiming this maintenance change complete.
3. Inspect current Basri HTML/parser drift with bounded live samples; strengthen parsing only when concrete drift is demonstrated.
4. Preserve search/category/details/episodes/movie/playback/download/Safari Range/iPhone WebKit/CORS gates during parser hardening.
5. Keep `Player.html` web-native and free of invented Download UI and legacy Intent/deep-link behavior.
6. Keep download actions in the original Basri cinema details/episode flow through opaque Al-Qahtani media references.
7. Begin Flutter only as a faithful client over the proven Al-Qahtani backend, without Theeb/akwam-indexer dependencies.
8. Migrate Flutter flows incrementally with parity gates rather than rewriting the product wholesale.
9. Preserve Android Mobile, Android TV D-Pad/remote, and iOS constraints.
10. Continue security/performance/provider-health maintenance after stable releases.
