# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. `albasritv.github.io-main.zip` remains the preserved Basri behavioral baseline. Live deployment evidence is required before claiming Web/PWA parity.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and every Theeb provider/API.
- Historical `https://akwam.ss/...` URLs are allowed only because they are part of the original Basri cinema contract.
- Matches/news remain on original Basri sources. Cinema remains on the original Basri chain with secure server-side direct fallback to the historical Basri source when the origin-locked cinema Worker fails or returns unusable empty data.
- Flutter is blocked until Web/PWA 1.0.1 is proven live.

## Current repository state
- Main at run start: `3148b25621eda4a332fc1987a8daaa2991b44b40` (`Fix Saudi match times and logo layout`).
- No PR was open at run start.
- Active PR: #54 `Start Al-Qahtani 1.0.1 content runtime`.
- Branch: `feat/content-runtime-foundation-54`.
- Code head before this handoff update: `a89758d15c7676a01cc5e8f0fba164f93dee8428`.
- This handoff commit changes the final head, so every required workflow must rerun and pass on the new exact head before merge.

## Proven live product state before 1.0.1 work
Real iPhone Safari testing has proven that:
- movie/series/anime playback broadly works after the MPEG-TS/HLS compatibility path;
- native iOS controls, fullscreen and seeking work on multiple sources;
- fake 43200-second HLS duration was removed and bounded transport timestamp probing is used when trustworthy;
- Range transport remains protected by 206 / `Content-Range` / `Accept-Ranges` regressions;
- real match team logos are fetched through the bounded Al-Qahtani backend proxy;
- match times are displayed as Saudi time and the previously clipped logo layout is fixed;
- episode display numbers are normalized separately from source/internal IDs across multiple live categories;
- abnormal cinema/watch candidates are filtered generically by MIME/magic/watchability rather than title blacklist;
- explicit Download behavior remains separate from normal playback.

These are protected regressions. Do not rewrite them without evidence of a new defect.

## 1.0.1 roadmap status
Target release: Web/PWA `1.0.1`.

### Phase 1 — Content Runtime
Status: IN PROGRESS.

PR #54 introduces a deliberately small, reviewable runtime foundation:
- `server/content-runtime.mjs` defines `PRODUCT_VERSION = 1.0.1`;
- bounded `TtlCache` primitive for short-lived catalog/match metadata caching;
- `ProviderHealthRegistry` with success/failure tracking, latency-aware scoring, capabilities, bounded circuit-breaker cooldown and source ranking;
- normalized catalog, episode and match contracts;
- a stable runtime envelope carrying version/source/cache/health metadata without exposing upstream secrets;
- `scripts/content_runtime_test.mjs` covers TTL expiry/eviction, provider ranking, circuit opening/recovery, catalog normalization, episode ID vs display-number separation, match normalization and 1.0.1 envelope metadata;
- `.github/workflows/content-runtime.yml` adds a dedicated runtime regression gate.

The foundation is not wired into the live HTTP routes yet. Existing `/api/matches`, `/api/cinema/*`, media proxy and playback behavior remain unchanged in PR #54 by design. The next Phase-1 PR should integrate these primitives into the backend incrementally, beginning with read-only normalized contracts and short metadata caches rather than a big-bang rewrite.

## CI evidence from PR #54 before this handoff commit
First code head `d77409cbdee7878c398d9f0404eac2361ddbac4d`:
- new Content runtime workflow passed;
- Web smoke failed because the repository-wide independence grep correctly found forbidden integration-name literals inside the new test/workflow themselves. This was a test design false positive, not a product integration.

Fix on same branch:
- removed the duplicated forbidden-name literals from the test/workflow and relied on the repository-wide existing guard;
- final code head before docs: `a89758d15c7676a01cc5e8f0fba164f93dee8428`.

Observed success on that code head before this documentation update:
- Content runtime `34662517465` success;
- Web smoke `34662517433` success;
- CORS boundary `34662517421` success;
- Remote CORS smoke `34662517410` success;
- Trusted download filename `34662517420` success;
- Media reference expiry `34662517468` success;
- Original Basri download contract `34662517429` success;
- Original Basri player contract `34662517460` success;
- Remote movie playback smoke `34662517417` success.

