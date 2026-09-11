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
- PRs #17 through #33 are merged.
- Current product `main`: `238f510ba3e16eabfc69b6013842bec7ba231233` (`Bind safe download names to trusted media metadata`).
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
Merged as `238f510ba3e16eabfc69b6013842bec7ba231233`.

Implementation:
- added `server/download-filename.mjs`;
- download names now come only from trusted Basri title metadata stored server-side inside the opaque media reference;
- upstream media URL/path structure is never used as a filename source;
- browser-supplied filename data is not accepted;
- Arabic/Unicode titles are preserved through RFC 5987 `filename*=UTF-8''...`;
- ASCII fallback remains available in `filename="..."`;
- path separators, quotes, reserved filename characters, control characters and CR/LF are removed;
- empty/dot-only names fall back to `al-qahtani-media`;
- names are capped at 120 characters;
- successful `download=1` responses get the trusted `Content-Disposition` plus `X-Content-Type-Options: nosniff` only after upstream media validation;
- `Access-Control-Expose-Headers` now includes `Content-Disposition` for allowed origins;
- `server/index.mjs` preserves the trusted filename produced by the validated media proxy rather than overwriting it with the previous fixed name.

Deterministic regression:
- `scripts/download_filename_test.mjs` covers Arabic titles, ASCII titles, path traversal-like separators, quotes, control characters, CR/LF, empty/dot-only values and oversized names;
- `.github/workflows/download-filename.yml` gates these cases on PRs and `main` pushes.

## PR #33 final-head evidence
Final PR head: `598ed562d1e6e769f2499d0bd6d8543c49dbd8a9`.

Seven PR workflows were observed for the final head with no failures and no remaining in-progress run before merge. PR #33 was mergeable and was squash-merged only after those gates cleared.

Relevant protected behavior includes:
- Original Basri download contract;
- Web smoke;
- Live provider smoke;
- Mobile WebKit smoke;
- Remote movie playback smoke;
- Media reference expiry;
- Trusted download filename sanitization.

## Post-merge evidence for PR #33
Push/main commit: `238f510ba3e16eabfc69b6013842bec7ba231233`.

- Remote runtime smoke run `34626277190` completed successfully against the deployed Render backend after the auto-deploy wait.
- The deployed probe step passed, so the filename hardening did not regress backend health, matches/news, search/categories/details/episodes, playback, media proxy, or Safari flows.
- Post-merge GitHub Pages and other push workflows were started for the same commit; GitHub remains the source of truth for their final status.

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
- CORS must stay restricted to explicitly allowed origins.
- Safari Range forwarding remains active.
- No Theeb/akwam-indexer provider dependency may be introduced.

## Render evidence and limitation
- External deployed-runtime tests target `https://al-qahtani-api.onrender.com` and prove live behavior after the workflow's Render auto-deploy wait.
- Direct Render workspace inspection is intentionally not claimed: the connector exposes two workspaces (`My Workspace` and `بيانات`) and autonomous execution must not guess which workspace owns Al-Qahtani.

## Next run goals
1. Compare current `Player.html` and `bsr-Player.html` behavior with the checked-in original archive and determine whether a player-level Download control belongs in the restored Web UX.
2. If the baseline contains a player-level download action, route it only through the same opaque `/api/cinema/media?id=...&download=1` path; never expose upstream URLs.
3. Add negative CORS tests for rejected origins on health/API/media/download paths, including preflight and error responses.
4. Verify `Content-Disposition` on a real deployed movie/episode download includes the trusted Basri title while remaining CR/LF-safe and bounded.
5. Preserve all search/category/details/series/movie/playback/download/Safari Range/iPhone WebKit gates during hardening.
6. Inspect parser drift and provider health for current Basri HTML without changing provider projects.
7. Begin Flutter only as a faithful client over the proven Al-Qahtani backend; do not introduce Theeb/akwam-indexer dependencies.
8. Migrate Flutter flows incrementally with parity gates rather than rewriting the product wholesale.
9. Preserve Android Mobile, Android TV D-Pad/remote, and iOS constraints.
10. Continue security/performance/maintenance work after stable releases; GitHub and deployed tests remain source of truth over this handoff.
