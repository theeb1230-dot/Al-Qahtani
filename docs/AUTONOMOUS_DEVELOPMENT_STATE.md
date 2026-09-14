# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Current product `main`: `7aeb82d65b51a7e3c44563b073105311a0e373a0` (merged PR #114 `Add opaque direct-media fallback proxy`).
- PR #114 final exact head: `b185991f2a4ad1d133aba0ffa4522eeb89916b8c`.
- PR #114 exact-head CI: 14/14 workflows completed SUCCESS before merge.
- Product version/build: `1.0.32+32`.
- Runtime `PRODUCT_VERSION`: `1.0.32`.
- Post-merge state branch: `docs/post-v1.0.32-merge-state` (documentation-only, based on exact product SHA above).
- Latest published GitHub Release remains `v1.0.31` until the v1.0.32 post-merge Flutter/release gates complete.

## v1.0.31 release verification
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.31`.
- Release target: `e22678b00040f2e62bac1f0f4a3ff5f3774e4263`.
- `Al-Qahtani-Mobile-v1.0.31.apk` — 55,887,348 bytes — SHA-256 `71ea12ece8b09237919bb5569d1873278e1c49b84bf2efcc8a1b2156fedcf0e9`.
- `Al-Qahtani-TV-v1.0.31.apk` — 55,887,456 bytes — SHA-256 `fb2c7ecb9951e3ac6e5d076723861235e3f4382f44176e2a3274b2b11c1fedf9`.
- `Al-Qahtani-iOS-v1.0.31-UNSIGNED.ipa` — 7,896,069 bytes — SHA-256 `63107875d495b38870a8ea2bfd239a28beb481622436b3e05bdbe71f14ed13d5`.
- `SHA256SUMS.txt` and `PROVENANCE.json` are published and verified.

## v1.0.32 merge / CI evidence
- PR #114 added the first safe opaque direct-media fallback hand-off.
- All 14 PR workflows on exact head `b185991f2a4ad1d133aba0ffa4522eeb89916b8c` passed before merge, including Content runtime, Match runtime, Independent download resolution, Web smoke, Mobile WebKit, Remote movie playback, Live provider, CORS, Basri player/download, media-reference expiry, trusted filename and Flutter foundation.
- Merge commit/product SHA: `7aeb82d65b51a7e3c44563b073105311a0e373a0`.
- Post-merge GitHub Pages run `34905736122`: SUCCESS on the exact product SHA.
- Post-merge Flutter foundation run `34905736056`: analyze/tests SUCCESS; Android Mobile, Android TV and iOS UNSIGNED builds are still in progress at this state snapshot. No failure has been reported.
- Latest Release API still returns v1.0.31, so v1.0.32 is not yet published.

## Pages / Web state
- GitHub Pages run `34905736122` completed SUCCESS on v1.0.32 product SHA `7aeb82d65b51a7e3c44563b073105311a0e373a0`.
- Web/PWA remains the existing GitHub Pages product, not Flutter Web.
- No post-merge failure has been observed in the current Web/runtime gate set at this state snapshot.

## Physical-device P0 evidence
The user verified on a real iPhone running v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, while Files did not show it and tapping the completed card did nothing. This remains `v1.0.25 — FAILED / PHYSICAL-DEVICE VERIFIED BUG`.

Newer code contains completed-file existence/readability checks, local-path persistence/enumeration, internal offline playback, missing-file recovery and local share/export. Status remains `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING` until v1.0.31 or later is tested on a real iPhone with the full offline path.

Required retest: download -> restart app -> Library -> tap completed item -> disable network -> internal local playback -> start/seek/pause/resume/duration -> missing-file recovery -> Save to Files/share from local file only.

## TMDB fallback state
- TMDB adapter/search/status/details/season remain server-side only.
- Flutter does not contain `TMDB_API_KEY`.
- Basri/القحطاني remains the default/primary source.
- Explicit `القحطاني` / `TMDB الاحتياطي` selector, empty-result CTA and TMDB details/season UX remain pending until fallback playback/failover is complete.

## 27-provider fallback pool
Release-verified foundation through v1.0.31:
- exactly 27 server-side adapters;
- positive TMDB/season/episode validation;
- HTTPS-generated targets/hostname allowlists;
- provider templates/upstream URLs server-side only;
- health scoring, latency, circuit breaker and deterministic ranking;
- opaque TTL refs;
- bounded probe with manual redirects and MP4/HLS/MPEG-TS/embed classification;
- public `/api/v1/fallback/probe` accepts opaque refs only;
- provider success requires explicit real playback evidence, never HTTP 200 alone.

Merged in v1.0.32 product SHA:
- `FallbackPlaybackRuntime.openDirectMedia(ref)` consumes an opaque live ref only;
- Runtime re-probes server-side before hand-off and refuses redirects/ambiguous content;
- classified direct MP4 and MPEG-TS are proxied through `GET /api/v1/fallback/media?ref=<opaque>`;
- provider id/name/URL are never serialized publicly;
- client Range is restricted to single `bytes=start-end` form;
- `206`, `Content-Range`, `Accept-Ranges`, `Content-Length` and `Content-Type` are preserved;
- unsupported/classification-changing content fails closed;
- HLS returns `FALLBACK_HLS_PROXY_PENDING` rather than leaking playlist/segment URLs;
- direct byte transfer does not mark provider success; real player `playing` evidence remains mandatory.

Still pending:
- safe HLS playlist/segment rewriting behind opaque refs;
- Flutter internal-player consumption of `/api/v1/fallback/media`;
- bounded automatic next-provider attempts driven by real player failure;
- real `playing` signal/evidence endpoint before provider-health success;
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
9. 27-provider opaque probing: RELEASE VERIFIED through v1.0.31; MP4/MPEG-TS direct-media proxy MERGED in v1.0.32 product SHA; release publication/HLS/player/failover pending.
10. Favorites/Continue Watching/Downloads/History: baseline present; physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: v1.0.32 post-merge TV build verification still in progress; v1.0.31 remains CI VERIFIED.
12. Web/PWA: Pages VERIFIED on v1.0.32 product SHA; protected post-merge gates have no observed failure at this snapshot.

## v1.0.32 changed files
- `server/fallback-runtime.mjs` — safe opaque direct-media open path, Range validation, fail-closed classification.
- `server/index-runtime.mjs` — `/api/v1/fallback/media` streaming route and media CORS headers.
- `scripts/fallback_runtime_test.mjs` — direct MP4 Range hand-off, malformed Range and HLS fail-closed regressions.
- `scripts/fallback_runtime_http_test.mjs` — HTTP streaming/206/header/CORS/no-leak regression.
- `flutter_app/pubspec.yaml` — version/build `1.0.32+32`.
- `server/content-runtime.mjs` — Runtime version `1.0.32`.
- `docs/AUTONOMOUS_DEVELOPMENT_STATE.md` — state handoff.

## UX / safety decisions
- Primary content/action first; recovery second; no technical provider controls in normal UI.
- No provider names/URLs/sessions/health internals are exposed.
- Network probe/direct bytes are not labeled as playback success.
- HLS stays fail-closed until all URLs can be rewritten behind opaque Runtime refs.
- No broad UI rearrangement in this batch; RTL, thumb reach, accessibility and TV focus remain protected.
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
- #11 advanced again: opaque resolve/probe plus safe MP4/MPEG-TS direct Runtime proxy are now merged; HLS rewriting, actual-playing evidence and bounded next-provider switching remain.
- Offline playback/share foundations remain physical-device pending.
- UI improvements stay staged behind P0/playback safety rather than broad rewrites.

## Blockers / decisions
- No permission blocker is currently known.
- The only incomplete release gate at this snapshot is the still-running post-merge Flutter triplet build; no failure has been reported.
- Latest published Release remains v1.0.31 until v1.0.32 artifacts and exact-SHA release verification complete.
- The v1.0.25 iPhone bug remains authoritative physical evidence until a newer real-device retest passes.

## أهداف التشغيل التالي
1. Finish v1.0.32 post-merge Flutter foundation.
   - Require Android Mobile, Android TV and iOS UNSIGNED jobs SUCCESS.
   - Inspect logs and fix only a reproducible product failure.
   - Preserve exact product SHA binding.
2. Publish and verify v1.0.32 Release.
   - Require all protected exact-SHA gates green.
   - Publish Mobile APK + TV APK + iOS UNSIGNED + SHA256SUMS + PROVENANCE.
   - Reread Releases API and verify tag/target/assets/sizes/digests/downloadability.
3. Reverify all post-merge live/Web gates.
   - Pages, Web smoke, Mobile WebKit, CORS/Range/download/HLS.
   - Treat reproducible contract failures as code defects; transient upstream timeouts get unchanged-SHA rerun first.
4. Add safe HLS opaque rewriting.
   - Rewrite playlist and segment URIs behind Runtime refs.
   - Reject unsafe hosts/redirects.
   - Preserve MIME/Range semantics without URL leakage.
5. Add bounded in-session provider failover.
   - Trigger from actual player failure only.
   - Enforce attempt/time/circuit budgets.
   - Return one clear Arabic terminal error after exhaustion.
6. Add real playback success evidence.
   - Require player `playing` signal.
   - Record latency/container/range capabilities only then.
   - Keep provider identity server-side only.
7. Preserve P0 iPhone retest readiness.
   - Completed file existence/readability/EOF before ✓.
   - Restart persistence, missing-file recovery and local-only export.
   - Keep PHYSICAL-DEVICE status pending until real-device evidence.
8. Continue Fall 2/match/long-download P1 work.
   - Native -> internal WebView with no external-player escape.
   - Match safe refs/failover, Saudi time, logos and no fake 0-0.
   - Stable long-transfer resume identity and `.part` cleanup.
9. Complete TMDB fallback UX after playback safety.
   - Keep القحطاني default.
   - Add explicit fallback selector/CTA without mixed lists.
   - Add poster/year/type/rating and details/season UX.
10. Continue small measurable UX batches.
   - Reduce taps and improve recovery/empty/loading/library sorting states.
   - Preserve RTL/accessibility/TV focus and brand hierarchy.
   - No cosmetic-only changes without user value.
