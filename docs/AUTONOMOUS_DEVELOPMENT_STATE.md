# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` remains the behavioral baseline.

## Current state
- `main` is at `a89dff5f55a9eb9b124344e850be46cdb425a55c`, the merge of PR #14 `Widen bounded recovery for Theeb discovery outages`.
- Active development branch: `fix/live-search-fallback-15`.
- PR #14 had both PR gates green before merge: Web smoke `34470270994` and Live provider smoke `34470271038`.
- Main Web smoke run `34587393684` passed after the merge, but deployed Remote runtime smoke run `34587393709` failed fail-closed.
- Theeb Engine remains `https://theeb-arab-api.onrender.com` on GitHub main `38720273d43acbe7fcf072a3cdaf8c6b1659b1b1`.
- Protected Theeb control/provider calls use server-only `THEEB_SERVICE_TOKEN`; browser code never receives the credential.

## Completed / diagnosed in this run
- Re-audited main, open PR state, PR #14 checks, current server code, workflow definitions, deployed runtime gate, Theeb discovery implementation and Theeb security/auth contract.
- Merged PR #14 only after its Web smoke and Live provider smoke were both successful.
- GitHub Pages and main Web smoke succeeded on the merge commit.
- The deployed runtime probe then reproduced the user's iPhone Safari symptom exactly enough to localize it: backend health passed, matches returned 8 items, while `الذئب الوحيد`, `The Odyssey`, and the anime category all returned `source: empty`, `count: 0`. Each discovery path took about 11.8 seconds, matching exhaustion of the widened 750ms/1.5s/3s/6s discovery retry window rather than a browser rendering bug.
- Inspected `akwam-indexer` v1 discovery: `/v1/discover` delegates to the same live multi-provider `searchAll()` orchestrator used by the protected `/api/search` control route. The v1 route intentionally collapses orchestrator failures to `DISCOVERY_UNAVAILABLE`, while `/api/search` exposes structured provider success/failure counts and live results to authorized server-to-server callers.
- Created `fix/live-search-fallback-15` from the exact main merge commit.
- Updated `server/theeb-fetch.mjs` so exhausted `/v1/discover` requests get one bounded, server-authenticated fallback through protected `/api/search`. The Bearer token is injected only server-side. Successful live-search results are normalized back to the existing discovery contract, cached, and tagged with `X-Al-Qahtani-Discovery-Fallback: live-search`; empty/5xx/transport/auth outcomes are logged separately without secrets.
- Generalized protected GET retry logging so `/api/search`, `/api/resolve*`, and `/api/providers/*` keep bounded retry/fail-closed behavior. Non-retryable 4xx validation/auth errors remain fail-closed.
- Added deterministic tests proving an exhausted HTTP-200-empty discovery request can recover through the protected live-search route and proving Authorization is not sent to public `/v1/search`.

## Preserved original behavior
- Matches: session acquisition, server discovery, HLS/MP4/embed playback and periodic refresh.
- News: readable non-obfuscated bridge/incremental loading and article details without ad-network runtime code.
- Cinema: categories, search, details, episodes, watch/download entry points, canonical/discovery/legacy/provider fallbacks.
- `Player.html` remains web-native and does not launch `com.bsr.player.pro`.
- Safari media paths remain behind Al-Qahtani Range-aware proxies.
- Provider authentication remains server-only and provider-target validation remains fail-closed.

## Known limitations / gates not yet passed
- `fix/live-search-fallback-15` still needs PR Web smoke and Live provider smoke before merge.
- The protected `/api/search` fallback uses the same provider orchestrator as `/v1/discover`; it provides a second contract path and better diagnostics but cannot manufacture results if every live provider is genuinely failing. If the new gate still returns empty, the next root fix belongs in provider health/search behavior or a verified legacy/category source, not another unbounded retry loop.
- The current deployed runtime smoke covers Arabic search, The Odyssey and anime, but not yet every category visible on iPhone Safari. Expand it after the immediate discovery recovery path is green.
- Provider episode references still lack enough series-title/episode-number context for cross-provider episode fallback. The selected Akwam episode can still fail with `PROVIDER_EPISODE_UNAVAILABLE` after discovery recovers.
- Safari byte-range probing remains a hard production gate and must pass with 200/206 plus useful `Content-Range`/`Accept-Ranges` headers on a real media source.
- Download-option UX remains incomplete.
- Flutter migration remains blocked until live Web Search/Category → Details → Episodes → Playback → Safari media is proven.

## Next run goals
1. Open PR #15 from `fix/live-search-fallback-15` and run Web smoke plus Live provider smoke; repair failures on the same branch only.
2. Merge PR #15 only when both PR gates are green.
3. Verify the exact merge commit is deployed and rerun Remote runtime smoke.
4. If `/api/search` fallback also reports all providers empty/failed, inspect provider-level diagnostics and fix the failing provider/search layer instead of lengthening retries again.
5. Expand deployed category regression coverage to every iPhone Safari category: series foreign/Arabic/Turkish/Asian/anime/Ramadan and movies foreign/Arabic/Indian/Asian/Turkish/anime.
6. Preserve series title/query, provider series id and episode number in provider episode references while retaining backward compatibility with existing refs.
7. Add alternate-provider episode resolution before `NO_PLAYABLE_SOURCE` and keep direct media behind Al-Qahtani Range-aware proxies.
8. Require Safari `Range: bytes=0-1023` to return 200/206 and useful content/range headers on a real source.
9. Keep matches/news regression checks green and add GitHub Pages browser navigation coverage after cinema playback turns green.
10. Only after live Web parity is proven, begin unified Flutter Android Mobile/Android TV/iOS migration and gated release workflows.
