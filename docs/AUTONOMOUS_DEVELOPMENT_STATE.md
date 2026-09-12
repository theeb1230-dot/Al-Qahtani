# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `c11147a6a65ae72726c6be261f5da874f3e24513` (`Hide cinema source URLs behind category IDs`).
- PR #60 merged after all 11 exact-head pull-request workflows passed. It moved browser category navigation to stable product IDs while keeping the Basri source URL mapping server-side.
- Active PR: #61 `Add resilient unified home runtime contract`.
- Branch: `feat/runtime-home-61`.
- Code head before this documentation commit: `2335ed8dd3b0a3d51a6e1c4d334ad9b217bd5cdd`.
- Target: Web/PWA `1.0.1`.
- Flutter remains blocked until Web/PWA 1.0.1 is proven live across every required release gate.

## Product boundary
Al-Qahtani is fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is allowed only as part of the preserved original Basri source contract. No Theeb fallback or cross-project runtime dependency is allowed.

## Protected live behavior
Real iPhone Safari testing has already proven playback across multiple movie/series/anime samples after the MPEG-TS/HLS path. Safari Range/206, MIME/magic container detection, opaque media references, explicit Download behavior, measured-duration logic, real match logos, Saudi match times, separated episode display numbering, and the current direct/worker Basri fallback chain remain protected regressions.

## 1.0.1 Phase 1 progress merged to main
- `server/content-runtime.mjs`: product version `1.0.1`, bounded TTL cache, provider-health/circuit primitives and normalization helpers.
- `server/content-runtime-service.mjs`: normalized matches/search/category service, bounded metadata cache and health accounting.
- additive runtime HTTP contracts currently merged: `/api/runtime/status`, `/api/v1/matches`, `/api/v1/search?q=...`, `/api/v1/category?ref=...&p=...`.
- deployed runtime contract smoke covers version, matches, Arabic/English search semantics, category, cache and sanitized health.
- endless movie/series category pagination: page 1 then page 2+ when the viewport reaches the tail, no fixed page count, stale-response rejection, concurrency guard and deduplication.
- category navigation now uses opaque IDs such as `series-foreign` and `movie-anime`; original `akwam.ss` category mappings remain backend-only except temporary server-side legacy compatibility.

## PR #61 — unified home runtime aggregation
Goal: create the next additive runtime layer for a modern 1.0.1 home screen without coupling the browser to Workers or original source URLs.

Implemented on the active branch:
- `contentRuntime.home()` aggregates matches plus four bounded catalog sections: foreign/Arabic series and foreign/Arabic movies;
- matches are capped to 12 items and each catalog section to 8 items;
- catalog section fan-out uses bounded concurrency of 2;
- one failed dependency returns a partial home envelope instead of collapsing the entire response;
- the result uses the existing normalized runtime items and existing short TTL caches rather than inventing a parallel cache;
- per-section cache evidence is preserved and already-cached category data is reused;
- no new upstream/source URL is exposed to the browser and no Theeb/akwam-indexer dependency is introduced.

### CI failures found and fixed on PR #61
1. Head `2fa7f3968635826e96dbd06e446e8ea5041257a9`, Content runtime run `34667052357`, job `103480973615` failed because the new test expected four fresh category fetches. The runtime correctly reused an already-cached `movie-arabic` page, so the test was wrong. The regression now explicitly requires that cache reuse.
2. Head `d16c41533ea262a91d9ad7a607b404690c615dca`, Content runtime run `34667109720`, job `103481143732` failed because the partial-failure fixture targeted nonexistent `section=34`; therefore no home section actually failed. The fixture now targets the real `series-arabic` source URL (`series?section=29`).
3. Head `2335ed8dd3b0a3d51a6e1c4d334ad9b217bd5cdd`, Content runtime run `34667142277`, job `103481239816` completed successfully, proving home aggregation, cache reuse, partial response behavior and concurrency bound.

## PR #61 current gate evidence before this documentation commit
For head `2335ed8dd3b0a3d51a6e1c4d334ad9b217bd5cdd`:
- Content runtime `34667142277`: success.
- Web smoke `34667142249`: success.
- CORS boundary `34667142315`: success.
- Trusted download filename `34667142295`: success.
- Original Basri player contract `34667142254`: success.
- Original Basri download contract `34667142251`: success.
- Remote CORS smoke `34667142275`: success.
- Media reference expiry `34667142282`: success.
- Mobile WebKit, Remote movie playback and Live provider smoke were still running when this state snapshot was written.
- this documentation commit moves the PR head, therefore a fresh exact-head green set is mandatory before merge.

