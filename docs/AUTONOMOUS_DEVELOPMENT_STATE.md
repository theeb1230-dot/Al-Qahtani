# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` archive remains the behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Current state
- Main: `1e183c79a0f7da12a6742ab9d63255078cf73d48` (`Make deployed search gate source-aware`).
- PR #57 merged and introduced the deployed 1.0.1 runtime-contract gate.
- PR #59 merged and corrected that live gate so an English source query may truthfully return an empty normalized result rather than forcing stale/download-only content.
- Active PR: #58 `Load cinema categories beyond the first 30 items`.
- Branch: `test/remote-runtime-v1-57` (reused after #57; this is the only active PR branch and must remain the only development branch used until #58 closes).
- PR #58 was originally based on `53d70fae870c7346ea406a19362fa928c4b92915`; its pagination work was later merged with that main state at `e20aae46acd837c0fc2464518266f96f4cdcd99e`. After main advanced through #59, the branch copy of `scripts/remote_runtime_v1_smoke.mjs` was explicitly synchronized with current main so #58 cannot reintroduce the old over-strict `The Odyssey` assertion.
- Target: Web/PWA `1.0.1`.
- Flutter remains blocked until Web/PWA 1.0.1 is proven live across the required release gates.

## Product boundary
Al-Qahtani is fully independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and all Theeb-specific APIs/providers. `https://akwam.ss/...` is allowed only because it belongs to the preserved original Basri source contract. No Theeb fallback or cross-project runtime dependency is allowed.

## Protected live behavior
Real iPhone Safari testing has already proven working playback across multiple movie/series/anime samples after the MPEG-TS/HLS path. Safari Range/206, MIME/magic container detection, opaque media references, explicit Download behavior, measured-duration logic, match logos, Saudi match times, and separated episode display numbering are protected regressions and must not be casually reworked.

## 1.0.1 Phase 1 progress merged to main
- `server/content-runtime.mjs`: product version `1.0.1`, bounded TTL cache, provider-health/circuit primitives, normalization helpers.
- `server/content-runtime-service.mjs`: normalized matches/search/category service, bounded metadata cache and health accounting.
- additive HTTP contracts in `server/app.mjs`: `/api/runtime/status`, `/api/v1/matches`, `/api/v1/search?q=...`, `/api/v1/category?ref=...&p=...`.
- old `/api/matches` and `/api/cinema/*` routes remain available during migration.
- deterministic local route regressions plus a post-merge deployed runtime contract workflow.

## Live evidence after PR #59
Main `1e183c79a0f7da12a6742ab9d63255078cf73d48` ran `Remote runtime v1 smoke` as run `34664018567` and completed successfully against the deployed backend:
- `/api/runtime/status`: HTTP 200, version `1.0.1`, no sensitive/session fields exposed.
- `/api/v1/matches`: 30 normalized matches from `basri-matches`; second request reported `cached: true`.
- `/api/v1/search?q=الذئب الوحيد`: 4 normalized real items from `basri-direct`.
- `/api/v1/search?q=The%20Odyssey`: valid normalized `1.0.1` search contract from `basri-direct`, current source count `0`; this is recorded honestly instead of manufacturing stale/archive/download-only content.
- `/api/v1/category`: 24 real normalized items from `basri-direct`.
- health summary remained structured and sanitized for `basri-direct` and `basri-matches`.

The previous live run `34663761975` failed only because its test required `The Odyssey` to be non-empty; transport/runtime/cache/category/Arabic-search evidence in that run was otherwise healthy. PR #59 fixed the test semantics, not the source data.

## PR #58 — endless category loading in 30-item batches
Requirement: movie and series categories must not stop at the first 30 items. When the user reaches the category tail, load the next batch and continue until the original Basri source itself ends.

Implemented on the active PR branch:
- `web/core/api-client.js` accepts a positive page in `getCinemaCategory(...)` and forwards `p` through the existing Al-Qahtani backend route.
- `albasri-cinema.html` uses an `IntersectionObserver` sentinel at the category tail.
- page 1 renders first; reaching the tail requests page 2, then page 3 and later pages without a fixed UI page count.
- `categoryLoading` prevents concurrent duplicate requests.
- `categoryRequestId` discards stale responses after navigation/search/home transitions.
- `categorySeen` deduplicates repeated upstream items and helps stop duplicate-page loops.
- search resets category paging state.
- appended cards reuse the existing details/player/download flow exactly like page 1.
- `scripts/category_infinite_scroll_test.mjs` protects forwarding, observer setup, sequential paging, deduplication, stale-response handling and 30-item UX semantics.
- `scripts/category_infinite_webkit_smoke.mjs` uses an iPhone WebKit profile, mocks two 30-item pages, scrolls to the category tail, requires 60 rendered cards, confirms `p=2`, verifies item 60 and rejects duplicates.
- Content runtime and Mobile WebKit workflows execute these new regressions.

## CI state for PR #58
Only checks attached to the final actual head count for merge. Earlier green jobs on `c93afcd0e980885f9339112e4a3262cb64571714` are historical because the branch moved afterward. After main advanced through #59, `scripts/remote_runtime_v1_smoke.mjs` was synchronized onto #58 so the branch preserves the source-aware search gate. Fresh workflows triggered by this synchronization/documentation head must become green before merge.

## Render evidence / blocker
The connected Render account currently exposes two workspaces, `My Workspace` and `بيانات`. Repository evidence still does not prove which workspace owns Al-Qahtani. Per project rules, no workspace is guessed and no direct Render service/log claim is made. External deployed HTTP/GitHub Actions evidence remains authoritative until workspace ownership is proven.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains intact.
- Runtime migration stays additive until live parity proves replacements safe.
- Category paging remains server-routed; the browser does not become an arbitrary upstream fetcher.
- Upstream media URLs remain behind short-lived opaque references.
- Source/media allowlists and SSRF/DNS/host protections stay mandatory.
- No arbitrary browser-supplied proxy target is accepted.
- Worker/session material remains server-side.
- Referer values remain ASCII/URL-safe.
- Metadata cache never caches video streams, media references, sessions, or Download responses.
- Normal playback never inherits upstream attachment semantics; explicit Download keeps trusted attachment behavior.
- Ads/popups/unneeded tracking and legacy Android Intent/deep-link handoff remain prohibited.

## 1.0.1 readiness
Current readiness: **Phase 1 runtime deployed; category UX expansion in PR #58; NOT release ready.**

Still required before `1.0.1` can be called ready: close #58 with final-head green gates and live page-2+ proof; opaque server-side category identifiers; unified home/title/episodes/play contracts; production health/circuit decisions; full mobile-first RTL interface; live matches UX; Player 2.0 local history/favorites/continue-watching; unified search/library UX; installable PWA; diagnostics/observability; and the complete Safari/security/live release matrix.

## أهداف التشغيل التالي
1. **إغلاق PR #58 بأمان.**
   - فحص جميع البوابات على الرأس النهائي الفعلي بعد مزامنة بوابة البحث والوثائق.
   - جلب logs لأي failure وإصلاحه على نفس الفرع فقط.
   - الدمج فقط بعد نجاح البوابات المطلوبة وعدم وجود regression من #59.
2. **إثبات pagination حيًا بعد الدمج.**
   - انتظار GitHub Pages/backend لنفس commit قدر ما تسمح الأدوات.
   - التحقق من انتقال التصنيف من أول 30 عنصرًا إلى الدفعة التالية عند وجودها.
   - إثبات عدم التكرار وعدم إرسال طلبات page متزامنة مكررة على WebKit.
3. **إخفاء روابط التصنيفات الأصلية خلف IDs داخلية.**
   - تعريف مفاتيح ثابتة للتصنيفات الرئيسية داخل Backend.
   - تحويل المفتاح إلى رابط Basri المسموح server-side فقط.
   - رفض أي category key مجهول وعدم توسيع arbitrary URL surface.
4. **إنشاء `/api/v1/home` موحد.**
   - جمع المباريات وأقسام محتوى محدودة بـbounded concurrency.
   - السماح بفشل جزئي دون إسقاط الصفحة كاملة.
   - تطبيق TTL قصير مناسب وإرجاع metadata منقحة.
5. **إنشاء عقود موحدة للتفاصيل والحلقات.**
   - إضافة title/details contract باستخدام opaque refs.
   - إبقاء `episode_id` منفصلًا عن `episode_number` وتطبيع الموسم والترتيب.
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
   - إبقاء البحث العربي والإنجليزي كعقد دون اختلاق نتائج غير موجودة في المصدر.
   - استمرار فحص SSRF/allowlists/secrets/Referer وفلترة download-only.
10. **تهيئة PWA وDiagnostics والبوابة النهائية للإصدار.**
   - manifest/service-worker للـstatic shell والmetadata فقط دون video/media-ref caching.
   - diagnostics منقحة تعرض version/commit/readiness/health بلا secrets.
   - عدم إنشاء Tag/Release `1.0.1` وعدم بدء Flutter قبل اكتمال كل البوابات الحية.
