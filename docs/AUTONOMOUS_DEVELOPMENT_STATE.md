# Autonomous Development State

## Source of truth
GitHub is authoritative. The preserved original archive, live Runtime behavior, and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Product commit on `main`: `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8`.
- Latest merged product PR: #101 `Add guarded fallback provider registry`.
- PR #101 final head: `5656b4dc09e90dd49fdbb888430bde413491c594`; exact-head CI passed before merge.
- No open PR remains after #101 merge.
- Product version/build: `1.0.28+28`; Runtime `PRODUCT_VERSION`: `1.0.28`.
- Latest verified release: `v1.0.28`, target `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8`.
- Release workflow: `Release Flutter triplet` run `34750628111`, success.
- Post-merge Flutter foundation run: `34750402054`, success for analyze/tests, Android Mobile, Android TV, and iOS UNSIGNED/no-codesign.
- GitHub Pages deployment on the product commit succeeded; Pages remains Web/PWA and is not replaced by Flutter Web.

## Release v1.0.28
- Android Mobile: `Al-Qahtani-Mobile-v1.0.28.apk`, 55,887,352 bytes, SHA-256 `7ea7f2fece0c64352352695a055c0219f7184e65010f16977d16d8a063de62d9`.
- Android TV: `Al-Qahtani-TV-v1.0.28.apk`, 55,887,456 bytes, SHA-256 `8dd73dad7a12240a843c93d615d046965bffde77c351e4213f77852c6e8c8f50`.
- iOS: `Al-Qahtani-iOS-v1.0.28-UNSIGNED.ipa`, 7,896,070 bytes, SHA-256 `d007152a480b745336df85331185b7da8c8811e4ab2105d1ceff3642e98e6ac9`.
- `SHA256SUMS.txt` and `PROVENANCE.json` are present and non-empty.
- iOS package is explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.

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
- no TMDB playback CTA until safe opaque fallback playback exists.

## 27-provider fallback pool
Merged in v1.0.28:
- exact 27-provider server-side registry with stable internal IDs;
- positive integer validation for TMDB/season/episode substitution;
- HTTPS-only URL generation and template-derived hostname allowlist;
- provider templates remain private to Runtime; public metadata excludes raw templates/URLs;
- reuse of `ProviderHealthRegistry` for success/failure/latency/circuit-breaker scoring;
- deterministic ranking with configured order as tie-breaker;
- two consecutive failures open a bounded cooldown circuit in the pool wrapper;
- playback-success recording can carry container/Range/Safari capability evidence;
- regression test `scripts/fallback_provider_registry_test.mjs` verifies count, construction, invalid identity rejection, circuit opening, and health promotion;
- `npm check` includes the registry regression.

Not implemented yet:
- network probing of the 27 providers;
- embed/media extraction and classification;
- opaque fallback playback refs;
- real playback signal validation;
- automatic next-provider failover during user playback.

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
9. 27-provider registry/health/circuit foundation: MERGED in v1.0.28; active playback resolver pending.
10. Favorites/Continue Watching/Downloads/History: baseline present; full physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI VERIFIED on v1.0.28; physical TV recheck pending.
12. Web/PWA: Pages and protected browser/runtime gates passed on the v1.0.28 product commit.

## UX decisions
- Basri/Al-Qahtani remains the default search and playback path.
- TMDB is explicit fallback, not a silent replacement.
- Do not mix Basri and TMDB results initially.
- Do not expose provider names, URLs, sessions, or technical health details to normal UI.
- Do not create clickable fallback playback cards before opaque playback resolution is ready.
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

Current completion status: registry/health foundation contributes to #11 but automatic recovery is not yet user-complete. Existing local share/export and verified local-file playback support the broader download UX but still need physical-device recheck. Remaining improvements must be delivered incrementally with regression gates.

## Protected regressions
Protect download verification before ✓, local-only export/playback, `.part` rules, stable resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, match failover/logos/Saudi time, authoritative score precedence, episode_id vs episode_number, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, media-ref expiry, Arabic RTL, TV LEANBACK/D-Pad/focus, and iOS UNSIGNED/no-codesign labeling.

## CI / delivery evidence
- PR #101 exact-head checks: all required checks completed successfully before merge.
- Main Flutter foundation: run `34750402054`, all four jobs successful.
- Release triplet: run `34750628111`, success.
- Pages: product commit `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8` deployed successfully.
- Release API was re-read after publication and confirmed tag `v1.0.28`, exact target commit, and all five expected non-empty assets.

## Release state
- v1.0.27: RELEASE VERIFIED on `63f2c46253848a3a6e8f9c4aff10f31fad48d983`.
- v1.0.28: RELEASE VERIFIED on product commit `d388f9f6cacf9ebe2be2fb12fe7e22cffd4d5ee8` with Mobile APK + TV APK + iOS UNSIGNED IPA + SHA256SUMS + provenance.

## أهداف التشغيل التالي
1. Re-open from actual GitHub state before new code.
   - Confirm no open PR and record current main/docs SHA.
   - Re-read latest Release and protected workflow state.
   - Work on one new branch/PR only.
2. Add opaque fallback playback references.
   - Bind refs to canonical TMDB/movie/episode identity and provider ID server-side.
   - Add TTL/sweeper and reject unknown/expired refs fail-closed.
   - Ensure Flutter never receives raw provider URLs.
3. Build bounded provider probing.
   - Separate DNS/connect/reachability from playback success.
   - Enforce short per-provider and total time budgets.
   - Record latency/failure in `ProviderHealthRegistry` without promoting HTTP 200 alone.
4. Add fallback media/embed classification.
   - Classify direct MP4/HLS/MPEG-TS by headers/bytes where possible.
   - Keep embed handling internal/origin-restricted.
   - Reject unsupported or suspicious responses explicitly.
5. Add automatic next-provider failover.
   - Rank by health and skip open circuits.
   - Stop after bounded attempts.
   - Record success only after media/playback signal evidence.
6. Connect fallback resolution to TMDB identities.
   - Movies use `tmdb_id`.
   - Series episodes use `tmdb_id + season + episode` while preserving Basri `episode_id` separately.
   - Cache trusted Basri↔TMDB mappings only when unambiguous.
7. Add optional TMDB search UX after resolver safety is ready.
   - Keep القحطاني default and provide explicit source choice.
   - Add `ابحث في المصدر الاحتياطي` on zero-result/error recovery where appropriate.
   - Mark TMDB results `احتياطي` and keep lists separate initially.
8. Improve recovery UX without extra cognitive load.
   - Simple connection/recovery state in player.
   - Clear retry/fallback messaging without provider internals.
   - Preserve thumb reach, RTL and TV focus order.
9. Continue physical-device P0 validation tracking.
   - Newer iPhone release: completed download → local player offline.
   - Verify seek/pause/resume/duration and missing-file recovery.
   - Verify Save to Files/share exports the local file only.
10. Preserve four-surface release discipline.
   - Run Pages/WebKit/CORS/Range/Download and Flutter/TV/iOS gates on exact final head.
   - Bump version/build for the next product-impacting merge.
   - Publish and API-verify the next Mobile APK + TV APK + iOS UNSIGNED IPA triplet before declaring release success.