## Render evidence / blocker
The connected Render account exposes two workspaces, `My Workspace` and `بيانات`. Repository evidence still does not prove which workspace owns Al-Qahtani. Do not guess direct Render logs. External deployed HTTP and GitHub Actions runtime evidence remain authoritative until workspace ownership is proven.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains intact.
- Runtime migration stays additive until live parity proves replacements safe.
- The browser must not become an arbitrary upstream fetcher.
- UI category navigation uses product IDs, not Basri category URLs.
- Source/media allowlists and SSRF/DNS/host protections stay mandatory.
- Upstream media URLs remain behind short-lived opaque references.
- Worker/session material remains server-side.
- Referer values remain ASCII/URL-safe.
- Metadata cache never caches video streams, media references, sessions or Download responses.
- Normal playback never inherits upstream attachment semantics; explicit Download keeps trusted attachment behavior.
- Ads/popups/unneeded tracking and legacy Android Intent/deep-link handoff remain prohibited.

## 1.0.1 readiness
Current readiness: **Phase 1 matches/search/category runtime + endless category UX + category IDs are merged; unified home service is in PR #61; NOT release ready.**

Still required before `1.0.1` can be called ready: close #61 with final-head green gates and deployed proof; expose and prove the home HTTP contract; unified title/episodes/play contracts; production health/circuit decisions; full mobile-first RTL UI; live matches UX; Player 2.0 history/favorites/continue-watching; unified search/library UX; installable PWA; diagnostics/observability; and the complete Safari/security/live release matrix.

## أهداف التشغيل التالي
1. **إغلاق PR #61 بأمان.**
   - انتظار جميع checks على الرأس النهائي بعد تحديث هذه الوثيقة.
   - جلب logs لأي failure وإصلاح السبب على نفس الفرع فقط.
   - الدمج فقط بعد نجاح كل البوابات المطلوبة.
2. **إثبات PR #61 بعد الدمج.**
   - انتظار GitHub Pages وbackend evidence لنفس main commit قدر ما تسمح الأدوات.
   - تشغيل regressions الحالية للمباريات والسينما وSafari للتأكد أن aggregation لم يكسر المسارات القديمة.
   - تسجيل أي عائق نشر خارجي بدل افتراض نجاحه.
3. **تعريض عقد Home عبر HTTP بشكل additive.**
   - إضافة `/api/v1/home` إلى `server/app.mjs`.
   - إضافة route regression يثبت `kind=home`, partial semantics و`Cache-Control: no-store`.
   - إضافة deployed smoke للعقد بعد دمجه.
4. **إنشاء عقد title/details موحد.**
   - استخدام opaque refs بدل upstream URLs في الواجهة.
   - تطبيع poster/title/type/year والحقول المتاحة فقط.
   - إبقاء `/api/cinema/details` كمسار توافق حتى تثبت النسخة الجديدة حيًا.
5. **إنشاء عقد episodes موحد.**
   - فصل `episode_id` عن `episode_number` صراحة.
   - الحفاظ على ordering والموسم إن توفر وعدم عرض IDs الداخلية كأرقام حلقات.
   - توسيع regression على الفئات الست للمسلسلات.
6. **إنشاء عقد play موحد وآمن.**
   - الإبقاء على media refs opaque وقصيرة العمر.
   - تصنيف MP4/HLS/MPEG-TS قبل العرض وترتيب المصادر حسب التوافق.
   - عدم كسر Range/206/measured duration/Download.
7. **ربط health/circuit-breaker بطلبات production تدريجيًا.**
   - cooldown + recovery probe bounded.
   - latency/failure accounting بلا secrets أو upstream URLs.
   - منع retry storms وإعادة المحاولات غير المفيدة.
8. **بدء هيكل واجهة 1.0.1 Mobile-first بعد العقود الأساسية.**
   - Bottom Navigation RTL على الجوال وresponsive header للشاشات الكبيرة.
   - Skeleton/empty/error/retry states واضحة.
   - إبقاء واجهة البصري الحالية كمسار رجوع حتى تثبت الواجهة الجديدة حيًا.
9. **توسيع regression الحي وإغلاق فجوات UX.**
   - WebKit/playback/Range/CORS/Download/matches/news تبقى إلزامية.
   - اختبار pagination page 2+ فعليًا حيث المصدر يقدم أكثر من صفحة.
   - استمرار SSRF/allowlist/secrets/Referer/download-only guards.
10. **تهيئة PWA وDiagnostics والبوابة النهائية للإصدار.**
   - manifest/service worker للـstatic shell والmetadata فقط دون video/media-ref caching.
   - diagnostics منقحة تعرض version/commit/readiness/health بلا أسرار.
   - عدم إنشاء Tag/Release `1.0.1` وعدم بدء Flutter قبل اكتمال كل البوابات الحية.
