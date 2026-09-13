# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with earlier reports. The preserved original `albasritv.github.io-main.zip`, live Al-Qahtani/Basri Runtime evidence, and the user's iPhone screenshots/videos remain behavioral references. CI alone does not prove physical-device playback/download behavior.

## Current state
- Product/release commit: `e2f21de0b3c44b8f4009a6255c5e882b782c38d9`, merge of PR #96 `Fix authoritative match score precedence`.
- PR #96 final head: `3691f45c01f159f9e356b8954b1683b2048dba87`; branch `fix/match-score-precedence-96`.
- Product version/build: `1.0.23+23`; Runtime `PRODUCT_VERSION` is `1.0.23`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/`; Flutter Web did not replace it.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, helper app, VLC/Safari/Intent fallback, or provider scraping was introduced into Flutter.
- Official user-facing identity remains `القحطاني TV`: deep navy/black, metallic gold, circular Q/ق play mark, Arabic horizontal logo, matching icon/splash, RTL and gold-accented controls/cards.

## Root cause closed in v1.0.23
`normalizeMatch` previously read nested `team1.goals/team2.goals` before authoritative top-level score fields such as `home_score/away_score`. If Basri supplied nested placeholder zeroes together with a real top-level score, for example nested `0-0` plus authoritative `2-1`, the placeholder won and the real score was discarded. The ended-match guard could then turn that false `0-0` into an unknown result, hiding the actual score.

v1.0.23 now prefers authoritative top-level score fields, falls back to nested team values only when authoritative values are absent, preserves explicit top-level `0-0` as a legitimate result, and still treats ended nested-only `0-0` placeholders as unknown to avoid inventing a score. Regressions cover a 2-1 ended match with nested placeholders, explicit ended 0-0, absent score, and a live changing/non-zero score.

## Changed files in PR #96
- `server/content-runtime.mjs`
- `scripts/content_runtime_test.mjs`
- `flutter_app/pubspec.yaml`

## RELEASE VERIFIED v1.0.23
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.23`.
- Release ID: `387763236`.
- Target commit: `e2f21de0b3c44b8f4009a6255c5e882b782c38d9`.
- Published at: `2026-09-13T01:53:37Z`.
- `Al-Qahtani-Mobile-v1.0.23.apk`: 55,149,052 bytes; SHA-256 `1ab7e9c33494bcef6cf75b2899805a13ca1797b1060ea6263c4a3c35eab7d60d`.
- `Al-Qahtani-TV-v1.0.23.apk`: 55,149,168 bytes; SHA-256 `24afc365e0c15285dd9fa96008b8b6952c3edbd0daff2bcf3ea64cfb190a968d`.
- `Al-Qahtani-iOS-v1.0.23-UNSIGNED.ipa`: 7,781,025 bytes; SHA-256 `a2f0587f5d2307f691d526c98f4a486c75e1a6182503dbc3e897570f42f1d1f8`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `f19617b107b92f1ee9eacbaf05fa307acfa8c7ff27cddde1188e030e68b48655`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `a1942538e73b0b7e2d390346c0c73c2f0176508502050fc3729192c593617aa3`.
- Release Flutter triplet run `34731640238`: SUCCESS on the exact product commit.

## CI / Pages evidence
### PR #96 exact-final-head `3691f45c01f159f9e356b8954b1683b2048dba87`
- Required check-runs on the exact head completed without a recorded failure before merge.
- PR was mergeable and merged only with `expected_head_sha` pinned to the final head.

### Main product commit `e2f21de0b3c44b8f4009a6255c5e882b782c38d9`
- Flutter foundation `34731411704`: SUCCESS; analyze/tests, Android Mobile APK identity/signature, Android TV APK LEANBACK/features and iOS UNSIGNED/no-codesign all succeeded.
- GitHub Pages build/deployment `34731411258`: SUCCESS on the same product commit.
- Web smoke `34731411724`: SUCCESS.
- Match runtime `34731411732`: SUCCESS.
- Content runtime `34731411763`: SUCCESS.
- CORS boundary `34731411713`: SUCCESS.
- Release Flutter triplet `34731640238`: SUCCESS; generated and verified the real GitHub Release for the same SHA.
- GitHub Pages URL: `https://theeb1230-dot.github.io/Al-Qahtani/`.

