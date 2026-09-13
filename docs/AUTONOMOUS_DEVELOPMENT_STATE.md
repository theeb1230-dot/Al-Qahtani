# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with earlier reports. The preserved original `albasritv.github.io-main.zip`, live Al-Qahtani/Basri Runtime evidence, and the user's iPhone screenshots/videos remain behavioral references. CI alone does not prove physical-device playback/download behavior.

## Current state
- Product/release commit: `96307760699764e8f62fe70b6eafdcbc53abc49d`, merge of PR #95 `Fix stable resumable download identity and resume messaging`.
- PR #95 final head: `3c88ce2e7290426230cd2110e5147feb8d074417`; branch `fix-stable-download-resume-identity-95`.
- PR #95 was merged only after exact-final-head required checks were green.
- Product version/build: `1.0.22+22`; Runtime `PRODUCT_VERSION` is `1.0.22`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/`; Flutter Web did not replace it.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, helper app, VLC/Safari/Intent playback fallback, or provider scraping was introduced into Flutter.
- Official user-facing identity remains `القحطاني TV`: deep navy/black, metallic gold, circular Q/ق play mark, Arabic horizontal logo, matching icon/splash, RTL and gold-accented controls/cards.

## Root cause closed in v1.0.22
v1.0.21 implemented persistent `.part` files and Range-based resume in `DownloadService`, but `DetailsPage` did not pass a stable `resumeKey`. The service therefore derived the partial identity from the display/fallback title. Different catalog items with the same title could collide, and an episode/movie retry was not bound explicitly to a stable catalog+episode identity. The screen also displayed stale wording claiming a stalled/incomplete transfer left no partial file even though v1.0.21 intentionally preserved resumable progress.

v1.0.22 binds every resumable partial to a deterministic application-side identity: catalog ID + direct/episode key. If catalog ID is absent, the fallback uses type/title/year and deliberately excludes `item.ref`, so provider/upstream material is not persisted in the resume identity. Stalled/incomplete messages now accurately tell the user that progress was retained for retry; explicit cancellation still deletes the partial.

## Changed files in PR #95
- `flutter_app/lib/src/details_page.dart`
- `flutter_app/pubspec.yaml`
- `flutter_app/test/download_resume_identity_test.dart`
- `server/content-runtime.mjs`

## v1.0.22 implemented scope
1. Added stable `buildDownloadResumeKey` based on catalog identity plus direct/episode key.
2. Wired `resumeKey` into the actual Details→Download caller instead of testing persistence only at service level.
3. Prevented provider/upstream `ref` material from entering the resume-key fallback.
4. Added regressions proving same-title items cannot share direct partial identity, episode identities remain separate, and provider URLs are excluded.
5. Corrected stalled/incomplete/cancel Arabic messages to match real partial preservation/cleanup semantics.
6. Preserved v1.0.21 Range/206 append validation, stale-range deletion, restart-on-200 behavior, cancel cleanup, trusted filenames, exact known-length completion and Downloads-library exclusion for `.part` files.
7. Preserved native-first playback plus internal WebView fallback, match failover/scores/logos, official Q-play identity, TV LEANBACK/D-Pad and unsigned iOS packaging.
8. Bumped Flutter to `1.0.22+22` and Runtime to `1.0.22`.

## RELEASE VERIFIED v1.0.22
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.22`.
- Release ID: `387752207`.
- Target commit: `96307760699764e8f62fe70b6eafdcbc53abc49d`.
- Published at: `2026-09-13T00:58:20Z`.
- `Al-Qahtani-Mobile-v1.0.22.apk`: 55,149,052 bytes; SHA-256 `dfdf6dd010e996a4b0fc190088e88e2726ad8666a2f3feff592d447c5a2f6ae9`.
- `Al-Qahtani-TV-v1.0.22.apk`: 55,149,164 bytes; SHA-256 `6fdbba8b4833333f0e7f1248f808cbc58fd01c86b3e50bf4256bc97c095d93a1`.
- `Al-Qahtani-iOS-v1.0.22-UNSIGNED.ipa`: 7,781,029 bytes; SHA-256 `83751b2c8b2c26b6c4d25e37a6b55042e96fa1dfa0d4d93c345044bb74f99f0d`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `b2193d9647a2f755d603f6cbca807625054261a4fdc5f81d8fca0744d30c2905`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `67c1bddd3566a308b9a90ed52df05891638dfb4909c7c9ac68fd20de909c8441`.
- Release workflow `34729315595`: SUCCESS. It was triggered only after main `Flutter foundation` completed successfully, targeted the same source SHA and produced the verified GitHub Release.

