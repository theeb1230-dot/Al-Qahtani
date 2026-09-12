# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `d0e258015770045bbfb0f8aef017e49ecedc1788` (`Add resilient unified home runtime contract`).
- PR #61 merged after all 11 exact-head pull-request workflows passed.
- No pull request is open at this snapshot.
- Next working branch prepared from current main: `feat/runtime-home-http-62`.
- Target: Web/PWA `1.0.1`.
- Flutter remains blocked until Web/PWA 1.0.1 is proven live across every required release gate.

## Product boundary
Al-Qahtani is fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is allowed only as part of the preserved original Basri source contract. No Theeb fallback or cross-project runtime dependency is allowed.

## Protected live behavior
Real iPhone Safari testing has already proven playback across multiple movie/series/anime samples after the MPEG-TS/HLS path. Safari Range/206, MIME/magic container detection, opaque media references, explicit Download behavior, measured-duration logic, real match logos, Saudi match times, separated episode display numbering, endless 30-item category loading, and the current direct/worker Basri fallback chain remain protected regressions.

## 1.0.1 Phase 1 progress merged to main
- `server/content-runtime.mjs`: product version `1.0.1`, bounded TTL cache, provider-health/circuit primitives and normalization helpers.
- `server/content-runtime-service.mjs`: normalized matches/search/category plus unified home aggregation, bounded metadata cache and health accounting.
- additive runtime HTTP contracts currently merged: `/api/runtime/status`, `/api/v1/matches`, `/api/v1/search?q=...`, `/api/v1/category?ref=...&p=...`.
- endless movie/series category pagination: page 1 then page 2+ when the viewport reaches the tail, no fixed page count, stale-response rejection, concurrency guard and deduplication.
- category navigation uses opaque IDs such as `series-foreign` and `movie-anime`; original `akwam.ss` category mappings remain backend-only except temporary server-side legacy compatibility.
- unified home service aggregates matches plus four catalog sections with bounded concurrency=2, caps matches to 12 and section items to 8, reuses existing TTL cache, and returns partial results if one dependency fails.

## PR #61 evidence
PR #61 `Add resilient unified home runtime contract` merged to main as `d0e258015770045bbfb0f8aef017e49ecedc1788`.

Failures found and fixed before merge:
1. Head `2fa7f3968635826e96dbd06e446e8ea5041257a9`, Content runtime run `34667052357`, job `103480973615`: regression expected four fresh category calls, but runtime correctly reused cached `movie-arabic`. Test fixed to require cache reuse.
2. Head `d16c41533ea262a91d9ad7a607b404690c615dca`, Content runtime run `34667109720`, job `103481143732`: partial-failure fixture targeted nonexistent `section=34`, so it never failed a real home section. Fixture corrected to `series?section=29`.
3. Head `2335ed8dd3b0a3d51a6e1c4d334ad9b217bd5cdd`, Content runtime run `34667142277`, job `103481239816`: success.
4. Final documented PR head `0255534e401b8d60b751bdae9669f0c1f679c6f1`: all 11 required workflows completed successfully before merge, including Mobile WebKit, Live provider, Remote movie playback, Content runtime, Web smoke, CORS and download/media regressions.

## Post-merge evidence for main d0e2580
- GitHub Pages run `34667237764`: success for the exact main commit.
- Content runtime run `34667237737`: success.
- Web smoke run `34667237682`: success.
- Remote movie playback run `34667237652`: success, including real movie playback/Safari-range candidate checks.
- Remote runtime smoke run `34667237714`, job `103481521451`: success after waiting for Render auto-deploy and probing the deployed runtime/Safari flows.
- Mobile WebKit run `34667237667`, job `103481521292`: success for cinema navigation, endless 30-item category loading and MPEG-TS media typing.
- No post-merge failure was observed in the checked main workflows during this run.

## Render evidence / blocker
The connected Render account exposes two workspaces, `My Workspace` and `بيانات`; repository evidence still does not prove which workspace owns Al-Qahtani. Direct workspace log inspection therefore remains blocked by ambiguity. The deployed `Remote runtime smoke` succeeded against the externally deployed backend for the exact merged commit, so external runtime evidence is available without guessing a Render workspace.

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
Current readiness: **Phase 1 matches/search/category runtime + category IDs + endless category UX + unified home service are merged and post-merge regressions are green; the home service is not yet exposed as `/api/v1/home`; NOT release ready.**

Still required before `1.0.1` can be called ready: expose and prove the home HTTP contract; unified title/episodes/play contracts; production health/circuit decisions; full mobile-first RTL UI; live matches UX; Player 2.0 history/favorites/continue-watching; unified search/library UX; installable PWA; diagnostics/observability; and the complete Safari/security/live release matrix.

## أهداف التشغيل التالي
1. **تعريض `/api/v1/home` بشكل additive.**
   - إضافة route إلى `server/app.mjs` فوق legacy routes.
   - الحفاظ على `Cache-Control: no-store` وعدم كشف source URLs.
   - عدم تعديل عقود legacy أثناء هذه الخطوة.
2. **إضافة HTTP regression لعقد Home.**
   - إثبات `status=success`, `kind=home`, `version=1.0.1`.
   - إثبات partial semantics عندما يفشل dependency واحد.
   - إثبات headers/CORS/no-store.
3. **إضافة deployed Home smoke بعد الدمج.**
   - فحص `/api/v1/home` من Render المنشور.
   - التحقق من matches والsections المحدودة وعدم تسريب upstream URLs.
   - تسجيل latency/partial state بصورة منقحة.
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
   - استمرار اختبار pagination page 2+ وepisode numbering.
   - استمرار SSRF/allowlist/secrets/Referer/download-only guards.
10. **تهيئة PWA وDiagnostics والبوابة النهائية للإصدار.**
   - manifest/service worker للـstatic shell والmetadata فقط دون video/media-ref caching.
   - diagnostics منقحة تعرض version/commit/readiness/health بلا أسرار.
   - عدم إنشاء Tag/Release `1.0.1` وعدم بدء Flutter قبل اكتمال كل البوابات الحية.
