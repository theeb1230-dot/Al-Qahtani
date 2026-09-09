# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` remains the behavioral baseline.

## Current branch
- Active development branch: `migration/web-parity-02`
- Previous PR #1 was merged to `main` as commit `0d82c32d2c4fb66d869c2124534ae8033ac024a2`.

## Completed in this run
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
1. Run and inspect PR CI for `migration/web-parity-02`; repair any failures on the same branch.
2. Merge only after Web smoke gates are green.
3. Verify GitHub Pages deployment workflow on merged `main` and confirm the live site serves `index.html`, `news.html` and `albasri-cinema.html`.
4. Move cinema category/source configuration out of the UI into a provider/config module.
5. Add live provider health probes with typed transport, payload and playable-source results.
6. Add player source validation/fallback ordering before navigation.
7. Add browser-level smoke tests for navigation and player routing.
8. Document normalized contracts for match sessions, cinema details/episodes and news bridge messages.
9. Begin Flutter workspace only after the web surface is verified live.
10. Then add Android Mobile, Android TV and iOS build/release pipelines incrementally.
