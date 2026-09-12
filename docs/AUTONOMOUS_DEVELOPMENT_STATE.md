# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live runtime evidence and user device screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Current main: `f2c842b60cf5372ca46f6aa09bd375d4b59272bd` (product state is still the v1.0.7 merge plus two docs-only commits that created then immediately removed an accidental temporary plan file; no product behavior changed in those two commits).
- Latest verified product release: `v1.0.7`, target `3773d521ebf46bebcf1d7889601d7f222bf7e18e`, version/build `1.0.7+7`.
- Active PR: #79 `Prefer native media for iPhone playback and downloads`.
- Active branch: `feat/playback-media-108`.
- Active PR head before this documentation update: `a79421e246861afbe47fbcdad840ea918c9527f3`.
- Active product version: `1.0.8+8`.
- Web/PWA remains GitHub Pages and is not replaced by Flutter Web.

## Four-surface policy
Every product-impacting merge is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. The three native packages must come from the same commit/version and appear together in a real GitHub Release with checksums/provenance. Actions artifacts alone never count as a release.

## Product boundary
Al-Qahtani remains independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani Runtime only. Basri/Akwam access remains server-side. Never leak Worker/session/upstream/media URLs to UI or logs; preserve SSRF allowlists and opaque references.

## Verified release v1.0.7
- URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.7`.
- Target: `3773d521ebf46bebcf1d7889601d7f222bf7e18e`.
- Mobile APK: `Al-Qahtani-Mobile-v1.0.7.apk`, 54,277,122 bytes, SHA-256 `e541f623974586c570cbb2acd914f01a23aae55576702c35b64d40d61453922c`.
- TV APK: `Al-Qahtani-TV-v1.0.7.apk`, 54,277,234 bytes, SHA-256 `40bed231c9927001cb821898e78c8c5218e9ea3404beabf2857d63c899112896`.
- iOS: `Al-Qahtani-iOS-v1.0.7-UNSIGNED.ipa`, 7,460,253 bytes, SHA-256 `2a4cb6e4e1f4c808dbd1dbecb1dcf6fc8de02040ff42b2309fde8b96c591423d`; UNSIGNED/no-codesign and requires external signing/provisioning.
- `SHA256SUMS.txt` and `PROVENANCE.json` are present and non-empty.
- Historical `v1.0.5` remains RELEASE NOT PUBLISHED and must not be reconstructed or described as published.

## Current run: iPhone playback/download root-cause slice
User device evidence showed episode playback reaching the internal player then failing, and download failing without opening an external URL. Code inspection found a concrete contract gap: direct Basri watch parsing intentionally ranked HLS before MP4. The opaque `/api/cinema/media` proxy streams an HLS manifest unchanged and does not rewrite its segment/key URIs through opaque references. The existing iOS live probe only validates the first bytes/container/Range response, so it can mark HLS as playable without proving the full segment lifecycle. Downloading the same HLS media reference would save a playlist rather than a real media file.

Changes in PR #79:
- `server/basri-source.mjs`: added deterministic `rankMediaCandidates`; MP4 is preferred over HLS when both are available, while HLS and MPEG-TS remain fallbacks.
- `scripts/episode_number_test.mjs`: added a regression proving MP4 wins over HLS/TS when present and `parseWatch` reports consistent MP4 type.
- `flutter_app/pubspec.yaml`: bumped to `1.0.8+8`.
- No upstream URL is exposed and no cross-project provider was introduced.

This is a bounded root-cause slice, not a claim that HLS-only playback/download is solved. HLS-only sources still require manifest/segment/key proxy design or another proven native-safe path. Physical iPhone playback remains NOT VERIFIED until device evidence exists.

## User screenshot/device issue matrix
1. Series episode playback: **PARTIAL FIX / NOT DEVICE VERIFIED**. MP4 now wins when available; HLS-only lifecycle remains unresolved.
2. Episode download: **PARTIAL FIX / NOT DEVICE VERIFIED**. MP4 selection avoids saving HLS playlist when a native file exists; HLS-only download semantics remain unresolved.
3. Movie Details→Watch/Download: **NOT VERIFIED**. It uses the same candidate-selection path and may benefit, but requires live/movie/device evidence.
4. Flutter news empty while Web has news: **NOT VERIFIED**.
5. Matches logos/Arabic status/Saudi time/Match→Player: **NOT VERIFIED**.
6. Search blank for Arabic/English queries: **NOT VERIFIED**.
7. Episode UX engineering subtitle: **NOT FIXED**. Mobile still displays `رقم الحلقة منفصل عن معرف المصدر الداخلي`; internal ID separation must remain but this copy must be removed from UI.
8. Internal player valid source/start/seek/pause/resume/retry: **PARTIAL / NOT DEVICE VERIFIED**. Candidate selection improved; player behavior still requires device/live evidence.
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

## CI / evidence for active PR
- PR #79 head product SHA: `a79421e246861afbe47fbcdad840ea918c9527f3` before this docs-only update.
- Live provider run: `34700274496` (in progress at documentation time).
- Flutter foundation run: `34700274525` (queued at documentation time).
- Remote CORS run `34700274622`: success.
- Exact-final-head checks must be re-read after this documentation commit; never merge based on stale SHA evidence.

## Release state
- `v1.0.4`: RELEASE VERIFIED.
- `v1.0.5`: RELEASE NOT PUBLISHED (historical gap).
- `v1.0.6`: RELEASE VERIFIED.
- `v1.0.7`: RELEASE VERIFIED.
- `v1.0.8`: **RELEASE NOT PUBLISHED**. PR #79 is open and must become exact-final-head green, merge, pass post-merge Web/runtime/Pages/native gates, then create and verify the complete GitHub Release.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS classification, measured duration, opaque media refs, Watch versus Download semantics, real match logos, Saudi match time, episode_id versus episode_number, endless 30+30 pagination with dedupe/stale guards, CORS/SSRF/allowlists, zero ads/popups/unneeded tracking, no legacy Android Intent/deep-links, favorites persistence, TV D-Pad/focus, and UNSIGNED iOS labeling.

## Repository Website / Pages URL
- `https://theeb1230-dot.github.io/Al-Qahtani/`
- Repository homepage already points to the verified Pages URL.

