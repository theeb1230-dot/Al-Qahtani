# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots/videos are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Product/release commit: `370b82f72b9ead91ce928d385d1be0ce76a1cda4`, merge of PR #92 `Require real playback evidence from internal WebView fallback`.
- PR #92 final head: `08ab2139548f7704f66c23b17ddc35579abcbed6`; merged only after exact-final-head gates were green.
- Branch used: `fix/web-fallback-playback-evidence-92`.
- No product PR is open at this snapshot. This document-only `[skip ci]` update sits on top of the product commit and does not change the released product.
- Product version/build: `1.0.20+20`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, or other Theeb providers were introduced.
- Official user-facing identity remains `القحطاني TV`: deep navy/black, metallic gold, circular Q/ق play mark, Arabic horizontal logo, matching app icon/splash, and gold-accented controls/cards.

## Root cause closed in v1.0.20
The internal WebView fallback had a false-success gap: Flutter reported that playback had switched to the internal web engine as soon as `Player.html` loaded, without proof that the `<video>` element had actually entered `playing`. Progress/history/resume were also recorded only from native `video_player`, so a successful WebView fallback could play without updating Continue Watching. There was no bounded WebView startup evidence timeout.

## Changed files in PR #92
- `flutter_app/lib/src/player_page.dart`
- `flutter_app/lib/src/web_playback_event.dart`
- `flutter_app/test/web_playback_event_test.dart`
- `flutter_app/pubspec.yaml`
- `server/content-runtime.mjs`

## v1.0.20 implemented scope
1. Added a safe Flutter WebView playback event parser accepting only `playing`, `progress`, `ended`, and `error` with sanitized timing values.
2. Injected an internal JavaScript bridge after `Player.html` loads; it watches the existing `<video>` element and reports playback evidence only, without source URLs or upstream/provider material.
3. Flutter no longer reports WebView fallback success merely because the page loaded. Success state is shown only after an actual `playing` event.
4. Added a bounded 25-second WebView startup timeout so a dead source cannot remain in an indefinite apparent-success/loading state.
5. Added WebView `progress` and `ended` handling into `LocalLibraryStore.recordProgress`, but only after actual playback evidence and nontrivial position.
6. Resume position >=5 seconds is applied inside the internal web player after metadata/duration is available when still before the media end.
7. WebView navigation remains restricted to the Al-Qahtani Pages/player host and Al-Qahtani Runtime host; no Safari/VLC/Intent external fallback was added.
8. Added regressions rejecting malformed or URL-bearing bridge messages and sanitizing invalid timing values.
9. Bumped Flutter to `1.0.20+20` and Runtime `PRODUCT_VERSION` to `1.0.20`.
10. Prior v1.0.19 fixes for resumable/cancellable downloads, match logos/scores/failover, trusted filenames, Range/206 semantics, Q-play identity, and four-surface packaging remain protected.

