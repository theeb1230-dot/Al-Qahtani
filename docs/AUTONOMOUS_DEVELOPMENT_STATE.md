# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` remains the behavioral baseline.

## Current state
- `main` is at `77672755fc5171e898e087297edbf8579e8719a9`, the squash merge of PR #15 `Recover cinema discovery through protected live search`.
- Active development branch: `fix/provider-episode-fallback-16`.
- PR #15 had both PR gates green before merge: Web smoke `34588120958` and Live provider smoke `34588120982`.
- Post-merge Remote runtime smoke `34588402964` failed fail-closed on playback, not discovery.
- Theeb Engine remains `https://theeb-arab-api.onrender.com` on GitHub main `38720273d43acbe7fcf072a3cdaf8c6b1659b1b1`.
- Protected Theeb control/provider calls use server-only `THEEB_SERVICE_TOKEN`; browser code never receives the credential.

## Completed / diagnosed in this run
- Re-audited open PRs, main, PR #15 checks, post-merge Actions and deployed runtime logs.
- Merged PR #15 only after Web smoke and Live provider smoke were green.
- The deployed runtime gate proved the discovery fix materially improved the live site: backend health passed, matches returned 8 items, `الذئب الوحيد` returned a real discovery result, its details opened with 20 episodes, `The Odyssey` returned 2 real items and opened details, and the anime category returned a real item instead of zero.
- The remaining blocker is now isolated to episode playback: the first `الذئب الوحيد` episode returned `PROVIDER_EPISODE_UNAVAILABLE` even though search/details succeeded. This confirms the old provider episode reference is too narrow and cannot recover through another provider.
- Created `fix/provider-episode-fallback-16` from exact main.
- Added `server/provider-episode-context.mjs` plus deterministic tests for stable episode-number matching and fail-closed context decoding.
- Updated `server/index.mjs` with `/api/cinema/provider-play`: it first tries the original provider, then rediscovers the same title, checks bounded alternate series providers, selects the same episode number, resolves a direct source, and keeps direct media behind `/api/cinema/provider-media`.
- Updated `albasri-cinema.html` so provider episodes use the new fallback endpoint while canonical/legacy episode behavior remains unchanged.
- Updated deployed runtime smoke to exercise the same provider fallback path as the browser, require real proxied media, require HTTP 206 plus range headers for Safari, and cover every category visible on the iPhone Safari UI.
- Updated Web smoke to syntax-check and run the new provider episode helper tests.

## Preserved original behavior
- Matches: session acquisition, server discovery, HLS/MP4/embed playback and periodic refresh.
- News: readable non-obfuscated bridge/incremental loading and article details without ad-network runtime code.
- Cinema: categories, search, details, episodes, watch/download entry points, canonical/discovery/legacy/provider fallbacks.
- `Player.html` remains web-native and does not launch `com.bsr.player.pro`.
- Direct provider media introduced by the fallback remains behind the Al-Qahtani proxy rather than leaking temporary provider URLs to the browser.
- Provider authentication remains server-only and provider-target validation remains fail-closed.

## Known limitations / gates not yet passed
- `fix/provider-episode-fallback-16` still needs PR Web smoke and Live provider smoke before merge.
- Alternate-provider playback is not considered successful until the deployed Remote runtime smoke gets a real source and Safari Range returns HTTP 206 with useful range headers.
- The new all-category deployed gate may expose additional weak provider/category queries and must remain fail-closed.
- `The Odyssey` currently opens metadata but the sampled movie result had no media source in the post-PR15 probe; movie playback remains a later Web parity gate.
- Download-option UX remains incomplete.
- Flutter migration remains blocked until live Web Search/Category → Details → Episodes → Playback → Safari media is proven.

## Next run goals
1. Open the PR for `fix/provider-episode-fallback-16` and repair Web smoke/Live provider smoke failures on the same branch only.
2. Merge only when both PR gates are green.
3. Verify the exact merge commit is deployed and rerun Remote runtime smoke.
4. If alternate-provider episode playback still fails, inspect which candidate provider/series/episode step fails and fix that layer instead of adding blind retries.
5. Require the wolf playback path to return a proxied source and Safari `Range: bytes=0-1023` to return HTTP 206 plus `Content-Range` or `Accept-Ranges`.
6. Keep all 12 visible iPhone Safari categories non-empty in the deployed gate or document/fix the specific provider/category contract that fails.
7. Add an explicit live movie playback gate for `The Odyssey` or another stable movie sample once series playback is green.
8. Keep matches and news regression checks green and add a direct news smoke if the existing workflows do not cover it.
9. Add GitHub Pages browser navigation coverage after the backend media chain is green.
10. Only after live Web parity is proven, begin unified Flutter Android Mobile/Android TV/iOS migration and gated release workflows.
