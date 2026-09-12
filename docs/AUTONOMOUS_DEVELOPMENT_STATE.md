# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Current main: `98eb7d36338bca34570ccb301407833d1f2c9231`; last product merge commit is `081b457c6ed903773f290fd2c3ace76583d2e1ac` from PR #82.
- One product PR is open: PR #83 `Resolve HLS downloads through independent Basri download media`, branch `fix/hls-independent-download`.
- Product version/build on PR #83: `1.0.12+12`.
- PR #83 product head before this state-only commit: `f165094da0940807b1fac751451e409ceb228124`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer/Theeb Engine/THEEB_SERVICE_TOKEN dependency was introduced.

## RELEASE VERIFIED v1.0.11
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.11`.
- Target commit: `081b457c6ed903773f290fd2c3ace76583d2e1ac`.
- `Al-Qahtani-Mobile-v1.0.11.apk`: 54,342,654 bytes; SHA-256 `cbf2b54ffd1cc7fdfb0eaeca877dc41c64d8224f7db9d9a30ff7d663219c6d7c`.
- `Al-Qahtani-TV-v1.0.11.apk`: 54,342,766 bytes; SHA-256 `d93150d19a5797b158af9653c768968ab86eaa620d1e4ea3cbe2dc36b8e4f51c`.
- `Al-Qahtani-iOS-v1.0.11-UNSIGNED.ipa`: 7,463,577 bytes; SHA-256 `bd01ceafa38b6380fffa4f9d6255308cc1b4e6c09dc5ea7498de44cd33660f08`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes.
- `PROVENANCE.json`: 580 bytes.
- Release workflow run `34706901217`: SUCCESS.
- Flutter foundation main run `34706634888`: SUCCESS.
- Historical `v1.0.5` remains RELEASE NOT PUBLISHED and must not be represented otherwise.

## RELEASE NOT PUBLISHED v1.0.12
- PR #83 is not merged yet; therefore no v1.0.12 GitHub Release is expected or claimed.
- The new independent-download regression `34709309649` passed on product head `f165094da0940807b1fac751451e409ceb228124`.
- On that same product head, Remote CORS `34709309603`, Content runtime `34709309594`, CORS boundary `34709309571`, Original Basri player `34709309554`, Original Basri download `34709309619`, Media reference expiry `34709309559`, Trusted download filename `34709309635`, HLS media proxy `34709309576`, Live provider `34709309601`, Remote movie playback `34709309562`, and Web smoke `34709309582` completed SUCCESS.
- Flutter foundation `34709309644` and Mobile WebKit `34709309602` were still in progress when this state snapshot was written. Because this documentation commit moves the PR head, exact-final-head CI must be rechecked before merge.

## PR #83 root fix: independent Watch/Download resolution
The episode parser already preserved Basri's original `watch[]` and `downloads[]` choices, but the Runtime only resolved `watch[]`. Flutter then appended `download=1` to the same opaque HLS watch media reference. That correctly failed closed after v1.0.11, but ignored a separate downloadable file when the original episode page exposed one.

PR #83 behavior:
- Resolve the playback stream from `watch[]` and the downloadable file from `downloads[]` independently, server-side.
- Follow the original `/download/...` page or redirect and inspect only allowlisted media candidates.
- Keep both targets inside one short-lived opaque Runtime media reference; Flutter/UI receives no upstream URL.
- `?download=1` selects the independent download target and its own referer when available; ordinary playback still selects the watch target.
- HLS-only content with no independent downloadable file remains fail-closed with `HLS_DOWNLOAD_REQUIRES_PACKAGING`; a playlist is never falsely recorded as a completed video download.
- Existing SSRF/host allowlists, Range/206 semantics, download filename sanitization, media-ref expiry and rate limiting remain in force.
- Permanent `Independent download resolution` CI proves that playback can remain HLS while download resolves to a distinct MP4 opaque target.

## User screenshot/device issue matrix
1. Series playback / Reacher: **FIX IN CODE + CONTRACT/WEBKIT VERIFIED / NOT PHYSICAL-DEVICE VERIFIED**. HLS manifest→variant/segment/key/init refs remain inside Runtime opaque proxy; a real iPhone playback session is still required before marking FIXED.
2. Episode download: **FIX IN PR #83 / CONTRACT VERIFIED / NOT LIVE-DEVICE VERIFIED**. Independent Basri download resolution now exists without exposing upstream; HLS-only items still fail closed rather than creating a false download. Requires final-head CI, merge, live deployment and physical-device download verification.
3. Movies Details→Watch/Download: **NOT DEVICE VERIFIED** for reported title classes such as The Beloved/Power Ballad. Generic Remote movie playback is green but is not proof for every title/media variant.
4. Flutter News empty while Web has news: **FIX IN RELEASE v1.0.10+ / LIVE CONTRACT VERIFIED / DEVICE RECHECK PENDING**.
5. Matches logos/localization/Match→Player: **PARTIAL / NOT DEVICE VERIFIED**. Metadata availability is not treated as player success.
6. Search blank Arabic/English: **FIXED IN CODE / NOT DEVICE VERIFIED**. Debounce, stale-response protection and explicit request states are retained.
7. Episode engineering text: **FIXED IN CODE / NOT DEVICE VERIFIED**. Internal episode_id/episode_number distinction remains hidden from user-facing copy.
8. Internal player start/seek/pause/resume/duration/error/retry: **PARTIAL / NOT DEVICE VERIFIED**. Source-chain defect addressed; interactive playback behavior still requires real device verification.
9. Favorites: **WORKING BASELINE / REGRESSION PROTECTED / DEVICE RECHECK PENDING**.
10. Continue Watching/history: **NOT VERIFIED** until successful real playback proves progress is only persisted after actual playback and resume/completed semantics are correct.
11. Downloads library/progress/cancel/retry/file existence: **NOT VERIFIED**. PR #83 fixes server-side independent download selection; local progress/cancel/retry/persistence still needs live/device proof.
12. Home screen technical copy/content UX: **OPEN**.
13. Arabic identity/RTL/typography consistency: **OPEN**.
14. Web News article/back/images/date/floating overlay: **PARTIAL**; list/article contract exists, image/overlay/device regression remains.
15. Safari Web Server 1 white/blank player: **OPEN / NOT DEVICE VERIFIED**; no physical Safari proof yet.
16. Explicit loading/content/empty/retryable states: **PARTIAL**; Search/News improved, remaining screens require audit.
17. Web↔Flutter Runtime normalization parity: **PARTIAL**; News, HLS, and independent download now have dedicated regressions, full feature matrix remains.
18. Full four-surface E2E path matrix: **OPEN**.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, News non-empty/opaque refs, match logos/Saudi time, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no legacy Android Intent/deep-links, favorites persistence, TV D-Pad/focus and LEANBACK, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إغلاق PR #83 بأمان وإتمام دورة v1.0.12.**
   - إعادة فحص كل CI على الرأس النهائي الفعلي بعد تحديث هذه الوثيقة.
   - إصلاح أي failure على نفس الفرع وعدم فتح PR آخر.
   - الدمج فقط بعد الخضرة ثم التحقق من GitHub Release الفعلي والحزم الثلاث.
2. **إثبات Download semantics حيًا وعلى الجهاز.**
   - اختبار حلقة تعرض HLS للمشاهدة وملفًا مستقلًا للتنزيل.
   - التحقق من progress/cancel/retry/persistence/file existence والاسم الموثوق.
   - إبقاء HLS-only بلا ملف مستقل fail-closed دون سجل تنزيل كاذب.
3. **إثبات تشغيل HLS على أجهزة حقيقية.**
   - اختبار Reacher ومسلسل HLS آخر على iPhone.
   - التحقق من start/seek/pause/resume/duration/retry دون كشف upstream.
   - إعادة الاختبار على Android مع نفس Runtime contract.
4. **إصلاح فئات الأفلام المبلغ عنها.**
   - تتبع Details→Watch→Media وDetails→Download→Media لعناوين متعددة لا عنوان واحد.
   - تصنيف MP4/HLS/MPEG-TS وredirects بصورة موحدة.
   - إضافة live/contract regression للفئة التي كانت تفشل.
5. **إكمال Matches وMatch→Player.**
   - تمرير الشعارات الحقيقية عبر proxy/allowlist آمن.
   - ضبط توقيت السعودية والحالة العربية وRTL وترتيب الفريقين.
   - إثبات تشغيل المباراة فعليًا وعدم اعتبار metadata نجاحًا.
6. **إصلاح Safari Web player lifecycle.**
   - اختبار iframe/source switching/loading timeout/failure UI على iPhone Safari.
   - مراجعة CORS/mixed-content/player lifecycle للمساحة البيضاء وWeb Server 1.
   - حماية fallback/retry بلا overlay أو source leakage.
7. **إكمال Library بعد نجاح الوسائط.**
   - progress يبدأ فقط بعد playback حقيقي ويتحدث دوريًا.
   - Resume/completed/history semantics مع منع تلويث السجل بالفشل.
   - Downloads list يعكس الملفات الموجودة فعليًا فقط.
8. **تنظيف Home والهوية وحالات الواجهة.**
   - نقل النصوص الهندسية إلى About/Diagnostics إن لزم.
   - توحيد الاسم العربي وRTL والـtypography والمسافات.
   - تعميم loading/content/empty/retryable-error مع cancellation/stale guard.
9. **بدء providers.js v2 وapi-client resiliency بعد بوابات الوسائط.**
   - health/retry/circuit-breaker/cache باختبارات deterministic.
   - الحفاظ على sweeper/rate limits/gzip/Vary/Content-Length وعدم كسر Range/HLS.
   - إبقاء Cloudflare mirror مؤجلًا حتى بنية وصلاحيات مثبتة داخل Al-Qahtani/Basri فقط.
10. **توسيع four-surface E2E والانضباط الإصدارى.**
   - Home/Matches/News/Search/Movies/Series/Details/Episodes/Watch/Download/Library/pagination/error paths.
   - TV D-Pad/focus/LEANBACK وiOS no-codesign والتحقق من Pages بعد كل product merge.
   - عدم اعتبار أي دورة مكتملة إلا بعد GitHub Release فعلي موثّق بالحزم الثلاث وSHA/provenance.
