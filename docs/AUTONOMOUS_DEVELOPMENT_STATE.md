# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `ea85d4238cf0333779ebb33fbca5d7900111bb7a` (merged PR #70: Flutter local Download library management).
- Active branch: `feat/flutter-news-runtime-70`, reset onto the current main and rebuilt after a parallel-PR race.
- PR #72 `Add opaque news runtime and Flutter news section` was closed unmerged when main advanced, and is to be reopened on this rebased/reapplied branch rather than replaced by another PR.
- Code head before this documentation commit: `1aa380c7ec4b3c359c90fc730d3b685208d15345`.
- Flutter product version remains `1.0.1+1`; no GitHub Release has been published because the tranche is not yet declared release-ready.
- Existing Web/PWA remains the GitHub Pages product root and has not been replaced by Flutter Web.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes only Al-Qahtani contracts and must not expose upstream hosts, Worker/session material, source article URLs, media URLs, or source session data. `akwam.ss` remains permitted only as part of the inherited original Basri source contract.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, Android TV NavigationRail, native News section and `مكتبتي` integration.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access with opaque media and opaque News references.
- `flutter_app/lib/src/news_page.dart`: Arabic native News list/article UX with loading, error, empty, retry and refresh states.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, playback, native Download and route-return focus ownership.
- `flutter_app/lib/src/player_page.dart`: internal `video_player` playback, resume/progress, TV remote-safe controls and playback speed.
- `flutter_app/lib/src/download_service.dart`: opaque-only atomic native downloader plus safe local listing/deletion.
- `flutter_app/lib/src/download_library_section.dart`: local Download listing, refresh and deletion UI preserved from merged PR #70.
- `flutter_app/lib/src/library_store.dart`: favorites/history/continue-watching without persisted media refs.

## News runtime tranche
- `server/news-runtime.mjs` wraps the inherited Basri News Worker server-side only.
- `/api/v1/news` returns normalized `id/ref/title/date/description` without source article URLs.
- `/api/v1/news/article?ref=...` accepts only a random server-issued opaque reference and returns title/date/paragraphs.
- News refs expire after 30 minutes and the server-side ref map is bounded to 1024 entries.
- Flutter never submits or receives original article URLs, Worker URLs or source session data.
- `scripts/news_runtime_test.mjs` proves no source URL is serialized and expired refs fail closed.
- Flutter API tests use explicit UTF-8 JSON fixtures for Arabic text and verify requests remain on the Al-Qahtani runtime host.

## Concurrency race and recovery
1. This run started from actual main `973b0ea6eefa2f3809da16229868020a6f55520d` with no open PR after PR #69 had merged.
2. PR #72 was created for the News runtime and reached an exact head where all 12 protected workflows eventually passed.
3. While PR #72 CI was running, a separate parallel flow created and merged PR #70 from the same base, advancing main to `ea85d4238cf0333779ebb33fbca5d7900111bb7a`.
4. PR #72 was then closed unmerged and became stale; a merge attempt correctly failed closed rather than overwriting newer main work.
5. The News branch was force-reset to exact new main and the News changes were reapplied while preserving PR #70 Download library code and UI.
6. No new replacement PR is to be created; PR #72 is reopened on the recovered branch to return to the one-open-PR discipline.

## Earlier PR #72 CI evidence before recovery
Exact head `17e61cf735a82dca037eba5fc640a7439e524318` passed all protected workflows:
- Flutter foundation `34686340228`: success, including analyze/test, Android Mobile, Android TV and iOS UNSIGNED jobs.
- Content runtime `34686340176`: success.
- Web smoke `34686340188`: success.
- Mobile WebKit `34686340209`: success.
- Live provider `34686340177`: success.
- Remote movie playback `34686340204`: success.
- Remote CORS `34686340210`: success.
- CORS boundary `34686340216`: success.
- Original Basri player `34686340200`: success.
- Original Basri download `34686340189`: success.
- Trusted download filename `34686340197`: success.
- Media reference expiry `34686340190`: success.

A preceding Flutter run `34686226778`, job `103533566491`, failed only because a test mock attempted Latin-1 encoding of Arabic JSON. The root fix changed mock responses to UTF-8 bytes with `application/json; charset=utf-8`, after which the exact final head passed.

