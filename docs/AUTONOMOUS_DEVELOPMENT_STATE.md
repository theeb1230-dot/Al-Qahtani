# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `973b0ea6eefa2f3809da16229868020a6f55520d` (merged PR #69: restore Android TV focus after closing Flutter Player).
- Active branch: `feat/flutter-download-library-70`.
- Active PR: to be opened for local Download library management.
- Flutter product version: `1.0.1+1`; no GitHub Release yet because release policy remains fail-closed.
- Existing Web/PWA remains the GitHub Pages product root and was not replaced by Flutter Web.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes only Al-Qahtani contracts and must not expose upstream hosts, Worker/session material, or source URLs.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, Android TV NavigationRail and `مكتبتي` integration.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access with opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, playback, native Download and route-return focus ownership.
- `flutter_app/lib/src/player_page.dart`: internal `video_player` playback, resume/progress, TV remote-safe controls and playback speed.
- `flutter_app/lib/src/player_controls.dart`: focusable rewind/play/forward plus playback-speed menu.
- `flutter_app/lib/src/playback_policy.dart`: bounded supported playback speeds from 0.5x to 2x.
- `flutter_app/lib/src/route_focus_restorer.dart`: restores focus to the invoking Details control after Player route pop.
- `flutter_app/lib/src/download_service.dart`: opaque-only atomic native downloader plus safe local listing/deletion.
- `flutter_app/lib/src/download_library_section.dart`: local Download listing, refresh and deletion UI without exposing filesystem paths or upstream URLs.
- `flutter_app/lib/src/library_store.dart`: favorites/history/continue-watching without persisted media refs.

## This run
1. Re-inspected actual GitHub state and found PR #69 as the only open PR.
2. Verified exact PR #69 head `828552c5a3932ac32d2fc6c700d5e1a6e43f30d2` had all checks completed with no failures or in-progress checks.
3. Merged PR #69 to main as `973b0ea6eefa2f3809da16229868020a6f55520d` using the expected head SHA.
4. Verified post-merge GitHub Pages run `34685945935` completed successfully for that exact merge commit.
5. Confirmed no open PR remained, then created `feat/flutter-download-library-70` from exact main.
6. Extended `DownloadService` with safe local file listing, newest-first metadata and deletion confined to validated stored filenames.
7. Local listing ignores `.part`, zero-byte and non-file entries; only basename, size and modified time are exposed to Flutter UI.
8. Added `DownloadLibrarySection` under `مكتبتي` with Arabic loading/error/empty states, refresh and local deletion.
9. Added tests for listing order, filtering incomplete/empty downloads, safe deletion and rejection of unsafe stored names.
10. Existing GitHub Pages files were not modified and Flutter Web was not introduced.

## CI / deployment evidence
- PR #68 final-head Flutter foundation: `34683081584` success.
- PR #68 final-head protected workflows all succeeded: Original Download `34683081581`, Remote CORS `34683081595`, Trusted Filename `34683081585`, CORS Boundary `34683081562`, Original Player `34683081570`, Content Runtime `34683081592`, Media Expiry `34683081576`, Web Smoke `34683081566`, Remote Movie Playback `34683081614`, Live Provider `34683081583`, Mobile WebKit `34683081569`.
- Main `868850f...` GitHub Pages deploy: `34684853908` success.
- PR #69 exact-final-head checks: all completed successfully; no failing or pending checks remained before merge.
- Main `973b0ea6...` GitHub Pages deploy: `34685945935` success.
- Main `973b0ea6...` post-merge Flutter foundation: `34685945973` started; other protected post-merge workflows also started.
- PR #70 CI will start after PR creation; merge requires green evidence on its exact final head.

## Artifact state
- Latest fully verified triplet remains PR #68 at version `1.0.1+1`.
- Android Mobile APK: `Al-Qahtani-Mobile-APK`, 25,365,817 bytes, SHA-256 `676580ea7c7af25e60a4896e0d1812c35c4c7789075c7a4b1ee60480684c1c08`.
- Android TV APK: `Al-Qahtani-TV-APK`, 25,366,109 bytes, SHA-256 `ddf811d5be58720edd0413c1fbd7d279b9ace0dff659f01e6e0f369160811973`.
- iOS IPA UNSIGNED: `Al-Qahtani-iOS-UNSIGNED-IPA`, 7,411,353 bytes, SHA-256 `51828a369d29f86c61498b4cd4ac1e4e15b6cfdd43f915aac2a61572b91f23ef`.
- These are CI artifacts, not GitHub Release assets. iOS remains explicitly UNSIGNED/no-codesign and requires external signing/provisioning for installation.
- Release: none yet; no incomplete Release will be published.

## Current gaps / blockers
- PR #70 must pass Flutter Mobile/TV/iOS and all protected Web/backend regressions on its exact final head.
- Download management currently supports local list/refresh/delete; export/share through platform public APIs is not yet implemented.
- Player still needs runtime evidence for MP4/HLS and especially MPEG-TS on Android ExoPlayer and iOS AVPlayer.
- PiP/AirPlay integration remains unimplemented and must use public APIs only.
- A release-worthy tranche has not yet been declared, so version remains `1.0.1+1` and no Release is published.

## أهداف التشغيل التالي
1. **إغلاق PR #70 بأمان.**
   - فحص CI على الرأس النهائي فقط.
   - إصلاح أي failure على نفس الفرع.
   - الدمج فقط بعد الخضرة الكاملة.
2. **تثبيت مكتبة التنزيلات.**
   - اختبار list/refresh/delete على Mobile وTV.
   - تجاهل `.part` والملفات الفارغة دائمًا.
   - منع أي اسم مخزن غير آمن.
3. **إضافة export/share آمن.**
   - استخدام APIs عامة للمنصة فقط.
   - مشاركة الملف المحلي دون upstream URL.
   - الحفاظ على app-private storage كأصل آمن.
4. **إثبات MP4/HLS داخل Flutter.**
   - اختبار initialize/play/seek/resume.
   - التحقق من Range/206 عبر proxy.
   - عدم اختلاق duration.
5. **تثبيت MPEG-TS native behavior.**
   - فحص Android ExoPlayer.
   - فحص iOS AVPlayer.
   - fallback داخل Al-Qahtani فقط.
6. **تحسين المكتبة المحلية.**
   - عرض الحلقة والموضع بوضوح.
   - اختبار bounded history والتنظيف.
   - عدم تخزين media refs المنتهية.
7. **تشديد API contracts.**
   - توسيع mapping tests لـdetails/episodes/play/download.
   - رفض URLs خارج العقود.
   - تثبيت فصل episode_id عن episode_number.
8. **حماية Android TV UX.**
   - فحص D-Pad traversal للشاشات الرئيسية.
   - اختبار focus داخل مكتبة التنزيلات.
   - منع touch-only controls.
9. **حماية GitHub Pages.**
   - WebKit/CORS/Range/Download regressions.
   - عدم تحويل Pages إلى Flutter Web حاليًا.
   - فحص نفس merge commit بعد كل دمج.
10. **تجهيز Release triplet عند tranche مناسبة.**
   - رفع version/build للحزم الثلاث معًا.
   - APK Mobile + APK TV + IPA UNSIGNED من commit واحد.
   - SHA256SUMS/provenance وعدم نشر Release ناقص.
