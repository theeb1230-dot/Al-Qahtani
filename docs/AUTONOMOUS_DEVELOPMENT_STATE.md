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
- PRs #17 through #36 are merged.
- Product `main` at the start of the current PR: `32f7dfb1b57727a829bc2deb4732816818a8914d` (`Prove original Basri player contract`).
- Active PR: #37 `Gate backend CORS boundary` on `test/cors-boundary-37`.
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
### PR #25 — bounded series playback recovery
Merged as `7af710d0c07507e55014b150e61278f3c49a7cdf`. Deployed series playback tries at most three playable episode candidates with bounded requests while still requiring a real proxied source and Safari Range success.

### PR #26 — original Basri download contract recovered
Merged as `9196676cafbf22ef8e1f655db3e134989b3e3d5a`. CI reads the checked-in original archive and protects the historical Watch/Download behavior. The original UI downloads the same resolved `media_src` used for playback.

### PR #27 — original download UX restored safely
Merged as `16d122d2471ff6dcebbcb42ef1afbc9ed1881cff`. Movie and episode download actions use only short-lived Al-Qahtani media references; upstream URLs remain hidden.

### PR #29 — rejected download references hardened
Merged as `03b57f54cdb692f5d2094770e4b2afdbd0cb5652`. Download headers are added only to successful validated media responses. Invalid, expired, URL-shaped fake IDs and arbitrary `url=` attempts remain JSON errors.

### PR #31 — deterministic media-reference expiry gate
Merged as `8e27b10c7baf25a61c43aab55a5656a64b5539ea`. Test-only hooks prove opaque references expire fail-closed without exposing the private registry or changing the 15-minute production TTL.

### PR #32 — expiry evidence recorded
Merged as `edcf54f98ab34a0e66f6c1992840ff89605ddf50`. Records final-head and post-merge expiry evidence.

### PR #33 — trusted download filenames
Merged product change as `238f510ba3e16eabfc69b6013842bec7ba231233`.

Implementation:
- added `server/download-filename.mjs`;
- download names come only from trusted Basri title metadata stored server-side inside the opaque media reference;
- upstream media URL/path structure is never used as a filename source;
- browser-supplied filename data is not accepted;
- Arabic/Unicode titles are preserved through RFC 5987 `filename*=UTF-8''...`;
- ASCII fallback remains available in `filename="..."`;
- path separators, quotes, reserved filename characters, control characters and CR/LF are removed;
- empty/dot-only names fall back to `al-qahtani-media`;
- names are capped at 120 characters;
- successful `download=1` responses get the trusted `Content-Disposition` plus `X-Content-Type-Options: nosniff` only after upstream media validation;
- `Access-Control-Expose-Headers` includes `Content-Disposition` for allowed origins;
- `server/index.mjs` preserves the trusted filename produced by the validated media proxy rather than overwriting it with the previous fixed name.

### PR #34 — trusted filename evidence recorded
Merged as `74d58617c7fc1b86b4f78ff3793cf6d390f11df8`. Records the final-head and post-merge evidence for the trusted filename hardening. Main push gates were green, including Web smoke, Mobile WebKit, Remote runtime, Remote movie playback, Original Basri download contract, Media reference expiry, Trusted download filename, and GitHub Pages deployment.

### PR #36 — original player contract proven
Merged as `32f7dfb1b57727a829bc2deb4732816818a8914d`.

Permanent evidence gate:
- `scripts/original_player_contract.py` reads `Player.html` and `bsr-Player.html` directly from the preserved original ZIP rather than guessing from the cleaned current files.
- `.github/workflows/original-player-contract.yml` runs the gate on PRs.
- CI run `34631653231` proved both original players accept `url`, `title`, and `live` context but have **no player-level Download UI or contract**: no Arabic Download label, no HTML `download` attribute, no `download=1` query behavior, no `download_options`, and no `Content-Disposition` handling.
- The raw word `download` exists in both original files as a technical text occurrence only; it is explicitly not treated as proof of a product download control.
- The original `bsr-Player.html` contains legacy app/Intent material, but current repository search shows no `intent:` or `com.albasri` runtime markers. The cleaned product must not reintroduce that legacy application handoff.
- Conclusion: do **not** add a Download button to current `Player.html` merely to mirror the details-level Download UX. The historical Download action belongs to the cinema details/episode flow already restored through the opaque backend media reference.
- Final PR head `ea770961f036a965da7f5df311210496abd73707` passed Original Basri player contract, Web smoke, Live provider smoke, Mobile WebKit, Remote movie playback, Original Basri download contract, Media reference expiry, and Trusted download filename before merge.

