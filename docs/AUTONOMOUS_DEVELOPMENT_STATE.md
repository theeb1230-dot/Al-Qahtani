# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Current main: `27a143f3ece91ce6e71341f859c6566c5c1fc7f8` (merged PR #80).
- Latest verified package release: `v1.0.9`, target `27a143f3ece91ce6e71341f859c6566c5c1fc7f8`, version/build `1.0.9+9`.
- Active PR: #81 `Recover non-empty deployed news runtime`.
- Active branch: `fix/news-runtime-live-81`.
- Active PR head before this documentation update: `55816e06307573077dc43652af46416055de569e`.
- Active product version: `1.0.10+10`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Render `al-qahtani-api` auto-deployed exact main `27a143f3...` and runs `node server/index.mjs`.

## Four-surface policy
Every product-impacting merge is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. Native packages must come from the same commit/version and appear together in a real GitHub Release with SHA-256/provenance. Actions artifacts alone never count as a release.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. `akwam.ss` is allowed only server-side as inherited Basri behavior. Flutter consumes Al-Qahtani Runtime/API only. Never expose raw upstream URLs, Worker/session material, or media source URLs in Flutter/UI/logs. Preserve SSRF allowlists, opaque media refs, CORS and Range semantics.

## RELEASE VERIFIED v1.0.9
- URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.9`.
- Target: `27a143f3ece91ce6e71341f859c6566c5c1fc7f8`.
- `Al-Qahtani-Mobile-v1.0.9.apk`: 54,342,658 bytes; SHA-256 `16fc4be7426d8113c5690d813e391393fac0b2516a776b391a52127b67c53d1f`.
- `Al-Qahtani-TV-v1.0.9.apk`: 54,342,770 bytes; SHA-256 `af14c4de64cf7bad9f075e4471d4f007b79b8ce3379ce338253f4ee97fcb1c8c`.
- `Al-Qahtani-iOS-v1.0.9-UNSIGNED.ipa`: 7,463,574 bytes; SHA-256 `f8f8541154a03bb9f20226fe2934f3616aee480bffad0d85cdd8d3049a7bbd38`; UNSIGNED/no-codesign and requires external signing/provisioning.
- `SHA256SUMS.txt` and `PROVENANCE.json` are present and non-empty.
- Important regression evidence: the first post-merge `Remote news smoke` failed on this exact release commit because `/api/v1/news` returned success with zero items. Therefore v1.0.9 packages are verified as release assets, but Flutter News parity is NOT fixed in v1.0.9.
- Historical `v1.0.5` remains RELEASE NOT PUBLISHED and must not be represented otherwise.

## PR #81 root cause and recovery
The post-merge Remote news run `34701599861` failed with a zero-item list after Render was already live on exact merge commit `27a143f3...`, proving this was not deploy lag. Safe diagnostics then established the inherited News worker root currently returns only metadata (`status`, `name`, `source`, `article`) while `?action=source` returns a full ~156 KB Arabic news page containing 15 real cards, `YS_NEWS_BRIDGE`, and an `ItemList`.

Current PR #81 changes:
- bumps product to `1.0.10+10`;
- `server/news-runtime.mjs` now uses root JSON when it actually contains items, otherwise server-side fetches the inherited `action=source` HTML;
- source parsing extracts only same-origin HTTPS `/ar/news/<numeric-id>/...` article links using the page canonical origin, preserving title/date/lead and converting source URLs immediately to short-lived opaque refs;
- no source article URL is returned to Flutter/UI/logs;
- JSON-LD ItemList remains a fallback if card markup changes;
- `scripts/news_runtime_test.mjs` covers metadata-only root, HTML fallback, canonical-origin/path validation, opaque refs, title/date/description normalization, article resolution and ref expiry;
- `Remote news smoke` is now a required gate in `.github/workflows/release-triplet.yml`, preventing another package release when deployed News is empty;
- temporary live diagnostic files were removed after establishing the root cause.

## User screenshot/device issue matrix
1. Series playback / Reacher: **PARTIAL FIX / NOT DEVICE VERIFIED**. MP4 is preferred when available; HLS-only segment/key lifecycle remains unresolved.
2. Episode download: **PARTIAL FIX / NOT DEVICE VERIFIED**. MP4-first helps file downloads; HLS-only download semantics remain unresolved.
3. Movie Details→Watch/Download: **NOT VERIFIED** for the reported titles/classes; generic live movie smoke is green but not sufficient for every media variant.
4. Flutter News empty while Web has news: **ROOT CAUSE FOUND / FIX IN PR #81 / NOT LIVE VERIFIED**. v1.0.9 live smoke reproduced the empty Runtime list; source HTML fallback is implemented in v1.0.10 candidate.
5. Matches: **PARTIAL FIX / NOT DEVICE VERIFIED**. Status/time localization exists; real logos, Saudi formatting and Match→Player remain open.
6. Search blank Arabic/English: **FIXED IN CODE / NOT DEVICE VERIFIED**. Debounce, stale-response guard, loading/empty/error/retry states merged in v1.0.9.
7. Episode engineering text: **FIXED IN CODE / NOT DEVICE VERIFIED**.
8. Internal player valid source/start/seek/pause/resume/retry: **PARTIAL / NOT DEVICE VERIFIED**.
9. Favorites add/remove/persistence/navigation: **WORKING BASELINE / REGRESSION TESTED / DEVICE RECHECK PENDING**.
10. Continue Watching/history: **NOT VERIFIED** until a real successful playback session records progress.
11. Downloads library/progress/cancel/retry/file existence: **NOT VERIFIED** until a real download completes.
12. Technical Home screen: **OPEN**.
13. Arabic identity/RTL/typography consistency: **OPEN**.
14. Web news article/back/images/date/floating overlay: **PARTIAL**. List/date/lead recovery is in PR #81; secure image parity and overlay investigation remain open.
15. Safari Web Server 1 white/blank player: **OPEN / NOT VERIFIED**.
16. Explicit request states: **PARTIALLY FIXED** for Search/News; remaining screens need audit.
17. Web↔Flutter Runtime normalization parity: **PARTIAL**; News now has dedicated local + deployed contract gates.
18. Full four-surface E2E path matrix: **OPEN**.

## CI / deployment evidence
- PR #80 exact-final-head `c692a655222539417586927ca4cafad029df920c` passed Web smoke, Mobile WebKit, Content runtime, Live provider, Remote movie playback, Basri player/download, CORS, media-ref expiry, trusted filename and Flutter Mobile/TV/iOS jobs before merge.
- Render deploy `dep-daimod95efls7393g3l0` became LIVE on exact main `27a143f3...` before Remote news smoke failure.
- Post-merge Remote news run `34701599861`: FAILED solely because deployed news list count was zero and no opaque article ref existed.
- Diagnostic run `34701961141` and follow-up run `34702174322`: SUCCESS; proved root metadata-only JSON and 15-card source HTML without logging source URLs.
- PR #81 exact-final-head CI must be re-read after this documentation update; previous-head results are stale for merge.
- `v1.0.10`: **RELEASE NOT PUBLISHED** while PR #81 is open. Merge only after exact-final-head green, then require deployed Remote news success, Pages/runtime gates, native triplet and complete Release verification.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS classification, measured duration, opaque media refs, independent Watch/Download semantics, News opaque refs/non-empty live list, real match logos, Saudi match time, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no legacy Android Intent/deep-links, favorites persistence, TV D-Pad/focus, and UNSIGNED iOS labeling.

## أهداف التشغيل التالي
1. **إغلاق PR #81 بأمان.**
   - قراءة exact-final-head CI بعد آخر تحديث وثائقي.
   - إصلاح أي failure من logs على نفس الفرع فقط.
   - الدمج فقط عندما يكون PR mergeable وجميع البوابات المطلوبة خضراء.
2. **إثبات News recovery حيًا.**
   - انتظار Render exact merge commit بعد الدمج.
   - Require `Remote news smoke` non-empty list + opaque ref + article text.
   - التحقق من عدم ظهور أي source/Worker URL في Runtime أو Flutter.
3. **إكمال v1.0.10 كإصدار فعلي.**
   - بناء Mobile APK + TV APK + IPA UNSIGNED من merge commit/version نفسه.
   - التحقق من identity/signature/LEANBACK/Payload/no-codesign وSHA-256.
   - التحقق من GitHub Release tag/target/assets/sizes بعد الرفع.
4. **إضافة News image parity بأمان.**
   - تصميم opaque image reference/proxy مع allowlist بدل كشف `img src` upstream.
   - عرض الصورة في Flutter list/article مع error fallback.
   - إضافة Web↔Runtime↔Flutter contract regression للصورة والتاريخ والرجوع.
5. **إنهاء HLS-only playback من الجذر.**
   - تصميم manifest/segment/key proxy آمن أو مسار native مثبت بلا upstream leakage.
   - اختبار relative/absolute URIs وredirects وstart/seek/resume.
   - إثبات iOS/Android device behavior بدل first-byte probe فقط.
6. **فصل Watch وDownload semantics بالكامل.**
   - اختيار downloadable file مستقل عن stream عند توفرهما.
   - عدم اعتبار `.m3u8` تنزيل فيديو كاملًا بلا packaging مثبت.
   - حماية progress/cancel/retry/persistence والاسم الموثوق.
7. **إكمال Matches وMatch→Player.**
   - عرض logos الحقيقية فقط عبر proxy المسموح.
   - ضبط توقيت السعودية وRTL وترتيب الفريقين.
   - إثبات Match→Player playback بدل metadata فقط.
8. **تنظيف Home والهوية وحالات الطلب.**
   - استبدال الصفحة التقنية بأقسام محتوى عملية.
   - توحيد الاسم العربي وRTL والـtypography والمسافات.
   - تعميم loading/content/empty/retryable-error وإزالة أي overlay غير مقصود.
9. **حماية Library بعد نجاح media.**
   - favorites add/remove/persistence/navigation regression.
   - history/continue progress بعد تشغيل حقيقي فقط مع resume/completed semantics.
   - downloads list/file existence/delete/retry دون سجلات كاذبة.
10. **متابعة hardening وخطة providers v2.**
   - الحفاظ على sweeper/rate limits/gzip/Vary/Content-Length وRange/HLS.
   - بعد إغلاق #81/v1.0.10 مراجعة `providers.js` v2 و`api-client.js` health/retry/circuit-breaker/cache باختبارات.
   - إبقاء Cloudflare mirror مؤجلًا حتى وجود بنية وصلاحيات مثبتة داخل حدود Al-Qahtani/Basri فقط.
