# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` remains the behavioral baseline.

## Current state
- `main` is at merge commit `1427bf29cf7f86747f2119ed66610ae183ac1e45` from PR #10.
- Active PR: #11 `Harden cinema discovery against transient empty upstreams` on branch `fix/discovery-resilience-11`.
- Al-Qahtani Render service: `https://al-qahtani-api.onrender.com`, auto-deploys `main`, starts `node server/index.mjs`.
- Theeb Engine Render service: `https://theeb-arab-api.onrender.com`, live on commit `38720273d43acbe7fcf072a3cdaf8c6b1659b1b1`.
- Both backends use server-to-server `THEEB_SERVICE_TOKEN` for protected `/api/providers/*`; the credential is not exposed to browser code or committed files.

## Completed / diagnosed in this run
- Re-audited `main`, branches, PRs, recent Actions runs, Render services/deploys/logs, backend code and this handoff before changing code.
- Confirmed the post-main `Remote runtime smoke` for PR #10 failed against the deployed backend: initial run returned empty Arabic search, empty `The Odyssey`, and empty anime category while health and matches passed.
- Re-ran the same deployed gate after Theeb Engine was warm. Arabic search recovered with two discovery items, `الذئب الوحيد` details opened from Akwam with 20 episodes, `The Odyssey` search returned two items, and anime returned one item. This proves the earlier all-empty result was at least partly transient/cold/upstream availability rather than a deterministic UI regression.
- The repeat gate isolated two remaining real failures:
  - selected `الذئب الوحيد` episode reached the playback contract but returned `PROVIDER_EPISODE_UNAVAILABLE`; byte-range probing correctly skipped because no playable source existed for that selected provider episode.
  - `The Odyssey` details still failed deterministically with `DETAILS_UNAVAILABLE`.
- Render logs identified the Odyssey root cause: discovery returned `arabseed:d656809c0` and `wecima:a1bf79030`, but Al-Qahtani sent redirected `source_url` hosts (`arabsseed.baby`, `mywecima.courses`) into Theeb provider-series routes. Theeb correctly rejected those targets with HTTP 400 under its provider-target/SSRF validation.
- Added `server/theeb-fetch.mjs`: bounded retry for public `/v1/discover` when HTTP 200 contains zero items, short successful-result cache, stale-on-transient-failure fallback, bounded cache size, and structured empty/http/transport/recovery logs.
- Preserved server-only Authorization injection for protected provider routes inside the same transport wrapper; public `/v1/*` calls remain unauthenticated.
- Added deterministic `node:test` coverage in `test/theeb-fetch.test.mjs` for empty-result recovery, stale fallback, provider-only bearer injection and unrelated-origin pass-through.
- Wired the new module syntax and tests into `Web smoke`; the first PR #11 Web smoke passed including the new tests.
- Updated `providerMovieCandidate` to resolve discovered movies by stable `provider_series_id` first instead of volatile redirected `source_url`. Providers rebuild their canonical URL from that stable ID, so external redirect domains no longer need to be trusted merely to open movie details.
- PR #11 CI was retriggered by the latest commit; Web smoke and Live provider smoke are currently running and must be green before merge.

## Preserved original behavior
- Matches: session acquisition, server discovery, HLS/MP4/embed playback and periodic refresh.
- News: readable non-obfuscated source bridge/incremental loading and article details without ad-network bootstrap.
- Cinema: categories, search, details, episodes, watch/download entry points, with canonical/discovery/legacy/provider fallbacks.
- `Player.html` remains web-native and does not launch the legacy `com.bsr.player.pro` Android package.
- Safari media paths remain behind Al-Qahtani Range-aware proxies; service credentials are never returned to the browser.

## Known limitations / gates not yet passed
- PR #11 is not mergeable until its latest Web smoke and Live provider smoke both complete successfully.
- Full live Safari parity is not proven until PR #11 is merged, Render deploys that exact main commit, and the post-main remote runtime gate passes search → details → episodes/playback on the deployed service.
- A valid details response is not equivalent to a playable episode. `PROVIDER_EPISODE_UNAVAILABLE` must continue to be classified separately from search/details failures and tested against alternate provider candidates before declaring playback unavailable.
- Provider availability and redirect domains are variable. Security validation must stay fail-closed; do not solve redirect churn by broadly allowlisting arbitrary hosts.
- Download option UX is still incomplete.
- Flutter migration remains intentionally blocked until live Web parity is proven.

## Next run goals
1. Finish latest PR #11 Web smoke and Live provider smoke; inspect logs and fix any failure on `fix/discovery-resilience-11` only.
2. Verify the stable-id Odyssey fix against ArabSeed/WeCima; require at least one `The Odyssey` detail response to succeed without relaxing SSRF/provider-target validation.
3. Merge PR #11 only when both PR gates are green; then verify Render auto-deploys the exact merge commit.
4. Run the post-main deployed runtime gate and require `الذئب الوحيد`, `The Odyssey`, and anime to return non-empty live results after bounded cold-start recovery.
5. Improve playback fallback so a `PROVIDER_EPISODE_UNAVAILABLE` result tries alternate discovered/provider candidates before final failure; keep watch/download semantics separate.
6. When any live direct media source exists, enforce Safari-style `Range: bytes=0-1023` through the Al-Qahtani media proxy and verify 200/206 plus relevant range headers.
7. Add provider-health diagnostics that distinguish 200-empty, timeout, provider HTTP failure, invalid redirected target and no-playable-source without leaking credentials.
8. Expand remote match server sampling and news smoke so cinema fixes cannot regress the original match/news features.
9. Add browser-level GitHub Pages navigation coverage for search/category/details/player after the backend runtime gate is green.
10. Only after all live Web gates pass, initialize Flutter against Al-Qahtani backend contracts, then add Android Mobile, Android TV D-pad/focus, iOS unsigned IPA CI and gated GitHub Releases.
