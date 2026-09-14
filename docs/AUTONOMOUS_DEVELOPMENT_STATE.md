# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Product/release main SHA: `7c434cc23a08229f6bdc937612e0c3ea19e54909` (merged PR #110).
- No product PR was open when this state-recording branch was created.
- State branch: `docs/post-v1.0.30-release-state` (docs-only, based on exact release SHA above).
- Product version/build: `1.0.30+30`.
- Runtime `PRODUCT_VERSION`: `1.0.30`.
- PR #110 `Add bounded fallback media probing`: MERGED.
- Latest verified GitHub Release: `v1.0.30` from exact SHA `7c434cc23a08229f6bdc937612e0c3ea19e54909`.

## v1.0.30 release verification
- Flutter foundation run `34884275006`: SUCCESS on exact release SHA.
- Initial Release Flutter triplet run `34884937498` failed at protected-gate polling only because `Remote news smoke` had failed.
- `Remote news smoke` run `34884275138` initial failure: list returned 15 items, but article dereference returned HTTP 410 `NEWS_REFERENCE_EXPIRED`.
- The failure was treated as a live/deployment-sensitive external gate and rerun before any code change.
- Rerun of `34884275138`: SUCCESS, proving the failure was transient rather than a reproducible product regression.
- Failed jobs of Release run `34884937498` were rerun after the news gate became green: SUCCESS.
- Release tag: `v1.0.30`.
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.30`.
- Release target: `7c434cc23a08229f6bdc937612e0c3ea19e54909`.
- Assets:
  - `Al-Qahtani-Mobile-v1.0.30.apk` — 55,887,348 bytes — SHA-256 `a470ce32eebe22e8e158858970a55eaec4964d44d71bf10c6d16e2f20776f6a9`.
  - `Al-Qahtani-TV-v1.0.30.apk` — 55,887,456 bytes — SHA-256 `ef2e6342bfd44ebb24d9883aefd50b9a3608fde9f0122c41e555c8637e70b147`.
  - `Al-Qahtani-iOS-v1.0.30-UNSIGNED.ipa` — 7,896,074 bytes — SHA-256 `b5108d1039cf1eef073eddc08d4dd4ef6bde260fd320f213da9852397be320e8`.
  - `SHA256SUMS.txt` — published.
  - `PROVENANCE.json` — published.
- Release workflow verified exact successful Flutter run binding, exact release commit, version/build, protected gates, exact-run triplet artifacts, publication, and published release completeness.
- Android Mobile identity/brand/signature verification passed in Flutter foundation.
- Android TV LEANBACK/source requirements, packaged features, identity/signature checks passed in Flutter foundation.
- iOS bundle was built without codesign and the UNSIGNED IPA packaging verification passed.

## Pages / Web state
- `Deploy GitHub Pages` run `34884275140`: SUCCESS on exact release SHA `7c434cc23a08229f6bdc937612e0c3ea19e54909`.
- `Mobile WebKit smoke`: SUCCESS on the same product SHA.
- Remote runtime, movie playback, CORS, HLS, Basri player/download, media-reference expiry, trusted filename and other protected gates are green on the same release SHA after the successful news rerun.
- Web/PWA remains the existing GitHub Pages product and was not replaced by Flutter Web.

## Physical-device P0 evidence
The user verified on a real iPhone running v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, but Files did not show it and tapping the completed card did nothing. This remains the authoritative historical `FAILED / PHYSICAL-DEVICE VERIFIED BUG` for v1.0.25.

v1.0.26+ contains completed-file verification, local-path enumeration, internal offline playback, missing-file recovery, and local share/export. v1.0.30 is RELEASE VERIFIED in CI, but the P0 remains `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING` until v1.0.30 or later is tested on a real iPhone with offline local playback.

Required physical retest remains: download -> restart app -> Library -> tap completed item -> internal local playback with network unavailable -> start/seek/pause/resume/duration -> missing-file recovery -> Save to Files/share from local file only.

## TMDB fallback state
Merged foundation:
- server-side-only TMDB adapter and search/status/details/season APIs;
- timeout/cache/error normalization;
- Arabic locale and adult filtering;
- stable TMDB movie/TV and episode identities;
- Flutter does not contain `TMDB_API_KEY`.

Pending user-complete UX:
- explicit `القحطاني` / `TMDB الاحتياطي` source control;
- empty-result CTA `ابحث في المصدر الاحتياطي`;
- TMDB details/season UI;
- no TMDB playback CTA until safe fallback playback hand-off is complete.

## 27-provider fallback pool
Merged and protected:
- exactly 27 server-side provider adapters;
- positive TMDB/season/episode validation;
- HTTPS-only generated URLs and hostname allowlists;
- provider templates/upstream URLs remain server-side;
- `ProviderHealthRegistry` scoring, latency, failure tracking and circuit breaker;
- deterministic ranking;
- TTL-bound opaque refs `fallback:<opaque-id>`;
- bounded ref storage/expiry cleanup;
- fallback resolve/next routes;
- success requires explicit playback evidence and never HTTP 200 alone.

v1.0.30 added the first bounded probe/classification layer:
- byte-bounded GET probe with `Range: bytes=0-1023`;
- timeout clamped to 250–5000 ms;
- redirects handled manually and not followed blindly;
- MP4/HLS/MPEG-TS classification by response metadata;
- HTML/embed remains non-playable until real player evidence exists;
- HTTP 200 unsupported content remains non-playable;
- response bodies are cancelled after classification;
- probe output never exposes upstream URLs;
- deterministic regression coverage in `scripts/fallback_probe_test.mjs`.

Still pending:
- safe Runtime integration from opaque fallback ref to probe result;
- redirect allowlist policy where necessary;
- internal-player proxy/hand-off for classified direct media;
- real playing evidence and bounded automatic in-session next-provider failover.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share local file: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Fall 2 native→internal WebView playback: code path exists; physical-device playback NOT VERIFIED.
4. Long download/resume: regression coverage exists; interrupted physical transfer NOT VERIFIED.
5. Match safe runtime playback/failover: baseline exists; live-device playback NOT VERIFIED.
6. Match scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
7. Search posters/type/year/dedupe: baseline present.
8. TMDB search/details/seasons: MERGED; user-facing source selector pending.
9. 27-provider health/circuit/opaque refs: MERGED; bounded probe classifier RELEASE VERIFIED in v1.0.30; player integration pending.
10. Favorites/Continue Watching/Downloads/History: baseline present; full physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI VERIFIED in v1.0.30.
12. Web/PWA: Pages and protected Web gates VERIFIED on v1.0.30 product SHA.

## PR #110 and release root cause history
- Initial PR head `d5b90f242cf367a60166c95733b43ef2677fbea2` failed only Content runtime because Flutter was bumped to `1.0.30+30` while Runtime remained `PRODUCT_VERSION = "1.0.29"`.
- Root cause was fixed on the same PR by aligning Runtime to `1.0.30`.
- Final PR head `4b5bc6c3ccbc9d64682a18f0ea4729fa43cbf770` passed all 15 PR workflows and merged as `7c434cc23a08229f6bdc937612e0c3ea19e54909`.
- Post-merge release first failed solely because the deployed news article opaque ref expired between list and dereference. The same workflow rerun passed without code modification, proving a transient live-state issue rather than a reproducible regression.
- Release was rerun only after that required gate became green and then published v1.0.30 successfully.

## UX decisions
- Al-Qahtani/Basri stays primary; TMDB is explicit fallback.
- Do not mix primary and fallback result lists by default.
- No provider names, upstream URLs, sessions or technical health details in normal UI.
- No clickable fallback playback until opaque ref -> internal player + bounded failover are ready.
- Primary action first, recovery action second; avoid technical button clutter.
- Preserve Arabic RTL, navy/black + metallic gold identity, readable contrast, thumb reach, and TV visible focus.
- No large page rewrites before navigation/widget/smoke evidence.
- Any future UI rearrangement must reduce cognitive load or task steps and must preserve TV focus/accessibility.

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

Current completion:
- #11 foundation advanced in v1.0.30: registry/health/opaque refs plus bounded probe/classifier are merged and RELEASE VERIFIED.
- Local offline playback/share foundations exist but remain physical-device pending.
- The remaining items are intentionally staged after playback safety/P0 gates rather than shipped as a large UI rewrite.

## Protected regressions
Protect completed-file verification before ✓, local-only export/playback, `.part` rules, resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, score precedence, match failover/logos/Saudi time, episode_id vs episode_number, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, media-ref expiry, Arabic RTL, TV LEANBACK/D-Pad/focus, and iOS UNSIGNED/no-codesign labeling.

## Changed files delivered in v1.0.30
- `server/fallback-probe.mjs` — bounded probe and media/embed classifier.
- `scripts/fallback_probe_test.mjs` — deterministic probe/classification regression coverage.
- `package.json` — includes probe syntax/test coverage in `npm run check`.
- `flutter_app/pubspec.yaml` — version/build `1.0.30+30`.
- `server/content-runtime.mjs` — Runtime product version aligned to `1.0.30`.
- `docs/AUTONOMOUS_DEVELOPMENT_STATE.md` — prior handoff state.

## Blockers / decisions
- No code blocker remains for v1.0.30; the release is published and verified.
- Physical-device confirmation for the v1.0.25 download bug is still outstanding by design; CI cannot promote it to PHYSICAL-DEVICE VERIFIED.
- The transient deployed-news expiry is recorded as live-state flakiness because the unchanged exact-SHA rerun succeeded. If it recurs, harden the smoke/runtime opaque-ref lifecycle instead of silently ignoring it.
- Do not expose provider URLs or move TMDB/provider secrets into Flutter to simplify fallback integration.

## أهداف التشغيل التالي
1. Merge this docs-only state PR only after exact-head CI is green.
   - Confirm no product files changed.
   - Preserve v1.0.30 release binding to `7c434cc23a08229f6bdc937612e0c3ea19e54909`.
   - Ensure docs-only merge does not spuriously publish another product release.
2. Wire bounded probing into Runtime behind opaque refs.
   - Accept only validated opaque fallback refs.
   - Never serialize provider/target URLs to clients or logs.
   - Add deterministic malformed/expired/ref-leak tests.
3. Add direct-media internal hand-off.
   - Preserve Range/206 and content-range headers.
   - Support MP4/HLS/MPEG-TS classification paths.
   - Reject unsupported or ambiguous bodies before native player launch.
4. Add bounded in-session provider failover.
   - Record actual playback failure, not just reachability.
   - Move to next healthy provider within a fixed attempt budget.
   - Respect circuit-breaker state and stop cleanly.
5. Add real playback success evidence.
   - Require media/playing signal before health success.
   - Record latency/container/range capability after actual playback.
   - Keep technical provider identity server-side.
6. Complete explicit TMDB fallback UX after playback safety.
   - Keep `القحطاني` selected by default.
   - Add `ابحث في المصدر الاحتياطي` for empty/error primary results.
   - Label TMDB result source without mixing result lists by default.
7. Continue P0 physical-device validation readiness.
   - Preserve completed-file existence/readability/EOF checks.
   - Keep missing-file recovery and local-only export/share covered.
   - Do not mark the user bug PHYSICAL-DEVICE VERIFIED until a real iPhone retest passes.
8. Strengthen long-download and resume safety.
   - Preserve stable content/episode identity across restart.
   - Verify `.part` cleanup on cancel/failure.
   - Keep stalled transfers from becoming completed.
9. Continue match/Fall 2 P1 verification.
   - Keep native-first then internal WebView fallback for Fall 2.
   - Preserve safe MatchItem runtime refs, Saudi time and no fake 0-0.
   - Add live-device evidence when available.
10. Continue incremental UX improvements after playback gates.
   - Prioritize fewer taps, clear recovery states and library sorting.
   - Preserve Arabic RTL, accessibility and TV D-Pad focus.
   - Avoid decorative changes without measurable user value.
