# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The checked-in original archive `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployed tests are required before claiming parity.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs here.
- Historical `https://akwam.ss/...` links are part of the original Basri content contract, not an integration with the separate akwam-indexer repository.
- Matches/news use original Basri workers. Cinema stays on the original Basri chain with server-side compatibility fallback to the historical source when the origin-locked cinema Worker returns `403 FORBIDDEN_ORIGIN`.

## Current state
- PRs #17 through #40 are merged, including PR #35 after it was reconciled with the newer #36-#40 work.
- Product `main`: `99148e2a06c7cf228f8097d9f0086030ddc4088d` (`Harden Basri live smoke reliability`).
- Active PR: #41 `Record deployed CORS and parser evidence` on `docs/deployed-cors-evidence-41`.
- Previous #41 final-head commit `c69e275d38516901ac149aa0ce0df43614359988` was mergeable and all required gates were green.
- A squash merge attempt using that exact expected head was blocked by the connector safety layer before GitHub mutation; this is an execution-permission/tooling blocker, not a CI or repository mergeability failure.
- No cross-project Theeb/akwam-indexer runtime dependency is present.
- Live Web parity is proven through the deployed Al-Qahtani backend and the exact `main` commit above.

## PR #41 final-head CI evidence before the documented handoff update
All checks on `c69e275d38516901ac149aa0ce0df43614359988` completed successfully:
- Web smoke run `34635308068` — success.
- Live provider smoke run `34635308171` — success.
- Mobile WebKit smoke run `34635308087` — success.
- Remote movie playback smoke run `34635308122` — success.
- Remote CORS smoke run `34635308081` — success.
- CORS boundary run `34635308126` — success.
- Original Basri player contract run `34635308117` — success.
- Original Basri download contract run `34635308089` — success.
- Media reference expiry run `34635308105` — success.
- Trusted download filename run `34635308127` — success.

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
- `Player.html` must not invent a Download control: preserved original ZIP evidence proves Download belonged to cinema details/episode flow, not the player itself.

## Recent merged work
### PR #35 — Basri smoke reliability hardening
Merged as `99148e2a06c7cf228f8097d9f0086030ddc4088d`.
- `scripts/local_backend_smoke.mjs` tries at most three playable episode candidates sequentially so one transient upstream media failure does not falsely fail the whole Basri chain.
- A successful candidate still must resolve through `/api/cinema/media?id=...`, pass Safari Range, and pass safe download attachment/nosniff checks.
- `.github/workflows/remote-cors-smoke.yml` waits for candidate backend `/health` before probing, eliminating the observed localhost startup race.
- An attempted player-level Download control was removed after PR #36 proved that behavior did not exist in the original Basri player contract.

### PR #36 — original player contract
Merged as `32f7dfb1b57727a829bc2deb4732816818a8914d`.
- CI reads original `Player.html` and `bsr-Player.html` from the preserved ZIP.
- Both original players have no player-level Download UI/contract.
- Legacy application handoff material must not be reintroduced.

### PR #37 — deterministic CORS boundary
Merged as `aa3042477b67cbf3d4e77234687962fa828bd131`.
- Only exact origin `https://theeb1230-dot.github.io` receives ACAO; credentialed CORS remains disabled.
- Arbitrary, lookalike, and `Origin: null` requests receive no ACAO.

### PR #38/#39 — deployed trusted download titles
- PR #38 merged as `ac9aab5dc911f6f4c78e56f9a33fc754588ec360`.
- PR #39 merged as `fa70d4145cacc7766cb3f8f0649c69744f324753`.
- Real movie and episode downloads produce trusted-title `Content-Disposition`, stay CR/LF-safe and bounded, preserve `nosniff`, and keep Range behavior.
- Deployed runtime proved all six series and six movie categories return real items and open details.

### PR #40 — deployed CORS boundary
Merged as `d44b8a81d60b69d3330d90c6b2cfd3051c52fd99`.
- Candidate and deployed CORS gates verify exact allowed-origin behavior, rejected/lookalike/null origins, Range preflight, and opaque invalid-media error behavior.

