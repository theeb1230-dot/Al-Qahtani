# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- Product `main`: `7aeb82d65b51a7e3c44563b073105311a0e373a0` (merged PR #114 `Add opaque direct-media fallback proxy`).
- PR #114 final exact head: `b185991f2a4ad1d133aba0ffa4522eeb89916b8c`; 14/14 PR workflows were green before merge.
- Product version/build: `1.0.32+32`.
- Runtime `PRODUCT_VERSION`: `1.0.32`.
- Active PR: #115 `Record v1.0.32 post-merge state`, documentation-only.
- Latest verified GitHub Release: `v1.0.32` from exact product SHA `7aeb82d65b51a7e3c44563b073105311a0e373a0`.

## v1.0.32 release verification
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.32`.
- Release target: `7aeb82d65b51a7e3c44563b073105311a0e373a0`.
- Post-merge Flutter foundation run `34905736056`: Android Mobile SUCCESS, Android TV SUCCESS, analyze/tests SUCCESS, iOS UNSIGNED SUCCESS.
- Android Mobile identity/brand/signature verification passed.
- Android TV LEANBACK/D-Pad/source/package/signature verification passed.
- iOS was built without codesign and UNSIGNED package verification passed.
- GitHub Pages run `34905736122`: SUCCESS on the exact product SHA.
- Assets verified through Releases API:
  - `Al-Qahtani-Mobile-v1.0.32.apk` — 55,887,348 bytes — SHA-256 `b5f7a601945bcfba39ea9f001f830119c5040c09b8f11f8e746c91ef108cedef`.
  - `Al-Qahtani-TV-v1.0.32.apk` — 55,887,456 bytes — SHA-256 `1fc62c756433f580fcf4f5c4f50a998dd614b447663d963c17b4877959db01ad`.
  - `Al-Qahtani-iOS-v1.0.32-UNSIGNED.ipa` — 7,896,071 bytes — SHA-256 `a1afb49cd2af38d470e1b88f24d1e2031b266c0f17c0b2ecf51a6a4fa3a30a8a`.
  - `SHA256SUMS.txt` — 290 bytes — SHA-256 `c5ff6efa49ba6e6cb1400b6a2072e3214cffadf444eb7df757155fff0353de6e`.
  - `PROVENANCE.json` — 580 bytes — SHA-256 `b6f0600f73771d0277834bd59efecae058ec71c8a486009cf415442524690d78`.

## Pages / Web state
- Web/PWA remains the existing GitHub Pages product and is not replaced by Flutter Web.
- Pages is verified on the exact v1.0.32 product SHA.
- PR #115 exact-head CI was green before this release-state correction; this commit must receive a fresh exact-head green matrix before merge.

## Physical-device P0 evidence
The user verified on a real iPhone running v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, while Files did not show it and tapping the completed card did nothing. This remains `v1.0.25 — FAILED / PHYSICAL-DEVICE VERIFIED BUG`.

Newer code contains completed-file existence/readability checks, local-path persistence/enumeration, internal offline playback, missing-file recovery and local share/export. v1.0.32 is RELEASE VERIFIED in CI, but the P0 remains `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING` until a newer build is tested on a real iPhone with the complete offline path.

Required retest: download -> restart app -> Library -> tap completed item -> disable network -> internal local playback -> start/seek/pause/resume/duration -> missing-file recovery -> Save to Files/share from local file only.

## TMDB fallback state
- TMDB search/status/details/season stays server-side only.
- Flutter does not contain `TMDB_API_KEY`.
- Basri/القحطاني stays default/primary.
- Explicit `القحطاني` / `TMDB الاحتياطي` selector, empty-result CTA and TMDB details/season UX remain pending until fallback playback/failover is safe.

## 27-provider fallback pool
Release verified through v1.0.32:
- exactly 27 server-side adapters;
- positive TMDB/season/episode validation;
- HTTPS targets plus hostname allowlists;
- provider templates/upstream URLs remain server-side;
- health scoring, latency, circuit breaker and deterministic ranking;
- opaque TTL fallback refs;
- bounded probe with manual redirects and MP4/HLS/MPEG-TS/embed classification;
- public probe accepts opaque refs only;
- provider success requires real playback evidence, never HTTP 200 alone;
- v1.0.32 adds safe MP4/MPEG-TS proxy through `/api/v1/fallback/media?ref=<opaque>` preserving Range/206/Content-Range/Accept-Ranges without URL/provider leakage;
- HLS remains fail-closed with `FALLBACK_HLS_PROXY_PENDING` until playlist/segment rewriting is safe;
- direct byte transfer still does not mark provider success.

Still pending:
- safe HLS playlist/segment opaque rewriting;
- Flutter internal-player consumption of fallback media;
- bounded automatic next-provider attempts driven by real player failure;
- real `playing` evidence before provider-health success;
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
9. 27-provider opaque probing + MP4/MPEG-TS direct-media proxy: RELEASE VERIFIED in v1.0.32; HLS/player/failover pending.
10. Favorites/Continue Watching/Downloads/History: baseline present; physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI VERIFIED in v1.0.32.
12. Web/PWA: Pages VERIFIED on v1.0.32 product SHA.

## v1.0.32 changed files
- `server/fallback-runtime.mjs` — opaque direct-media open path, Range validation, fail-closed classification.
- `server/index-runtime.mjs` — `/api/v1/fallback/media` streaming route and media CORS headers.
- `scripts/fallback_runtime_test.mjs` — direct MP4 Range hand-off, malformed Range and HLS fail-closed regressions.
- `scripts/fallback_runtime_http_test.mjs` — HTTP 206/header/CORS/no-leak regression.
- `flutter_app/pubspec.yaml` — `1.0.32+32`.
- `server/content-runtime.mjs` — Runtime `1.0.32`.
- `docs/AUTONOMOUS_DEVELOPMENT_STATE.md` — release/state handoff.

## UX / safety decisions
- Primary content/action first; recovery second; no technical provider controls in normal UI.
- No provider names, URLs, sessions or health internals in UI/logs.
- Probe/direct bytes are not labeled as playback success.
- HLS stays fail-closed until all playlist/segment URLs can remain opaque.
- No broad interface rewrite in this batch; RTL, thumb reach, accessibility and TV focus remain protected.
- Brand remains navy/black + metallic gold with Q/ق+Play identity.

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
- #11 server-side resolve/probe and safe MP4/MPEG-TS Runtime proxy are RELEASE VERIFIED in v1.0.32. HLS rewriting, actual-playing evidence and bounded next-provider switching remain.
- Offline playback/share foundations remain physical-device pending.
- UI improvements stay staged behind P0/playback safety.

## Blockers / decisions
- No permission blocker is currently known.
- v1.0.32 Release is published and verified; previous stale documentation claiming v1.0.31 was latest has been corrected in PR #115.
- v1.0.25 iPhone evidence remains authoritative until a newer physical-device retest passes.

## أهداف التشغيل التالي
1. Merge PR #115 safely.
   - Require fresh exact-head CI green after this release-state correction.
   - Keep docs-only merge distinct from product/release SHA.
2. Add safe HLS opaque rewriting.
   - Rewrite playlist/segment URIs into Runtime refs.
   - Reject unsafe hosts/redirects.
   - Preserve MIME/Range behavior without URL leakage.
3. Add bounded in-session provider failover.
   - Trigger only from actual player failure.
   - Enforce attempt/time/circuit budgets.
   - Return one clear Arabic terminal error after exhaustion.
4. Add real playback success evidence.
   - Require `playing` signal.
   - Record latency/container/range only after playback.
   - Keep provider identity server-side.
5. Integrate fallback media with Flutter internal player.
   - Native direct media first.
   - Internal WebView only where necessary.
   - No Safari/VLC/Intent escape path.
6. Complete TMDB fallback UX after playback safety.
   - Keep القحطاني default.
   - Add source selector and empty-result CTA.
   - Show poster/title/year/type/rating with fallback badge.
7. Preserve P0 iPhone retest readiness.
   - Completed file existence/readability/EOF before ✓.
   - Restart persistence/missing-file recovery/local export.
   - Keep device status pending until real evidence.
8. Continue Fall 2, match and long-download P1.
   - Safe match refs/failover, Saudi time, logos, no fake 0-0.
   - Stable resume identity and `.part` cleanup.
9. Harden live-smoke observability without weakening gates.
   - Separate upstream timeout from product-contract failure.
   - Rerun transient external failures unchanged-SHA first.
10. Continue small measurable UX batches.
   - Reduce taps and improve recovery/loading/library states.
   - Preserve RTL/accessibility/TV focus and brand hierarchy.
