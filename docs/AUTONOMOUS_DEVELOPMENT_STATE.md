# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `817b43fab91b88073de8fe9a51b86278e80b58f8` (PR #76 merged: opaque news parity, version `1.0.5+5`).
- Last verified GitHub Release: `v1.0.4` build `4`, target `5c92a94c110590434eb384e0ed49f597ee66faf3`.
- `v1.0.5` is **NOT PUBLISHED** in GitHub Releases. This is a release-policy gap from the previous run and must not be disguised as an artifact-only release.
- Active branch: `fix/server-hardening-77`.
- Active PR: #77 `Activate server hardening in runtime`.
- Current branch product version: `1.0.6+6`.
- PR #77 is intentionally unmerged while the live Basri cinema discovery contract is failing.
- Web/PWA remains the GitHub Pages product root and is not replaced by Flutter Web.

## Four-surface policy
Every product-impacting change is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. Web stays on Pages. Native packages must come from the same commit/version and be published together only after fail-closed verification. Actions artifacts alone never count as a release.

## Product boundary
Al-Qahtani stays independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani contracts only. The inherited Basri/Akwam source contract remains server-side only. Upstream hosts, Worker/session data and raw media URLs must not leak to UI or logs.

## Last verified Release: v1.0.4
- URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.4`.
- Target commit: `5c92a94c110590434eb384e0ed49f597ee66faf3`.
- `Al-Qahtani-Mobile-v1.0.4.apk`: 54,178,478 bytes, SHA-256 `1d85169261967b1b47b08150f2efb4413e7d45869b710fe6b338ed4608edc1ef`.
- `Al-Qahtani-TV-v1.0.4.apk`: 54,178,590 bytes, SHA-256 `e9d81d864e822e8e8946eeb3ae2ec5c9eb7111510d95f1ae16754ec9b00b4abd`.
- `Al-Qahtani-iOS-v1.0.4-UNSIGNED.ipa`: 7,450,163 bytes, SHA-256 `22ab1c8c203c5a689be9fdabd6b5d6fca1e6c53ff3eb5c0ecbd3a565779b6e18`.
- `SHA256SUMS.txt` and `PROVENANCE.json` are present and non-empty.
- iOS remains UNSIGNED/no-codesign and requires external signing/provisioning before installation.

## PR #77 scope
PR #77 wires `server/hardening.mjs` into the actual backend runtime without changing the provider boundary:
- periodic sweeping of expired opaque media references;
- per-client/per-route fixed-window rate limits;
- JSON gzip/deflate compression with correct `Vary` and `Content-Length` behavior;
- a higher media-route ceiling so Range/HLS traffic is not throttled like normal API traffic;
- `scripts/server_hardening_test.mjs` plus Web smoke coverage;
- product version `1.0.6+6`.

## Basri live-source diagnosis in this run
The two blocking gates are `Live provider smoke` and `Remote movie playback smoke`.

Observed repeatedly from GitHub Actions runners:
- `https://akwam.ss/series?section=30` returns HTTP 200 and a roughly 19.8 KB HTML document.
- The document title is the real Akwam category title (`مسلسلات - اجنبي | اكوام`).
- The returned document contains navigation/assets such as `/series`, `/movies`, `/shows`, `/recent`, CSS and JS, but contains no `/series/<id>/...` catalog item anchors.
- The Basri cinema Worker session probe returns HTTP 403 with `FORBIDDEN_ORIGIN`, so the backend falls back to direct Akwam discovery.
- Consequently the direct category parser returns zero items and `Remote movie playback smoke` fails before a candidate can reach details/episodes/watch/media.
- External web inspection at the same time confirms the Akwam category itself is populated with current series and item detail pages, so this is not a globally empty upstream catalog.

This proves the blocker is not merely the old absolute-link regex. GitHub Runner receives a catalog shell without item cards, while browser/crawler access receives populated content. Akwam's common `akwam.js` contains AJAX used for general forms/favorites/likes and does not by itself reveal the category-list loader; evidence points to an inline loader or a request path that differs by execution context.

## Parser hardening already applied on #77
To avoid another brittle absolute-link dependency, `server/basri-source.mjs` now canonicalizes source anchors through `new URL(..., SOURCE_ORIGIN)` and then reapplies the strict `akwam.ss` allowlist. Catalog, episode and watch/download parsing use the canonicalized allowed path instead of assuming only literal `https://akwam.ss/...` hrefs. This preserves SSRF boundaries while accepting safe relative/absolute source links.

The live smoke was updated similarly and includes bounded diagnostics only on failure. These diagnostics print title/path/script markers rather than full page bodies, media URLs or session material.

## CI evidence / relevant runs
- Initial failing PR head: Live provider `34690288690`, Remote movie playback `34690288693`.
- Re-runs confirmed the failure was not transient.
- Later diagnostic Live provider runs: `34690617747`, `34690688734`, `34690858861`, `34690919428`, `34690985344`; all still fail at populated-category discovery from GitHub Runner.
- `Web smoke`, `Content runtime`, `Original Basri player contract`, `Original Basri download contract`, `CORS boundary`, `Remote CORS smoke`, `Media reference expiry`, and `Trusted download filename` have remained green on the diagnostic heads checked during this run.
- Flutter foundation has continued to run on branch heads, but the PR must not merge while the two live cinema gates are red regardless of native build success.

