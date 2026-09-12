# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `ea85d4238cf0333779ebb33fbca5d7900111bb7a` (merged PR #70: Flutter local Download library management).
- Active branch: `feat/flutter-media-format-70`.
- Active PR: #71 `Honor runtime media formats in Flutter playback`.
- PR #71 was rebased/reapplied onto current main after a merge conflict; the final head must be read from GitHub before merge.
- Flutter product version: `1.0.1+1`; this must be bumped before the first mandatory four-surface release under the new policy.
- Existing Web/PWA remains the GitHub Pages product root and was not replaced by Flutter Web.
- Scheduled automation `تطوير Al-Qahtani الأربع نسخ` is enabled hourly and now requires four-surface parity plus a GitHub Release triplet after every product-impacting merge.

## Four-surface product policy
Every future product-impacting change is treated as one product across four surfaces:
1. Existing Web/PWA on GitHub Pages.
2. Android Mobile APK.
3. Android TV APK with LEANBACK, D-Pad/focus and TV-specific UX.
4. iOS IPA UNSIGNED/no-codesign.

The Web/PWA remains deployed on GitHub Pages rather than being uploaded as a Release asset. The other three packages must be built from the same commit/version and published together in a GitHub Release only after fail-closed verification. Feature parity is required where platform APIs permit it; platform-specific differences must be explicit rather than silently dropping features.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes only Al-Qahtani contracts and must not expose upstream hosts, Worker/session material, or source URLs. The inherited Basri source contract remains server-side only.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, Android TV NavigationRail and local library integration.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access with opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, playback, native Download and route-return focus ownership.
- `flutter_app/lib/src/player_page.dart`: internal `video_player` playback, resume/progress, TV remote-safe controls, playback speed and media-type format hints.
- `flutter_app/lib/src/media_format_policy.dart`: HLS/MP4/MPEG-TS normalization without exposing source URLs.
- `flutter_app/lib/src/player_controls.dart`: focusable rewind/play/forward plus playback-speed menu.
- `flutter_app/lib/src/download_service.dart`: opaque-only atomic native downloader plus safe local listing/deletion.
- `flutter_app/lib/src/download_library_section.dart`: local Download listing, refresh and deletion UI without exposing filesystem paths or upstream URLs.
- `flutter_app/lib/src/library_store.dart`: favorites/history/continue-watching without persisted media refs.

## This run
1. Re-inspected main, open PRs, CI and repository state.
2. Verified PR #70 final head `6b0afdbdbdb1b25a75b7f6b625ac5e1259413e4d` passed all protected workflows and the Flutter Mobile/TV/iOS triplet build.
3. Merged PR #70 to main as `ea85d4238cf0333779ebb33fbca5d7900111bb7a`.
4. Verified post-merge GitHub Pages runs `34686487667` and dynamic Pages run `34686487105` succeeded for that exact main commit.
5. Found PR #71 and #72 open simultaneously, violating the one-PR policy.
6. Closed #72 without merging; its news branch remains preserved for later reapplication after #71 is complete.
7. PR #71 had green checks on its old head but could not merge because main advanced after #70; GitHub correctly reported merge conflicts.
8. Reset #71 branch to current main and reapplied the media-format changes instead of force-merging stale code.
9. Restored explicit HLS/MP4/MPEG-TS normalization and regression tests; HLS supplies the native `VideoFormat.hls` hint while MP4/MPEG-TS leave platform-native detection in control.
10. Updated the hourly automation to require four-surface parity and mandatory triplet GitHub Releases after every future product-impacting merge.

## CI / deployment evidence
- PR #70 final-head Flutter foundation: `34686105171` success.
- PR #70 protected workflows all succeeded before merge, including Content Runtime `34686105132`, Web Smoke `34686105218`, Mobile WebKit `34686105126`, Remote Movie `34686105315`, Live Provider `34686105173`, Remote CORS `34686105081`, CORS Boundary `34686105180`, Media Reference Expiry `34686105222`, Original Basri Download `34686105063`, Original Basri Player `34686105254`, Trusted Download Filename `34686105232`.
- Main `ea85d423...` GitHub Pages deploy: `34686487667` success.
- Main `ea85d423...` dynamic Pages deploy: `34686487105` success.
- PR #71 rebased-head protected workflows were started again after the reapply; merge requires exact-final-head green evidence after this documentation commit.

