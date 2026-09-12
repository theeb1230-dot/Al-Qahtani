# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Product release commit: `db2866686e1a615fee9c4a01ab6dfe095170f7b4`, merge of PR #89 `Fix device playback, downloads, match failover and adopt Q-play identity`.
- PR #89 final head: `e675af7a7c3a988b67fe4ff05f80c00f15b8d3f0`; merged at `2026-09-12T20:58:54Z`.
- No PR is open at this snapshot.
- Product version/build: `1.0.17+17`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, or other Theeb providers were introduced.
- Official user-facing identity is now `القحطاني TV`: deep navy/black, metallic gold, circular Q/ق play mark, Arabic horizontal logo, matching app icon/splash, and gold-accented controls/cards.

## RELEASE VERIFIED v1.0.17
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.17`.
- Release ID: `387703689`.
- Target commit: `db2866686e1a615fee9c4a01ab6dfe095170f7b4`.
- Published at: `2026-09-12T21:06:17Z`.
- `Al-Qahtani-Mobile-v1.0.17.apk`: 55,116,240 bytes; SHA-256 `629903098d8d85c55b2669508d3e3cc9f78b58026fa64da6426deea83dfa4aab`.
- `Al-Qahtani-TV-v1.0.17.apk`: 55,116,352 bytes; SHA-256 `d0dccc339c5ce59cf4d0b9a80c8fa6d56d2337c62e9f7147ba202e33a23251a6`.
- `Al-Qahtani-iOS-v1.0.17-UNSIGNED.ipa`: 7,769,074 bytes; SHA-256 `9d207a6aa9aafb11921ec7b2e51fdea106966edda186e5471fc040d1643fb19e`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `82afb61e11fe04890627365eafea724ca12eb43a7dd7e8a353a011effcb43eeb`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `89e12360eeaa9d2b0336f655d235ad630a2fe108c2ab1875ea7408f9e95cc062`.
- Release workflow run `34718975792`: SUCCESS. Exact main-push/source SHA validation, protected-gate wait, artifact checksum verification, publishing, and final Release asset verification all completed SUCCESS.
- Main Flutter foundation run `34718638394`: SUCCESS. Analyze/tests, Android Mobile build + identity/signature validation, Android TV build + LEANBACK/feature validation, and iOS unsigned build + bundle/no-codesign validation all completed SUCCESS.
- Deploy GitHub Pages run `34718638353`: SUCCESS on the product release commit.
- Web smoke run `34718638372`: SUCCESS on the product release commit.
- Match Runtime run `34718638403`: SUCCESS on the product release commit.

## v1.0.17 implemented scope
1. Adopted the approved `القحطاني TV` deep-navy/metallic-gold Q-play identity across Flutter/Web player/native app icon and splash generation, with CI artifact branding checks.
2. Fixed Android splash generation to use a valid XML shape drawable instead of a raw color in `android:drawable`, eliminating the Android resource-linking failure found on the PR head.
3. Kept native `video_player` first and added an internal WebKit/WebView fallback path for Mobile/iOS when native playback rejects an otherwise valid opaque media source; no external Safari/VLC/Intent fallback is used.
4. Strengthened download UX/semantics with byte progress where known, idle/read timeout behavior, partial-file cleanup, and independent Watch/Download resolution preserved behind opaque media refs.
5. Strengthened match source extraction for modern embeds/escaped/base64/direct no-extension media candidates and added bounded server failover instead of indefinite first-server loading.
6. Kept safe match/media refs, SSRF/allowlists, Range/HLS semantics, independent download behavior, and no upstream URL disclosure.
7. Existing score placeholder suppression, search poster/dedupe work, RuntimeHome removal, News parity, episode id/number separation, TV focus/LEANBACK, and unsigned iOS packaging remain regression-protected.

## P0/P1 status from user device evidence
1. **Official identity `القحطاني TV`:** FIXED IN CODE / BUILD+ARTIFACT CI VERIFIED / PHYSICAL DEVICE VISUAL RECHECK PENDING.
2. **Movie/episode playback in Flutter (e.g. Fall 2: Deadpoint):** FIX IN CODE with native-first + internal WebKit fallback / CI VERIFIED / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.17.
3. **External helper app idea:** intentionally NOT USED; internal playback remains the product path unless future device evidence proves a platform limitation.
4. **Flutter download hanging:** FIX IN CODE for progress/idle-timeout/partial cleanup + independent download contract / CI VERIFIED / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.17.
5. **Match→Player Flutter/Web:** FIX IN CODE for tap/navigation, extraction and bounded server failover / Match Runtime + Web smoke VERIFIED / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.17.
6. **Incorrect/missing match scores / fake 0-0:** normalization and placeholder suppression remain FIXED IN CODE; true upstream final-score quality remains source-dependent; DEVICE RECHECK PENDING.
7. **Search posters/dedupe:** FIXED IN CODE + regression coverage / DEVICE RECHECK PENDING.
8. **Technical RuntimeHome/home item:** FIXED IN CODE; user-facing navigation recheck pending.
9. **Favorites:** regression baseline preserved; physical-device persistence/navigation recheck pending.
10. **Continue Watching/history:** semantics remain NOT PHYSICAL-DEVICE VERIFIED; failed playback must not create progress.
11. **Downloads library:** local file existence/persistence semantics remain NOT PHYSICAL-DEVICE VERIFIED.
12. **Reacher season 4:** NOT PHYSICAL-DEVICE VERIFIED on v1.0.17.
13. **Movies Details→Watch/Download variants:** CI/contract covered; device recheck pending.
14. **News parity/article/images/date/back:** contract baseline protected; device recheck pending.
15. **Web player lifecycle/iPhone Safari:** Web/Pages smokes green; real iPhone playback recheck pending.
16. **Four-surface E2E:** PARTIAL; packaging and Web deploy verified, full physical-device behavior not complete.

## Key CI evidence for v1.0.17
- Release Flutter triplet: `34718975792` SUCCESS.
- Flutter foundation: `34718638394` SUCCESS.
- Deploy GitHub Pages: `34718638353` SUCCESS.
- Web smoke: `34718638372` SUCCESS.
- Match runtime: `34718638403` SUCCESS.
- Protected release gates on exact commit all succeeded before publishing, including Mobile WebKit, Content Runtime, Remote Runtime v1, Remote movie playback, Remote news, Live provider, Basri Watch/Download contracts, Independent download resolution, Match runtime, CORS boundaries, media-ref expiry, and trusted filename.

## Protected regressions
Protect iPhone Safari/Web playback, native→WebKit internal fallback, Range/206, Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, byte download progress/timeout/partial cleanup, trusted filenames, News non-empty/opaque refs, match source extraction/failover/logos/Saudi time/score correctness, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no external playback Intents/deep-links, favorites persistence, TV D-Pad/focus + LEANBACK, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إثبات تشغيل فيلم على iPhone بعد v1.0.17.**
   - اختبار Fall 2: Deadpoint داخل Flutter.
   - إثبات native-first ثم WebKit fallback عند الحاجة دون فتح Safari.
   - تسجيل start/seek/pause/resume/duration/retry ووسم النتيجة DEVICE VERIFIED أو FAILED.
2. **إثبات تشغيل المسلسلات على جهاز فعلي.**
   - اختبار Reacher الموسم الرابع وحلقة HLS ثانية.
   - التحقق من MIME/Range/HLS child refs عمليًا.
   - منع history/progress عند فشل التشغيل.
3. **إثبات Download end-to-end.**
   - اختبار resolve→opaque ref→`download=1`→local file write.
   - التحقق من progress/cancel/retry/idle-timeout/.part cleanup/file existence.
   - التحقق من trusted filename وعدم تسجيل المحاولة الفاشلة.
4. **إثبات Match→Player على iPhone.**
   - اختبار مباراة حية داخل Safari وFlutter.
   - التحقق من server failover والمهلات وعدم بقاء spinner بلا نهاية.
   - توثيق حالة المصدر عندما لا يقدم أي سيرفر فعلي بدل اختلاق نجاح.
5. **تحسين جودة match score/live data دون hardcode.**
   - مقارنة ended/live score fields مع المصدر الحي.
   - حماية ترتيب الفريقين والشعارات وتوقيت السعودية.
   - إبقاء score مجهولًا بدل 0-0 مختلق عند غياب البيانات.
6. **إعادة فحص الهوية والبحث على الجهاز.**
   - التحقق من App Icon/Splash/header `القحطاني TV` على iOS/Android.
   - التحقق من بوسترات البحث وdedupe للمواسم المتشابهة.
   - مراجعة RTL/contrast/gold readability على الشاشات الصغيرة.
7. **إكمال Library semantics.**
   - Favorites persistence/navigation.
   - Continue Watching/resume/completed/history بعد تشغيل ناجح فقط.
   - Downloads library يعكس الملفات الموجودة فعليًا.
8. **إكمال Web/News regressions.**
   - اختبار News article/images/date/back على Safari.
   - إعادة اختبار Web player بعد هوية v1.0.17 وعدم ظهور overlays قديمة.
   - إبقاء WebKit/CORS/Range/Pages أخضر.
9. **بدء providers.js v2 ضمن Basri فقط بعد device P0.**
   - health/retry/circuit-breaker/cache باختبارات deterministic.
   - الحفاظ على sweeper/rate limits/compression/Range/HLS semantics.
   - إبقاء Cloudflare mirror مؤجلًا بلا بنية وصلاحيات مثبتة.
10. **استمرار release/maintenance discipline.**
   - فحص GitHub/PR/CI/Releases/Pages في بداية كل تشغيل.
   - أي تعديل منتج جديد يرفع version/build ويولد APK Mobile + APK TV + IPA UNSIGNED من نفس commit.
   - لا اعتبار أي إصدار منشور قبل GitHub Release فعلي وإعادة التحقق من assets/sizes/SHA/provenance.
