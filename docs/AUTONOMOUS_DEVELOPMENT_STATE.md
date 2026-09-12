# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Product merge commit: `dc1103bf7b10be75902201ca63feeef2b0da07c9` from merged PR #85 `Unify Arabic identity and repair match/search playback UX`.
- PR #84 was closed unmerged as superseded by #85 to restore the one-PR-only rule.
- No product PR remains open at this snapshot.
- Product version/build: `1.0.13+13`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, or other Theeb providers were introduced.

## RELEASE VERIFIED v1.0.13
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.13`.
- Release ID: `387682267`.
- Target commit: `dc1103bf7b10be75902201ca63feeef2b0da07c9`.
- Published at: `2026-09-12T19:36:52Z`.
- `Al-Qahtani-Mobile-v1.0.13.apk`: 54,570,786 bytes; SHA-256 `dcaafb6cf84d6481b9beafd77588e023d05253810bc279e66e898a44d2b5503a`.
- `Al-Qahtani-TV-v1.0.13.apk`: 54,570,898 bytes; SHA-256 `c27495e8c7e96bf7f2313c82edc47f393fa2cf22808b3bb595819932c36ebf8b`.
- `Al-Qahtani-iOS-v1.0.13-UNSIGNED.ipa`: 7,487,909 bytes; SHA-256 `db1b9cad1e9a650b02b4c766d0ce5ae57877a1c4686ae002c59a129945e2bd74`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `30b06e380fb68184bdf34da1f8bef99054fb6c2f24a82fe9ca664f12b210bc2d`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `c0442a67f1c98aaec3f49a4324df12ec33a86294bd6c2fe82bf7748af6de6181`.
- Release workflow run `34714668353`: SUCCESS. Its internal release verification step also completed SUCCESS.
- Main Flutter foundation run `34714279893`: SUCCESS on the exact product merge commit. Analyze/tests, Android Mobile APK, Android TV APK and iOS UNSIGNED IPA jobs all completed SUCCESS.
- Release workflow waited for the exact-commit protected gates, including Deploy GitHub Pages, Web smoke, Mobile WebKit, Content runtime, Remote movie playback, Remote news, Live provider, Basri player/download, independent download, Match runtime, CORS, media-reference expiry and trusted filename, before publishing.
- Historical v1.0.5 remains RELEASE NOT PUBLISHED and must never be represented otherwise.

## v1.0.13 implemented scope
1. Arabic black/gold identity using `القحطاني` across current Flutter/Web surfaces and native branding automation.
2. Technical RuntimeHome/navigation entry removed; app opens into user content sections.
3. Match score normalization no longer invents missing 0-0 values; broken ended 0-0 feed values are suppressed rather than presented as factual results.
4. Search uses poster cards, dedupe and year metadata where available.
5. Dedicated opaque Match runtime and Match→Player path for Web/Flutter, including HLS child rewriting and Range passthrough without exposing upstream URLs.
6. Independent Watch/Download resolution from v1.0.12 remains protected, including fail-closed HLS-only download behavior.
7. Android TV package is built and checked for LEANBACK/remote requirements; iOS package is built unsigned/no-codesign.

## Device-verification status
- Real iPhone Safari/Flutter Match→Player: **NOT PHYSICAL-DEVICE VERIFIED**.
- Reacher season 4 and representative HLS playback start/seek/pause/resume/duration/retry: **NOT PHYSICAL-DEVICE VERIFIED**.
- Download local file progress/cancel/retry/persistence/file existence: **NOT PHYSICAL-DEVICE VERIFIED**.
- Movie Watch/Download title variants: **CI/contract covered, device recheck pending**.
- Search posters/dedupe: **CI/code verified, device recheck pending**.
- News parity: **contract baseline verified, device recheck pending**.
- Favorites/Continue Watching/history/download library: **regression/device verification remains**.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, trusted filenames, News non-empty/opaque refs, match logos/Saudi time/score correctness, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no Android Intent/deep-links for playback, favorites persistence, TV D-Pad/focus + LEANBACK, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إثبات Match→Player على iPhone الحقيقي.**
   - اختبار مباراة لها خوادم فعلية من Basri وعدم اعتبار metadata وحدها نجاحًا.
   - اختبار loading/server switching/error/retry داخل Safari وFlutter.
   - توثيق HLS/MP4/Range دون كشف upstream URLs.
2. **إثبات تشغيل المسلسلات على الجهاز.**
   - اختبار Reacher الموسم الرابع وعمل HLS ثانٍ.
   - اختبار start/seek/pause/resume/duration/retry على iPhone وAndroid.
   - منع history/progress من التسجيل عند فشل التشغيل.
3. **إثبات Download end-to-end.**
   - resolve→opaque ref→local file write.
   - progress/cancel/retry/persistence/file existence/trusted filename.
   - إبقاء HLS-only بلا ملف مستقل fail-closed.
4. **توسيع اختبارات نتائج المباريات.**
   - مقارنة ended/live score fields من المصدر مع العرض.
   - عدم عرض 0-0 مكسور كحقيقة.
   - الاحتفاظ بنتائج حية/نهائية صحيحة عندما تكون موثقة من المصدر.
5. **إكمال Search/Poster image contract.**
   - إثبات posters الحقيقية عبر Runtime آمن دون raw upstream URL في UI/logs.
   - اختبار dedupe للمواسم المتشابهة والسنة.
   - حماية pagination من stale responses.
6. **إكمال Movies/News regressions.**
   - اختبار عدة أفلام بمسارات Watch/Download مختلفة.
   - إعادة فحص News article/images/date/back.
   - حماية WebKit/CORS/Range بعد أي تعديل.
7. **إكمال Library semantics.**
   - Favorites persistence.
   - Continue Watching/resume/completed/history بعد playback حقيقي فقط.
   - Downloads library يعكس الملفات الموجودة فعليًا.
8. **تحسين حالات الواجهة دون تغيير العقد.**
   - loading/content/empty/retryable-error موحدة.
   - cancellation/stale-response guards في الشاشات المتبقية.
   - RTL/typography/focus consistency عبر Mobile/TV/iOS/Web.
9. **بدء providers.js v2 بعد بوابات الجهاز.**
   - health/retry/circuit-breaker/cache باختبارات deterministic.
   - الحفاظ على sweeper/rate limits/gzip/Vary/Content-Length وRange/HLS.
   - لا Cloudflare mirror أو مزود خارجي قبل صلاحيات وبنية موثقة داخل حدود Al-Qahtani/Basri.
10. **الصيانة المستمرة والانضباط الإصدارى.**
   - فحص GitHub/PR/CI/Releases/Pages في بداية كل تشغيل.
   - أي تعديل منتج جديد يرفع version/build ويصدر Mobile APK + TV APK + IPA UNSIGNED من نفس commit.
   - لا اعتبار أي حزمة منشورة قبل GitHub Release فعلي وإعادة التحقق من الأصول والأحجام والـSHA/provenance.