## Artifact state
PR #70 produced a full CI triplet from the same exact head, but these are Actions artifacts rather than GitHub Release assets:
- Android Mobile: `Al-Qahtani-Mobile-APK`, artifact id `10295422905`, size `25,407,065`, artifact digest `sha256:fa1eb78769fea141f49f69a6247d2fd29ec1ba678827f6a443aba6bf9cc7f597`.
- Android TV: `Al-Qahtani-TV-APK`, artifact id `10295432670`, size `25,406,944`, artifact digest `sha256:38db34988d04b06e866dec9b915c74a1d6899e9472b8a284604f8efdfccf9789`.
- iOS IPA UNSIGNED: `Al-Qahtani-iOS-UNSIGNED-IPA`, artifact id `10295522326`, size `7,421,807`, artifact digest `sha256:879daad74f02b0609996cd770b79cb22b6e4f65d7d66175d58467352d27f4e4e`.
- iOS remains UNSIGNED/no-codesign and requires external signing/provisioning for installation.
- GitHub Release: none yet. Actions artifacts are not considered a substitute.

## Repository Website / GitHub Pages URL
- Repository metadata currently reports `homepage: null` and `has_pages: true`.
- The connector currently exposes repository reads but no confirmed repository-metadata mutation action for the Website/Homepage field.
- Do not invent or hard-code a guessed Pages URL in product files. Verify the official Pages URL from GitHub deployment metadata and set the repository Website/Homepage only when a supported write action is available.

## Current blockers / gaps
- PR #71 must complete exact-final-head CI after this state update before merge.
- The mandatory version-bump + automatic GitHub Release workflow is not yet merged; it must be implemented after the currently open PR is closed because of the one-PR rule.
- The preserved news work from closed PR #72 must be rebased/reapplied from current main before it returns as the sole open PR.
- Native runtime evidence is still needed for MP4/HLS and especially standalone MPEG-TS behavior on Android ExoPlayer and iOS AVPlayer.
- GitHub Website/Homepage cannot yet be changed through the currently exposed repository mutation tools.

## أهداف التشغيل التالي
1. **إغلاق PR #71 بأمان.**
   - انتظار CI على الرأس النهائي بعد تحديث هذا الملف.
   - إصلاح أي failure على نفس الفرع.
   - الدمج فقط بعد الخضرة الكاملة وعدم وجود conflicts.
2. **التحقق بعد دمج #71.**
   - فحص GitHub Pages على نفس merge commit.
   - فحص WebKit/CORS/Range/Download regressions.
   - توثيق main الجديد فعليًا.
3. **إعادة أخبار #72 فوق main.**
   - إعادة تطبيق runtime/news facade دون upstream URL leakage.
   - إبقاء article refs opaque وقصيرة العمر.
   - فتح PR واحد فقط بعد إغلاق #71.
4. **توحيد سياسة الإصدار للأربع نسخ.**
   - رفع `version/build` لكل تعديل منتج مدمج.
   - إبقاء Web على Pages.
   - ربط الثلاث حزم بنفس commit/version.
5. **إنشاء GitHub Release workflow fail-closed.**
   - APK Mobile + APK TV + IPA UNSIGNED فقط.
   - إنشاء `SHA256SUMS.txt` وprovenance/release manifest.
   - منع Release إذا فشلت أي حزمة أو تحقق.
6. **نشر أول Release كامل.**
   - تشغيل triplet من main بعد رفع النسخة.
   - التحقق من Android identities/signatures وTV LEANBACK وiOS no-codesign.
   - التحقق أن الأصول الثلاثة قابلة للتنزيل من Releases.
7. **تثبيت HLS/MP4/MPEG-TS.**
   - اختبار initialize/play/seek/resume وRange/206.
   - فحص ExoPlayer وAVPlayer فعليًا قدر ما تسمح الأدوات.
   - عدم اختلاق support أو duration غير مثبت.
8. **تحسين Download/library parity.**
   - تطبيق list/refresh/delete بأمان على Mobile/TV.
   - إضافة export/share عبر APIs عامة فقط.
   - عدم كشف filesystem/upstream paths.
9. **تثبيت GitHub Pages Website field.**
   - استخراج URL الرسمي الموثق من deployment.
   - استخدام repository Website/Homepage write action إذا أصبح متاحًا.
   - عدم تعديل المنتج لمجرد محاكاة حقل GitHub.
10. **حماية parity مستقبلًا.**
   - إضافة checklist/tests للويب وMobile وTV وiOS لكل ميزة.
   - تسجيل الاستثناءات الخاصة بالمنصة صراحة.
   - منع دمج ميزة تسقط بصمت من إحدى النسخ الأربع.
