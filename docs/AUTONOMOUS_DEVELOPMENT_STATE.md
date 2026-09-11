# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` remains the behavioral baseline.

## Current state
- `main` is at `a89dff5f55a9eb9b124344e850be46cdb425a55c`, the squash merge of PR #14 `Widen bounded recovery for Theeb discovery outages`.
- Active development branch: `fix/cinema-provider-fallback-15`.
- PR #14 was merged only after both PR gates were green: Web smoke and Live provider smoke.
- Main Web smoke run `34587393684` passed and GitHub Pages deployment also completed successfully.
- Main Remote runtime smoke run `34587393709` failed in the deployed Safari/cinema probe, so Web parity remains fail-closed and Flutter remains blocked.
- Theeb Engine GitHub main remains `38720273d43acbe7fcf072a3cdaf8c6b1659b1b1`.
- Render connector inspection in this run was blocked because no Render workspace is selected; do not claim direct Render log/deploy verification from this run.

## Completed / diagnosed in this run
- Re-audited the open PR, CI, main workflows, cinema frontend, Al-Qahtani server code, Theeb fetch wrapper, remote smoke gate and the current Theeb Engine contracts/security.
- Squash-merged PR #14 as `a89dff5f55a9eb9b124344e850be46cdb425a55c` after Web smoke and Live provider smoke passed.
- Confirmed PR #14 widened only `/v1/discover` recovery to a bounded five-attempt window with stale-cache support; protected provider retries stay short and fail closed.
- Confirmed the deployed gate still fails after the merge. Run `34587393709` completed with failure specifically in `Probe deployed Render runtime and Safari flows` after setup/wait steps succeeded.
- Confirmed cinema search/category still depend primarily on `/v1/discover` and legacy fallback. HTTP 200 with no usable items ultimately reaches an empty response when neither path yields data.
- Confirmed provider episode references currently discard series query/title and episode-number context. `providerEpisode()` retries only the selected provider, so a primary provider episode failure cannot yet resolve the same episode from an alternate provider.
- Confirmed Al-Qahtani reads `THEEB_SERVICE_TOKEN` server-side and injects it into protected `/api/providers/*` requests; it is never sent to browser code.
- Confirmed Theeb Engine also exposes protected multi-provider `/api/search?q=...`, whose response includes provider groups; its authentication accepts the isolated service token server-to-server while `/v1/discover` remains public client API.
- Created `fix/cinema-provider-fallback-15` from exact main `a89dff5f55a9eb9b124344e850be46cdb425a55c`.
- Added `server/live-search-fallback.mjs`, which maps protected `/api/search` group/provider results into existing Al-Qahtani `theeb:discover:` references, filters movie/series, deduplicates candidates, supplies category aliases, and fails closed when `THEEB_SERVICE_TOKEN` is absent.
- Added `test/live-search-fallback.test.mjs` covering provider-group mapping, category aliases, server-only token use with no token leakage, and fail-closed behavior without the service token.
- A follow-up attempt to wire the helper into `server/index.mjs` was blocked by the tool safety layer. The runtime wiring therefore did not land and no PR #15 was opened. Do not describe the cinema issue as fixed yet.

## Preserved original behavior
- Matches remain independent and must continue returning live fixtures.
- News remains readable/non-obfuscated and free of ad-network runtime code.
- `Player.html` remains web-native with no `com.bsr.player.pro` intent/deep-link.
- `basrimatches.html`, `albasri-cinema.html`, `bsr-Player.html` and the original archive remain preserved.
- Safari direct media stays behind Al-Qahtani Range-aware proxies.
- Provider credentials remain server-side only; protected Provider API is not opened publicly.

## Known limitations / gates not yet passed
- `fix/cinema-provider-fallback-15` currently contains helper/tests but the backend route wiring is not yet applied because the write was blocked.
- Remote runtime smoke is red on `main`; Search/Category → Details → Episodes → Playback → Safari Range is not proven.
- Only anime category is currently in remote runtime smoke; all visible movie/series category buttons need live fail-closed coverage.
- Provider episode refs still lack enough content context for alternate-provider episode fallback.
- Direct Render deploy/log inspection requires an explicitly selected Render workspace in the connector.
- Download-option UX remains incomplete.
- Flutter migration remains blocked until live Web parity is proven.

## Next run goals
1. Continue only on `fix/cinema-provider-fallback-15`; do not open a second PR.
2. Wire protected `/api/search` fallback into Al-Qahtani backend without exposing `THEEB_SERVICE_TOKEN`; keep public `/v1` and legacy paths as later fallbacks.
3. Make `THEEB_ENGINE_BASE_URL` configurable server-side with safe validation and current HTTPS origin as default.
4. Ensure search/category does not treat 200-empty as terminal while an authorized protected provider-search fallback is available; log provider-empty, timeout, 5xx, auth/config and code failures separately.
5. Preserve series title/query, provider-series id and episode number in provider episode references while retaining backward compatibility with existing refs.
6. Implement bounded alternate-provider resolution for the same episode before `NO_PLAYABLE_SOURCE`.
7. Add all visible series/movie categories plus `الذئب الوحيد` and `The Odyssey` to regression tests; require details, episodes/source, not poster-only success.
8. Keep all real direct media behind Al-Qahtani proxies and require Safari `Range: bytes=0-1023` to return 200/206 with useful media/range headers.
9. Re-run Web smoke, Live provider smoke and deployed Remote runtime smoke; inspect Render deployment/logs once the workspace is explicitly selected.
10. Keep matches/news as regression gates; only after full live Web parity turns green begin unified Flutter Android Mobile/Android TV/iOS work and gated releases.
