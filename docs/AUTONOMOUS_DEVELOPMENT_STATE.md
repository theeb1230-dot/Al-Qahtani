# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs in this project.
- Historical `https://akwam.ss/...` links are part of the original Basri cinema content contract. Their use here is not an integration with the separate `akwam-indexer` repository.
- Matches/news use the original Basri workers.
- Cinema stays on the original Basri chain. The historical cinema worker currently returns `403 FORBIDDEN_ORIGIN`, so the backend uses a server-side compatibility fallback over the same original content source instead of switching providers.

## Current state
- PRs #17 through #23 are merged.
- Current `main`: `ddcbc43cffcfb9078b87e479bfacbfca6304e83d` (`Fix real movie playback and gate Safari range`).
- PR #23 fixed real direct-movie playback and added a dedicated deployed movie/Safari Range gate.
- No cross-project Theeb/akwam-indexer runtime dependency is present.

## PR #23 root cause and fix
A real deployed-movie gate exposed a bug that deterministic browser mocks had missed:
- all six visible movie categories returned populated `basri-direct` results;
- movie detail pages did not produce `media_path` because `directDetails()` kept `parseDetails()` metadata but discarded `/watch/` and `/download/` anchors;
- the existing `parseEpisode()` logic already knew how to extract those original-source links.

Fix in `server/basri-source.mjs`:
- movie details retain normal title/poster metadata;
- the same HTML is also parsed for original `watch` and `downloads` links;
- `server/app.mjs` then follows the already-secured path: movie detail -> watch page -> real media -> short-lived `/api/cinema/media?id=...` reference.
- Source/media allowlists and SSRF boundaries remain unchanged.

## CI topology correction
`.github/workflows/remote-movie-playback-smoke.yml` now tests the code actually under review:
- Pull Requests start the candidate backend locally and run the movie playback gate against it.
- Pushes to `main` wait for Render auto-deploy and run the same gate against `https://al-qahtani-api.onrender.com`.
- This prevents PR validation from accidentally testing stale deployed `main` code.

## PR #23 final-head evidence
Final PR head `b8ff8a85fcfc7ab8dcf9e848de2ecd4c8ed621c2` passed:
- Web smoke #99.
- Live provider smoke #69.
- Mobile WebKit smoke #13.
- Remote movie playback smoke #5.

The candidate real-movie test resolved `The Beloved` with:
- source `basri-direct`;
- zero fabricated episodes;
- two original download options detected;
- playback hidden behind `/api/cinema/media?id=...`;
- HTTP `206` for `Range: bytes=0-1023`;
- `Content-Range: bytes 0-1023/1147681720`;
- `Accept-Ranges: bytes`.

## Post-merge live evidence
After PR #23 was squash-merged, `main` became `ddcbc43cffcfb9078b87e479bfacbfca6304e83d`.

Successful post-merge gates include:
- GitHub Pages deploy #23.
- Mobile WebKit smoke #14.
- Remote movie playback smoke on `main`: the deployed Render backend resolved real movie `The Beloved`, returned two download options, kept playback behind the Al-Qahtani media proxy, and returned Safari byte-range HTTP `206` with `Content-Range: bytes 0-1023/1147681720` and `Accept-Ranges: bytes`.

Remote runtime smoke initially failed only on one series episode playback request after a 30-second upstream abort (`This operation was aborted`). In that same run:
- backend health passed;
- matches and news passed;
- Arabic search/details passed;
- all 12 visible cinema categories returned real content;
- all six movie categories opened real direct-movie details with `media: true`.

The failed remote-runtime job was rerun without changing code and passed on the second attempt. This is treated as a transient upstream/provider timeout, not a regression from the movie parser fix.

## Deployed Web parity status
Live Web parity is now proven for:
- backend health;
- matches;
- Basri news worker;
- Arabic search;
- all 12 visible cinema categories;
- series details/episodes;
- direct movie details;
- series playback through the Al-Qahtani media proxy;
- real direct-movie playback through the Al-Qahtani media proxy;
- Safari HTTP byte-range handling;
- iPhone WebKit series and movie navigation/viewport gates.

## Security and regression boundaries
- Direct media URLs remain hidden behind short-lived backend references.
- CORS and Safari Range forwarding remain active.
- `akwam.ss` source URLs are accepted only as the historical Basri content contract, not as an akwam-indexer integration.
- `.downet.net` media compatibility remains scoped to the already allowlisted host and known legacy TLS behavior; other TLS remains strict.
- Ad/pop-up/tracking and Android Intent/deep-link regressions remain prohibited.

## Render evidence and limitation
- External deployed-runtime evidence is successful against `https://al-qahtani-api.onrender.com` after the merge.
- The Render connector exposes two workspaces (`My Workspace` and `بيانات`) and requires explicit user confirmation before selecting one. No workspace was guessed in this non-interactive run, so no direct Render deployment-ID/log claim is made.

## Original archive/download status
- `albasritv.github.io-main.zip` remains in the repository root and is the behavioral baseline.
- GitHub can expose the binary as base64, but the connector output is truncated and the execution environment could not retrieve the raw archive over the network, so the archive was not fully extracted this run.
- Real original-source movie HTML proves download links exist: `The Beloved` exposed two download choices.
- Do not expose a user-facing download UI until the exact historical archive behavior is recovered and the download path is constrained safely behind the Al-Qahtani backend.

## Next run goals
1. Reconfirm `main` and all post-merge gates before new product work.
2. Recover the exact historical download UI/contract from `albasritv.github.io-main.zip` using a binary-capable path.
3. Document original watch/download URL shapes, labels, sizes, navigation, and any worker/session involvement.
4. If downloads are restored, keep arbitrary external URLs out of browser-controlled inputs and preserve source/media allowlists, bounded redirects/timeouts, and token secrecy.
5. Add backend and WebKit regression tests for restored download behavior before exposing it in UI.
6. Make series playback smoke resilient to a single transient episode/provider timeout by trying a small bounded set of playable episode candidates, without masking persistent failures.
7. Preserve all existing movie/series/Search/category/Safari Range gates.
8. Recheck direct Render deployment/log evidence only after a workspace is explicitly selected; never infer the workspace.
9. Begin Flutter only as a faithful client over the proven Al-Qahtani backend, preserving Android Mobile, Android TV D-Pad/remote, and iOS behavior without Theeb/akwam-indexer provider dependencies.
10. Continue maintenance after stability: regressions, security, upstream parser drift, performance, and provider health.
