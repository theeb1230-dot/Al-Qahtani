# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The checked-in original archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs here.
- Historical `https://akwam.ss/...` links are part of the original Basri cinema content contract and are not an integration with the separate akwam-indexer repository.
- Matches/news use the original Basri workers.
- Cinema stays on the original Basri chain. The historical cinema Worker currently returns `403 FORBIDDEN_ORIGIN`; the backend uses the same original content source through a server-side compatibility fallback rather than switching provider projects.

## Current state
- PRs #17 through #29 are merged.
- Current product `main`: `03b57f54cdb692f5d2094770e4b2afdbd0cb5652` (`Harden rejected download references`).
- No cross-project Theeb/akwam-indexer runtime dependency is present.
- Live Web parity, including playback and the recovered Basri-style download flow, remains proven through the deployed Al-Qahtani backend.

## Recent engineering changes
### PR #25 — bounded series playback recovery
Merged as `7af710d0c07507e55014b150e61278f3c49a7cdf`. Deployed series playback tries at most three playable episode candidates with 45-second bounds. A transient single-episode timeout no longer falsely fails the deployment, while the gate still fails if no candidate produces a real proxied source. Safari `206`, `Content-Range`, and `Accept-Ranges: bytes` remain mandatory.

### PR #26 — original Basri download contract recovered
Merged as `9196676cafbf22ef8e1f655db3e134989b3e3d5a`. CI opens the checked-in baseline archive directly and protects the historical behavior:
- episode choice offers `مشاهدة` and `تحميل`;
- the selected episode is resolved before Download is enabled;
- original `downloadChosenEpisode()` and `setupPlayer(data)` use the same resolved `media_src` used for playback;
- original `startDownload()` calls optional `window.Android.downloadFile(...)`, otherwise clicks a temporary `<a download>`.

The historical Basri UI therefore treats resolved playback media as the downloadable resource; it does not require a separate provider project.

### PR #27 — original download UX restored safely
Merged as `16d122d2471ff6dcebbcb42ef1afbc9ed1881cff`.

Implementation:
- episode resolution restores the original Watch/Download choice;
- direct movies show Download beside Watch when a safe media reference exists;
- browser download accepts only the existing short-lived `/api/cinema/media?id=...` reference;
- `download=1` reuses that exact proxy route;
- optional Android bridge receives only the Al-Qahtani proxy URL;
- normal web download also uses only the Al-Qahtani proxy URL;
- raw upstream `akwam.ss` / `downet.net` media URLs remain hidden.

### PR #28 — live download parity recorded
Merged as `4d110ef22e8ff3254e90329304944b9afa086e4a`. It records the post-PR-27 deployed evidence and leaves GitHub/live gates as the source of truth.

### PR #29 — rejected download references hardened
Merged as `03b57f54cdb692f5d2094770e4b2afdbd0cb5652` after every final-head gate passed.

Root issue:
- `server/index.mjs` previously attached `Content-Disposition` and `X-Content-Type-Options: nosniff` as soon as `download=1` appeared, before the opaque media reference had been validated;
- invalid or expired references were still rejected by `server/app.mjs`, but their JSON error responses could inherit download decoration.

Fix:
- download decoration is now delayed until the Al-Qahtani media path produces a successful 2xx, non-JSON proxied media response;
- invalid, expired, URL-shaped fake IDs and arbitrary `url=` query attempts remain ordinary JSON errors and never receive attachment/nosniff headers;
- no browser-supplied URL is accepted as a media source;
- the valid download path still uses the same short-lived opaque media reference and retains its successful attachment behavior.

Negative regression coverage in `scripts/local_backend_smoke.mjs` now checks:
- a fake media ID;
- an ID shaped like `https://evil.example/video.mp4`;
- an arbitrary `url=https://evil.example/video.mp4` query without a valid opaque ID.

