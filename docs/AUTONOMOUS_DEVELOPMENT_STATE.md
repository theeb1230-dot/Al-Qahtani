# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots/videos are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Product/release commit: `65a34cd49f36a64e2af9ee865c19280c0b37df10`, merge of PR #93 `Persist interrupted downloads across app sessions`.
- PR #93 final head: `59702289000257e19b5cac6a34153a466aec86a9`; merged only after exact-final-head required checks were green.
- Branch used: `feat/native-background-downloads-parity-92`.
- Duplicate PR #94 was closed without merge to restore the one-PR rule. Its head `8591658c87e3240b8dc295df2ddecb22ef23edd5` had a failing Flutter foundation mobile/default test and a much noisier reformatting diff.
- No product PR is open at this snapshot.
- Product version/build: `1.0.21+21`; Runtime `PRODUCT_VERSION` is `1.0.21`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, or other Theeb providers were introduced.
- Official user-facing identity remains `القحطاني TV`: deep navy/black, metallic gold, circular Q/ق play mark, Arabic horizontal logo, matching app icon/splash, and gold-accented controls/cards.

## Root cause closed in v1.0.21
The resumable download path could reconnect inside one active download call, but once reconnect attempts were exhausted the `.part` file was deleted. A later retry or reopened screen therefore restarted from byte zero even when the Runtime correctly supported Range/206. The fix keeps a deterministic application-private partial file only for resumable transport failures, resumes from its exact byte count, validates `Content-Range` before append, restarts cleanly when a server ignores Range and returns 200, and still deletes the partial on explicit cancellation or invalid/stale range.

## Changed files in PR #93
- `flutter_app/lib/src/download_service.dart`
- `flutter_app/pubspec.yaml`
- `flutter_app/test/download_resume_persistence_test.dart`
- `flutter_app/test/download_service_test.dart`
- `server/content-runtime.mjs`

## v1.0.21 implemented scope
1. Added persistent application-private partial naming for retry/session resume without exposing provider/upstream material.
2. A later download call resumes from the existing partial byte count with `Range: bytes=<offset>-`.
3. `206` append is accepted only when `Content-Range` starts at the exact existing byte count.
4. Invalid resume ranges fail closed with `INVALID_RESUME_RANGE` and delete the stale partial.
5. If the server ignores Range and returns `200`, the transfer restarts cleanly rather than appending duplicate bytes.
6. Timeout/stall/network/HTTP 5xx/408/429/incomplete failures preserve a non-empty partial for a later retry; explicit cancellation and non-resumable integrity failures clean it up.
7. `.part` files remain excluded from the Downloads library and are never treated as completed downloads.
8. Added deterministic regressions proving 5/10 -> Range 5- -> 10/10 completion and stale-range deletion.
9. Bumped Flutter to `1.0.21+21` and Runtime to `1.0.21`.
10. Existing v1.0.20 native-first playback + internal WebView real-playback evidence, v1.0.19 download cancellation/Range integrity, match failover/scores/logos, Q-play identity, TV LEANBACK and unsigned iOS packaging remain protected.

