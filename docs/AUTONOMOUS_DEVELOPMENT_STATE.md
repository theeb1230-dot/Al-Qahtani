# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `d0e258015770045bbfb0f8aef017e49ecedc1788` (`Add resilient unified home runtime contract`).
- PR #61 merged after all 11 exact-head pull-request workflows passed.
- Active Flutter branch: `feat/flutter-foundation-62`.
- Target product version: `1.0.1+1` for the initial Flutter foundation.
- User direction changed: Flutter starts now while the existing Web/PWA remains preserved on GitHub Pages.

## Product boundary
Al-Qahtani is fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is allowed only as part of the preserved original Basri source contract. Flutter must consume Al-Qahtani runtime contracts and must not implement scraping or expose upstream hosts itself.

## Protected Web behavior
The current web remains the production fallback and must stay published on GitHub Pages. Protected regressions include iPhone Safari playback, Range/206, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode display numbering, endless 30-item category pagination, explicit Download behavior, CORS, SSRF/allowlists, no ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Runtime foundation merged
- normalized `/api/v1/matches`, `/api/v1/search`, `/api/v1/category` contracts;
- product-level category IDs with server-side Basri mappings;
- endless category pagination on web;
- provider health/cache primitives;
- unified bounded home aggregation service merged in PR #61 with partial-failure isolation and catalog concurrency capped at 2.

## Flutter foundation in progress
The branch `feat/flutter-foundation-62` starts the native migration without deleting or replacing the web root.

Implemented so far:
- `flutter_app/pubspec.yaml` with Flutter, Arabic localizations, `http`, tests and lints;
- Arabic RTL `MaterialApp` and mobile bottom navigation;
- initial screens for Home, Matches, Movies, Series and Search;
- a runtime-only API client pointed at `https://al-qahtani-api.onrender.com` using `/api/v1/matches`, `/api/v1/category` and `/api/v1/search`;
- normalized Flutter models that keep product refs separate from display fields;
- category infinite scroll with dedup, one-request-at-a-time guard, stale-safe mounted checks, 30-item page semantics and pull-to-refresh;
- model regressions;
- `.github/workflows/flutter-foundation.yml` that analyzes/tests Flutter and attempts three builds from the same source: Android Mobile APK, Android TV APK with generated LEANBACK/touchscreen manifest requirements, and iOS no-codesign IPA packaged as `Al-Qahtani-UNSIGNED.ipa`.

## Release policy for Flutter
Required triplet from the same commit/version:
1. `Al-Qahtani-Mobile.apk`
2. `Al-Qahtani-TV.apk`
3. `Al-Qahtani-UNSIGNED.ipa`

AAB is not a substitute. The IPA must be labeled UNSIGNED/no-codesign and is not claimed directly installable without external signing/provisioning. Do not publish a GitHub Release until all three artifacts succeed, are non-empty, version/build parity is proven, SHA-256 is recorded, Android manifests are checked, TV LEANBACK/D-Pad/focus requirements are verified, and the IPA Payload/bundle/version/no-codesign state is validated.

## Current blockers / gaps
- Flutter details/episodes/play/download flows are not implemented yet.
- Native player integration for MP4/HLS/MPEG-TS is not implemented yet.
- TV focus behavior exists only as a build/manifest requirement so far; a real TV-specific UI/focus model is still required.
- Favorites/history/continue-watching are not implemented yet.
- Android and iOS platform folders are currently generated in CI to keep the initial foundation small; they may be committed later when platform-specific code becomes necessary.
- No Flutter triplet has been proven successful yet on this branch.
- No Flutter GitHub Release has been published.

## أهداف التشغيل التالي
1. **إغلاق Flutter foundation PR بأمان.**
   - فتح PR واحد فقط من `feat/flutter-foundation-62`.
   - فحص Flutter analyze/test وكل builds الثلاثة.
   - إصلاح أي failure من logs على نفس الفرع ثم الدمج فقط بعد الخضرة.
2. **إثبات APK Mobile.**
   - التحقق من build release الفعلي.
   - فحص applicationId/version/build وSHA-256.
   - تأكيد أن Runtime base URL هو Al-Qahtani فقط.
3. **إثبات APK TV.**
   - التحقق من `LEANBACK_LAUNCHER` و`android.hardware.touchscreen=false`.
   - إضافة TV target detection داخل Flutter.
   - بدء Focus/D-Pad navigation tests.
4. **إثبات IPA UNSIGNED.**
   - بناء `flutter build ios --release --no-codesign`.
   - فحص Payload/Runner.app والبندل والنسخة.
   - التأكد أن الاسم والوصف يذكران UNSIGNED بوضوح.
5. **إنشاء عقود Flutter للتفاصيل والحلقات.**
   - استهلاك runtime/compat API بدون upstream URLs.
   - فصل `episode_id` عن `episode_number`.
   - إضافة tests للترتيب والترقيم.
6. **إنشاء مسار المشاهدة الأصلي.**
   - استخدام opaque media refs فقط.
   - دعم MP4/HLS أولًا ثم MPEG-TS وفق توافق المنصة.
   - الحفاظ على Range/206 وDownload semantics.
7. **إضافة تفاصيل العمل والتنقل.**
   - Poster/title/type/year/episodes/actions.
   - حالات loading/empty/error/retry عربية.
   - عدم كسر infinite scroll عند العودة للقائمة.
8. **إضافة التخزين المحلي.**
   - مفضلة.
   - History وcontinue watching.
   - حفظ position بدون تخزين media refs منتهية.
9. **الحفاظ على الويب حيًا.**
   - إبقاء GitHub Pages workflow والملفات الحالية دون استبدال.
   - تشغيل WebKit/CORS/Range/Download regressions بعد تغييرات Flutter المشتركة.
   - عدم تحويل Pages إلى Flutter Web قبل parity فعلية.
10. **تهيئة GitHub Release الثلاثي.**
   - إنشاء checksum/provenance verification.
   - منع النشر إن غاب أي artifact.
   - نشر Release فقط بعد نجاح APK Mobile + APK TV + IPA UNSIGNED من نفس commit/version.
