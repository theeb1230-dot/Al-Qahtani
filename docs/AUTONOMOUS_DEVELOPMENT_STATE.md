# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Product main merge commit: `b35e6754b8c2d14b31e73e43b85b80a0958cdc29` (PR #77: runtime hardening, version `1.0.6+6`).
- PR #77 is merged. There is no open product PR at the time of this update.
- Web/PWA remains the GitHub Pages product root and is not replaced by Flutter Web.
- GitHub Pages deployment for the product merge commit succeeded.
- `v1.0.6` is **RELEASE VERIFIED** and targets the exact product merge commit above.
- Historical `v1.0.5` remains **RELEASE NOT PUBLISHED**; do not represent Actions artifacts from that version as a GitHub Release.

## Four-surface policy
Every product-impacting change is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. Native packages must come from the same commit/version and be published together only after fail-closed verification. Actions artifacts alone never count as a Release.

## Product boundary
Al-Qahtani stays independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani contracts only. The inherited Basri/Akwam source contract remains server-side only. Upstream hosts, Worker/session data and raw media URLs must not leak to UI or logs.

## Verified Release: v1.0.6
- URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.6`.
- Target commit: `b35e6754b8c2d14b31e73e43b85b80a0958cdc29`.
- Version/build: `1.0.6+6`.
- `Al-Qahtani-Mobile-v1.0.6.apk`: 54,260,734 bytes, SHA-256 `018983603a374cd318696b1925f99988f56413694e46fac41db71613dd9a0f99`.
- `Al-Qahtani-TV-v1.0.6.apk`: 54,260,850 bytes, SHA-256 `5fc49919a1270d553623f87ac3a69dfeab559fe9ea1ed956ac67c7cfd14a5965`.
- `Al-Qahtani-iOS-v1.0.6-UNSIGNED.ipa`: 7,460,417 bytes, SHA-256 `b80a3965d7e189d2c34b390f8240917e3254a6d430c662d7c10d126159f1db5c`.
- `SHA256SUMS.txt`: 287 bytes, SHA-256 `7f7e0f73970d6de5257ae494487e753485cc6b585e0f53f845e863e49ca2e02c`.
- `PROVENANCE.json`: 575 bytes, SHA-256 `4707a6493c7c600ebb431da7ced515a09b9ead01bbab7f9e38eefa24fc957262`.
- iOS is explicitly UNSIGNED/no-codesign and requires external signing/provisioning before installation.

## PR #77 delivered
PR #77 activated backend hardening without changing the provider boundary:
- expired opaque media-ref sweeping;
- per-client/per-route fixed-window rate limits;
- JSON gzip/deflate with correct `Vary` and `Content-Length` handling;
- a higher media-route ceiling so Range/HLS traffic is not throttled like normal API traffic;
- `scripts/server_hardening_test.mjs` plus Web smoke coverage;
- safe Basri/Akwam URL canonicalization while retaining the strict source allowlist.

## Transient Basri/Akwam incident resolved
The earlier `Live provider smoke` and `Remote movie playback smoke` failures on PR #77 were rerun on the exact same final head before merge. Both succeeded without a parser workaround. This demonstrated that the shell-only Akwam response was transient/upstream rather than a proven permanent parser contract change. No speculative scraper expansion was merged.

Exact-final-head evidence before merge:
- Flutter foundation: success.
- Live provider smoke: success after rerun on unchanged final head.
- Remote movie playback smoke: success after rerun on unchanged final head.
- Web smoke, Mobile WebKit, Content runtime, CORS, Basri player/download, media-ref expiry and trusted filename checks: success.

## Main / release evidence
- Product merge commit: `b35e6754b8c2d14b31e73e43b85b80a0958cdc29`.
- Main Flutter foundation run: `34694725716`: success.
- Main Release Flutter triplet run: `34694981935`: success.
- Release workflow verified the triggering run was a main push, waited for protected exact-commit Web/runtime gates, downloaded the exact-run native artifacts, verified checksums, created the Release, and verified all required assets were present and non-empty.
- GitHub Pages run for the product merge commit succeeded.
- Main Live provider smoke succeeded on the product merge commit.

## Release state
- `v1.0.4`: **RELEASE VERIFIED**.
- `v1.0.5`: **RELEASE NOT PUBLISHED** (historical release gap).
- `v1.0.6`: **RELEASE VERIFIED**.
- No new product work should reuse version `1.0.6+6`; the next product-impacting merge must bump version/build and complete a new four-surface release cycle.

## Protected regressions
Protect iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS behavior, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30+30 pagination, Download semantics, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, no legacy Android Intent/deep-links, opaque media refs, and Mobile/TV/iOS identity parity.

## Repository Website / Pages URL
- GitHub Pages project URL: `https://theeb1230-dot.github.io/Al-Qahtani/`.
- The current connector still does not expose a repository Website/Homepage mutation action. Do not emulate that field by modifying product files.

## Current blockers / gaps
- Historical `v1.0.5` cannot be retroactively called released; keep the gap documented rather than manufacturing a false Release.
- Standalone MPEG-TS evidence on physical Android TV/iOS remains deeper parity work.
- Full physical-device matrix for D-Pad/focus and Safari playback remains stronger evidence than CI-only coverage.
- Website/Homepage repository metadata cannot currently be written through the available connector.

## أهداف التشغيل التالي
1. **إعادة فحص GitHub قبل أي تغيير.**
   - main/branches/PRs/commits/CI/Releases.
   - مقارنة هذا الملف مع الحالة الفعلية.
   - عدم الوثوق بأي run قديم إذا تحرك الرأس.
2. **حماية دورة الإصدار.**
   - version/build جديد لكل merge مؤثر.
   - منع artifact-only أو Release ناقص.
   - التحقق من tag/target/assets بعد كل إصدار.
3. **تعميق Web/PWA regressions.**
   - iPhone Safari/WebKit playback.
   - CORS/Range/206/Download.
   - Pages على exact product commit.
4. **تعميق Android TV parity.**
   - D-Pad traversal والفوكس بعد player/back/retry.
   - منع touch-only dead ends.
   - إبقاء LEANBACK/touchscreen manifest checks.
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
   - gzip/deflate و`Vary`/`Content-Length`.
   - sweeper دون حذف refs الصالحة.
8. **حماية Basri/Akwam من flakiness.**
   - عدم تعديل parser بسبب failure منفرد transient.
   - إعادة failed live jobs على نفس SHA قبل تغيير الكود.
   - توثيق contract change فقط عند دليل متكرر قابل للإعادة.
9. **مراجعة الأمن والأداء.**
   - SSRF/allowlists وopaque refs.
   - timeouts/cancellation/error handling.
   - عدم تسريب upstream/session data في logs/UI.
10. **Metadata والصيانة المستمرة.**
   - استخدام Pages URL الرسمي في Website/Homepage عند توفر write API.
   - إبقاء `v1.0.5` موثقًا كفجوة تاريخية فقط.
   - بعد استقرار المنتج، الاستمرار في regressions/security/performance بدل التوقف.
