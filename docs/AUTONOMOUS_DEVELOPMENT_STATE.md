# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with repository state. The preserved original `albasritv.github.io-main.zip`, live Runtime/provider evidence, and the user's iPhone screenshots are behavioral references. CI alone does not prove a physical-device issue fixed.

## Current state
- Current `main`: `4d1aded879cf40f2506bd53c4d86a7a8299b9e1f`.
- Exactly one product PR is open: PR #85 `Unify Arabic identity and repair match/search playback UX`, branch `fix/identity-matches-player-84`.
- PR #84 was closed unmerged as a duplicate after the stronger PR #85 implementation became the canonical branch. Its useful catalog-poster Runtime-path fix/regression was ported to PR #85 before closure.
- Product version/build: `1.0.13+13`.
- Product head before this state-only commit: `866afaf724ebadf2e2152e2fe79df63a83f3d373`.
- Web/PWA remains GitHub Pages at `https://theeb1230-dot.github.io/Al-Qahtani/` and is not replaced by Flutter Web.
- Product boundary remains Al-Qahtani/Basri only. No akwam-indexer, Theeb Engine, THEEB_SERVICE_TOKEN, or other Theeb providers were introduced.

## RELEASE VERIFIED v1.0.12
- Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.12`.
- Target commit: `a0fceeead547a370f5c8a50243c008a99b3b6a86`.
- `Al-Qahtani-Mobile-v1.0.12.apk`: 54,342,654 bytes; SHA-256 `e05364b6b23ec65ca8cdc1b30af7f7795df7b5c19689256de0248af3fb716eb9`.
- `Al-Qahtani-TV-v1.0.12.apk`: 54,342,770 bytes; SHA-256 `778b69f1005c74704b40d2f8311791fab068444850b8b98585be93814819f9b8`.
- `Al-Qahtani-iOS-v1.0.12-UNSIGNED.ipa`: 7,463,582 bytes; SHA-256 `d3d643660a5123a15f83cf2f3b99224fa25d3dc48b05684ef5f1ec265bd4057`; explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.
- `SHA256SUMS.txt`: 290 bytes.
- `PROVENANCE.json`: 580 bytes.

## RELEASE NOT PUBLISHED v1.0.13
- PR #85 is not merged yet, therefore no v1.0.13 GitHub Release is claimed.
- Release is blocked until exact-final-head CI is green, the PR is merged to `main`, Pages is checked from that merge commit, and the release workflow produces and publishes all three artifacts from the same commit/version.

## Seven-problem batch status
1. **Arabic black/gold identity:** **FIX IN PR / NOT DEVICE VERIFIED.** Flutter and Web use the Arabic `القحطاني` identity and gold/black base. Native branding automation and release workflow hooks exist; final APK/TV/IPA inspection is required after merge.
2. **Incorrect match scores / fake 0-0:** **MISLEADING 0-0 SUPPRESSED / TRUE FINAL SCORE SOURCE STILL WRONG / NOT DEVICE VERIFIED.** A live probe against the inherited Basri matches Worker showed 23 ended matches, 22 of them returned literal `0`/`0`, including Racing Santander × Alavés, while one ended fixture returned a real 2-0. Runtime now treats ended 0-0 pairs from this broken feed as unavailable rather than presenting them as factual results, while preserving live 0-0 and non-zero ended/live scores. The true Racing 2-1 cannot be reconstructed from the current Worker payload and is not hard-coded.
3. **Remove technical home screen/menu:** **FIX IN CODE / NOT DEVICE VERIFIED.** Flutter starts on content sections and no RuntimeHome/navigation item is intended for users.
4. **Downloads:** **SERVER CONTRACT FIXED / DEVICE STILL FAILED-UNTIL-PROVEN.** Independent Watch/Download resolution remains in force, HLS-only download is fail-closed, and trusted filename/Range semantics are regression-protected. Progress/cancel/retry/persistence/file existence still require live-device proof.
5. **Playback:** **CONTRACT PARTIAL / DEVICE STILL FAILED-UNTIL-PROVEN.** Existing HLS/MP4/MPEG-TS proxy paths remain protected, but Reacher and real iPhone/Android start/seek/pause/resume/duration/retry are not physical-device verified.
6. **Search posters/dedupe:** **FIX IN PR + REGRESSION / NOT DEVICE VERIFIED.** Search/category catalog items resolve Runtime-relative poster paths against the Al-Qahtani API base and preserve dedupe/year. Placeholder remains only when poster is actually absent or fails. Upstream-image opacity/allowlist remains a security verification item and must not be claimed complete until the Runtime image contract is proven not to expose raw upstream URLs.
7. **Match→Player Web/Flutter:** **FIX IN PR + MATCH RUNTIME CONTRACT / NOT DEVICE VERIFIED.** PR #85 adds opaque match/server/media refs, a Web match player path, Flutter internal match player/server switching, HLS child proxying and Range passthrough. A real iPhone Safari/Flutter playback session is still required.

## Additional issue matrix
- Reacher season 4: **NOT PHYSICAL-DEVICE VERIFIED**.
- Movies Details→Watch/Download variants: **NOT DEVICE VERIFIED** despite generic remote movie smoke coverage.
- News parity: **LIVE CONTRACT BASELINE / DEVICE RECHECK PENDING**.
- Search state machine: **FIX IN CODE / DEVICE RECHECK PENDING**.
- `episode_id` vs `episode_number`: **REGRESSION PROTECTED** and must remain distinct.
- Favorites: **WORKING BASELINE / REGRESSION PROTECTED / DEVICE RECHECK PENDING**.
- Continue Watching/history: **NOT VERIFIED** until successful playback proves persistence semantics.
- Downloads library: **NOT VERIFIED** for local file existence/progress/cancel/retry/persistence.
- Web player lifecycle / old white `Web Server 1` panel: **CODE PATH REPLACED IN PR / PHYSICAL SAFARI NOT VERIFIED**.
- Explicit loading/content/empty/retryable states: **PARTIAL**.
- Web↔Flutter Runtime parity: **PARTIAL**.
- Four-surface E2E: **OPEN**.

## CI snapshot
- Exact-final-head CI must always be re-read from the current PR head immediately before merge. Previous heads are evidence only, never merge authority.
- Recent exact-head predecessors have passed Match runtime, Content runtime, Web smoke, WebKit, CORS, media-reference expiry, independent download resolution, Basri player/download and live-provider contracts except for failures already corrected on the same PR branch (Flutter const analysis, native-brand mask generation, and the iOS icon filename verification gate).
- The current head must independently pass the same set plus the live match-score probe and all four Flutter jobs before merge.
- No CI success alone is treated as physical-device proof.

## Protected regressions
Protect iPhone Safari/Web playback, Range/206, Content-Range/Accept-Ranges, MP4/HLS/MPEG-TS classification, HLS child/key/init opaque refs, measured duration, independent Watch/Download semantics, trusted filenames, News non-empty/opaque refs, match logos/Saudi time/score correctness, `episode_id` versus `episode_number`, endless 30+30 pagination with dedupe/concurrency/stale guards, CORS/SSRF/allowlists, no ads/popups/unneeded tracking, no Android Intent/deep-links for playback, favorites persistence, TV D-Pad/focus + LEANBACK, and UNSIGNED/no-codesign iOS labeling.

## أهداف التشغيل التالي
1. **إغلاق PR #85 بأمان.**
   - إعادة فحص كل CI على الرأس النهائي الفعلي.
   - إصلاح أي failure على نفس الفرع فقط.
   - الدمج فقط عندما تصبح البوابات المطلوبة خضراء.
2. **إتمام دورة v1.0.13 بعد الدمج.**
   - بناء APK Mobile وAPK TV وIPA UNSIGNED من نفس merge commit/version.
   - التحقق من manifest/applicationId/version/LEANBACK/no-codesign/SHA-256.
   - إنشاء GitHub Release فعلي والتحقق من الأصول والأحجام والتنزيل.
3. **التحقق من GitHub Pages من merge commit.**
   - فحص Pages/Web smoke/WebKit/CORS/Range/Download.
   - التحقق من مسار Match→Player الجديد في Safari.
   - إبقاء Web/PWA الحالي بدل Flutter Web حتى parity كاملة.
4. **إثبات Match→Player حيًا وعلى الجهاز.**
   - اختبار click/tap/loading/server switching/timeout.
   - اختبار HLS/MP4 source classification وRange.
   - توثيق Safari وFlutter دون كشف upstream.
5. **إثبات التشغيل العام على الأجهزة.**
   - اختبار Reacher الموسم الرابع وعمل HLS ثانٍ.
   - start/seek/pause/resume/duration/retry على iPhone وAndroid.
   - منع كتابة history/progress عند الفشل.
6. **إثبات التنزيل على الأجهزة.**
   - اختبار download resolution→opaque ref→local file write.
   - progress/cancel/retry/persistence/file existence/trusted filename.
   - إبقاء HLS-only بلا ملف مستقل fail-closed.
7. **إكمال Search/Poster parity وأمان الصور.**
   - إثبات posters الحقيقية عبر Runtime مع opaque/allowlisted image contract دون raw upstream URL.
   - اختبار dedupe للمواسم المتشابهة مع توضيح الموسم.
   - حماية category/search pagination من stale responses.
8. **إكمال Movies/News/Library regressions.**
   - اختبار عدة أفلام بمسارات Watch/Download مختلفة.
   - إعادة فحص News article/images/date/back.
   - التحقق من Favorites/Continue Watching/Downloads library.
9. **بدء providers.js v2 بعد إغلاق دورة الوسائط.**
   - health/retry/circuit-breaker/cache باختبارات deterministic.
   - الحفاظ على sweeper/rate limits/gzip/Vary/Content-Length.
   - إبقاء Cloudflare mirror مؤجلًا بلا صلاحيات/بنية مثبتة.
10. **توسيع four-surface E2E والصيانة المستمرة.**
   - Web/PWA + Android Mobile + Android TV + iOS contract matrix.
   - TV focus/D-Pad/LEANBACK وiOS unsigned checks في كل إصدار.
   - بعد الاستقرار الانتقال إلى maintenance دون حذف ميزات مطلوبة.
