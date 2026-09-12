# Autonomous Development State

## Source of truth
GitHub is authoritative when this file disagrees with the repository. The preserved original `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployment and artifact evidence are required before claiming parity or release readiness.

## Current state
- Main: `e5cdf6361503b8dd925412f7bbce30979665d649` (merged PR #74: automatic triplet Release trigger repair).
- Active branch: `fix/release-gates-main-74`.
- Active PR: #75 `Run release gates on main pushes`.
- PR #75 was reset onto current main after PR #74 landed concurrently, then the missing exact-main gate fixes were reapplied.
- Flutter product version on main: `1.0.3+3`; PR #75 advances to `1.0.4+4` because this workflow repair is product-impacting.
- Web/PWA remains the GitHub Pages product root and is not replaced by Flutter Web.

## Four-surface policy
Every product-impacting change is one product on four surfaces: Web/PWA on GitHub Pages, Android Mobile APK, Android TV APK with LEANBACK/D-Pad/focus, and iOS IPA explicitly UNSIGNED/no-codesign. Web stays on Pages. The three native packages must come from the same commit/version and be published together only after fail-closed verification.

## Product boundary
Al-Qahtani stays independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, `THEEB_SERVICE_TOKEN`, and Theeb-specific providers. Flutter consumes Al-Qahtani contracts only. The inherited `akwam.ss` Basri source contract remains server-side only. Upstream hosts, Worker/session data and raw media URLs must not leak to UI or logs.

## Protected regressions
Protect iPhone Safari playback, Range/206, Content-Range/Accept-Ranges, HLS/MP4/MPEG-TS behavior, measured duration, real match logos, Saudi match times, separated episode numbering, endless 30+30 pagination, Download semantics, CORS, SSRF/allowlists, zero ads/popups/unneeded tracking, and no legacy Android Intent/deep-links.

## Flutter structure
- `flutter_app/lib/main.dart`: Arabic RTL shell, Mobile navigation, Android TV NavigationRail and local library.
- `flutter_app/lib/src/api_client.dart`: Al-Qahtani-only API access with opaque media resolution.
- `flutter_app/lib/src/details_page.dart`: details/episodes, favorites, playback, Download and route-return focus.
- `flutter_app/lib/src/player_page.dart`: internal player, resume/progress, TV controls, playback speed and media-format handling.
- `flutter_app/lib/src/media_format_policy.dart`: HLS/MP4/MPEG-TS normalization.
- `flutter_app/lib/src/download_service.dart` + `download_library_section.dart`: opaque native downloads and local management.
- `flutter_app/lib/src/library_store.dart`: favorites/history/continue-watching without persisted media refs.

## Release implementation and root cause
- PR #71 introduced the automatic `release-triplet.yml` pipeline and version `1.0.2+2`.
- Main Flutter foundation run `34687043483` succeeded and produced all three native artifacts.
- Pages and representative exact-main Web/runtime gates also succeeded.
- Release run `34687260253` then failed fail-closed because two workflows required by the release policy had no `push` trigger: `Live provider smoke` and `Original Basri player contract`.
- Their definitions supported only `pull_request` and `workflow_dispatch`, so an automatic exact-main release could never observe those gate names.
- PR #74 independently repaired an earlier Release trigger-selection issue and advanced main to `1.0.3+3`, but it did not add main push triggers to these two missing gates.
- PR #75 adds `push: branches: [main]` to both workflows, preserving their PR and manual triggers. This makes the exact-main protected gate set reachable by automation rather than weakening the release requirements.

## This run
1. Inspected actual main, branches, PRs, commits, workflows/logs and autonomous state.
2. Found overlapping PRs #71 and #73, closed #73 unmerged, verified #71 exact-head green and merged #71.
3. Verified main `f19ce24e...` Flutter triplet source run `34687043483` and Pages/Web/runtime evidence.
4. Diagnosed failed Release run `34687260253` from job logs; publication never started and no partial Release was created.
5. Confirmed the exact missing gate names and inspected both workflow definitions.
6. Created a release-gate repair branch, then discovered PR #74 had concurrently merged to main as `e5cdf636...`.
7. Reset the active repair branch onto that actual main instead of force-merging stale history.
8. Raised version/build from main `1.0.3+3` to `1.0.4+4` for this separate workflow-impacting merge.
9. Added main push triggers to `Live provider smoke` and `Original Basri player contract` without changing their test bodies.
10. Kept PR #75 as the sole open PR and refreshed this handoff to the actual repository state.

## Evidence
- PR #71 merge main: `f19ce24e4808cc5d1914ba09475ba3eb51cac1da`.
- Main Flutter foundation for #71 merge: `34687043483` success.
- Main Pages: `34687043498` success; dynamic Pages `34687042938` success.
- Main Web smoke: `34687043485` success.
- Main Remote runtime: `34687043484` success.
- Main Remote movie playback: `34687043526` success.
- Main Content runtime: `34687043527` success.
- Failed Release triplet: `34687260253`; root cause was missing exact-main runs for only `Live provider smoke` and `Original Basri player contract`.
- PR #74 merge: `e5cdf6361503b8dd925412f7bbce30979665d649`.
- PR #75 current head must be read from GitHub after this documentation commit; merge requires exact-final-head green CI.

## Artifact / Release state
For main `f19ce24...` / version `1.0.2+2`, exact-run Actions artifacts existed but were not published as a Release:
- Android Mobile: id `10295468878`, size `25,416,732`, digest `sha256:72163553fb9a4f9b55253078ed2842117064ebe2c9ae0b550a1eab2fc071ab10`.
- Android TV: id `10295863132`, size `25,416,896`, digest `sha256:74db05e614ad54467c33112f179754fc00a23ca9994786e33f9b275be620714e`.
- iOS UNSIGNED: id `10295997689`, size `7,424,076`, digest `sha256:3579db8b24112a6eb0b0eab952a2c52242d7e9e35e809f0e14372877c467103f`.
- No partial `v1.0.2` Release was published.
- Current release target after PR #75 merges is `v1.0.4` build `4`; all native assets plus `SHA256SUMS.txt` and `PROVENANCE.json` must exist together before success is claimed.
- iOS remains UNSIGNED/no-codesign and needs external signing/provisioning for installation.

## Repository Website / Pages URL
- GitHub Pages is active and the documented project URL is `https://theeb1230-dot.github.io/Al-Qahtani/`.
- Current connector capabilities still do not expose a repository Website/Homepage mutation action. Do not emulate that field by editing product files.

