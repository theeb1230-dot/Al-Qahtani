# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original Basri archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `b2b15bb088c60f855771c207e3e4de4127dd8b43` (`Integrate 1.0.1 content runtime service`).
- PR #55 merged after all required final-head checks were green.
- Active PR: #56 `Expose versioned 1.0.1 runtime HTTP routes`.
- Branch: `feat/runtime-http-routes-56`.
- Code head before this documentation update: `74a6f745eb0684c9543d6c47262d3008f94b4383`.
- Target: Web/PWA `1.0.1`.
- Flutter remains blocked until Web/PWA 1.0.1 is proven live.

## Product boundary
Al-Qahtani remains independent from unrelated projects and providers. Only original Basri source contracts are allowed. Existing source allowlists, SSRF protections, server-side session handling, opaque media references and Safari Range protections remain mandatory.

## Protected live behavior
Real iPhone Safari testing has already proven working playback across multiple movie/series/anime samples after the MPEG-TS/HLS path. Match logos and Saudi match times are also proven on device. Episode display numbering is separated from internal IDs. These paths are protected regressions.

## 1.0.1 Phase 1 progress
Already merged to main:
- `server/content-runtime.mjs` with product version, bounded TTL cache, provider health/circuit-breaker state and normalization helpers.
- `server/content-runtime-service.mjs` with normalized matches/search/category operations, bounded metadata cache and provider health accounting.
- dedicated Content runtime CI, primitive tests and service-level tests.

PR #56 adds the first live HTTP integration slice while preserving all old contracts:
- `server/app.mjs` now instantiates the runtime service beside the existing handlers;
- `/api/runtime/status` exposes sanitized runtime status/version data;
- `/api/v1/matches` exposes normalized match envelopes;
- `/api/v1/search?q=...` exposes normalized search envelopes;
- `/api/v1/category?ref=...&p=...` exposes normalized category envelopes;
- existing `/api/matches`, `/api/cinema/*`, media proxy, playback and Download routes remain in place;
- `createServer({ runtimeService })` allows deterministic local HTTP route tests without external upstream dependencies;
- `scripts/runtime_http_test.mjs` verifies the versioned routes and no-store response semantics;
- the Content runtime workflow now gates syntax and HTTP route tests.

## CI evidence before this documentation update
For PR #56 code head `74a6f745eb0684c9543d6c47262d3008f94b4383`:
- Content runtime `34663250677` success.
- Web smoke `34663250713` success.
- Remote movie playback smoke `34663250738` success.
- Remote CORS smoke `34663250818` success.
- CORS boundary `34663250804` success.
- Original player contract `34663250811` success.
- Original download contract `34663250769` success.
- Media reference expiry `34663250801` success.
- Trusted download filename `34663250659` success.
- Live provider smoke `34663250673` and Mobile WebKit `34663250755` were still running when this handoff update was written.

This documentation commit changes the PR head, so a complete fresh final-head gate set is required before merge.

## Main deployment evidence
For main `b2b15bb088c60f855771c207e3e4de4127dd8b43`, the post-merge GitHub Actions set was rechecked and no failure remained visible. Remote runtime and the normal main push workflows were allowed time to complete before starting PR #56.

Render workspace ownership remains ambiguous because repository evidence still does not identify one of the visible workspaces unambiguously. Do not guess direct Render logs; use external runtime evidence until ownership is proven.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains intact.
- Old production endpoints remain available during runtime migration.
- New runtime routes are additive and read-only in this slice.
- Upstream media URLs remain behind short-lived opaque references.
- Source/media allowlists and SSRF protections stay mandatory.
- No arbitrary browser-supplied proxy targets.
- Worker/session material stays server-side.
- Referer values remain ASCII/URL-safe.
- Metadata cache never caches video streams, media refs, sessions or Download responses.
- Normal playback never inherits upstream attachment semantics; explicit Download keeps trusted attachment behavior.
- Ads/popups/unneeded tracking and legacy Android Intent/deep-link handoff remain prohibited.

## 1.0.1 readiness
Current readiness: Phase-1 live route integration, not release ready.

Completed so far:
- runtime primitives;
- product version source `1.0.1`;
- bounded cache and provider health primitives;
- normalized catalog/episode/match contracts;
- runtime service for matches/search/category;
- additive versioned HTTP status/matches/search/category routes under PR #56;
- local HTTP route regression coverage.

Still required: remote-live proof for the new versioned endpoints after merge, unified home/title/episodes/play contracts, production health decisions, redesigned mobile-first UI, Live matches UX, Player 2.0 local history/favorites/continue-watching, unified search/library, installable PWA, diagnostics/observability, and final 1.0.1 live release gates.

## أهداف التشغيل التالي
1. إغلاق PR #56 بأمان: فحص الرأس النهائي، انتظار كل CI، إصلاح أي failure على نفس الفرع، ثم الدمج فقط عند الخضرة الكاملة.
2. بعد الدمج انتظر نشر backend لنفس commit ثم أضف remote smoke فعلي لـ`/api/runtime/status` و`/api/v1/matches` و`/api/v1/search`.
3. اختبر cache hit/expiry وhealth metadata حيًا مع التأكد من عدم وجود secrets أو upstream URLs حساسة.
4. أضف category identifiers أو server-side mapping تدريجيًا حتى لا تعتمد الواجهة الجديدة على معرفة source URLs.
5. أنشئ `/api/home` مقاومًا للفشل الجزئي وبـbounded concurrency.
6. ابنِ title/episodes/play contracts موحدة مع فصل `episode_id` عن `episode_number` والحفاظ على opaque media refs.
7. اربط health/circuit-breaker تدريجيًا بالطلبات الحقيقية مع حدود واضحة ومنع retry storms.
8. ابدأ واجهة 1.0.1 Mobile-first وBottom Navigation فقط بعد ثبوت runtime routes حيًا.
9. أبقِ Mobile WebKit وplayback وRange/CORS/download gates إلزامية خلال كل توسع.
10. جهّز PWA وDiagnostics بعد استقرار runtime/UI، ولا تبدأ Flutter أو تعلن 1.0.1 Ready قبل اكتمال البوابات الحية.
