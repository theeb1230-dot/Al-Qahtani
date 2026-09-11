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
- PRs #17 through #25 are merged.
- Current `main` before PR #26: `7af710d0c07507e55014b150e61278f3c49a7cdf`.
- Active PR #26: `Recover original Basri download contract from archive` on `test/original-download-contract-26`.
- No cross-project Theeb/akwam-indexer runtime dependency is present.

## PR #25: bounded series playback recovery
PR #25 fixed a flaky deployed-runtime gate without weakening the product requirement:
- series playback no longer judges the entire deployment from one transient episode timeout;
- the smoke tries at most three playable episode candidates;
- each candidate is bounded to 45 seconds;
- individual failures are logged;
- the gate still fails when no candidate produces a real proxied source;
- it still requires `/api/cinema/media?id=...`, Safari HTTP `206`, `Content-Range`, and `Accept-Ranges: bytes`.

PR #25 was squash-merged as `7af710d0c07507e55014b150e61278f3c49a7cdf` after Web smoke, Live provider smoke, Mobile WebKit smoke, and Remote movie playback passed. Post-merge `Remote runtime smoke` also passed against `https://al-qahtani-api.onrender.com`, proving the deployed path after merge.

## Original Basri download contract recovered
The previous binary-archive inspection blocker is resolved. GitHub Actions can directly open `albasritv.github.io-main.zip` with Python `zipfile`, so PR #26 adds a deterministic contract guard rather than relying on truncated connector output.

Recovered behavior from original `albasri-cinema.html`:
- the episode choice modal offers both `مشاهدة` and `تحميل`;
- the download button calls `downloadChosenEpisode()`;
- `prepareEpisodeChoice(ep)` calls the original cinema details contract and only shows the download button when the returned episode data has `media_src`;
- `downloadChosenEpisode()` assigns `chosenEpisode.data.media_src` to `currentDownloadUrl` and calls `startDownload()`;
- `setupPlayer(data)` also assigns `data.media_src` to `currentDownloadUrl` and shows the player download button when present;
- `startDownload()` first uses optional `window.Android.downloadFile(currentDownloadUrl)` when a host app exposes that JavaScript interface;
- otherwise it creates an `<a download>` element pointing at `currentDownloadUrl`, targets `_self`, clicks it, and removes it.

Important conclusion: the historical UI did not require a separate static `/download/...` URL contract. It treated the resolved playback `media_src` itself as the downloadable resource. In Al-Qahtani this must be restored through the existing opaque backend media reference rather than exposing the raw upstream media URL to the browser.

PR #26 adds:
- `scripts/original_download_contract.py` to extract and assert the original behavior from the checked-in baseline archive;
- `.github/workflows/original-download-contract.yml` to gate future drift.

The new contract workflow passes on PR #26. Web smoke, Live provider smoke, Mobile WebKit smoke, and Remote movie playback also passed on the same PR head before this documentation update; all gates must pass again on the final head before merge.

## Proven live Web parity
The live deployment has proven:
- backend health;
- matches;
- Basri news worker;
- Arabic search;
- all 12 visible cinema categories;
- series details and episodes;
- direct movie details;
- series playback through the Al-Qahtani media proxy;
- real direct-movie playback through the Al-Qahtani media proxy;
- Safari HTTP byte-range handling;
- iPhone WebKit series and movie navigation/viewport gates.

## Security and regression boundaries
- Direct upstream media URLs remain hidden behind short-lived backend references.
- CORS and Safari Range forwarding remain active.
- `akwam.ss` is accepted only as the historical Basri source contract.
- `.downet.net` media compatibility is scoped to the existing allowlist and known legacy TLS behavior; other TLS remains strict.
- Arbitrary browser-controlled external URLs must not be accepted for playback or download.
- Worker/session tokens remain server-side.
- Ad/pop-up/tracking and legacy Android Intent/deep-link regressions remain prohibited.

## Render evidence and limitation
- External deployed-runtime evidence is successful against `https://al-qahtani-api.onrender.com` after PR #25.
- The Render connector currently has no workspace selected and explicitly forbids guessing one. No direct deployment-ID/log claim is made until a workspace is explicitly selected by the user.

## Next run goals
1. Finish PR #26 only after all final-head CI gates are green, then merge it.
2. Restore the original download UX using the proven historical behavior, but route downloads through an opaque Al-Qahtani backend reference instead of exposing raw upstream `media_src`.
3. Design the download route so arbitrary external URLs cannot be supplied by the browser; reuse source/media allowlists, short-lived references, bounded redirects/timeouts, and server-side validation.
4. Preserve the original semantics: episode choice offers Watch/Download only after episode resolution; direct movies/player can expose Download when a real media reference exists.
5. Add backend tests for expired/invalid download references, host allowlist rejection, and safe response headers.
6. Add iPhone WebKit tests proving the Download button appears only when a safe resolved source exists and never leaks the upstream URL into page markup/query strings.
7. Add a real deployed download smoke that proves the first bytes can be fetched through the Al-Qahtani route without downloading the entire media file.
8. Preserve all existing search/category/details/series/movie/Safari Range gates.
9. Begin Flutter only as a faithful client over the proven Al-Qahtani backend, preserving Android Mobile, Android TV D-Pad/remote, and iOS behavior without Theeb/akwam-indexer provider dependencies.
10. Continue maintenance after stability: regression prevention, security, parser drift, performance, and provider health.
