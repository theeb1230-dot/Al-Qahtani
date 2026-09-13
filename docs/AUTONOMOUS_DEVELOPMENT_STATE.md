# Autonomous Development State

## Source of truth
GitHub is authoritative. The preserved original archive, live Runtime behavior, and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Latest product commit on `main`: `ee8bc98ba02421f753cb4ff313bdb174bcd66b15`.
- Latest merged product PR: #102 `Add opaque fallback playback resolver`.
- PR #102 final head: `f180c307183fce7c616f3f0b4a5f13f0b515dd39`; PR exact-head workflows completed without recorded failures before merge.
- Product version/build: `1.0.29+29`.
- Previous verified release: `v1.0.28`, target `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8`.
- v1.0.29 post-merge CI is running on product commit `ee8bc98ba02421f753cb4ff313bdb174bcd66b15`; Release tag was not yet present at the end of this run.

## Physical-device P0 evidence
The user verified on iPhone v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, but searching Files did not show it and tapping the completed card did nothing. This remains the authoritative historical PHYSICAL-DEVICE VERIFIED BUG for v1.0.25.

v1.0.26+ includes completed-file verification, local-path enumeration, internal offline playback, missing-file recovery, and local share/export. Those changes remain FIXED IN CODE / CI VERIFIED only and are PHYSICAL-DEVICE RECHECK PENDING until a newer release is tested on a real iPhone.

## TMDB fallback state
Merged since v1.0.27:
- server-side-only TMDB adapter and search/status/details/season APIs;
- bounded timeout/cache/error normalization;
- Arabic locale and adult filtering;
- stable `tmdb:movie:{id}` / `tmdb:tv:{id}` identities and stable episode identity;
- Flutter boundary methods without shipping `TMDB_API_KEY` in APK/IPA.

Still pending user-complete UI:
- explicit القحطاني / TMDB الاحتياطي source control;
- empty-result CTA `ابحث في المصدر الاحتياطي`;
- TMDB details/season UI;
- no TMDB playback CTA until safe fallback playback resolution is user-complete.

## 27-provider fallback pool
Merged in v1.0.28:
- exact 27-provider server-side registry with stable internal IDs;
- positive integer validation for TMDB/season/episode substitution;
- HTTPS-only URL generation and template-derived hostname allowlist;
- provider templates remain private to Runtime; public metadata excludes raw templates/URLs;
- reuse of `ProviderHealthRegistry` for success/failure/latency/circuit-breaker scoring;
- deterministic ranking with configured order as tie-breaker;
- two consecutive failures open a bounded cooldown circuit in the pool wrapper;
- regression coverage for count, construction, invalid identity rejection, circuit opening, and health promotion.

Merged in v1.0.29 product commit:
- TTL-bound opaque fallback playback references (`fallback:<opaque-id>`);
- provider URLs stored server-side only and omitted from public resolve/next responses;
- canonical movie/series episode identity validation before provider substitution;
- bounded ref storage with expiry cleanup;
- fallback status/resolve/next Runtime routes;
- explicit `playbackSignal` requirement before provider success can be recorded;
- failed provider recording followed by next available provider selection;
- regression tests for URL non-leakage, expiry, malformed identity/ref rejection, playback-signal gating, and provider rotation.

Not implemented yet:
- real bounded network probing of provider targets;
- embed/media extraction and classification;
- safe proxy/hand-off from opaque fallback ref into internal player;
- real player event reporting to success/failure endpoints;
- automatic next-provider failover during active user playback.

Important invariant: HTTP 200 is never promoted to playback success by itself.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Fall 2 native→internal WebView playback: code path exists; physical-device playback NOT VERIFIED.
4. Long download/resume: regression coverage exists; interrupted physical transfer NOT VERIFIED.
5. Match safe runtime playback/failover: baseline exists; live device playback NOT VERIFIED.
6. Match scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
7. Search posters/type/year/dedupe: baseline present.
8. TMDB search/details/seasons: MERGED; user-facing fallback selector pending.
9. 27-provider registry/health/circuit + opaque refs: MERGED; active network probe/player integration pending.
10. Favorites/Continue Watching/Downloads/History: baseline present; full physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI VERIFIED on v1.0.28; v1.0.29 post-merge build pending at end of run.
12. Web/PWA: v1.0.29 post-merge Pages/Web checks pending at end of run.

