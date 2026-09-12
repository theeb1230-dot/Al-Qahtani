# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original Basri archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `dceaf2ed554ee500960b5931cac5b1895c542fa8`.
- Active PR: #55 `Integrate 1.0.1 content runtime service`.
- Branch: `feat/runtime-service-integration-55`.
- Code head before this documentation update: `3c2eb92a6798acbf6e8db276c83395d60ca26fb1`.
- Target: Web/PWA `1.0.1`.
- Flutter remains blocked until Web/PWA 1.0.1 is proven live.

## Product boundary
Al-Qahtani remains independent from unrelated projects and providers. Only original Basri source contracts are allowed. Existing source allowlists, SSRF protections, server-side session handling, opaque media references and Safari Range protections remain mandatory.

## Protected live behavior
Real iPhone Safari testing has already proven working playback across multiple movie/series/anime samples after the MPEG-TS/HLS path. Match logos and Saudi match times are also proven on device. Episode display numbering is separated from internal IDs. These paths are protected regressions.

## 1.0.1 Phase 1 progress
Merged foundation on main:
- `server/content-runtime.mjs` with product version, bounded TTL cache, provider health/circuit-breaker state and normalization helpers.
- dedicated Content runtime CI and primitive regression tests.

PR #55 adds:
- `server/content-runtime-service.mjs` for normalized matches/search/category operations;
- bounded short-lived metadata caching;
- provider latency/success/failure health accounting;
- runtime status/version metadata;
- `scripts/content_runtime_service_test.mjs` for cache expiry/hits, normalization and health behavior;
- updated Content runtime workflow;
- `docs/CONTENT_RUNTIME_1.0.1.md` documenting the migration path.

The current PR intentionally does not replace production HTTP/player/media routes yet. The next slice should expose versioned read-only runtime routes beside the existing routes, then prove them live before UI migration.

## CI evidence before this documentation update
For PR #55 code head `3c2eb92a6798acbf6e8db276c83395d60ca26fb1`:
- Content runtime `34662939359` success.
- Web smoke `34662939363` success.
- Live provider smoke `34662939379` success.
- Remote movie playback smoke `34662939368` success.
- Remote CORS smoke `34662939345` success.
- CORS boundary `34662939378` success.
- Original player contract `34662939350` success.
- Original download contract `34662939336` success.
- Media reference expiry `34662939441` success.
- Trusted download filename `34662939352` success.
- Mobile WebKit `34662939333` was still running at the time of this update.

This documentation commit changes the PR head, so a full fresh final-head gate set is required before merge.

## 1.0.1 readiness
Current readiness: Phase-1 service layer, not release ready.

Still required: live runtime route integration, unified home/title/episodes/play contracts, production health decisions, redesigned mobile-first UI, Live matches UX, Player 2.0 local history/favorites/continue-watching, unified search/library, installable PWA, diagnostics/observability, and final 1.0.1 live release gates.

## أهداف التشغيل التالي
1. إغلاق PR #55 بأمان: فحص الرأس النهائي، انتظار كل CI، إصلاح أي failure على نفس الفرع، ثم الدمج فقط عند الخضرة الكاملة.
2. إضافة `/api/runtime/status` و`/api/v1/matches` بجانب العقود القديمة مع اختبارات محلية وremote smoke.
3. إضافة `/api/v1/search` و`/api/v1/category` باستخدام runtime service دون كسر المسارات الحالية.
4. ربط health/circuit-breaker تدريجيًا بالطلبات الحقيقية مع حدود واضحة ومنع retry storms.
5. إنشاء `/api/home` مقاوم للفشل الجزئي وبـbounded concurrency.
6. بناء title/episodes/play contracts موحدة مع فصل `episode_id` عن `episode_number` والحفاظ على opaque media refs.
7. بدء واجهة 1.0.1 Mobile-first وBottom Navigation بعد ثبوت runtime routes حيًا.
8. تطوير Live matches countdown/polling الجزئي بتوقيت السعودية دون الاعتماد الأعمى على حالة المصدر.
9. إبقاء Mobile WebKit وplayback وRange/CORS/download gates إلزامية خلال كل توسع.
10. تجهيز PWA وDiagnostics بعد استقرار runtime/UI، ومنع بدء Flutter أو إعلان 1.0.1 Ready قبل اكتمال البوابات الحية.
