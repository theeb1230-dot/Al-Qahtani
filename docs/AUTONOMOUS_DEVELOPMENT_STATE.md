# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `02e92a9fa936284c927fc1a633adb6b5b873e827` (`Load cinema categories beyond the first 30 items`).
- PR #58 merged with endless 30-item category pagination and iPhone WebKit regression coverage.
- GitHub Pages post-merge run `34664586489` succeeded for main `02e92a9f...`.
- Active PR: #60 `Hide cinema source URLs behind category IDs`.
- Branch: `feat/category-ids-60`.
- Final code head before this documentation commit: `68ec62f139f64cde1d3dfd89344d080b4d160e5b`.
- Target: Web/PWA `1.0.1`.
- Flutter remains blocked until Web/PWA 1.0.1 is proven live across all required release gates.

## Product boundary
Al-Qahtani is fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is allowed only as part of the preserved original Basri source contract. No Theeb fallback or cross-project runtime dependency is allowed.

## Protected live behavior
Real iPhone Safari testing has already proven playback across multiple movie/series/anime samples after the MPEG-TS/HLS path. Safari Range/206, MIME/magic container detection, opaque media references, explicit Download behavior, measured-duration logic, real match logos, Saudi match times, and separated episode display numbering remain protected regressions.

## 1.0.1 Phase 1 progress merged to main
- `server/content-runtime.mjs`: product version `1.0.1`, bounded TTL cache, provider-health/circuit primitives and normalization helpers.
- `server/content-runtime-service.mjs`: normalized matches/search/category service, bounded metadata cache and health accounting.
- additive runtime HTTP contracts: `/api/runtime/status`, `/api/v1/matches`, `/api/v1/search?q=...`, `/api/v1/category?ref=...&p=...`.
- deployed runtime contract smoke covering version, matches, Arabic/English search semantics, category, cache and sanitized health.
- endless movie/series category pagination merged in #58: page 1, then page 2+ when the viewport reaches the tail, no fixed page count, stale-response rejection, concurrency guard and deduplication.

## PR #60 — server-side category identifiers
Goal: the 1.0.1 browser must not know original Basri category URLs. It sends stable product-level identifiers while only the Al-Qahtani backend knows the Basri mapping.

Implemented on the active branch:
- `server/catalog-categories.mjs` owns the 12 allowed category mappings for series and movies;
- stable IDs such as `series-foreign`, `series-arabic`, `movie-foreign`, `movie-anime` map server-side to the preserved Basri source URLs;
- `web/core/catalog-config.js` contains only titles + opaque IDs and no `akwam.ss` category URLs;
- `web/core/api-client.js` routes category loads through `/api/v1/category?ref=<category-id>&p=<page>`;
- `content-runtime-service.category(...)` resolves the ID server-side before calling the original Basri category fetcher;
- unknown IDs are rejected safely before upstream fetch;
- exact legacy category URLs remain temporarily accepted only inside the runtime resolver for already-deployed compatibility during migration;
- cache keys use stable category IDs instead of upstream URLs;
- infinite scroll remains 30-item batches with page 2+ and no hard UI limit.

### Compatibility failure found and fixed
The first updated PR head exposed a real migration mismatch rather than a provider failure:
- Mobile WebKit run `34664865812`, job `103474636464`, failed in `Exercise cinema navigation in iPhone WebKit` waiting for `#mediaGrid .item`.
- Root cause 1: the old WebKit mock still intercepted `/api/cinema/category` while the browser had moved to `/api/v1/category`.
- Root cause 2: the runtime category contract returns normalized fields `{poster,type,ref}`, while the existing cinema UI still consumes legacy display fields `{img,is_series,href}` during the additive migration.
- `web/core/api-client.js` now validates the versioned runtime category envelope and adapts only its normalized display fields at the UI boundary, keeping the backend contract clean while preserving the existing Details/Player/Download flow.
- `scripts/mobile_webkit_smoke.mjs` now mocks `/api/v1/category`, category IDs and the normalized runtime envelope.
- `scripts/category_infinite_webkit_smoke.mjs` now uses the normalized `poster` field and still requires `series-foreign`, page 2 and 60 unique cards.

## CI / deployment evidence
For main `02e92a9fa936284c927fc1a633adb6b5b873e827`:
- GitHub Pages `34664586489`: success.

For PR #60 head `68ec62f139f64cde1d3dfd89344d080b4d160e5b` before this documentation commit:
- all 11 pull-request workflows completed;
- no `failure`, `queued` or `in_progress` run remained in the exact-head set when rechecked;
- Remote CORS run `34665400461` explicitly completed `success`;
- the prior WebKit failure belonged to older head `cb8dcfa...` and was fixed before `68ec62f...`.
- this documentation commit moves the PR head again, therefore a fresh exact-head green set is mandatory before merge.

