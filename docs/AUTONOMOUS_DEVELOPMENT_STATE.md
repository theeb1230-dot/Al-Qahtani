# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main before this run: `4764a10afe7b94f783ca381c83c445292dac2e95`.
- Latest verified product release: `v1.0.6`, target `b35e6754b8c2d14b31e73e43b85b80a0958cdc29`, version/build `1.0.6+6`.
- No open PR existed at the start of this run.
- Active branch: `feat/tv-details-focus-78`.
- Active product version on this branch: `1.0.7+7`.
- Web/PWA remains the GitHub Pages product root and is not replaced by Flutter Web.

## Four-surface policy
Every product-impacting change is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. Native packages must come from the same commit/version and be published together only after fail-closed verification. Actions artifacts alone never count as a Release.

## Product boundary
Al-Qahtani stays independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani contracts only. The inherited Basri/Akwam source contract remains server-side only. Upstream hosts, Worker/session data and raw media URLs must not leak to UI or logs.

## Verified Release: v1.0.6
- URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.6`.
- Target commit: `b35e6754b8c2d14b31e73e43b85b80a0958cdc29`.
- Version/build: `1.0.6+6`.
- Mobile APK, TV APK, iOS UNSIGNED IPA, `SHA256SUMS.txt`, and `PROVENANCE.json` were verified present and non-empty.
- Historical `v1.0.5` remains RELEASE NOT PUBLISHED and must not be represented otherwise.

## This run: TV details focus parity
The highest executable gap selected from the prior goals was Android TV episode focus behavior on the details page.

Changes on `feat/tv-details-focus-78`:
- bumped Flutter version/build to `1.0.7+7`;
- added persistent per-episode TV download focus nodes and proper disposal;
- TV episode rows now expose exactly two intentional focus actions: tile/OK for playback and an explicit download button;
- removed the redundant second TV play button that could create an unnecessary remote focus stop;
- retained the existing compact mobile play/download trailing controls;
- added stable widget keys for episode play/download actions;
- added `details_page_focus_test.dart`, which runs under both default/mobile and TV dart-define test passes and verifies the TV surface has no duplicate play focus target;
- documented the focus behavior in `docs/TV_DETAILS_FOCUS_PARITY.md`.

## Release state
- `v1.0.4`: RELEASE VERIFIED.
- `v1.0.5`: RELEASE NOT PUBLISHED (historical gap).
- `v1.0.6`: RELEASE VERIFIED.
- `v1.0.7`: RELEASE NOT PUBLISHED until the active PR is exact-head green, merged, the four-surface post-merge gates succeed, and the GitHub Release assets are verified.

## Protected regressions
Protect iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS behavior, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30+30 pagination, Download semantics, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, no legacy Android Intent/deep-links, opaque media refs, and Mobile/TV/iOS identity parity.

## Repository Website / Pages URL
- GitHub Pages project URL: `https://theeb1230-dot.github.io/Al-Qahtani/`.
- Repository metadata currently exposes the Pages URL as the homepage; keep it verified rather than guessed.

## Current blockers / gaps
- The active TV focus PR must pass exact-final-head analyze/tests and all protected live/web/runtime gates before merge.
- After merge, `v1.0.7` must complete the Mobile APK + TV APK + iOS UNSIGNED triplet and appear as a real GitHub Release with checksums/provenance.
- Physical-device D-Pad/focus and standalone MPEG-TS evidence remain stronger parity work beyond CI widget coverage.

## أهداف التشغيل التالي
1. **إغلاق PR TV focus بأمان.**
   - فحص exact-final-head CI.
   - إصلاح أي analyze/widget/TV failure على نفس الفرع.
   - الدمج فقط بعد الخضرة الكاملة.
2. **إكمال v1.0.7 كإصدار فعلي.**
   - Mobile APK + TV APK + IPA UNSIGNED من نفس merge commit/version.
   - التحقق من SHA-256 والهوية وLEANBACK/no-codesign.
   - التحقق من Release tag/target/assets بعد الرفع.
3. **حماية GitHub Pages.**
   - Pages على merge commit.
   - WebKit/CORS/Range/Download regressions.
   - عدم استبدال Web/PWA الحالي بـFlutter Web.
4. **تعميق Android TV parity.**
   - اختبار traversal بين episode play/download.
   - اختبار focus بعد player/back/retry.
   - منع أي touch-only dead ends جديدة.
5. **تعميق media parity.**
   - HLS play/seek/resume.
   - MP4 Range/206 وduration.
   - MPEG-TS على ExoPlayer/AVPlayer حيث يمكن إثباته.
6. **تقوية Download parity.**
   - list/refresh/delete على Mobile/TV.
   - export/share عبر APIs عامة فقط.
   - عدم كشف filesystem/upstream paths.
7. **تقوية hardening.**
   - اختبارات rate limits للـAPI مقابل media.
   - gzip/deflate وVary/Content-Length.
   - sweeper دون حذف refs الصالحة.
8. **حماية Basri/Akwam من flakiness.**
   - إعادة failed live jobs على نفس SHA قبل تغيير parser.
   - عدم دمج speculative scraper expansion.
   - توثيق أي contract change فقط بدليل متكرر.
9. **مراجعة الأمن والأداء.**
   - SSRF/allowlists وopaque refs.
   - timeouts/cancellation/error handling.
   - منع upstream/session leakage في UI/logs.
10. **صيانة الاستمرارية.**
   - تحديث هذا الملف بالدليل الفعلي بعد merge/release.
   - إبقاء v1.0.5 فجوة تاريخية موثقة فقط.
   - بعد v1.0.7 متابعة regressions/security/performance دون توقف.