## Protected regressions
Protect iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS behavior, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30+30 pagination, Download semantics, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-links.

## Repository Website / Pages URL
- GitHub Pages project URL: `https://theeb1230-dot.github.io/Al-Qahtani/`.
- Current connector capabilities still do not expose a repository Website/Homepage mutation action. Do not emulate that field by editing product files.

## Release state
- `v1.0.4`: VERIFIED.
- `v1.0.5`: RELEASE NOT PUBLISHED; there is no verified GitHub Release for the merged news-parity main version.
- Current branch target after PR #77 eventually merges: `v1.0.6` build `6`.
- Do not merge PR #77 and do not claim `v1.0.6` until exact-final-head gates are green; after merge, main must produce Mobile APK + TV APK + IPA UNSIGNED from one exact SHA/version and a real complete GitHub Release.
- Do not create a retroactive fake `v1.0.5` claim. Record the gap honestly; a later verified release may supersede it only after the complete release gates pass.

## Current blockers / gaps
- Determine the actual category-list loading contract used by the current Akwam page when catalog item anchors are absent from the initial HTML: inspect bounded inline script markers/request path/parameters without leaking unrelated page data.
- Restore an authorized Basri Worker request only if the original Basri contract proves the expected Origin/page headers; do not invent/bypass origin checks.
- Make direct category discovery return real items in the GitHub Runner environment or use the existing Basri Worker contract correctly. Do not add another provider.
- Restore `Live provider smoke` and `Remote movie playback smoke` on the exact PR head.
- Keep PR #77 open until all required checks, including Flutter foundation, are green on its final head.
- Standalone MPEG-TS native-device evidence remains a deeper parity target.

## أهداف التشغيل التالي
1. **استخراج عقد تحميل تصنيف Basri/Akwam الحالي.**
   - فحص الـinline script المحيط بـ`loader`/`recently-container` في HTML دون طباعة الصفحة كاملة.
   - تحديد endpoint والطريقة والبارامترات/الكوكيز/الهيدرز اللازمة إن وُجدت.
   - إبقاء الطلب مقيدًا بـ`akwam.ss` وعقد Basri الأصلي فقط.
2. **استعادة نتائج التصنيفات من الجذر.**
   - تطبيق loader contract داخل `directCategory` إذا ثبت أنه جزء من Akwam الأصلي.
   - إضافة parser regression للحالة initial-shell + loaded-fragment.
   - إثبات أن التصنيف يعيد عناصر فعلية بدل `count: 0`.
3. **استعادة مسار الفيلم/المسلسل الكامل.**
   - Category/Search → Details → Episodes.
   - Episode → Watch/Download refs opaque.
   - Watch → Media مع Range/206 ومنع تسريب upstream.
4. **إغلاق PR #77 بأمان.**
   - تشغيل Live provider وRemote movie playback على exact-final-head.
   - إصلاح أي failure على نفس الفرع فقط.
   - الدمج فقط عندما تكون كل البوابات المطلوبة خضراء وقابلية الدمج سليمة.
5. **إصدار v1.0.6 كامل بعد الدمج.**
   - Mobile APK + TV APK + IPA UNSIGNED من نفس main SHA/version.
   - التحقق من identities/LEANBACK/no-codesign/SHA-256.
   - التحقق من GitHub Release فعلي مع الأصول الثلاثة و`SHA256SUMS.txt` و`PROVENANCE.json`.
6. **توثيق فجوة v1.0.5 دون تزوير تاريخ الإصدار.**
   - الإبقاء على وصفه `RELEASE NOT PUBLISHED`.
   - عدم اعتبار artifacts المؤقتة Release.
   - جعل أول Release لاحق موثقًا بالكامل ولا يتجاوز البوابات.
7. **حماية GitHub Pages والويب.**
   - Pages/WebKit/Web smoke على merge commit.
   - CORS/Range/Download regressions.
   - عدم استبدال الويب الحالي بـFlutter Web قبل parity كاملة.
8. **إثبات hardening في PR #77.**
   - rate-limit boundaries API مقابل media.
   - gzip/deflate + `Vary`/`Content-Length`.
   - media-ref sweeper وعدم كسر refs أثناء الاستخدام الصحيح.
9. **تعميق media/TV parity.**
   - HLS/MP4/MPEG-TS play/seek/resume حيث يمكن إثباته.
   - D-Pad/focus بعد player/retry/back.
   - Download list/refresh/delete دون filesystem/upstream leakage.
10. **صيانة metadata ودورة الإصدار.**
   - استخدام URL Pages الرسمي في Website/Homepage عند توفر write API رسمي.
   - version/build جديد لكل merge مؤثر.
   - تحديث هذا الملف بالدليل الفعلي في نهاية كل تشغيل.
