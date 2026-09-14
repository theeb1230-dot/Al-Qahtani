# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Product/release main SHA: `e22678b00040f2e62bac1f0f4a3ff5f3774e4263` (merged PR #112 `Wire opaque fallback probes into Runtime`).
- PR #112 final head: `60a6080154bf49325470764f15ead430c11d7435`; all 15 PR workflows were green before merge.
- Product version/build: `1.0.31+31`.
- Runtime `PRODUCT_VERSION`: `1.0.31`.
- Latest verified GitHub Release: `v1.0.31` from exact product SHA `e22678b00040f2e62bac1f0f4a3ff5f3774e4263`.
- State branch: `docs/post-v1.0.31-release-state` (documentation-only; created from the exact product SHA above).

## v1.0.31 release verification
- Flutter foundation run `34894621407`: SUCCESS on exact release SHA.
- Android Mobile, Android TV, analyze/tests and iOS UNSIGNED jobs all completed SUCCESS in that run.
- Post-merge `Live provider smoke` run `34894621379` initially failed only at the live movie watchability probe with a 30-second `AbortError`; unchanged-SHA rerun succeeded fully.
- Post-merge `Remote movie playback smoke` run `34894621270` initially passed backend health, real proxied playback, Safari Range/206 and trusted-download checks, then timed out in the live iOS container probe; unchanged-SHA rerun succeeded fully.
- Post-merge `Remote runtime smoke` run `34894621254` initially passed health, matches, news, Arabic search/details, proxied playback, Safari Range/206 and download checks, while several live category requests hit ~30-second upstream timeouts; unchanged-SHA rerun succeeded fully.
- These three failures were treated as transient live/upstream conditions and rerun before any code change. No product patch was required.
- Release Flutter triplet run `34895225522` was rerun after all protected exact-SHA gates were green and completed SUCCESS, including exact Flutter-run binding, exact commit/version validation, artifact download, staging/provenance, publication and published-release verification.
- Release tag/URL: `v1.0.31` — `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.31`.
- Release target: `e22678b00040f2e62bac1f0f4a3ff5f3774e4263`.
- Assets:
  - `Al-Qahtani-Mobile-v1.0.31.apk` — 55,887,348 bytes — SHA-256 `71ea12ece8b09237919bb5569d1873278e1c49b84bf2efcc8a1b2156fedcf0e9`.
  - `Al-Qahtani-TV-v1.0.31.apk` — 55,887,456 bytes — SHA-256 `fb2c7ecb9951e3ac6e5d076723861235e3f4382f44176e2a3274b2b11c1fedf9`.
  - `Al-Qahtani-iOS-v1.0.31-UNSIGNED.ipa` — 7,896,069 bytes — SHA-256 `63107875d495b38870a8ea2bfd239a28beb481622436b3e05bdbe71f14ed13d5`.
  - `SHA256SUMS.txt` — 290 bytes — SHA-256 `ad4bf41b1c1e4ad004eec5cddb151ff4be130e909e8fd83fe5a5184857edbbc2`.
  - `PROVENANCE.json` — 580 bytes — SHA-256 `de0b6a7097188fc68706fd2ac46b70897259dab4fddaed7151f8afd63d93b0e0`.
- Android Mobile identity/brand/signature verification passed.
- Android TV LEANBACK/D-Pad/source/package/signature verification passed.
- iOS IPA was built and verified UNSIGNED/no-codesign.

## Pages / Web state
- GitHub Pages dynamic build/deployment run `34894620024`: SUCCESS on exact product SHA `e22678b00040f2e62bac1f0f4a3ff5f3774e4263`.
- Mobile WebKit smoke and protected Web/runtime/CORS/Range/download/HLS/Basri/media-ref/trusted-filename gates are green on the exact product SHA after the successful live-gate reruns.
- Web/PWA remains the existing GitHub Pages product and is not replaced by Flutter Web.

## Physical-device P0 evidence
The user verified on a real iPhone running v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, while Files did not show it and tapping the completed card did nothing. This remains `v1.0.25 — FAILED / PHYSICAL-DEVICE VERIFIED BUG`.

