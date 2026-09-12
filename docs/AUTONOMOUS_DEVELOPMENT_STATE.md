# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original Basri archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `53d70fae870c7346ea406a19362fa928c4b92915` (`Merge pull request #57 ... Prove deployed 1.0.1 runtime contracts`).
- PR #57 merged only after all 11 final-head PR gates succeeded on `ba1ac007d4117fb98dbc261ae3c02c3078989772`.
- Active PR: #59 `Make deployed search gate source-aware`.
- Branch: `fix/remote-runtime-search-gate-58`.
- Current code commit before this documentation update: `aebaee19440f794619687397a40d6e1d0f8f2b8c`.
- Target: Web/PWA `1.0.1`.
- Flutter remains blocked until Web/PWA 1.0.1 is proven live across the required gates.

## Product boundary
Al-Qahtani is fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is permitted only because it belongs to the preserved original Basri source contract. No Theeb fallback or cross-project runtime dependency is allowed.

## Protected live behavior
Real iPhone Safari testing has already proven working playback across multiple movie/series/anime samples after the MPEG-TS/HLS path. Safari Range/206, MIME/magic container detection, opaque media references, explicit Download behavior, match logos, Saudi match times, and separated episode display numbering are protected regressions and must not be casually reworked.

## 1.0.1 Phase 1 progress
Merged to main:
- `server/content-runtime.mjs`: product version `1.0.1`, bounded TTL cache, provider-health/circuit primitives, normalization helpers.
- `server/content-runtime-service.mjs`: normalized matches/search/category service, bounded metadata cache and health accounting.
- additive HTTP contracts in `server/app.mjs`:
  - `/api/runtime/status`
  - `/api/v1/matches`
  - `/api/v1/search?q=...`
  - `/api/v1/category?ref=...&p=...`
- old `/api/matches` and `/api/cinema/*` routes remain available during migration.
- deterministic local route regression coverage in `scripts/runtime_http_test.mjs`.
- `.github/workflows/remote-runtime-v1-smoke.yml` and `scripts/remote_runtime_v1_smoke.mjs` now provide a post-merge live contract gate.

## CI and live deployment evidence
PR #57 final head `ba1ac007d4117fb98dbc261ae3c02c3078989772` passed all 11 required PR workflows:
- Web smoke `34663667985` success.
- Content runtime `34663667897` success.
- Remote movie playback `34663667925` success.
- CORS boundary `34663667923` success.
- Media reference expiry `34663667889` success.
- Trusted download filename `34663667896` success.
- Remote CORS `34663667906` success.
- Original Basri download `34663667882` success.
- Original Basri player `34663667928` success.
- Live provider `34663667878` success.
- Mobile WebKit `34663667894` success.

Post-merge main `53d70fae870c7346ea406a19362fa928c4b92915` started the new deployed-v1 workflow as run `34663761975`. The deployed backend itself was live and answered the new contracts, but the run failed on one over-strict source-content assertion rather than a transport/runtime failure. Evidence from the job log:
- `/api/runtime/status`: HTTP 200, version `1.0.1`, no sensitive/session fields exposed.
- `/api/v1/matches`: 30 normalized matches from `basri-matches`; a second request showed `cached: true`.
- `/api/v1/search?q=الذئب الوحيد`: 4 normalized real items from `basri-direct`.
- `/api/v1/search?q=The%20Odyssey`: valid `1.0.1` search contract from `basri-direct`, but current source result count was `0`.
- `/api/v1/category`: 24 real normalized items from `basri-direct`.
- health summary remained structured and sanitized for `basri-direct` and `basri-matches`.
- The only failing assertion was requiring `The Odyssey` to be non-empty despite the current original source legitimately returning an empty list. Forcing old/archive/download-only content into results merely to satisfy a smoke test would conflict with the product filtering contract.

PR #59 changes only the deployed smoke semantics: both Arabic and English queries must still return a valid normalized 1.0.1 contract; the Arabic control remains required to be non-empty, while `The Odyssey` is treated as source-dependent and may truthfully be empty. No playback, source filtering, proxy, Range, Download, or security runtime behavior is changed.

## Render evidence / blocker
Render currently exposes two workspaces to the connected account: `My Workspace` and `بيانات`. Repository evidence does not identify which one owns Al-Qahtani unambiguously. Per project rules, no workspace was guessed and no direct Render service/log claim is made. External deployed HTTP/GitHub Actions evidence remains authoritative until workspace ownership is proven.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains intact.
- Runtime migration stays additive until live parity proves replacements safe.
- Upstream media URLs remain behind short-lived opaque references.
- Source/media allowlists and SSRF/DNS/host protections stay mandatory.
- No arbitrary browser-supplied proxy target is accepted.
- Worker/session material remains server-side.
- Referer values remain ASCII/URL-safe.
- Metadata cache never caches video streams, media references, sessions, or Download responses.
- Normal playback never inherits upstream attachment semantics; explicit Download keeps trusted attachment behavior.
- Ads/popups/unneeded tracking and legacy Android Intent/deep-link handoff remain prohibited.

