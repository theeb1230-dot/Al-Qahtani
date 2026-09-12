# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `25715a172d71a3e8f5811bfba712ca2ad9d76dce` (merged PR #66: Flutter local favorites, history and continue watching).
- Active branch: `feat/flutter-download-tv-controls-67`.
- Active PR: #67 `Add native Flutter downloads through opaque media refs`.
- PR #67 pre-TV-controls head `91d12d0bd5e5ec29a8285c8456214c93ab07d43c` passed 11/12 protected workflows while Flutter foundation was still building; that evidence is superseded for merge purposes by the newer TV-controls head and must not be used to merge the final head.
- Flutter product version remains `1.0.1+1`; no GitHub Release is published until a release-worthy triplet is verified from one commit/version.
- Existing Web/PWA remains the GitHub Pages product root and has not been replaced by Flutter Web.

## Product boundary
Al-Qahtani remains fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is permitted only as part of the preserved original Basri source contract. Flutter consumes Al-Qahtani backend contracts only and must not scrape or expose upstream hosts, Worker/session material, or source URLs.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, Android TV NavigationRail, catalog/search and local `مكتبتي` surface.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access and opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, internal playback and native Download entry points.
- `flutter_app/lib/src/player_page.dart`: internal `video_player` player; persists progress but never persists media-proxy URLs; TV disables touch scrubbing and uses remote-first controls.
- `flutter_app/lib/src/player_controls.dart`: explicit focusable rewind/play/forward control row with TV autofocus on Play.
- `flutter_app/lib/src/library_store.dart`: local favorites/history/continue-watching store using SharedPreferences with bounded history.
- `flutter_app/lib/src/download_service.dart`: native atomic downloader that accepts only `/api/cinema/media?...&download=1`, writes `.part` then renames, and sanitizes trusted filenames.
- `flutter_app/test/download_service_test.dart`: regression coverage for opaque-only references, explicit Download semantics, filename sanitization, non-empty artifacts and partial-file cleanup.
- `flutter_app/test/player_controls_test.dart`: Android TV focus regression for Play autofocus and left/right D-Pad traversal.

## This run
1. Inspected GitHub actual state and confirmed PR #67 is the only open PR and remains mergeable.
2. Verified PR #67 head `91d12d0...` had 11/12 protected workflows successful; only Flutter foundation remained in progress. Analyze/tests had already passed while Mobile APK, TV APK and iOS UNSIGNED were still building.
3. Did not merge that stale head because the TV player still depended on touch scrubbing and lacked explicit remote-focus regression coverage.
4. Continued on the same PR/branch only, preserving the one-PR rule.
5. Added `PlayerControls` with explicit focus nodes and TV autofocus on the play/pause action.
6. Disabled `VideoProgressIndicator` scrubbing for TV and retained 10-second rewind/forward actions as remote-safe seek controls.
7. Added a TV-specific user hint and autofocus on Retry when playback fails.
8. Added widget tests proving Play receives initial TV focus and left/right key traversal reaches Forward/Rewind; mobile does not steal autofocus.
9. GitHub Pages root was not modified or converted to Flutter Web.

## CI / deployment evidence
- PR #66 final-head Flutter foundation: `34680015055` success.
- PR #66 final-head Mobile WebKit: `34680015041` success.
- PR #66 final-head Remote movie playback: `34680015142` success.
- PR #66 final-head Content runtime: `34680015086` success.
- PR #66 final-head Web smoke: `34680015189` success.
- Main `25715a172...` GitHub Pages deployment: `34682248066` success; dynamic pages deployment `34682247653` success.
- Main `25715a172...` remote runtime v1: `34682248068` success; remote runtime: `34682248060` success; Web smoke: `34682248083` success; remote movie playback: `34682248090` success.
- PR #67 old head `91d12d0...`: Content runtime `34682334651`, Remote movie playback `34682334663`, Live provider `34682334625`, Remote CORS `34682334668`, Original player `34682334700`, Web smoke `34682334684`, CORS boundary `34682334670`, Media expiry `34682334673`, Trusted filename `34682334679`, Original Download `34682334699`, Mobile WebKit `34682334676` all succeeded. Flutter foundation `34682334672` was still building when the head was superseded.
- Final PR #67 head after TV controls/tests/docs must rerun and pass all required gates before merge.

## Artifact state
- Android Mobile APK: pipeline exists; version `1.0.1+1`; no release asset published in this run.
- Android TV APK: dedicated TV runtime + LEANBACK build path exists; remote-first player controls are now in PR #67; no release asset published in this run.
- iOS IPA UNSIGNED: no-codesign build path exists; no release asset published in this run.
- Release policy remains fail-closed: APK Mobile + APK TV + IPA UNSIGNED must all succeed from one release commit/version with integrity checks before publication.

## Current gaps / blockers
- Final PR #67 head must pass Flutter Mobile/TV/iOS builds and protected Web/backend regressions after the TV-controls commits.
- Player still needs runtime evidence for MP4/HLS and especially MPEG-TS on Android ExoPlayer and iOS AVPlayer.
- Back-focus restoration from Player to Details still needs an explicit widget/navigation regression.
- The current Download implementation stores files in application documents; user-visible export/share management is not yet implemented.
- PiP/AirPlay capability integration remains unimplemented and must use public APIs only.
- Render workspace identity remains ambiguous for direct dashboard-log inspection; external runtime/CI evidence is used rather than guessing.

## أهداف التشغيل التالي
1. **إغلاق PR #67 بأمان.**
   - فحص CI على الرأس النهائي الجديد فقط.
   - إصلاح أي failure على نفس الفرع.
   - الدمج فقط بعد خضرة جميع البوابات.
2. **تثبيت Download native.**
   - اختبار الملفات غير الفارغة والتنظيف الذري.
   - الحفاظ على opaque media refs فقط.
   - إضافة إدارة/تصدير للملفات دون كشف upstream URLs.
3. **إكمال Android TV Player.**
   - تثبيت D-Pad focus في CI.
   - اختبار Back وإعادة focus للتفاصيل.
   - إبقاء TV دون touch-only scrubbing.
4. **إثبات Player MP4/HLS.**
   - اختبار lifecycle والseek/progress.
   - الحفاظ على Range/206 عبر proxy.
   - عدم اختلاق duration.
5. **تثبيت MPEG-TS native behavior.**
   - فحص ExoPlayer وAVPlayer فعليًا.
   - fallback داخل Al-Qahtani فقط.
   - رسالة صادقة عند عدم الدعم.
6. **تحسين المكتبة المحلية.**
   - عرض الحلقة والموضع في Continue Watching.
   - اختبار حد 80 عنصرًا والتنظيف.
   - عدم تخزين media refs المنتهية.
7. **إضافة Player UX متقدم.**
   - playback speed حيث تدعم المنصة.
   - PiP/AirPlay عبر APIs عامة فقط.
   - رسائل أخطاء منقحة.
8. **تشديد Flutter API contracts.**
   - اختبارات mapping لـdetails/episodes/play/download.
   - رفض أي URL خارج العقود الموحدة.
   - الحفاظ على episode_id منفصلًا عن episode_number.
9. **حماية GitHub Pages في كل دمج.**
   - WebKit/CORS/Range/Download regressions.
   - عدم تحويل Pages إلى Flutter Web حاليًا.
   - فحص Pages لنفس merge commit.
10. **تجهيز Release triplet عند اكتمال tranche.**
   - رفع version/build للحزم الثلاث معًا.
   - APK Mobile + APK TV + IPA UNSIGNED من commit واحد.
   - SHA256SUMS/provenance وعدم نشر Release ناقص.
