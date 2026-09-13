# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with earlier reports. The preserved original `albasritv.github.io-main.zip`, live Al-Qahtani/Basri Runtime evidence, and the user's iPhone screenshots/videos remain behavioral references. CI alone does not prove physical-device playback/download behavior.

## Current state
- Product/release commit: `ffadbb434d384e5906b27865fc221b777b85f033`, merge of PR #97 `Fix Flutter match score contract parity`.
- PR #97 final head: `7b38378f037623fbd4785c5887beee9ae9b9d09d`; branch `fix/flutter-match-score-contract-97`.
- Product version/build: `1.0.24+24`; Runtime `PRODUCT_VERSION` is `1.0.24`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/`; Flutter Web did not replace it.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, helper app, VLC/Safari/Intent fallback, provider scraping, or upstream/provider URL exposure was introduced into Flutter.
- Official user-facing identity remains `القحطاني TV`: deep navy/black, metallic gold, circular Q/ق play mark, Arabic horizontal logo, matching icon/splash, RTL and gold-accented controls/cards.

## Root cause closed in v1.0.24
v1.0.23 fixed authoritative match-score precedence inside `server/content-runtime.mjs`, but Flutter's `MatchItem.fromJson` still preferred nested `team1.goals/team2.goals` over authoritative top-level `home_score/away_score`. That meant the app itself could undo the Runtime fix: a payload containing nested placeholder `0-0` together with authoritative `2-1` could still render as `0-0` in Flutter.

v1.0.24 aligns Flutter with the Runtime contract. Authoritative top-level score fields now win, nested team scores are fallback only, explicit authoritative `0-0` is preserved as legitimate, and ended nested-only `0-0` placeholders remain unknown rather than fabricated. Regressions cover authoritative 2-1 over nested placeholders, legitimate 0-0, ended placeholder-only 0-0, missing score, and live score progression from 1-0 to 1-1.

The first PR #97 CI pass also correctly caught version drift after the Flutter bump: `runtime_version_contract_test.mjs` reported Runtime `1.0.23` versus Flutter `1.0.24`. This was a real contract failure, not flaky CI, so `PRODUCT_VERSION` was updated to `1.0.24` before the final-head checks were rerun.

## Changed files in PR #97
- `flutter_app/lib/src/models.dart`
- `flutter_app/test/models_test.dart`
- `flutter_app/pubspec.yaml`
- `server/content-runtime.mjs`

## RELEASE VERIFIED v1.0.24
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.24`.
- Release ID: `387775770`.
- Target commit: `ffadbb434d384e5906b27865fc221b777b85f033`.
- Published at: `2026-09-13T03:00:18Z`.
- `Al-Qahtani-Mobile-v1.0.24.apk`: 55,149,052 bytes; SHA-256 `38ec594b1c76cbe4cc2ded10799fb6a4aaa5f330dc95169d97b80fd14da957a4`.
- `Al-Qahtani-TV-v1.0.24.apk`: 55,149,164 bytes; SHA-256 `d4358e00953188ecba4d8b2d09264d51bf5bafdda8ed6dce042b172165ddaeea`.
- `Al-Qahtani-iOS-v1.0.24-UNSIGNED.ipa`: 7,782,114 bytes; SHA-256 `fe2d807b53d7631d0f1796feb23796cb0cc3f3f1d076aedb6b7d031f9774034c`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `e715c543235de9a0b8be93e0417c34117ef8c24b97eab286c0b11765379a22e1`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `132b20a13bf7cc93e39417c6af5fbe9b60ddaa33ead878c18a0729b176315bd2`.
- Release Flutter triplet run `34734388184`: SUCCESS on the exact product commit.

## CI / Pages evidence
### PR #97 exact-final-head `7b38378f037623fbd4785c5887beee9ae9b9d09d`
- Flutter foundation `34733899809`: SUCCESS; analyze/tests, Android Mobile APK identity/signature, Android TV APK LEANBACK/features, and iOS UNSIGNED/no-codesign all succeeded.
- Content runtime `34733899848`: SUCCESS after fixing Runtime/Flutter product-version parity.
- Match runtime `34733899785`: SUCCESS.
- Web smoke `34733899870`: SUCCESS.
- Remote movie playback smoke `34733899856`: SUCCESS.
- Mobile WebKit smoke `34733899833`: SUCCESS.
- Original Basri player contract `34733899827`: SUCCESS.
- Original Basri download contract `34733899821`: SUCCESS.
- Independent download resolution `34733899781`: SUCCESS.
- CORS boundary `34733899828`: SUCCESS.
- Remote CORS smoke `34733899804`: SUCCESS.
- Media reference expiry `34733899835`: SUCCESS.
- Trusted download filename `34733899769`: SUCCESS.
- Live provider smoke `34733899866`: SUCCESS.
- PR merged only with `expected_head_sha` pinned to this exact final head.