## Render evidence / blocker
The connected Render account exposes two workspaces, `My Workspace` and `بيانات`. Repository evidence still does not prove which workspace owns Al-Qahtani. Do not guess direct Render logs. External deployed HTTP and GitHub Actions runtime evidence remain authoritative until workspace ownership is proven.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains intact.
- Runtime migration stays additive until live parity proves replacements safe.
- The browser must not become an arbitrary upstream fetcher.
- New UI category navigation uses product IDs, not Basri URLs.
- Source/media allowlists and SSRF/DNS/host protections stay mandatory.
- Upstream media URLs remain behind short-lived opaque references.
- Worker/session material remains server-side.
- Referer values remain ASCII/URL-safe.
- Metadata cache never caches video streams, media references, sessions or Download responses.
- Normal playback never inherits upstream attachment semantics; explicit Download keeps trusted attachment behavior.
- Ads/popups/unneeded tracking and legacy Android Intent/deep-link handoff remain prohibited.

## 1.0.1 readiness
Current readiness: **Phase 1 runtime + endless category UX merged; opaque category-ID migration in PR #60; NOT release ready.**

Still required before `1.0.1` can be called ready: close #60 with final-head green gates and deployed proof; unified `/api/v1/home`; unified title/episodes/play contracts; production health/circuit decisions; full mobile-first RTL UI; live matches UX; Player 2.0 history/favorites/continue-watching; unified search/library UX; installable PWA; diagnostics/observability; and the complete Safari/security/live release matrix.

## أهداف التشغيل التالي
1. **إغلاق PR #60 بأمان.**
   - انتظار كل checks على الرأس النهائي بعد تحديث هذه الوثيقة.
   - جلب logs لأي failure وإصلاح السبب على نفس الفرع فقط.
   - الدمج فقط بعد خضرة جميع البوابات المطلوبة.
2. **إثبات Category IDs حيًا بعد الدمج.**
   - انتظار GitHub Pages/backend لنفس commit قدر ما تسمح الأدوات.
   - التحقق من `/api/v1/category?ref=series-foreign&p=1` على النشر الفعلي.
   - التأكد أن browser assets المنشورة لا تحتوي روابط تصنيف `akwam.ss` وأن page 2+ يبقى عبر ID نفسه.
3. **إنشاء `/api/v1/home` موحد.**
   - جمع المباريات + أقسام محتوى محدودة باستخدام bounded concurrency.
   - السماح بفشل قسم واحد دون إسقاط الصفحة كاملة.
   - تطبيق TTL قصير وإرجاع metadata منقحة بلا source URLs حساسة.
4. **إنشاء عقد title/details موحد.**
   - استخدام opaque refs الموجودة بدل upstream URLs في الواجهة.
   - تطبيع poster/title/type/year والحقول المتاحة فقط.
   - الحفاظ على legacy details route أثناء الانتقال.
5. **إنشاء عقد episodes موحد.**
   - فصل `episode_id` عن `episode_number` صراحة.
   - الحفاظ على ordering والموسم إن توفر.
   - توسيع regression على الفئات الست للمسلسلات.
6. **إنشاء عقد play موحد وآمن.**
   - الإبقاء على media refs opaque وقصيرة العمر.
   - تصنيف MP4/HLS/MPEG-TS قبل العرض وترتيب المصادر حسب التوافق.
   - عدم كسر Range/206/measured duration/Download.
7. **ربط health/circuit-breaker بطلبات production تدريجيًا.**
   - cooldown + recovery probe bounded.
   - latency/failure accounting بلا secrets أو upstream URLs.
   - منع retry storms وإعادة المحاولات غير المفيدة.
8. **بدء هيكل واجهة 1.0.1 Mobile-first بعد عقود runtime الأساسية.**
   - Bottom Navigation RTL على الجوال.
   - Skeleton/empty/error/retry states واضحة.
   - إبقاء واجهة البصري الحالية كمسار رجوع حتى تثبت الواجهة الجديدة حيًا.
9. **توسيع regression الحي.**
   - WebKit/playback/Range/CORS/Download/matches/news تبقى إلزامية.
   - اختبار pagination page 2+ فعليًا حيث المصدر يقدم أكثر من صفحة.
   - استمرار SSRF/allowlist/secrets/Referer/download-only guards.
10. **تهيئة PWA وDiagnostics والبوابة النهائية للإصدار.**
   - manifest/service worker للـstatic shell والmetadata فقط دون video/media-ref caching.
   - diagnostics منقحة تعرض version/commit/readiness/health بلا أسرار.
   - عدم إنشاء Tag/Release `1.0.1` وعدم بدء Flutter قبل اكتمال كل البوابات الحية.
