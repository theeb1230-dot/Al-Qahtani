# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `d0742ccc1671185cfa6ff7d302ae623d5b9c4310` (merged PR #64: Flutter title details and episode normalization).
- PR #64 exact head `fe1ff567a12fe95b2abafb92ff2ba03c396dd231` passed all 12 protected pull-request workflow runs and was merged.
- GitHub Pages deployment for the merge commit passed: run `34674773818`.
- Active branch: `feat/flutter-internal-player-65`.
- Flutter product version remains `1.0.1+1`; no release is published until the functional tranche is release-worthy and the triplet is verified from one commit/version.
- Existing Web/PWA remains the GitHub Pages product root and is not replaced by Flutter Web.

## Product boundary
Al-Qahtani remains fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is allowed only as part of the preserved original Basri source contract. Flutter consumes Al-Qahtani backend contracts only and must not scrape or expose upstream hosts, Worker/session material, or source URLs.

## Protected Web behavior
Protected regressions remain iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, MPEG-TS/HLS handling, measured duration, real match logos, Saudi match times, separated episode display numbering, endless 30-item category pagination, explicit Download behavior, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-link handoff.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, dedicated Android TV NavigationRail, catalog/search navigation.
- `flutter_app/lib/src/app_target.dart`: Mobile/TV/iOS runtime target selection.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access, opaque detail/media reference mapping and playback resolution.
- `flutter_app/lib/src/models.dart`: catalog/matches plus normalized `TitleDetails` and `EpisodeItem` with explicit `episode_id` vs `episode_number` separation.
- `flutter_app/lib/src/details_page.dart`: title/details/episodes UI; episodes and direct movies now route only to the internal Player path.
- `flutter_app/lib/src/player_page.dart`: internal native player backed by Flutter `video_player`, using only Al-Qahtani media-proxy URLs.

## This run
1. Re-read GitHub actual state and found PR #64 as the only open PR.
2. Verified PR #64 exact head `fe1ff567a12fe95b2abafb92ff2ba03c396dd231` had 12/12 successful workflows, including Flutter foundation, Mobile WebKit, Content runtime, live provider, CORS, Range/movie playback, download and media-ref expiry.
3. Merged PR #64 to main as `d0742ccc1671185cfa6ff7d302ae623d5b9c4310`.
4. Verified GitHub Pages for the merge commit completed successfully (`34674773818`); no failure/queued/in-progress run was present in the latest exact-commit query.
5. Created `feat/flutter-internal-player-65` from the merge commit.
6. Added `video_player` to the Flutter client and introduced an internal Player page with play/pause, 10-second seek controls, progress scrubbing, retry and Arabic error/loading states.
7. Added `AlQahtaniApi.resolvePlayback(ref)`: episode/title refs are resolved by the Al-Qahtani details contract and must return an opaque `/api/cinema/media?...` path; arbitrary external URLs remain rejected by `mediaUri`.
8. Wired direct movies and playable episodes from Details into the internal Player; no external Intent, browser, WebView handoff or upstream URL is used.
9. Added API boundary tests proving opaque media resolution, arbitrary upstream rejection and fail-closed behavior for unavailable playback.
10. Kept the existing Web/PWA root untouched.

## CI / deployment evidence
- PR #64 exact-head Flutter foundation: `34672117777` success.
- PR #64 exact-head Mobile WebKit: `34672117802` success.
- PR #64 exact-head Remote movie playback: `34672117808` success.
- PR #64 exact-head Content runtime: `34672117783` success.
- PR #64 exact-head Live provider: `34672117798` success.
- Main GitHub Pages after merge: `34674773818` success.
- Main Web smoke after merge: `34674773769` success.
- Active internal-player branch requires fresh exact-head Flutter and protected Web/backend checks before merge.

## Artifact state
- Android Mobile APK: build pipeline exists; current version `1.0.1+1`; no new Release in this run.
- Android TV APK: dedicated TV runtime + LEANBACK build path exists; no new Release in this run.
- iOS IPA UNSIGNED: no-codesign build path exists and remains explicitly unsigned; no new Release in this run.
- Release policy remains fail-closed: do not publish until APK Mobile + APK TV + IPA UNSIGNED all succeed from the same release commit/version and pass integrity/identity checks.

## Current gaps / blockers
- Player is newly introduced and still needs CI/device evidence for MP4/HLS and especially direct MPEG-TS behavior on Android/iOS native backends.
- Player does not yet persist position/history/continue-watching.
- Download UI is not yet wired in Flutter, although backend opaque media download semantics remain protected.
- TV needs explicit D-Pad Player focus/controls tests, not merely successful TV compilation.
- PiP/AirPlay capability integration remains unimplemented and must use only public platform APIs.
- Render workspace identity remains ambiguous for direct dashboard-log inspection; external runtime/CI evidence is used instead of guessing.

## أهداف التشغيل التالي
1. **إغلاق PR المشغل الداخلي بأمان.**
   - فحص exact-head Flutter/Web checks.
   - إصلاح أي dependency/analyze/build failure على نفس الفرع.
   - الدمج فقط بعد الخضرة الكاملة.
2. **إثبات Player MP4/HLS.**
   - إضافة اختبارات lifecycle وحالات الخطأ.
   - تحقق من media-proxy URL فقط.
   - اختبار seek/progress دون مدة وهمية.
3. **تثبيت MPEG-TS native behavior.**
   - فحص Android ExoPlayer وiOS AVPlayer capability الفعلي.
   - إبقاء fallback داخل Al-Qahtani فقط.
   - عرض عدم الدعم بصدق عند الحاجة.
4. **تحسين Android TV Player.**
   - D-Pad focus لأزرار play/seek/retry.
   - Back يعيد المستخدم للتفاصيل.
   - عدم الاعتماد على touch-only scrubbing.
5. **إضافة Download في Flutter.**
   - استخدام `download=1` على opaque media path فقط.
   - عدم تخزين upstream URL.
   - حالات تقدم/نجاح/فشل واضحة.
6. **إضافة Favorites محلية.**
   - تخزين stable content refs فقط.
   - واجهة إضافة/إزالة واضحة.
   - schema قابل للترقية.
7. **إضافة History وContinue Watching.**
   - حفظ position/content ref دون media refs المنتهية.
   - استعادة آخر موضع بعد حل media ref جديد.
   - حد وتنظيف للسجل.
8. **إضافة Player UX متقدم.**
   - playback speed حيث تدعم المنصة.
   - PiP/AirPlay عبر APIs عامة فقط عند الإمكان.
   - رسائل أخطاء لا تسرب المصدر.
9. **حماية GitHub Pages في كل دمج.**
   - WebKit/CORS/Range/Download regressions.
   - عدم تحويل Pages إلى Flutter Web حاليًا.
   - فحص Pages لنفس merge commit.
10. **تجهيز Release triplet عند اكتمال tranche.**
   - رفع version/build للحزم الثلاث معًا.
   - APK Mobile + APK TV + IPA UNSIGNED من commit واحد.
   - SHA256SUMS/provenance وعدم نشر Release ناقص.