## CI / Pages evidence
### PR #95 exact-final-head `3c88ce2e7290426230cd2110e5147feb8d074417`
- Flutter foundation `34728812447`: SUCCESS: analyze, Mobile/default tests, Android TV runtime tests, Android Mobile APK identity/signature, Android TV APK LEANBACK/features, iOS UNSIGNED/no-codesign.
- Trusted download filename `34728812431`: SUCCESS.
- CORS boundary `34728812391`: SUCCESS.
- Web smoke `34728812429`: SUCCESS.
- Independent download resolution `34728812404`: SUCCESS.
- Match runtime `34728812437`: SUCCESS.
- Original Basri player contract `34728812405`: SUCCESS.
- Content runtime `34728812410`: SUCCESS.
- Media reference expiry `34728812418`: SUCCESS.
- Remote movie playback smoke `34728812434`: SUCCESS.
- Remote CORS smoke `34728812463`: SUCCESS.
- Mobile WebKit smoke `34728812450`: SUCCESS.
- Original Basri download contract `34728812416`: SUCCESS.
- Live provider smoke `34728812422`: SUCCESS.

### Main product commit `96307760699764e8f62fe70b6eafdcbc53abc49d`
- Flutter foundation `34729074843`: SUCCESS; all four jobs succeeded: analyze/tests, Android Mobile, Android TV and iOS UNSIGNED.
- Deploy GitHub Pages `34729074807`: SUCCESS on the same product commit.
- Web smoke `34729074800`: SUCCESS on the same product commit.
- Release Flutter triplet `34729315595`: SUCCESS.
- Release gate waited for protected Web/runtime/Pages contracts on the exact source commit before creating v1.0.22.
- GitHub Pages URL: `https://theeb1230-dot.github.io/Al-Qahtani/`.

## P0/P1 status after v1.0.22
1. **Official identity `القحطاني TV`:** FIXED IN CODE / BUILD+ARTIFACT CI VERIFIED / PHYSICAL DEVICE VISUAL RECHECK PENDING.
2. **Native-first movie/episode playback:** code/runtime path protected; Fall 2: Deadpoint on actual iPhone/Android is **NOT PHYSICAL-DEVICE VERIFIED**.
3. **Native→internal WebView fallback:** FIXED IN CODE / CI VERIFIED; real phone playback is **NOT PHYSICAL-DEVICE VERIFIED**.
4. **Continue Watching from internal WebView:** FIXED IN CODE / regression covered / **NOT PHYSICAL-DEVICE VERIFIED**.
5. **External helper app:** intentionally NOT USED.
6. **Download progress/cancel/retry/Range/content-length/trusted filename:** FIXED IN CODE / CI protected / **NOT PHYSICAL-DEVICE VERIFIED** on a complete real transfer.
7. **Persistent partial resume across later retry/session:** FIXED IN CODE / deterministic regression covered / **NOT PHYSICAL-DEVICE VERIFIED**.
8. **Stable partial identity across same-title content and episodes:** FIXED IN CODE / regression covered / **NOT PHYSICAL-DEVICE VERIFIED**.
9. **Downloads Library/file existence persistence:** code path exists; real completed-file persistence remains **NOT PHYSICAL-DEVICE VERIFIED**.
10. **Match→Player Flutter/Web + bounded failover:** code/runtime protected / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.22.
11. **Incorrect/missing match scores / fake 0-0:** regression/runtime normalization protected; changing live score remains DEVICE RECHECK PENDING.
12. **Match logos/Saudi time:** contract coverage exists; physical visual recheck pending.
13. **Search posters/season-aware dedupe:** code/regressions protected; DEVICE VISUAL RECHECK PENDING.
14. **Technical RuntimeHome/home item:** removed from user navigation; TV/mobile device navigation recheck pending.
15. **Favorites / Continue Watching / History / Downloads library:** regression baseline preserved; full real-device persistence lifecycle pending.
16. **Reacher season 4:** **NOT PHYSICAL-DEVICE VERIFIED**.
17. **Movies Details→Watch/Download:** contract/CI covered; device recheck pending.
18. **News parity:** baseline protected; device recheck pending.
19. **Web player lifecycle / iPhone Safari:** Web/WebKit/runtime smokes green; real iPhone Safari playback remains **NOT PHYSICAL-DEVICE VERIFIED** in this environment.
20. **Four-surface E2E:** PARTIAL. Pages and all three package artifacts/releases are verified; full physical-device behavior is not complete.