## أهداف التشغيل التالي
1. **إغلاق PR #79 بأمان.**
   - إعادة قراءة كل checks على exact-final-head بعد تحديث هذه الوثيقة.
   - إصلاح أي failure على نفس الفرع أو إعادة flaky live job على نفس SHA قبل تغيير parser.
   - الدمج فقط عندما يكون mergeable وجميع البوابات المطلوبة خضراء.
2. **إكمال v1.0.8 كإصدار فعلي.**
   - بناء Mobile APK + TV APK + IPA UNSIGNED من merge commit/version نفسه.
   - التحقق من identity/signature/LEANBACK/Payload/no-codesign وSHA-256.
   - التحقق من GitHub Release tag/target/assets/sizes بعد الرفع؛ لا قبول artifact-only.
3. **إنهاء HLS-only playback من الجذر.**
   - تصميم proxy آمن للmanifest والsegment/key references أو مسار native مثبت دون كشف upstream.
   - اختبار master/media playlists وrelative/absolute URIs وredirects.
   - اختبار start/seek/resume على iOS/Android وعدم اعتبار first-byte probe كافيًا.
4. **فصل Watch وDownload semantics.**
   - اختيار downloadable file مستقل عن stream عند توفرهما.
   - رفض اعتبار `.m3u8` تنزيل فيديو مكتملًا إلا إذا نُفذ packaging آمن فعليًا.
   - حماية filename/progress/cancel/retry/persistence وعدم تسجيل failure كتنزيل.
5. **إصلاح News parity.**
   - مقارنة Web news payload مع `/api/v1/news` وFlutter normalization.
   - إصلاح loading/error/empty state والمقال والصورة/التاريخ والرجوع.
   - إضافة contract regression دون ربط Flutter بالمصدر مباشرة.
6. **إصلاح Search من الجذر.**
   - تتبع debounce→Runtime→normalization→dedupe/stale guard→render.
   - اختبار العربية والإنجليزية وno-results والكتابة السريعة/cancellation.
   - منع الشاشة الفارغة بإظهار loading/content/empty/retryable error.
7. **إصلاح Matches parity وMatch player.**
   - logos الحقيقية عبر proxy المسموح فقط.
   - تعريب live/scheduled والوقت بصيغة السعودية وRTL وترتيب الفريقين.
   - إثبات Match→Player بدل اعتبار metadata نجاحًا.
8. **تنظيف UX والهوية دون كشف الهندسة.**
   - إزالة شرح episode_id الداخلي من واجهة الحلقة مع إبقاء الفصل في النموذج.
   - تحويل Home من نص تقني إلى أقسام محتوى عملية.
   - توحيد العربية/RTL والهوية والمسافات والـtypography وإزالة overlays غير المقصودة.
9. **حماية Library state بعد نجاح playback.**
   - favorites add/remove/persistence/navigation regression.
   - history/continue progress بعد تشغيل حقيقي فقط مع resume/completed semantics.
   - downloads list/file existence/delete/retry دون سجلات كاذبة.
10. **إكمال الخطة الهندسية والأربع نسخ.**
   - الحفاظ على hardening: sweeper/rate limits/gzip/Vary/Content-Length.
   - بعد إغلاق دورة الإصدار الانتقال إلى providers.js v2/api-client health/retry/circuit-breaker/cache؛ Cloudflare mirror يبقى مؤجلًا.
   - تشغيل matrix للـWeb/PWA/Mobile/TV/iOS عبر Home/Matches/News/Search/Movies/Series/Details/Episodes/Watch/Download/Library/pagination/errors/degraded behavior.
