# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `d0e258015770045bbfb0f8aef017e49ecedc1788` (`Add resilient unified home runtime contract`).
- PR #61 merged after all 11 exact-head pull-request workflows passed.
- Active PR: #62 `Start Flutter multi-platform foundation`.
- Branch: `feat/flutter-foundation-62`.
- Flutter product version: `1.0.1+1`.
- Web/PWA remains preserved on GitHub Pages; main Pages run `34667237764` completed successfully for `d0e258...`.

## Product boundary
Al-Qahtani is fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is allowed only as part of the preserved original Basri source contract. Flutter consumes Al-Qahtani runtime contracts only and does not implement scraping or expose upstream hosts itself.

## Protected Web behavior
The current web remains the production fallback and stays on GitHub Pages. Protected regressions include iPhone Safari playback, Range/206, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode display numbering, endless 30-item category pagination, explicit Download behavior, CORS, SSRF/allowlists, no ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Runtime foundation merged
- normalized `/api/v1/matches`, `/api/v1/search`, `/api/v1/category` contracts;
- product-level category IDs with server-side Basri mappings;
- endless category pagination on web;
- provider health/cache primitives;
- unified bounded home aggregation service merged in PR #61 with partial-failure isolation and catalog concurrency capped at 2.

## PR #62 — Flutter foundation
Implemented without deleting or replacing the web root:
- `flutter_app/pubspec.yaml`, Arabic localization, tests and lints;
- Arabic RTL Material 3 shell and mobile bottom navigation;
- initial Home, Matches, Movies, Series and Search screens;
- runtime-only client for `https://al-qahtani-api.onrender.com` using `/api/v1/matches`, `/api/v1/category`, `/api/v1/search`;
- normalized Flutter models with opaque/product refs separate from display fields;
- category infinite scroll with 30-item pages, dedup, loading guard, mounted/stale safety and pull-to-refresh;
- unit/model regressions plus a committed root-widget regression so `flutter create` cannot regenerate the obsolete `MyApp` smoke test;
- `.github/workflows/flutter-foundation.yml` with analyze/test, Android Mobile APK, Android TV APK, and iOS UNSIGNED IPA jobs.

### Failure found and fixed
Flutter foundation run `34667369427` on head `26f44665...` initially failed only in `analyze-test`: `flutter create` generated `test/widget_test.dart` referencing nonexistent `MyApp`. The branch now owns a valid `widget_test.dart` referencing `AlQahtaniApp`; the fresh run on head `f624c2b1...` passed analyze and tests.

### Proven artifact evidence before verification hardening
Flutter foundation run `34667474077` on exact head `f624c2b154031e1b20d85c04a85eebcf7a3c249c` completed successfully across all four jobs:
- `analyze-test`: success;
- `android-mobile`: success;
- `android-tv`: success, including LEANBACK/touchscreen source-manifest checks;
- `ios-unsigned`: success using `flutter build ios --release --no-codesign`.

Artifacts from that same commit/version were present and non-empty:
- `Al-Qahtani-Mobile-APK`, artifact `10289254352`, archive size 23,503,456 bytes;
- `Al-Qahtani-TV-APK`, artifact `10289334422`, archive size 23,503,554 bytes;
- `Al-Qahtani-iOS-UNSIGNED-IPA`, artifact `10289668661`, archive size 7,019,359 bytes.

Downloaded payload inspection also proved inner files were non-empty: Mobile APK 50,673,262 bytes, TV APK 50,673,370 bytes, IPA 7,042,066 bytes. The IPA contains `Payload/Runner.app`, bundle `com.alqahtani.alQahtani`, version `1.0.1`, build `1`, no `embedded.mobileprovision`, and no app-level `_CodeSignature` directory. It is therefore intentionally UNSIGNED and is not claimed directly installable without external signing/provisioning.

