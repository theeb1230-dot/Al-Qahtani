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
- PRs #17 through #27 are merged.
- Current product `main`: `16d122d2471ff6dcebbcb42ef1afbc9ed1881cff` (`Restore original Basri download UX safely`).
- Active documentation PR #28 records the post-merge live evidence.
- No cross-project Theeb/akwam-indexer runtime dependency is present.

## Recent engineering changes
### PR #25 — bounded series playback recovery
Merged as `7af710d0c07507e55014b150e61278f3c49a7cdf`. Deployed series playback tries at most three playable episode candidates with 45-second bounds. A transient single-episode timeout no longer falsely fails the deployment, while the gate still fails if no candidate produces a real proxied source. Safari `206`, `Content-Range`, and `Accept-Ranges: bytes` remain mandatory.

### PR #26 — original Basri download contract recovered
Merged as `9196676cafbf22ef8e1f655db3e134989b3e3d5a`. CI now opens the checked-in baseline archive directly and protects the historical behavior:
- episode choice offers `مشاهدة` and `تحميل`;
- the selected episode is resolved before Download is enabled;
- original `downloadChosenEpisode()` and `setupPlayer(data)` use the same resolved `media_src` used for playback;
- original `startDownload()` calls optional `window.Android.downloadFile(...)`, otherwise clicks a temporary `<a download>`.

The historical Basri UI therefore treats resolved playback media as the downloadable resource; it does not require a separate provider project.

### PR #27 — original download UX restored safely
Merged as `16d122d2471ff6dcebbcb42ef1afbc9ed1881cff` after all final-head PR gates passed.

Implementation:
- episode resolution now restores the original Watch/Download choice;
- direct movies show Download beside Watch when a safe media reference exists;
- browser download accepts only the existing short-lived `/api/cinema/media?id=...` reference;
- `download=1` reuses that exact proxy route and adds `Content-Disposition: attachment` plus `X-Content-Type-Options: nosniff`;
- optional Android bridge receives only the Al-Qahtani proxy URL;
- normal web download also uses only the Al-Qahtani proxy URL;
- raw upstream `akwam.ss` / `downet.net` media URLs remain hidden.

Regression gates:
- iPhone WebKit proves movie and episode Download buttons and rejects upstream-host leakage;
- local backend smoke proves the attachment contract through the real proxy;
- real movie smoke fetches only `bytes=0-1023`, avoiding full-media downloads while proving the live path.

## Post-merge live evidence for PR #27
Push/main commit: `16d122d2471ff6dcebbcb42ef1afbc9ed1881cff`.

Green post-merge gates include:
- Web smoke run `34616270516`: success.
- Remote runtime smoke run `34616270510`: success against the deployed backend.
- Mobile WebKit smoke run `34616270529`: success.
- GitHub Pages build/deploy run `34616269033`: build/report/deploy all success.
- Remote movie playback run `34616270532`: success after its built-in Render auto-deploy wait.

The deployed remote movie smoke proved against `https://al-qahtani-api.onrender.com`:
- backend health is live;
- real movie `The Beloved` resolves from `basri-direct` with zero fabricated episodes;
- playback stays behind `/api/cinema/media?id=...`;
- Safari probe returns `206`, `Content-Range: bytes 0-1023/1147681720`, `Accept-Ranges: bytes`;
- bounded live download returns `206` through `/api/cinema/media?id=...&download=1`;
- live download response includes `Content-Disposition: attachment; filename="al-qahtani-media"` and `X-Content-Type-Options: nosniff`;
- no upstream media URL is required by the browser.

Therefore Web download parity is now proven on the deployed path, not only in PR/local CI.

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
- Source/media host allowlists and SSRF protections remain in force.
- Worker/session tokens stay server-side.
- CORS and Safari Range forwarding remain active.
- `.downet.net` legacy TLS compatibility stays narrowly scoped; other TLS remains strict.
- Ad/pop-up/tracking and legacy Android Intent/deep-link regressions remain prohibited.

## Render evidence and limitation
- External deployed-runtime tests target `https://al-qahtani-api.onrender.com` and prove the live behavior after Render auto-deploy waits.
- The Render connector still has no selected workspace and explicitly forbids guessing one. Do not claim direct Render deployment IDs/log inspection until a workspace is explicitly selected.

## Next run goals
1. Add negative download tests for invalid and expired media references and ensure they cannot be turned into arbitrary URL/host fetches.
2. Move download response decoration closer to validated media-reference handling if that improves error semantics without weakening the shared media proxy.
3. Improve download filename metadata only when it can be derived safely and sanitized without exposing upstream URL structure.
4. Inspect `Player.html` against the baseline and decide whether the historical player-level Download button should also be restored through the same opaque proxy route.
5. Preserve all search/category/details/series/movie/playback/download/Safari Range/iPhone WebKit gates while hardening.
6. Begin Flutter only as a faithful client over the proven Al-Qahtani backend; do not introduce Theeb/akwam-indexer provider dependencies.
7. Build Flutter sections incrementally after verifying behavior parity for each migrated Web flow rather than rewriting the product wholesale.
8. Preserve Android Mobile, Android TV D-Pad/remote, and iOS behavior and platform constraints.
9. Continue parser-drift/provider-health/security/performance maintenance even after stable releases.
10. Keep GitHub and live deployed tests as source of truth over this handoff whenever they disagree.
