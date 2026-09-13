# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with earlier reports. The preserved original `albasritv.github.io-main.zip`, live Al-Qahtani/Basri Runtime evidence, and the user's iPhone screenshots/videos remain behavioral references. CI alone does not prove physical-device playback/download behavior.

## Current state
- Product/release commit: `fa4414880638858b20bd329d1b50da68dc79bab8`, merge of PR #98 `Test DetailsPage download resume integration`.
- PR #98 final head: `26fb289232dac2b1071e133674c67abe54cbfc40`; branch `test/details-download-integration-98`.
- Product version/build: `1.0.25+25`; Runtime `PRODUCT_VERSION` is `1.0.25`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/`; Flutter Web did not replace it.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, helper app, VLC/Safari/Intent fallback, provider scraping, or upstream/provider URL exposure was introduced into Flutter.
- Official user-facing identity remains `القحطاني TV`: deep navy/black, metallic gold, circular Q/ق play mark, Arabic horizontal logo, matching icon/splash, RTL and gold-accented controls/cards.

## Root cause closed in v1.0.25
v1.0.22 introduced stable resumable download identities and v1.0.24 preserved those contracts, but the regression coverage still tested `buildDownloadResumeKey()` separately from the real `DetailsPage -> DownloadService.download()` call path. A future UI refactor could therefore omit or alter `resumeKey`, change the `download=1` media request, or accidentally couple the partial filename to a source ref while the isolated helper test continued to pass.

v1.0.25 closes that integration gap. `DetailsPage` now accepts an optional injected `DownloadService` for tests while retaining ownership and cleanup of the production-created service. Widget-level regressions press the actual direct-download and episode-download controls and verify the service receives the stable identities `movie-501:direct` and `series-88:episode:ep-9:9`, respectively. The tests also prove the service receives `/api/cinema/media?...&download=1` and that source refs are not used in the resume identity. Production download behavior is otherwise unchanged.

## Changed files in PR #98
- `flutter_app/lib/src/details_page.dart`
- `flutter_app/test/details_download_integration_test.dart`
- `flutter_app/pubspec.yaml`
- `server/content-runtime.mjs`

## RELEASE VERIFIED v1.0.25
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.25`.
- Release ID: `387787204`.
- Target commit: `fa4414880638858b20bd329d1b50da68dc79bab8`.
- Published at: `2026-09-13T04:01:59Z`.
- `Al-Qahtani-Mobile-v1.0.25.apk`: 55,149,052 bytes; SHA-256 `b1af2d9b0670f3c440947dffe6b397aefa2a135ec980d98a4d737bb474f06919`.
- `Al-Qahtani-TV-v1.0.25.apk`: 55,149,168 bytes; SHA-256 `7a415844b1f7b671da42f74f8bb90743aa2754e8fd4a451b749f4b22bd34fc36`.
- `Al-Qahtani-iOS-v1.0.25-UNSIGNED.ipa`: 7,781,688 bytes; SHA-256 `5a6b91d036bbfd59ad4691aa5ca80db1ab58ae8eba0d9caaf4b8dfc6dd843f6c`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `a471ca6a8a7cd733f9fb21b5ed136e139bc64be67e2cee6efa5d69972d125dc4`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `7621f1b2396204fa2acf6572b14b4931f2fcc802cb7b0fc127002b0aa2c929cc`.
- Release Flutter triplet run `34736910349`: SUCCESS on the exact product commit.

## CI / Pages evidence
### PR #98 exact-final-head `26fb289232dac2b1071e133674c67abe54cbfc40`
- Flutter foundation `34736422178`: SUCCESS. Analyze, the new DetailsPage download integration regressions, Android Mobile build/identity/signature, Android TV LEANBACK/features, and iOS UNSIGNED/no-codesign all succeeded.
- Contract `34736422347`: SUCCESS.
- Archive/download contract `34736422295`: SUCCESS.
- Provider E2E `34736422321`: SUCCESS.
- iPhone/WebKit `34736422264`: SUCCESS.
- Remaining required PR checks on the exact final head completed without failure before merge.
- PR merged only with `expected_head_sha=26fb289232dac2b1071e133674c67abe54cbfc40`.