At handoff-write time, Live provider smoke `34662517422` and Mobile WebKit `34662517452` were still running. Because this documentation commit creates a new head, those runs are not sufficient for merge anyway; require a full fresh final-head set.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains intact.
- Upstream media URLs remain behind short-lived opaque references.
- Source/media allowlists and SSRF protections stay mandatory.
- No arbitrary browser-supplied proxy targets.
- Worker/session material stays server-side.
- Referer values remain ASCII/URL-safe.
- Normal playback never inherits upstream attachment semantics; explicit Download keeps trusted attachment behavior.
- Ads/popups/unneeded tracking and legacy Android Intent/deep-link handoff remain prohibited.
- Render workspace ownership remains ambiguous unless repository evidence identifies the correct workspace; never guess.

## 1.0.1 readiness
Current readiness: FOUNDATION / NOT RELEASE READY.

Not yet complete:
- live runtime route integration;
- `/api/home` or equivalent unified home contract;
- unified normalized search/title/episodes/play contracts;
- live source health ranking/circuit-breaker integration;
- bounded metadata caching in production routes;
- redesigned mobile-first UI/navigation;
- Player 2.0 history/favorites/continue-watching features;
- unified search/library UX;
- installable PWA/service worker/offline shell;
- diagnostics/observability surface;
- complete 1.0.1 live release gate and tag/release.

## أهداف التشغيل التالي
1. **إغلاق PR #54 بأمان**
   - افحص الرأس النهائي بعد تحديث هذا الملف.
   - انتظر كل workflows المطلوبة بما فيها Content runtime وLive provider وMobile WebKit.
   - أصلح أي failure من logs على نفس الفرع فقط.
   - ادمج فقط بعد خضرة الرأس النهائي.

2. **دمج Content Runtime مع backend دون كسر العقود القديمة**
   - استورد normalization/health primitives في `server/app.mjs` تدريجيًا.
   - أبقِ `/api/matches` و`/api/cinema/*` القديمة متوافقة أثناء الانتقال.
   - أضف عقدًا normalized جديدًا واحدًا أولًا بدل تغيير كل routes دفعة واحدة.

3. **إنشاء runtime health فعلي للمصادر الأصلية**
   - سجل latency/success/failure للـBasri worker/direct paths.
   - طبّق circuit breaker bounded دون retry storm.
   - لا تعرض URL أو token في health payload.

4. **إضافة metadata cache قصير وآمن**
   - cache للمباريات/البحث/التصنيفات فقط بمدد قصيرة.
   - no-cache للmedia refs والجلسات والبيانات الحساسة.
   - أضف regressions للـexpiry والeviction وعدم cache للوسائط.

5. **إنشاء `/api/home` أو عقد home مكافئ**
   - اجمع حالة المباريات وأقسام المحتوى بصورة bounded.
   - اسمح بفشل جزئي صادق بدل إسقاط الصفحة كلها.
   - حافظ على مصدر كل جزء وhealth metadata المنقحة.

6. **بناء عقود title/episodes/play موحدة**
   - افصل `episode_id` عن `episode_number` رسميًا.
   - وحّد movie/series details دون تسريب upstream hrefs غير الضرورية.
   - حافظ على opaque media references ومسار Download الحالي.

7. **بدء واجهة 1.0.1 Mobile-first بعد ثبوت runtime contracts**
   - صمم الرئيسية + bottom navigation RTL.
   - حافظ على صفحة المباريات الحالية كمرجع وظيفي حتى ينجح البديل.
   - أضف skeleton/error/retry states دون إخفاء failures الحقيقية.

8. **تحسين Live matches تدريجيًا**
   - countdown من Saudi time normalization الحالي.
   - polling bounded عند حلول الموعد فقط.
   - status للبث المتاح/غير المتاح دون الثقة العمياء في `priority`.

9. **حماية playback أثناء التوسع**
   - أبقِ Mobile WebKit وremote playback وRange/CORS/download gates إلزامية.
   - اختبر MP4/HLS/MPEG-TS ومدة/seek قبل أي Player 2.0 feature.
   - لا تعتبر نجاح Download أو Range وحده إثبات playback UX.

10. **تجهيز PWA/Diagnostics بعد استقرار runtime + UI**
   - manifest/service-worker shell بدون cache للفيديو أو media refs.
   - diagnostics منقحة تعرض version/commit/runtime health فقط.
   - لا تعلن 1.0.1 Ready أو تبدأ Flutter قبل اكتمال البوابات الحية الكاملة.
