# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `ea85d4238cf0333779ebb33fbca5d7900111bb7a` (merged PR #70: Flutter local Download library management).
- Active branch: `feat/flutter-media-format-70`.
- Active PR: #71 `Honor runtime media formats in Flutter playback`.
- Current PR head before this documentation commit: `c295868c4c370d0713aacd1936724c060720e20b`.
- Flutter product version: `1.0.2+2`.
- Existing Web/PWA remains the GitHub Pages product root and was not replaced by Flutter Web.
- Hourly automation `تطوير Al-Qahtani الأربع نسخ` is enabled and requires four-surface parity, version/build bumps, triplet builds and complete GitHub Releases after product-impacting merges.

## Four-surface product policy
Every product-impacting change is treated as one product across four surfaces:
1. Web/PWA on GitHub Pages.
2. Android Mobile APK.
3. Android TV APK with LEANBACK, D-Pad/focus and TV-specific UX.
4. iOS IPA UNSIGNED/no-codesign.

Web stays on GitHub Pages and is not replaced by Flutter Web or uploaded as a substitute Release asset. Mobile APK, TV APK and IPA UNSIGNED must come from the same commit/version and must be published together only after fail-closed verification. Platform-specific exceptions must be explicit; features must not silently disappear on one surface.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani contracts only. Upstream hosts, Worker/session material and source URLs must not appear in UI or logs. The inherited Basri source contract remains server-side only.

## Protected Web behavior
Protected regressions include iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, no ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, Android TV NavigationRail and library integration.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access with opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, playback, native Download and focus restoration ownership.
- `flutter_app/lib/src/player_page.dart`: internal `video_player`, resume/progress, TV remote controls, playback speed and media format hints.
- `flutter_app/lib/src/media_format_policy.dart`: HLS/MP4/MPEG-TS normalization; only HLS forces `VideoFormat.hls`, while MP4/MPEG-TS use native detection.
- `flutter_app/lib/src/player_controls.dart`: focusable rewind/play/forward and playback-speed menu.
- `flutter_app/lib/src/download_service.dart`: opaque-only atomic downloader plus safe local listing/deletion.
- `flutter_app/lib/src/download_library_section.dart`: local Download list/refresh/delete UI without exposing filesystem or upstream paths.
- `flutter_app/lib/src/library_store.dart`: favorites/history/continue-watching without persisted media refs.

## Release implementation
- `flutter_app/pubspec.yaml`: `1.0.2+2`.
- `.github/workflows/flutter-foundation.yml` now reads version/build dynamically from `pubspec.yaml`; it no longer hard-codes `1.0.1+1`.
- Mobile verification checks non-empty APK, package id, signature, versionName and versionCode.
- TV verification checks the same plus LEANBACK/touchscreen requirements and TV source requirements.
- iOS verification checks bundle id/version/build, rejects provisioning and `_CodeSignature`, then packages an explicitly UNSIGNED IPA.
- `.github/workflows/release-triplet.yml` triggers only after a successful `Flutter foundation` push run on `main`.
- The release job validates the exact source SHA, rejects duplicate version tags, waits for protected Web/runtime gates on that same commit, downloads the exact triplet artifacts, checks supplied SHA-256 files, generates `SHA256SUMS.txt` and `PROVENANCE.json`, publishes the Release, then verifies all required assets are non-empty.

## This run
1. Inspected actual main, branches, PRs, commits, workflows, code and docs.
2. Verified PR #70 final head `6b0afdbdbdb1b25a75b7f6b625ac5e1259413e4d` passed all protected workflows and Flutter Mobile/TV/iOS jobs.
3. Merged PR #70 to main as `ea85d4238cf0333779ebb33fbca5d7900111bb7a`.
4. Verified GitHub Pages `34686487667` and dynamic Pages `34686487105` succeeded on that exact merge commit.
5. Found #71 and #72 open simultaneously; closed #72 without merge and preserved its branch for later reapplication.
6. GitHub rejected stale #71 due conflicts. Reset #71 to current main and reapplied the intended media-format work instead of force-merging stale code.
7. Added HLS/MP4/MPEG-TS normalization and tests while retaining opaque Al-Qahtani media URLs.
8. Updated the hourly automation for four-surface parity and mandatory complete Releases after future product-impacting merges.
9. Raised Flutter version to `1.0.2+2` and made triplet identity/version checks dynamic.
10. Added the fail-closed Release workflow with exact-commit Pages/Web/runtime gating, checksums and provenance.

