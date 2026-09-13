# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- `main`: `66e919245d4501428c7a4dbd4a76a47daaa6fa9b` (merged PR #104).
- Open PR: #105 `Fix exact release commit binding`.
- PR #105 branch: `fix/release-gate-reruns-104`.
- PR #105 head before this state update: `ced9c952c47d81b3ca5d80a65fd6204c5266eb07`.
- Product version/build remains `1.0.29+29`.
- Latest verified GitHub Release remains `v1.0.28`, target `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8`.
- v1.0.29 is NOT PUBLISHED.

## Release root cause and fix
The post-merge Flutter foundation run `34769363756` succeeded on `66e919245d4501428c7a4dbd4a76a47daaa6fa9b`, but Release run `34769649598` resolved `SOURCE_SHA` backward to `ee8bc98ba02421f753cb4ff313bdb174bcd66b15` solely because that was the last commit that changed `flutter_app/pubspec.yaml`.

That old SHA cannot satisfy the current protected `Content runtime` gate because the Runtime version correction landed later. Release run `34769649598` therefore failed at `Wait for protected Web and runtime gates` with `Content runtime:failure`. Rerunning that old SHA cannot fix the contract mismatch.

PR #105 changes the invariant: the exact successful main-push `Flutter foundation` run that triggers Release is the release source. `SOURCE_SHA = TRIGGER_SHA` and `SOURCE_RUN_ID = TRIGGER_RUN_ID`, with fail-closed checks for workflow name, push event, main branch, completed/success status, and exact SHA equality. Mobile APK, TV APK, iOS UNSIGNED IPA, protected gates, provenance and GitHub Release target must therefore all refer to the same commit.

For an existing tag, workflow/docs-only changes may safely skip republishing only when the non-doc/non-workflow product tree is unchanged. Product changes without a version bump fail closed.

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
11. TV LEANBACK/D-Pad/focus: CI verified in released builds; v1.0.29 release pending.
12. Web/PWA: maintained on GitHub Pages; release alignment pending v1.0.29.

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
- main Flutter foundation run `34769363756`: SUCCESS on `66e919245d4501428c7a4dbd4a76a47daaa6fa9b`.
- Release run `34769649598`: FAILURE because old source resolution selected `ee8bc98...`; exact log failure was `Content runtime:failure`.
- Latest release API still returns v1.0.28 as latest published release.
- PR #105 exact-head CI must be green before merge.

## Release state
- v1.0.28: RELEASE VERIFIED with Mobile APK + TV APK + iOS UNSIGNED IPA + SHA256SUMS + PROVENANCE.
- v1.0.29: RELEASE NOT PUBLISHED. Root cause is fixed in PR #105 but PR exact-head CI/merge and post-merge release verification remain pending.

## أهداف التشغيل التالي
1. Finish PR #105 exact-head CI.
   - Inspect every failing job/log.
   - Fix only on the same branch.
   - Merge only after all required checks are green.
2. Verify post-merge exact-release SHA.
   - Confirm Flutter foundation success on final main SHA.
   - Confirm protected Web/runtime gates on the same SHA.
   - Confirm artifacts originate from that exact Flutter run.
3. Publish and verify v1.0.29.
   - Mobile APK, TV APK, iOS UNSIGNED IPA.
   - SHA256SUMS + PROVENANCE.
   - Re-read Release API, target SHA, asset sizes/digests/downloadability.
4. Verify Pages on release SHA.
   - Pages deploy/smoke/WebKit/CORS.
   - Range/download/Safari regressions.
5. Add bounded provider probing.
   - Per-provider timeout and total budget.
   - Reachability separate from playable evidence.
   - Health/latency recording without HTTP-200 promotion.
6. Add media/embed classification.
   - Detect MP4/HLS/MPEG-TS safely.
   - Classify embed HTML separately.
   - Reject unsupported/suspicious responses fail-closed.
7. Connect opaque refs to internal player.
   - Keep targets server-side.
   - Preserve Range/206 for direct media.
   - Add origin-restricted embed/media hand-off.
8. Add real player evidence and failover.
   - playing/media signal required for success.
   - bounded failure report.
   - rotate automatically after real failure.
9. Add TMDB fallback UX after playback path is safe.
   - القحطاني default.
   - explicit fallback CTA/source selector.
   - fallback label, no mixed lists.
10. Continue P0 physical validation tracking.
   - completed download → offline local player.
   - seek/pause/resume/duration/missing-file recovery.
   - Save to Files/share local file only.
