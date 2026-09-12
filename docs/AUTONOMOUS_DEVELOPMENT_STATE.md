# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `11bb2a41578acb533a42c169f2e01440a6694c15` (`Start Flutter multi-platform foundation`).
- PR #62 is merged. No PR was open at the start of this run.
- Active branch: `feat/flutter-tv-runtime-63`.
- Flutter product version remains `1.0.1+1` until a release-worthy functional tranche is complete.
- Web/PWA remains preserved at the existing GitHub Pages root and is not replaced by Flutter Web.

## Product boundary
Al-Qahtani is fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is allowed only as part of the preserved original Basri source contract. Flutter consumes Al-Qahtani runtime contracts only and must not implement scraping or expose upstream hosts, Workers, session material, or short-lived media sources.

## Protected Web behavior
The current web remains published on GitHub Pages. Protected regressions include iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode display numbering, endless 30-item category pagination, explicit Download behavior, CORS, SSRF/allowlists, no ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter foundation merged
PR #62 introduced `flutter_app/` without replacing the web root. The foundation includes Arabic RTL Material 3, runtime-only API access, initial Home/Matches/Movies/Series/Search surfaces, normalized models, endless category pagination, and the Flutter CI artifact matrix.

The merged artifact workflow builds from one commit/version:
1. Android Mobile APK.
2. Android TV APK with LEANBACK launcher metadata.
3. iOS IPA using `--no-codesign`, explicitly UNSIGNED.

The workflow verifies non-empty artifacts, Android package/version/signature, TV packaged features, iOS bundle/version/build/no-provision/no-app-signature, and emits SHA-256 sidecars. IPA remains intentionally UNSIGNED and is not directly installable without external signing/provisioning.

## Active work — Flutter TV runtime separation
Branch `feat/flutter-tv-runtime-63` adds a real runtime distinction instead of relying only on TV manifest metadata:
- `flutter_app/lib/src/app_target.dart` parses `AL_QAHTANI_TARGET` into Mobile/TV/iOS runtime targets.
- TV uses a persistent `NavigationRail`, wider spacing, five-column catalog density and TV-specific scroll prefetch distance.
- Matches, catalog cards and search results are focusable/clickable so D-Pad focus traversal has real interactive targets.
- Category refresh/load now uses a request generation guard to reject stale responses after refresh/dispose while keeping dedup and one-load-at-a-time behavior.
- `flutter_app/test/app_target_test.dart` covers target parsing and safe fallback behavior.
- Flutter CI now executes tests again with `--dart-define=AL_QAHTANI_TARGET=tv` and checks that the TV runtime source path is present before building the TV APK.

## CI / deployment evidence
- PR #62 exact-head Flutter matrix passed before merge, including analyze/test, Android Mobile, Android TV and iOS unsigned build jobs.
- Earlier verified artifacts were non-empty and the iOS package contained `Payload/Runner.app`, version `1.0.1`, build `1`, with no embedded provisioning profile and no app-level `_CodeSignature`.
- A fresh exact-head CI run for the active branch is required before merging this phase.
- GitHub Pages must remain green after merge; web regression workflows remain mandatory merge evidence.

## Current gaps
- Flutter details/title contract UI is not implemented.
- Flutter episodes and explicit `episode_id`/`episode_number` UI are not implemented.
- Flutter play/media/download flows are not implemented.
- Native playback compatibility for MP4/HLS/MPEG-TS is not yet proven.
- TV needs a dedicated D-Pad traversal widget test beyond target-define compilation.
- Favorites/history/continue-watching storage is not implemented.
- No Flutter GitHub Release has been published yet; a release must remain fail-closed until the full triplet is produced from the same release commit/version.

## أهداف التشغيل التالي
1. **إغلاق PR مرحلة TV بأمان.**
   - فحص كل exact-head checks.
   - إصلاح أي failure من logs على نفس الفرع.
   - الدمج فقط بعد خضرة Web + Flutter.
2. **إثبات D-Pad/Focus فعليًا.**
   - إضافة widget test للتنقل بين عناصر TV.
   - التحقق من focus المرئي وعدم احتجاز المؤشر.
   - تثبيت سلوك Back/Select الأساسي.
3. **إضافة عقد التفاصيل في Flutter.**
   - استهلاك Al-Qahtani API فقط.
   - model موحد للعنوان والposter/metadata.
   - حالات loading/empty/error/retry عربية.
4. **إضافة الحلقات بترقيم صحيح.**
   - فصل `episode_id` عن `episode_number`.
   - ترتيب منطقي للمواسم والحلقات.
   - اختبارات تمنع عرض IDs الداخلية.
5. **إضافة مسار Watch/Play.**
   - طلب opaque play/media refs فقط.
   - عدم تسجيل upstream URLs.
   - fallback مفهوم للمستخدم دون تسريب المصدر.
6. **إضافة playback متعدد الحاويات.**
   - MP4/HLS أولًا مع توافق المنصة.
   - معالجة MPEG-TS وفق عقد Al-Qahtani الحالي.
   - حفظ Range/206 وduration semantics.
7. **إضافة Download آمن.**
   - endpoint التحميل الحالي فقط.
   - اسم ملف موثوق وحالات تقدم/فشل.
   - اختبار عدم تسريب upstream.
8. **إضافة التخزين المحلي.**
   - Favorites وHistory وContinue Watching.
   - حفظ position دون media refs منتهية.
   - versioned local schema بسيط.
9. **حماية GitHub Pages أثناء كل دمج.**
   - إبقاء ملفات الويب الحالية دون استبدال.
   - تشغيل WebKit/CORS/Range/Download regressions.
   - عدم نقل Pages إلى Flutter Web قبل parity كاملة.
10. **تهيئة Release triplet لاحقًا.**
   - APK Mobile + APK TV + IPA UNSIGNED من نفس commit/version.
   - SHA256SUMS + provenance/manifest + notes.
   - عدم نشر Release ناقص أو AAB بديلًا عن APK.
