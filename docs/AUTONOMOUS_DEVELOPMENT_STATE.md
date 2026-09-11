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
- PR #43 is the only active development branch/PR and must be completed before opening another PR.
- Code head before this documentation commit: `7b5f69b9cdcfa88c38ea6770fda35c32d94125e2`. It wraps verified MPEG-TS media in a generated HLS playlist for Safari and updates the iPhone WebKit regression accordingly.
- This documentation commit creates a newer final head. All required CI must therefore be evaluated again on that newest head before merge.

## iPhone Safari movie playback incident
User evidence showed movie categories/details and Download work, but Watch begins loading and stops with Safari's unsupported-source icon. This invalidated the earlier assumption that HTTP Range success alone proved playback compatibility.

## Live byte-level evidence and root cause
The normal Al-Qahtani/Basri path resolved a real movie:
- category: `أجنبية`
- title: `The Beloved`
- source: `basri-direct`
- opaque media path: `/api/cinema/media?id=...`
- media size: `1147681720` bytes from `Content-Range`
- Range: HTTP `206`
- `Accept-Ranges: bytes`
- upstream/proxy MIME: `application/octet-stream`
- bounded Download: success with trusted `The Beloved` filename and `X-Content-Type-Options: nosniff`

The first bytes from `Range: bytes=0-4095` were:
`47 40 00 10 00 00 b0 0d 00 01 c1 00 00 00 01 ef ...`

That is MPEG-2 Transport Stream packet data beginning with sync byte `0x47`, not MP4. The previous smoke therefore proved fetch/download transport, not Safari playback.

## PR #43 playback strategy
1. PR #42 already added byte/MIME inspection for MP4/HLS/Matroska, but the real source was MPEG-TS served as generic octet-stream.
2. PR #43 added MPEG-TS detection and a live container gate. The first diagnostic run failed with `IOS_SAFARI_INCOMPATIBLE_CONTAINER_unknown`, while Range/download still passed, which exposed the real root cause.
3. A later head recognized MPEG-TS and initially tried a bare `video/mp2t` source. Container classification passed, but MIME identity alone is not sufficient proof that Safari will play a standalone TS URL.
4. Current code therefore does not hand the raw opaque TS URL directly to the video element. `Player.html` builds a short-lived in-memory HLS `.m3u8` Blob playlist whose only media segment is the same opaque Al-Qahtani `/api/cinema/media?id=...` URL, then reuses the existing native-HLS/Hls.js path.

Current safeguards:
- bounded 4 KiB preflight detects MP4, HLS, Matroska/WebM, and MPEG-TS from real bytes/MIME;
- generated HLS manifest contains only the opaque Al-Qahtani media URL, never `akwam.ss` or `downet.net`;
- temporary HLS Blob URL is revoked when playback stops or switches;
- `scripts/live_ios_container_probe.mjs` prevents Range/download success from masquerading as container compatibility;
- `scripts/player_mpegts_webkit_smoke.mjs` now requires an HLS Blob source, `#EXTM3U`, the exact opaque media URL, and no upstream-host leakage;
- Download remains unchanged in the original Basri cinema details/episode flow;
- no player-level Download UI is introduced.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains the Basri flow.
- Upstream URLs remain hidden behind short-lived opaque `/api/cinema/media?id=...` references.
- Source/media host allowlists and SSRF protections remain mandatory.
- `.downet.net` TLS compatibility stays narrowly scoped; unrelated TLS stays strict.
- Range proxying must preserve HTTP 206, `Content-Range`, and `Accept-Ranges: bytes`.
- Worker/session data stays server-side.
- Referer values must remain URL-safe/ASCII-safe to avoid the prior ByteString failure with Arabic paths.
- Ads/popups/unneeded tracking and Basri-app Intent/deep-link handoff remain prohibited.

## CI evidence
- PR #42 final head passed all ten required gates before merge.
- First PR #43 diagnostic live-container gate failed while existing Range/download passed, with exact evidence: `IOS_SAFARI_INCOMPATIBLE_CONTAINER_unknown; contentType=application/octet-stream; magic=474000100000b00d0001c100000001ef`.
- Code head `bc127697933e12a0261f477cc5c649978c8d1433` later passed Remote movie playback run `34652743598`; its live probe classified `The Beloved` as `mpeg-ts` with HTTP 206 and correct byte-range headers.
- Those earlier results are diagnostic only and cannot be reused after the HLS-wrapper change.
- Code head `7b5f69b9cdcfa88c38ea6770fda35c32d94125e2` changed both playback and the MPEG-TS-specific WebKit regression. This documentation update creates a newer head, so fresh final-head CI is mandatory.

Required final-head gates:
- Web smoke
- Live provider smoke
- Mobile WebKit smoke, including MPEG-TS HLS-wrapper regression
- Remote movie playback smoke, including live container probe
- Remote CORS smoke
- CORS boundary
- Original Basri player contract
- Original Basri download contract
- Media reference expiry
- Trusted download filename

## Render evidence / blocker
The Render connector exposes two workspaces owned by the account:
- `My Workspace` (`tea-da2kb22jnfac73dpui5g`)
- `بيانات` (`tea-dae92bgn74is73cs92ug`)

No trustworthy repository evidence identifies which workspace owns Al-Qahtani. Do not guess and do not claim direct Render log inspection. External deployed tests against `https://al-qahtani-api.onrender.com` remain valid runtime evidence.

## Web parity / Flutter status
Web parity is **not yet declared complete**. Flutter remains blocked until:
1. PR #43 newest head is green on every required gate;
2. PR #43 is merged;
3. GitHub Pages and deployed backend are verified for the exact resulting main commit;
4. the live real-movie path still proves MPEG-TS/HLS handling and Range after deployment;
5. actual iPhone Safari behavior no longer shows the unsupported-source failure. CI/container classification alone must not be presented as 100% proof of user-device playback.

## Next-run goals
1. Inspect the newest PR #43 head and all final-head CI gates.
2. Fetch exact job logs for any failure and fix only on `test/live-ios-container-43`.
3. Require Mobile WebKit to prove MPEG-TS is wrapped as HLS through a Blob manifest containing only the opaque Al-Qahtani media URL.
4. Require the live container probe to continue classifying the real movie as MPEG-TS/MP4/HLS rather than generic unknown.
5. Keep matches/news/search/all categories/details/episodes/download/Range/CORS/security regressions green.
6. Merge #43 only after every final-head required gate is green.
7. After merge, verify GitHub Pages and deployed runtime on the exact resulting `main` commit.
8. Re-run real movie Watch through the deployed backend and inspect first bytes/MIME/Range/container; do not treat Download success alone as playback proof.
9. If actual Safari still fails after HLS wrapping, inspect MPEG-TS program/codec metadata and seek an original Basri alternate playable media option before considering remux/transmux. Avoid paid or heavy transcoding unless evidence proves it is necessary.
10. Do not begin Flutter until the live Web/iPhone movie playback gate is genuinely proven.