## CI / deployment evidence
- PR #70 final-head Flutter foundation `34686105171`: success.
- PR #70 protected workflows all succeeded: Content Runtime `34686105132`, Web Smoke `34686105218`, Mobile WebKit `34686105126`, Remote Movie `34686105315`, Live Provider `34686105173`, Remote CORS `34686105081`, CORS Boundary `34686105180`, Media Reference Expiry `34686105222`, Original Basri Download `34686105063`, Original Basri Player `34686105254`, Trusted Filename `34686105232`.
- Main `ea85d423...` Pages `34686487667`: success; dynamic Pages `34686487105`: success.
- PR #71 head `c295868...` protected Web/backend workflows are success: Remote CORS `34686800289`, Original Download `34686800277`, Trusted Filename `34686800297`, Original Player `34686800274`, Remote Movie `34686800331`, Media Expiry `34686800328`, Web Smoke `34686800291`, Content Runtime `34686800430`, Mobile WebKit `34686800292`, CORS Boundary `34686800271`, Live Provider `34686800288`.
- PR #71 Flutter foundation `34686800388`: analyze/tests success; Android Mobile success; Android TV success; iOS UNSIGNED success on version `1.0.2+2`.
- Because this state update advances the PR head, exact-final-head CI must run once more before merge.

## Artifact state
- PR #70 CI triplet was complete but remained Actions artifacts, not a Release.
- PR #71 `1.0.2+2` triplet has passed all four Flutter foundation jobs on head `c295868...`; exact-final-head artifacts will be regenerated after this state update.
- iOS is explicitly UNSIGNED/no-codesign and requires external signing/provisioning for installation.
- Target Release after #71 merge: tag `v1.0.2`, provided main triplet + Pages/runtime gates succeed and Release verification passes.
- No GitHub Release is claimed until GitHub actually publishes and verifies it.

## Repository Website / GitHub Pages URL
- Repository metadata currently reports `homepage: null` and `has_pages: true`.
- The current connector does not expose a confirmed repository Website/Homepage write operation and blocks the Pages settings endpoint used to retrieve authoritative URL metadata.
- Do not guess or hard-code a URL into product files. The hourly automation is instructed to set the official Pages URL in the GitHub Website/Homepage field once an authoritative URL and supported write action are available.

## Current blockers / gaps
- Exact-final-head CI must complete again after this documentation update before #71 may merge.
- The first automatic `v1.0.2` Release must be observed and verified after #71 merges; it is not yet published.
- News work from closed #72 remains preserved and must be rebased/reapplied after #71 is fully closed.
- Native runtime evidence is still needed for standalone MPEG-TS behavior on Android ExoPlayer and iOS AVPlayer.
- Repository Website/Homepage mutation remains blocked by current connector capability.

## أهداف التشغيل التالي
1. **إغلاق PR #71 بأمان.**
   - تشغيل CI على الرأس النهائي بعد هذا الملف.
   - إصلاح أي failure على نفس الفرع.
   - الدمج فقط بعد الخضرة الكاملة وعدم وجود conflicts.
2. **إثبات Release v1.0.2.**
   - متابعة Flutter foundation على main لنفس merge commit.
   - انتظار Pages/Web/runtime gates لنفس SHA.
   - التحقق من Mobile APK وTV APK وIPA UNSIGNED وSHA256SUMS وPROVENANCE في Release.
3. **التحقق من الويب بعد الدمج.**
   - فحص GitHub Pages لنفس merge commit.
   - فحص WebKit/CORS/Range/Download regressions.
   - إبقاء Pages بعيدًا عن Flutter Web حاليًا.
4. **إعادة أخبار #72 فوق main.**
   - إعادة تطبيق runtime/news facade دون upstream leakage.
   - إبقاء article refs opaque وقصيرة العمر.
   - فتح PR واحد فقط بعد إغلاق #71.
5. **توحيد الأربع نسخ لكل ميزة.**
   - تقييم Web/Mobile/TV/iOS عند كل تغيير.
   - تسجيل اختلافات المنصة الضرورية فقط.
   - منع إسقاط ميزة بصمت من أي نسخة.
6. **تثبيت HLS/MP4/MPEG-TS.**
   - اختبار initialize/play/seek/resume وRange/206.
   - فحص ExoPlayer وAVPlayer فعليًا قدر ما تسمح الأدوات.
   - عدم اختلاق دعم أو مدة غير مثبتة.
7. **تحسين Download/library parity.**
   - تثبيت list/refresh/delete على Mobile/TV.
   - إضافة export/share عبر APIs عامة فقط.
   - عدم كشف filesystem/upstream paths.
8. **حماية Release workflow.**
   - اختبار duplicate-version fail-closed.
   - اختبار missing/empty artifact fail-closed.
   - إبقاء IPA موسومة UNSIGNED بوضوح.
9. **تثبيت GitHub Website field.**
   - استخراج URL الرسمي من مصدر GitHub مسموح عند توفره.
   - استخدام Website/Homepage write action إذا أصبح متاحًا.
   - عدم تغيير ملفات المنتج لمحاكاة الحقل.
10. **صيانة مستمرة.**
   - منع regressions وتحديث الاعتماديات الآمنة.
   - تحسين الأداء والأمن وTV UX دون حذف وظائف.
   - تحديث هذا الملف في نهاية كل تشغيل بالدلائل الفعلية.
