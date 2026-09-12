# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original Basri archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `2eff04b462a40f2c5f103aa2d4ceba5943d364d1` (`Expose versioned 1.0.1 runtime HTTP routes`).
- PR #55 merged: runtime service integration.
- PR #56 merged after all 11 required final-head PR checks succeeded, including Mobile WebKit and Live provider.
- Post-merge GitHub Pages run `34663381231` completed build + deploy successfully for `2eff04b...`.
- Post-merge Remote runtime smoke run `34663383763` completed successfully after its backend auto-deploy wait and deployed runtime/Safari probe.
- Active PR: #57 `Prove deployed 1.0.1 runtime contracts`.
- Branch: `test/remote-runtime-v1-57`.
- Code head before this documentation update: `bdc449c3b6df67eb51c4cbaf6a6da762b080465f`.
- Target: Web/PWA `1.0.1`.
- Flutter remains blocked until Web/PWA 1.0.1 is proven live.

## Product boundary
Al-Qahtani remains independent from unrelated projects and providers. Only original Basri source contracts are allowed. Existing source allowlists, SSRF protections, server-side session handling, opaque media references and Safari Range protections remain mandatory.

## Protected live behavior
Real iPhone Safari testing has already proven working playback across multiple movie/series/anime samples after the MPEG-TS/HLS path. Match logos and Saudi match times are proven on device. Episode display numbering is separated from internal IDs. These paths remain protected regressions.

## 1.0.1 Phase 1 progress
Merged to main:
- `server/content-runtime.mjs`: version `1.0.1`, bounded TTL cache, provider health/circuit-breaker primitives and normalization helpers.
- `server/content-runtime-service.mjs`: normalized matches/search/category service, bounded metadata cache and health accounting.
- additive runtime HTTP routes in `server/app.mjs`:
  - `/api/runtime/status`
  - `/api/v1/matches`
  - `/api/v1/search?q=...`
  - `/api/v1/category?ref=...&p=...`
- old `/api/matches` and `/api/cinema/*` routes remain available during migration.
- deterministic local HTTP regression coverage in `scripts/runtime_http_test.mjs`.

PR #57 adds the deployed proof gate for these new routes:
- `scripts/remote_runtime_v1_smoke.mjs` waits for the deployed 1.0.1 status route, validates normalized matches, Arabic and English searches (`الذئب الوحيد`, `The Odyssey`), a real category, structured provider health, and observable short-lived match cache behavior;
- the deployed smoke rejects cross-project integration markers in runtime output;
- `.github/workflows/remote-runtime-v1-smoke.yml` runs only after pushes to main so the test targets the actually deployed commit;
- the normal Content runtime PR gate syntax-checks the remote smoke before merge.

## CI / deployment evidence
PR #56 final head `1f511822203a0f3b4f3b91cf0c56d5327638e7ff` passed all 11 required workflows. Notable final-head runs:
- Content runtime `34663298078` success.
- Web smoke `34663298077` success.
- Live provider `34663298028` success.
- Mobile WebKit `34663298060` success.
- Remote movie playback `34663298006` success.
- Remote CORS `34663298007` success.
- CORS boundary `34663298050` success.
- Original player `34663298008` success.
- Original download `34663298032` success.
- Media reference expiry `34663298009` success.
- Trusted download filename `34663298036` success.

Post-merge main `2eff04b...`:
- GitHub Pages run `34663381231` build/deploy success.
- Remote runtime run `34663383763` deployed-runtime job success after backend auto-deploy wait.
- Other normal post-merge workflows were still settling when PR #57 was created; no failure had been observed at this handoff point.

Render workspace ownership remains ambiguous because repository evidence does not identify one visible workspace unambiguously. Do not guess direct Render logs. External deployed runtime workflows remain the accepted evidence until ownership is proven.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains intact.
- Runtime migration is additive until live parity proves replacements safe.
- Upstream media URLs remain behind short-lived opaque references.
- Source/media allowlists and SSRF protections stay mandatory.
- No arbitrary browser-supplied proxy targets.
- Worker/session material stays server-side.
- Referer values remain ASCII/URL-safe.
- Metadata cache never caches video streams, media refs, sessions or Download responses.
- Normal playback never inherits upstream attachment semantics; explicit Download keeps trusted attachment behavior.
- Ads/popups/unneeded tracking and legacy Android Intent/deep-link handoff remain prohibited.

## 1.0.1 readiness
Current readiness: Phase-1 deployed-contract proof, NOT release ready.

Completed so far:
- runtime primitives;
- runtime service;
- versioned additive status/matches/search/category HTTP contracts;
- local route tests;
- deployed old-flow runtime proof after the new route merge;
- dedicated deployed-v1 smoke under PR #57.

Still required: merge #57 and obtain its post-merge deployed-v1 evidence, server-side category identifiers/mapping, unified home/title/episodes/play contracts, production health/circuit decisions, redesigned mobile-first UI, Live matches UX, Player 2.0 local history/favorites/continue-watching, unified search/library, installable PWA, diagnostics/observability, and the final 1.0.1 live release gate.

## أهداف التشغيل التالي
1. إغلاق PR #57 بأمان: افحص الرأس النهائي بعد تحديث هذا الملف، أصلح أي failure على نفس الفرع، وادمج فقط بعد خضرة جميع البوابات المطلوبة.
2. بعد دمج #57 انتظر backend auto-deploy وتحقق أن `Remote runtime v1 smoke` ينجح على commit الرئيسي نفسه.
3. راجع نتائج `/api/runtime/status` وhealth/cache من الاختبار المنشور وتأكد أن metadata منقحة ولا تكشف أسرارًا أو upstream URLs حساسة.
4. أضف category IDs أو mapping server-side حتى لا تحتاج واجهة 1.0.1 إلى معرفة `akwam.ss` أو source URLs.
5. أنشئ `/api/home` بفشل جزئي آمن وbounded concurrency يجمع المباريات وأقسام محتوى محدودة.
6. ابنِ `/api/v1/title` وepisodes/play contracts تدريجيًا مع فصل `episode_id` عن `episode_number` والحفاظ على opaque media refs.
7. فعّل قرارات health/circuit-breaker تدريجيًا في production requests مع cooldown/recovery probe ومنع retry storms.
8. ابدأ واجهة 1.0.1 Mobile-first وBottom Navigation فقط بعد ثبوت العقود الجديدة حيًا.
9. أبقِ WebKit/playback/Range/CORS/download/matches/news regressions إلزامية عند كل PR.
10. جهّز PWA وDiagnostics بعد استقرار runtime/UI؛ لا تبدأ Flutter ولا تعلن 1.0.1 Ready قبل اكتمال البوابات الحية الكاملة.
