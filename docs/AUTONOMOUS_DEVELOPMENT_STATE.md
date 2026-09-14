# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- `main`: `6c218ba2aa48da164d6b1864d351446faaddaef4` (merged PR #108).
- Open PR: #109 `Run Match runtime on every main SHA`.
- PR #109 branch: `fix-match-main-trigger-109`.
- PR #109 functional head before this state update: `28eed2367271c6baa01321ffe897fa6ea133914e`.
- Product version/build remains `1.0.29+29`.
- Latest verified GitHub Release remains `v1.0.28`, target `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8`.
- v1.0.29 is NOT PUBLISHED.

## Release root-cause chain and current fix
PRs #103-#108 repaired exact release binding, rerun handling, Runtime version alignment, release gate naming, Independent download resolution on every main SHA, and Flutter foundation on every main SHA.

After PR #108 merged, exact-main Flutter foundation run `34787600300` succeeded on `6c218ba2aa48da164d6b1864d351446faaddaef4` and correctly triggered Release run `34787888148`. The release bound to the same SHA/run and passed version validation, but protected-gate polling timed out because `Match runtime` had no run on that exact final-main SHA. The release log repeatedly reported `Missing: ['Match runtime']` with no pending or failed candidate.

Root cause: `.github/workflows/match-runtime.yml` still path-filtered pushes to `main` to `server/**`, `scripts/match_runtime_test.mjs`, or its own workflow file. Workflow/docs-only merges therefore produced no Match runtime check, while Release requires that check on the exact release SHA.

PR #109 fixes the topology without bypassing validation: pull requests remain path-filtered, but every push to `main` runs Match runtime. Its first functional head `28eed2367271c6baa01321ffe897fa6ea133914e` already produced a successful PR Match runtime run `34790569437`; the remaining exact-head PR checks are still completing.

## Physical-device P0 evidence
The user verified on iPhone v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, but Files did not show it and tapping the completed card did nothing. This remains the authoritative historical `FAILED / PHYSICAL-DEVICE VERIFIED BUG` for v1.0.25.

v1.0.26+ contains completed-file verification, local-path enumeration, internal offline playback, missing-file recovery, and local share/export. Status remains `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING` until a newer release is tested on a real iPhone.

## TMDB fallback state
Merged foundation:
- server-side-only TMDB adapter and search/status/details/season APIs;
- timeout/cache/error normalization;
- Arabic locale and adult filtering;
- stable TMDB movie/TV and episode identities;
- Flutter does not contain `TMDB_API_KEY`.

Pending user-complete UX:
- explicit القحطاني / TMDB الاحتياطي source control;
- empty-result CTA `ابحث في المصدر الاحتياطي`;
- TMDB details/season UI;
- no TMDB playback CTA until safe fallback playback hand-off is complete.

## 27-provider fallback pool
Merged:
- exactly 27 server-side provider adapters;
- positive TMDB/season/episode validation;
- HTTPS-only URL generation and hostname allowlists;
- provider templates and upstream URLs remain server-side;
- `ProviderHealthRegistry` scoring, latency, failures and circuit breaker;
- deterministic ranking;
- TTL-bound opaque refs `fallback:<opaque-id>`;
- bounded ref storage/expiry cleanup;
- fallback resolve/next routes;
- success requires explicit playback signal, never HTTP 200 alone;
- failure records and next-provider selection;
- regression tests for URL leakage, expiry, malformed identity/ref, health/circuit behavior and rotation.

Still pending:
- bounded live network probing;
- direct MP4/HLS/MPEG-TS vs embed classification;
- safe opaque-ref hand-off/proxy to internal player;
- real player success/failure evidence;
- automatic in-session next-provider failover.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share local file: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Fall 2 native→internal WebView playback: code path exists; physical-device playback NOT VERIFIED.
4. Long download/resume: regression coverage exists; interrupted physical transfer NOT VERIFIED.
5. Match safe runtime playback/failover: baseline exists; live-device playback NOT VERIFIED.
6. Match scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
7. Search posters/type/year/dedupe: baseline present.
8. TMDB search/details/seasons: MERGED; user-facing source selector pending.
9. 27-provider health/circuit/opaque refs: MERGED; probing/player integration pending.
10. Favorites/Continue Watching/Downloads/History: baseline present; full physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI verified in prior build gates; v1.0.29 release pending.
12. Web/PWA: Pages and Web gates remain protected; final v1.0.29 release-SHA verification pending.

