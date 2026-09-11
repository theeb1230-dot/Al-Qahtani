# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The preserved `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployed evidence is required before claiming Web parity.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, and every Theeb provider/API.
- `THEEB_SERVICE_TOKEN` and other cross-project credentials do not belong here.
- Historical `https://akwam.ss/...` URLs are part of the original Basri cinema contract only; their presence is not integration with the separate akwam-indexer repository.
- Matches/news remain on original Basri workers. Cinema remains on the original Basri chain with server-side fallback to the historical Basri source when the origin-locked cinema Worker returns `403 FORBIDDEN_ORIGIN` or unusable empty data.

## Current repository state
- Product `main`: `2a02d33e989ab6056366ab8642df5a1d68500580` (`Fix iPhone movie playback MIME handling`), merged from PR #42.
- GitHub Pages build/deploy for exact `2a02d33e...` completed successfully.
- Active PR: #43 `Gate live iPhone movie container compatibility` on `test/live-ios-container-43`.
- Head before this documentation commit: `bc127697933e12a0261f477cc5c649978c8d1433`.
- PR #43 is the only active development branch/PR and must be completed before opening another PR.

## iPhone Safari movie playback incident
User evidence showed movie categories/details and Download work, but Watch begins loading and stops with Safari's unsupported-source icon. This invalidated the earlier assumption that HTTP Range success alone proved playback compatibility.

### Evidence from exact main commit `2a02d33e...`
Remote movie playback smoke on deployed Al-Qahtani backend resolved a real Basri movie:
- category: `أجنبية`
- title: `The Beloved`
- source: `basri-direct`
- opaque media path: `/api/cinema/media?id=...`
- media size from Content-Range: `1147681720` bytes
- Range: HTTP `206`
- `Accept-Ranges: bytes`
- MIME: `application/octet-stream`
- bounded Download: success with trusted `The Beloved` filename and `X-Content-Type-Options: nosniff`

The previous smoke therefore proved transport/download but not a Safari-playable container.

### New byte-level gate and proven root cause
PR #43 added `scripts/live_ios_container_probe.mjs`, which resolves a real movie through the Al-Qahtani backend and reads only bytes `0-4095` through the opaque media proxy. First run `34652562496` failed at the new compatibility step while the existing movie Range/download step passed.

For real movie `The Beloved`, the first bytes were:
`47 40 00 10 00 00 b0 0d 00 01 c1 00 00 00 01 ef ...`

This begins with MPEG-2 Transport Stream sync byte `0x47`; the response was nevertheless served as generic `application/octet-stream`. The player introduced in PR #42 detected MP4/HLS/Matroska but not MPEG-TS, so Safari received an untyped generic source. This is the first concrete root-cause evidence matching the user's symptom.

Apple's HLS documentation maps `.ts` MPEG-2 Transport Stream media to MIME `video/MP2T`. PR #43 therefore now:
- detects MPEG-TS from packet sync bytes in the bounded preflight;
- sets the HTML `<source>` type to `video/mp2t` for verified MPEG-TS;
- retains MP4/HLS/Matroska handling;
- adds `scripts/player_mpegts_webkit_smoke.mjs` to prove iPhone WebKit gets `video/mp2t` for an opaque Al-Qahtani MPEG-TS source;
- runs that regression in Mobile WebKit CI;
- keeps the live container gate in Remote movie playback smoke so future Range/download success cannot masquerade as playback compatibility.

The Download path is unchanged.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains the Basri flow.
- Upstream URLs remain hidden behind short-lived opaque `/api/cinema/media?id=...` references.
- Source/media host allowlists and SSRF protections remain mandatory.
- `.downet.net` TLS compatibility stays narrowly scoped; unrelated TLS stays strict.
- Range proxying must preserve HTTP 206, `Content-Range`, and `Accept-Ranges: bytes`.
- Worker/session data stays server-side.
- Referer values must remain URL-safe/ASCII-safe to avoid the prior ByteString failure with Arabic paths.
- `Player.html` must not invent a Download control; preserved original Basri evidence places Download in cinema details/episode flow.
- Ads/popups/unneeded tracking and Basri-app Intent/deep-link handoff remain prohibited.

## CI evidence
### PR #42 final head
All ten required PR gates passed before merge, including Mobile WebKit, Live provider, Remote movie playback, Web smoke, Remote CORS, CORS boundary, Basri player/download contracts, media-reference expiry, and trusted filename.

### Exact main `2a02d33e...`
GitHub Pages build/deploy succeeded for the same commit. Remote movie playback succeeded under the old transport-only contract and produced the live evidence above.

### PR #43 first diagnostic head `1bbab055...`
- Remote movie playback smoke run `34652562496`: **failure by design of the new gate**.
- Existing candidate movie Range/download step: success.
- New live-container step: failed with `IOS_SAFARI_INCOMPATIBLE_CONTAINER_unknown` because bytes were MPEG-TS while MIME was `application/octet-stream`.
- This was fixed on the same PR by recognizing MPEG-TS and typing it `video/mp2t`.
- Other PR gates on that diagnostic head were running/green as normal; they are not reusable for a later head.

### Current PR #43 head
A later code head before this docs update was `bc127697933e12a0261f477cc5c649978c8d1433`, adding MPEG-TS player detection plus iPhone WebKit regression. This documentation update creates a newer final head, so all required CI must be evaluated on that newest head before merge.

## Render evidence / blocker
The Render connector exposes two workspaces owned by the account:
- `My Workspace` (`tea-da2kb22jnfac73dpui5g`)
- `بيانات` (`tea-dae92bgn74is73cs92ug`)

No trustworthy repository evidence identifies which workspace owns Al-Qahtani. Do not guess and do not claim direct Render log inspection. External deployed tests against `https://al-qahtani-api.onrender.com` remain valid runtime evidence.

## Web parity / Flutter status
Web parity is **not yet declared complete**. The previous transport-only movie smoke was insufficient and the iPhone issue now has a concrete MPEG-TS/MIME root cause. Flutter remains blocked until:
1. PR #43 final head is green;
2. PR #43 is merged;
3. GitHub Pages and deployed backend are verified for the resulting main commit;
4. the live real-movie path proves the media is detected/typed correctly and iPhone/WebKit playback behavior no longer fails with unsupported-source.

## Next-run goals
1. Inspect the newest PR #43 head and all ten CI gates; never rely on the earlier diagnostic head.
2. Fetch exact logs for any failure and fix on `test/live-ios-container-43` only.
3. Require the live movie-container probe to classify `The Beloved` (or another bounded real movie candidate) as MPEG-TS/MP4/HLS rather than generic unknown.
4. Require Mobile WebKit to pass the new MPEG-TS `video/mp2t` regression.
5. Keep existing matches/news/search/category/details/episodes/download/Range regressions green.
6. Merge #43 only after all final-head gates are green.
7. After merge, verify GitHub Pages and deployed runtime on the exact resulting `main` commit.
8. Re-run real movie Watch through the deployed Al-Qahtani backend and inspect first bytes/MIME/Range; do not treat Download success as playback proof.
9. If Safari still fails despite `video/mp2t`, inspect transport-stream codecs/program metadata before considering any remux/transmux; prefer original Basri alternative media when available and avoid heavy/paid transcoding.
10. Do not begin Flutter until the live Web/iPhone playback gate is genuinely proven.
