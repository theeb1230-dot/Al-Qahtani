# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `5c92a94c110590434eb384e0ed49f597ee66faf3` (merged PR #75: exact-main release gates).
- Verified GitHub Release: `v1.0.4` build `4`, target commit `5c92a94c110590434eb384e0ed49f597ee66faf3`.
- Active branch: `feat/news-parity-104`.
- Active PR: #76 `Add opaque news parity across Flutter surfaces`.
- PR #76 base is current main with no stale-history merge; current product version on the branch is `1.0.5+5`.
- Web/PWA remains the GitHub Pages product root and is not replaced by Flutter Web.

## Four-surface policy
Every product-impacting change is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. Web stays on Pages. Native packages must come from the same commit/version and be published together only after fail-closed verification.

## Product boundary
Al-Qahtani stays independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani contracts only. The inherited Basri/Akwam source contract remains server-side only. Upstream hosts, Worker/session data and raw media URLs must not leak to UI or logs.

## Verified release v1.0.4
- GitHub Release URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.4`.
- Target commit: `5c92a94c110590434eb384e0ed49f597ee66faf3`.
- `Al-Qahtani-Mobile-v1.0.4.apk`: 54,178,478 bytes, SHA-256 `1d85169261967b1b47b08150f2efb4413e7d45869b710fe6b338ed4608edc1ef`.
- `Al-Qahtani-TV-v1.0.4.apk`: 54,178,590 bytes, SHA-256 `e9d81d864e822e8e8946eeb3ae2ec5c9eb7111510d95f1ae16754ec9b00b4abd`.
- `Al-Qahtani-iOS-v1.0.4-UNSIGNED.ipa`: 7,450,163 bytes, SHA-256 `22ab1c8c203c5a689be9fdabd6b5d6fca1e6c53ff3eb5c0ecbd3a565779b6e18`.
- `SHA256SUMS.txt` and `PROVENANCE.json` are present and non-empty.
- iOS remains UNSIGNED/no-codesign and requires external signing/provisioning before installation.

## Protected regressions
Protect iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS behavior, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30+30 pagination, Download semantics, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-links.

## News parity work in PR #76
- Added `server/news-runtime.mjs` with short-lived in-memory opaque news references and no source URL exposure in API responses.
- Added `/api/v1/news` and `/api/v1/news/article?ref=...` routing in `server/index.mjs`.
- Added `scripts/news_runtime_test.mjs` proving source URLs remain hidden and refs expire.
- Added Flutter `NewsItem`/`NewsArticle`, API mapping, and `news_page.dart`.
- Added Arabic RTL news navigation to both Mobile NavigationBar and Android TV NavigationRail.
- Added Flutter regression coverage for opaque refs.
- Added news runtime syntax/regression coverage to `Content runtime` CI.
- Bumped version/build to `1.0.5+5` for the product-impacting change.

## CI evidence for current PR head before this documentation commit
- Content runtime run `34689361848`: success; news runtime regression passed.
- Original Basri player contract `34689361855`: success.
- Trusted download filename `34689361875`: success.
- CORS boundary `34689361844`: success.
- Media reference expiry `34689361854`: success.
- Remote CORS smoke `34689361903`: success.
- Original Basri download contract `34689361867`: success.
- Remote movie playback smoke `34689361861`: success.
- Web smoke `34689361853`: success.
- Live provider, Mobile WebKit and Flutter foundation were still running when this handoff update was written.
- Because this documentation update changes the PR head, merge requires the refreshed exact-final-head CI to be green again.

## Repository Website / Pages URL
- GitHub Pages project URL: `https://theeb1230-dot.github.io/Al-Qahtani/`.
- Current connector capabilities still do not expose a repository Website/Homepage mutation action. Do not emulate that field by editing product files.

## Current blockers / gaps
- PR #76 must finish every protected check on its final documentation-updated head and remain mergeable.
- After merge, `1.0.5+5` must build Mobile APK + TV APK + iOS UNSIGNED from the exact same main SHA and produce a complete `v1.0.5` GitHub Release.
- News runtime currently depends on the preserved Basri news Worker contract server-side; Flutter never receives that Worker URL.
- Standalone MPEG-TS native-device evidence remains a deeper parity target.

## أهداف التشغيل التالي
1. **إغلاق PR #76 بأمان.**
   - فحص exact-final-head CI بعد تحديث هذا الملف.
   - إصلاح أي failure على نفس الفرع فقط.
   - الدمج فقط عند الخضرة وقابلية الدمج.
2. **إثبات news runtime.**
   - تشغيل list/article regression.
   - تأكيد ref expiry وعدم ظهور upstream URLs.
   - فحص أخطاء 400/410/502 وعدم تسريب المصدر.
3. **إثبات Flutter news parity.**
   - analyze/tests على Mobile وTV define.
   - فحص NavigationBar/NavigationRail والفوكس.
   - فحص list→article→back/retry بدون touch-only dead end.
4. **إصدار v1.0.5 كامل بعد الدمج.**
   - Mobile APK + TV APK + IPA UNSIGNED من نفس SHA/version.
   - التحقق من identities/LEANBACK/no-codesign/SHA-256.
   - التحقق من Release فعلي وأصول غير صفرية.
5. **حماية GitHub Pages.**
   - Pages/WebKit/Web smoke على merge commit.
   - CORS/Range/Download regressions.
   - إبقاء الويب الحالي وعدم استبداله بـFlutter Web.
6. **تعميق media parity.**
   - HLS play/seek/resume.
   - MP4 Range/206 وduration.
   - MPEG-TS على ExoPlayer وAVPlayer دون ادعاء دعم غير مثبت.
7. **تقوية Download parity.**
   - list/refresh/delete على Mobile/TV.
   - export/share عبر APIs عامة فقط.
   - عدم كشف filesystem/upstream paths.
8. **تقوية Android TV UX.**
   - D-Pad traversal للأخبار وبقية الأقسام.
   - focus بعد article/player/retry/back.
   - منع touch-only dead ends.
9. **Website/Homepage metadata.**
   - استخدام URL Pages الرسمي فقط.
   - تطبيقه عند توفر connector write رسمي.
   - توثيق العائق دون تعديل المنتج.
10. **صيانة دورة الإصدار.**
   - version/build جديد لكل merge مؤثر.
   - منع Release ناقص أو artifact-only.
   - تحديث هذا الملف بالدليل الفعلي في كل تشغيل.
