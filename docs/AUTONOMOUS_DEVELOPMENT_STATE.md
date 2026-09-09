# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` is the behavioral baseline.

## Completed in current pass
- Audited all 9 original files before modification.
- Removed `highperformanceformat.com` and `effectivecpmnetwork.com` ad script injections from `index.html` in the prepared clean source.
- Removed the explicit advertising `window.open()` executed when selecting a server in the prepared clean source.
- Preserved `bindFirstPress()` because it is input de-duplication behavior, not the ad itself; updated its misleading ad-specific comment.
- Stopped forcing relative team logos through `koooracity.com` in the prepared clean source.
- Fully decoded `news.html` and replaced the XOR/`document.write()` bootloader with the readable page in the prepared clean source.
- Removed the cinema page hard lock to the old `albasritv.abrdns.com` path in the prepared clean source so the site can run from its own host.
- Inventoried inherited Workers/providers in `docs/PROVIDER_INVENTORY.md`.

## Important findings
- `Player.html` is a legacy Android-app bridge, not a true web player. It accepts an `intent` query value and targets package `com.bsr.player.pro`.
- `bsr-Player.html` generates/handles the same legacy app intents. Keep it temporarily until direct web-player parity is implemented and verified.
- `basrimatches.html` already contains a more structured session/token API flow than `index.html`; do not regress to the simpler path when unifying matches.
- `albasri-cinema.html` uses its own Worker and category sources and must be migrated, not dropped.

## Next run goals
1. Upload the prepared clean web pages and verify GitHub Pages behavior.
2. Define normalized provider contracts for matches, server lists, news, cinema search/details/episodes.
3. Extract direct web playback logic into a reusable web player module.
4. Replace `Player.html` intent bridge with a web-native entry point while retaining a temporary legacy compatibility path.
5. Add provider health classification and fallback ordering without hard-coding new URLs in UI files.
6. Add smoke tests for ad-domain absence, decoded news, independent hosting, and player routing.
7. Add GitHub Pages workflow for the clean web build.
8. Start Flutter workspace only after web behavior parity is testable.
9. Add Android mobile/TV/iOS CI incrementally, with release artifacts gated by successful builds.