## Current blockers / gaps
- PR #75 must pass every protected check on its final head and remain mergeable.
- After merge, both newly push-enabled gates must run and pass on the exact main commit before Release automation can proceed.
- The next full triplet must be version `1.0.4+4` from one exact commit; no artifact-only result counts as a release.
- Closed news work must wait until PR #75 and its Release cycle finish.
- Standalone MPEG-TS native device evidence remains a deeper parity target.

## أهداف التشغيل التالي
1. **إغلاق PR #75 بأمان.**
   - فحص exact-final-head CI.
   - إصلاح أي failure على نفس الفرع.
   - الدمج فقط بعد الخضرة وقابلية الدمج.
2. **إثبات بوابتي main.**
   - Live provider على merge commit.
   - Original Basri player على merge commit.
   - عدم تخفيف أي gate في release workflow.
3. **إصدار v1.0.4 كامل.**
   - Mobile APK + TV APK + IPA UNSIGNED من نفس SHA.
   - التحقق من identities/LEANBACK/no-codesign/SHA-256.
   - نشر SHA256SUMS وPROVENANCE وعدم قبول Release ناقص.
4. **حماية GitHub Pages.**
   - Pages على نفس merge commit.
   - WebKit/CORS/Range/Download regressions.
   - إبقاء الويب الحالي وعدم استبداله بـFlutter Web.
5. **استعادة news work لاحقًا.**
   - إعادة تطبيق العمل من main الجديد.
   - refs opaque وعدم كشف upstream.
   - version/build جديد قبل الدمج.
6. **تعميق media parity.**
   - HLS play/seek/resume.
   - MP4 Range/206 وduration.
   - MPEG-TS على ExoPlayer وAVPlayer دون ادعاء دعم غير مثبت.
7. **تقوية Download parity.**
   - list/refresh/delete على Mobile/TV.
   - export/share عبر APIs عامة فقط.
   - عدم كشف filesystem/upstream paths.
8. **تقوية Android TV UX.**
   - D-Pad traversal.
   - focus بعد player/retry/back.
   - منع touch-only dead ends.
9. **Website/Homepage metadata.**
   - استخدام URL Pages الرسمي فقط.
   - تطبيقه عند توفر connector write رسمي.
   - توثيق العائق دون تعديل المنتج.
10. **صيانة دورة الإصدار.**
   - version/build جديد لكل merge مؤثر.
   - منع release ناقص أو artifact-only.
   - تحديث هذا الملف بالدليل الفعلي كل تشغيل.
