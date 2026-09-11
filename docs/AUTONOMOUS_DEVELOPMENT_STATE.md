# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The preserved `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployed evidence is required before claiming Web parity.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, and every Theeb provider/API.
- `THEEB_SERVICE_TOKEN` and other cross-project credentials do not belong here.
- Historical `https://akwam.ss/...` URLs are part of the original Basri cinema contract only; their presence is not integration with the separate akwam-indexer repository.
- Matches/news remain on original Basri workers. Cinema stays on the original Basri chain with server-side direct fallback to the historical Basri source when the origin-locked cinema Worker fails or returns unusable empty data.

## Current repository state
- Current product `main`: `f6e01aeed3a5f8001935182ec561f030d1993726`, squash-merged from PR #45 `Harden cinema watchability and attachment handling`.
- Active PR: #46 `Measure MPEG-TS duration for Safari HLS timeline` on `fix/safari-mpegts-duration-46`.
- Code/test head before this documentation update: `849b93e78d48dac024d88eac8357d106fd68a12e`.
- This documentation update creates a newer final head. Do not merge until all required gates rerun and pass on that exact final head.

## Proven iPhone Safari playback state
The user has already verified on a real iPhone Safari that playback broadly works after the MPEG-TS/HLS compatibility fix, including movies, series, anime, native iOS controls, seeking/time display, and fullscreen on multiple sources. Preserve this behavior. The current work is a duration/timeline metadata correction, not a wholesale playback rewrite.

## Episode numbering status
PR #44 fixed episode numbering at the parser boundary. Internal source IDs such as `89517` remain separate from displayed episode numbers. Live evidence on `حلم أشرف الموسم الثاني مدبلج` showed 112 displayed episodes normalized to `1,2,3,...` while source IDs remained `89517`, `89542`, `89560`, etc. The regression remains gated in CI.

## PR #45 watchability result and deployment evidence
The reported `Grand Theft Auto VI: An Extended Look` anomaly was traced without title blacklisting. It is a legitimate Basri item. The real defect was generic watch-candidate parsing plus upstream attachment semantics and misleading file extensions.

PR #45 now:
- filters page assets out of watch media candidates;
- classifies real candidates from MIME + magic bytes rather than URL extension alone;
- preserves a `.mkv`-named candidate when bounded probing proves it is actually MPEG-TS;
- strips upstream `Content-Disposition` from normal playback;
- adds trusted attachment headers only for explicit `download=1`;
- keeps short-lived opaque `/api/cinema/media?id=...` references and does not expose upstream media URLs.

After merge to `f6e01aeed3a5f8001935182ec561f030d1993726`:
- GitHub Pages exact-commit deployment run `34657276597`: success.
- Remote runtime smoke run `34657277260`: success.
- Required push regressions observed for the merge remained green, including Range/CORS/download/player contracts.

Render workspace ownership is still ambiguous, so no Render workspace/log claim is made. External deployed runtime checks remain the trustworthy evidence available without guessing.

## PR #46 root cause: fabricated 12-hour timeline metadata
The MPEG-TS Safari compatibility wrapper on main used a single-segment HLS manifest with fixed:
- `#EXT-X-TARGETDURATION:43200`
- `#EXTINF:43200.000,`

That fabricated twelve-hour VOD duration can explain the user-observed Safari timeline inconsistency. Playback itself works; the metadata is dishonest and can mislead Safari's inline/fullscreen duration/seek UI.

## PR #46 implementation
`Player.html` now performs bounded duration probing only for verified MPEG-TS media:
- keeps the existing 4 KiB MIME/magic preflight;
- reads total media size from `Content-Range`;
- samples bounded head/tail byte ranges through the existing opaque Al-Qahtani media URL;
- detects TS packet alignment and parses PES PTS timestamps using the 90 kHz transport clock;
- handles the 33-bit PTS wraparound;
- prefers head-to-tail PTS duration when trustworthy;
- can derive a bounded byte-rate estimate from multiple head PTS samples if the tail cannot yield an exact timestamp;
- rejects absurd/non-finite duration values.

When a trustworthy duration exists, the generated HLS manifest uses the measured value for `EXTINF` and `TARGETDURATION` and remains a VOD playlist with `ENDLIST`. When duration cannot be proven, the player does not claim a fake 43200-second VOD; it uses an honest non-VOD fallback status while preserving playback behavior. Upstream hosts remain absent from the manifest and Download behavior is unchanged.

The player also observes `loadedmetadata` and `durationchange` for diagnostic/regression visibility.

## PR #46 regression evidence on code head `849b93e78d48dac024d88eac8357d106fd68a12e`
The first CI wave contains ten required PR workflows. Confirmed successes include:
- Trusted download filename `34657524719`.
- Media reference expiry `34657524779`.
- Original Basri download contract `34657524774`.
- Original Basri player contract `34657524759`.
- Remote CORS smoke `34657524770`.
- CORS boundary `34657524756`.
- Remote movie playback smoke `34657524718`.
- Web smoke `34657524772`.
- Live provider smoke `34657524720`.

Mobile WebKit run `34657524768` was still in progress when this handoff update was written. Its MPEG-TS regression now creates synthetic TS/PES PTS samples and requires the generated HLS manifest to:
- keep the opaque Al-Qahtani media URL only;
- never leak `akwam.ss` or `downet.net`;
- contain no `43200` fake duration;
- use VOD + ENDLIST for measured duration;
- produce a measured `EXTINF` matching the bounded synthetic PTS evidence.

Because this documentation commit changes the PR head, all final-head gates must run again before merge even if this first code-head suite becomes fully green.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains the Basri flow.
- Upstream media URLs remain behind short-lived opaque media references.
- Source/media allowlists and SSRF protections remain mandatory.
- `.downet.net` legacy-TLS compatibility stays narrowly scoped.
- Safari byte-range behavior must preserve HTTP 206, `Content-Range`, and `Accept-Ranges` where supported.
- Normal playback must not inherit upstream attachment disposition; explicit Download retains trusted attachment behavior.
- Worker/session data stays server-side.
- Referer values stay URL-safe/ASCII-safe.
- Ads/popups/unneeded tracking and legacy Basri Android app Intent/deep-link handoff remain prohibited.

## Web parity / Flutter status
Flutter remains blocked. Live iPhone playback is broadly proven, episode numbering is fixed, and the abnormal watch/download path is hardened, but Safari duration/timeline/seek must be deployed and verified before declaring complete Web parity. WebKit CI is evidence, not a substitute for the physical iPhone confirmation after deployment.

## Next-run goals
1. Re-fetch PR #46 actual final head and require every workflow green on that exact SHA.
2. Fetch exact logs for any Mobile WebKit or other failure and fix only on `fix/safari-mpegts-duration-46`.
3. Merge #46 only after the final documentation head is fully green.
4. After merge, wait for GitHub Pages and deployed backend/runtime checks for the exact main commit.
5. Verify the live MPEG-TS path still preserves 206 / Content-Range / Accept-Ranges and no upstream URL leakage.
6. Verify the live player no longer emits fabricated 43200-second HLS duration metadata.
7. Retest embedded and fullscreen duration/seek behavior on Safari/WebKit; physical iPhone evidence remains the final device-level proof.
8. Keep episode-number, GTA/watchability, search/category/details/episodes/download, matches/news, CORS and security regressions green.
9. Do not guess a Render workspace; record the blocker until repository evidence identifies the correct one.
10. Do not start Flutter until full live Web parity conditions are satisfied.
