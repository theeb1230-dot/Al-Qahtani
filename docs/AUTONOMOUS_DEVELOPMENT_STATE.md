# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `25715a172d71a3e8f5811bfba712ca2ad9d76dce` (merged PR #66: Flutter local favorites, history and continue watching).
- Active branch: `feat/flutter-download-tv-controls-67`.
- Active PR: to be opened for native Flutter Download and TV-safe controls tranche.
- Flutter product version remains `1.0.1+1`; no GitHub Release is published until a release-worthy triplet is verified from one commit/version.
- Existing Web/PWA remains the GitHub Pages product root and has not been replaced by Flutter Web.

## Product boundary
Al-Qahtani remains fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is permitted only as part of the preserved original Basri source contract. Flutter consumes Al-Qahtani backend contracts only and must not scrape or expose upstream hosts, Worker/session material, or source URLs.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, Android TV NavigationRail, catalog/search and local `مكتبتي` surface.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access and opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, internal playback and new native Download entry points.
- `flutter_app/lib/src/player_page.dart`: internal `video_player` player; periodically persists position/duration but never persists media-proxy URLs.
- `flutter_app/lib/src/library_store.dart`: local favorites/history/continue-watching store using SharedPreferences with bounded history.
- `flutter_app/lib/src/download_service.dart`: native atomic downloader that accepts only `/api/cinema/media?...&download=1`, writes `.part` then renames, and sanitizes trusted filenames.
- `flutter_app/test/download_service_test.dart`: regression coverage for opaque-only references, explicit Download semantics, filename sanitization, non-empty artifacts and partial-file cleanup.

## This run
1. Inspected GitHub actual state and found PR #66 as the only open PR.
2. Verified exact head `717ca80bd363dce73b0ca4268e7740e638895c23` passed all 12 required workflows, including Flutter foundation, Mobile WebKit, Remote movie playback, Content runtime, CORS, media expiry and Download contracts.
3. Merged PR #66 to main as `25715a172d71a3e8f5811bfba712ca2ad9d76dce`.
4. Created `feat/flutter-download-tv-controls-67` from that exact merge commit.
5. Added `path_provider` and a native DownloadService that never accepts arbitrary upstream URLs and requires the existing Al-Qahtani media proxy with explicit `download=1` semantics.
6. Downloads are atomic and fail closed: zero-byte responses are rejected and partial `.part` files are removed on failure.
7. Details pages now expose Download for direct movies and per-episode Download after resolving a fresh opaque media reference; no short-lived media reference is persisted.
8. Added regression tests for boundary rejection, trusted download semantics, filename sanitization, non-empty output and cleanup.
9. GitHub Pages root was not modified or converted to Flutter Web.

## CI / deployment evidence
- PR #66 final-head Flutter foundation: `34680015055` success.
- PR #66 final-head Mobile WebKit: `34680015041` success.
- PR #66 final-head Remote movie playback: `34680015142` success.
- PR #66 final-head Content runtime: `34680015086` success.
- PR #66 final-head Web smoke: `34680015189` success.
- PR #66 final-head CORS/media-expiry/download/original-player checks: all success on the same head.
- PR #67 CI: pending after PR creation.

## Artifact state
- Android Mobile APK: build pipeline exists; version `1.0.1+1`; no new release asset published in this run.
- Android TV APK: dedicated TV runtime + LEANBACK build path exists; no new release asset published in this run.
- iOS IPA UNSIGNED: no-codesign build path exists; no new release asset published in this run.
- Release policy remains fail-closed: APK Mobile + APK TV + IPA UNSIGNED must all succeed from one release commit/version with integrity checks before publication.

## Current gaps / blockers
- Native Download tranche must pass Flutter Mobile/TV/iOS builds and protected Web/backend regressions before merge.
- Player still needs runtime evidence for MP4/HLS and especially MPEG-TS on Android ExoPlayer and iOS AVPlayer.
- Android TV Player needs explicit D-Pad focus/control widget tests and back-focus restoration.
- The current Download implementation stores files in application documents; user-visible export/share management is not yet implemented.
- PiP/AirPlay capability integration remains unimplemented and must use public APIs only.
- Render workspace identity remains ambiguous for direct dashboard-log inspection; external runtime/CI evidence is used rather than guessing.

## أهداف التشغيل التالي
1. **إغلاق PR #67 بأمان.**
   - تشغيل Flutter analyze/tests والبناء الثلاثي.
   - إصلاح أي failure على نفس الفرع فقط.
   - الدمج فقط بعد خضرة exact head.
2. **تثبيت Download native.**
   - اختبار الملفات غير الفارغة والتنظيف الذري.
   - الحفاظ على opaque media refs فقط.
   - إضافة إدارة/تصدير للملفات دون كشف upstream URLs.
3. **تحسين Android TV Player.**
   - D-Pad focus واضح لأزرار التشغيل والseek/retry.
   - Back يعيد focus للتفاصيل.
   - منع الاعتماد على touch-only scrubbing.
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