## UX decisions
- Basri/Al-Qahtani remains the default search and playback path.
- TMDB is explicit fallback, not a silent replacement.
- Do not mix Basri and TMDB results initially.
- Do not expose provider names, URLs, sessions, or technical health details to normal UI.
- Do not create clickable fallback playback cards before opaque ref → internal player hand-off and bounded failover are ready.
- Mobile actions stay thumb-reachable; TV controls stay D-Pad focusable with visible focus.
- Preserve Arabic RTL, navy/black + metallic-gold identity, predictable back behavior, and readable contrast.
- Prefer fewer clear CTAs over technical controls; primary content/action first, recovery actions second.

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

Current completion status: registry/health/opaque-ref foundation contributes materially to #11, but automatic recovery is not yet user-complete. Existing local share/export and verified local-file playback support download UX but still need physical-device recheck.

## Protected regressions
Protect download verification before ✓, local-only export/playback, `.part` rules, stable resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, match failover/logos/Saudi time, authoritative score precedence, episode_id vs episode_number, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, media-ref expiry, Arabic RTL, TV LEANBACK/D-Pad/focus, and iOS UNSIGNED/no-codesign labeling.

## CI / delivery evidence
- PR #102 exact-head SHA: `f180c307183fce7c616f3f0b4a5f13f0b515dd39`.
- PR #102 merged to product commit: `ee8bc98ba02421f753cb4ff313bdb174bcd66b15`.
- 15 PR workflow runs were present; no failure/skipped/in-progress/queued conclusion remained in the final PR status snapshot used before merge.
- Post-merge workflows started on `ee8bc98ba02421f753cb4ff313bdb174bcd66b15`; some remained queued/in-progress at end of run.
- `v1.0.29` release API returned 404 at end of run, so release is not yet verified.

## Release state
- v1.0.28: RELEASE VERIFIED on product commit `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8` with Mobile APK + TV APK + iOS UNSIGNED IPA + SHA256SUMS + provenance.
- v1.0.29: RELEASE NOT PUBLISHED/NOT VERIFIED at end of this run because post-merge CI was still running and the tag did not yet exist.

## أهداف التشغيل التالي
1. Re-open from actual GitHub state.
   - Confirm product commit and docs-only commits separately.
   - Check post-merge workflow conclusions for `ee8bc98...`.
   - Verify or diagnose v1.0.29 Release triplet.
2. Build bounded provider probing.
   - Short per-provider timeout and total resolution budget.
   - Separate reachability from playable evidence.
   - Record latency/failure without promoting HTTP 200 to success.
3. Add media/embed classification.
   - Detect direct MP4/HLS/MPEG-TS by headers/bytes where possible.
   - Classify embed HTML separately.
   - Reject suspicious/unsupported responses fail-closed.
4. Connect opaque refs to internal playback hand-off.
   - Keep target URL server-side.
   - Add origin-restricted embed or media proxy path.
   - Preserve Range/206 for direct media.
5. Add player event evidence endpoints.
   - Accept only opaque ref plus bounded success/failure evidence.
   - Require playing/media signal before success.
   - Rotate provider after real failure.
6. Connect fallback resolution to TMDB result UI only after safe hand-off exists.
   - Movie: tmdb_id.
   - Episode: tmdb_id + season + episode.
   - Keep Basri episode_id separate.
7. Add optional TMDB search UX.
   - Keep القحطاني default.
   - Add explicit source selector and `ابحث في المصدر الاحتياطي` recovery CTA.
   - Mark fallback results as `احتياطي` and keep result lists separate.
8. Improve recovery UX.
   - Simple connecting/retrying/fallback states.
   - Never display provider internals.
   - Preserve RTL, thumb reach and TV focus.
9. Continue P0 physical validation tracking.
   - Completed download → offline local player on newer iPhone release.
   - Seek/pause/resume/duration/missing file recovery.
   - Save to Files/share local file only.
10. Preserve four-surface release discipline.
   - Exact product commit Pages/WebKit/CORS/Range/Download gates.
   - Android Mobile + Android TV + iOS UNSIGNED from same version/commit.
   - Re-read Release API and verify assets/digests before declaring success.
