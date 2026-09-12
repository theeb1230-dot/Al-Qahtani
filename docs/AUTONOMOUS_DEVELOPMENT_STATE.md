# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live runtime evidence and user device screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Product merge on `main`: `61029a2ec6b39f08a3f4613dd231dafbe0bef0bf` (merged PR #79: native media priority for iPhone playback/download regression slice).
- This documentation-only update may advance `main` above that product commit without requiring a new product version/release.
- Latest verified product release: `v1.0.8`, target `61029a2ec6b39f08a3f4613dd231dafbe0bef0bf`, version/build `1.0.8+8`.
- Active PR: none.
- Web/PWA remains GitHub Pages and is not replaced by Flutter Web.

## Four-surface policy
Every product-impacting merge is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. The three native packages must come from the same commit/version and appear together in a real GitHub Release with checksums/provenance. Actions artifacts alone never count as a release.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani Runtime only. Basri/Akwam access remains server-side. Never leak Worker/session/upstream/media URLs to UI or logs; preserve SSRF allowlists and opaque references.

## Verified release v1.0.8
- URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.8`.
- Target: `61029a2ec6b39f08a3f4613dd231dafbe0bef0bf`.
- Mobile APK: `Al-Qahtani-Mobile-v1.0.8.apk`, 54,277,122 bytes, SHA-256 `dabc828678188a804f9e1bbe65e22748ef821ebdda11e75d37d9aa96f31cf769`.
- TV APK: `Al-Qahtani-TV-v1.0.8.apk`, 54,277,234 bytes, SHA-256 `d0fb3f18f57966a34d5418d360284d0b2b81989d45105fdb082b29223208e9e5`.
- iOS: `Al-Qahtani-iOS-v1.0.8-UNSIGNED.ipa`, 7,460,252 bytes, SHA-256 `b9d9964b20a364c3e723c211ee6c9e6456e4ee3db0b0b3d7901c40cd6d1eccbb`; UNSIGNED/no-codesign and requires external signing/provisioning.
- `SHA256SUMS.txt`: 287 bytes, SHA-256 `01f68c9505f28baed6d3257f22521c886f23d7d03949fe002ca47f2acec3d6a0`.
- `PROVENANCE.json`: 575 bytes, SHA-256 `bedc83abac9cb536df1b98228951297c58618e7f30ccc18b61c1bf39c24d18a7`.
- Historical `v1.0.5` remains RELEASE NOT PUBLISHED and must not be reconstructed or described as published.

## Current run: iPhone playback/download root-cause slice
User device evidence showed episode playback reaching the internal player then failing, and download failing without opening an external URL. Code inspection identified a concrete contract gap: direct Basri watch parsing ranked HLS before MP4. The opaque `/api/cinema/media` proxy streams an HLS manifest unchanged and does not rewrite relative segment/key URIs through opaque references. The existing iOS live probe validates initial bytes/container/Range response, not the complete HLS segment lifecycle, so it can mark HLS as playable without proving end-to-end playback. Downloading the same HLS media reference would save a playlist instead of a complete video.

PR #79 was completed on exact-final-head `b0ef233835aff826de2500c17596d7b7fe3aef84` and merged to product commit `61029a2ec6b39f08a3f4613dd231dafbe0bef0bf` after all protected checks were green.

Changes delivered:
- `server/basri-source.mjs`: deterministic `rankMediaCandidates`; MP4 is preferred over HLS when both are available, with HLS and MPEG-TS retained as fallbacks.
- `scripts/episode_number_test.mjs`: regression proving MP4 wins over HLS/TS when available and selected media type is consistent.
- `scripts/watch_parser_test.mjs`: aligned the older parser regression with the native-media policy while retaining HLS fallback and Matroska classification coverage.
- `flutter_app/pubspec.yaml`: version `1.0.8+8`.
- No upstream URL was exposed and no cross-project provider was introduced.

This is a bounded root-cause slice, not a claim that HLS-only playback/download is solved. HLS-only sources still require a safe manifest/segment/key proxy or another proven native-safe path. Physical iPhone playback remains NOT VERIFIED until device evidence exists.

## User screenshot/device issue matrix
1. Series episode playback: **PARTIAL FIX / NOT DEVICE VERIFIED**. MP4 now wins when available; HLS-only lifecycle remains unresolved.
2. Episode download: **PARTIAL FIX / NOT DEVICE VERIFIED**. MP4 selection avoids saving an HLS playlist when a native file exists; HLS-only download semantics remain unresolved.
3. Movie Details→Watch/Download: **PARTIAL / NOT DEVICE VERIFIED**. Exact-head and post-merge remote movie smokes passed through the same candidate-selection path, but broad movie/device coverage is not proven.
4. Flutter news empty while Web has news: **NOT VERIFIED**.
5. Matches logos/Arabic status/Saudi time/Match→Player: **NOT VERIFIED**.
6. Search blank for Arabic/English queries: **NOT VERIFIED**.
7. Episode UX engineering subtitle: **NOT FIXED**. Internal `episode_id`/`episode_number` separation must remain, but engineering copy must be removed from the user-facing UI.
8. Internal player valid source/start/seek/pause/resume/retry: **PARTIAL / NOT DEVICE VERIFIED**. Candidate selection improved; player behavior still requires live/device evidence.
9. Favorites add/remove/persistence/navigation: **NOT VERIFIED THIS RUN**; must not regress.
10. History/Continue Watching: **NOT VERIFIED**, dependent on real successful playback and progress.
11. Downloads library/progress/cancel/retry/file existence: **NOT VERIFIED**.
12. Home is too technical: **NOT FIXED / NOT VERIFIED**.
13. Arabic identity/RTL/typography consistency: **NOT VERIFIED**.
14. Web news article regression/back/images/date/overlay: **NOT VERIFIED**.
15. Web Safari player blank/iframe lifecycle/source switching: **NOT VERIFIED**.
16. Explicit loading/content/empty/retry/error states everywhere: **NOT VERIFIED**.
17. Web↔Flutter Runtime/normalization parity contracts: **NOT VERIFIED**.
18. Full four-surface path matrix including TV focus and degraded/offline behavior: **NOT VERIFIED**.

## CI / release evidence
- PR #79 exact-final-head product SHA: `b0ef233835aff826de2500c17596d7b7fe3aef84`.
- PR Flutter foundation run: `34700440423`, success for analyze/tests, Android Mobile, Android TV and iOS UNSIGNED.
- PR exact-head Live provider, Remote movie playback and Mobile WebKit passed before merge.
- Merge/product SHA: `61029a2ec6b39f08a3f4613dd231dafbe0bef0bf`.
- Post-merge Flutter foundation run: `34700736120`, success for analyze/tests, Android Mobile, Android TV and iOS UNSIGNED.
- Release workflow run: `34701006749`, `Release Flutter triplet`, success.
- Release verification: real `v1.0.8` GitHub Release exists with all required non-empty assets and target SHA matching the product merge.

## Release state
- `v1.0.4`: RELEASE VERIFIED.
- `v1.0.5`: RELEASE NOT PUBLISHED (historical gap).
- `v1.0.6`: RELEASE VERIFIED.
- `v1.0.7`: RELEASE VERIFIED.
- `v1.0.8`: RELEASE VERIFIED.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS classification, measured duration, opaque media refs, Watch versus Download semantics, real match logos, Saudi match time, episode_id versus episode_number, endless 30+30 pagination with dedupe/stale guards, CORS/SSRF/allowlists, zero ads/popups/unneeded tracking, no legacy Android Intent/deep-links, favorites persistence, TV D-Pad/focus, and UNSIGNED iOS labeling.

## Repository Website / Pages URL
- `https://theeb1230-dot.github.io/Al-Qahtani/`
- Repository homepage already points to the verified Pages URL.

