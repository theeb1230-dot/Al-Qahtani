# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original Basri archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `2eff04b462a40f2c5f103aa2d4ceba5943d364d1` (`Expose versioned 1.0.1 runtime HTTP routes`).
- PR #55 merged: runtime service integration.
- PR #56 merged after all 11 required final-head PR checks succeeded.
- Active PR: #57 `Prove deployed 1.0.1 runtime contracts`.
- Branch: `test/remote-runtime-v1-57`.
- Current implementation head before this documentation commit: `a2777c4ee63a9da372e69de527a842b18bf3bede`.
- Target: Web/PWA `1.0.1`.
- Flutter remains blocked until Web/PWA 1.0.1 is proven live.

## Product boundary
Al-Qahtani remains independent from unrelated projects and providers. Only original Basri source contracts are allowed. Existing source allowlists, SSRF protections, server-side session handling, opaque media references and Safari Range protections remain mandatory.

## Protected live behavior
Real iPhone Safari testing has already proven working playback across multiple movie/series/anime samples after the MPEG-TS/HLS path. Match logos and Saudi match times are proven on device. Episode display numbering is separated from internal IDs. These paths remain protected regressions.

## 1.0.1 progress
Merged to main:
- `server/content-runtime.mjs`: version `1.0.1`, bounded TTL cache, provider health/circuit-breaker primitives and normalization helpers.
- `server/content-runtime-service.mjs`: normalized matches/search/category service, bounded metadata cache and health accounting.
- additive runtime HTTP routes in `server/app.mjs`: `/api/runtime/status`, `/api/v1/matches`, `/api/v1/search`, `/api/v1/category`.
- old `/api/matches` and `/api/cinema/*` routes remain available during migration.

PR #57 currently contains two bounded follow-ups because it was already open when the user added the category requirement and the one-open-PR rule forbids opening another PR:

### A. Deployed v1 runtime proof
- `scripts/remote_runtime_v1_smoke.mjs` validates deployed `1.0.1`, normalized matches, `الذئب الوحيد`, `The Odyssey`, a real category, health summary, metadata cache behavior and absence of secret/session-shaped fields.
- `.github/workflows/remote-runtime-v1-smoke.yml` runs after pushes to main so the deployed commit itself is tested.
- First attempt failed Web smoke because the test source contained literal forbidden cross-project markers. The fix removed those literals and retained generic secret/session privacy assertions instead of weakening the repository boundary gate.
- Fixed head `ba1ac007d4117fb98dbc261ae3c02c3078989772` passed Web smoke, Content runtime, Live provider, Mobile WebKit, Remote movie playback, Remote CORS, CORS boundary, original player/download, media expiry and trusted download filename gates.

### B. Endless category loading in 30-item batches
User requirement added during PR #57: movie and series categories must not stop at the first 30 items. When the user reaches the bottom after item 30, load the next page/batch and continue without a product-side page limit until the source itself ends.

Implemented on the same branch:
- `web/core/api-client.js` now accepts `page` in `getCinemaCategory(...)` and forwards bounded positive `p` to the existing Al-Qahtani backend route.
- `albasri-cinema.html` keeps the first category request as page 1 and uses `IntersectionObserver` at the category tail to load page 2, 3, 4, etc. as the user reaches the bottom.
- UI text explicitly reports loading another 30 items.
- one-page-at-a-time `categoryLoading` guard prevents concurrent duplicate page fetches.
- `categoryRequestId` rejects stale responses after navigation/search/home changes.
- `categorySeen` deduplicates repeated upstream items so a repeated page cannot create an endless duplicate loop.
- pagination stops only when the source returns an empty/repeated page or a short final page; there is no fixed number-of-pages limit in the UI.
- search resets category paging state so category infinite-scroll cannot leak into search results.
- `scripts/category_infinite_scroll_test.mjs` protects the page parameter, viewport observer, sequential paging, deduplication, stale-response guard and 30-item UX.
- `.github/workflows/content-runtime.yml` runs this regression test.

## Deployment / CI evidence
PR #56 final head `1f511822203a0f3b4f3b91cf0c56d5327638e7ff` passed all required PR workflows.
Post-merge main `2eff04b...` evidence:
- GitHub Pages run `34663381231` build/deploy success.
- Remote runtime run `34663383763` deployed-runtime job success after backend auto-deploy wait.

Render workspace ownership remains ambiguous because repository evidence does not identify one visible workspace unambiguously. Do not guess direct Render logs. External deployed runtime workflows remain the accepted evidence until ownership is proven.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains intact.
- Runtime migration is additive until live parity proves replacements safe.
- Category paging must stay server-routed; the browser must not become an arbitrary upstream fetcher.
- Upstream media URLs remain behind short-lived opaque references.
- Source/media allowlists and SSRF protections stay mandatory.
- No arbitrary browser-supplied proxy targets.
- Worker/session material stays server-side.
- Referer values remain ASCII/URL-safe.
- Metadata cache never caches video streams, media refs, sessions or Download responses.
- Ads/popups/unneeded tracking and legacy Android Intent/deep-link handoff remain prohibited.

## 1.0.1 readiness
Current readiness: Phase-1 runtime + category UX expansion, NOT release ready.

Still required: final-head green gates for PR #57, merge and post-merge deployed-v1 proof, server-side category identifiers/mapping, unified home/title/episodes/play contracts, production health/circuit decisions, redesigned mobile-first UI, Live matches UX, Player 2.0 local history/favorites/continue-watching, unified search/library, installable PWA, diagnostics/observability, and the final 1.0.1 live release gate.

## أهداف التشغيل التالي
1. إغلاق PR #57 بأمان: افحص الرأس النهائي بعد هذا التوثيق، أصلح أي failure على نفس الفرع، ولا تدمج حتى خضرة كل البوابات المطلوبة.
2. اختبر infinite scroll في Mobile WebKit: أول 30 ثم تحميل الدفعة الثانية تلقائيًا عند الوصول للأسفل مع عدم تكرار العناصر.
3. بعد دمج #57 انتظر GitHub Pages/backend لنفس commit وتحقق أن `Remote runtime v1 smoke` ينجح على النسخة المنشورة.
4. أضف category IDs أو mapping server-side حتى لا تعرف واجهة 1.0.1 source URLs الأصلية.
5. أنشئ `/api/home` بفشل جزئي آمن وbounded concurrency للمباريات وأقسام المحتوى.
6. ابنِ title/episodes/play contracts موحدة مع فصل `episode_id` عن `episode_number` والحفاظ على opaque media refs.
7. فعّل قرارات health/circuit-breaker تدريجيًا في production requests مع cooldown/recovery probe ومنع retry storms.
8. ابدأ واجهة 1.0.1 Mobile-first وBottom Navigation بعد ثبوت العقود الجديدة حيًا.
9. أبقِ WebKit/playback/Range/CORS/download/matches/news/category-pagination regressions إلزامية عند كل PR.
10. جهّز PWA وDiagnostics بعد استقرار runtime/UI؛ لا تبدأ Flutter ولا تعلن 1.0.1 Ready قبل اكتمال البوابات الحية الكاملة.