Every case must fail with HTTP 404 and `MEDIA_REFERENCE_EXPIRED`, remain `application/json`, and omit download headers. The smoke then proves a real Basri episode still resolves through the opaque proxy, Safari Range still returns 206, and the valid download still returns attachment/nosniff headers.

## PR #29 final-head evidence
Final PR head: `9f530aefa5b845cf735f035f342f81c5a44a2fdb`.

All final-head gates passed:
- Web smoke #115, run `34617301112`.
- Live provider smoke #79, run `34617301041`.
- Original Basri download contract #11, run `34617301101`.
- Mobile WebKit smoke #29, run `34617301115`.
- Remote movie playback smoke #21, run `34617301182`.

The Live provider/local-backend log explicitly proved:
- invalid download reference: 404, opaque JSON error, no attachment/nosniff headers;
- URL-shaped fake media ID: same fail-closed result;
- arbitrary `url=` query: same fail-closed result;
- real Basri search/category/details/episode path remained green;
- real media proxy returned HTTP 206 with `Content-Range: bytes 0-1023/350455536` and `Accept-Ranges: bytes`;
- valid safe download returned HTTP 206 with `Content-Disposition: attachment; filename="al-qahtani-media"` and `X-Content-Type-Options: nosniff`.

## Post-merge evidence for PR #29
Push/main commit: `03b57f54cdb692f5d2094770e4b2afdbd0cb5652`.

Post-merge gates completed without a failure. Confirmed successful runs include:
- Web smoke #116, run `34617449008`.
- Remote runtime smoke #21, run `34617448922`, against the deployed backend.
- Mobile WebKit smoke #30, run `34617449043`.
- Original Basri download contract #12: success.
- Remote movie playback #22 completed as part of the same main push without a reported failure.
- GitHub Pages deploy was triggered for the same merge commit.

No regression was observed in search, categories, details, episodes, playback, movie flow, Download UX or iPhone WebKit behavior after the hardening merge.

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
- Direct upstream media URLs stay hidden behind short-lived backend references.
- Browser-controlled arbitrary external URLs are forbidden for playback/download.
- Invalid or expired opaque media references must fail closed as JSON and must not be decorated as downloads.
- Source/media host allowlists and SSRF protections remain in force.
- Worker/session tokens stay server-side.
- CORS and Safari Range forwarding remain active.
- `.downet.net` legacy TLS compatibility stays narrowly scoped; other TLS remains strict.
- Ad/pop-up/tracking and legacy Android Intent/deep-link regressions remain prohibited.

## Render evidence and limitation
- External deployed-runtime tests target `https://al-qahtani-api.onrender.com` and prove live behavior after the workflow's Render auto-deploy wait.
- The Render connector still has no selected workspace and explicitly forbids guessing one. Do not claim direct Render deployment IDs/log inspection until a workspace is explicitly selected.

## Next run goals
1. Add a deterministic expired-reference regression test, preferably through a narrowly scoped test seam or injectable TTL, without exposing or weakening the private media-reference store.
2. Inspect whether download filename metadata can be derived only from trusted title/episode metadata, sanitize it rigorously, and avoid leaking upstream URL/path structure.
3. Compare current `Player.html` with the baseline and decide whether the historical player-level Download control should also use the same opaque proxy route.
4. Add negative CORS/header tests around failed media/download requests so rejected origins cannot gain broader response access.
5. Preserve all search/category/details/series/movie/playback/download/Safari Range/iPhone WebKit gates while hardening.
6. Begin Flutter only as a faithful client over the proven Al-Qahtani backend; do not introduce Theeb/akwam-indexer provider dependencies.
7. Build Flutter sections incrementally after verifying behavior parity for each migrated Web flow instead of rewriting the product wholesale.
8. Preserve Android Mobile, Android TV D-Pad/remote, and iOS behavior and platform constraints.
9. Continue parser-drift/provider-health/security/performance maintenance even after stable releases.
10. Keep GitHub and live deployed tests as source of truth over this handoff whenever they disagree.