Newer code contains completed-file existence/readability checks, local-path persistence/enumeration, internal offline playback, missing-file recovery and local share/export. v1.0.31 is RELEASE VERIFIED in CI, but the P0 remains `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING` until v1.0.31 or later is tested on a real iPhone with the full offline path.

Required physical retest: download -> restart app -> Library -> tap completed item -> disable network -> internal local playback -> start/seek/pause/resume/duration -> missing-file recovery -> Save to Files/share from local file only.

## TMDB fallback state
Merged foundation:
- TMDB adapter and search/status/details/season APIs remain server-side only;
- timeout/cache/error normalization, Arabic locale and adult filtering;
- stable movie/TV/episode identities;
- Flutter does not contain `TMDB_API_KEY`.

Pending user-complete UX:
- explicit `القحطاني` / `TMDB الاحتياطي` source control;
- `ابحث في المصدر الاحتياطي` CTA for empty/error primary search;
- TMDB details/season UI;
- no fallback playback CTA until opaque-ref player hand-off/failover is safe.

## 27-provider fallback pool
Merged/protected foundation:
- exactly 27 server-side adapters;
- positive TMDB/season/episode validation;
- HTTPS-only generated URLs and hostname allowlists;
- provider templates/upstream URLs remain server-side;
- `ProviderHealthRegistry` scoring/latency/failure/circuit breaker and deterministic ranking;
- TTL-bound opaque `fallback:<id>` references;
- fallback resolve/next routes;
- playback success requires explicit playback evidence, never HTTP 200 alone;
- v1.0.30 bounded probe uses `Range: bytes=0-1023`, bounded timeout, manual redirects, MP4/HLS/MPEG-TS/embed classification, body cancellation and no URL leakage.

v1.0.31 advances improvement #11 `Automatic bounded server recovery`:
- `FallbackPlaybackRuntime.probe(ref)` accepts only a valid live opaque fallback ref;
- provider target is resolved and probed only server-side;
- GET `/api/v1/fallback/probe?ref=<opaque>` exposes only safe ref expiry/reachability/kind/container/range/latency/status metadata;
- no provider id/name or upstream URL is serialized publicly;
- `playable_candidate` means probe classification only and never records provider playback success;
- provider success remains locked behind `recordSuccess(..., { playbackSignal: true })`;
- malformed/expired refs are rejected before probing;
- deterministic runtime and HTTP/CORS regressions verify Range/manual redirects and provider/URL secrecy.

Still pending:
- allowlisted redirect-hop policy only if evidence proves a provider needs it;
- direct-media internal proxy/hand-off preserving Range/206/Content-Range/Accept-Ranges;
- bounded automatic next-provider attempts driven by actual player failure;
- real `playing` evidence before provider-health success;
- Flutter internal-player integration remains intentionally staged until these server-side safety gates are complete.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share local file: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Fall 2 native -> internal WebView playback: code path exists; PHYSICAL-DEVICE NOT VERIFIED.
4. Long download/resume: regression coverage exists; interrupted physical transfer NOT VERIFIED.
5. Match safe runtime playback/failover: baseline exists; live-device playback NOT VERIFIED.
6. Match scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
7. Search posters/type/year/dedupe: baseline present.
8. TMDB search/details/seasons: MERGED; user-facing selector pending.
9. 27-provider health/circuit/opaque refs + bounded probe + opaque Runtime probe integration: RELEASE VERIFIED through v1.0.31; internal player hand-off/failover pending.
10. Favorites/Continue Watching/Downloads/History: baseline present; physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI VERIFIED in v1.0.31.
12. Web/PWA: Pages and protected Web gates VERIFIED on v1.0.31 product SHA.

## PR #112 / changed files
- `server/fallback-runtime.mjs` — opaque ref -> bounded probe integration with no public provider/target serialization.
- `server/index-runtime.mjs` — `/api/v1/fallback/probe` route.
- `scripts/fallback_runtime_test.mjs` — probe privacy/classification/ref validation regression.
- `scripts/fallback_runtime_http_test.mjs` — HTTP/CORS/opaque response route regression.
- `package.json` — includes new HTTP regression in `npm run check`.
- `server/content-runtime.mjs` — Runtime product version `1.0.31`.
- `flutter_app/pubspec.yaml` — version/build `1.0.31+31`.
- `docs/AUTONOMOUS_DEVELOPMENT_STATE.md` — release/state handoff.