## RELEASE VERIFIED v1.0.21
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.21`.
- Release ID: `387738883`.
- Target commit: `65a34cd49f36a64e2af9ee865c19280c0b37df10`.
- Published at: `2026-09-12T23:49:50Z`.
- `Al-Qahtani-Mobile-v1.0.21.apk`: 55,149,052 bytes; SHA-256 `8cf1d5012794eb824e2efd5140f6b0106c160dd789742350ddff406f45e84f78`.
- `Al-Qahtani-TV-v1.0.21.apk`: 55,149,164 bytes; SHA-256 `29d6ae5c699f23e1c22cb1d6b71dea0913bb799c96b1aec4545d29779c480fbf`.
- `Al-Qahtani-iOS-v1.0.21-UNSIGNED.ipa`: 7,780,929 bytes; SHA-256 `9b6f73c55e306b1cb8daf2e7a64e5118e9ddefac4c516d84428561573c183ea3`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `146e3c493a5e51621ef0cee71a0b1395cbbde9e7a4ddd5fd3d31d1fb651cf178`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `cd1b3e4fb94aa8ce2c2baab1689979674ae7b08aeef3898050c7998ea5ea180a`.
- Release workflow `34726411987`: SUCCESS. It verified the main-push source SHA, version, protected Web/runtime gates on the exact commit, downloaded exact-run Mobile/TV/iOS artifacts, staged checksums/provenance, created the GitHub Release, and re-read it to verify completeness.

## CI and Pages evidence
### PR #93 exact-final-head `59702289000257e19b5cac6a34153a466aec86a9`
- Flutter foundation `34724498117`: SUCCESS, including analyze/tests, Android Mobile APK, Android TV APK, and iOS UNSIGNED jobs.
- Original Basri download contract `34724498088`: SUCCESS.
- Independent download resolution `34724498092`: SUCCESS.
- Original Basri player contract `34724498112`: SUCCESS.
- CORS boundary `34724498110`: SUCCESS.
- Remote movie playback smoke `34724498134`: SUCCESS.
- Content runtime `34724498090`: SUCCESS.
- Remote CORS smoke `34724498089`: SUCCESS.
- Web smoke `34724498111`: SUCCESS.
- Media reference expiry `34724498083`: SUCCESS.
- Match runtime `34724498102`: SUCCESS.
- Trusted download filename `34724498116`: SUCCESS.
- Mobile WebKit smoke `34724498103`: SUCCESS.
- Live provider smoke `34724498107`: SUCCESS.

### Rejected duplicate PR #94 head `8591658c87e3240b8dc295df2ddecb22ef23edd5`
- Flutter foundation `34724508862`: FAILURE in `analyze-test` -> `Test mobile/default runtime`; Android Mobile, Android TV and iOS build jobs themselves succeeded.
- PR #94 was closed without merge because PR #93 carried the same intended feature with a smaller/cleaner diff and all required checks green.

### Main product commit `65a34cd49f36a64e2af9ee865c19280c0b37df10`
- Flutter foundation `34726156893`: SUCCESS. Analyze/mobile tests/TV tests, Android Mobile identity/signature, Android TV LEANBACK/features, and iOS unsigned/no-codesign verification all passed.
- Release Flutter triplet `34726411987`: SUCCESS and actual Release/assets were re-read after publication.
- The release gate's `Wait for protected Web and runtime gates on exact commit` step completed SUCCESS, so the release was not allowed to publish until the required Web/runtime/Pages-related protected checks for the same product SHA were green.
- GitHub Pages remains configured at `https://theeb1230-dot.github.io/Al-Qahtani/`; repository Homepage points to the same URL.

## P0/P1 status after v1.0.21
1. **Official identity `القحطاني TV`:** FIXED IN CODE / BUILD+ARTIFACT CI VERIFIED / PHYSICAL DEVICE VISUAL RECHECK PENDING.
2. **Native-first movie/episode playback:** code path and media classification remain protected; Fall 2: Deadpoint on an actual iPhone/Android is **NOT PHYSICAL-DEVICE VERIFIED**.
3. **Native→internal WebView fallback real playback evidence:** FIXED IN CODE / CI VERIFIED; actual phone playback is **NOT PHYSICAL-DEVICE VERIFIED**.
4. **Continue Watching/resume from internal WebView fallback:** FIXED IN CODE / regression covered / **NOT PHYSICAL-DEVICE VERIFIED**.
5. **External helper app:** intentionally NOT USED. No VLC/Safari/Intent fallback was introduced.
6. **Download progress/cancel/retry/Range completion/trusted filename:** FIXED IN CODE / CI+regression protected / **NOT PHYSICAL-DEVICE VERIFIED** on a complete real transfer.
7. **Persistent partial resume across later retry/session:** FIXED IN CODE / deterministic regression covered / **NOT PHYSICAL-DEVICE VERIFIED** across a real iOS/Android interruption.
8. **Downloads Library/file existence persistence:** code path exists; completed-file persistence after a real transfer remains **NOT PHYSICAL-DEVICE VERIFIED**.
9. **Match→Player Flutter/Web and bounded failover:** code/runtime path regression-protected / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.21.
10. **Incorrect/missing match scores / fake 0-0:** normalization prevents invented 0-0 for unknown ended score; changing live source score remains DEVICE RECHECK PENDING.
11. **Match logos/Saudi time:** regression/live contracts exist; physical-device visual recheck pending.
12. **Search posters/season-aware dedupe:** code/regressions protected; DEVICE VISUAL RECHECK PENDING.
13. **Technical RuntimeHome/home item:** removed from user navigation; device D-Pad/navigation recheck pending.
14. **Favorites:** regression baseline preserved; physical-device persistence/navigation recheck pending.
15. **Reacher season 4:** **NOT PHYSICAL-DEVICE VERIFIED**.
16. **Movies Details→Watch/Download variants:** contract/CI covered; device recheck pending.
17. **News parity/article/images/date/back:** contract baseline protected; device recheck pending.
18. **Web player lifecycle/iPhone Safari:** protected Web/WebKit/runtime smokes are green; real iPhone Safari playback remains **NOT PHYSICAL-DEVICE VERIFIED** in this automation environment.
19. **Four-surface E2E:** PARTIAL. Web deployment path and all three package builds/releases are verified; full physical-device behavior is not complete.

