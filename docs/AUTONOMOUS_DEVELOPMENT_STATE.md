# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Current `main`: `7aeb82d65b51a7e3c44563b073105311a0e373a0` (v1.0.32 product SHA, merged PR #114).
- Latest verified Release: `v1.0.32` from exact SHA `7aeb82d65b51a7e3c44563b073105311a0e373a0`.
- Active PR: #115 on `docs/post-v1.0.32-merge-state`; scope expanded from documentation-only into a real product batch and is therefore promoted to v1.0.33.
- Product version/build on PR #115: `1.0.33+33`.
- Runtime `PRODUCT_VERSION`: `1.0.33`.
- One-PR rule remains in force; no second product PR may open until #115 is resolved.

## v1.0.32 release verification
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.32`.
- Release target: `7aeb82d65b51a7e3c44563b073105311a0e373a0`.
- Flutter foundation run `34905736056`: Android Mobile SUCCESS, Android TV SUCCESS, analyze/tests SUCCESS, iOS UNSIGNED SUCCESS.
- GitHub Pages run `34905736122`: SUCCESS on the exact product SHA.
- Assets:
  - `Al-Qahtani-Mobile-v1.0.32.apk` — 55,887,348 bytes — SHA-256 `b5f7a601945bcfba39ea9f001f830119c5040c09b8f11f8e746c91ef108cedef`.
  - `Al-Qahtani-TV-v1.0.32.apk` — 55,887,456 bytes — SHA-256 `1fc62c756433f580fcf4f5c4f50a998dd614b447663d963c17b4877959db01ad`.
  - `Al-Qahtani-iOS-v1.0.32-UNSIGNED.ipa` — 7,896,071 bytes — SHA-256 `a1afb49cd2af38d470e1b88f24d1e2031b266c0f17c0b2ecf51a6a4fa3a30a8a`.
  - `SHA256SUMS.txt` — SHA-256 `c5ff6efa49ba6e6cb1400b6a2072e3214cffadf444eb7df757155fff0353de6e`.
  - `PROVENANCE.json` — SHA-256 `b6f0600f73771d0277834bd59efecae058ec71c8a486009cf415442524690d78`.
- Android Mobile identity/signature, TV LEANBACK/D-Pad/package/signature and iOS UNSIGNED/no-codesign verification passed.

## Physical-device P0 evidence
The user verified on a real iPhone running v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, while Files did not show it and tapping the completed card did nothing. This remains `v1.0.25 — FAILED / PHYSICAL-DEVICE VERIFIED BUG`.

v1.0.26+ contains final-file checks, local-path persistence/enumeration, internal offline playback, missing-file recovery and local share/export. The status remains `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING` until a newer build is validated on a real iPhone end-to-end.

PR #115 strengthens the P0 contract further: a native/background transfer reporting `completed` is forced through a `verifying` state and cannot become user-visible `completed` unless an explicit completion verifier confirms the final local file. With no verifier, completion fails closed as `FINAL_FILE_VERIFICATION_FAILED`.

Required physical retest: download -> restart app -> Library -> tap completed item -> disable network -> local internal playback -> start/seek/pause/resume/duration -> missing-file recovery -> Save to Files/share from the local file only.

## PR #115 / v1.0.33 product batch
The branch now contains real product changes and may not merge as documentation-only.

Batch #1 local-storage/download additions:
- `background_download_contract.dart` — native/background lifecycle boundary, runtime download-ref validation, terminal-state handling and fail-closed final-file verification before completed.
- `download_resume_catalog.dart` — restart-time discovery and safe cleanup of `.qahtani-*.part` files inside the app download directory.
- `file_export.dart` — local-file export boundary with source validation.
- `m3u_cache_engine.dart` — persisted M3U cache/expiry/offline stale-read behavior.
- `storage_quota_manager.dart` — quota accounting and safe oldest-first cleanup while protecting active files.
- deterministic Flutter tests for background lifecycle, completion verification, file export and Batch #1 storage behavior.
- `docs/BATCH1_LOCAL_STORAGE_GATES.md` explicitly keeps native background execution and iOS Files behavior DEVICE_REQUIRED_PENDING.

Automation/control-plane additions on the same PR:
- Observer, Triage and conservative Self-Healing workflows/docs.
- Triage waits for exact-SHA evidence to settle before classification.
- Self-Healing is a safe no-op on clean CI and is not allowed to turn CI into an infinite rerun machine.

## TMDB fallback state
- TMDB search/status/details/season remains server-side only.
- Flutter does not contain `TMDB_API_KEY`.
- Basri/القحطاني remains default and primary.
- Explicit source selector, empty-result `ابحث في المصدر الاحتياطي`, fallback labels and TMDB details/season UX remain pending until fallback playback is safe.

## 27-provider fallback pool
RELEASE VERIFIED through v1.0.32:
- exactly 27 server-side adapters;
- HTTPS/hostname allowlists and opaque TTL refs;
- server-side health scoring/latency/failure/circuit breaker/ranking;
- bounded probe with manual redirects and MP4/HLS/MPEG-TS/embed classification;
- provider URLs/names/sessions remain server-side;
- success requires real playback evidence, not HTTP 200;
- MP4/MPEG-TS direct proxy through `/api/v1/fallback/media?ref=<opaque>` preserves Range/206/Content-Range/Accept-Ranges without URL leakage;
- HLS remains fail-closed pending safe playlist/segment rewriting.

Still pending:
- opaque HLS playlist/segment rewriting;
- Flutter internal-player fallback consumption;
- bounded automatic next-provider attempts from actual playback failure;
- `playing` evidence before provider-health success;
- redirect-hop policy only if live evidence proves it necessary.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share local file: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Background download contract: IN PR #115; DEVICE REQUIRED for real iOS/Android background execution.
4. Resume `.part` discovery/cleanup: IN PR #115; physical interrupted-transfer resume still NOT VERIFIED.
5. Fall 2 native -> internal WebView playback: code path exists; PHYSICAL-DEVICE NOT VERIFIED.
6. Match runtime playback/failover: baseline exists; live-device playback NOT VERIFIED.
7. Match scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
8. Search posters/type/year/dedupe: baseline present.
9. TMDB server-side foundation: MERGED; user-facing selector pending.
10. 27-provider direct MP4/MPEG-TS proxy: RELEASE VERIFIED in v1.0.32; HLS/player/failover pending.
11. Favorites/Continue Watching/Downloads/History: baseline present; physical persistence lifecycle pending.
12. TV LEANBACK/D-Pad/focus: CI VERIFIED in v1.0.32; must re-pass on v1.0.33 exact head.
13. Web/PWA: Pages VERIFIED on v1.0.32; v1.0.33 must preserve current Pages product.

## UX / safety decisions
- P0 correctness precedes visual changes.
- Primary action first and recovery second; no technical provider controls in normal UI.
- No provider URL/name/session/health internals in Flutter/UI/logs.
- A transfer/native completion event is not equivalent to a verified user-visible completed download.
- No broad interface rewrite in this batch; Arabic RTL, touch targets, TV focus, contrast and navy/black + metallic-gold Q/ق+Play identity remain protected.

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

Current completion/progress:
- #7 strengthened by explicit background `verifying` state and fail-closed completion verifier in PR #115.
- #8/#9 advanced by storage quota/cleanup and partial-download catalog in PR #115.
- #11 is RELEASE VERIFIED server-side through the v1.0.32 MP4/MPEG-TS proxy; HLS and player failover remain.
- Physical-device-only items stay pending regardless of CI.

## Protected regressions
Protect file existence/readability/size before ✓, local-only export/playback, `.part` rules, resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, episode_id vs episode_number, score precedence, match failover/logos/Saudi time, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, opaque-ref expiry, RTL, TV focus/LEANBACK and iOS UNSIGNED/no-codesign labeling.

## Blockers / decisions
- No permission blocker is known.
- PR #115 must be treated as a product PR because it contains Flutter behavior/contracts, not merely documentation.
- Product version is `1.0.33+33` and Runtime is `1.0.33` before merge.
- The v1.0.25 iPhone bug remains authoritative physical evidence until a newer real-device retest passes.

## أهداف التشغيل التالي
1. Finish PR #115 exact-head CI.
   - Require Flutter analyze/tests, Mobile APK, TV APK and iOS UNSIGNED jobs green.
   - Require Content/runtime/Web/live/agent gates green on the final head.
   - Fix reproducible failures on this same branch only.
2. Review Batch #1 P0 contracts for integration safety.
   - Ensure background native completion cannot bypass final-file verification.
   - Preserve `.part` recovery/cancel cleanup and local-only export.
   - Keep device-required claims explicitly pending.
3. Merge #115 only on exact-head green.
   - Record final head and merge SHA.
   - Verify no unrelated second PR exists.
4. Publish v1.0.33 triplet from one product SHA.
   - Android Mobile APK + Android TV APK + iOS UNSIGNED IPA.
   - Verify version/commit/signature/LEANBACK/no-codesign.
   - Publish SHA256SUMS and PROVENANCE and reread Releases API.
5. Reverify Web/PWA after merge.
   - Pages same product commit.
   - Web smoke, WebKit, CORS, Range/download and Safari regressions.
6. Add safe HLS opaque rewriting next.
   - Rewrite playlist/segment URIs server-side.
   - Reject unsafe hosts/redirects and prevent URL leakage.
7. Add real playback-driven failover.
   - Require player failure/playing evidence.
   - Enforce bounded attempt/time/circuit budgets.
8. Complete TMDB fallback UX after playback safety.
   - Keep القحطاني default.
   - Add explicit selector/empty-result CTA/fallback badge.
9. Preserve physical-device P0 retest readiness.
   - Restart persistence, local playback, missing-file recovery and local export.
   - Do not promote status from CI alone.
10. Continue small measurable UX improvements.
   - Fewer taps, clearer recovery/loading/library states.
   - Preserve RTL/accessibility/TV focus and brand hierarchy.
