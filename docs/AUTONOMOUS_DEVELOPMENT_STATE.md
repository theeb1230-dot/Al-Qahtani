# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Current `main`: `5cce9a850f5298f71d286da9faf0ed1e8b47f9e5` (docs-only merge of PR #111).
- Latest product/release commit remains `7c434cc23a08229f6bdc937612e0c3ea19e54909`.
- Open PR: #112 `Wire opaque fallback probes into Runtime`.
- Active branch: `feat/runtime-fallback-probe-112`.
- Functional head before this state-doc commit: `3bb724c3a1688cebafa0fcd8b0a341002e07b244`; branch head is authoritative after this docs update.
- Product version/build on PR #112: `1.0.31+31`.
- Runtime `PRODUCT_VERSION`: `1.0.31`.
- Latest verified GitHub Release remains `v1.0.30` from exact product SHA `7c434cc23a08229f6bdc937612e0c3ea19e54909`.

## v1.0.30 release verification
- Flutter foundation run `34884275006`: SUCCESS on exact release SHA.
- `Remote news smoke` run `34884275138` initially failed because an opaque article reference expired with HTTP 410 `NEWS_REFERENCE_EXPIRED`; unchanged-SHA rerun succeeded, proving transient live-state behavior rather than a reproducible regression.
- Release Flutter triplet run `34884937498`: failed protected-gate polling initially, then failed jobs rerun SUCCESS after the news gate recovered.
- Release tag/URL: `v1.0.30` — `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.30`.
- Release target: `7c434cc23a08229f6bdc937612e0c3ea19e54909`.
- Assets:
  - `Al-Qahtani-Mobile-v1.0.30.apk` — 55,887,348 bytes — SHA-256 `a470ce32eebe22e8e158858970a55eaec4964d44d71bf10c6d16e2f20776f6a9`.
  - `Al-Qahtani-TV-v1.0.30.apk` — 55,887,456 bytes — SHA-256 `ef2e6342bfd44ebb24d9883aefd50b9a3608fde9f0122c41e555c8637e70b147`.
  - `Al-Qahtani-iOS-v1.0.30-UNSIGNED.ipa` — 7,896,074 bytes — SHA-256 `b5108d1039cf1eef073eddc08d4dd4ef6bde260fd320f213da9852397be320e8`.
  - `SHA256SUMS.txt` and `PROVENANCE.json` published and release workflow verified completeness.
- Android Mobile identity/brand/signature checks passed.
- Android TV LEANBACK/D-Pad/source/package/signature checks passed.
- iOS IPA was explicitly built UNSIGNED/no-codesign.

## Pages / Web state
- `Deploy GitHub Pages` run `34884275140`: SUCCESS on v1.0.30 product SHA.
- Mobile WebKit, Web smoke, Runtime, movie playback, CORS, HLS, Basri player/download, media-ref expiry and trusted filename gates were green on the product SHA after the successful news rerun.
- PR #111 was docs-only and merged as `5cce9a850f5298f71d286da9faf0ed1e8b47f9e5`; it did not create a new product version or Release.
- Web/PWA remains GitHub Pages and is not replaced by Flutter Web.

## Physical-device P0 evidence
The user verified on a real iPhone running v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, while Files did not show it and tapping the completed card did nothing. This remains `v1.0.25 — FAILED / PHYSICAL-DEVICE VERIFIED BUG`.

Newer code contains completed-file existence/readability checks, local path persistence/enumeration, internal offline playback, missing-file recovery and local share/export. Status remains `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING` until v1.0.30 or later is tested on a real iPhone with the full offline path.

Required physical retest: download -> restart app -> Library -> tap completed item -> disable network -> internal local playback -> start/seek/pause/resume/duration -> missing-file recovery -> Save to Files/share from local file only.

