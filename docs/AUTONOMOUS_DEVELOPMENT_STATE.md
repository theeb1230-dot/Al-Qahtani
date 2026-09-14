# Autonomous Development State

## Source of truth
GitHub is authoritative. Live Runtime behavior and the user's physical-device evidence are behavioral references. CI never upgrades a device-only item to PHYSICAL-DEVICE VERIFIED.

## Current GitHub state
- `main`: `634f3e324adeebb06bcf8bac4272104df19f6c0e` (merged PR #109).
- No open PR existed at the start of this run.
- Active development branch: `feat/bounded-fallback-probing-110`.
- Product version/build on this branch: `1.0.30+30`.
- v1.0.29 is RELEASE VERIFIED from exact main SHA `634f3e324adeebb06bcf8bac4272104df19f6c0e`.

## Release v1.0.29 evidence
- Flutter foundation run `34793591027`: SUCCESS on exact SHA `634f3e324adeebb06bcf8bac4272104df19f6c0e`.
- Release Flutter triplet run `34793925780`: SUCCESS on the same SHA.
- Release tag: `v1.0.29`.
- Release target: `634f3e324adeebb06bcf8bac4272104df19f6c0e`.
- Assets:
  - `Al-Qahtani-Mobile-v1.0.29.apk` — 55,887,352 bytes — SHA-256 `93b024cbc37446dc218ed3185b33765e7b2539148477b675e29b04c55dde5a13`.
  - `Al-Qahtani-TV-v1.0.29.apk` — 55,887,456 bytes — SHA-256 `4618c2beae15ff0b3b6843bcafa6248f656c5616e532a830ee4f22a06a395aeb`.
  - `Al-Qahtani-iOS-v1.0.29-UNSIGNED.ipa` — 7,896,071 bytes — SHA-256 `77aea71b64c4b2123c14676803af83e58e4d75db042353d08b2915e53d7a97cc`.
  - `SHA256SUMS.txt` and `PROVENANCE.json` are published with the release.
- Android Mobile identity/signature verification passed in Flutter foundation.
- Android TV LEANBACK/source requirements, packaged features, identity and signature checks passed.
- iOS bundle verification explicitly confirmed UNSIGNED/no-codesign packaging.

## Physical-device P0 evidence
The user verified on iPhone v1.0.25 that `Spider Man Brand New Day` appeared as a completed 838.4 MB download with ✓ in Library, but Files did not show it and tapping the completed card did nothing. This remains the authoritative historical `FAILED / PHYSICAL-DEVICE VERIFIED BUG` for v1.0.25.

v1.0.26+ contains completed-file verification, local-path enumeration, internal offline playback, missing-file recovery, and local share/export. Status remains `FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING` until v1.0.29 or later is tested on a real iPhone.

## TMDB fallback state
Merged foundation:
- server-side-only TMDB adapter and search/status/details/season APIs;
- timeout/cache/error normalization;
- Arabic locale and adult filtering;
- stable TMDB movie/TV and episode identities;
- Flutter does not contain `TMDB_API_KEY`.

Pending user-complete UX:
- explicit القحطاني / TMDB الاحتياطي source control;
- empty-result CTA `ابحث في المصدر الاحتياطي`;
- TMDB details/season UI;
- no TMDB playback CTA until safe fallback playback hand-off is complete.

## 27-provider fallback pool
Merged before this run:
- exactly 27 server-side provider adapters;
- positive TMDB/season/episode validation;
- HTTPS-only generated URLs and hostname allowlists;
- provider templates/upstream URLs remain server-side;
- `ProviderHealthRegistry` scoring, latency, failure tracking and circuit breaker;
- deterministic ranking;
- TTL-bound opaque refs `fallback:<opaque-id>`;
- bounded ref storage/expiry cleanup;
- fallback resolve/next routes;
- success requires explicit playback signal and never HTTP 200 alone.

Current v1.0.30 branch adds the first bounded probing/classification layer:
- byte-bounded GET probe using `Range: bytes=0-1023`;
- per-probe timeout clamped to 250–5000 ms;
- redirects are `manual` and are not followed during probing;
- MP4/HLS/MPEG-TS classification by response content type;
- HTML/embed classification remains non-playable until real player evidence exists;
- HTTP 200 with unsupported content remains non-playable;
- response bodies are cancelled after header classification;
- probe result never exposes an upstream URL;
- deterministic unit/regression coverage added in `scripts/fallback_probe_test.mjs`.

Still pending:
- safe Runtime endpoint/integration from opaque ref to probe result;
- redirect allowlist policy if selected providers require a redirect hop;
- internal-player proxy/hand-off for classified direct media;
- real player success/failure evidence and automatic in-session next-provider failover.

## P0/P1 status
1. Completed iPhone download tap bug: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
2. Save to Files/share local file: FIXED IN CODE / CI VERIFIED; PHYSICAL-DEVICE RECHECK PENDING.
3. Fall 2 native→internal WebView playback: code path exists; physical-device playback NOT VERIFIED.
4. Long download/resume: regression coverage exists; interrupted physical transfer NOT VERIFIED.
5. Match safe runtime playback/failover: baseline exists; live-device playback NOT VERIFIED.
6. Match scores without fake 0-0: FIXED IN CODE / CI VERIFIED.
7. Search posters/type/year/dedupe: baseline present.
8. TMDB search/details/seasons: MERGED; user-facing source selector pending.
9. 27-provider health/circuit/opaque refs: MERGED; bounded probe classifier now IN PR / CI PENDING.
10. Favorites/Continue Watching/Downloads/History: baseline present; full physical persistence lifecycle pending.
11. TV LEANBACK/D-Pad/focus: CI VERIFIED in v1.0.29.
12. Web/PWA: protected Web gates remain enabled; live Pages recheck is required after each product merge.

## UX decisions
- Al-Qahtani/Basri stays primary; TMDB is explicit fallback.
- Do not mix primary and fallback result lists by default.
- No provider names, URLs, sessions or technical health details in normal UI.
- No clickable fallback playback until opaque ref → internal player + bounded failover are ready.
- Primary action first, recovery action second; avoid technical button clutter.
- Preserve Arabic RTL, navy/black + metallic gold identity, readable contrast, thumb reach, and TV visible focus.
- No large page rewrites before navigation/widget/smoke evidence.

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

Current completion: #11 is in progress. Registry/health/opaque refs are merged and the bounded probe/classifier is now being added as the next small regression-tested slice.

## Protected regressions
Protect completed-file verification before ✓, local-only export/playback, `.part` rules, resume identity, Range/206/Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS, independent Watch/Download resolution, trusted filenames, score precedence, match failover/logos/Saudi time, episode_id vs episode_number, search dedupe, 30+30 pagination, CORS/SSRF/allowlists, media-ref expiry, Arabic RTL, TV LEANBACK/D-Pad/focus, and iOS UNSIGNED/no-codesign labeling.

## Changed files in current branch
- `server/fallback-probe.mjs` — bounded probe and media/embed classifier.
- `scripts/fallback_probe_test.mjs` — deterministic probe/classification regression coverage.
- `package.json` — includes probe syntax/test coverage in `npm run check`.
- `flutter_app/pubspec.yaml` — version/build `1.0.30+30`.
- `docs/AUTONOMOUS_DEVELOPMENT_STATE.md` — release evidence and current branch handoff.

## أهداف التشغيل التالي
1. Finish PR #110 exact-head CI.
   - Require all triggered checks green on final head.
   - Inspect failures from logs and fix on the same branch only.
   - Merge only when exact-head checks and mergeability are green.
2. Verify v1.0.30 same-SHA delivery after merge.
   - Flutter foundation Mobile/TV/iOS triplet on final main SHA.
   - Match and Independent download gates on same SHA.
   - Release tag/assets/SHA256/PROVENANCE after all protected gates.
3. Wire bounded probe through Runtime safely.
   - Accept opaque fallback ref only.
   - Never expose target/provider URL.
   - Keep redirect handling fail-closed until allowlist policy is explicit.
4. Add direct-media hand-off.
   - Preserve Range/206.
   - Support MP4/HLS/MPEG-TS.
   - Reject unsupported responses before player launch.
5. Add automatic in-session fallback.
   - Record real playback failure.
   - Move to next healthy provider within a bounded attempt budget.
   - Stop after budget/circuit limits.
6. Add real playback evidence.
   - Do not mark provider success on reachability alone.
   - Require media/playing signal.
   - Record latency/container/range capability after actual playback.
7. Add TMDB fallback UX after playback safety.
   - Keep القحطاني default.
   - Add explicit fallback CTA/source selector.
   - Label fallback results without mixed lists.
8. Continue P0 physical-device validation tracking.
   - Completed download → offline local player.
   - Verify seek/pause/resume/duration and missing-file recovery.
   - Verify Save to Files/share from local file only.
9. Verify Web/PWA after merge.
   - Pages + Web smoke + Mobile WebKit.
   - CORS/Range/download regressions.
   - Confirm no product regression from Runtime-only changes.
10. Continue incremental UX improvements only after P0/P1 gates.
   - Prefer fewer taps and clear recovery CTAs.
   - Preserve TV focus and Arabic RTL.
   - Avoid decorative changes without user value.
