# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `f19ce24e4808cc5d1914ba09475ba3eb51cac1da` (merged PR #71: Flutter HLS/MP4/MPEG-TS format handling plus first automatic Release workflow).
- Active branch: `fix/release-triplet-trigger-73`.
- Active PR: to be opened for the Release trigger repair.
- Flutter product version on this branch: `1.0.3+3`.
- Web/PWA remains the GitHub Pages product root and is not replaced by Flutter Web.
- Hourly automation `تطوير Al-Qahtani الأربع نسخ` is enabled and enforces four-surface parity, version/build bumps, triplet builds and complete GitHub Releases after product-impacting merges.

## Four-surface policy
Every product-impacting change is treated as one product on four surfaces:
1. Web/PWA on GitHub Pages.
2. Android Mobile APK.
3. Android TV APK with LEANBACK, D-Pad/focus and TV-specific UX.
4. iOS IPA explicitly UNSIGNED/no-codesign.

Web remains on Pages. Mobile APK, TV APK and IPA UNSIGNED must be produced from the same commit/version and published together in GitHub Releases only after fail-closed verification. Platform-specific exceptions must be explicit rather than silently dropping features.

## Product boundary
Al-Qahtani stays independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani contracts only and must not expose upstream hosts, Worker/session material or source URLs. The inherited Basri contract remains server-side only.

## Protected Web behavior
Protect iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, HLS/MPEG-TS handling, measured duration, real match logos, Saudi times, separated episode numbering, endless 30+30 pagination, explicit Download semantics, CORS, SSRF/allowlists, no ads/popups/unneeded tracking, and no legacy Android Intent/deep-links.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, Android TV NavigationRail and local library.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access with opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, playback, Download and route-return focus ownership.
- `flutter_app/lib/src/player_page.dart`: internal player, resume/progress, TV controls, playback speed and media-format hinting.
- `flutter_app/lib/src/media_format_policy.dart`: HLS/MP4/MPEG-TS normalization; only HLS forces `VideoFormat.hls`, MP4/MPEG-TS use native detection.
- `flutter_app/lib/src/download_service.dart`: opaque-only atomic downloader plus safe local listing/deletion.
- `flutter_app/lib/src/download_library_section.dart`: safe local Download list/refresh/delete UI without filesystem/upstream path exposure.
- `flutter_app/lib/src/library_store.dart`: favorites/history/continue-watching without persisted media refs.

## Release implementation
- `flutter-foundation.yml` reads version/build dynamically from `pubspec.yaml`.
- Mobile verification checks APK presence, package id, signature, versionName and versionCode.
- TV verification adds LEANBACK/touchscreen/TV source checks.
- iOS verification checks bundle id/version/build and rejects provisioning / `_CodeSignature` before packaging the UNSIGNED IPA.
- `release-triplet.yml` waits for exact-commit Pages/Web/runtime gates, downloads exact-run triplet artifacts, verifies supplied checksums, creates `SHA256SUMS.txt` and `PROVENANCE.json`, publishes all five assets and verifies them.
- The first merged Release workflow run `34687111604` was skipped before any job step. Root cause was the top-level job gate being over-constrained by `workflow_run.event == 'push'`.
- Current fix removes that fragile field from the job-level expression and instead verifies the triggering run event/branch/SHA explicitly inside the job with GitHub API data. Thus an invalid trigger fails visibly rather than silently skipping the release.

## This run
1. Verified PR #70 final head and triplet, then merged it to main `ea85d4238cf0333779ebb33fbca5d7900111bb7a`.
2. Verified Pages `34686487667` and dynamic Pages `34686487105` on that exact commit.
3. Recovered from simultaneous #71/#72 by closing #72 unmerged and preserving its news branch.
4. Rebased/reapplied #71 over current main after stale merge conflicts.
5. Added HLS/MP4/MPEG-TS Flutter format normalization and regression tests.
6. Raised version to `1.0.2+2`, made triplet version checks dynamic and added fail-closed automatic GitHub Release automation.
7. PR #71 was merged as main `f19ce24e4808cc5d1914ba09475ba3eb51cac1da`.
8. Main protected Web/runtime jobs observed so far on that commit are green, while the main Flutter foundation run `34687043483` is the triplet source run.
9. Automatic Release run `34687111604` was `skipped`, so no false Release claim was made.
10. Created `fix/release-triplet-trigger-73`, bumped to `1.0.3+3`, and repaired the release gate so trigger provenance is checked inside the job rather than skipped at job selection.

