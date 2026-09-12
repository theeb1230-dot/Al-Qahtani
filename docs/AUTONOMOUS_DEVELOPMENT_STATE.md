# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `df1b5c074caf173bfcb030131160749887696538` (merged PR #65: Flutter internal player with opaque media playback).
- Active branch: `feat/flutter-local-library-66`.
- Active PR: to be opened for the local library tranche.
- Flutter product version remains `1.0.1+1`; no GitHub Release is published until a release-worthy triplet is verified from one commit/version.
- Existing Web/PWA remains the GitHub Pages product root and has not been replaced by Flutter Web.

## Product boundary
Al-Qahtani remains fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is permitted only as part of the preserved original Basri source contract. Flutter consumes Al-Qahtani backend contracts only and must not scrape or expose upstream hosts, Worker/session material, or source URLs.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, Android TV NavigationRail, catalog/search plus new local `مكتبتي` surface.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access and opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites toggle, routes playback with stable content metadata only.
- `flutter_app/lib/src/player_page.dart`: internal `video_player` player; periodically persists position/duration but never persists media-proxy URLs.
- `flutter_app/lib/src/library_store.dart`: local favorites/history/continue-watching store using SharedPreferences with bounded history.
- `flutter_app/test/library_store_test.dart`: regression tests for favorite persistence, episode-separated progress and completed-item filtering.

## This run
1. Inspected GitHub actual state and found PR #65 as the only open PR.
2. Verified exact head `4911dad894e3f158656a7e2dd576f80ee2026120` passed all 12 required workflows, including Flutter foundation, Mobile WebKit, Remote movie playback, Content runtime, CORS, media expiry and Download contracts.
3. Merged PR #65 to main as `df1b5c074caf173bfcb030131160749887696538`.
4. Created `feat/flutter-local-library-66` from that exact merge commit.
5. Added local Favorites, History and Continue Watching using stable content refs only; no short-lived media ref is persisted.
6. Added resume-position restoration per content/episode and a bounded 80-entry history.
7. Added a Mobile/TV `مكتبتي` navigation destination and favorite toggle in Details.
8. Added SharedPreferences-backed tests. CI for this new branch will be the merge gate.
9. GitHub Pages root was not modified or converted to Flutter Web.

## CI / deployment evidence
- PR #65 final-head Flutter foundation: `34677329987` success.
- PR #65 final-head Mobile WebKit: `34677330053` success.
- PR #65 final-head Remote movie playback: `34677329993` success.
- PR #65 final-head Content runtime: `34677329959` success.
- PR #65 final-head Web smoke: `34677329972` success.
- PR #65 final-head CORS/media-expiry/download/original-player checks: all success on the same head.
- PR #66 CI: pending after PR creation.

## Artifact state
- Android Mobile APK: build pipeline exists; version `1.0.1+1`; no release asset published in this run.
- Android TV APK: dedicated TV runtime + LEANBACK build path exists; no release asset published in this run.
- iOS IPA UNSIGNED: no-codesign build path exists; no release asset published in this run.
- Release policy remains fail-closed: APK Mobile + APK TV + IPA UNSIGNED must all succeed from one release commit/version with integrity checks before publication.

## Current gaps / blockers
- Local-library tranche must pass Flutter Mobile/TV/iOS builds and protected Web/backend regressions before merge.
- Player still needs runtime evidence for MP4/HLS and especially MPEG-TS on Android ExoPlayer and iOS AVPlayer.
- Flutter Download UI is not yet wired.
- TV Player needs explicit D-Pad focus/control widget tests.
- PiP/AirPlay capability integration remains unimplemented and must use public APIs only.
- Render workspace identity remains ambiguous for direct dashboard-log inspection; external runtime/CI evidence is used rather than guessing.

## أهداف التشغيل التالي
1. **إغلاق PR #66 بأمان.**
   - تشغيل Flutter analyze/tests والبناء الثلاثي.
   - معالجة أي failure على نفس الفرع فقط.
   - الدمج فقط بعد خضرة exact head.
2. **تثبيت المفضلة والسجل.**
   - اختبار persistence بعد إعادة إنشاء store.
   - اختبار حدود السجل والتنظيف.
   - ضمان عدم تخزين media refs أو upstream URLs.
3. **تحسين Continue Watching.**
   - إظهار الحلقة والموضع بوضوح.
   - استعادة الموضع بعد حل media ref جديد.
   - إزالة العناصر المكتملة تلقائيًا من قائمة الاستكمال.
4. **إثبات Player MP4/HLS.**
   - اختبار lifecycle والseek/progress.
   - الحفاظ على opaque media proxy فقط.
   - عدم اختلاق duration.
5. **تثبيت MPEG-TS native behavior.**
   - فحص ExoPlayer وAVPlayer فعليًا.
   - fallback داخل Al-Qahtani فقط.
   - رسالة صادقة عند عدم الدعم.
6. **إضافة Download في Flutter.**
   - استخدام download semantics الحالية عبر opaque media path.
   - منع أي upstream URL في الواجهة أو logs.
   - حالات نجاح/فشل واضحة.
7. **تحسين Android TV Player.**
   - D-Pad focus لأزرار التشغيل والseek/retry.
   - Back يعيد focus للتفاصيل.
   - عدم الاعتماد على touch-only scrubbing.
8. **إضافة Player UX متقدم.**
   - playback speed حيث تدعم المنصة.
   - PiP/AirPlay عبر APIs عامة فقط.
   - رسائل أخطاء منقحة.
9. **حماية GitHub Pages في كل دمج.**
   - WebKit/CORS/Range/Download regressions.
   - عدم تحويل Pages إلى Flutter Web حاليًا.
   - فحص Pages لنفس merge commit.
10. **تجهيز Release triplet عند اكتمال tranche.**
   - رفع version/build للحزم الثلاث معًا.
   - APK Mobile + APK TV + IPA UNSIGNED من commit واحد.
   - SHA256SUMS/provenance وعدم نشر Release ناقص.