### Main product commit `fa4414880638858b20bd329d1b50da68dc79bab8`
- Flutter foundation `34736676653`: SUCCESS; analyze/tests and all three package builds/validations succeeded on the exact product commit.
- GitHub Pages deployment `34736676119`: SUCCESS on the same product commit.
- Static Web smoke `34736676652`: SUCCESS.
- Archive/download contract `34736676725`: SUCCESS.
- Release Flutter triplet `34736910349`: SUCCESS and created/verified the real GitHub Release for the same SHA.
- GitHub Pages URL: `https://theeb1230-dot.github.io/Al-Qahtani/`.

## P0/P1 status after v1.0.25
1. **Official identity `القحطاني TV`:** FIXED IN CODE / BUILD+ARTIFACT CI VERIFIED / PHYSICAL DEVICE VISUAL RECHECK PENDING.
2. **Native-first movie/episode playback:** code/runtime path protected; Fall 2: Deadpoint on actual iPhone/Android is **NOT PHYSICAL-DEVICE VERIFIED**.
3. **Native→internal WebView fallback:** FIXED IN CODE / CI VERIFIED; real phone playback is **NOT PHYSICAL-DEVICE VERIFIED**.
4. **Continue Watching from internal WebView:** FIXED IN CODE / regression covered / **NOT PHYSICAL-DEVICE VERIFIED**.
5. **External helper app:** intentionally NOT USED.
6. **Download progress/cancel/retry/Range/content-length/trusted filename:** FIXED IN CODE / CI protected / **NOT PHYSICAL-DEVICE VERIFIED** on a complete real transfer.
7. **Persistent partial resume across retry/session and stable partial identity:** FIXED IN CODE / service regressions + real DetailsPage-to-DownloadService widget integration regression covered / **NOT PHYSICAL-DEVICE VERIFIED**.
8. **Downloads Library/file existence persistence:** code path exists; real completed-file persistence remains **NOT PHYSICAL-DEVICE VERIFIED**.
9. **Match→Player Flutter/Web + bounded failover:** code/runtime protected / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.25.
10. **Incorrect match score precedence:** FIXED IN CODE / CI VERIFIED IN RUNTIME + FLUTTER. Authoritative top-level score wins in both layers; explicit real 0-0 is preserved. A real changing live match remains **NOT PHYSICAL-DEVICE VERIFIED**.
11. **Match logos/Saudi time:** contract coverage exists; physical visual recheck pending.
12. **Search posters/season-aware dedupe:** code/regressions protected; DEVICE VISUAL RECHECK PENDING.
13. **Technical RuntimeHome/home item:** removed from user navigation; TV/mobile device navigation recheck pending.
14. **Favorites / Continue Watching / History / Downloads library:** regression baseline preserved; full real-device persistence lifecycle pending.
15. **Reacher season 4:** **NOT PHYSICAL-DEVICE VERIFIED**.
16. **Movies Details→Watch/Download:** contract/CI + DetailsPage download integration covered; device recheck pending.
17. **News parity:** baseline protected; device recheck pending.
18. **Web player lifecycle / iPhone Safari:** Web/WebKit/runtime smokes green; real iPhone Safari playback remains **NOT PHYSICAL-DEVICE VERIFIED** in this environment.
19. **Four-surface E2E:** PARTIAL. Pages and all three package artifacts/releases are verified; full physical-device behavior is not complete.

## Blockers and decisions
- The current environment exposes no physical iPhone, Android handset, or Android TV, so device-only playback/download/live-match assertions remain NOT VERIFIED rather than falsely marked fixed.
- No repository permission blocker exists for code changes, PRs, CI, Pages, merges, or Releases.
- Cloudflare mirror remains deferred pending explicit infrastructure/permission evidence.
- providers.js v2 / api-client.js health/retry/circuit-breaker/cache work remains behind remaining P0 evidence/hardening priorities and must stay inside Al-Qahtani/Basri boundaries.

