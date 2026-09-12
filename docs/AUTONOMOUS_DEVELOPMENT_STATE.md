# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `868850f3471ebe5007a54b8b8dc217fe53096e3f` (merged PR #68: native Flutter playback speed controls).
- Active branch: `feat/flutter-tv-focus-restore-69`.
- Active PR: to be opened for Android TV focus restoration.
- Flutter product version: `1.0.1+1`; no GitHub Release yet because release policy remains fail-closed.
- Existing Web/PWA remains the GitHub Pages product root and was not replaced by Flutter Web.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes only Al-Qahtani contracts and must not expose upstream hosts, Worker/session material, or source URLs.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation and Android TV NavigationRail.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access with opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, playback, native Download and route-return focus ownership.
- `flutter_app/lib/src/player_page.dart`: internal `video_player` playback, resume/progress, TV remote-safe controls and playback speed.
- `flutter_app/lib/src/player_controls.dart`: focusable rewind/play/forward plus speed menu.
- `flutter_app/lib/src/playback_policy.dart`: bounded supported playback speeds from 0.5x to 2x.
- `flutter_app/lib/src/route_focus_restorer.dart`: restores focus to the invoking Details control after Player route pop.
- `flutter_app/lib/src/download_service.dart`: opaque-only atomic native downloader.
- `flutter_app/lib/src/library_store.dart`: favorites/history/continue-watching without persisted media refs.

## This run
1. Re-inspected GitHub actual state and confirmed PR #68 was the only open PR and mergeable.
2. Verified exact PR #68 head `a267b48c416ebc194a53aea4dfaf06e7c3ced72a` passed all 12 protected workflows.
3. Verified Flutter foundation run `34683081584` passed analyze/tests, Android Mobile APK checks, Android TV LEANBACK/package checks and iOS UNSIGNED/no-codesign checks.
4. Verified all three PR #68 artifacts were produced from the same head commit.
5. Merged PR #68 to main as `868850f3471ebe5007a54b8b8dc217fe53096e3f`.
6. Verified post-merge GitHub Pages deploy `34684853908` succeeded for that exact merge commit; protected post-merge smoke jobs were still running when this state was written.
7. Confirmed no open PR remained, then created `feat/flutter-tv-focus-restore-69` from exact main.
8. Added route-aware focus restoration for direct playback and individual episode playback.
9. Added dedicated FocusNodes for the direct play tile and episode tiles, with deterministic disposal.
10. Added widget regression coverage proving focus returns to the invoking control after the Player route closes.

## CI / deployment evidence
- PR #68 final-head Flutter foundation: `34683081584` success.
- PR #68 final-head Original Download `34683081581`, Remote CORS `34683081595`, Trusted Filename `34683081585`, CORS Boundary `34683081562`, Original Player `34683081570`, Content Runtime `34683081592`, Media Expiry `34683081576`, Web Smoke `34683081566`, Remote Movie Playback `34683081614`, Live Provider `34683081583`, Mobile WebKit `34683081569`: all success.
- Main `868850f...` GitHub Pages deploy: `34684853908` success.
- Main `868850f...` post-merge regression workflows started successfully; some were still in progress at state-write time.
- PR #69 CI will start after PR creation; merge requires exact-final-head green evidence.

## Artifact state
- PR #68 Android Mobile APK: `Al-Qahtani-Mobile-APK`, 25,365,817 bytes, SHA-256 `676580ea7c7af25e60a4896e0d1812c35c4c7789075c7a4b1ee60480684c1c08`.
- PR #68 Android TV APK: `Al-Qahtani-TV-APK`, 25,366,109 bytes, SHA-256 `ddf811d5be58720edd0413c1fbd7d279b9ace0dff659f01e6e0f369160811973`.
- PR #68 iOS IPA UNSIGNED: `Al-Qahtani-iOS-UNSIGNED-IPA`, 7,411,353 bytes, SHA-256 `51828a369d29f86c61498b4cd4ac1e4e15b6cfdd43f915aac2a61572b91f23ef`.
- These are CI artifacts, not GitHub Release assets. iOS remains explicitly UNSIGNED/no-codesign and requires external signing/provisioning for installation.
- Release: none yet; no incomplete Release will be published.

## Current gaps / blockers
- PR #69 must pass Flutter Mobile/TV/iOS and protected Web/backend regressions on its exact final head.
- Player still needs runtime evidence for MP4/HLS and especially MPEG-TS on Android ExoPlayer and iOS AVPlayer.
- Download files remain app-private; user-visible export/share management is not yet implemented.
- PiP/AirPlay integration remains unimplemented and must use public APIs only.
- A release-worthy tranche has not yet been declared, so version remains `1.0.1+1` and no Release is published.

## أهداف التشغيل التالي
1. **إغلاق PR #69 بأمان.**
   - فحص CI على الرأس النهائي فقط.
   - إصلاح أي failure على نفس الفرع.
   - الدمج فقط بعد الخضرة الكاملة.
2. **تثبيت TV focus restoration.**
   - اختبار direct playback return focus.
   - اختبار episode return focus.
   - منع تسريب FocusNodes أو focus dead-ends.
3. **إثبات MP4/HLS داخل Flutter.**
   - اختبار initialize/play/seek/resume.
   - التحقق من Range/206 عبر proxy.
   - عدم اختلاق duration.
4. **تثبيت MPEG-TS native behavior.**
   - فحص Android ExoPlayer.
   - فحص iOS AVPlayer.
   - fallback داخل Al-Qahtani فقط.
5. **تحسين Download management.**
   - إضافة قائمة تنزيلات محلية.
   - إضافة export/share آمن.
   - عدم كشف upstream URLs.
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
   - منع touch-only controls.
   - اختبار focus بعد retry/back/navigation.
9. **حماية GitHub Pages.**
   - WebKit/CORS/Range/Download regressions.
   - عدم تحويل Pages إلى Flutter Web حاليًا.
   - فحص نفس merge commit بعد كل دمج.
10. **تجهيز Release triplet عند tranche مناسبة.**
   - رفع version/build للحزم الثلاث معًا.
   - APK Mobile + APK TV + IPA UNSIGNED من commit واحد.
   - SHA256SUMS/provenance وعدم نشر Release ناقص.
