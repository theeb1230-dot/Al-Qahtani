# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `02e92a9fa936284c927fc1a633adb6b5b873e827` (`Load cinema categories beyond the first 30 items`).
- PR #58 merged after its final required gates were green; it added endless 30-item category pagination and iPhone WebKit regression coverage.
- GitHub Pages post-merge run `34664586489` completed successfully for main `02e92a9f...`; no post-merge failure was observed in the 13-run set checked after merge.
- Active PR: #60 `Hide cinema source URLs behind category IDs`.
- Branch: `feat/category-ids-60`.
- Code head before this documentation update: `fabfbb1525ecfe7cde04712c6160027397fa3f72`.
- The first CI set for that code head completed without an observed failure; this documentation commit moves the head, so a fresh final-head gate set is mandatory before merge.
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
- iPhone WebKit regression verifies two 30-item batches render 60 unique cards and requests `p=2`.

## PR #60 — server-side category identifiers
Goal: the 1.0.1 browser must not know original Basri category URLs. It should send stable product-level identifiers while only the Al-Qahtani backend knows the Basri mapping.

Implemented on the active branch:
- new `server/catalog-categories.mjs` owns the 12 allowed category mappings for series and movies;
- stable IDs such as `series-foreign`, `series-arabic`, `movie-foreign`, `movie-anime` map server-side to the preserved Basri source URLs;
- `web/core/catalog-config.js` contains only titles + opaque IDs and no `akwam.ss` category URLs;
- `web/core/api-client.js` now routes category loads through `/api/v1/category?ref=<category-id>&p=<page>`;
- `content-runtime-service.category(...)` resolves the ID server-side before calling the Basri category fetcher;
- unknown IDs return an empty safe category envelope and never reach an upstream fetcher;
- exact legacy category URLs remain temporarily accepted inside the runtime resolver only for already-deployed compatibility during migration;
- cache keys use the stable category ID instead of the upstream URL;
- infinite scroll remains unchanged: 30-item batches, page 2+, no hard UI limit;
- the Node regression asserts browser config has no `akwam.ss` source URLs;
- the iPhone WebKit pagination smoke now requires the browser to send `series-foreign`, keeps that ID for page 2, and still reaches 60 unique cards.

## CI / deployment evidence
For main `02e92a9fa936284c927fc1a633adb6b5b873e827`:
- GitHub Pages `34664586489`: success.
- Content runtime and the normal post-merge regression set were observed without a failure after #58 merged.

For PR #60 code head `fabfbb1525ecfe7cde04712c6160027397fa3f72` before this documentation update:
- 11 pull-request workflows were triggered.
- after settling, no run remained queued or in progress and no `conclusion: failure` was observed.
- because this documentation commit changes the PR head, these results are historical only; fresh final-head checks must pass before merge.

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

Still required before `1.0.1` can be called ready: close #60 with final-head green gates and live proof; unified `/api/v1/home`; unified title/episodes/play contracts; production health/circuit decisions; full mobile-first RTL UI; live matches UX; Player 2.0 history/favorites/continue-watching; unified search/library UX; installable PWA; diagnostics/observability; and the complete Safari/security/live release matrix.

## أهداف التشغيل التالي
1. **إغلاق PR #60 بأمان.**
   - انتظار كل checks على الرأس النهائي بعد تحديث هذه الوثيقة.
   - جلب logs لأي failure وإصلاح السبب على نفس الفرع فقط.
   - الدمج فقط بعد خضرة جميع البوابات المطلوبة.
2. **إثبات Category IDs حيًا بعد الدمج.**
   - انتظار GitHub Pages/backend لنفس commit قدر ما تسمح الأدوات.
   - التحقق أن Safari يرسل IDs فقط وأن الصفحة الثانية والثالثة تستمر بالتحميل.
   - التأكد أن browser assets المنشورة لا تحتوي روابط تصنيف `akwam.ss`.
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