## UX / safety decisions
- Basri/القحطاني remains primary; TMDB is explicit fallback.
- Do not mix primary and fallback result lists by default.
- No provider names, URLs, sessions or health internals in normal UI.
- A successful network probe is not shown as playback success.
- No fallback playback CTA until opaque ref -> internal player + bounded failover is complete.
- Primary action first, recovery action second; avoid technical-button clutter.
- Preserve Arabic RTL, navy/black + metallic gold identity, readable contrast, thumb reach and visible TV focus.
- No broad UI rewrite before navigation/widget/smoke evidence.

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
- #11 server-side foundation and opaque probe integration are RELEASE VERIFIED through v1.0.31; direct-player hand-off, actual-playing evidence and bounded next-provider switching remain next.
- Offline playback/share foundations remain physical-device pending.
- UI improvements remain staged behind playback/P0 safety rather than shipped as a risky broad rewrite.

## Protected regressions
Protect completed-file verification before ✓, local-only export/playback, `.part` rules, resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, score precedence, match failover/logos/Saudi time, episode_id vs episode_number, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, opaque-ref expiry, Arabic RTL, TV LEANBACK/D-Pad/focus, and iOS UNSIGNED/no-codesign labeling.

## Blockers / decisions
- No permission blocker is currently known.
- The initial v1.0.31 post-merge live-gate failures were upstream/live timeouts; all succeeded on unchanged-SHA reruns, so no code change was justified.
- The v1.0.25 iPhone bug remains historical physical evidence until a newer real-device retest passes.
- Do not expose provider URLs or place TMDB/provider secrets in Flutter for convenience.
- This state update is documentation-only and must not create or imply a new product version beyond v1.0.31.

## أهداف التشغيل التالي
1. Merge the documentation-only v1.0.31 state PR safely.
   - Require exact-head checks green.
   - Keep the release/product SHA explicitly separate from a later docs-only main SHA.
   - Confirm docs-only merge does not publish a new product Release.
2. Add safe direct-media internal hand-off.
   - Consume opaque fallback ref and probe result server-side.
   - Preserve Range/206/Content-Range/Accept-Ranges for MP4/HLS/MPEG-TS.
   - Reject unsupported/ambiguous content before native player launch.
3. Add bounded in-session provider failover.
   - Trigger next provider only from actual playback failure.
   - Enforce fixed attempt/time budgets and circuit state.
   - Return a clean terminal Arabic error after exhaustion.
4. Add real playback success evidence.
   - Require media/player `playing` signal.
   - Record latency/container/range capability only after actual playback.
   - Keep provider identity entirely server-side.
5. Complete TMDB fallback UX after playback safety.
   - Keep `القحطاني` default.
   - Add explicit source selector and empty-result fallback CTA.
   - Label fallback results without mixing source lists.
6. Preserve P0 download physical-retest readiness.
   - Require file existence/readability/EOF before ✓.
   - Verify restart persistence, missing-file recovery and local-only export.
   - Keep PHYSICAL-DEVICE status pending until real iPhone evidence.
7. Continue Fall 2 playback hardening.
   - Native first, internal WebView second.
   - No Safari/VLC/Intent escape path.
   - Exercise MP4/HLS/MPEG-TS seek/pause/resume/duration.
8. Continue match and long-download P1 work.
   - Safe MatchItem refs/failover, Saudi time, real logos and no fake 0-0.
   - Stable long-transfer restart/resume identity and `.part` cleanup.
   - Preserve episode_id vs episode_number identity.
9. Harden live-smoke observability without weakening gates.
   - Distinguish upstream timeout from product-contract failure in logs.
   - Keep fail-closed release semantics.
   - Rerun transient external failures before code changes.
10. Continue incremental UX improvements only after safety gates.
   - Reduce taps and improve recovery/empty/loading/library sorting states.
   - Preserve RTL/accessibility/TV focus and brand hierarchy.
   - Avoid cosmetic-only changes without measurable user value.