### Main product commit `ffadbb434d384e5906b27865fc221b777b85f033`
- Flutter foundation `34734165856`: SUCCESS; analyze/tests and all three package builds/validations succeeded on the exact product commit.
- GitHub Pages build/deployment `34734165498`: SUCCESS on the same product commit.
- Original Basri player contract `34734165838`: SUCCESS.
- Original Basri download contract `34734165900`: SUCCESS.
- Release Flutter triplet `34734388184`: SUCCESS and created/verified the real GitHub Release for the same SHA.
- GitHub Pages URL: `https://theeb1230-dot.github.io/Al-Qahtani/`.

## P0/P1 status after v1.0.24
1. **Official identity `القحطاني TV`:** FIXED IN CODE / BUILD+ARTIFACT CI VERIFIED / PHYSICAL DEVICE VISUAL RECHECK PENDING.
2. **Native-first movie/episode playback:** code/runtime path protected; Fall 2: Deadpoint on actual iPhone/Android is **NOT PHYSICAL-DEVICE VERIFIED**.
3. **Native→internal WebView fallback:** FIXED IN CODE / CI VERIFIED; real phone playback is **NOT PHYSICAL-DEVICE VERIFIED**.
4. **Continue Watching from internal WebView:** FIXED IN CODE / regression covered / **NOT PHYSICAL-DEVICE VERIFIED**.
5. **External helper app:** intentionally NOT USED.
6. **Download progress/cancel/retry/Range/content-length/trusted filename:** FIXED IN CODE / CI protected / **NOT PHYSICAL-DEVICE VERIFIED** on a complete real transfer.
7. **Persistent partial resume across later retry/session and stable partial identity:** FIXED IN CODE / regressions covered / **NOT PHYSICAL-DEVICE VERIFIED**.
8. **Downloads Library/file existence persistence:** code path exists; real completed-file persistence remains **NOT PHYSICAL-DEVICE VERIFIED**.
9. **Match→Player Flutter/Web + bounded failover:** code/runtime protected / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.24.
10. **Incorrect match score precedence:** **FIXED IN CODE / CI VERIFIED IN RUNTIME + FLUTTER**. Authoritative top-level score now wins in both layers; explicit real 0-0 is preserved. A real changing live match remains **NOT PHYSICAL-DEVICE VERIFIED**.
11. **Match logos/Saudi time:** contract coverage exists; physical visual recheck pending.
12. **Search posters/season-aware dedupe:** code/regressions protected; DEVICE VISUAL RECHECK PENDING.
13. **Technical RuntimeHome/home item:** removed from user navigation; TV/mobile device navigation recheck pending.
14. **Favorites / Continue Watching / History / Downloads library:** regression baseline preserved; full real-device persistence lifecycle pending.
15. **Reacher season 4:** **NOT PHYSICAL-DEVICE VERIFIED**.
16. **Movies Details→Watch/Download:** contract/CI covered; device recheck pending.
17. **News parity:** baseline protected; device recheck pending.
18. **Web player lifecycle / iPhone Safari:** Web/WebKit/runtime smokes green; real iPhone Safari playback remains **NOT PHYSICAL-DEVICE VERIFIED** in this environment.
19. **Four-surface E2E:** PARTIAL. Pages and all three package artifacts/releases are verified; full physical-device behavior is not complete.

## Blockers and decisions
- The current environment exposes no physical iPhone, Android handset, or Android TV, so device-only playback/download/live-match assertions remain NOT VERIFIED rather than falsely marked fixed.
- No repository permission blocker exists for code changes, PRs, CI, Pages, merges, or Releases.
- Cloudflare mirror remains deferred pending explicit infrastructure/permission evidence.
- providers.js v2 / api-client.js health/retry/circuit-breaker/cache work remains behind remaining P0 evidence/hardening priorities and must stay inside Al-Qahtani/Basri boundaries.

## Protected regressions
Protect authoritative-vs-placeholder match score precedence in both Runtime and Flutter, explicit real 0-0, live mutable scores, native→internal WebView playback evidence and timeout, Range/206/Content-Range/Accept-Ranges, stable resumable/cancellable partial identity and strict cleanup/integrity, exact known-length completion, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, independent Watch/Download resolution, trusted filenames, Match source discovery/failover/logos/Saudi time, `episode_id` vs `episode_number`, Search posters/season-aware dedupe, 30+30 infinite pagination with stale/concurrency guards, CORS/SSRF/allowlists, media-ref expiry/sweeper, no ads/popups/unneeded tracking, no external playback Intent/deep-links, Favorites/History/Downloads semantics, TV D-Pad/focus + LEANBACK, Arabic RTL branding, and iOS UNSIGNED/no-codesign labeling.

## أهداف التشغيل التالي
1. **إثبات score حي من المصدر إلى الواجهة.**
   - التقاط مباراة live ذات score متغير من Runtime.
   - مقارنة home/away والترتيب والحالة على Web وFlutter.
   - إبقاء أي نتيجة غير مثبتة NOT VERIFIED بدل hardcode.
2. **تعزيز DetailsPage→DownloadService integration.**
   - إضافة widget/integration regression لهوية resume الفعلية.
   - اختبار same-title movies وmulti-episode collisions.
   - منع provider refs من partial names/logs.
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
