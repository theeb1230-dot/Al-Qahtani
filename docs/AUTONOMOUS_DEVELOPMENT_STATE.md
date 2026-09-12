# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `7fbe83f4137301c2201d1f58b112c0e1d1aa85b2` (merged PR #67: native Flutter downloads + Android TV remote-first player controls).
- Active branch: `feat/flutter-player-speed-68`.
- Active PR: to be opened for playback-speed tranche.
- Flutter product version: `1.0.1+1`; no GitHub Release yet because release policy is fail-closed.
- Existing Web/PWA remains the GitHub Pages root and was not replaced by Flutter Web.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes only Al-Qahtani contracts and must not expose upstream hosts, Worker/session material, or source URLs.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation and Android TV NavigationRail.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access with opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, playback and native Download.
- `flutter_app/lib/src/player_page.dart`: internal `video_player` playback, resume/progress, TV remote-safe controls and native playback-speed application.
- `flutter_app/lib/src/player_controls.dart`: focusable rewind/play/forward plus speed menu.
- `flutter_app/lib/src/playback_policy.dart`: bounded supported playback speeds from 0.5x to 2x.
- `flutter_app/lib/src/download_service.dart`: opaque-only atomic native downloader.
- `flutter_app/lib/src/library_store.dart`: favorites/history/continue-watching without persisted media refs.

## This run
1. Re-inspected GitHub actual state, all branches, the only open PR and CI state.
2. Confirmed PR #67 final head `3feaf551d5ec7f8dd7a5c5a70f55586b66b82462` passed all 12 protected workflows.
3. Flutter foundation run `34682564360` passed analyze/tests, Android Mobile APK, Android TV APK identity/LEANBACK checks and iOS UNSIGNED/no-codesign build.
4. Merged PR #67 to main as `7fbe83f4137301c2201d1f58b112c0e1d1aa85b2`.
5. Verified post-merge GitHub Pages deploy `34682801846` succeeded and dynamic Pages deployment `34682800749` succeeded for that exact merge commit.
6. Confirmed no open PR remained, then created `feat/flutter-player-speed-68` from exact main.
7. Added bounded playback-speed policy: 0.5x, 0.75x, 1x, 1.25x, 1.5x and 2x.
8. Wired `video_player.setPlaybackSpeed` into Player and added a remote-focusable speed menu.
9. Added widget/policy regression tests for speed selection and supported values.
10. GitHub Pages product root remains untouched.

## CI / deployment evidence
- PR #67 final-head Flutter foundation: `34682564360` success.
- PR #67 final-head Content runtime: `34682564320` success.
- PR #67 final-head Mobile WebKit: `34682564325` success.
- PR #67 final-head Remote movie playback: `34682564333` success.
- PR #67 final-head Live provider: `34682564386` success.
- PR #67 final-head Web smoke: `34682564319` success.
- Main `7fbe83f...` GitHub Pages deploy: `34682801846` success.
- Main `7fbe83f...` dynamic pages deployment: `34682800749` success.
- PR #68 CI: pending after PR creation.

## Artifact state
- Android Mobile APK: PR #67 build succeeded; version remains `1.0.1+1`; not a published Release asset.
- Android TV APK: PR #67 build + LEANBACK/package checks succeeded; not a published Release asset.
- iOS IPA UNSIGNED: PR #67 no-codesign build succeeded; artifact digest recorded by Actions; not installable without external signing/provisioning.
- Release: none yet; no incomplete GitHub Release will be published.

## Current gaps / blockers
- PR #68 must pass Flutter Mobile/TV/iOS and protected Web/backend regressions on its exact final head.
- Player still needs runtime evidence for MP4/HLS and especially MPEG-TS on Android ExoPlayer and iOS AVPlayer.
- Back-focus restoration from Player to Details still needs navigation regression coverage.
- Download files are app-private; user-visible export/share management remains to be implemented without exposing upstream URLs.
- PiP/AirPlay integration remains unimplemented and must use public APIs only.

## أهداف التشغيل التالي
1. **إغلاق PR #68 بأمان.**
   - فحص كل CI على الرأس النهائي.
   - إصلاح أي failure على نفس الفرع.
   - الدمج فقط بعد الخضرة الكاملة.
2. **تثبيت Playback Speed.**
   - اختبار 0.5x–2x.
   - إبقاء 1x افتراضيًا.
   - ضمان عمل القائمة بالريموت.
3. **إكمال Android TV Player.**
   - اختبار Back وإعادة focus للتفاصيل.
   - منع touch-only controls.
   - إبقاء D-Pad traversal واضحًا.
4. **إثبات MP4/HLS.**
   - اختبار lifecycle وseek/progress.
   - التحقق من Range/206 عبر proxy.
   - عدم اختلاق duration.
5. **تثبيت MPEG-TS.**
   - فحص ExoPlayer وAVPlayer.
   - fallback داخل Al-Qahtani فقط.
   - رسالة صادقة عند عدم الدعم.
6. **تحسين Download.**
   - إضافة إدارة/تصدير آمن للملفات.
   - عدم كشف upstream URLs.
   - الحفاظ على atomic writes.
7. **تحسين المكتبة المحلية.**
   - عرض الحلقة والموضع بوضوح.
   - اختبار حد السجل والتنظيف.
   - عدم تخزين media refs المنتهية.
8. **تشديد API contracts.**
   - اختبارات details/episodes/play/download.
   - رفض URLs خارج العقود.
   - فصل episode_id عن episode_number.
9. **حماية GitHub Pages.**
   - WebKit/CORS/Range/Download regressions.
   - عدم تحويل Pages إلى Flutter Web حاليًا.
   - فحص نفس merge commit بعد كل دمج.
10. **تجهيز Release triplet.**
   - رفع version/build للحزم الثلاث معًا عند tranche release-worthy.
   - APK Mobile + APK TV + IPA UNSIGNED من commit واحد.
   - SHA256SUMS/provenance وعدم نشر Release ناقص.
