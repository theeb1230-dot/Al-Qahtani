# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main after this run: `518e3d3c049bbf1fd0493a725da7a3a105738d71` (merged PR #63).
- PR #63 exact head `810ffd33ef9a88dceecf0df00a5b029e57bcc755` passed all 12 protected workflow runs and was merged.
- Active branch: `feat/flutter-details-episodes-64`.
- Active head before PR creation: `5381e4ac735112365d2b75ffc3fcfac60a488042` plus this state commit.
- Flutter product version remains `1.0.1+1` until a release-worthy functional tranche is complete.
- Web/PWA remains preserved at the existing GitHub Pages root and is not replaced by Flutter Web.

## Product boundary
Al-Qahtani is fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is allowed only as part of the preserved original Basri source contract. Flutter consumes Al-Qahtani backend contracts only and does not scrape upstreams or expose Workers/session material.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode display numbering, endless 30-item category pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, dedicated Android TV NavigationRail, catalog/search navigation.
- `flutter_app/lib/src/app_target.dart`: Mobile/TV/iOS runtime target selection.
- `flutter_app/lib/src/api_client.dart`: backend-only API client; this phase adds opaque details/media reference mapping.
- `flutter_app/lib/src/models.dart`: catalog/matches plus normalized `TitleDetails` and `EpisodeItem` with explicit `episode_id` vs `episode_number` separation.
- `flutter_app/lib/src/details_page.dart`: new title/details/episodes UI with Arabic loading/error/empty states and no upstream URL rendering.

## This run
1. PR #63 was verified exact-head green across Flutter foundation, Mobile WebKit, live provider, Range/media, CORS, download and Basri contract workflows, then merged.
2. Created `feat/flutter-details-episodes-64` from the merge commit.
3. Added Flutter mapping for `/api/cinema/details` using the existing opaque catalog `ref` instead of exposing upstream addresses.
4. Added `EpisodeItem` with independent `id`, display `number`, opaque `ref`, and availability.
5. Added `TitleDetails` for poster/title/episodes/direct opaque media path/playback-unavailable state.
6. Added a Details page and wired both catalog cards and search results to it.
7. Direct media is deliberately not opened yet; Player remains the next gated phase so this PR cannot accidentally reintroduce external intents or raw upstream playback.
8. Added regression tests proving internal IDs such as `89517`/`101847` are not used as displayed episode numbers.

## CI / deployment evidence
- PR #63 exact-head workflow runs all completed successfully. Notable runs: Flutter foundation `34669490047`, Mobile WebKit `34669490096`, Remote movie playback `34669490115`, Content runtime `34669490074`, Live provider `34669490043`.
- A fresh exact-head matrix is required for the active details/episodes PR before merge.
- GitHub Pages must remain green after the next merge; the branch does not replace or modify the existing web root.

## Artifact state
- Android Mobile APK: build pipeline exists; no new Release in this run.
- Android TV APK: dedicated TV runtime merged with LEANBACK build path; no new Release in this run.
- iOS IPA UNSIGNED: no-codesign pipeline exists; no new Release in this run.
- Current release decision: fail-closed. Do not publish the triplet until Details/Episodes then Player/Download/storage reach a release-worthy tranche from one commit/version.

## Blockers / gaps
- Details currently uses the existing Al-Qahtani `/api/cinema/details` backend route; a fully versioned `/api/v1/title` facade can be added later without exposing upstreams.
- Episode selection is visible but not yet connected to Watch/Player.
- Native MP4/HLS/MPEG-TS playback is not yet implemented/proven in Flutter.
- Favorites/history/continue-watching storage is not implemented.
- Render workspace identity remains ambiguous for direct dashboard-log inspection; external runtime/CI evidence remains the safe source until resolved.

## أهداف التشغيل التالي
1. **إغلاق PR التفاصيل والحلقات بأمان.**
   - فحص exact-head Flutter/Web checks.
   - إصلاح أي analyze/test failure على نفس الفرع.
   - الدمج فقط بعد الخضرة الكاملة.
2. **اختبار التنقل إلى Details على Mobile وTV.**
   - Widget test لفتح بطاقة كتالوج.
   - D-Pad Select لفتح التفاصيل.
   - Back يعيد focus بصورة سليمة.
3. **تثبيت عقد episodes.**
   - اختبار عدة episode IDs كبيرة مقابل أرقام عرض صغيرة.
   - ترتيب الحلقات منطقيًا.
   - منع refs الفارغة من التشغيل.
4. **إنشاء Watch/Play facade.**
   - قبول opaque episode/title refs فقط.
   - إعادة media refs قصيرة العمر فقط.
   - عدم إرجاع upstream URLs أو session material.
5. **Player MP4/HLS.**
   - مشغل داخلي فقط.
   - حالات loading/error/retry عربية.
   - الحفاظ على Range semantics.
6. **MPEG-TS وiOS compatibility.**
   - اختيار strategy حسب container/API capability.
   - عدم ادعاء seek/duration غير موثوق.
   - regression على no-codesign iOS build.
7. **Download flow.**
   - استخدام `download=1` على opaque media ref فقط.
   - اسم ملف موثوق.
   - عدم تسجيل المصدر الحقيقي.
8. **التخزين المحلي.**
   - Favorites.
   - History/position.
   - Continue Watching دون حفظ media refs المنتهية.
9. **حماية GitHub Pages.**
   - WebKit/CORS/Range/Download regressions بعد كل دمج.
   - عدم تحويل Pages إلى Flutter Web الآن.
   - فحص النشر لنفس commit بعد الدمج.
10. **Release triplet عندما يصبح release-worthy.**
   - رفع version/build مرة واحدة للحزم الثلاث.
   - APK Mobile + APK TV + IPA UNSIGNED من commit واحد.
   - SHA256SUMS/provenance وفشل مغلق إن نقص أي أصل.
