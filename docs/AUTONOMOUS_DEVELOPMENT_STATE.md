# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The preserved `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployed evidence is required before claiming Web parity.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, and every Theeb provider/API.
- `THEEB_SERVICE_TOKEN` and other cross-project credentials do not belong here.
- Historical `https://akwam.ss/...` URLs are part of the original Basri cinema contract only; their presence is not integration with the separate akwam-indexer repository.
- Matches/news remain on original Basri workers. Cinema stays on the original Basri chain with server-side direct fallback to the historical Basri source when the origin-locked cinema Worker fails or returns unusable empty data.

## Current repository state
- Product `main` at start of this run: `01163cbfa6ff447cba1d28ef8c62f05600283654`, merged from PR #44 `Fix Basri episode numbering at the source`.
- Active PR: #45 `Validate problematic movie watchability before filtering` on `fix/cinema-watchability-45`.
- Code/test head before this documentation update: `9b3f0cba0930285e53e245f25e17194cfaf8e873`.
- This documentation update creates a newer final head. Merge is allowed only after every required gate is green on that exact final head.

## Proven iPhone Safari playback state
The user tested the deployed site on a real iPhone Safari after the MPEG-TS/HLS fix. Playback now works broadly for movies/series/anime, including iOS native controls, fullscreen, seeking/time display on multiple sources. Keep the MPEG-TS/HLS wrapper and its regressions intact. Do not reopen the old incident as if all playback is broken.

## Episode numbering: fixed and merged
PR #44 fixed the upstream-ID display regression at the parser boundary:
- canonical `الحلقة-N` / `episode-N`, visible labels, `title`, and `aria-label` are used for display number when available;
- `/episode/<id>/` stays `episode_id`, never the UI episode number;
- bounded positional fallback is used only when explicit numbering is absent;
- episodes are sorted by normalized display number.

Live CI evidence on the preserved Basri source used `حلم أشرف الموسم الثاني مدبلج`: 112 episodes normalized to `1,2,3,...` while source IDs remained `89517`, `89542`, `89560`, etc. This proves the IDs and displayed episode numbers are now independent.

## PR #45: reported GTA download-popup anomaly
The reported `Grand Theft Auto VI: An Extended Look` item is a legitimate entry in the preserved Basri source, not an ad record that should be title-blacklisted. Root tracing found:
- the movie details page has two normal `/watch/...` links and two `/download/...` links;
- the old generic watch-page regex also captured page assets (`jpg`, `svg`, JavaScript) as media candidates;
- the real watch candidates are `.mkv`-named `.downet.net` URLs;
- `.downet.net` still requires the existing narrowly scoped legacy-TLS compatibility path;
- bounded server-side magic-byte probing shows at least one `.mkv`-named candidate is actually MPEG-TS despite its filename extension;
- therefore URL extension or upstream attachment semantics must not decide browser playback by themselves.

## PR #45 fix
- `server/basri-source.mjs` filters watch-page candidates to actual media-shaped URLs and excludes page images/scripts/assets.
- HLS and MP4 are preferred when explicitly available, while Matroska-labelled candidates remain available for server-side byte inspection instead of being blindly handed to Safari.
- `server/app.mjs` probes at most a bounded set of watch/media candidates with a 4 KiB range using the existing source allowlist, SSRF protection, referer handling, and `.downet.net` TLS compatibility.
- Container selection is based on MIME + magic bytes for HLS/MP4/MPEG-TS/Matroska-WebM.
- If a misleading `.mkv` URL actually contains MPEG-TS, it remains playable through the existing opaque Al-Qahtani media proxy and Safari HLS wrapper.
- Normal playback does not forward upstream `Content-Disposition`; only explicit `download=1` receives a trusted attachment filename. This prevents Safari from opening the ordinary Watch action as a download solely because the upstream host labels the media as an attachment.
- Raw watch/download/media upstream URLs remain absent from the cinema details response. Posters may remain external assets as before.

## PR #45 regression evidence
On code head `9b3f0cba0930285e53e245f25e17194cfaf8e873`:
- Live provider smoke run `34657133862` passed the real GTA watchability regression and the already-merged episode-number regression.
- `scripts/watch_parser_test.mjs` passed deterministic filtering: HLS → MP4 → Matroska preference, no image/script assets.
- Remote movie playback run `34657133935`: success, preserving live container classification and Safari Range behavior.
- Web smoke run `34657133840`: success.
- Remote CORS run `34657133955`: success.
- CORS boundary run `34657133901`: success.
- Original Basri player contract run `34657133780`: success.
- Original Basri download contract run `34657133838`: success.
- Media reference expiry run `34657133826`: success.
- Trusted download filename run `34657133872`: success.
- Mobile WebKit run `34657133769` was still running while this handoff was written; the final documentation head must rerun and pass all required gates before merge.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains the Basri flow.
- Upstream media URLs remain hidden behind short-lived opaque `/api/cinema/media?id=...` references.
- Source/media host allowlists and SSRF protections remain mandatory.
- `.downet.net` TLS compatibility stays narrowly scoped; unrelated TLS stays strict.
- Range proxying must preserve HTTP 206, `Content-Range`, and `Accept-Ranges: bytes` where upstream supports them.
- Normal playback must never inherit an upstream attachment disposition. Explicit `download=1` must retain trusted download behavior.
- Worker/session data stays server-side.
- Referer values remain URL-safe/ASCII-safe to avoid the prior ByteString failure with Arabic paths.
- Ads/popups/unneeded tracking and Basri-app Intent/deep-link handoff remain prohibited.

## Remaining user-reported regression: Safari duration/timeline
`Player.html` still creates the MPEG-TS compatibility HLS manifest with synthetic `#EXT-X-TARGETDURATION:43200` and `#EXTINF:43200.000`. That fixed playback compatibility but gives Safari fabricated 12-hour VOD metadata. The user's real-device evidence of missing/odd inline duration and a different duration after fullscreen makes this the next root-level priority. Do not replace one fake duration with another. Prefer bounded real duration/seekability evidence when available, otherwise represent duration honestly without breaking playback.

## Render evidence / blocker
The account exposes multiple Render workspaces, but repository evidence still does not identify which workspace owns Al-Qahtani. Do not guess and do not claim direct Render log inspection. External deployed tests against `https://al-qahtani-api.onrender.com` remain valid runtime evidence.

## Web parity / Flutter status
Flutter remains blocked. Real iPhone playback is broadly proven and episode numbering is fixed, but Web parity is not complete until PR #45 is merged/deployed/retested and Safari timeline/duration/seek behavior is corrected or honestly represented for sources without reliable duration metadata.

## Next-run goals
1. Require all PR #45 checks green on the exact documentation head; fetch exact logs for failures and fix only on `fix/cinema-watchability-45`.
2. Merge PR #45 only after the exact final head is fully green.
3. Wait for GitHub Pages and backend deployment of the resulting main commit; verify the live GTA details → Watch → media path has no browser attachment header and still preserves explicit download attachment behavior.
4. Retest live episode numbering so IDs cannot regress into the UI.
5. Preserve matches, news, all categories/search/details/episodes, Range/CORS/security/download regressions.
6. Start the next single PR from the post-merge main for Safari duration/timeline only.
7. Replace the synthetic 43200-second HLS metadata using bounded real duration/seekability evidence if obtainable without heavy transcoding.
8. Add WebKit regressions for `loadedmetadata`, `durationchange`, finite/unknown duration semantics, and seekable ranges in embedded playback.
9. Confirm fullscreen and inline behavior remain consistent enough on Safari and do not regress MPEG-TS playback.
10. Do not begin Flutter until live Web parity conditions above are satisfied.