## UX decisions
- Al-Qahtani/Basri stays primary; TMDB is explicit fallback.
- Do not mix primary and fallback result lists by default.
- No provider names, URLs, sessions or technical health details in normal UI.
- No clickable fallback playback until opaque ref → internal player + bounded failover are ready.
- Primary action first, recovery action second; avoid technical button clutter.
- Preserve Arabic RTL, navy/black + metallic gold identity, readable contrast, thumb reach, and TV visible focus.
- No large page rewrites before navigation/widget/smoke evidence.

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

Current completion: #11 has registry/health/opaque-ref foundation but is not user-complete. Local share/export and offline playback exist in code but still require physical-device recheck.

## Protected regressions
Protect completed-file verification before ✓, local-only export/playback, `.part` rules, resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, score precedence, match failover/logos/Saudi time, episode_id vs episode_number, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, media-ref expiry, Arabic RTL, TV LEANBACK/D-Pad/focus, and iOS UNSIGNED/no-codesign labeling.

## CI / delivery evidence
- PR #108 merged as `6c218ba2aa48da164d6b1864d351446faaddaef4`.
- Exact-main Flutter foundation run `34787600300`: SUCCESS on `6c218ba2...` and produced the release trigger.
- Release run `34787888148`: FAILURE only at protected-gate polling; exact Flutter-run binding and version validation succeeded.
- Release failure evidence: `Match runtime` was the sole missing protected gate on `6c218ba2...`.
- PR #109 functional head `28eed2367271c6baa01321ffe897fa6ea133914e`.
- PR #109 Match runtime run `34790569437`: SUCCESS.
- On that functional head, Web smoke, Original Basri download/player, Media reference expiry, Remote CORS, Content runtime, CORS boundary and Trusted download filename completed SUCCESS; Remote movie playback, Live provider and Mobile WebKit were still running when this state update was prepared.
- Latest Release API still returns v1.0.28; v1.0.29 remains absent.

## Release state
- v1.0.28: RELEASE VERIFIED with Mobile APK + TV APK + iOS UNSIGNED IPA + SHA256SUMS + PROVENANCE.
- v1.0.29: RELEASE NOT PUBLISHED. Current root cause is fixed in PR #109, but final exact-head CI, merge, post-merge Match/Flutter/download gates and Release API verification remain pending.

## أهداف التشغيل التالي
1. Finish PR #109 exact-head CI.
   - Require every triggered check to complete green on final head.
   - Inspect failures from logs and fix only on the same branch.
   - Merge only when mergeable and final-head checks are green.
2. Verify final-main trigger topology.
   - Confirm Flutter foundation runs on merge SHA.
   - Confirm Independent download resolution runs on same SHA.
   - Confirm Match runtime runs on same SHA.
3. Publish and verify v1.0.29.
   - Require one-SHA Mobile APK, TV APK and iOS UNSIGNED IPA.
   - Verify SHA256SUMS + PROVENANCE.
   - Re-read Release API, target SHA, asset sizes/digests/downloadability.
4. Verify Web/PWA on release SHA.
   - Pages + Web smoke.
   - Mobile WebKit + CORS.
   - Range/download/Safari regressions.
5. Add bounded provider probing.
   - Per-provider timeout and total budget.
   - Separate reachability from playable evidence.
   - Never promote HTTP 200 alone to success.
6. Add media/embed classification.
   - Detect MP4/HLS/MPEG-TS safely.
   - Classify embed HTML separately.
   - Reject unsupported responses fail-closed.
7. Connect opaque refs to internal player.
   - Keep upstream targets server-side.
   - Preserve Range/206 for direct media.
   - Add origin-restricted hand-off.
8. Add player evidence and automatic failover.
   - Require playing/media signal for success.
   - Report bounded failures server-side.
   - Rotate after real playback failure.
9. Add TMDB fallback UX after safe playback.
   - Keep القحطاني default.
   - Add explicit fallback CTA/source selector.
   - Clearly label fallback results without mixed lists.
10. Continue P0 physical validation tracking.
   - Completed download → offline local player.
   - Verify seek/pause/resume/duration/missing-file recovery.
   - Verify Save to Files/share from local file only.