## Blockers and decisions
- The automation environment exposes no physical iPhone, Android handset, or Android TV, so device-only playback/download/match assertions remain NOT VERIFIED rather than falsely marked fixed.
- No repository permission blocker exists for code changes, PRs, CI, Pages, merges, or Releases.
- Cloudflare mirror remains deferred pending explicit infrastructure/permission evidence.
- providers.js v2 / api-client.js health/retry/circuit-breaker/cache work remains behind remaining P0 evidence/hardening priorities; it must stay inside Al-Qahtani/Basri boundaries.

## Protected regressions
Protect native→internal WebView playback evidence and timeout, Range/206/Content-Range/Accept-Ranges, stable resumable/cancellable partial identity and strict cleanup/integrity, exact known-length completion, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, independent Watch/Download resolution, trusted filenames, Match source discovery/failover/logos/Saudi time/scores, `episode_id` vs `episode_number`, Search posters/season-aware dedupe, 30+30 infinite pagination with stale/concurrency guards, CORS/SSRF/allowlists, media-ref expiry/sweeper, no ads/popups/unneeded tracking, no external playback Intent/deep-links, Favorites/History/Downloads semantics, TV D-Pad/focus + LEANBACK, Arabic RTL branding, and iOS UNSIGNED/no-codesign labeling.

## أهداف التشغيل التالي
1. **تعزيز إثبات استئناف التنزيل قبل الجهاز.**
   - إضافة widget/integration regression يثبت أن DetailsPage يمرر catalog+episode resume identity فعليًا.
   - اختبار same-title movies وsame-series multi-episode collisions عبر طبقة UI/service معًا.
   - إبقاء provider refs خارج أي اسم partial أو log.
2. **إثبات persistent resume على جهاز فعلي عند توفر دليل.**
   - قطع تنزيل طويل على iPhone وAndroid بعد تقدم ملموس.
   - إعادة المحاولة والتحقق أن Range يبدأ من حجم partial لا من الصفر.
   - التحقق من EOF والحجم النهائي وعدم ظهور `.part` في المكتبة.
3. **إثبات Fall 2 على iPhone/Android.**
   - تشغيل native-first وتوثيق start/duration/seek/pause/resume.
   - عند رفض native، إثبات WebView `playing` الحقيقي لا مجرد page load.
   - منع Safari/VLC/Intent وكشف upstream.
4. **إثبات Reacher S4 end-to-end.**
   - Search→Details→Episodes مع episode_id مستقل.
   - تشغيل حلقة فعلية وقياس duration/seek.
   - تنزيل حلقة مع cancel/retry/resume.
5. **إثبات Match→Player حي.**
   - tap/click حتى playing فعلي.
   - اختبار bounded automatic server failover وserver switching.
   - مقارنة Safari iPhone وFlutter الداخلي عند توفر جهاز.
6. **مراجعة scores/logos/Saudi time.**
   - مباراة منتهية غير صفرية ومباراة جارية متغيرة.
   - إبقاء score مجهولًا بدل 0-0 مختلق.
   - تحقق بصري من الشعارات وترتيب الفريقين والتوقيت.
7. **إعادة فحص Search والهوية.**
   - poster proxy/placeholder عند الغياب الحقيقي فقط.
   - season-aware dedupe و30+30 pagination.
   - RTL/icon/splash/header والذهبي على Mobile/TV/iOS.
8. **إكمال Library lifecycle.**
   - Favorites persistence/navigation.
   - Continue Watching بعد playback مثبت فقط.
   - Downloads/History بناءً على ملفات ومشاهدة فعلية لا محاولات فاشلة.
9. **توسيع four-surface E2E والحماية الخادمية.**
   - Pages/WebKit/CORS/Range/Download smokes.
   - TV focus/D-Pad/LEANBACK/player.
   - media-ref sweeper/rate-limit/compression/timeouts/cancellation دون كسر HLS/Range.
10. **providers.js v2 وapi-client.js بعد إغلاق P0 المناسب.**
   - health/retry/circuit-breaker/cache deterministic داخل Basri فقط.
   - اختبارات failure ordering/cancellation/cache freshness.
   - إبقاء Cloudflare mirror مؤجلًا حتى وجود بنية وصلاحيات مثبتة.
