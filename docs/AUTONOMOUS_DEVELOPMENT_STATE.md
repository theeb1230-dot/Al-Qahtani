# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Product merge commit: `081b457c6ed903773f290fd2c3ace76583d2e1ac` (merged PR #82).
- Product version/build: `1.0.11+11`.
- PR #82 `Proxy HLS child resources through opaque media refs`: MERGED after exact-final-head `ab93b72b693d7fb3205958d000609a056c364ca1` passed all required PR gates.
- No product PR remains open at completion of this product cycle.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer/Theeb Engine/THEEB_SERVICE_TOKEN dependency was introduced.
- Note: before PR #82, two accidental temporary files were created and immediately deleted on `main`; cleanup commit `6302b5ad93c8b08a90484dd833ab15b5906f5226` restored the product tree before the PR branch was created. No temporary helper/workflow remains in the merged product.

## RELEASE VERIFIED v1.0.11
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.11`.
- Target commit: `081b457c6ed903773f290fd2c3ace76583d2e1ac`.
- `Al-Qahtani-Mobile-v1.0.11.apk`: 54,342,654 bytes; SHA-256 `cbf2b54ffd1cc7fdfb0eaeca877dc41c64d8224f7db9d9a30ff7d663219c6d7c`.
- `Al-Qahtani-TV-v1.0.11.apk`: 54,342,766 bytes; SHA-256 `d93150d19a5797b158af9653c768968ab86eaa620d1e4ea3cbe2dc36b8e4f51c`.
- `Al-Qahtani-iOS-v1.0.11-UNSIGNED.ipa`: 7,463,577 bytes; SHA-256 `bd01ceafa38b6380fffa4f9d6255308cc1b4e6c09dc5ea7498de44cd33660f08`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes.
- `PROVENANCE.json`: 580 bytes.
- Release workflow run `34706901217`: SUCCESS, including exact-source checkout, protected gate wait, exact-run artifact download, staging/provenance, GitHub Release creation, and post-publication completeness verification.
- Flutter foundation main run `34706634888`: SUCCESS for analyze/tests, Mobile APK identity/signature, TV LEANBACK/package identity/signature, and iOS no-codesign packaging.
- Historical `v1.0.5` remains RELEASE NOT PUBLISHED and must not be represented otherwise.

## PR #82 root fix: HLS opaque media chain
The previous media proxy streamed `.m3u8` manifests unchanged. Relative/absolute segment, key, init-map, variant, and alternate-media URIs therefore escaped the Al-Qahtani opaque media boundary, a credible root cause for the iPhone symptom where an episode reached the internal player but failed during playback.

Merged behavior:
- HLS manifests are detected by MIME or `.m3u8` target.
- Each child URI is resolved server-side against the manifest URL, revalidated through the existing media SSRF/host allowlist, stored as a short-lived opaque media reference, then rewritten to `/api/cinema/media?id=...`.
- `EXT-X-KEY`, `EXT-X-MAP`, `EXT-X-MEDIA`, variant playlists, and ordinary segment URI lines are covered.
- Raw upstream media URLs remain out of Flutter/UI and are not returned in the rewritten manifest.
- Non-HLS media keeps Range/206/Content-Range/Accept-Ranges passthrough behavior.
- HLS `download=1` now fails closed with `HLS_DOWNLOAD_REQUIRES_PACKAGING` rather than pretending a playlist is a complete downloadable video.
- Manifest buffering is bounded to prevent unbounded memory use.
- New permanent CI workflow `HLS media proxy` runs the opaque-chain regression.

## Exact-final-head PR #82 CI evidence
On `ab93b72b693d7fb3205958d000609a056c364ca1` all required gates completed SUCCESS:
- HLS media proxy `34706377394`.
- Flutter foundation `34706377407`.
- Mobile WebKit smoke `34706377382`.
- Live provider smoke `34706377465`.
- Remote movie playback smoke `34706377395`.
- Web smoke `34706377411`.
- Content runtime `34706377412`.
- Original Basri player `34706377447`.
- Original Basri download `34706377385`.
- CORS boundary `34706377451`.
- Remote CORS `34706377423`.
- Media reference expiry `34706377419`.
- Trusted download filename `34706377400`.

## User screenshot/device issue matrix
1. Series playback / Reacher: **FIX IN CODE + CONTRACT/WEBKIT VERIFIED / NOT PHYSICAL-DEVICE VERIFIED**. HLS manifest→variant/segment/key/init refs now remain inside Runtime opaque proxy. A real iPhone playback session is still required before marking FIXED.
2. Episode download: **PARTIAL / HLS DOWNLOAD NOT FIXED**. MP4/file download semantics remain available and protected; HLS now fails closed until a real packaging or independent downloadable-file path is implemented.
3. Movies Details→Watch/Download: **NOT DEVICE VERIFIED** for reported title classes such as The Beloved/Power Ballad. Generic Remote movie playback is green but is not proof for every title/media variant.
4. Flutter News empty while Web has news: **FIX IN RELEASE v1.0.10+ / LIVE CONTRACT VERIFIED / DEVICE RECHECK PENDING**. Runtime HTML fallback and deployed non-empty News gate are retained in v1.0.11.
5. Matches logos/localization/Match→Player: **PARTIAL / NOT DEVICE VERIFIED**. Metadata availability is not treated as player success.
6. Search blank Arabic/English: **FIXED IN CODE / NOT DEVICE VERIFIED**. Debounce, stale-response protection and explicit request states are retained.
7. Episode engineering text: **FIXED IN CODE / NOT DEVICE VERIFIED**. Internal episode_id/episode_number distinction remains hidden from user-facing copy.
8. Internal player start/seek/pause/resume/duration/error/retry: **PARTIAL / NOT DEVICE VERIFIED**. Source-chain defect addressed; interactive playback behavior still requires real device verification.
9. Favorites: **WORKING BASELINE / REGRESSION PROTECTED / DEVICE RECHECK PENDING**.
10. Continue Watching/history: **NOT VERIFIED** until successful real playback proves progress is only persisted after actual playback and resume/completed semantics are correct.
11. Downloads library/progress/cancel/retry/file existence: **NOT VERIFIED**. Failed HLS attempts must not appear as completed downloads.
12. Home screen technical copy/content UX: **OPEN**.
13. Arabic identity/RTL/typography consistency: **OPEN**.
14. Web News article/back/images/date/floating overlay: **PARTIAL**; list/article contract exists, image/overlay/device regression remains.
15. Safari Web Server 1 white/blank player: **OPEN / NOT DEVICE VERIFIED**; HLS proxy change may affect it but no physical Safari proof yet.
16. Explicit loading/content/empty/retryable states: **PARTIAL**; Search/News improved, remaining screens require audit.
17. Web↔Flutter Runtime normalization parity: **PARTIAL**; News and HLS now have dedicated regressions, full feature matrix remains.
18. Full four-surface E2E path matrix: **OPEN**.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, News non-empty/opaque refs, match logos/Saudi time, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no legacy Android Intent/deep-links, favorites persistence, TV D-Pad/focus and LEANBACK, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إثبات تشغيل HLS على أجهزة حقيقية.**
   - اختبار Reacher ومسلسل HLS آخر على iPhone.
   - التحقق من start/seek/pause/resume/duration/retry دون كشف upstream.
   - إعادة الاختبار على Android مع نفس Runtime contract.
2. **إنهاء Download semantics من الجذر.**
   - البحث عن file/download resolution مستقل عن watch stream عند توفره.
   - إن كان HLS فقط، تصميم packaging آمن ومحدود أو رفض واضح دون سجل تنزيل كاذب.
   - اختبار progress/cancel/retry/persistence/file existence والاسم الموثوق.
3. **إصلاح فئات الأفلام المبلغ عنها.**
   - تتبع Details→Watch→Media وDetails→Download→Media لعناوين متعددة لا عنوان واحد.
   - تصنيف MP4/HLS/MPEG-TS وredirects بصورة موحدة.
   - إضافة live/contract regression للفئة التي كانت تفشل.
4. **إكمال Matches وMatch→Player.**
   - تمرير الشعارات الحقيقية عبر proxy/allowlist آمن.
   - ضبط توقيت السعودية والحالة العربية وRTL وترتيب الفريقين.
   - إثبات تشغيل المباراة فعليًا وعدم اعتبار metadata نجاحًا.
5. **إصلاح Safari Web player lifecycle.**
   - اختبار iframe/source switching/loading timeout/failure UI على iPhone Safari.
   - مراجعة CORS/mixed-content/player lifecycle للمساحة البيضاء وWeb Server 1.
   - حماية fallback/retry بلا overlay أو source leakage.
6. **إكمال Library بعد نجاح الوسائط.**
   - progress يبدأ فقط بعد playback حقيقي ويتحدث دوريًا.
   - Resume/completed/history semantics مع منع تلويث السجل بالفشل.
   - Downloads list يعكس الملفات الموجودة فعليًا فقط.
7. **تنظيف Home والهوية وحالات الواجهة.**
   - نقل النصوص الهندسية إلى About/Diagnostics إن لزم.
   - توحيد الاسم العربي وRTL والـtypography والمسافات.
   - تعميم loading/content/empty/retryable-error مع cancellation/stale guard.
8. **إكمال News parity المرئية.**
   - proxy آمن للصور دون كشف upstream.
   - حماية الرجوع والمقال والصورة والتاريخ والنص العربي.
   - فحص وإزالة أي floating overlay غير مقصود.
9. **بدء providers.js v2 وapi-client resiliency بعد بوابات الوسائط.**
   - health/retry/circuit-breaker/cache باختبارات deterministic.
   - الحفاظ على sweeper/rate limits/gzip/Vary/Content-Length وعدم كسر Range/HLS.
   - إبقاء Cloudflare mirror مؤجلًا حتى بنية وصلاحيات مثبتة داخل Al-Qahtani/Basri فقط.
10. **توسيع four-surface E2E والانضباط الإصدارى.**
   - Home/Matches/News/Search/Movies/Series/Details/Episodes/Watch/Download/Library/pagination/error paths.
   - TV D-Pad/focus/LEANBACK وiOS no-codesign والتحقق من Pages بعد كل product merge.
   - عدم اعتبار أي دورة مكتملة إلا بعد GitHub Release فعلي موثّق بالحزم الثلاث وSHA/provenance.
