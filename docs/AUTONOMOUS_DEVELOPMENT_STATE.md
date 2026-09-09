# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` remains the behavioral baseline.

## Current branch
- Active fix branch: `fix/mobile-provider-runtime-03` based on user iPhone Safari evidence.
- PR #2 was merged to `main` as commit `40a2efeb8633c1c0c9de1ab7241b56257d7acb32` after Web smoke passed.
- `main` now contains the provider-backed web parity surface.

## Completed in this run
- Analyzed six iPhone Safari screenshots from the live GitHub Pages deployment. Confirmed Pages is deployed, but runtime provider access is inconsistent: matches fail, cinema category/search returns an empty shell, and news can either load 15 items or stall at 0.
- Found a concrete root bug in `fetchJsonWithHealth`: spreading a `Headers` instance with `...(init.headers || {})` drops custom `X-BSR-Token` and `X-BSR-Page` headers. Fixed provider transport to normalize with `new Headers()` and preserve authentication headers.
- Made match list/server requests resilient when session bootstrap itself is unavailable, while retaining authenticated requests when sessions work.
- Made cinema reads tolerate Worker deployments where read endpoints are public and retain token refresh when authentication is required.
- Added direct news JSON loading before the inherited iframe bridge, with the bridge retained as compatibility fallback and a bounded timeout instead of an endless spinner.
- Fixed the match retry button: inline `onclick="load()"` could not call module-scoped `load()`; retry now uses an event listener.
- Added explicit cinema loading/error states so provider failures no longer look like valid empty search/category results.
- Added CI regression gates for preserved provider headers and module-safe retry behavior.
- Re-audited current `main`, branches, recent commits, CI configuration and migration state before making changes.
- Confirmed the migrated web surface on `main` still lacked `news.html`, `albasri-cinema.html`, `basrimatches.html`, `bsr-Player.html` and `sitemap.xml`.
- Re-inspected the original uploaded archive to preserve behavior rather than replacing pages from memory.
- Centralized inherited Worker endpoints in `web/core/api-client.js` so UI files no longer need direct `workers.dev` URLs.
- Added match session handling, token refresh on HTTP 401 and direct fallback in the provider client.
- Refactored `index.html` to use the provider client and preserved the original 45-second match refresh cadence.
- Added a readable `news.html` using the original source bridge/pagination behavior and provider-backed article loading.
- Restored `albasri-cinema.html` with category browsing, search, media details, episode listing, watch and download actions.
- Added token-aware cinema provider methods for genre, search and series/details requests.
- Replaced the legacy `bsr-Player.html` Intent generator with a web-player URL generator that does not target `com.bsr.player.pro`.
- Consolidated the old structured matches URL through `basrimatches.html` into the provider-backed home while keeping session and refresh behavior in the new path.
- Added cinema/media payload contracts and normalization helpers.
- Added `sitemap.xml` and `robots.txt` pointing at the Al-Qahtani GitHub Pages site.
- Added explicit GitHub Pages deployment workflow and `.nojekyll`.
- Strengthened Web smoke gates to require all migrated web pages, reject Worker URLs in UI files and reject the legacy Android package across the public web surface.

## Preserved original behavior
- Matches: session acquisition, token refresh, server discovery, HLS/MP4/embed playback, periodic refresh.
- News: source iframe bridge, incremental loading, article detail retrieval.
- Cinema: category browsing, search, details, episodes, watch and download entry points.
- Legacy player utility: retained as a compatibility tool, but it now creates web-player links instead of Android Intents.

## Known limitations
- Provider liveness/playability is still dependent on inherited Workers and upstream sources; repository CI currently verifies static behavior and structure, not every live stream.
- Cinema category URLs inherited from the original source are still represented in the web page and should be moved behind provider configuration in a later pass.
- Download behavior is a browser-level direct-link action; platform-specific download management will be implemented in Flutter later.
- Flutter migration has not started because web parity and deployment are still being proven first.

## Next run goals
1. Verify GitHub Pages deployment on merged `main` and confirm live `index.html`, `news.html` and `albasri-cinema.html`.
2. Move cinema category/source configuration out of the UI into a provider/config module.
3. Add live provider health probes with typed transport, payload and playable-source results.
4. Add player source validation/fallback ordering before navigation.
5. Add browser-level smoke tests for navigation and player routing.
6. Document normalized contracts for match sessions, cinema details/episodes and news bridge messages.
7. Add provider fallback ordering and retry telemetry.
8. Begin Flutter workspace only after the web surface is verified live.
9. Add Android Mobile and Android TV build pipelines.
10. Add iOS unsigned IPA CI and gated GitHub Releases.