## Post-merge evidence for PR #35
Exact main commit `99148e2a06c7cf228f8097d9f0086030ddc4088d` passed after merge:
- GitHub Pages deploy run `34634987202`: success.
- Remote runtime smoke run `34634987048`: success after the Render auto-deploy wait, including deployed Basri runtime and Safari flows.
- Remote movie playback smoke run `34634987042`: success after the Render auto-deploy wait, including real movie playback and Safari Range.
- Remote CORS smoke run `34634987065`: success after the Render auto-deploy wait.
- Mobile WebKit smoke run `34634987128`: success, including iPhone cinema navigation.
- Original Basri download contract run `34634987113`: success.

## Parser drift inspection
- Current `server/basri-source.mjs` still parses catalog cards, series/movie details, episode watch/download links, and watch-page media with strict historical source/media allowlists.
- No concrete parser drift is demonstrated by current deployed evidence: search, all 12 visible categories, series episodes, movie details, and real playback continue to pass.
- Do not rewrite parsers speculatively; change them only when live evidence demonstrates drift.

## Proven live Web parity
The deployed path has proven backend health, matches, Basri news, Arabic search, all 12 visible cinema categories, series details/episodes, direct movie details, series/movie playback, Safari byte-range behavior, iPhone WebKit navigation, original Basri-style movie/episode download flow through opaque Al-Qahtani references, trusted Arabic/Unicode filenames, and exact deployed CORS boundaries.

## Render evidence and limitation
- External deployed tests target `https://al-qahtani-api.onrender.com` after workflow auto-deploy waits and prove live behavior.
- Direct Render workspace inspection is not claimed. The connector currently exposes two workspaces owned by the same account: `My Workspace` (`tea-da2kb22jnfac73dpui5g`) and `بيانات` (`tea-dae92bgn74is73cs92ug`). Autonomous execution must not guess which workspace owns Al-Qahtani, so direct deployment/log inspection remains blocked until the workspace is confirmed by trustworthy context.

## Flutter readiness
- Web parity is sufficiently proven to begin Flutter incrementally once PR #41 is actually merged and its post-merge state is verified.
- Do not duplicate provider scraping inside Flutter; Flutter must consume only the proven Al-Qahtani backend contract.
- Before creating Flutter files, inspect the repository tree and preserved baseline for any historical mobile scaffold/assets.
- Preserve Arabic/RTL, Android Mobile, Android TV D-Pad/remote, and iOS media constraints from the first Flutter foundation.

## Blockers
1. PR #41 is mergeable and its previous final head passed every required gate, but the available merge action was blocked by the connector safety layer before GitHub mutation.
2. Direct Render log/deployment inspection cannot be attributed safely because two workspaces are visible and neither is confirmed as the Al-Qahtani workspace.

## Next run goals
1. Re-check the new #41 head created by this documentation update and require all final-head gates to be green again.
2. Retry merging #41 only if the merge action is permitted; never bypass the PR gate or push the branch directly into `main` as a substitute.
3. After a real merge, verify the exact resulting `main` commit and post-merge GitHub Pages/runtime gates.
4. Keep external deployed runtime tests as the Render evidence unless a workspace becomes reliably identified.
5. After #41 is merged and post-merge Web parity remains green, inspect repository tree and baseline archive for historical Flutter scaffold/mobile assets.
6. If no scaffold exists, introduce the smallest Flutter foundation using only the Al-Qahtani backend.
7. Start with shared API/domain models and navigation, not provider scraping.
8. Preserve matches, news, cinema search/categories/details/episodes/playback/download.
9. Keep Android TV D-Pad/focus and iOS Range/media constraints first-class.
10. Continue parser/provider-health maintenance only from demonstrated evidence; GitHub, the preserved Basri archive, and deployed runtime tests remain authoritative.
