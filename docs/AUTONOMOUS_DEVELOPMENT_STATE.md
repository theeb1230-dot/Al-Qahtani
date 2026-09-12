# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `973b0ea6eefa2f3809da16229868020a6f55520d` (merged PR #69: restore Android TV focus after player).
- Active PR: #72 `Add opaque news runtime and Flutter news section`.
- Active branch: `feat/flutter-news-runtime-70`.
- Code head before this documentation commit: `2c59341a4e286029d468ffac577474405f8433dc`.
- Flutter product version remains `1.0.1+1`; no GitHub Release yet because the current tranche is not declared release-ready.
- Existing Web/PWA remains the GitHub Pages product root and has not been replaced by Flutter Web.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes only Al-Qahtani contracts and must not expose upstream hosts, Worker/session material, source article URLs, media URLs, or source session data. `akwam.ss` remains permitted only as part of the inherited original Basri source contract.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30-item pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation and Android TV NavigationRail; PR #72 adds News as a native section.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access for matches/category/search/details/media and PR #72 opaque news contracts.
- `flutter_app/lib/src/news_page.dart`: Arabic native news list/article UX with loading, empty, retry and refresh states.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, playback, native Download and route-return focus ownership.
- `flutter_app/lib/src/player_page.dart`: internal `video_player` playback, resume/progress, TV remote-safe controls and playback speed.
- `flutter_app/lib/src/player_controls.dart`: focusable rewind/play/forward plus speed menu.
- `flutter_app/lib/src/playback_policy.dart`: bounded supported playback speeds from 0.5x to 2x.
- `flutter_app/lib/src/route_focus_restorer.dart`: restores focus to the invoking Details control after Player route pop.
- `flutter_app/lib/src/download_service.dart`: opaque-only atomic native downloader.
- `flutter_app/lib/src/library_store.dart`: favorites/history/continue-watching without persisted media refs.

## PR #72 — opaque news runtime
This PR moves Flutter news behind Al-Qahtani instead of teaching the app about the inherited news Worker.

Implemented:
- `server/news-runtime.mjs` wraps the inherited Basri news source server-side only;
- `/api/v1/news` returns normalized `id/ref/title/date/description` without source article URLs;
- `/api/v1/news/article?ref=...` accepts only an opaque random server-issued reference and returns text fields/paragraphs;
- article references expire after 30 minutes and the server-side map is bounded to 1024 entries;
- source URLs are never returned to Flutter and are never accepted from the Flutter client;
- Flutter models/API mapping for News and NewsArticle;
- native Arabic RTL News navigation/list/article screens for Mobile and TV;
- Node regression proves serialized runtime envelopes do not leak source URLs and expired refs fail closed;
- Flutter API regression proves news requests target only the Al-Qahtani runtime host.

## Failures found and root fixes
- Initial PR #72 Flutter foundation run `34686226778`, job `103533566491`, passed `flutter analyze` but failed 1 of 24 tests because `http.Response(String)` attempted Latin-1 encoding for Arabic JSON fixture text. This was a test-fixture encoding defect, not application mapping behavior.
- Root fix commit `2c59341a4e286029d468ffac577474405f8433dc` replaced string response construction with `http.Response.bytes(utf8.encode(...))` and explicit `application/json; charset=utf-8` for Arabic fixtures.
- This documentation commit moves the PR head, so every required workflow must be evaluated again on the new exact head before merge.

## CI / deployment evidence
For the earlier PR #72 head `1bbc11377913833b5627a78f632a39b1a8211b62`:
- Content runtime `34686226758`: success, including the new news runtime regression.
- Web smoke `34686226756`: success.
- Remote movie playback `34686226749`: success.
- CORS boundary `34686226776`: success.
- Original Basri player `34686226763`: success.
- Trusted download filename `34686226788`: success.
- Remote CORS `34686226765`: success.
- Original Basri download `34686226746`: success.
- Media reference expiry `34686226787`: success.
- Live provider smoke `34686226805`: success.
- Mobile WebKit was still running when the failure was inspected.
- Flutter foundation `34686226778`: failed only in the UTF-8 Arabic mock fixture described above; analyze passed and the other build jobs were still running at inspection time.