## Blockers and decisions
- This automation environment does not expose a physical iPhone, Android handset, or Android TV. Device-only playback/download/match assertions remain NOT VERIFIED rather than being falsely marked FIXED from CI.
- No repository permission blocker exists for development, CI, Pages, merge, or Releases in this run.
- Do not begin providers.js v2 merely to avoid the remaining device P0 evidence gap. Continue hardening P0 contracts and consume real user-device evidence when available.
- Cloudflare mirror remains deferred and must not be enabled without explicit infrastructure/permission evidence.

## Protected regressions
Protect iPhone Safari/Web playback, native→internal WebView playback evidence, bounded WebView startup timeout, WebView progress/resume semantics, Range/206 and total Content-Range handling, persistent/resumable/cancellable downloads with strict partial integrity/cleanup, Content-Range/Accept-Ranges, exact known-length completion, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, trusted filenames, News non-empty/opaque refs, match source extraction/failover/logos/Saudi time/score correctness, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no external playback Intents/deep-links, favorites persistence, TV D-Pad/focus + LEANBACK, official branding, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إثبات persistent download resume على جهاز فعلي.**
   - بدء تنزيل طويل على iPhone وAndroid وقطع الشبكة بعد تقدم ملموس.
   - إعادة المحاولة والتحقق أن Range يبدأ من حجم partial بدل الصفر.
   - التحقق من الحجم النهائي/EOF وإخفاء `.part` من المكتبة.
2. **إثبات Fall 2 على iPhone فعلي.**
   - تشغيل native-first وتوثيق هل يبدأ AVPlayer فعليًا.
   - عند الرفض، إثبات انتقال WebView الداخلي ووصول `playing` لا مجرد تحميل الصفحة.
   - اختبار seek/pause/resume/duration وعدم فتح Safari أو كشف upstream.
3. **إثبات playback parity على Android.**
   - اختبار MP4/HLS/MPEG-TS عبر native ثم WebView عند الحاجة.
   - التحقق من startup timeout/retry وContinue Watching بعد تشغيل حقيقي.
   - عدم تسجيل history عند فشل المحركين.
4. **إثبات Reacher الموسم الرابع end-to-end.**
   - Search→Details→Episodes مع `episode_id` مستقل عن `episode_number`.
   - تشغيل حلقة فعلية وقياس duration/seek.
   - تنزيل حلقة والتحقق من resume/cancel/retry.
5. **إثبات Match→Player حي.**
   - tap/click حتى `playing` فعلي لا metadata فقط.
   - اختبار failover بين الخوادم بمهلات bounded وعدم تعليق السيرفر الأول.
   - مقارنة Safari iPhone مع Flutter internal player عند توفر دليل جهاز.
6. **مراجعة score/logo/time live.**
   - مباراة منتهية بنتيجة غير صفرية ومباراة جارية متغيرة.
   - إبقاء score مجهولًا بدل 0-0 مختلق عند غياب المصدر.
   - فحص شعارات الفريقين وتوقيت السعودية والترتيب الصحيح.
7. **إعادة فحص البحث والهوية بصريًا.**
   - poster proxy والplaceholder عند الغياب الحقيقي فقط.
   - season-aware dedupe و30+30 pagination.
   - RTL/icon/splash/header والذهبي على Mobile/TV/iOS.
8. **إكمال Library lifecycle.**
   - Favorites persistence/navigation.
   - Continue Watching من native ومن WebView بعد تشغيل ناجح فقط.
   - History/completed state وDownloads Library بناءً على ملفات موجودة فعليًا.
9. **توسيع four-surface E2E.**
   - الحفاظ على Pages/WebKit/CORS/Range/Download smokes.
   - Android TV focus/D-Pad/LEANBACK ومسار المشغل.
   - same-version triplet وiOS UNSIGNED checks لكل تعديل منتج.
10. **الانتقال إلى providers.js v2 بعد إغلاق P0 بالدليل المناسب.**
   - health/retry/circuit-breaker/cache deterministic داخل Basri فقط.
   - الحفاظ على media-ref sweeper/rate limits/compression/Range/HLS semantics.
   - إبقاء Cloudflare mirror مؤجلًا حتى تتوفر بنية وصلاحيات مثبتة.
