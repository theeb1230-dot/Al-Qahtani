# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` remains the behavioral baseline.

## Current state
- `main` is at `fe4616ad4915e5e1c28d488e98c9ddf768d404c5`, the squash merge of PR #13 `Require real deployed playback before Web parity`.
- Active development branch: `fix/alternate-provider-playback-14`.
- Al-Qahtani Render service `https://al-qahtani-api.onrender.com` auto-deployed `fe4616ad4915e5e1c28d488e98c9ddf768d404c5` as deploy `dep-dah8v4navr4c73e7k4r0` and reached `live` before the deployed runtime probe started.
- Theeb Engine remains `https://theeb-arab-api.onrender.com` on GitHub main `38720273d43acbe7fcf072a3cdaf8c6b1659b1b1`.
- Protected `/api/providers/*` calls use server-only `THEEB_SERVICE_TOKEN`; browser code never receives the credential.

## Completed / diagnosed in this run
- Re-audited main, open PRs, recent commits, Actions runs/logs, Render service/deploy state, runtime logs, server code and this handoff.
- PR #13 had both PR gates green: Web smoke and Live provider smoke. It was squash-merged to main as `fe4616ad4915e5e1c28d488e98c9ddf768d404c5`.
- PR #13 intentionally tightened `scripts/remote_runtime_smoke.mjs`: deployed Web parity now requires a real playable source and a Safari byte-range media probe instead of accepting an error-shaped playback response.
- Post-merge Remote runtime smoke run `34469683484` failed, which is the expected fail-closed behavior while production playback/search is unhealthy.
- The failure was not a stale Render deployment. Deploy `dep-dah8v4navr4c73e7k4r0` was live at 11:08:28Z and the runtime probe began at 11:08:46Z.
- The deployed Al-Qahtani logs isolated the immediate outage: Theeb Engine returned HTTP 502 for `/v1/discover` on all three attempts for `الذئب الوحيد`, `The Odyssey`, and all anime category query variants. Health and matches remained healthy; matches returned 12 items.
- Because the Al-Qahtani process had just restarted for deployment, its in-memory discovery cache was cold and could not provide a stale result. This exposed that the old retry burst (250ms then 750ms) was too narrow for a multi-second upstream 502 wave.
- Created `fix/alternate-provider-playback-14` from the exact main commit.
- On that branch, `server/theeb-fetch.mjs` now separates provider-route retry timing from discovery retry timing. Protected provider GETs keep the short bounded policy, while `/v1/discover` gets up to five attempts with bounded delays of 750ms, 1.5s, 3s and 6s. A final `theeb_discovery_exhausted` diagnostic records status/cache/transport state without secrets.
- Added deterministic coverage proving discovery can survive three consecutive HTTP 502 responses and recover on the fourth attempt, without lengthening the protected-provider retry policy.

## Preserved original behavior
- Matches: session acquisition, server discovery, HLS/MP4/embed playback and periodic refresh.
- News: readable non-obfuscated bridge/incremental loading and article details without ad-network runtime code.
- Cinema: categories, search, details, episodes, watch/download entry points, canonical/discovery/legacy/provider fallbacks.
- `Player.html` remains web-native and does not launch `com.bsr.player.pro`.
- Safari media paths remain behind Al-Qahtani Range-aware proxies.
- Provider authentication remains server-only and provider-target validation remains fail-closed; HTTP 400 validation failures are not retried.

## Known limitations / gates not yet passed
- Branch `fix/alternate-provider-playback-14` still needs PR Web smoke and Live provider smoke before merge.
- The discovery widening is resilience, not a substitute for fixing Theeb Engine if repeated 502s persist beyond the bounded window.
- The selected Akwam episode previously returned `PROVIDER_EPISODE_UNAVAILABLE` even after short provider retries. Once discovery is stable, the next playback fix must preserve content/episode context and try alternate provider candidates for the same episode before final failure.
- Safari byte-range probing remains a hard production gate and must pass with 200/206 plus appropriate range headers on a real media source.
- Download-option UX remains incomplete.
- Flutter migration remains blocked until live Web Search/Category → Details → Episodes → Playback → Safari media is proven.

## Next run goals
1. Open PR #14 from `fix/alternate-provider-playback-14` and run Web smoke plus Live provider smoke; repair any failure on that same branch.
2. Merge only when both PR gates are green.
3. Verify Render auto-deploys the exact merge commit and rerun the post-main Remote runtime smoke.
4. If Theeb discovery still returns sustained 502 beyond the wider bounded window, diagnose/fix the upstream `akwam-indexer` discovery path rather than adding unbounded retries.
5. Once search/details are stable, preserve series title/query, provider series id and episode number in provider episode references while retaining backward compatibility with old refs.
6. Add alternate-provider episode resolution: on primary provider failure/no source, discover the same title, resolve alternate series, select the matching episode number, and try bounded candidates before `NO_PLAYABLE_SOURCE`.
7. Keep all direct media behind an Al-Qahtani Range-aware proxy; do not expose provider tokens or credentials to the browser.
8. Require Safari `Range: bytes=0-1023` to return 200/206 and useful range/content headers in deployed runtime smoke.
9. Expand matches/news regression smoke and add browser-level GitHub Pages navigation coverage after playback turns green.
10. Only after live Web parity is proven, begin the unified Flutter Android Mobile/Android TV/iOS migration and gated release workflows.
