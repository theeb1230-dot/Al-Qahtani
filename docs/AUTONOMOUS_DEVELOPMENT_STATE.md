# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs in this project.
- Historical `https://akwam.ss/...` links are part of the original Basri cinema content contract. Their use here is not an integration with the separate `akwam-indexer` repository.
- Matches/news use the original Basri workers.
- Cinema remains on the original Basri content chain. The historical cinema worker currently returns `403 FORBIDDEN_ORIGIN`, so the Al-Qahtani backend uses a server-side compatibility fallback over the same original content source instead of switching to another project/provider.

## Current state
- PRs #17 through #22 are merged.
- Current base `main` before PR #23: `86022292db2f51ab630c59628474f4dc8a119324` (`Record iPhone movie parity evidence`).
- Active PR #23: `Gate deployed movie playback on Safari range` on branch `test/live-movie-playback-23`.
- No second PR may be opened while #23 remains active.
- No cross-project Theeb/akwam-indexer provider dependency is present in the runtime path.

## PR #23 problem discovered
A new live-movie gate exposed a product bug that earlier browser mocks/category gates did not catch:
- all six visible movie categories returned HTTP 200 and 30 real `basri-direct` results;
- however the deployed backend on the pre-fix main branch could not turn sampled movie detail pages into a proxied `media_path`;
- initial Remote movie playback smoke run #1 (`34608004030`) failed on `deployed movie resolves real proxied playback` while categories themselves were populated.

Root cause in `server/basri-source.mjs`:
- `directDetails()` parsed normal movie pages with `parseDetails()` only;
- `parseDetails()` extracts episodic links but not `/watch/` or `/download/` anchors;
- `parseEpisode()` already had the original-source watch/download extraction logic;
- as a result movie detail pages lost their direct watch links before `server/app.mjs::directDetailsResolved()` could resolve media.

## PR #23 fix
- For a direct movie detail page, `directDetails()` now preserves the normal metadata from `parseDetails()` and additionally extracts the original Basri-chain `watch` and `downloads` links from the same HTML.
- `server/app.mjs` can therefore follow the existing safe path: detail -> first watch link -> real media -> short-lived `/api/cinema/media?id=...` reference.
- No new provider and no Theeb/akwam-indexer integration was introduced.
- The same source allowlist and SSRF boundary remain in force: `akwam.ss` for original-source pages and already allowlisted media hosts such as `.downet.net`.

## New movie playback gate
PR #23 adds `scripts/remote_movie_playback_smoke.mjs` and `.github/workflows/remote-movie-playback-smoke.yml`.

The gate checks:
- backend reports `cinema_source: basri-original`;
- real movie results come from the six visible movie categories;
- a real movie resolves to `/api/cinema/media?id=...`;
- a movie does not fabricate an episode list;
- preserved original download choices are observable as metadata when present;
- Safari-style `Range: bytes=0-1023` returns HTTP 206 with `Content-Range` and `Accept-Ranges: bytes`.

CI topology was corrected during the same PR:
- pull requests start the candidate backend locally and test the code actually under review;
- pushes to `main` wait briefly for Render auto-deploy and then test the deployed public backend;
- this avoids the invalid pattern of testing old deployed `main` when deciding whether candidate PR code works.

## Candidate evidence on PR #23
Remote movie playback smoke #4 (`34608328956`) passed against the candidate backend:
- movie category: `أجنبية`;
- real movie: `The Beloved`;
- source: `basri-direct`;
- episodes: `0`;
- original download options detected: `2`;
- media remained behind `/api/cinema/media?id=...`;
- Safari range returned HTTP `206`;
- `Content-Range: bytes 0-1023/1147681720`;
- `Accept-Ranges: bytes`.

On the same PR head before this documentation update:
- Web smoke #98 passed.
- Live provider smoke #68 passed.
- Remote movie playback smoke #4 passed.
- Mobile WebKit smoke #12 was still running at the instant the handoff was rewritten and must be rechecked on the final PR head after this documentation commit.