### Verification hardening now pending on the final PR head
The workflow has been strengthened further so the next exact-head run must fail closed unless:
- Android APKs are non-empty and pass `apksigner verify`;
- applicationId is `com.alqahtani.al_qahtani`, versionName is `1.0.1`, versionCode is `1`;
- TV packaged metadata contains LEANBACK/touchscreen requirements;
- APK SHA-256 sidecars are emitted;
- iOS bundle/version/build are exact, `embedded.mobileprovision` and app-level `_CodeSignature` are absent;
- IPA SHA-256 sidecar is emitted.
This hardening commit moves the PR head, so the entire exact-head matrix must pass again before merge.

## Release policy for Flutter
Required triplet from the same commit/version:
1. `Al-Qahtani-Mobile.apk`
2. `Al-Qahtani-TV.apk`
3. `Al-Qahtani-UNSIGNED.ipa`

AAB is not a substitute. Do not publish a GitHub Release until all three artifacts succeed from the same main commit/version, SHA-256 is recorded, Android identity/signature and TV requirements are verified, and iOS Payload/bundle/version/no-codesign state is validated. IPA remains explicitly UNSIGNED/no-codesign.

## Current blockers / gaps
- PR #62 still requires the fresh exact-head CI after artifact-verification hardening.
- Flutter details/episodes/play/download are not implemented yet.
- Native playback for MP4/HLS/MPEG-TS is not implemented yet.
- TV has build/manifest separation but not yet a complete TV-specific Focus/D-Pad UX test suite.
- Favorites/history/continue-watching are not implemented yet.
- No Flutter GitHub Release has been published yet.

## أهداف التشغيل التالي
1. **إغلاق PR #62 بأمان.**
   - انتظار كل exact-head web/backend وFlutter checks بعد verification hardening.
   - إصلاح أي failure من logs على نفس الفرع فقط.
   - الدمج فقط بعد الخضرة الكاملة.
2. **إثبات triplet بعد الدمج على main.**
   - تشغيل Mobile APK وTV APK وIPA UNSIGNED من main نفسه.
   - التحقق من SHA-256 والهوية/النسخة والبنية.
   - عدم نشر Release إذا غاب أصل واحد.
3. **إضافة TV runtime mode حقيقي.**
   - كشف target=tv داخل Flutter.
   - واجهة TV مخصصة ومسافات/focus مناسبة.
   - اختبارات D-Pad/Focus traversal.
4. **إنشاء عقود Flutter للتفاصيل والحلقات.**
   - استخدام Al-Qahtani API فقط.
   - فصل `episode_id` عن `episode_number`.
   - إضافة ordering/numbering tests.
5. **إضافة مسار التفاصيل والتنقل.**
   - Poster/title/type/year/episodes/actions.
   - حالات loading/empty/error/retry عربية.
   - حفظ حالة القائمة عند الرجوع.
6. **إنشاء مسار المشاهدة الأصلي.**
   - opaque media refs فقط.
   - MP4/HLS ثم MPEG-TS وفق توافق المنصة.
   - الحفاظ على Range/206 وDownload semantics.
7. **إضافة التحميل الآمن.**
   - استخدام endpoint التحميل الحالي بلا upstream URLs.
   - filename موثوق وحالات تقدم/فشل واضحة.
   - اختبارات عدم تسريب source URLs.
8. **إضافة التخزين المحلي.**
   - مفضلة، History، Continue Watching.
   - حفظ position دون تخزين media refs منتهية.
   - migration/versioning بسيط للتخزين.
9. **الحفاظ على الويب حيًا.**
   - GitHub Pages يبقى كما هو.
   - WebKit/CORS/Range/Download regressions تظل بوابات دمج.
   - لا Flutter Web replacement قبل parity فعلية.
10. **تهيئة GitHub Release الثلاثي.**
   - fail-closed release workflow بعد اكتمال الوظائف الأساسية.
   - SHA256SUMS + provenance/manifest + notes.
   - نشر APK Mobile + APK TV + IPA UNSIGNED فقط من نفس commit/version.
