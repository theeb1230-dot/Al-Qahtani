# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- `main`: `18b9ff0e6d582f31894b7fbee6030e50de5f7738` (merged PR #107).
- Open PR: #108 `Guarantee Flutter release build on every main SHA`.
- PR #108 branch: `fix/flutter-main-release-trigger-108`.
- PR #108 functional head before this state update: `f4935b7025cbfd0f04bb4552e89a1eea60193d67`.
- Product version/build remains `1.0.29+29`.
- Latest verified GitHub Release remains `v1.0.28`, target `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8`.
- v1.0.29 is NOT PUBLISHED.

## Release root cause chain and current fix
PRs #103-#106 repaired exact product/run binding, rerun handling, Runtime version alignment, and the runtime-gate workflow name. Release run `34781837418` on `d6bff2d3af0e74ce1fbe310e4f841875736121bb` then exposed a trigger-topology defect: `Independent download resolution` was required on the exact release SHA but its main-push trigger was path-filtered. PR #107 fixed that by keeping pull-request path filtering while running `Independent download resolution` on every push to `main`.

PR #107 exact-head checks were green and it merged as `18b9ff0e6d582f31894b7fbee6030e50de5f7738`. On that final main SHA, `Independent download resolution` run `34785135376` completed SUCCESS, proving the exact-SHA gate now exists after merge.

A second trigger-topology defect then became visible: `Flutter foundation` itself was also path-filtered on pushes to `main`. Since the release workflow is triggered by `workflow_run` completion of `Flutter foundation`, a workflow/docs-only merge such as #107 could never start the release chain on its final main SHA. PR #108 fixes this without bypassing any build or verification: pull requests remain path-filtered, but every push to `main` runs Flutter foundation, producing Mobile APK + TV APK + iOS UNSIGNED IPA and a trustworthy release trigger for the exact main SHA.

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
12. Web/PWA: Pages workflow was green on prior exact-main release candidates; final v1.0.29 release-SHA verification pending.

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
- main Flutter foundation run `34781535343`: SUCCESS on prior candidate `d6bff2d3af0e74ce1fbe310e4f841875736121bb`.
- main Pages run `34781535366`: SUCCESS on `d6bff2d3...`.
- Release run `34781837418`: FAILURE at protected-gate polling because `Independent download resolution` had no exact-SHA run under the old push path filter.
- PR #107 final exact-head checks: no failures/in-progress before merge.
- PR #107 merged as `18b9ff0e6d582f31894b7fbee6030e50de5f7738`.
- main `Independent download resolution` run `34785135376`: SUCCESS on `18b9ff0e6d582f31894b7fbee6030e50de5f7738`.
- No `Flutter foundation` run was created on `18b9ff0e...` because its main-push trigger remained path-filtered; this is the blocker fixed by PR #108.
- Latest Release API still returned v1.0.28 before PR #108.

## Release state
- v1.0.28: RELEASE VERIFIED with Mobile APK + TV APK + iOS UNSIGNED IPA + SHA256SUMS + PROVENANCE.
- v1.0.29: RELEASE NOT PUBLISHED. Current blocker is addressed in PR #108; exact-head Flutter CI, merge, post-merge exact-SHA Flutter/download gates, release publication and Release API verification remain pending.

## أهداف التشغيل التالي
1. Finish PR #108 exact-head CI.
   - Require Flutter analyze/tests + Mobile APK + TV APK + iOS UNSIGNED build verification.
   - Inspect any failure from logs and fix only on the same branch.
   - Merge only on final exact-head green.
2. Verify final-main trigger topology.
   - Confirm Flutter foundation runs on the merge SHA.
   - Confirm Independent download resolution runs on the same SHA.
   - Confirm release workflow is triggered from that Flutter run.
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