## Protected regressions
Protect DetailsPage-to-DownloadService resume identity, no source-ref leakage into partial identity, `download=1`, authoritative-vs-placeholder match score precedence in both Runtime and Flutter, explicit real 0-0, live mutable scores, native→internal WebView playback evidence and timeout, Range/206/Content-Range/Accept-Ranges, stable resumable/cancellable partial identity and strict cleanup/integrity, exact known-length completion, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, independent Watch/Download resolution, trusted filenames, Match source discovery/failover/logos/Saudi time, `episode_id` vs `episode_number`, Search posters/season-aware dedupe, 30+30 infinite pagination with stale/concurrency guards, CORS/SSRF/allowlists, media-ref expiry/sweeper, no ads/popups/unneeded tracking, no external playback Intent/deep-links, Favorites/History/Downloads semantics, TV D-Pad/focus + LEANBACK, Arabic RTL branding, and iOS UNSIGNED/no-codesign labeling.

## أهداف التشغيل التالي
1. **إثبات score حي من المصدر إلى الواجهة.**
   - التقاط مباراة live ذات score متغير من Runtime.
   - مقارنة home/away والترتيب والحالة على Web وFlutter.
   - إبقاء أي نتيجة غير مثبتة NOT VERIFIED بدل hardcode.
2. **تعزيز تنزيل DetailsPage بعد إغلاق فجوة resume identity.**
   - إضافة regression لتصادم فيلمين بنفس العنوان لكن IDs مختلفة.
   - إضافة regression لحلقتين بنفس الرقم من مسلسلين مختلفين.
   - التحقق أن failed/cancelled attempts لا تسجل في Downloads Library.
3. **إثبات persistent resume على جهاز فعلي عند توفر دليل.**
   - قطع تنزيل طويل ثم إعادة المحاولة.
   - التحقق أن Range يبدأ من حجم `.part`.
   - تحقق EOF والحجم النهائي وعدم ظهور `.part` في المكتبة.
4. **إثبات Fall 2 على iPhone/Android.**
   - native-first start/duration/seek/pause/resume.
   - عند رفض native إثبات WebView `playing` الحقيقي.
   - منع Safari/VLC/Intent وكشف upstream.
5. **إثبات Reacher S4 end-to-end.**
   - Search→Details→Episodes مع episode_id مستقل.
   - تشغيل حلقة فعلية وقياس duration/seek.
   - تنزيل حلقة مع cancel/retry/resume.
6. **إثبات Match→Player حي.**
   - tap/click حتى playing فعلي.
   - bounded automatic server failover وserver switching.
   - فحص iframe/WebKit/CORS/mixed-content lifecycle.
7. **إعادة فحص Search والهوية.**
   - poster proxy/placeholder عند الغياب الحقيقي فقط.
   - season-aware dedupe و30+30 pagination.
   - RTL/icon/splash/header والذهبي على Mobile/TV/iOS.
8. **إكمال Library lifecycle.**
   - Favorites persistence/navigation.
   - Continue Watching بعد playback مثبت فقط.
   - Downloads/History من ملفات ومشاهدة فعلية لا محاولات فاشلة.
9. **توسيع four-surface E2E والحماية الخادمية.**
   - Pages/WebKit/CORS/Range/Download smokes.
   - TV focus/D-Pad/LEANBACK/player.
   - media-ref sweeper/rate-limit/compression/timeouts/cancellation دون كسر HLS/Range.
10. **providers.js v2 وapi-client.js بعد إغلاق P0 المناسب.**
   - health/retry/circuit-breaker/cache deterministic داخل Basri فقط.
   - اختبارات failure ordering/cancellation/cache freshness.
   - إبقاء Cloudflare mirror مؤجلًا حتى وجود بنية وصلاحيات مثبتة.
