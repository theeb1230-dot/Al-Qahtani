# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- `main`: `d6bff2d3af0e74ce1fbe310e4f841875736121bb` (merged PR #106).
- Open PR: pending creation for branch `fix/release-path-gate-107`.
- Functional fix commit on that branch before this state update: `70bb9cdd2ac7c876eaabddd229e8f3b358ba1926`.
- Product version/build remains `1.0.29+29`.
- Latest verified GitHub Release remains `v1.0.28`, target `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8`.
- v1.0.29 is NOT PUBLISHED.

## Release root cause and current fix
PRs #103-#106 repaired exact product/run binding, rerun handling, Runtime version alignment, and runtime-gate naming. On final main SHA `d6bff2d3af0e74ce1fbe310e4f841875736121bb`, Flutter foundation run `34781535343` succeeded and the protected Web/runtime workflows that actually ran were green, including `Deploy GitHub Pages`, `Remote runtime smoke`, `Remote movie playback smoke`, `Remote news smoke`, `Live provider smoke`, `Mobile WebKit smoke`, `Remote CORS smoke`, `Original Basri download contract`, `Trusted download filename`, and other exact-SHA gates.

Release run `34781837418` still failed in `Wait for protected Web and runtime gates on exact release commit`. The newly confirmed root cause is trigger topology: release requires `Independent download resolution` on the exact release SHA, while `.github/workflows/download-resolution.yml` only ran on main pushes touching `server/**`, `scripts/download_resolution_test.mjs`, or itself. PR #106 changed the release workflow only, so the required download-resolution workflow did not run at all on the release SHA. The release job therefore waited until its bounded poll timed out even though the application/build gates were healthy.

Current fix on `fix/release-path-gate-107`: keep PR path filtering for focused pull-request CI, but make `Independent download resolution` run on every push to `main`. This preserves exact-SHA release evidence and avoids weakening or bypassing the download gate.

## Physical-device P0 evidence
The user verified on iPhone v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, but Files did not show it and tapping the completed card did nothing. This remains the authoritative historical PHYSICAL-DEVICE VERIFIED BUG for v1.0.25.

v1.0.26+ contains completed-file verification, local-path enumeration, internal offline playback, missing-file recovery, and local share/export. Status remains FIXED IN CODE / CI VERIFIED and PHYSICAL-DEVICE RECHECK PENDING until a newer release is tested on a real iPhone.

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
11. TV LEANBACK/D-Pad/focus: CI verified in prior release/build gates; v1.0.29 release pending.
12. Web/PWA: exact-main `Deploy GitHub Pages` succeeded on `d6bff2d3...`; release alignment still pending v1.0.29.

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
- main Flutter foundation run `34781535343`: SUCCESS on `d6bff2d3af0e74ce1fbe310e4f841875736121bb`.
- main Pages workflow `Deploy GitHub Pages` run `34781535366`: SUCCESS on the same SHA.
- main `Remote runtime smoke` run `34781535307`: SUCCESS on the same SHA.
- main `Remote movie playback smoke` run `34781535341`: SUCCESS on the same SHA.
- main `Original Basri download contract` run `34781535353`: SUCCESS on the same SHA.
- Release run `34781837418`: FAILURE at protected-gate waiting because `Independent download resolution` had no exact-SHA run due its main-push `paths` filter.
- Latest release API still returns v1.0.28 as latest published release.

## Release state
- v1.0.28: RELEASE VERIFIED with Mobile APK + TV APK + iOS UNSIGNED IPA + SHA256SUMS + PROVENANCE.
- v1.0.29: RELEASE NOT PUBLISHED. Current blocker is fixed in branch `fix/release-path-gate-107`; exact-head PR CI, merge, post-merge exact-SHA download gate, and release verification remain pending.

## أهداف التشغيل التالي
1. Finish the single PR for the path-scoped release gate.
   - Verify `Independent download resolution` runs and passes on the PR head.
   - Inspect every exact-head failure from logs.
   - Fix only on the same branch.
   - Merge only when required checks are green.
2. Verify the post-merge release trigger topology.
   - Confirm Flutter foundation succeeds on final main SHA.
   - Confirm `Independent download resolution` now runs on that same SHA.
   - Confirm every protected gate is success on exact SHA.
3. Publish and verify v1.0.29.
   - Mobile APK, TV APK, iOS UNSIGNED IPA from one Flutter run.
   - Verify SHA256SUMS + PROVENANCE.
   - Re-read Release API, target SHA, sizes/digests/downloadability.
4. Verify Web/PWA on the release SHA.
   - Pages deployment and Web smoke.
   - Mobile WebKit/CORS.
   - Range/download/Safari regressions.
5. Add bounded provider probing.
   - Per-provider timeout and total budget.
   - Separate reachability from playable evidence.
   - Record latency/failure without HTTP-200 promotion.
6. Add media/embed classification.
   - Detect MP4/HLS/MPEG-TS safely.
   - Classify embed HTML separately.
   - Reject unsupported/suspicious responses fail-closed.
7. Connect opaque refs to internal player.
   - Keep upstream targets server-side.
   - Preserve Range/206 for direct media.
   - Add origin-restricted embed/media hand-off.
8. Add real player evidence and automatic failover.
   - Require playing/media signal for success.
   - Report bounded failures server-side.
   - Rotate after real playback failure.
9. Add TMDB fallback UX only after playback is safe.
   - Keep القحطاني default.
   - Add explicit fallback CTA/source selector.
   - Mark fallback results clearly without mixed lists.
10. Continue P0 physical validation tracking.
   - Completed download → offline local player.
   - Verify seek/pause/resume/duration/missing-file recovery.
   - Verify Save to Files/share from local file only.