## أهداف التشغيل التالي
1. **إنهاء HLS-only playback من الجذر.**
   - تصميم proxy آمن للـmaster/media manifests والsegment/key refs مع opaque IDs فقط.
   - اختبار relative/absolute URIs والredirects وheaders وRange عبر Runtime.
   - إثبات start/seek/pause/resume/retry على iOS/Android وعدم اعتبار first-byte probe كافيًا.
2. **فصل Watch وDownload semantics بالكامل.**
   - اختيار downloadable native file مستقل عن stream candidate عند توفرهما.
   - عدم اعتبار `.m3u8` تنزيل فيديو كاملًا إلا مع packaging آمن مثبت.
   - حماية progress/cancel/retry/file existence/trusted filename وعدم تسجيل failure كتنزيل.
3. **إصلاح News parity.**
   - مقارنة Web payload مع `/api/v1/news` وFlutter normalization/state.
   - إصلاح loading/error/empty والمقال والصورة والتاريخ والرجوع.
   - إضافة contract regression يمنع Web↔Flutter drift دون ربط Flutter بالمصدر مباشرة.
4. **إصلاح Search من الجذر.**
   - تتبع debounce→Runtime request→normalization→dedupe/stale guard→render.
   - اختبار العربية والإنجليزية وno-results والكتابة السريعة/cancellation.
   - منع الشاشة الفارغة عبر loading/content/explicit empty/retryable error.
5. **إصلاح Matches parity وMatch player.**
   - تمرير logos الحقيقية عبر proxy/allowlist المسموح فقط.
   - تعريب live/scheduled والوقت بصيغة السعودية وRTL وترتيب الفريقين.
   - إثبات Match→Player فعليًا بدل اعتبار metadata نجاحًا.
6. **تنظيف UX والهوية دون كشف الهندسة.**
   - إزالة شرح episode_id الداخلي من واجهة الحلقة مع إبقاء الفصل في النموذج.
   - تحويل Home من وصف تقني إلى أقسام محتوى عملية.
   - توحيد العربية/RTL والهوية والمسافات والtypography وإزالة overlays غير المقصودة.
7. **حماية Library state بعد نجاح playback.**
   - favorites add/remove/persistence/navigation regression.
   - history/continue progress بعد تشغيل حقيقي فقط مع resume/completed semantics.
   - downloads list/file existence/delete/retry دون سجلات كاذبة.
8. **تقوية Web Safari regressions.**
   - اختبار iframe/player lifecycle وsource switching/loading timeout/failure UI/CORS.
   - حماية Web news article back/images/date والعناصر العائمة/overlays.
   - عدم اعتبار ظهور صفحة player أو `Web Server 1` دليل تشغيل.
9. **إكمال matrix الأربع نسخ.**
   - Home/Matches/News/Search/Movies/Series/Details/Episodes/Watch/Download/Library.
   - pagination/error/retry/degraded/offline behavior.
   - TV D-Pad/focus وiOS no-codesign مع نفس Runtime contract.
10. **استكمال الخطة الهندسية بعد حماية الوظائف الحالية.**
   - الحفاظ على media-ref sweeper/rate limits/gzip/deflate/Vary/Content-Length.
   - الانتقال إلى providers.js v2/api-client health/retry/circuit-breaker/cache بعد فتح PR واحد جديد فقط.
   - إبقاء Cloudflare mirror مؤجلًا حتى توجد بنية وصلاحيات مثبتة وداخل حدود Al-Qahtani Runtime/Basri فقط.
