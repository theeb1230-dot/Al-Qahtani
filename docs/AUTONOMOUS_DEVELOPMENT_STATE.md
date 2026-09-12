# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `817b43fab91b88073de8fe9a51b86278e80b58f8` (PR #76 merged: opaque news parity, version `1.0.5+5`).
- Last verified GitHub Release: `v1.0.4` build `4`, target `5c92a94c110590434eb384e0ed49f597ee66faf3`.
- `v1.0.5` is **RELEASE NOT PUBLISHED** and must not be represented as a Release from Actions artifacts.
- Active branch: `fix/server-hardening-77`.
- Active PR: #77 `Activate server hardening in runtime`.
- Current branch version: `1.0.6+6`.
- Current head: `fcbc38d5eb6cf9ddc320af55573dc8c4604a918a`.
- Web/PWA remains the GitHub Pages product root and is not replaced by Flutter Web.

## Four-surface policy
Every product-impacting change is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. Native packages must come from the same commit/version and be published together only after fail-closed verification. Actions artifacts alone never count as a Release.

## Product boundary
Al-Qahtani stays independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani contracts only. The inherited Basri/Akwam source contract remains server-side only. Upstream hosts, Worker/session data and raw media URLs must not leak to UI or logs.

## Last verified Release: v1.0.4
- URL: `https://github.com/theeb1230-dot/Al-Qahtani/releases/tag/v1.0.4`.
- Target commit: `5c92a94c110590434eb384e0ed49f597ee66faf3`.
- `Al-Qahtani-Mobile-v1.0.4.apk`: 54,178,478 bytes, SHA-256 `1d85169261967b1b47b08150f2efb4413e7d45869b710fe6b338ed4608edc1ef`.
- `Al-Qahtani-TV-v1.0.4.apk`: 54,178,590 bytes, SHA-256 `e9d81d864e822e8e8946eeb3ae2ec5c9eb7111510d95f1ae16754ec9b00b4abd`.
- `Al-Qahtani-iOS-v1.0.4-UNSIGNED.ipa`: 7,450,163 bytes, SHA-256 `22ab1c8c203c5a689be9fdabd6b5d6fca1e6c53ff3eb5c0ecbd3a565779b6e18`.
- `SHA256SUMS.txt` and `PROVENANCE.json` are present and non-empty.

## PR #77 scope
PR #77 activates backend hardening without changing the provider boundary:
- expired opaque media-ref sweeping;
- per-client/per-route fixed-window rate limits;
- JSON gzip/deflate with correct `Vary` and `Content-Length` handling;
- a higher media-route ceiling so Range/HLS traffic is not throttled like normal API traffic;
- `scripts/server_hardening_test.mjs` plus Web smoke coverage;
- product version `1.0.6+6`.

## Current Basri/Akwam blocker
The exact-head blocking gates remain `Live provider smoke` and `Remote movie playback smoke`.

Evidence from GitHub Actions:
- Cinema Worker session returns `403 FORBIDDEN_ORIGIN`, so the backend correctly enters the direct Basri/Akwam fallback path rather than bypassing origin policy.
- `https://akwam.ss/series?section=30` returns HTTP 200 with about 19.8 KB and the real category title, but the initial HTML contains navigation/assets and no `/series/<id>/...` catalog anchors.
- The current direct parser has already been hardened to canonicalize relative/absolute Akwam links through `new URL(..., SOURCE_ORIGIN)` and then reapply the strict `akwam.ss` allowlist. That fixes brittle URL assumptions but cannot invent item cards that are absent from the initial HTML.
- A bounded diagnostic commit `fcbc38d5...` added safe inspection of hidden inputs, forms, `data-*` attributes and relevant inline loader lines. It found no catalog endpoint in hidden/form/data attributes and only the inline statement `$('.widget-3 .loader').remove();` around the category widget.
- `akwam.js` exposes generic AJAX used for app/version/forms/favorites/likes but still does not reveal the category-list loader contract.
- Therefore the remaining blocker is the actual current category fragment/loading contract or an execution-context response difference, not merely an anchor regex.

