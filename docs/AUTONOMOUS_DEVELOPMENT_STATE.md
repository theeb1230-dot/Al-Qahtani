# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with earlier reports. The preserved original `albasritv.github.io-main.zip`, live Al-Qahtani/Basri Runtime evidence, and the user's physical-device evidence remain behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- `main`: `4028c95762b9e3d704c97457c14d66a5387af9d5`.
- Latest merged product PR: #99 `Fix completed download playback and local export`.
- Latest verified release: `v1.0.26`, target `4028c95762b9e3d704c97457c14d66a5387af9d5`.
- Current development branch: `feat/tmdb-fallback-search-100`.
- Open PR: #100 `Add server-side TMDB fallback search foundation`.
- PR #100 was mergeable on the current branch lineage. Its earlier head `d0d91027b6120230ccd04a2c2496578896e63f53` passed all required workflows, including Flutter foundation. A direct merge attempt from the automation tool was blocked before reaching GitHub by the tool safety layer; repository auto-merge is disabled. Development therefore continued on the same PR only, per the one-open-PR rule.
- Latest product-code head before this state update: `31d772b6a0e11dd54509b82ad885b632b107d7ff`.
- Product version/build on this branch: `1.0.27+27`; Runtime `PRODUCT_VERSION`: `1.0.27`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/`; Flutter Web does not replace it.
- Product boundary remains Al-Qahtani/Basri. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, helper player app, VLC/Safari/Intent playback fallback, or upstream/provider URL exposure is permitted in Flutter.

## Physical-device P0 evidence
The user verified on iPhone v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, but searching Files did not show it and tapping the completed card did nothing. This remains the authoritative historical PHYSICAL-DEVICE VERIFIED BUG for v1.0.25.

PR #99 / v1.0.26 added completed-file verification, local-path enumeration, internal offline playback, missing-file recovery, and local share/export. Those changes are FIXED IN CODE / CI VERIFIED only. They remain PHYSICAL-DEVICE RECHECK PENDING until a real device proves that tapping a completed download starts local playback and export works from the local file.

## Current development slice: TMDB fallback foundation
The optional TMDB fallback remains additive. Al-Qahtani/Basri search stays the default.

Implemented on PR #100:
- `server/tmdb-runtime.mjs`: server-side-only TMDB adapter. `TMDB_API_KEY` is read only from the server environment and is never returned to clients.
- `/api/v1/tmdb/status` and `/api/v1/tmdb/search` with bounded timeout, Arabic locale, adult filtering, cache, normalization and fail-closed errors.
- `/api/v1/tmdb/details` for validated `tmdb:movie:{id}` / `tmdb:tv:{id}` references.
- `/api/v1/tmdb/season` for validated TV references and bounded season numbers.
- Details normalize title/original title/overview/poster/backdrop/year/rating/runtime/season counts without exposing the TMDB credential.
- Season normalization produces stable opaque episode identity `tmdb:tv:{id}:s{season}:e{episode}` and preserves `season_number` separately from `episode_number`.
- `scripts/tmdb_runtime_test.mjs` now covers search cache, details cache, ref validation, movie-vs-series validation, seasons, episode identity, locale and missing-key fail-closed behavior.
- Flutter `CatalogItem` has backward-compatible `rating` and `source` fields.
- `AlQahtaniApi._catalogItem()` now preserves `source` and `rating` instead of silently discarding them.
- Flutter API now has Runtime-only `tmdbAvailable()` and `searchTmdb()` methods; Flutter still receives no TMDB API key or raw provider URL.
- Search dedupe now includes source in its no-ref fallback key so future Basri/TMDB results cannot accidentally collapse solely because title/type/year match.
- Version/build remains `1.0.27+27`; Runtime remains `1.0.27` because these commits are still inside the same unreleased product PR.

Not yet user-complete:
- User-facing search source selector/toggle and `ابحث في المصدر الاحتياطي` CTA.
- TMDB details UI and season/episode UI.
- Basri-ref↔TMDB mapping cache.
- 27-provider playback resolver and health-ranked failover.
- TMDB-result playback. No TMDB result should become a dead-end clickable playback card before fallback playback exists.

## 27-provider fallback pool state
NOT IMPLEMENTED YET. Design remains:
1. Basri/Al-Qahtani primary playback first.
2. TMDB identity is only a bridge/fallback identity, not the primary catalog.
3. For a native TMDB search result, use `tmdb_id + movie/tv + season + episode`.
4. Provider URLs stay server-side. Flutter receives only Al-Qahtani Runtime opaque references.
5. `ProviderHealthRegistry` ranks providers dynamically using success/failure/latency/circuit-breaker state.
6. HTTP 200 alone is not playback success. Health promotion requires reachability and later real playback evidence.
7. Short bounded timeouts and automatic next-provider failover are mandatory.

## P0/P1 status
1. **Completed iPhone download tap bug:** FIXED IN CODE / CI VERIFIED in v1.0.26; PHYSICAL-DEVICE RECHECK PENDING.
2. **Save to Files/share completed local download:** FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. **Fall 2 native→internal WebView playback:** code/runtime path exists; real iPhone/Android playback remains NOT VERIFIED.
4. **Long download/resume:** regressions exist; full physical-device interrupted/resumed transfer remains NOT VERIFIED.
5. **Match→safe runtime playback/failover:** code/runtime baseline exists; live device playback remains NOT VERIFIED.
6. **Ended/live scores without fake 0-0:** FIXED IN CODE / CI VERIFIED; changing live score remains NOT PHYSICAL-DEVICE VERIFIED.
7. **Match logos/Saudi time:** baseline covered; physical visual recheck pending.
8. **Search poster/type/year/dedupe:** baseline covered; physical visual recheck pending.
9. **TMDB optional search:** SERVER + FLUTTER CLIENT BOUNDARY IN PROGRESS on PR #100; NOT USER-COMPLETE.
10. **TMDB details/seasons:** IMPLEMENTED IN CODE on PR #100; exact-head CI pending after latest commits.
11. **27-provider fallback:** NOT IMPLEMENTED.
12. **Favorites/Continue Watching/Downloads/History:** baseline present; full device persistence lifecycle pending.
13. **Continue Watching/History only after playback event:** regression baseline preserved.
14. **TV LEANBACK/D-Pad/focus:** build/CI baseline preserved; physical Android TV recheck pending.
15. **Web/PWA:** must remain deployed independently on Pages.

## UX / behavioral analysis guiding the next UI changes
- Default search remains Al-Qahtani to preserve learned behavior and avoid surprising source changes.
- Fallback discovery should appear only when useful: an explicit source control and a clear CTA after empty/error primary results.
- Do not silently mix Basri and TMDB results initially. Separate source states reduce duplicate ambiguity and cognitive load.
- Primary CTA in search remains the text field/search action. Source selection is secondary.
- Do not make TMDB cards actionable for playback until the 27-provider resolver returns safe opaque playback refs; a dead-end details/play button is worse UX than a temporarily absent button.
- Mobile targets must remain thumb-reachable with comfortable touch sizes; TV controls must remain D-Pad focusable with visible focus state.
- Technical provider/runtime names stay out of normal UI. A simple `احتياطي` badge is enough for TMDB-origin results.
- New UI must preserve RTL, navy/black + metallic-gold identity, readable contrast, predictable back behavior, and page state.
- No dark patterns, forced fallback, fake success, auto-opening external apps, or hidden network/provider behavior.

## 20 تحسينًا إضافيًا
Ordered by user value first and regression risk second. Implement incrementally, not as one redesign.

1. **Search source selector**: القحطاني / TMDB الاحتياطي with persistent preference.
2. **Empty-search recovery CTA**: `ابحث في المصدر الاحتياطي` after confirmed zero primary results.
3. **Search filters**: movie/series/year with a compact reset action.
4. **Search state restore**: query, selected source, scroll position, and results survive tab switches.
5. **Search history suggestions**: local-only recent queries with clear-delete control.
6. **Continue Watching quick row**: one-tap resume from the most useful position.
7. **Download integrity state**: verifying/completed/missing/failed are distinct instead of one ✓ state.
8. **Download storage summary**: total local size and safe delete controls without exposing provider URLs.
9. **Download retry/recovery**: missing or failed local file offers re-download instead of a dead row.
10. **Offline badge**: clear local/offline-ready indicator on completed playable files.
11. **Automatic server recovery**: bounded failover with a simple user-facing retry state, not server plumbing.
12. **Player connection state**: concise preparing/retrying/playing message with no technical provider details.
13. **Player resume prompt**: continue from saved position or restart, only when prior playback is real.
14. **Favorites quick access**: compact favorite action on cards/details with immediate local feedback.
15. **Library sorting**: recent/title/size for downloads and recent/title for favorites/history where useful.
16. **Skeleton/loading states**: stable card geometry to reduce layout jumps and perceived slowness.
17. **Accessible typography/touch targets**: larger TV focus targets, text scaling tolerance, semantic labels.
18. **TV focus restoration**: returning from details/player restores the previously focused card.
19. **Simplified settings**: group playback/search/download preferences; hide technical options from normal users.
20. **Performance budget**: image/cache/memory limits, request cancellation, and no stale search responses.

## Protected regressions
Protect completed-download verification before ✓, local file path/URI only, offline local playback, missing-file recovery, export/share from local file only, `.part` cleanup rules, stable resume identity, `download=1`, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, HLS child/key/init opaque refs, independent Watch/Download resolution, trusted filenames, Match source discovery/failover/logos/Saudi time, authoritative score precedence and explicit real 0-0, `episode_id` vs `episode_number`, Search posters/season-aware dedupe, 30+30 pagination with stale/concurrency guards, CORS/SSRF/allowlists, media-ref expiry/sweeper, Arabic RTL identity, TV LEANBACK/D-Pad/focus, and iOS UNSIGNED/no-codesign labeling.

## Release gate for PR #100
Before merge:
- All required workflows must be green on the exact final head after the latest TMDB details/client changes.
- Flutter analyze/tests/build gates must remain green.
- No TMDB credential may appear in source, Flutter bundle, logs, API payloads, or release assets.
- Merge only when the tool can perform a verified exact-head merge or GitHub repository settings permit an equivalent safe path. Do not claim merge while the tool safety layer blocks it.
- After merge, release must contain same-commit/version Mobile APK + TV APK + iOS UNSIGNED IPA + SHA256SUMS + provenance.
- Re-read Releases API and Pages deployment after merge.

## أهداف التشغيل التالي
1. **Close exact-head CI for PR #100.**
   - Inspect all workflows on the final docs/code head.
   - Fetch logs for any failed job and root-cause it on the same branch.
   - Merge only after exact-head green proof.
2. **Add user-facing optional fallback search without dead ends.**
   - Keep Basri search default.
   - Add explicit source selector/toggle only when TMDB Runtime is configured.
   - Add `ابحث في المصدر الاحتياطي` CTA after zero primary results.
3. **Connect TMDB details UI safely.**
   - Render metadata, seasons and episodes with an `احتياطي` badge.
   - Keep playback action disabled/absent until an opaque fallback resolver exists.
   - Preserve RTL, focus and back behavior.
4. **Build canonical identity mapper.**
   - Direct TMDB/IMDb identity first.
   - Then title+year+type matching.
   - Reject ambiguous matches rather than guessing.
5. **Introduce the 27-provider registry server-side.**
   - Templates/capabilities/timeouts only on server.
   - No Flutter upstream URLs.
   - Validate generated URLs against explicit allowlists.
6. **Connect ProviderHealthRegistry.**
   - Success/failure/latency scoring.
   - Circuit breaker and cooldown.
   - Deterministic ranking tests.
7. **Build opaque fallback playback refs.**
   - Movie `tmdb_id` resolution.
   - Series `tmdb_id + season + episode` resolution.
   - Never return raw provider/session URLs.
8. **Recheck download P0 on physical-device evidence when available.**
   - Tap completed item → local player.
   - Offline seek/pause/resume/duration.
   - Save/share the local file only.
9. **Preserve four-surface gates.**
   - Pages/WebKit/CORS/Range/Download smokes.
   - Mobile/TV/IPA builds.
   - LEANBACK/D-Pad/focus and no-codesign checks.
10. **Release only after exact-head proof.**
   - Verify release triplet + hashes + provenance.
   - Verify Pages on merged product commit.
   - Record RELEASE VERIFIED only after API re-read proves assets exist and are downloadable.
