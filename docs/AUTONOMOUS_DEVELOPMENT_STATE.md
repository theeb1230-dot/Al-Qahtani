# Autonomous Development State

## Source of truth
GitHub is authoritative. The preserved original archive, live Runtime behavior, and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- `main`: `63f2c46253848a3a6e8f9c4aff10f31fad48d983`.
- Latest merged product PR: #100 `Add server-side TMDB fallback search foundation`.
- Latest verified release: `v1.0.27`, target `63f2c46253848a3a6e8f9c4aff10f31fad48d983`.
- Release v1.0.27 contains Mobile APK, TV APK, iOS UNSIGNED IPA, `SHA256SUMS.txt`, and `PROVENANCE.json`.
- Current development branch: `feat/tmdb-search-ui-fallback-101`.
- No open PR existed at the start of this run. PR creation for this branch hit a transient GitHub connector 502 twice; retry next run before opening any other PR.
- Development version/build on this branch: `1.0.28+28`; Runtime `PRODUCT_VERSION`: `1.0.28`.
- Web/PWA remains GitHub Pages and is not replaced by Flutter Web.

## Physical-device P0 evidence
The user verified on iPhone v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, but searching Files did not show it and tapping the completed card did nothing. This remains the authoritative historical PHYSICAL-DEVICE VERIFIED BUG for v1.0.25.

v1.0.26+ includes completed-file verification, local-path enumeration, internal offline playback, missing-file recovery, and local share/export. Those changes are FIXED IN CODE / CI VERIFIED only and remain PHYSICAL-DEVICE RECHECK PENDING.

## TMDB fallback state
Implemented and merged in v1.0.27:
- server-side-only TMDB adapter and search/status/details/season APIs;
- bounded timeout/cache/error normalization;
- Arabic locale and adult filtering;
- stable `tmdb:movie:{id}` / `tmdb:tv:{id}` identities and stable episode identity;
- Flutter client boundary methods without shipping the TMDB credential.

Still pending user-complete UI:
- explicit القحطاني / TMDB الاحتياطي source control;
- empty-result CTA `ابحث في المصدر الاحتياطي`;
- TMDB details/season UI;
- no TMDB playback button until safe opaque fallback playback exists.

## 27-provider fallback pool
Current branch now adds `server/fallback-providers.mjs` with all 27 provider templates supplied by the user, server-side only.

Implemented in this branch:
- exact 27-provider registry with stable internal IDs;
- validated positive integer TMDB/season/episode substitution;
- HTTPS-only URL generation and template-derived hostname allowlist;
- provider templates remain private to Runtime; public listing excludes raw templates/URLs;
- reuse of the existing `ProviderHealthRegistry` for success/failure/latency/circuit-breaker scoring;
- playback-success recording can carry container/Range/Safari capability evidence;
- two consecutive failures open a bounded cooldown circuit in the pool wrapper;
- deterministic ranking with configured order as a tie-breaker;
- `scripts/fallback_provider_registry_test.mjs` checks count, URL construction, invalid identity rejection, circuit opening, and health promotion;
- `npm check` now runs the new registry test.

Not implemented yet:
- network probing of the 27 providers;
- embed/media extraction;
- opaque fallback playback refs;
- real playback signal validation;
- automatic failover during user playback.

Important rule: HTTP 200 is never promoted to playback success by itself.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Fall 2 native→internal WebView playback: code path exists; physical-device playback NOT VERIFIED.
4. Long download/resume: regression coverage exists; interrupted physical transfer NOT VERIFIED.
5. Match safe runtime playback/failover: baseline exists; live device playback NOT VERIFIED.
6. Match scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
7. Search posters/type/year/dedupe: baseline present.
8. TMDB search/details/seasons: MERGED in v1.0.27; UI fallback selector pending.
9. 27-provider registry: IMPLEMENTED IN CURRENT BRANCH; active playback resolver pending.
10. Favorites/Continue Watching/Downloads/History: baseline present; full device persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI baseline preserved; physical TV recheck pending.
12. Web/PWA: preserve Pages deployment and existing browser behavior.