## TMDB fallback state
Merged foundation:
- TMDB adapter and search/status/details/season APIs remain server-side only;
- timeout/cache/error normalization, Arabic locale and adult filtering;
- stable movie/TV/episode identities;
- Flutter does not contain `TMDB_API_KEY`.

Pending UX:
- explicit `القحطاني` / `TMDB الاحتياطي` source control;
- `ابحث في المصدر الاحتياطي` CTA for empty/error primary search;
- TMDB details/season UI;
- no fallback playback CTA until opaque-ref player hand-off/failover is safe.

## 27-provider fallback pool
Merged and protected before PR #112:
- exactly 27 server-side adapters;
- positive TMDB/season/episode validation;
- HTTPS-only generated URLs and hostname allowlists;
- provider templates/upstream URLs stay server-side;
- `ProviderHealthRegistry` scoring/latency/failure/circuit breaker and deterministic ranking;
- TTL-bound opaque `fallback:<id>` references;
- resolve/next routes;
- playback success requires explicit playback evidence, never HTTP 200 alone;
- v1.0.30 bounded probe uses `Range: bytes=0-1023`, 250–5000 ms timeout, manual redirects, MP4/HLS/MPEG-TS/embed classification, body cancellation and no URL leakage.

PR #112 advances improvement #11 `Automatic bounded server recovery` with the next safe slice:
- adds `FallbackPlaybackRuntime.probe(ref)` that accepts only a valid live opaque fallback ref;
- internal target is inspected server-side and passed to the existing bounded probe;
- public response returns only ref expiry/reachability/kind/container/range/latency/status metadata;
- public response does not serialize provider id/name or upstream URL;
- `playable_candidate` means probe classification only and does not record provider playback success;
- provider success remains locked behind `recordSuccess(..., { playbackSignal: true })`;
- adds GET `/api/v1/fallback/probe?ref=<opaque>` to Runtime;
- malformed/expired refs remain rejected before probing;
- deterministic runtime test verifies Range/manual redirect policy and URL/provider secrecy;
- HTTP route regression verifies CORS and the public opaque response contract.

Still pending after PR #112:
- allowlisted redirect-hop policy if evidence proves a provider requires it;
- direct-media internal proxy/hand-off preserving Range/206;
- bounded automatic next-provider attempts based on actual playback failure;
- real `playing` evidence before health success;
- Flutter player integration remains intentionally excluded from this PR.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share local file: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Fall 2 native -> internal WebView playback: code path exists; PHYSICAL-DEVICE NOT VERIFIED.
4. Long download/resume: regression coverage exists; interrupted physical transfer NOT VERIFIED.
5. Match safe runtime playback/failover: baseline exists; live-device playback NOT VERIFIED.
6. Match scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
7. Search posters/type/year/dedupe: baseline present.
8. TMDB search/details/seasons: MERGED; user-facing selector pending.
9. 27-provider health/circuit/opaque refs and bounded probe classifier: RELEASE VERIFIED in v1.0.30; opaque Runtime probe integration IN PR #112.
10. Favorites/Continue Watching/Downloads/History: baseline present; physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI VERIFIED in v1.0.30.
12. Web/PWA: latest product Pages and protected Web gates VERIFIED on v1.0.30 product SHA.

## PR #112 changed files
- `server/fallback-runtime.mjs` — opaque ref -> bounded probe integration, no public target/provider serialization.
- `server/index-runtime.mjs` — `/api/v1/fallback/probe` route.
- `scripts/fallback_runtime_test.mjs` — probe privacy/classification/ref validation regression.
- `scripts/fallback_runtime_http_test.mjs` — HTTP/CORS/opaque response route regression.
- `package.json` — includes new HTTP regression in `npm run check`.
- `server/content-runtime.mjs` — product Runtime version `1.0.31`.
- `flutter_app/pubspec.yaml` — version/build `1.0.31+31`.
- `docs/AUTONOMOUS_DEVELOPMENT_STATE.md` — this handoff state.

