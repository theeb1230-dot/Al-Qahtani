# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Product release commit: `b61ee2982ab4f38715fb2fd90b82ca6a557ae14f`, merge of PR #88 `Fix Match Runtime version drift blocking releases`.
- PR #87 `Make deployed Runtime version checks release-safe` was merged first at `3fb9a82df8462aafa5023205c6b4ef0f4e9465a8`; its new live gate correctly exposed a real Match Runtime version drift and prevented v1.0.15 from being released.
- No PR is open at this snapshot.
- Product version/build: `1.0.16+16`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, or other Theeb providers were introduced.

## RELEASE VERIFIED v1.0.16
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.16`.
- Release ID: `387695113`.
- Target commit: `b61ee2982ab4f38715fb2fd90b82ca6a557ae14f`.
- Published at: `2026-09-12T20:28:47Z`.
- `Al-Qahtani-Mobile-v1.0.16.apk`: 54,570,782 bytes; SHA-256 `7ada2080518365d0a2cc1463d034af540cc43f0d98df340485a391fffa9463df`.
- `Al-Qahtani-TV-v1.0.16.apk`: 54,570,898 bytes; SHA-256 `60334473b32e03baacfed675547c74911029b79a6c475b46e98ef5112b3a9d71`.
- `Al-Qahtani-iOS-v1.0.16-UNSIGNED.ipa`: 7,487,914 bytes; SHA-256 `25f6e53b913da23c747296c4d6950b43ddfbf6333d3e65c6c212131c90a960d8`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `743c55231d8cf818334674327fb2b9064d78e8ff21c8f50fa09e2f8ebd24624d`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `f5ed166c33638d3674847ffa6cd1bc278bd48f827ba58c5f58d53d004c1f1ba7`.
- Release workflow run `34717195848`: SUCCESS; its internal exact-commit gate wait, artifact checksum checks, publishing, and final asset verification all completed SUCCESS.
- Main Flutter foundation run `34716892504`: SUCCESS; analyze/tests + Android Mobile + Android TV + iOS unsigned jobs all completed SUCCESS from the product release commit.
- Remote Runtime v1 smoke run `34716892515`: SUCCESS against the deployed Runtime reporting v1.0.16.
- Deploy GitHub Pages run `34716892493`: SUCCESS on the same product release commit.

## RELEASE NOT PUBLISHED v1.0.15
- v1.0.15 was intentionally not represented as a release after PR #87 exposed a live failure on `/api/v1/matches`.
- Root cause: the dedicated production Match Runtime still returned hard-coded `version: 1.0.13`, omitted explicit `stale`, and the smoke test incorrectly expected cache behavior not implemented by that dedicated path.
- GitHub had no `v1.0.15` Release tag when checked. The issue was fixed in PR #88 and the product was bumped to v1.0.16 rather than pretending the failed v1.0.15 cycle had succeeded.

## v1.0.16 implemented scope
1. Production Match Runtime consumes shared `PRODUCT_VERSION` instead of a hard-coded semantic version.
2. Match envelope now explicitly reports `cached: false` and `stale: false` without inventing a cache implementation.
3. Remote Runtime smoke checks the real dedicated Match contract and continues to fail closed on deployed version drift.
4. Runtime-version regression prevents literal product versions from returning inside `match-production.mjs` and ties Flutter pubspec to shared Runtime version.
5. Existing black/gold Arabic identity, removal of RuntimeHome, score normalization, search poster cards/dedupe, opaque Match→Player, independent Watch/Download, Range/HLS proxying, TV LEANBACK, and unsigned iOS packaging remain regression-protected.

## Seven-problem status
1. **Arabic black/gold identity:** FIXED IN CODE / CI VERIFIED / PHYSICAL DEVICE RECHECK PENDING.
2. **Incorrect match scores / fake 0-0:** FIXED FOR NORMALIZATION AND BROKEN PLACEHOLDER SUPPRESSION / TRUE UPSTREAM FINAL SCORE QUALITY STILL SOURCE-DEPENDENT / DEVICE RECHECK PENDING.
3. **Technical home/menu removal:** FIXED IN CODE / CI VERIFIED / DEVICE RECHECK PENDING.
4. **Downloads:** CONTRACT/CI VERIFIED; local file progress/cancel/retry/persistence/file-existence remains **NOT PHYSICAL-DEVICE VERIFIED**.
5. **Playback:** Runtime/media contracts protected; actual Reacher/iPhone/Android start/seek/pause/resume/duration/retry remains **NOT PHYSICAL-DEVICE VERIFIED**.
6. **Search posters/dedupe:** FIXED IN CODE + CONTRACT REGRESSIONS / DEVICE RECHECK PENDING.
7. **Match→Player Web/Flutter:** OPAQUE RUNTIME + INTERNAL PLAYER CONTRACT FIXED; actual iPhone Safari/Flutter playback remains **NOT PHYSICAL-DEVICE VERIFIED**.

## Additional verification status
- Reacher season 4: NOT PHYSICAL-DEVICE VERIFIED.
- Movies Details→Watch/Download variants: CI/contract covered; device recheck pending.
- News parity: contract baseline protected; device recheck pending.
- `episode_id` versus `episode_number`: regression protected.
- Favorites: regression/device verification pending.
- Continue Watching/history: device verification pending; failed playback must not create progress.
- Downloads library: local file semantics not physical-device verified.
- Web player lifecycle and Safari playback: contract/WebKit coverage exists; real iPhone Safari recheck pending.
- Four-surface E2E: PARTIAL; packaging is verified, physical-device behavior is not complete.

## Key CI evidence for v1.0.16
- Release Flutter triplet: `34717195848` SUCCESS.
- Flutter foundation: `34716892504` SUCCESS.
- Remote Runtime v1 smoke: `34716892515` SUCCESS.
- Deploy GitHub Pages: `34716892493` SUCCESS.
- Exact PR #88 final head `97af5f26b6b1aebc164b145c69472ae7fbe037d2` passed Content Runtime, Match Runtime, Web smoke, Mobile WebKit, Remote movie playback, CORS, Range/download-related contracts, Live provider smoke, and the full four-job Flutter matrix before merge.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, trusted filenames, News non-empty/opaque refs, match logos/Saudi time/score correctness, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no Android Intent/deep-links for playback, favorites persistence, TV D-Pad/focus + LEANBACK, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إثبات Match→Player على جهاز حقيقي.**
   - اختبار مباراة فعلية داخل Safari وFlutter مع loading/server switching/retry.
   - إثبات HLS/MP4/Range دون كشف upstream URLs.
   - عدم اعتبار metadata أو فتح الصفحة وحده نجاحًا.
2. **إثبات تشغيل المسلسلات فعليًا.**
   - اختبار Reacher الموسم الرابع ومصدر HLS ثانٍ.
   - اختبار start/seek/pause/resume/duration/retry على iPhone وAndroid.
   - منع history/progress عند فشل التشغيل.
3. **إثبات Download end-to-end.**
   - resolve→opaque media ref→`download=1`→local file write.
   - اختبار progress/cancel/retry/persistence/file existence/trusted filename.
   - إبقاء HLS-only بلا ملف مستقل fail-closed.
4. **تحسين جودة نتائج المباريات دون اختلاق بيانات.**
   - مقارنة ended/live score fields مع المصدر الحي.
   - إبقاء 0-0 النهائي المكسور غير معروض كحقيقة.
   - حماية ترتيب الفريقين والشعارات وتوقيت السعودية.
5. **إكمال Search/Poster image contract.**
   - إثبات poster proxy/allowlist دون raw upstream URL.
   - اختبار dedupe للمواسم المتشابهة مع الموسم/السنة.
   - حماية pagination من stale responses.
6. **إكمال Movies/News regressions.**
   - اختبار عدة أفلام بمسارات Watch/Download مختلفة.
   - إعادة فحص News article/images/date/back.
   - إبقاء WebKit/CORS/Range أخضر بعد أي تغيير.
7. **إكمال Library semantics.**
   - Favorites persistence.
   - Continue Watching/resume/completed/history بعد تشغيل ناجح فقط.
   - Downloads library يعكس الملفات المحلية الموجودة فعليًا.
8. **تحسين UX وحالات الفشل.**
   - توحيد loading/content/empty/retryable-error.
   - إكمال cancellation/stale-response guards.
   - مراجعة RTL/typography/TV focus عبر الأسطح الأربعة.
9. **بدء providers.js v2 ضمن حدود Basri فقط.**
   - health/retry/circuit-breaker/cache باختبارات deterministic.
   - الحفاظ على sweeper/rate limits/compression/Range/HLS semantics.
   - إبقاء Cloudflare mirror مؤجلًا بلا بنية وصلاحيات مثبتة.
10. **الصيانة والإصدارات المستمرة.**
   - فحص GitHub/PR/CI/Releases/Pages في بداية كل تشغيل.
   - أي تعديل منتج جديد يرفع version/build ويولد APK Mobile + APK TV + IPA UNSIGNED من نفس commit.
   - لا اعتبار أي إصدار منشور قبل GitHub Release فعلي وإعادة التحقق من الأصول والأحجام والـSHA/provenance.
