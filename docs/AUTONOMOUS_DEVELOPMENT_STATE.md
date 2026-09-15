# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Current `main`: `537d00df4fadce707cb0b33351c36ac6f1cd406f` (v1.0.33 product SHA, merged PR #115).
- PR #115 is merged. At the start of this run there were zero open PRs.
- Active documentation/state PR branch: `docs/post-v1.0.33-release-state`.
- Product version/build: `1.0.33+33`; Runtime `PRODUCT_VERSION`: `1.0.33`.
- Release `v1.0.33` is published from exact product SHA `537d00df4fadce707cb0b33351c36ac6f1cd406f`.
- Post-merge `Flutter foundation` and `Release Flutter triplet` runs on the exact SHA completed successfully.

## v1.0.33 release verification
Release: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.33`

Assets reread from Releases API:
- `Al-Qahtani-Mobile-v1.0.33.apk` — 55,887,348 bytes — SHA-256 `258f9c0eb540dcbd6d6117287b76ee3839358f72a9b5599c28b27ca91e26ecf5`.
- `Al-Qahtani-TV-v1.0.33.apk` — 55,887,456 bytes — SHA-256 `b4311611ae3d77278c2d868a5b2c21d97322aec5d0f53b9d801c6b504836c583`.
- `Al-Qahtani-iOS-v1.0.33-UNSIGNED.ipa` — 7,902,303 bytes — SHA-256 `d64b5f3f52fa228a3386ce00bab0581541f326eb05a2f608175cc6f765a1946e`.
- `SHA256SUMS.txt` — 290 bytes — SHA-256 `3b47a038ac102c19534ac47d3f23d27f66a5cb71de51714c366b2c9d2cf89b0e`.
- `PROVENANCE.json` — 580 bytes — SHA-256 `613a142864b6ac04673c23c6df512cdc119465bf41fcc449559d04179c53e701`.
- Release triplet workflow run `34926292698`: SUCCESS.
- Flutter foundation post-merge run `34925879149`: SUCCESS.
- Release notes identify Web/PWA preservation, Android Mobile, TV LEANBACK/remote CI verification and iOS UNSIGNED/no-codesign.

## Physical-device P0 evidence
The real-iPhone v1.0.25 `Spider Man Brand New Day` 838.4 MB failure remains `FAILED / PHYSICAL-DEVICE VERIFIED BUG`: Library showed completed ✓, Files did not show it, and tapping did nothing.

v1.0.33 status is `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING`. It must not be promoted until a real iPhone validates: download -> restart -> Library -> tap -> disable network -> internal local playback -> start/seek/pause/resume/duration -> missing-file recovery -> Save to Files/share from local file only.

v1.0.33 strengthens completion semantics: native/background `completed` enters `verifying`; user-visible completed requires explicit final local-file verification. Missing verifier/failure closes as `FINAL_FILE_VERIFICATION_FAILED` rather than a false ✓.

## v1.0.33 storage/download batch
Merged and released:
- background download lifecycle contract and fail-closed final verification;
- `.qahtani-*.part` restart discovery and safe cleanup;
- local-file export boundary with source validation;
- persisted M3U cache/expiry/offline stale-read behavior;
- storage quota accounting and safe cleanup protecting active files;
- deterministic Flutter coverage for background lifecycle, completion verification, resume fixtures and export/storage behavior.

Real native background execution and iOS Files behavior remain DEVICE_REQUIRED_PENDING.

## TMDB fallback state
- Server-side only; no `TMDB_API_KEY` in Flutter/APK/IPA.
- القحطاني/Basri remains primary/default.
- Runtime search/status/details/season foundation is merged.
- Explicit user selector, empty-result `ابحث في المصدر الاحتياطي`, fallback badges and safe playback integration remain pending.
- Matching must prefer direct TMDB/IMDb identity, then title+year+type and season/episode; ambiguity remains fail-closed.

## 27-provider fallback pool
Released server-side foundation:
- exactly 27 adapters; HTTPS/hostname allowlists; opaque TTL refs;
- health/latency/failure/circuit-breaker/ranking;
- bounded probing with MP4/HLS/MPEG-TS/embed classification;
- no provider URLs/names/sessions exposed to Flutter;
- HTTP 200 alone is not playback success;
- MP4/MPEG-TS opaque proxy preserves Range/206/Content-Range/Accept-Ranges.

Pending:
- safe opaque HLS playlist/segment rewriting;
- internal-player fallback consumption;
- bounded next-provider attempts from actual playback failure;
- `playing` evidence before provider-health success.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share local file: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Background download contract: RELEASED v1.0.33; DEVICE REQUIRED for native execution.
4. `.part` discovery/cleanup/resume contract: RELEASED v1.0.33; interrupted physical transfer NOT VERIFIED.
5. Fall 2 native -> internal WebView: code path exists; PHYSICAL-DEVICE NOT VERIFIED.
6. Match runtime playback/failover: baseline exists; live-device playback NOT VERIFIED.
7. Scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
8. Search posters/type/year/dedupe: baseline present.
9. TMDB server-side foundation: MERGED; user-facing selector pending.
10. 27-provider MP4/MPEG-TS proxy: RELEASE VERIFIED; HLS/player/failover pending.
11. Favorites/Continue Watching/Downloads/History: baseline present; physical persistence lifecycle pending.
12. TV LEANBACK/D-Pad/focus: CI VERIFIED on v1.0.33.
13. Web/PWA: preserved; post-merge workflow verification remains part of every release gate.

## UX / safety decisions
- Defects before decoration; no broad rewrite while P0 device evidence is unresolved.
- Primary action first, recovery second; provider/runtime internals stay out of normal UI.
- Arabic RTL, predictable CTA placement, touch targets, TV focus, contrast and navy/black + metallic-gold Q/ق+Play identity are protected.
- A transfer callback is never equivalent to a verified completed download.

## 20 تحسينًا إضافيًا
1. Persistent search-source selector.
2. Empty-search fallback CTA.
3. Movie/series/year filters.
4. Query/source/scroll restoration.
5. Local-only search history suggestions.
6. Continue Watching quick resume.
7. Download verifying/completed/missing/failed states.
8. Download storage summary and safe cleanup.
9. Missing/failed download recovery.
10. Offline-ready badge after file verification.
11. Automatic bounded server recovery.
12. Simple player connection state.
13. Resume prompt from real progress.
14. Quick favorite action.
15. Library sorting.
16. Stable skeleton/loading states.
17. Accessibility/touch target/semantics improvements.
18. TV focus restoration.
19. Simplified grouped settings.
20. Image/cache/memory/cancellation performance budget.

Progress: #7 is materially advanced/released by verifying + fail-closed completion; #8/#9 advanced by quota/cleanup and partial catalog; #11 has server-side direct MP4/MPEG-TS foundation but player-driven/HLS failover remains. Device-only items remain pending regardless of CI.

## Protected regressions
Protect existence/readability/size before ✓, local-only export/playback, `.part` rules, resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, episode_id vs episode_number, score precedence, match failover/logos/Saudi time, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, opaque-ref expiry, RTL, TV focus/LEANBACK and iOS UNSIGNED/no-codesign.

## Blockers / decisions
- No permission blocker known.
- v1.0.33 release publication is complete and verified through Releases API.
- The v1.0.25 iPhone failure remains authoritative until a newer physical retest passes.
- Next product work should remain in one PR and prioritize safe HLS/player failover before exposing TMDB fallback playback broadly.

## أهداف التشغيل التالي
1. Reconfirm post-release Web/PWA health.
   - Check Pages deployment on product SHA.
   - Run/inspect Web smoke, WebKit, CORS, Range/download and Safari evidence.
2. Add safe HLS opaque rewriting.
   - Rewrite playlist/segment URIs server-side.
   - Enforce host/redirect allowlists and opaque segment refs.
   - Test master/media playlists, relative/absolute URIs and Range behavior.
3. Add playback-driven fallback orchestration.
   - Trigger only from real player failure.
   - Bound attempts/time and respect circuit breakers.
   - Record success only after media/playback/playing evidence.
4. Integrate fallback with internal player without URL leakage.
   - Consume opaque refs only.
   - Preserve MP4/HLS/MPEG-TS behavior.
   - Add widget/runtime regression tests.
5. Complete TMDB fallback UX behind safe playback.
   - Keep القحطاني default.
   - Add explicit selector and empty-result CTA.
   - Label fallback results and avoid mixed-source ambiguity.
6. Strengthen long-download lifecycle.
   - Test restart persistence and same-title/episode identity.
   - Verify stalled/failure never becomes completed.
   - Preserve cancel `.part` cleanup and resume Range semantics.
7. Improve Library recovery UX.
   - Clear Arabic missing-file state.
   - One-step remove/retry/export actions.
   - Never expose provider/runtime details.
8. Improve TV focus and accessibility incrementally.
   - Focus restoration after player/library navigation.
   - Semantics/touch-target/contrast checks.
   - Preserve LEANBACK and remote-only navigation.
9. Preserve physical P0 retest readiness.
   - Keep iPhone checklist current.
   - Never mark device verification from CI.
10. Continue small measurable UX improvements.
   - Reduce taps and restore page/search state.
   - Improve skeleton/empty/error states.
   - Track each of the 20 improvements without large rewrites.