Main `973b0ea6eefa2f3809da16229868020a6f55520d` deployment evidence before PR #72:
- GitHub Pages deploy `34685945935`: success for the exact main commit.
- Web smoke `34685945932`: success.
- CORS boundary `34685945926`: success.
- Original Basri download `34685945909`: success.

## Artifact / Release state
- Current version/build: `1.0.1+1`.
- APK Mobile: no PR #72 final-head artifact accepted yet; final-head build is mandatory.
- APK TV: no PR #72 final-head artifact accepted yet; LEANBACK/package/signature/focus checks remain mandatory.
- IPA UNSIGNED: no PR #72 final-head artifact accepted yet; Payload/bundle/version/no-codesign checks remain mandatory.
- Release: none. CI artifacts are not substitutes for GitHub Release assets, and no partial Release will be published.

## Current gaps / blockers
- PR #72 must reach a final exact head with all Flutter Mobile/TV/iOS and protected Web/backend workflows green.
- `/api/v1/news` and article runtime have regression coverage but are not yet proven on the deployed backend; post-merge remote evidence is required before calling Flutter News live-ready.
- News images are intentionally omitted from Flutter until a restricted Al-Qahtani image contract can avoid leaking arbitrary source URLs.
- Player still needs stronger runtime evidence for MP4/HLS and especially MPEG-TS on Android ExoPlayer and iOS AVPlayer.
- Download management/export/share and PiP/AirPlay remain unfinished.
- No release-worthy triplet has been declared; version remains `1.0.1+1`.

## أهداف التشغيل التالي
1. **إغلاق PR #72 بأمان.**
   - انتظار جميع checks على الرأس النهائي بعد تحديث هذه الوثيقة.
   - جلب logs لأي failure وإصلاح السبب على نفس الفرع فقط.
   - الدمج فقط بعد الخضرة الكاملة.
2. **إثبات News runtime بعد الدمج.**
   - اختبار `/api/v1/news` على backend المنشور.
   - اختبار article opaque ref وعدم تسرب source URL.
   - تسجيل عائق النشر بدل افتراض النجاح إن لم يتوفر الدليل.
3. **حماية Flutter News UX.**
   - اختبار loading/error/retry/refresh.
   - اختبار فتح الخبر والرجوع بالريموت على TV.
   - إبقاء الأخبار عربية RTL دون اعتماد مباشر على Worker.
4. **إضافة صور الأخبار بأمان.**
   - تصميم image ref أو proxy محدود بدل تمرير source URL.
   - allowlist/MIME/size/timeouts للصور.
   - fallback بصري محلي عند فشل الصورة.
5. **إثبات MP4/HLS داخل Flutter.**
   - اختبار initialize/play/seek/resume.
   - التحقق من Range/206 عبر Al-Qahtani media proxy.
   - عدم اختلاق duration.
6. **تثبيت MPEG-TS native behavior.**
   - فحص Android ExoPlayer.
   - فحص iOS AVPlayer.
   - أي fallback يبقى داخل Al-Qahtani فقط.
7. **تحسين Download والمكتبة.**
   - إضافة إدارة تنزيلات محلية/export-share آمن.
   - تحسين عرض الحلقة والموضع في Continue Watching.
   - عدم تخزين media refs المنتهية أو upstream URLs.
8. **تشديد Android TV UX.**
   - اختبار D-Pad للشريط والأخبار والتفاصيل والمشغل.
   - منع focus dead-ends بعد back/retry/player pop.
   - عدم الاعتماد على touch-only controls.
9. **حماية GitHub Pages والعقود الأمنية.**
   - إبقاء WebKit/CORS/Range/Download/SSRF regressions إلزامية.
   - عدم تحويل Pages إلى Flutter Web قبل parity كاملة.
   - فحص Pages على نفس merge commit بعد كل دمج.
10. **تجهيز Release triplet عند tranche مناسبة.**
   - رفع version/build للحزم الثلاث معًا عند تغييرات release-worthy.
   - APK Mobile + APK TV + IPA UNSIGNED من commit واحد مع SHA-256/provenance.
   - منع النشر إن غاب أي artifact أو فشل validation.