## Exact-head CI evidence
Previous head `f9fca584...`:
- Flutter foundation `34691106245`: success.
- Web smoke `34691106265`: success.
- Content runtime `34691106250`: success.
- Original Basri player `34691106255`: success.
- Original Basri download `34691106258`: success.
- CORS boundary `34691106229`: success.
- Remote CORS `34691106234`: success.
- Media reference expiry `34691106231`: success.
- Trusted download filename `34691106238`: success.
- Live provider `34691106299`: failure at category discovery.
- Remote movie playback `34691106246`: failure because category samples do not resolve to a real playable movie/series path.

Current diagnostic head `fcbc38d5...`:
- Live provider `34691735994`: failure by design after collecting bounded dynamic diagnostics.
- Other exact-head checks were triggered and remain subject to final-head revalidation before merge.

## Release state
- `v1.0.4`: **RELEASE VERIFIED**.
- `v1.0.5`: **RELEASE NOT PUBLISHED**.
- `v1.0.6`: **RELEASE NOT PUBLISHED** because PR #77 is intentionally unmerged while the live cinema gates are red.
- No new feature work may supersede this blocker. The next allowed product change is one required to restore the existing Basri/Akwam path or release integrity.

## Protected regressions
Protect iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS behavior, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30+30 pagination, Download semantics, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-links.

## Repository Website / Pages URL
- GitHub Pages project URL: `https://theeb1230-dot.github.io/Al-Qahtani/`.
- The current connector still does not expose a repository Website/Homepage mutation action. Do not emulate that field by modifying product files.

## Current blockers / gaps
- Extract the real category-loading contract around the current Akwam `widget-3` shell without leaking page bodies/media/session data.
- Restore real category item discovery in GitHub Runner while keeping the request constrained to the original Basri/Akwam source only.
- Restore `Category/Search → Details → Episodes → Watch/Download → Media` end-to-end.
- Return `Live provider smoke` and `Remote movie playback smoke` to green on the exact final PR head.
- Keep #77 unmerged until every required gate including Flutter foundation is green.

## أهداف التشغيل التالي
1. **تحديد عقد `widget-3` الحالي.**
   - طباعة سياق محدود حول `widget-3` و`loader` من inline script فقط.
   - استخراج أي endpoint/method/params مثبتة بدل التخمين.
   - إبقاء التشخيص منقحًا بلا media/session secrets.
2. **استعادة category discovery.**
   - تطبيق endpoint/fragment contract فقط إذا ثبت أنه من Akwam الأصلي.
   - إبقاء `akwam.ss` allowlist وSSRF protections.
   - إضافة regression لـinitial shell + loaded fragment.
3. **استعادة details/episodes.**
   - إثبات أن العنصر المكتشف صفحة عمل حقيقية وليس navigation shell.
   - فصل `episode_id` عن `episode_number`.
   - منع duplicate/stale entries.
4. **استعادة watch/download/media.**
   - refs opaque فقط للواجهة.
   - HLS/MP4/MPEG-TS normalization.
   - Range/206 وContent-Range/Accept-Ranges بلا تسريب upstream.
5. **إغلاق #77 بأمان.**
   - Live provider أخضر على exact-final-head.
   - Remote movie playback أخضر على exact-final-head.
   - كل بقية required checks خضراء قبل الدمج.
6. **إصدار v1.0.6 كامل بعد الدمج.**
   - Mobile APK + TV APK + IPA UNSIGNED من نفس main SHA/version.
   - SHA-256/identity/LEANBACK/no-codesign checks.
   - GitHub Release فعلي مع `SHA256SUMS.txt` و`PROVENANCE.json`.
7. **حماية الويب/Pages.**
   - Pages/WebKit/Web smoke على merge commit.
   - CORS/Range/Download regressions.
   - عدم استبدال الويب الحالي بـFlutter Web قبل parity كاملة.
8. **إثبات hardening.**
   - rate-limit API مقابل media.
   - gzip/deflate و`Vary`/`Content-Length`.
   - sweeper بدون كسر refs الصالحة.
9. **تعميق TV/media parity بعد فك blocker.**
   - D-Pad/focus بعد player/retry/back.
   - HLS/MP4/MPEG-TS play/seek/resume حيث يمكن إثباته.
   - Download list/refresh/delete بلا filesystem leakage.
10. **صيانة الإصدار والmetadata.**
   - إبقاء `v1.0.5` موثقًا كـRELEASE NOT PUBLISHED.
   - version/build جديد لكل merge مؤثر لاحق.
   - وضع Pages URL في Website/Homepage فقط عند توفر write API رسمي.
