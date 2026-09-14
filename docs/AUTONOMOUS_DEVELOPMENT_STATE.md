# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Current `main`: `e924f7da9a363324171ff430d95dc46efeecc9bf` (docs-only merge PR #113).
- Latest product/release SHA: `e22678b00040f2e62bac1f0f4a3ff5f3774e4263`.
- Latest verified GitHub Release: `v1.0.31` from exact product SHA above.
- Active PR: #114 `Add opaque direct-media fallback proxy`.
- Active branch: `feat/fallback-direct-media-114`.
- Product version/build on PR #114: `1.0.32+32`.
- Runtime `PRODUCT_VERSION`: `1.0.32`.
- PR #114 exact head before this state-doc commit was `2cb1af71ef9a019e738f1a3fc7c566d01bd85cdc`; updating this file creates the final exact-head CI target for this run.

## v1.0.31 release verification
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.31`.
- Release target: `e22678b00040f2e62bac1f0f4a3ff5f3774e4263`.
- `Al-Qahtani-Mobile-v1.0.31.apk` — 55,887,348 bytes — SHA-256 `71ea12ece8b09237919bb5569d1873278e1c49b84bf2efcc8a1b2156fedcf0e9`.
- `Al-Qahtani-TV-v1.0.31.apk` — 55,887,456 bytes — SHA-256 `fb2c7ecb9951e3ac6e5d076723861235e3f4382f44176e2a3274b2b11c1fedf9`.
- `Al-Qahtani-iOS-v1.0.31-UNSIGNED.ipa` — 7,896,069 bytes — SHA-256 `63107875d495b38870a8ea2bfd239a28beb481622436b3e05bdbe71f14ed13d5`.
- `SHA256SUMS.txt` and `PROVENANCE.json` are published and verified.
- Android Mobile identity/signature, Android TV LEANBACK/D-Pad/package/signature, and iOS UNSIGNED/no-codesign checks passed.

## Pages / Web state
- v1.0.31 Web/PWA is RELEASE VERIFIED and GitHub Pages remained on the existing web product, not Flutter Web.
- Protected WebKit, CORS, Range/download, HLS, Basri and Runtime gates were green on the v1.0.31 product SHA after unchanged-SHA reruns of transient live timeouts.
- PR #114 must pass its exact-head Web/runtime checks before merge; Pages must then be reverified on the merged product SHA.

## Physical-device P0 evidence
The user verified on a real iPhone running v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, while Files did not show it and tapping the completed card did nothing. This remains `v1.0.25 — FAILED / PHYSICAL-DEVICE VERIFIED BUG`.

Newer code contains completed-file existence/readability checks, local-path persistence/enumeration, internal offline playback, missing-file recovery and local share/export. Status remains `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING` until v1.0.31 or later is tested on a real iPhone with the full offline path.

Required retest: download -> restart app -> Library -> tap completed item -> disable network -> internal local playback -> start/seek/pause/resume/duration -> missing-file recovery -> Save to Files/share from local file only.

## TMDB fallback state
- TMDB adapter/search/status/details/season remain server-side only.
- Flutter does not contain `TMDB_API_KEY`.
- Basri/القحطاني remains the default/primary source.
- Explicit `القحطاني` / `TMDB الاحتياطي` selector, empty-result CTA and TMDB details/season UX remain pending until fallback playback hand-off/failover is safe.

## 27-provider fallback pool
Release-verified foundation through v1.0.31:
- exactly 27 server-side adapters;
- positive TMDB/season/episode validation;
- HTTPS-generated targets/hostname allowlists;
- provider templates and upstream URLs server-side only;
- health scoring, latency, circuit breaker and deterministic ranking;
- opaque TTL refs;
- bounded probe with manual redirects, MP4/HLS/MPEG-TS/embed classification and no URL leakage;
- public `/api/v1/fallback/probe` accepts opaque refs only;
- provider success still requires explicit real playback signal and never HTTP 200 alone.

PR #114 advances improvement #11 `Automatic bounded server recovery` with the first safe direct-media hand-off:
- new `FallbackPlaybackRuntime.openDirectMedia(ref)` consumes an opaque live ref only;
- it re-probes server-side before hand-off and refuses redirects/ambiguous content;
- only classified direct MP4 and MPEG-TS are currently proxied;
- public `GET /api/v1/fallback/media?ref=<opaque>` streams bytes without serializing provider id/name/URL;
- client Range is restricted to a single `bytes=start-end` form;
- response preserves `206`, `Content-Range`, `Accept-Ranges`, `Content-Length` and `Content-Type`;
- unsupported content/classification changes fail closed;
- HLS deliberately returns `FALLBACK_HLS_PROXY_PENDING` rather than leaking playlist/segment upstream URLs before safe rewriting is implemented;
- probe/direct hand-off does not call `recordSuccess`; real player `playing` evidence remains mandatory.

Still pending:
- safe HLS playlist/segment rewriting behind opaque refs;
- bounded automatic next-provider attempts driven by actual player failure;
- Flutter internal-player consumption of `/api/v1/fallback/media`;
- real `playing` signal endpoint/evidence before provider-health success;
- redirect-hop allowlist only if live evidence proves it necessary.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share local file: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Fall 2 native -> internal WebView playback: code path exists; PHYSICAL-DEVICE NOT VERIFIED.
4. Long download/resume: regression coverage exists; interrupted physical transfer NOT VERIFIED.
5. Match safe runtime playback/failover: baseline exists; live-device playback NOT VERIFIED.
6. Match scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
7. Search posters/type/year/dedupe: baseline present.
8. TMDB search/details/seasons: MERGED; user-facing selector pending.
9. 27-provider opaque probing: RELEASE VERIFIED through v1.0.31; MP4/MPEG-TS direct-media proxy is IN PR #114; HLS/player/failover pending.
10. Favorites/Continue Watching/Downloads/History: baseline present; physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI VERIFIED in v1.0.31.
12. Web/PWA: v1.0.31 VERIFIED; v1.0.32 pending PR merge/post-merge verification.

## PR #114 changed files
- `server/fallback-runtime.mjs` — safe opaque-ref direct-media open path, range validation, fail-closed classification.
- `server/index-runtime.mjs` — `/api/v1/fallback/media` streaming route and media CORS headers.
- `scripts/fallback_runtime_test.mjs` — direct MP4 Range hand-off, malformed Range and HLS fail-closed regressions.
- `scripts/fallback_runtime_http_test.mjs` — HTTP streaming/206/header/CORS/no-leak regression.
- `flutter_app/pubspec.yaml` — `1.0.32+32`, existing Flutter lint baseline preserved.
- `server/content-runtime.mjs` — Runtime version aligned to `1.0.32`.
- `docs/AUTONOMOUS_DEVELOPMENT_STATE.md` — this state handoff.

## UX / safety decisions
- Primary content/action first; recovery second; no technical provider controls in normal UI.
- No provider names/URLs/sessions/health internals are exposed.
- A network probe or direct byte response is not labeled as playback success.
- HLS is fail-closed until URLs can be rewritten safely through opaque refs.
- No broad UI rearrangement in this batch; cognitive load, RTL, thumb reach, accessibility and TV focus remain protected.
- Brand remains Arabic RTL with navy/black + metallic gold and Q/ق+Play identity.

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
- #11 is in progress: opaque resolve/probe are release-verified; PR #114 adds safe MP4/MPEG-TS direct hand-off. HLS rewriting, actual-playing evidence and bounded next-provider switching remain.
- Offline playback/share foundations remain physical-device pending.
- UI improvements stay staged behind playback/P0 safety instead of broad rewrites.

## CI / blockers for this run
- PR #114 opened from main with product/runtime version `1.0.32`.
- On pre-state-doc head `2cb1af71ef9a019e738f1a3fc7c566d01bd85cdc`, 14 workflows were triggered and none had reported failure at the last read; several were queued/in progress.
- The state-doc commit intentionally creates a new exact head and therefore exact-head CI must rerun before merge.
- No permission blocker is known.
- Latest published Release remains v1.0.31 until PR #114 is green, merged and post-merge release gates complete.

## أهداف التشغيل التالي
1. Finish PR #114 exact-head CI.
   - Require every triggered workflow green on the final head.
   - Inspect exact logs for any failure and fix on the same branch only.
   - Merge only with expected-head protection.
2. Verify v1.0.32 post-merge delivery.
   - Require Mobile APK + TV APK + iOS UNSIGNED from the same main product SHA.
   - Verify package identities/signatures/LEANBACK/no-codesign and SHA-256/provenance.
   - Publish and reread GitHub Release only after protected gates are green.
3. Reverify Web/PWA on the v1.0.32 product SHA.
   - Pages deployment.
   - Web smoke/Mobile WebKit/CORS/Range/download/HLS regressions.
   - Preserve current non-Flutter-Web product.
4. Add safe HLS opaque rewriting.
   - Rewrite playlist/segment URIs to Runtime opaque refs.
   - Reject cross-host/unsafe redirects unless explicit allowlist evidence exists.
   - Preserve HLS MIME/Range behavior without URL leakage.
5. Add bounded in-session provider failover.
   - Trigger next provider from actual playback failure only.
   - Enforce attempt/time/circuit budgets.
   - Return one clear Arabic terminal error after exhaustion.
6. Add real playback success evidence.
   - Require actual player `playing` signal.
   - Record latency/container/range capabilities only then.
   - Never expose provider identity to Flutter.
7. Preserve P0 iPhone retest readiness.
   - Completed file existence/readability/EOF before ✓.
   - Restart persistence, missing-file recovery and local-only export.
   - Keep PHYSICAL-DEVICE status pending until real-device evidence.
8. Continue Fall 2/match/long-download P1 work.
   - Native -> internal WebView for Fall 2, no external player escape.
   - Match safe refs/failover, Saudi time, logos, no fake 0-0.
   - Long-transfer resume identity and `.part` cleanup.
9. Complete TMDB fallback UX after playback safety.
   - Keep القحطاني default.
   - Add explicit fallback selector/CTA without mixed lists.
   - Add poster/year/type/rating and season/details UI.
10. Continue small measurable UX batches.
   - Reduce taps, improve recovery/empty/loading/library sorting states.
   - Preserve RTL/accessibility/TV focus and brand hierarchy.
   - No cosmetic-only changes without user value.
