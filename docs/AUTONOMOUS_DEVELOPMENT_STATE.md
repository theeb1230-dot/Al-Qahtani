# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original Basri archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `53d70fae870c7346ea406a19362fa928c4b92915` (`Merge pull request #57 ... Prove deployed 1.0.1 runtime contracts`).
- PR #57 merged.
- Active PR: #58 `Load cinema categories beyond the first 30 items`.
- Branch: `test/remote-runtime-v1-57` (reused after #57 merge because new commits were added only after the merge point).
- Current implementation head before this documentation commit: `0117b0f0ceb4a0e02815b96a2a90d2f912913c5c`.
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
- deployed-v1 runtime proof workflow from PR #57.
- old `/api/matches` and `/api/cinema/*` routes remain available during migration.

## PR #58 — endless category loading in 30-item batches
User requirement: movie and series categories must not stop at the first 30 items. When the user reaches the bottom after item 30, load the next 30, then the next 30, with no UI page-count limit until the source itself ends.

Implemented:
- `web/core/api-client.js` now accepts `page` in `getCinemaCategory(...)` and forwards positive `p` to the existing Al-Qahtani backend route.
- `albasri-cinema.html` uses an `IntersectionObserver` sentinel at the category tail.
- page 1 renders first; reaching the tail requests page 2, then 3, 4, and so on.
- each normal source page is treated as a 30-item batch; a short/empty final page ends loading naturally.
- `categoryLoading` prevents concurrent duplicate requests.
- `categoryRequestId` discards stale responses after navigation/search/home transitions.
- `categorySeen` deduplicates repeated upstream items and prevents duplicate-page loops.
- search resets category paging state.
- the existing details/player/download flow is reused for appended cards exactly like the first batch.

Regression coverage:
- `scripts/category_infinite_scroll_test.mjs` statically protects page forwarding, observer setup, sequential paging, deduplication, stale-response handling and the 30-item UX.
- `.github/workflows/content-runtime.yml` executes that regression.
- `scripts/category_infinite_webkit_smoke.mjs` runs with an iPhone 13 WebKit profile, mocks 30 items for page 1 and 30 for page 2, scrolls to the category tail, requires 60 rendered cards, confirms `p=2`, confirms item 60 exists, and rejects duplicates.
- `.github/workflows/mobile-webkit-smoke.yml` now runs this pagination smoke between the existing cinema-navigation and MPEG-TS player checks.

## Recent failure evidence from PR #57
An earlier PR #57 head failed Web smoke because its test source itself contained literal forbidden cross-project markers. The fix removed the forbidden literals from test code and kept generic secret/session-field assertions. The fixed head passed the repository boundary gate and the normal runtime/player/WebKit suite before #57 merged.

## Deployment / CI evidence
PR #56 final head `1f511822203a0f3b4f3b91cf0c56d5327638e7ff` passed all required PR workflows.
Main after PR #57 is `53d70fae...`; post-merge workflows for this main state must be treated as the source of deployment evidence for the next run.

For PR #58, an earlier documentation head `40c2248ce4caac4d722639271ef6c106f9800899` had Content runtime, Web smoke, CORS boundary, media expiry, trusted download filename, original player/download, Remote CORS green while Live provider, Mobile WebKit and Remote movie playback were still settling. The later WebKit pagination test commits changed the head again, so only fresh final-head checks count for merge.

Render workspace ownership remains ambiguous because repository evidence does not identify one visible workspace unambiguously. Do not guess direct Render logs. External deployed runtime workflows remain the accepted evidence until ownership is proven.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains intact.
- Runtime migration is additive until live parity proves replacements safe.
- Category paging remains server-routed; the browser does not become an arbitrary upstream fetcher.
- Upstream media URLs remain behind short-lived opaque references.
- Source/media allowlists and SSRF protections stay mandatory.
- No arbitrary browser-supplied proxy targets.
- Worker/session material stays server-side.
- Referer values remain ASCII/URL-safe.
- Metadata cache never caches video streams, media refs, sessions or Download responses.
- Ads/popups/unneeded tracking and legacy Android Intent/deep-link handoff remain prohibited.

## 1.0.1 readiness
Current readiness: Phase-1 runtime + category UX expansion, NOT release ready.

Still required: final-head green gates for PR #58, merge and live verification of page 2+ category loading, server-side category identifiers/mapping, unified home/title/episodes/play contracts, production health/circuit decisions, redesigned mobile-first UI, Live matches UX, Player 2.0 local history/favorites/continue-watching, unified search/library, installable PWA, diagnostics/observability, and the final 1.0.1 live release gate.

## أهداف التشغيل التالي
1. إغلاق PR #58 بأمان: افحص الرأس النهائي، أصلح أي failure على نفس الفرع، ولا تدمج حتى خضرة كل البوابات المطلوبة.
2. بعد الدمج انتظر GitHub Pages/backend لنفس commit واختبر حيًا أن التصنيف يعرض 30 ثم 60 ثم 90 عند مواصلة النزول إذا كان المصدر يملك صفحات إضافية.
3. راقب WebKit pagination smoke وتأكد أن الصفحة الثانية تُطلب مرة واحدة فقط ولا تظهر عناصر مكررة.
4. أضف category IDs أو mapping server-side حتى لا تعرف واجهة 1.0.1 source URLs الأصلية.
5. أنشئ `/api/home` بفشل جزئي آمن وbounded concurrency للمباريات وأقسام المحتوى.
6. ابنِ title/episodes/play contracts موحدة مع فصل `episode_id` عن `episode_number` والحفاظ على opaque media refs.
7. فعّل قرارات health/circuit-breaker تدريجيًا في production requests مع cooldown/recovery probe ومنع retry storms.
8. ابدأ واجهة 1.0.1 Mobile-first وBottom Navigation بعد ثبوت العقود الجديدة حيًا.
9. أبقِ WebKit/playback/Range/CORS/download/matches/news/category-pagination regressions إلزامية عند كل PR.
10. جهّز PWA وDiagnostics بعد استقرار runtime/UI؛ لا تبدأ Flutter ولا تعلن 1.0.1 Ready قبل اكتمال البوابات الحية الكاملة.