## Artifact / Release state
- PR #70 triplet artifacts were successful but were only Actions artifacts.
- PR #71 pre-merge `1.0.2+2` triplet passed Mobile, TV, iOS UNSIGNED and analyze/tests.
- Main source run for the first automatic Release: Flutter foundation `34687043483` on `f19ce24e...`.
- Automatic Release run `34687111604`: skipped; therefore `v1.0.2` is not claimed as published.
- Current target after this repair merges: `v1.0.3`, build `3`.
- A Release is valid only when Mobile APK, TV APK, iOS UNSIGNED IPA, `SHA256SUMS.txt`, and `PROVENANCE.json` are all present and non-empty.

## Repository Website / Pages URL
- Repository metadata reports `homepage: null` and `has_pages: true`.
- The current connector does not expose a confirmed repository Website/Homepage mutation action and blocks the Pages settings endpoint required for authoritative URL retrieval.
- Do not guess or hard-code the Pages URL. The automation is instructed to populate Website/Homepage only when the official URL can be read authoritatively and a supported write action exists.

## Current blockers / gaps
- This Release trigger fix must pass exact-final-head CI and merge before `v1.0.3` can be attempted.
- The Release must then be observed and its five assets verified; until then no Release success claim is valid.
- The news work from closed #72 remains preserved and must be reapplied only after this PR closes.
- Native standalone MPEG-TS evidence on ExoPlayer/AVPlayer still needs strengthening.
- Repository Website/Homepage write remains blocked by connector capability.

## أهداف التشغيل التالي
1. **إغلاق إصلاح Release بأمان.**
   - فتح PR واحد لهذا الفرع.
   - فحص exact-final-head CI وإصلاح أي failure.
   - الدمج فقط بعد الخضرة الكاملة.
2. **إثبات v1.0.3.**
   - انتظار main Flutter triplet لنفس merge commit.
   - انتظار Pages/Web/runtime gates لنفس SHA.
   - التحقق من نجاح Release workflow وعدم skip.
3. **التحقق من أصول Release.**
   - Mobile APK وTV APK وIPA UNSIGNED.
   - `SHA256SUMS.txt` و`PROVENANCE.json`.
   - التأكد من أنها غير فارغة وقابلة للتنزيل.
4. **حماية الويب.**
   - فحص Pages على merge commit نفسه.
   - حماية WebKit/CORS/Range/Download.
   - عدم استبدال الويب بـFlutter Web حاليًا.
5. **إعادة أخبار #72.**
   - إعادة تطبيقها فوق main الجديد.
   - إبقاء refs opaque وعدم كشف upstream.
   - فتحها فقط بعد إغلاق PR الإصدار.
6. **توحيد الأربع نسخ.**
   - تقييم Web/Mobile/TV/iOS لكل ميزة.
   - تسجيل اختلافات المنصة الضرورية.
   - منع سقوط ميزة بصمت.
7. **تثبيت HLS/MP4/MPEG-TS.**
   - اختبار play/seek/resume وRange/206.
   - فحص ExoPlayer وAVPlayer قدر ما تسمح الأدوات.
   - عدم اختلاق دعم غير مثبت.
8. **تطوير Download/library.**
   - تثبيت list/refresh/delete على Mobile/TV.
   - إضافة export/share آمن لاحقًا.
   - عدم كشف filesystem/upstream paths.
9. **تثبيت Website/Homepage.**
   - قراءة URL الرسمي عند توفر endpoint مسموح.
   - استخدام write action رسمي عند توفره.
   - عدم التخمين.
10. **صيانة مستمرة.**
   - منع regressions وتحديث الاعتماديات الآمنة.
   - تحسين الأداء والأمن وTV UX.
   - تحديث هذا الملف في نهاية كل تشغيل بالدلائل الفعلية.