## 1.0.1 readiness
Current readiness: **Phase 1 deployed-contract hardening; NOT release ready.**

Completed:
- runtime primitives and single product version source;
- bounded metadata cache;
- provider health/circuit primitives;
- normalized matches/search/category service;
- additive versioned HTTP contracts;
- deterministic route tests;
- post-merge live contract workflow;
- live proof that runtime status, matches, Arabic search, category, cache behavior, and sanitized health execute successfully on the deployed backend.

Still required before 1.0.1 can be called ready: close #59 and obtain a green post-merge deployed-v1 gate; opaque server-side category identifiers; unified home/title/episodes/play contracts; production health/circuit decisions; full mobile-first RTL interface; live matches UX; Player 2.0 local history/favorites/continue-watching; unified search/library UX; installable PWA; diagnostics/observability; and the complete Safari/security/live release matrix.

## أهداف التشغيل التالي
1. **إغلاق PR #59 بأمان.**
   - فحص جميع بوابات CI على الرأس النهائي بعد تحديث هذا الملف.
   - إصلاح أي failure على نفس الفرع فقط وإعادة الاختبار حتى الخضرة.
   - الدمج فقط بعد نجاح البوابات المطلوبة ثم التحقق من `Remote runtime v1 smoke` على main.
2. **إخفاء عناوين التصنيفات الأصلية خلف IDs داخلية.**
   - تعريف مفاتيح ثابتة للتصنيفات الرئيسية داخل Backend.
   - تحويل المفتاح إلى رابط Basri المسموح server-side فقط.
   - رفض أي category key مجهول وعدم توسيع arbitrary URL surface.
3. **إنشاء `/api/v1/home` موحد.**
   - جمع المباريات وأقسام محتوى محدودة بـbounded concurrency.
   - السماح بفشل جزئي دون إسقاط الصفحة كاملة.
   - تطبيق TTL قصير مناسب وإرجاع metadata منقحة.
4. **إنشاء عقد موحد للتفاصيل.**
   - إضافة `/api/v1/title/:id` أو عقد مكافئ باستخدام opaque refs.
   - تطبيع poster/title/type/year والحقول المتاحة فقط.
   - الحفاظ على fallback إلى مصدر Basri الأصلي وحده.
5. **إكمال عقد المواسم والحلقات.**
   - فصل `episode_id` و`episode_number` في العقد العام.
   - تطبيع الموسم والترتيب دون تسريب IDs داخلية كأرقام عرض.
   - توسيع regression عبر الفئات الست للمسلسلات.
6. **إنشاء عقد play موحد وآمن.**
   - إبقاء media refs opaque وقصيرة العمر.
   - ترتيب المصادر حسب compatibility/health دون retry storm.
   - حماية MPEG-TS/HLS وRange/206 وmeasured-duration وDownload الحاليين.
7. **ربط health/circuit-breaker بطلبات production تدريجيًا.**
   - وضع cooldown وrecovery probe محدودين.
   - تسجيل latency/failures دون أسرار أو upstream URLs حساسة.
   - منع retries على الطلبات غير الآمنة أو غير المفيدة.
8. **بدء هيكل واجهة 1.0.1 بعد اكتمال عقود runtime الأساسية.**
   - Mobile-first RTL مع Bottom Navigation على الجوال.
   - حالات skeleton/empty/error/retry واضحة.
   - إبقاء Safari وواجهة البصري القديمة قابلة للرجوع خلال الانتقال.
9. **توسيع بوابات regression الحية.**
   - إبقاء WebKit/playback/Range/CORS/Download/matches/news إلزامية.
   - اختبار البحث العربي والإنجليزي كعقد مع عدم اختلاق نتائج غير موجودة في المصدر.
   - استمرار فحص SSRF/allowlists/secrets/Referer وفلترة download-only.
10. **تهيئة PWA وDiagnostics والبوابة النهائية للإصدار.**
   - manifest/service-worker للـstatic shell والmetadata فقط دون video/media-ref caching.
   - diagnostics منقحة تعرض version/commit/readiness/health بلا secrets.
   - عدم إنشاء Tag/Release `1.0.1` وعدم بدء Flutter قبل اكتمال كل البوابات الحية.
