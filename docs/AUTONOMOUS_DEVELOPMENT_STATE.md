# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Product release commit: `48f69f18c9b7f011b2d2dc23c602919d30f96081`, merge of PR #90 `Fix cancellable downloads and partial-range validation`.
- PR #90 final head: `c2f367ead60a34d9ddeb45499c99e3fdb7ef66e8`; merged after final-head gates were green.
- No product PR is open at this snapshot.
- Product version/build: `1.0.18+18`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, or other Theeb providers were introduced.
- Official user-facing identity remains `القحطاني TV`: deep navy/black, metallic gold, circular Q/ق play mark, Arabic horizontal logo, matching app icon/splash, and gold-accented controls/cards.

## RELEASE VERIFIED v1.0.18
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.18`.
- Release ID: `387716070`.
- Target commit: `48f69f18c9b7f011b2d2dc23c602919d30f96081`.
- Published at: `2026-09-12T21:59:06Z`.
- `Al-Qahtani-Mobile-v1.0.18.apk`: 55,116,284 bytes; SHA-256 `e000d823e63ed3c87b7eac103461c50e98b683f0b86ced5c75333309eb1e0c38`.
- `Al-Qahtani-TV-v1.0.18.apk`: 55,116,400 bytes; SHA-256 `df9af6158e25c977aa575dc179c6acdfe5f25b7ab679b4887468eba63850dd15`.
- `Al-Qahtani-iOS-v1.0.18-UNSIGNED.ipa`: 7,768,308 bytes; SHA-256 `aeb65274048521ba154ee9b7df4a1155858a84b3188dea226fdec3b301c3640c`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `1bb657d877183e8f422a81c5e9550bd17ca69b98838b0a0deb44f2efdd3a2151`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `59a70449f7ae0fe4e6be85a4891fddb500a5c7ec92b565b566b8b5c4f516bae2`.
- Release workflow run `34721449160`: SUCCESS. Exact main-push/source SHA validation, protected Web/runtime gate wait, exact-run artifact checksum verification, publishing, and final Release asset verification all completed SUCCESS.
- Main Flutter foundation run `34721171735`: SUCCESS. Analyze/tests, Android Mobile build + identity/signature validation, Android TV build + LEANBACK/feature validation, and iOS unsigned build + bundle/no-codesign validation all completed SUCCESS.
- PR final-head Flutter foundation run `34720835575`: SUCCESS before merge.
- GitHub Pages deployment run `34721171024`: SUCCESS on the product release commit.

## v1.0.18 implemented scope
1. Added a real `DownloadCancellationToken` instead of merely disabling the UI while a transfer was active.
2. Cancellation now interrupts both the pending HTTP response and streaming body consumption and returns `DOWNLOAD_CANCELLED`.
3. Direct movie and episode download controls now turn into explicit cancel controls while active, including the Android TV focus path.
4. Cancelling or failing a transfer closes/cancels the stream and removes the `.part` file; cancelled attempts are not presented as successful downloads.
5. Corrected HTTP 206 length semantics: total bytes from `Content-Range` take precedence over a chunk-level `Content-Length`.
6. When a trustworthy total size is known, completion now requires exact byte equality rather than accepting a partial response whose chunk length looked complete.
7. Added regressions proving a 5-byte `206 bytes 0-4/10` response is rejected as `INCOMPLETE_DOWNLOAD` and that cancellation after a streaming chunk leaves no partial file.
8. Existing native-first playback + internal WebKit fallback, match extraction/failover, safe opaque refs, Range/HLS proxying, identity, search, score normalization, RuntimeHome removal, TV LEANBACK and unsigned iOS packaging remain protected.

## P0/P1 status from user device evidence
1. **Official identity `القحطاني TV`:** FIXED IN CODE / BUILD+ARTIFACT CI VERIFIED / PHYSICAL DEVICE VISUAL RECHECK PENDING.
2. **Movie/episode playback in Flutter (e.g. Fall 2: Deadpoint):** native-first + internal WebKit fallback remains FIXED IN CODE / CI VERIFIED / **NOT PHYSICAL-DEVICE VERIFIED**.
3. **External helper app idea:** intentionally NOT USED; internal playback remains the product path unless future device evidence proves a platform limitation.
4. **Download cancellation and Range completion semantics:** FIXED IN CODE / deterministic Flutter tests + packaging VERIFIED / **NOT PHYSICAL-DEVICE VERIFIED** on iPhone or Android.
5. **Download end-to-end file write:** progress, cancel, retry/error handling, idle timeout, trusted filename and `.part` cleanup are protected in code; actual long media download on a phone remains **NOT PHYSICAL-DEVICE VERIFIED**.
6. **Match→Player Flutter/Web:** code/runtime path and bounded failover remain regression-protected / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.18.
7. **Incorrect/missing match scores / fake 0-0:** normalization and placeholder suppression remain FIXED IN CODE; true upstream final-score quality remains source-dependent; DEVICE RECHECK PENDING.
8. **Search posters/dedupe:** FIXED IN CODE + regression coverage / DEVICE RECHECK PENDING.
9. **Technical RuntimeHome/home item:** FIXED IN CODE; user-facing navigation recheck pending.
10. **Favorites:** regression baseline preserved; physical-device persistence/navigation recheck pending.
11. **Continue Watching/history:** NOT PHYSICAL-DEVICE VERIFIED; failed playback must not create progress.
12. **Downloads library:** local file existence/persistence semantics remain NOT PHYSICAL-DEVICE VERIFIED.
13. **Reacher season 4:** NOT PHYSICAL-DEVICE VERIFIED.
14. **Movies Details→Watch/Download variants:** CI/contract covered; device recheck pending.
15. **News parity/article/images/date/back:** contract baseline protected; device recheck pending.
16. **Web player lifecycle/iPhone Safari:** Pages/protected smokes green; real iPhone playback recheck pending.
17. **Four-surface E2E:** PARTIAL; packaging and Web deploy verified, full physical-device behavior is not complete.

## Key CI evidence for v1.0.18
- PR #90 final head: `c2f367ead60a34d9ddeb45499c99e3fdb7ef66e8`.
- PR Flutter foundation: `34720835575` SUCCESS.
- Main merge/product commit: `48f69f18c9b7f011b2d2dc23c602919d30f96081`.
- Main Flutter foundation: `34721171735` SUCCESS.
- Release Flutter triplet: `34721449160` SUCCESS.
- Deploy GitHub Pages: `34721171024` SUCCESS.
- Release workflow's exact-commit protected-gate wait completed SUCCESS before artifact download/publish, covering the required Web/runtime gates rather than publishing merely because Flutter artifacts existed.

## Protected regressions
Protect iPhone Safari/Web playback, native→WebKit internal fallback, Range/206, correct total `Content-Range` handling, Content-Range/Accept-Ranges, exact known-length download completion, real cancellation with `.part` cleanup, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, byte download progress/timeout, trusted filenames, News non-empty/opaque refs, match source extraction/failover/logos/Saudi time/score correctness, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no external playback Intents/deep-links, favorites persistence, TV D-Pad/focus + LEANBACK, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إثبات إلغاء التنزيل على iPhone فعلي.**
   - بدء تنزيل ملف وسائط حقيقي ثم إلغاؤه بعد تقدم ملموس.
   - التحقق من توقف البايتات وحذف `.part` وعدم ظهور الملف في المكتبة.
   - إعادة المحاولة حتى الاكتمال والتحقق من وجود الملف وحجمه.
2. **إثبات Download end-to-end على Android.**
   - اختبار progress/cancel/retry وidle timeout على جهاز Android.
   - مقارنة الحجم النهائي مع الحجم المعلن أو EOF الصحيح.
   - التحقق من trusted filename وDownloads Library.
3. **إثبات تشغيل Fall 2: Deadpoint على iPhone.**
   - اختبار native-first داخل Flutter.
   - إثبات WebKit fallback الداخلي عند الحاجة دون فتح Safari أو كشف upstream.
   - تسجيل start/seek/pause/resume/duration/retry.
4. **إثبات تشغيل Reacher الموسم الرابع.**
   - اختبار حلقة فعلية ومصدر HLS ثانٍ.
   - التحقق من MIME/Range/HLS child/key/init عمليًا.
   - منع history/progress عند فشل التشغيل.
5. **إثبات Match→Player على جهاز حقيقي.**
   - اختبار مباراة حية داخل Safari وFlutter.
   - التحقق من server failover والمهلات وعدم بقاء spinner بلا نهاية.
   - توثيق الفشل كمصدر غير متاح بدل اختلاق نجاح.
6. **إعادة فحص match score/live data.**
   - مقارنة ended/live score fields مع المصدر الحي.
   - حماية ترتيب الفريقين والشعارات وتوقيت السعودية.
   - إبقاء score مجهولًا بدل 0-0 مختلق عند غياب البيانات.
7. **إعادة فحص البحث والهوية بصريًا.**
   - اختبار بوسترات البحث وdedupe للمواسم المتشابهة.
   - التحقق من App Icon/Splash/header على iOS/Android/TV.
   - مراجعة RTL والتباين والذهبي على الشاشات الصغيرة.
8. **إكمال Library semantics.**
   - Favorites persistence/navigation.
   - Continue Watching/resume/completed/history بعد تشغيل ناجح فقط.
   - Downloads Library يعكس الملفات الموجودة فعليًا ولا يعرض partials.
9. **إكمال Web/News regressions.**
   - اختبار News article/images/date/back على Safari.
   - إعادة اختبار Web player lifecycle وRange/Download/CORS على Pages.
   - الحفاظ على Web/PWA الحالي وعدم استبداله قبل parity مثبتة.
10. **بدء providers.js v2 فقط بعد إغلاق device P0.**
   - health/retry/circuit-breaker/cache باختبارات deterministic ضمن Basri فقط.
   - الحفاظ على sweeper/rate limits/compression/Range/HLS semantics.
   - استمرار version/build + triplet + GitHub Release الحقيقي لكل تعديل منتج.