## Deployed Web parity status
The previously merged Basri restoration remains proven for:
- backend health;
- live matches;
- Basri news worker;
- Arabic search;
- all 12 visible cinema categories;
- details and episodes;
- series playback through the Al-Qahtani media proxy;
- Safari HTTP byte-range handling;
- iPhone WebKit series and deterministic movie navigation.

PR #23 specifically closes the missing backend behavior for a real direct movie. It is not considered deployed parity until #23 is green, merged, Render has had time to deploy the merge commit, and the post-merge Remote movie playback smoke succeeds against `https://al-qahtani-api.onrender.com`.

## Root causes fixed/contained
- Removed cross-project Theeb/akwam-indexer runtime integration.
- Restored category/search/details/episodes/watch behavior from the Basri chain.
- Historical cinema worker origin lock (`403 FORBIDDEN_ORIGIN`) is handled server-side with same-source fallback.
- Arabic URL Referers are percent-encoded before Node HTTP requests.
- Legacy `.downet.net` media TLS compatibility remains scoped to the already allowlisted host and known certificate-chain failures; other TLS remains strict.
- Direct media URLs remain hidden behind short-lived `/api/cinema/media?id=...` references.
- CORS and Safari byte-range forwarding are preserved.
- iPhone-width horizontal overflow is covered by WebKit regression tests.
- Direct movie detail pages now retain their original watch/download links instead of silently losing them.

## Render evidence and limitation this run
- The public backend remains `https://al-qahtani-api.onrender.com`.
- The Render connector is connected, but it returned two workspaces (`My Workspace` and `بيانات`) and requires explicit user confirmation before selecting one. This non-interactive run did not guess a workspace, so no direct Render deployment/log claim is made.
- Post-merge GitHub Actions remote-runtime gates remain the available external live evidence until a Render workspace is explicitly selected.

## Original archive/download review status
- The original archive is present in repository root as `albasritv.github.io-main.zip` (62,305 bytes) and remains the baseline.
- A GitHub base64 read confirmed the binary is accessible, but the connector response was truncated and the execution environment could not fetch the raw archive due network/DNS limitations. The archive was therefore not fully extracted in this run.
- Independently of archive extraction, the live original-source movie HTML now proves that the Basri chain exposes download links: the candidate movie `The Beloved` yielded two download options alongside its watch link.
- Do not yet expose a browser download UI until the exact original archive UI/behavior is recovered and the download path is proxied or otherwise constrained safely.

## Next run goals
1. Keep working only on PR #23 until all checks pass on its final head; do not open another PR.
2. Merge #23 only when Web smoke, Live provider smoke, Mobile WebKit smoke, and Remote movie playback smoke are green on the same final head.
3. After merge, verify the `main` push gate waits for Render and proves a real deployed movie -> media proxy -> Safari Range path.
4. If the deployed movie gate fails only because Render has not finished auto-deploying, inspect timing and rerun the failed job rather than changing correct parser code blindly.
5. Reconfirm the existing Remote runtime smoke still passes matches/news/search/categories/series after the movie parser change.
6. Obtain a binary-capable extraction of `albasritv.github.io-main.zip` and document the exact historical download UI/contract before adding user-facing download controls.
7. Design any restored download endpoint with the same source allowlist, no arbitrary external URL input, bounded redirects/timeouts, and no leaked worker/session tokens.
8. Recheck exact Render deployment/log evidence only after a workspace is explicitly selected; do not infer a workspace.
9. Keep WebKit viewport/movie/series gates and ad/pop-up/tracking/deep-link guards active.
10. Flutter may begin only as a faithful client over the proven Al-Qahtani backend; Android Mobile, Android TV D-Pad/remote, and iOS must remain free of cross-project Theeb/akwam-indexer provider dependencies.