## Active PR #37 — backend CORS boundary
Branch: `test/cors-boundary-37`.

New deterministic security gate:
- `scripts/cors_boundary_test.mjs` starts the real Al-Qahtani backend locally and exercises CORS without contacting cinema providers for the protected cases.
- `.github/workflows/cors-boundary.yml` runs the CORS boundary gate on PRs and `main` pushes.
- Exact allowed origin `https://theeb1230-dot.github.io` receives `Access-Control-Allow-Origin` and `Vary: Origin` while credentialed CORS remains disabled.
- Rejected origin `https://evil.example`, lookalike `https://theeb1230-dot.github.io.evil.example`, and opaque `Origin: null` receive no `Access-Control-Allow-Origin` on successful health responses.
- Rejected preflight receives no CORS grant; allowed preflight still exposes the required GET/OPTIONS and Range/Content-Type contract.
- Invalid media/download references from rejected origins remain JSON 404 errors, receive no CORS grant, no `Content-Disposition`, and no download-only `X-Content-Type-Options` decoration.
- Allowed-origin invalid media references still receive the legitimate CORS grant but no download decoration.
- Unknown-route 404 responses do not grant CORS to rejected origins.
- First PR run `34632094703` passed. On the same initial head, Original Basri player contract, Trusted download filename, Web smoke, Remote movie playback, Live provider smoke, Original Basri download contract, Media reference expiry, and Mobile WebKit also passed.

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
- CORS grants are exact-origin only; lookalike, `null`, and arbitrary origins must remain browser-inaccessible on success, preflight, media/download errors and generic 404s.
- Credentialed CORS remains disabled.
- Safari Range forwarding remains active.
- Player-level Download controls must not be invented unless future baseline evidence changes.
- Legacy Android Intent/deep-link behavior from the old Basri player must not be reintroduced.
- No Theeb/akwam-indexer provider dependency may be introduced.

## Render evidence and limitation
- External deployed-runtime tests target `https://al-qahtani-api.onrender.com` and prove live behavior after the workflow's Render auto-deploy wait.
- Direct Render workspace inspection is intentionally not claimed. The connector currently exposes two workspaces (`My Workspace` and `بيانات`) with no selected workspace; autonomous execution must not guess which owns Al-Qahtani.

## Next run goals
1. Finish PR #37 only after all current-head gates are green; merge it before opening any new PR.
2. Verify `Content-Disposition` on a real deployed movie/episode download includes the trusted Basri title while remaining CR/LF-safe and bounded.
3. Extend CORS coverage to the deployed backend only if it can be done without generating excessive live-provider traffic; local deterministic security gates remain authoritative for rejected-origin behavior.
4. Preserve all search/category/details/series/movie/playback/download/Safari Range/iPhone WebKit gates during hardening.
5. Inspect parser drift and provider health for current Basri HTML without changing provider projects.
6. Keep current `Player.html` web-native and free of legacy Intent/deep-link behavior; do not add a player Download control absent original evidence.
7. Begin Flutter only as a faithful client over the proven Al-Qahtani backend; do not introduce Theeb/akwam-indexer dependencies.
8. Migrate Flutter flows incrementally with parity gates rather than rewriting the product wholesale.
9. Preserve Android Mobile, Android TV D-Pad/remote, and iOS constraints.
10. Continue security/performance/maintenance work after stable releases; GitHub and deployed tests remain source of truth over this handoff.
