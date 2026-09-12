# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Current `main`: `4d1aded879cf40f2506bd53c4d86a7a8299b9e1f`.
- Exactly one product PR is open: PR #84 `Apply new Arabic identity and repair match playback`, branch `feat/identity-matches-playback-84`.
- PR #84 product head before this state-only commit: `1bc6146440171b46b072801c306317c3d56f4aaa`.
- Product version/build: `1.0.13+13`; Content Runtime version aligned to `1.0.13`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer/Theeb Engine/THEEB_SERVICE_TOKEN dependency was introduced.
- User-facing upstream URLs remain prohibited. PR #84 replaces match links/logos/media with short-lived opaque Runtime refs; a live smoke rejects `workers.dev` / logo-host leakage in Runtime payloads.

## RELEASE VERIFIED v1.0.12
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.12`.
- Target commit: `a0fceeead547a370f5c8a50243c008a99b3b6a86`.
- `Al-Qahtani-Mobile-v1.0.12.apk`: 54,342,654 bytes; SHA-256 `e05364b6b23ec65ca8cdc1b30af7f7795df7b5c19689256de0248af3fb716eb9`.
- `Al-Qahtani-TV-v1.0.12.apk`: 54,342,770 bytes; SHA-256 `778b69f1005c74704b40d2f8311791fab068444850b8b98585be93814819f9b8`.
- `Al-Qahtani-iOS-v1.0.12-UNSIGNED.ipa`: 7,463,582 bytes; SHA-256 `d3d643660a5123a15f83cf2f3b99224fa25d3dc48b05684ef5f1ec265bd4057d`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes.
- `PROVENANCE.json`: 580 bytes.
- Release Flutter triplet run `34711774581`: SUCCESS.
- Historical `v1.0.5` remains RELEASE NOT PUBLISHED and must not be represented otherwise.

## RELEASE NOT PUBLISHED v1.0.13
- PR #84 is still open; v1.0.13 has not been merged to main and therefore must not be represented as released.
- Final-head CI must be green after this state commit before merge.
- After merge, Mobile APK + TV APK + iOS UNSIGNED IPA must be built and verified from the same product commit/version, then an actual GitHub Release must be created and re-read before declaring RELEASE VERIFIED.

## PR #84: seven-problem batch
1. **New identity — IN PR / NOT DEVICE VERIFIED.** Flutter and Web now use Arabic `القحطاني` with a black/gold palette and a simplified gold `ق` brand mark. The technical English app-bar identity is removed. Platform launcher-icon/splash asset parity still requires final package inspection before calling the identity complete.
2. **Wrong match scores — FIX IN PR / CONTRACT REGRESSION ADDED / NOT DEVICE VERIFIED.** Missing scores stay `null` instead of becoming fake `0-0`; normalization accepts several Basri score-field shapes. Regressions cover ended `2-1`, live `3-2`, and ended-with-missing-score.
3. **Technical Home + Home nav item — FIX IN PR / NOT DEVICE VERIFIED.** `RuntimeHome` and `الرئيسية` are removed from mobile and TV navigation. Entry starts on Matches; News/Movies/Series/Search/Library remain.
4. **Download — FIX BASELINE IN v1.0.12 / FAILED ON DEVICE UNTIL PROVEN.** Watch and download resolution remain independent behind opaque refs. Contract regressions are retained; a real local file download with progress/cancel/retry/persistence still requires device proof.
5. **Series/movie playback — FIX BASELINE + PR INTEGRATION / FAILED ON DEVICE UNTIL PROVEN.** HLS child/key/init refs remain opaque; internal PlayerPage is retained. Reacher/iPhone must still prove start/seek/pause/resume/duration/retry.
6. **Search posters — FIX IN PR / NOT DEVICE VERIFIED.** Search renders poster cards instead of text-only rows, dedupes results, preserves year, and resolves Runtime-relative poster paths against the Al-Qahtani API. Upstream poster exposure remains subject to final Runtime payload audit.
7. **Match→Player — FIX IN PR / LIVE + DEVICE VERIFICATION PENDING.** Flutter no longer has empty `onTap`; Web no longer routes through the legacy `Web Server 1` intent/iframe path. A production Match Runtime issues opaque match/logo/media refs, resolves server-side candidates, rewrites HLS child refs, and proxies Range/video responses. Live smoke attempts an actual live match media fetch whenever a live match exists; no live match is an explicit SKIP, not a false pass.

## CI / failures handled on PR #84
- Earlier Flutter foundation failure on head `1f4fc0c...`: unused brand constant and invalid `const AppBar`; fixed on the same branch.
- Earlier Live provider failure on head `1f4fc0c...`: the new Runtime still leaked the original match-worker URL through the normalized `id`; fixed by replacing public match IDs with opaque/non-upstream identifiers.
- Earlier match logo regression used the legacy raw-logo URL contract and received 410 after opaque refs were introduced; smoke now consumes `/api/v1/matches` and its opaque `/api/matches/logo?id=...` ref.
- On product head `50382c09dd0f1175881825a82ca3edb2be08c245`, Remote CORS had already completed SUCCESS while the remaining jobs were queued/running when the next live-match smoke commit was added.
- The product head immediately before this state commit is `1bc6146440171b46b072801c306317c3d56f4aaa`; all required checks must be re-read on the state-commit head before merge.

## Earlier user/device issue matrix retained
1. Reacher season 4 playback: **FAILED ON DEVICE / FIXES IN CODE, RECHECK REQUIRED**.
2. Episode download: **FAILED ON DEVICE / v1.0.12 CONTRACT VERIFIED, DEVICE RECHECK REQUIRED**.
3. Movies Details→Watch/Download including The Beloved/Power Ballad class: **NOT DEVICE VERIFIED**.
4. Flutter News parity: **FIXED IN RUNTIME / DEVICE RECHECK PENDING**.
5. Matches logos/localization/scores/Match→Player: **FIX IN PR #84 / NOT DEVICE VERIFIED**.
6. Search Arabic/English state machine: **FIXED IN CODE; posters improved in PR #84 / NOT DEVICE VERIFIED**.
7. Episode engineering copy: **FIXED IN CODE / NOT DEVICE VERIFIED**.
8. Internal player controls and retry behavior: **PARTIAL / NOT DEVICE VERIFIED**.
9. Favorites add/remove/persistence/navigation: **WORKING BASELINE / REGRESSION PROTECTED / DEVICE RECHECK PENDING**.
10. Continue Watching/history semantics: **NOT VERIFIED** until successful real playback.
11. Downloads library/file existence/progress/cancel/retry: **NOT VERIFIED** until successful real download.
12. Technical Home: **FIX IN PR #84**.
13. Arabic identity/RTL/typography: **PARTIAL FIX IN PR #84; launcher/splash package parity NOT VERIFIED**.
14. Web News article/back/images/date/floating overlay: **PARTIAL / DEVICE REGRESSION PENDING**.
15. Safari white `Web Server 1` player: **LEGACY PATH REMOVED IN PR #84 / ACTUAL SAFARI PLAYBACK NOT VERIFIED**.
16. Loading/content/empty/retryable states: **PARTIAL**.
17. Web↔Flutter Runtime normalization parity: **PARTIAL; score/search/match contracts expanded in PR #84**.
18. Full four-surface E2E: **OPEN**.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, News non-empty/opaque refs, real match scores/logos/Saudi time/Arabic status, Match→Player opaque refs, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no legacy Android Intent/deep-links, favorites persistence, TV D-Pad/focus and LEANBACK, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إغلاق PR #84 بأمان.**
   - فحص كل CI على الرأس النهائي الفعلي بعد تحديث هذه الوثيقة.
   - جلب logs لأي failure وإصلاح السبب على نفس الفرع فقط.
   - عدم الدمج حتى تصبح البوابات المطلوبة خضراء على الرأس النهائي.
2. **إكمال هوية القحطاني عبر الحزم الأربع.**
   - فحص App Icon/Splash داخل Mobile APK وTV APK وIPA وليس Flutter UI فقط.
   - توحيد الأسود/الذهبي والاسم العربي على Web/Android/iOS/TV.
   - إضافة regression يمنع عودة `Al-Qahtani` كعنوان واجهة للمستخدم.
3. **إثبات Match→Player حيًا.**
   - تشغيل live smoke على مباراة حية عند توفرها والتحقق من opaque media + HLS/Range.
   - اختبار iPhone Safari بعد الدمج للتأكد من زوال المربع الأبيض/Web Server 1.
   - اختبار Flutter tap→internal player على iOS/Android وعدم اعتبار metadata نجاحًا.
4. **إثبات نتائج المباريات.**
   - مقارنة مباراة منتهية بنتيجة غير صفرية مع المصدر الحي دون ترميز عنوان بعينه.
   - إبقاء النتيجة مجهولة عند غياب score بدل `0-0` كاذبة.
   - التحقق من ترتيب الفريقين، الشعارات، السعودية، الحالة العربية وRTL.
5. **إثبات تشغيل Reacher والأفلام على الجهاز.**
   - Reacher HLS على iPhone: start/seek/pause/resume/duration/retry.
   - اختبار فيلم MP4 وفيلم HLS/MPEG-TS عبر نفس Runtime contract.
   - عدم فتح URL أو تطبيق خارجي عند الفشل.
6. **إثبات التنزيل المحلي.**
   - تنزيل حلقة لها ملف مستقل والتحقق من الاسم والحجم والملف الفعلي.
   - progress/cancel/retry/persistence وعدم تسجيل الفشل كتنزيل.
   - إبقاء HLS-only بلا ملف مستقل fail-closed.
7. **إكمال Search poster privacy/parity.**
   - تدقيق Runtime payload لمنع upstream poster URL من الوصول إلى Flutter إن وجد.
   - اختبار العربية والإنجليزية والكتابة السريعة والإلغاء والنتيجة الفارغة.
   - حماية dedupe مع تمييز المواسم الحقيقية.
8. **إكمال Library بعد نجاح الوسائط.**
   - تسجيل progress فقط بعد playback حقيقي.
   - Resume/completed/history semantics ومنع تلويث السجل بالفشل.
   - Downloads list يعكس الملفات الموجودة فعليًا فقط.
9. **استئناف providers.js v2 / api-client resilience بعد دورة الإصدار.**
   - health/retry/circuit-breaker/cache باختبارات deterministic.
   - الحفاظ على sweeper/rate limits/gzip/Vary/Content-Length وعدم كسر Range/HLS.
   - إبقاء Cloudflare mirror مؤجلًا حتى بنية وصلاحيات مثبتة داخل Al-Qahtani/Basri فقط.
10. **إتمام v1.0.13 ثم maintenance المستمر.**
   - بعد الدمج، بناء Mobile APK + TV APK + IPA UNSIGNED من نفس commit/version.
   - fail-closed verification ثم GitHub Release فعلي مع SHA256/provenance وإعادة قراءة الأصول.
   - التحقق من Pages/Web smoke/WebKit/CORS/Range/Download ثم متابعة الصيانة دون نقطة توقف نهائية.