## UX / safety decisions
- Basri/القحطاني remains primary; TMDB is explicit fallback.
- Do not mix primary and fallback results by default.
- No provider names, URLs, sessions or health internals in normal UI.
- A successful network probe is not shown to the user as playback success.
- No fallback playback CTA until opaque ref -> internal player + bounded failover is complete.
- Primary action first, recovery second; no technical-button clutter.
- Preserve Arabic RTL, navy/black + metallic gold identity, readable contrast, thumb reach and visible TV focus.
- No large UI rewrite before navigation/widget/smoke evidence.

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
- #11 foundation was RELEASE VERIFIED in v1.0.30; PR #112 adds safe opaque Runtime probing and remains unmerged until exact-final-head CI is green.
- Offline playback/share foundations remain physical-device pending.
- UI improvements remain deliberately staged behind P0/playback safety rather than shipped as a risky broad rewrite.

## Protected regressions
Protect completed-file verification before ✓, local-only export/playback, `.part` rules, resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, score precedence, match failover/logos/Saudi time, episode_id vs episode_number, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, opaque-ref expiry, Arabic RTL, TV LEANBACK/D-Pad/focus, and iOS UNSIGNED/no-codesign labeling.

## Blockers / decisions
- No permission blocker is currently known.
- PR #112 must not merge until all triggered checks on its final head are green.
- v1.0.31 must not be published before PR #112 merges and post-merge protected gates are green on one exact product SHA.
- The v1.0.25 iPhone bug remains historical physical evidence until a newer real-device retest passes.
- Do not expose provider URLs or place TMDB/provider secrets in Flutter for convenience.

## أهداف التشغيل التالي
1. Finish PR #112 exact-final-head CI.
   - Inspect every triggered run/check on the final docs-updated head.
   - Fix failures on the same branch only.
   - Merge only when mergeable and required gates are green.
2. Verify v1.0.31 same-SHA delivery after merge.
   - Flutter Mobile APK + TV APK + iOS UNSIGNED IPA from one main SHA.
   - Verify Android identity/signature and TV LEANBACK/D-Pad/focus.
   - Verify iOS Payload/version/no-codesign and publish SHA256/PROVENANCE.
3. Verify Pages/Web after v1.0.31 merge.
   - Pages + Web smoke + Mobile WebKit on product SHA.
   - CORS/Range/download/HLS regressions on the same SHA.
   - Do not confuse a later docs-only SHA with the product release SHA.
4. Add safe direct-media internal hand-off.
   - Consume opaque ref/probe classification server-side.
   - Preserve Range/206/Content-Range/Accept-Ranges.
   - Reject unsupported/ambiguous targets before native player launch.
5. Add bounded in-session provider failover.
   - Trigger next provider from actual playback failure.
   - Use a fixed attempt/time budget and circuit state.
   - Return a clean terminal error after budget exhaustion.
6. Add real playback success evidence.
   - Require player/media `playing` signal.
   - Record latency/container/range capability only after actual playback.
   - Keep provider identity server-side.
7. Complete TMDB fallback UX after playback safety.
   - Keep `القحطاني` default.
   - Add explicit source selector and empty-result fallback CTA.
   - Label fallback results without mixed result lists.
8. Preserve P0 download retest readiness.
   - Completed file must exist/read/EOF before ✓.
   - Missing file must recover clearly; local export only.
   - Keep PHYSICAL-DEVICE status pending until real iPhone evidence.
9. Continue Fall 2 / match / long-download P1 work.
   - Native-first then internal WebView for Fall 2.
   - Safe MatchItem refs, Saudi time and no fake 0-0.
   - Stable restart/resume identity and `.part` cleanup.
10. Continue incremental UX improvements only after safety gates.
   - Reduce taps and improve recovery states/library sorting.
   - Preserve RTL/accessibility/TV focus.
   - Avoid cosmetic-only changes without measurable user value.
