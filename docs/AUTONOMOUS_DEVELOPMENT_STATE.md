# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Current main: `61029a2ec6b39f08a3f4613dd231dafbe0bef0bf` (merged PR #79).
- Latest verified product release: `v1.0.8`, target `61029a2ec6b39f08a3f4613dd231dafbe0bef0bf`, version/build `1.0.8+8`.
- Active PR: #80 `Restore deployed news runtime and visible Flutter request states`.
- Active branch: `fix/media-content-type-79`.
- Reconciled code head before this documentation-only update: `50fe685313007bf5f78395dcc3b54f7221d4400f`.
- Active product version: `1.0.9+9`.
- PR #80 was rebuilt directly on current main so the merged MP4-first playback/download work from PR #79 is preserved.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.

## Four-surface policy
Every product-impacting merge is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. The three native packages must come from the same commit/version and appear together in a real GitHub Release with checksums/provenance. Actions artifacts alone never count as a release.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. `akwam.ss` is allowed only server-side as inherited Basri behavior. Flutter consumes Al-Qahtani Runtime/API only. Never expose raw upstream URLs, Worker/session material, or media source URLs in Flutter/UI/logs. Preserve SSRF allowlists, opaque media refs, CORS and Range semantics.

## RELEASE VERIFIED v1.0.8
- URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.8`.
- Target: `61029a2ec6b39f08a3f4613dd231dafbe0bef0bf`.
- `Al-Qahtani-Mobile-v1.0.8.apk`: 54,277,122 bytes; SHA-256 `dabc828678188a804f9e1bbe65e22748ef821ebdda11e75d37d9aa96f31cf769`.
- `Al-Qahtani-TV-v1.0.8.apk`: 54,277,234 bytes; SHA-256 `d0fb3f18f57966a34d5418d360284d0b2b81989d45105fdb082b29223208e9e5`.
- `Al-Qahtani-iOS-v1.0.8-UNSIGNED.ipa`: 7,460,252 bytes; SHA-256 `b9d9964b20a364c3e723c211ee6c9e6456e4ee3db0b0b3d7901c40cd6d1eccbb`; UNSIGNED/no-codesign and requires external signing/provisioning.
- `SHA256SUMS.txt` and `PROVENANCE.json` are present and non-empty.
- Historical `v1.0.5` remains RELEASE NOT PUBLISHED and must not be represented otherwise.

## Work in active PR #80
- Reconciled the branch onto released `v1.0.8` main without opening a second PR.
- Bumped Flutter to `1.0.9+9` so the next product-impacting merge cannot collide with already-published `v1.0.8`.
- `server/index.mjs` is the canonical testable production entry and preserves app routes, logo proxy, download decoration and opaque news routes.
- Root `package.json` explicitly declares `npm start -> node server/index.mjs`.
- `scripts/production_entry_test.mjs` protects production-entry routing and proves news list/article refs remain opaque.
- `scripts/remote_news_smoke.mjs` plus `.github/workflows/remote-news-smoke.yml` will prove the deployed news runtime after merge.
- Flutter search now has debounce, request generation/stale-response protection and explicit initial/loading/empty/error/retry states.
- Match status/time presentation localizes `live/scheduled/ended` and AM/PM strings.
- Episode/details UI no longer exposes implementation wording such as internal ID/proxy explanations.
- Existing main hardening remains intact: media-ref sweeper, API/media rate limiting, JSON gzip/deflate with correct `Vary`/`Content-Length` behavior.

## User screenshot/device issue matrix
1. Series playback / Reacher: **PARTIAL FIX / NOT DEVICE VERIFIED**. PR #79 now prefers MP4 when available; HLS-only lifecycle still requires end-to-end segment/key handling proof.
2. Episode download: **PARTIAL FIX / NOT DEVICE VERIFIED**. MP4-first avoids treating a playlist as a file when MP4 exists; HLS-only download semantics remain unresolved.
3. Movie Details→Watch/Download: **NOT VERIFIED** for the reported titles/classes; generic live movie smoke exists but does not prove all media variants.
4. Flutter News empty while Web has news: **FIX IN PR / NOT LIVE VERIFIED**. Production entry + opaque news smoke added; must pass on deployed main after merge.
5. Matches: **PARTIAL FIX / NOT DEVICE VERIFIED**. Status/time localization added; real logos, Saudi presentation and Match→Player remain open.
6. Search blank for Arabic/English: **FIX IN PR / NOT DEVICE VERIFIED**. Debounce/stale guard/loading/empty/error/retry are implemented; live/device queries still required.
7. Episode engineering text: **FIXED IN CODE / NOT DEVICE VERIFIED**.
8. Internal player valid source/start/seek/pause/resume/retry: **PARTIAL / NOT DEVICE VERIFIED**.
9. Favorites add/remove/persistence/navigation: **WORKING BASELINE / REGRESSION TESTS EXIST / DEVICE RECHECK PENDING**.
10. Continue Watching/history: **NOT VERIFIED** until a real playback session records progress.
11. Downloads library/progress/cancel/retry/file existence: **NOT VERIFIED** until a real download completes.
12. Technical Home screen: **OPEN**.
13. Arabic identity/RTL/typography consistency: **OPEN**.
14. Web news article/back/images/date/floating overlay: **PARTIAL BASELINE / OVERLAY INVESTIGATION OPEN**.
15. Safari Web Server 1 white/blank player: **OPEN / NOT VERIFIED**.
16. Explicit request states: **PARTIALLY FIXED** for search; remaining screens need audit.
17. Web↔Flutter Runtime normalization parity: **PARTIAL**; production-entry news regression exists, broader contract matrix pending.
18. Full four-surface E2E path matrix: **OPEN**.

## CI / release state for active PR
- The previous pre-reconcile PR #80 head `48c5a8acef310bda0a046582a135d821e66a3dec` had all PR workflows green, including Flutter foundation, Web smoke, Mobile WebKit, Content runtime, Live provider, Remote movie playback, Basri player/download, CORS and media-ref expiry.
- Those results are stale for merge because the branch was reconciled onto current main and version-bumped.
- Exact-final-head CI for the reconciled PR must be read again before merge.
- `v1.0.9`: **RELEASE NOT PUBLISHED** while PR #80 remains open. After merge, Pages/runtime/native gates must pass and a complete GitHub Release must be verified.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS classification, measured duration, opaque media refs, independent Watch/Download semantics, real match logos, Saudi match time, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no legacy Android Intent/deep-links, favorites persistence, TV D-Pad/focus, and UNSIGNED iOS labeling.

## أهداف التشغيل التالي
1. **إغلاق PR #80 بأمان.**
   - فحص exact-final-head CI بعد المصالحة.
   - إصلاح أي failure من logs على نفس الفرع فقط.
   - الدمج فقط إذا كان mergeable وجميع البوابات المطلوبة خضراء.
2. **إكمال v1.0.9 كإصدار فعلي.**
   - بناء Mobile APK + TV APK + IPA UNSIGNED من merge commit/version نفسه.
   - التحقق من الهوية والتوقيع وLEANBACK/Payload/no-codesign وSHA-256.
   - التحقق من Release tag/target/assets/sizes بعد الرفع؛ لا قبول artifact-only.
3. **إثبات News parity حيًا.**
   - تشغيل remote news list/article smoke على main المنشور.
   - مقارنة Runtime payload مع Flutter normalization والحالات المرئية.
   - حماية الصورة والتاريخ والرجوع وعدم تسريب upstream.
4. **إنهاء HLS-only playback من الجذر.**
   - تصميم proxy آمن للmanifest/segments/keys أو مسار native مثبت لا يكشف upstream.
   - اختبار relative/absolute URIs وredirects وRange عند الحاجة.
   - إثبات start/seek/resume على iOS وAndroid بدل first-byte فقط.
5. **فصل Watch وDownload semantics.**
   - اختيار downloadable file مستقل عن stream عند توفر الخيارين.
   - عدم اعتبار `.m3u8` تنزيل فيديو مكتملًا بلا packaging مثبت.
   - حماية progress/cancel/retry/persistence والاسم الموثوق.
6. **إكمال Search وrequest-state parity.**
   - اختبار «الذئب الوحيد» و`The Odyssey` وno-results حيًا.
   - اختبار الكتابة السريعة والإلغاء/stale-response.
   - تعميم loading/content/empty/retryable-error على الشاشات المتبقية.
7. **إكمال Matches وMatch→Player.**
   - عرض logos الحقيقية فقط عبر proxy المسموح.
   - ضبط توقيت السعودية وRTL وترتيب الفريقين.
   - إثبات المشغل بدل اعتبار metadata نجاحًا.
8. **تنظيف Home والهوية.**
   - استبدال الصفحة التقنية بأقسام محتوى عملية.
   - توحيد الاسم العربي وRTL والـtypography والمسافات.
   - إزالة أو تفسير أي overlay/gear عائم غير مقصود في Safari.
9. **حماية Library بعد نجاح media.**
   - favorites add/remove/persistence/navigation regression.
   - history/continue progress بعد تشغيل حقيقي فقط مع resume/completed semantics.
   - downloads list/file existence/delete/retry دون سجلات كاذبة.
10. **متابعة الخطة الهندسية والأربع نسخ.**
   - إبقاء hardening فعليًا وعدم كسر Range/HLS بالـrate limits أو compression.
   - بعد إغلاق دورة #80/v1.0.9 الانتقال إلى `providers.js` v2 و`api-client.js` health/retry/circuit-breaker/cache؛ Cloudflare mirror يبقى مؤجلًا.
   - تشغيل matrix للـWeb/PWA/Mobile/TV/iOS عبر Home/Matches/News/Search/Movies/Series/Details/Episodes/Watch/Download/Library/pagination/errors/degraded behavior.