## UX decisions
- Basri/Al-Qahtani remains the default search and playback path.
- TMDB is explicit fallback, not a silent replacement.
- Do not mix Basri and TMDB results initially.
- Do not expose provider names, URLs, sessions, or technical health details to normal UI.
- Do not create clickable fallback playback cards before opaque playback resolution is ready.
- Mobile actions stay thumb-reachable; TV controls stay D-Pad focusable with visible focus.
- Preserve Arabic RTL, navy/black + metallic-gold identity, predictable back behavior, and readable contrast.

## 20 تحسينًا إضافيًا
1. Search source selector with persistent preference.
2. Empty-search fallback CTA.
3. Search filters for movie/series/year.
4. Search query/source/scroll restore.
5. Local-only search history suggestions.
6. Continue Watching quick resume row.
7. Download integrity states: verifying/completed/missing/failed.
8. Download storage summary and safe cleanup.
9. Download retry/recovery for missing/failed files.
10. Offline-ready badge for verified local files.
11. Automatic bounded server recovery.
12. Simple player connection state.
13. Player resume prompt from real playback progress.
14. Quick favorite action on cards/details.
15. Library sorting.
16. Skeleton/loading states with stable geometry.
17. Accessible typography/touch targets/semantics.
18. TV focus restoration after details/player.
19. Simplified grouped settings.
20. Performance budget for images/cache/memory/cancellation.

## Protected regressions
Protect download verification before ✓, local-only export/playback, `.part` rules, stable resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, match failover/logos/Saudi time, authoritative score precedence, episode_id vs episode_number, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, media-ref expiry, Arabic RTL, TV LEANBACK/D-Pad/focus, and iOS UNSIGNED/no-codesign labeling.

## Release state
- v1.0.27: RELEASE VERIFIED on main commit `63f2c46253848a3a6e8f9c4aff10f31fad48d983`.
- v1.0.28: NOT PUBLISHED. Current branch contains product/runtime code changes and must go through one PR, exact-head CI, merge, triplet release, Pages verification, and release API re-read.

## أهداف التشغيل التالي
1. Open/confirm the single PR for `feat/tmdb-search-ui-fallback-101` after transient GitHub 502 clears.
   - Verify no other PR is open first.
   - Keep all work on this branch only.
   - Record exact PR/head SHA.
2. Close exact-head CI for the provider-registry branch.
   - Inspect every required workflow.
   - Fetch failure logs and fix root cause on the same branch.
   - Re-run only failed/flaky gates where appropriate.
3. Add opaque fallback playback references.
   - Never return raw provider URLs.
   - Bind refs to provider/content identity with TTL.
   - Reject unknown/expired refs fail-closed.
4. Build bounded provider probing.
   - Separate reachability from playback success.
   - Record latency/failure without promoting HTTP 200 alone.
   - Enforce short timeouts and circuit breaker.
5. Add media/embed classification for fallback providers.
   - Direct MP4/HLS/MPEG-TS through Runtime proxy.
   - Keep embeds internal and origin-restricted.
   - Reject unsupported containers clearly.
6. Add automatic next-provider failover.
   - Rank by health score.
   - Skip open circuits.
   - Stop after bounded attempts.
7. Add user-facing optional TMDB search UI only when fallback path is safe.
   - Keep القحطاني default.
   - Add explicit source selector and empty-result CTA.
   - Mark results with `احتياطي` only.
8. Recheck download P0 when new physical evidence is available.
   - Tap completed item → local player.
   - Offline seek/pause/resume/duration.
   - Save/share local file only.
9. Preserve four-surface gates.
   - Pages/WebKit/CORS/Range/Download smokes.
   - Mobile APK/TV APK/iOS UNSIGNED IPA.
   - TV LEANBACK/D-Pad/focus and no-codesign checks.
10. Release v1.0.28 only after exact-head proof.
   - Merge only when all required CI is green.
   - Verify triplet hashes/provenance and Pages.
   - Re-read Releases API before declaring RELEASE VERIFIED.