## P0/P1 status after v1.0.23
1. **Official identity `القحطاني TV`:** FIXED IN CODE / BUILD+ARTIFACT CI VERIFIED / PHYSICAL DEVICE VISUAL RECHECK PENDING.
2. **Native-first movie/episode playback:** code/runtime path protected; Fall 2: Deadpoint on actual iPhone/Android is **NOT PHYSICAL-DEVICE VERIFIED**.
3. **Native→internal WebView fallback:** FIXED IN CODE / CI VERIFIED; real phone playback is **NOT PHYSICAL-DEVICE VERIFIED**.
4. **Continue Watching from internal WebView:** FIXED IN CODE / regression covered / **NOT PHYSICAL-DEVICE VERIFIED**.
5. **External helper app:** intentionally NOT USED.
6. **Download progress/cancel/retry/Range/content-length/trusted filename:** FIXED IN CODE / CI protected / **NOT PHYSICAL-DEVICE VERIFIED** on a complete real transfer.
7. **Persistent partial resume across later retry/session and stable partial identity:** FIXED IN CODE / regressions covered / **NOT PHYSICAL-DEVICE VERIFIED**.
8. **Downloads Library/file existence persistence:** code path exists; real completed-file persistence remains **NOT PHYSICAL-DEVICE VERIFIED**.
9. **Match→Player Flutter/Web + bounded failover:** code/runtime protected / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.23.
10. **Incorrect match score precedence:** **FIXED IN CODE / CI VERIFIED**. Top-level authoritative score now wins over nested placeholders; explicit real 0-0 is preserved. A real changing live match remains **NOT PHYSICAL-DEVICE VERIFIED**.
11. **Match logos/Saudi time:** contract coverage exists; physical visual recheck pending.
12. **Search posters/season-aware dedupe:** code/regressions protected; DEVICE VISUAL RECHECK PENDING.
13. **Technical RuntimeHome/home item:** removed from user navigation; TV/mobile device navigation recheck pending.
14. **Favorites / Continue Watching / History / Downloads library:** regression baseline preserved; full real-device persistence lifecycle pending.
15. **Reacher season 4:** **NOT PHYSICAL-DEVICE VERIFIED**.
16. **Movies Details→Watch/Download:** contract/CI covered; device recheck pending.
17. **News parity:** baseline protected; device recheck pending.
18. **Web player lifecycle / iPhone Safari:** Web/WebKit/runtime smokes green; real iPhone Safari playback remains **NOT PHYSICAL-DEVICE VERIFIED** in this environment.
19. **Four-surface E2E:** PARTIAL. Pages and all three package artifacts/releases are verified; full physical-device behavior is not complete.

## Blockers and decisions
- The automation environment exposes no physical iPhone, Android handset, or Android TV, so device-only playback/download/match assertions remain NOT VERIFIED rather than falsely marked fixed.
- No repository permission blocker exists for code changes, PRs, CI, Pages, merges, or Releases.
- Cloudflare mirror remains deferred pending explicit infrastructure/permission evidence.
- providers.js v2 / api-client.js health/retry/circuit-breaker/cache work remains behind remaining P0 evidence/hardening priorities and must stay inside Al-Qahtani/Basri boundaries.

## Protected regressions
Protect authoritative-vs-placeholder match score precedence and explicit real 0-0, native→internal WebView playback evidence and timeout, Range/206/Content-Range/Accept-Ranges, stable resumable/cancellable partial identity and strict cleanup/integrity, exact known-length completion, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, independent Watch/Download resolution, trusted filenames, Match source discovery/failover/logos/Saudi time, `episode_id` vs `episode_number`, Search posters/season-aware dedupe, 30+30 infinite pagination with stale/concurrency guards, CORS/SSRF/allowlists, media-ref expiry/sweeper, no ads/popups/unneeded tracking, no external playback Intent/deep-links, Favorites/History/Downloads semantics, TV D-Pad/focus + LEANBACK, Arabic RTL branding, and iOS UNSIGNED/no-codesign labeling.

## أهداف التشغيل التالي
1. **إثبات score حيّ من المصدر إلى الواجهة.**
   - التقاط مباراة live ذات score متغير من Runtime.
   - مقارنة home/away والترتيب والحالة على Web وFlutter.
   - إبقاء أي نتيجة غير مثبتة NOT VERIFIED بدل hardcode.
2. **تعزيز DetailsPage→DownloadService integration.**
   - إضافة widget/integration regression لهوية resume الفعلية.
   - اختبار same-title movies وmulti-episode collisions.
   - منع provider refs من partial names/logs.
3. **إثبات persistent resume على جهاز فعلي عند توفر دليل.**
   - قطع تنزيل طويل ثم إعادة المحاولة.
   - التحقق أن Range يبدأ من حجم `.part`.
   - تحقق EOF والحجم النهائي وعدم ظهور `.part` في المكتبة.
4. **إثبات Fall 2 على iPhone/Android.**
   - native-first start/duration/seek/pause/resume.
   - عند رفض native إثبات WebView `playing` الحقيقي.
   - منع Safari/VLC/Intent وكشف upstream.
5. **إثبات Reacher S4 end-to-end.**
   - Search→Details→Episodes مع episode_id مستقل.
   - تشغيل حلقة فعلية وقياس duration/seek.
   - تنزيل حلقة مع cancel/retry/resume.
6. **إثبات Match→Player حي.**
   - tap/click حتى playing فعلي.
   - bounded automatic server failover وserver switching.
   - فحص iframe/WebKit/CORS/mixed-content lifecycle.
7. **إعادة فحص Search والهوية.**
   - poster proxy/placeholder عند الغياب الحقيقي فقط.
   - season-aware dedupe و30+30 pagination.
   - RTL/icon/splash/header والذهبي على Mobile/TV/iOS.
8. **إكمال Library lifecycle.**
   - Favorites persistence/navigation.
   - Continue Watching بعد playback مثبت فقط.
   - Downloads/History من ملفات ومشاهدة فعلية لا محاولات فاشلة.
9. **توسيع four-surface E2E والحماية الخادمية.**
   - Pages/WebKit/CORS/Range/Download smokes.
   - TV focus/D-Pad/LEANBACK/player.
   - media-ref sweeper/rate-limit/compression/timeouts/cancellation دون كسر HLS/Range.
10. **providers.js v2 وapi-client.js بعد إغلاق P0 المناسب.**
   - health/retry/circuit-breaker/cache deterministic داخل Basri فقط.
   - اختبارات failure ordering/cancellation/cache freshness.
   - إبقاء Cloudflare mirror مؤجلًا حتى وجود بنية وصلاحيات مثبتة.