## Earlier PR #72 artifact evidence
All artifacts below came from exact head `17e61cf735a82dca037eba5fc640a7439e524318` and version/build `1.0.1+1`:
- Android Mobile APK artifact `10295567710`: 25,393,369 bytes; artifact digest SHA-256 `36b26c57cd079c7aafa92c9de93dd90fdca1f11da8c360630cbb5fbdeaed6029`.
- Android TV APK artifact `10295139382`: 25,393,549 bytes; artifact digest SHA-256 `ec260712c1c0a32b39ac112293e52ec811484f949cec0861a1595b2957a862dc`.
- iOS IPA UNSIGNED artifact `10294724701`: 7,420,515 bytes; artifact digest SHA-256 `5bd27498320767305bcf389bcbec99d8223afa908eca953762821e010994fa1c`.
- These are CI artifacts, not GitHub Release assets. The recovered final head must build its own triplet before merge.

## Current deployment / Release state
- Last verified GitHub Pages evidence before the race: main `973b0ea6...`, Pages run `34685945935` success.
- Current main is newer (`ea85d423...`) because PR #70 merged; Pages and protected main workflows must be checked on that actual commit rather than assuming the older evidence applies.
- Recovered PR #72 has not yet run its final exact-head CI after this documentation commit.
- Release: none. CI artifacts are not substitutes for GitHub Release assets and no partial Release will be published.

## Current gaps / blockers
- Recovered PR #72 must be reopened and pass every required workflow on the new exact final head built on top of PR #70.
- News runtime regression coverage exists, but deployed `/api/v1/news` and article opaque-ref behavior still need post-merge backend evidence.
- News images are intentionally omitted until a restricted Al-Qahtani image contract can avoid leaking arbitrary source URLs.
- Player still needs stronger real-device/runtime evidence for MP4/HLS and especially MPEG-TS on Android ExoPlayer and iOS AVPlayer.
- Download export/share and PiP/AirPlay remain unfinished.

## أهداف التشغيل التالي
1. **إغلاق PR #72 المستعاد بأمان.**
   - إعادة فتح PR #72 نفسه وعدم إنشاء PR بديل.
   - انتظار جميع checks على الرأس النهائي بعد هذه الوثيقة.
   - إصلاح أي failure على نفس الفرع ثم الدمج فقط بعد الخضرة الكاملة.
2. **إثبات عدم فقدان PR #70 أثناء الدمج.**
   - تشغيل Flutter tests التي تشمل Download library.
   - التأكد من بقاء `DownloadLibrarySection` داخل `مكتبتي`.
   - منع أي regression في list/refresh/delete والتنزيل الذري.
3. **إثبات News runtime بعد الدمج.**
   - اختبار `/api/v1/news` على backend المنشور.
   - اختبار `/api/v1/news/article` باستخدام opaque ref فقط.
   - التأكد من عدم ظهور Worker أو source article URL في الاستجابة.
4. **حماية Flutter News UX على Mobile وTV.**
   - اختبار loading/error/retry/refresh وفتح الخبر والرجوع.
   - اختبار D-Pad focus داخل قائمة الأخبار وعلى الرجوع.
   - إبقاء العربية وRTL دون touch-only dependency.
5. **إضافة صور الأخبار بعقد آمن لاحقًا.**
   - تصميم image ref أو proxy محدود بدل source URL.
   - تطبيق allowlist/MIME/size/timeouts.
   - fallback بصري محلي عند فشل الصورة.
6. **تعميق إثبات المشغل الأصلي.**
   - اختبار MP4/HLS initialize/play/seek/resume.
   - فحص MPEG-TS على Android ExoPlayer وiOS AVPlayer.
   - الحفاظ على Range/206 وعدم اختلاق duration.
7. **تحسين التنزيل والمكتبة.**
   - إضافة export/share آمن بواجهات عامة للمنصة.
   - تحسين Continue Watching والحلقة والموضع.
   - عدم تخزين media refs المنتهية أو upstream URLs.
8. **تشديد API والعزل الأمني.**
   - توسيع mapping tests لـdetails/episodes/play/download/news.
   - إبقاء episode_id منفصلًا عن episode_number.
   - رفض أي URL خارج العقود والـallowlists.
9. **حماية GitHub Pages في كل دمج.**
   - إبقاء WebKit/CORS/Range/Download/SSRF regressions إلزامية.
   - التحقق من Pages على نفس merge commit.
   - عدم تحويل Pages إلى Flutter Web قبل parity كاملة.
10. **تجهيز Release triplet عند tranche مناسبة.**
   - رفع version/build للحزم الثلاث معًا عند دفعة release-worthy.
   - إنشاء APK Mobile + APK TV + IPA UNSIGNED من commit واحد مع SHA-256/provenance.
   - منع النشر إن غاب أي artifact أو فشل validation.
