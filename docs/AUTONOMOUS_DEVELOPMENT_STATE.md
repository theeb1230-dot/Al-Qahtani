# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The preserved `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployed evidence is required before claiming Web parity.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, and every Theeb provider/API.
- `THEEB_SERVICE_TOKEN` and other cross-project credentials do not belong here.
- Historical `https://akwam.ss/...` URLs are part of the original Basri cinema contract only; their presence is not integration with the separate akwam-indexer repository.
- Matches/news remain on original Basri workers. Cinema stays on the original Basri chain with server-side direct fallback to the historical Basri source when the origin-locked cinema Worker fails or returns unusable empty data.

## Current repository state
- Product `main` at start of this run: `39e3ccfc9241ab88ab2f093dad67fb5cea5aebeb` (`Fix iPhone MPEG-TS movie playback`).
- Active PR: #44 `Fix Basri episode numbering at the source` on `fix/content-normalization-44`.
- Code/test head before this documentation update: `9e892f022ccef1a48aa7e158fd602af97a7b3fab`.
- This documentation update creates a newer head, so merge is allowed only after required checks are green on the exact final head.

## Proven iPhone Safari playback state
The user tested the deployed site on a real iPhone Safari after PR #43. Playback now works broadly for movies/series/anime, including iOS native controls, fullscreen, seeking/time display on multiple sources. Keep the MPEG-TS/HLS wrapper and its regressions intact. Do not reopen the old incident as if all playback is still broken.

## User-reported remaining regressions
1. Episode buttons show upstream content IDs such as `89517`, `101847`, `48829` instead of human episode numbers.
2. Some cinema/search entries behave like download-only or preview material rather than ordinary watchable content; the reported example was `Grand Theft Auto VI: An Extended Look`. This must be handled by general validity checks, not title-specific blocking.
3. Some anime/MPEG-TS sources have unstable inline duration/timeline behavior; frames can advance while embedded duration is absent or misleading, with duration appearing only after fullscreen.

## PR #44 root cause and fix
`server/basri-source.mjs` previously extracted episode numbers from the URL and could fall back to a trailing numeric path component. On source variants where the canonical episode slug is absent from the href, that numeric component is the upstream episode ID, not the display number.

PR #44 now:
- parses canonical `الحلقة-N` / `episode-N` when present;
- parses visible anchor text plus `title` / `aria-label` when the href omits the canonical slug;
- keeps `episode_id` separate from `episode_number`;
- never intentionally promotes the `/episode/<id>/` identifier to the UI number;
- uses only a bounded positional fallback when no explicit display number exists;
- sorts parsed episodes by normalized display number.

## Regression evidence on code head `9e892f0...`
- Web smoke run `34656165726`: success. Its deterministic `scripts/episode_number_test.mjs` proves IDs `89517`, `89542`, `89760` remain separate while displayed numbers are `1,2,3`.
- Live provider smoke run `34656165687`: success. Its live step `Verify live episode numbering uses display numbers, not source IDs` passed against the preserved Basri source using `scripts/live_episode_number_probe.mjs` and a real series search.
- Remote movie playback run `34656165722`: success, preserving the movie playback/Range regression.
- Remote CORS `34656165717`: success.
- CORS boundary `34656165639`: success.
- Original Basri player contract `34656165840`: success.
- Original Basri download contract `34656165714`: success.
- Media reference expiry `34656165700`: success.
- Trusted download filename `34656165576`: success.
- Mobile WebKit `34656165667` was still running when this documentation update was prepared; final merge requires it and all checks to succeed on the newer documentation head too.

## Security/runtime invariants
- Search/Category → Details → Episodes → Watch/Download → Media remains the Basri flow.
- Upstream URLs remain hidden behind short-lived opaque `/api/cinema/media?id=...` references.
- Source/media host allowlists and SSRF protections remain mandatory.
- `.downet.net` TLS compatibility stays narrowly scoped; unrelated TLS stays strict.
- Range proxying must preserve HTTP 206, `Content-Range`, and `Accept-Ranges: bytes`.
- Worker/session data stays server-side.
- Referer values remain URL-safe/ASCII-safe to avoid the prior ByteString failure with Arabic paths.
- Ads/popups/unneeded tracking and Basri-app Intent/deep-link handoff remain prohibited.

## Render evidence / blocker
The account exposes multiple Render workspaces, but repository evidence still does not identify which workspace owns Al-Qahtani. Do not guess and do not claim direct Render log inspection. External deployed tests against `https://al-qahtani-api.onrender.com` remain valid runtime evidence.

## Web parity / Flutter status
Flutter remains blocked. Real iPhone playback is broadly proven, but Web parity is not complete until episode numbering is deployed and retested, invalid/download-only entries are handled generically, and Safari timeline/duration/seek behavior is acceptable or accurately represented for sources without reliable duration metadata.

## Next-run goals
1. Require all PR #44 checks green on the exact newest head, fetch exact logs for any failure, and fix only on `fix/content-normalization-44`.
2. Merge PR #44 only after final-head green status.
3. After merge, wait for GitHub Pages/backend deployment and retest several real series so episode buttons show human numbers rather than upstream IDs.
4. Add a live/deployed episode-number gate after merge so IDs cannot regress into the UI.
5. Investigate the reported download-only/preview anomaly generically by tracing Category/Search → Details → Watch/Download for affected entries; do not blacklist titles by name.
6. Define content validity using the original Basri contract and media-path evidence, preserving legitimate short films/documentaries.
7. Inspect MPEG-TS/HLS duration behavior: `loadedmetadata`, `durationchange`, `seekable`, native Safari fullscreen versus embedded behavior.
8. Remove the current synthetic `#EXTINF:43200` duration if evidence shows it misleads Safari; prefer real duration metadata or an honest unknown-duration strategy without breaking playback.
9. Keep existing movie playback, Safari Range, CORS, download, expiry, filename, no-ad/no-intent and no-Theeb-integration gates green.
10. Do not begin Flutter until the live Web parity conditions above are satisfied.