## RELEASE VERIFIED v1.0.20
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.20`.
- Release ID: `387728940`.
- Target commit: `370b82f72b9ead91ce928d385d1be0ce76a1cda4`.
- Published at: `2026-09-12T23:00:25Z`.
- `Al-Qahtani-Mobile-v1.0.20.apk`: 55,149,052 bytes; SHA-256 `e0586720a9047c8a4e3ba84849a491136fe76b9d9374936649943eed4fd747f5`.
- `Al-Qahtani-TV-v1.0.20.apk`: 55,149,168 bytes; SHA-256 `88266d541cccc1f15ed07093350978e98026c3981789f96a360f175bc494230d`.
- `Al-Qahtani-iOS-v1.0.20-UNSIGNED.ipa`: 7,780,470 bytes; SHA-256 `623c2efa4056da671a6e9154d9f8cc28473fdb35d4b298e15dd9e705ed616482`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes; SHA-256 `51659f70fb10b62660ecb2ecbe7a1fb74cfc69cf9e3a0022338e9491ecbc08a3`.
- `PROVENANCE.json`: 580 bytes; SHA-256 `2f577793e75acce241d6d2b7c669856f3c08f851c5b616b4c5ff855c2d5f7a95`.
- Release workflow final run `34724234626`: SUCCESS on the exact product commit. An earlier same-commit release workflow invocation was skipped while prerequisites were still incomplete; the final successful run created and verified the actual Release.

## CI and Pages evidence
### PR #92 exact-final-head `08ab2139548f7704f66c23b17ddc35579abcbed6`
- Flutter foundation `34723697298`: SUCCESS, including analyze/tests, Android Mobile APK, Android TV APK, and iOS UNSIGNED jobs.
- CORS boundary `34723697337`: SUCCESS.
- Match runtime `34723697381`: SUCCESS.
- Independent download resolution `34723697301`: SUCCESS.
- Trusted download filename `34723697345`: SUCCESS.
- Original Basri download contract `34723697300`: SUCCESS.
- Media reference expiry `34723697364`: SUCCESS.
- Remote CORS smoke `34723697412`: SUCCESS.
- Content runtime `34723697395`: SUCCESS.
- Web smoke `34723697353`: SUCCESS.
- Original Basri player contract `34723697350`: SUCCESS.
- Live provider smoke `34723697343`: SUCCESS.
- Mobile WebKit smoke `34723697361`: SUCCESS.
- Remote movie playback smoke `34723697351`: SUCCESS.

### Main product commit `370b82f72b9ead91ce928d385d1be0ce76a1cda4`
- Flutter foundation `34723964547`: SUCCESS. Android Mobile identity/signature, Android TV LEANBACK/features, and iOS unsigned/no-codesign verification all passed.
- Deploy GitHub Pages `34723964564`: SUCCESS on the same product commit.
- Dynamic Pages build/deployment `34723963951`: SUCCESS on the same product commit.
- Remote runtime smoke `34723964499`: SUCCESS.
- Content runtime `34723964558`: SUCCESS.
- Match runtime `34723964554`: SUCCESS.
- Trusted download filename `34723964497`: SUCCESS.
- Original Basri player contract `34723964501`: SUCCESS.
- Release Flutter triplet `34724234626`: SUCCESS and the actual GitHub Release/assets were re-read after publication.

## P0/P1 status after v1.0.20
1. **Official identity `القحطاني TV`:** FIXED IN CODE / BUILD+ARTIFACT CI VERIFIED / PHYSICAL DEVICE VISUAL RECHECK PENDING.
2. **Native-first movie/episode playback:** code path and media classification remain protected; Fall 2: Deadpoint on an actual iPhone/Android is **NOT PHYSICAL-DEVICE VERIFIED**.
3. **Native→internal WebView fallback real playback evidence:** FIXED IN CODE / CI VERIFIED; it now requires `playing` before reporting success, but actual phone playback is **NOT PHYSICAL-DEVICE VERIFIED**.
4. **Continue Watching/resume from internal WebView fallback:** FIXED IN CODE / deterministic regression coverage / **NOT PHYSICAL-DEVICE VERIFIED**.
5. **External helper app idea:** intentionally NOT USED. No VLC/Safari/Intent fallback was introduced.
6. **Download progress/cancel/resume/retry/Range completion/trusted filename/.part cleanup:** FIXED IN CODE / CI+regression protected / **NOT PHYSICAL-DEVICE VERIFIED** on a complete iPhone or Android transfer.
7. **Downloads Library/file existence persistence:** code path exists but real device persistence after full transfer remains **NOT PHYSICAL-DEVICE VERIFIED**.
8. **Match→Player Flutter/Web and bounded failover:** code/runtime path is regression-protected / **NOT PHYSICAL-DEVICE VERIFIED** after v1.0.20.
9. **Incorrect/missing match scores / fake 0-0:** normalization prevents invented 0-0 for unknown ended score; real live source quality and a changing live score remain DEVICE RECHECK PENDING.
10. **Match logos/Saudi time:** regression/live contracts exist; physical-device visual recheck pending.
11. **Search posters/season-aware dedupe:** code/regressions remain protected; DEVICE VISUAL RECHECK PENDING.
12. **Technical RuntimeHome/home item:** removed from user navigation in prior work; device D-Pad/navigation recheck pending.
13. **Favorites:** regression baseline preserved; physical-device persistence/navigation recheck pending.
14. **Reacher season 4:** **NOT PHYSICAL-DEVICE VERIFIED**.
15. **Movies Details→Watch/Download variants:** contract/CI covered; device recheck pending.
16. **News parity/article/images/date/back:** contract baseline protected; device recheck pending.
17. **Web player lifecycle/iPhone Safari:** Pages and protected smokes are green on the product commit; real iPhone Safari playback remains **NOT PHYSICAL-DEVICE VERIFIED** in this automation environment.
18. **Four-surface E2E:** PARTIAL. Web deployment and all three package builds/releases are verified; full physical-device behavior is not complete.

## Blockers and decisions
- This automation environment does not expose a physical iPhone, Android handset, or Android TV. Therefore device-only playback/download/match assertions remain NOT VERIFIED rather than being falsely marked FIXED from CI.
- No permission blocker exists for repository development, CI, Pages, or Releases in this run.
- Do not begin providers.js v2 merely to avoid the remaining device P0 evidence gap. Continue improving P0 contracts and consume real user-device evidence when available.
- Cloudflare mirror remains deferred and must not be enabled without explicit infrastructure/permission evidence.

## Protected regressions
Protect iPhone Safari/Web playback, native→internal WebView playback evidence, bounded WebView startup timeout, WebView progress/resume semantics, Range/206 and total Content-Range handling, resumable/cancellable downloads with `.part` cleanup, Content-Range/Accept-Ranges, exact known-length completion, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, trusted filenames, News non-empty/opaque refs, match source extraction/failover/logos/Saudi time/score correctness, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no external playback Intents/deep-links, favorites persistence, TV D-Pad/focus + LEANBACK, official branding, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إثبات Fall 2 على iPhone فعلي عند توفر دليل جهاز.**
   - تشغيل native-first وتوثيق هل يبدأ فعليًا.
   - إن رفض AVPlayer المصدر، إثبات انتقال WebView الداخلي ووصول `playing` لا مجرد تحميل الصفحة.
   - اختبار seek/pause/resume/duration وعدم فتح Safari أو كشف upstream.
2. **إثبات playback parity على Android.**
   - اختبار MP4/HLS/MPEG-TS عبر native أولًا ثم WebView عند الحاجة.
   - التحقق من startup timeout/retry وContinue Watching بعد تشغيل حقيقي.
   - فحص عدم تسجيل history عند فشل المحركين.
3. **إثبات Reacher الموسم الرابع end-to-end.**
   - Search→Details→Episodes مع episode_id مستقل عن episode_number.
   - تشغيل حلقة فعلية وقياس duration/seek.
   - اختبار مصدر HLS ثانٍ وchild/key/init proxy عند توفره.
4. **إثبات التنزيل على iOS وAndroid.**
   - تنزيل ملف حقيقي ومراقبة bytes/% ثم cancel وإعادة المحاولة.
   - التحقق من حذف `.part` عند الإلغاء والفشل ومن الحجم/EOF عند النجاح.
   - التحقق من persistence/file existence وDownloads Library بعد إعادة فتح التطبيق.
5. **إثبات Match→Player حي.**
   - tap/click من بطاقة المباراة حتى `playing` فعلي لا metadata فقط.
   - اختبار failover بين الخوادم بمهلات bounded وعدم تعليق السيرفر الأول.
   - مقارنة Safari iPhone مع Flutter internal player عند توفر دليل جهاز.
6. **مراجعة score/logo/time live.**
   - اختبار مباراة منتهية بنتيجة غير صفرية ومباراة جارية متغيرة.
   - إبقاء score مجهولًا بدل 0-0 مختلق عند غياب المصدر.
   - فحص شعارات الفريقين وتوقيت السعودية والترتيب الصحيح.
7. **إعادة فحص البحث والهوية بصريًا.**
   - التحقق من poster proxy والplaceholder عند الغياب الحقيقي فقط.
   - فحص season-aware dedupe و30+30 pagination.
   - مراجعة RTL/icon/splash/header والذهبي على Mobile/TV/iOS.
8. **إكمال Library lifecycle.**
   - Favorites persistence/navigation.
   - Continue Watching من native ومن WebView fallback بعد تشغيل ناجح فقط.
   - History/completed state وDownloads Library بناءً على ملفات موجودة فعليًا.
9. **توسيع four-surface E2E.**
   - الحفاظ على Pages smoke/WebKit/CORS/Range/Download.
   - إعادة فحص Android TV focus/D-Pad/LEANBACK ومسار المشغل.
   - الحفاظ على same-version triplet وiOS UNSIGNED checks لكل تعديل منتج.
10. **الانتقال إلى providers.js v2 بعد إغلاق P0 بالدليل المناسب.**
   - health/retry/circuit-breaker/cache باختبارات deterministic داخل Basri فقط.
   - الحفاظ على media-ref sweeper/rate limits/compression/Range/HLS semantics.
   - إبقاء Cloudflare mirror مؤجلًا حتى تتوفر بنية وصلاحيات مثبتة.
