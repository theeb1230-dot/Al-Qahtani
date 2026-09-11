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
- Active PR: #43 `Gate live iPhone movie container compatibility` on `test/live-ios-container-43`.
- PR #43 is the only active PR and must be completed before opening another PR.
- Latest code head before this documentation update: `b3fcab140299b2135276e15a21b8a5fa67f6c43d`.
- This documentation update creates a newer final head, so merge is allowed only after all required gates are green on that exact newest head.

## iPhone Safari movie playback incident
User evidence showed movie categories/details and Download work, but Watch begins loading and stops with Safari's unsupported-source icon. Range/download success alone therefore does not prove Safari playback compatibility.

## Proven live byte-level root cause
A real Basri movie (`The Beloved`, category `أجنبية`) resolves through `basri-direct` to an opaque `/api/cinema/media?id=...` reference. Live bounded probing proved:
- HTTP `206`
- `Accept-Ranges: bytes`
- generic upstream/proxy MIME `application/octet-stream`
- file size `1147681720` bytes from `Content-Range`
- working bounded Download with trusted filename
- first bytes `47 40 00 10 00 00 b0 0d 00 01 c1 00 00 00 01 ef ...`

Those bytes are MPEG-2 Transport Stream data beginning with sync byte `0x47`, not MP4. The old player treated the movie as a generic direct stream, matching the reported Safari unsupported-source symptom.

## PR #43 playback strategy
- The existing 4 KiB preflight identifies MP4, HLS, Matroska/WebM, and MPEG-TS from bytes/MIME rather than trusting `stream` or `video/mp4` labels.
- Verified MPEG-TS is not handed to the video element as a generic octet-stream URL.
- `Player.html` builds an in-memory HLS manifest Blob whose only segment URL is the opaque Al-Qahtani `/api/cinema/media?id=...` reference, then reuses the existing native-HLS/Hls.js playback path.
- The temporary Blob URL is revoked when playback stops or changes.
- The generated manifest never exposes `akwam.ss`, `downet.net`, or another upstream media host.
- Download remains unchanged in the original Basri cinema details/episode flow. No player-level Download UI is introduced.

## WebKit and live-container regression evidence
- The first live-container gate intentionally failed while Range/download passed, exposing the actual MPEG-TS container behind `application/octet-stream`.
- Later Remote movie playback runs classify the same live movie as `mpeg-ts` and continue to require 206/Content-Range/Accept-Ranges.
- The MPEG-TS-specific WebKit regression instruments `URL.createObjectURL`, inspects the actual generated manifest Blob, requires MIME `application/vnd.apple.mpegurl`, `#EXTM3U`, the exact opaque Al-Qahtani media URL, and rejects upstream-host leakage.
- Mobile WebKit on code head `223547b3ea2c9358ef7dc4566359b418c95a2e4e` passed before the later smoke-hardening commit.

## Latest CI failure and root fix
On head `223547b3ea2c9358ef7dc4566359b418c95a2e4e`, nine required gates passed and only Live provider smoke run `34653224238` failed.

Exact failure evidence from job `103439884629`:
- the external provider probe passed matches, cinema category HTML, search, direct details, episode, watch-page media resolution, legacy-TLS detection, and news;
- local backend search/category also passed;
- the single details candidate chosen by `scripts/local_backend_smoke.mjs` hit the backend's bounded upstream timeout after about 30 seconds and returned 502 with `This operation was aborted`.

This was a transient upstream details timeout in the smoke's first chosen candidate, not a regression in the iPhone movie fix. Commit `b3fcab140299b2135276e15a21b8a5fa67f6c43d` hardens the smoke without weakening the product contract:
- details candidates are deduplicated from the already-proven search and category results;
- at most three candidates are tried sequentially;
- each attempt remains bounded;
- success still requires `basri-worker` or `basri-direct` status success;
- no arbitrary host, retry storm, or cross-project fallback is introduced.

Fresh CI on `b3fcab140299b2135276e15a21b8a5fa67f6c43d` then passed all ten required gates, including Live provider smoke run `34653448584`, Remote movie playback run `34653448595`, Mobile WebKit run `34653448569`, and Web smoke run `34653448689`.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains the Basri flow.
- Upstream URLs remain hidden behind short-lived opaque `/api/cinema/media?id=...` references.
- Source/media host allowlists and SSRF protections remain mandatory.
- `.downet.net` TLS compatibility stays narrowly scoped; unrelated TLS stays strict.
- Range proxying must preserve HTTP 206, `Content-Range`, and `Accept-Ranges: bytes`.
- Worker/session data stays server-side.
- Referer values must remain URL-safe/ASCII-safe to avoid the prior ByteString failure with Arabic paths.
- Ads/popups/unneeded tracking and Basri-app Intent/deep-link handoff remain prohibited.

## Required final-head gates
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
Web parity is not yet declared complete. Flutter remains blocked until:
1. PR #43 newest head is green on every required gate;
2. PR #43 is merged;
3. GitHub Pages and the deployed backend are verified for the exact resulting main commit;
4. the live real-movie path still proves MPEG-TS/HLS handling and Safari Range after deployment;
5. actual iPhone Safari behavior no longer shows the unsupported-source failure. CI/WebKit evidence must not be presented as 100% proof of the user's physical iPhone until the live user-device test succeeds.

## Next-run goals
1. Inspect the newest PR #43 head created by this documentation update and require all ten gates green on that exact head.
2. Fetch exact logs for any failure and fix only on `test/live-ios-container-43`.
3. Merge #43 only after the final head is fully green.
4. After merge, capture the exact resulting `main` SHA and verify GitHub Pages deployment for that commit.
5. Verify the deployed Al-Qahtani backend after its auto-deploy wait with real movie container/Range/download probes.
6. Keep matches/news/search/categories/details/episodes/watch/download/CORS/security regressions green.
7. Re-test `The Beloved` or another real Basri movie through the deployed path and confirm MPEG-TS is wrapped through the HLS path.
8. Do not treat Download or Range success alone as playback proof.
9. If actual Safari still fails, inspect transport-stream program/codec metadata and original Basri alternate media before considering any remux/transmux; avoid paid/heavy transcoding unless evidence proves it necessary.
10. Do not begin Flutter until live Web/iPhone movie playback is genuinely proven.
