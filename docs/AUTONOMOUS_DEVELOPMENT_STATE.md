# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The preserved `albasritv.github.io-main.zip` remains the behavioral baseline. Live deployed evidence is required before claiming Web parity.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer`, Theeb Engine, and every Theeb provider/API.
- `THEEB_SERVICE_TOKEN` and other cross-project credentials do not belong here.
- Historical `https://akwam.ss/...` URLs are part of the original Basri cinema contract only; their presence is not integration with the separate akwam-indexer repository.
- Matches/news remain on original Basri workers. Cinema stays on the original Basri chain with server-side direct fallback to the historical Basri source when the origin-locked cinema Worker fails or returns unusable empty data.

## Current repository state
- Product `main` at the beginning of this run: `9339af55d9957e537606ff30b5f9de8df42ac4e6` (`Restore real match team logos`).
- No PR was open at run start, so a new PR was allowed.
- Active PR: #51 `Expand live episode numbering coverage` on `test/multi-series-episode-numbering-51`.
- Code head before this documentation commit: `08d8dc7212d512c32e166bcc1d29264d64cb6cf6`.
- This documentation update creates a newer final head; merge only after all required workflows rerun and pass on that exact final head.

## Proven playback state
The user has already verified on real iPhone Safari that playback broadly works after the MPEG-TS/HLS compatibility fixes, including movies, series, anime, native iOS controls, seeking/time display, and fullscreen on multiple sources. Preserve that behavior; do not treat the player as globally broken.

The deployed code on main already includes:
- MIME + magic-byte classification for MP4/HLS/Matroska/WebM/MPEG-TS;
- Safari byte-range handling with 206 / `Content-Range` / `Accept-Ranges` regressions;
- opaque Al-Qahtani media references without upstream URL leakage;
- explicit Download semantics separated from normal playback;
- MPEG-TS HLS wrapping with measured duration instead of the old fabricated 43200-second timeline where trustworthy PCR/PTS evidence exists.

## Episode numbering: new multi-category evidence
The prior live regression covered only one Turkish search result. PR #51 expands live coverage to:
- search: `حلم أشرف الموسم الثاني مدبلج`;
- مسلسلات أجنبية;
- مسلسلات عربية;
- مسلسلات تركية;
- مسلسلات آسيوية;
- مسلسلات أنمي;
- مسلسلات رمضان.

The first PR #51 run (`Live provider smoke` run `34660387525`) deliberately failed and exposed a real parser weakness rather than a flaky infrastructure failure:
- `حلم أشرف الموسم الثاني مدبلج`: duplicate display episode numbers existed later in the 112-entry list;
- `حب ع ورق`: duplicate display episode numbers existed;
- `البراني`: source-derived values began `2,2,3,4...`, proving that trusting every slug/anchor number directly is unsafe;
- `Reacher الموسم الرابع`, `Agent Kim Reactivated`, `شراب التوت الموسم الرابع مدبلج`, and `Alley Cats` already showed clean display numbering while source IDs such as `101923`, `101847`, `93229`, etc. remained distinct.

Root fix on code head `08d8dc7212d512c32e166bcc1d29264d64cb6cf6`:
- episode labels are preferred over slug text when extracting explicit display numbers;
- internal `/episode/<id>/...` IDs remain separate as `episode_id`;
- duplicate/suspicious display-number sequences are collapsed and normalized to a logical contiguous display sequence instead of leaking source IDs or preserving broken duplicate numbering;
- clean unique sequences remain unchanged;
- live probe now runs the full series category matrix with bounded concurrency (maximum two category chains at once).

The follow-up `Live provider smoke` run `34660465958` passed the new multi-category episode-number step on the fixed code head, along with match-logo proxy, provider, watch parser, abnormal movie watchability, and local backend tests before this documentation commit changed the head.

## Watchability / abnormal cinema result state
The reported `Grand Theft Auto VI: An Extended Look` case remains fixed generically, not by title blacklist. Page assets are excluded from media candidates; candidates are classified from MIME/magic bytes; normal playback strips upstream attachment disposition; explicit Download keeps trusted attachment behavior. This regression remained green in PR #51 before the documentation head changed.

## Safari timeline/duration state
The old fixed `43200`-second HLS metadata has already been removed from main. MPEG-TS duration probing is bounded and uses transport timestamps when trustworthy; when duration cannot be proven, the player avoids claiming a fake duration. Mobile WebKit remains a required gate so episode/parser work cannot silently regress the current iPhone playback path.

## CI evidence for PR #51 code head `08d8dc7212d512c32e166bcc1d29264d64cb6cf6`
Confirmed success before this documentation update:
- Media reference expiry `34660465907`.
- Original Basri player contract `34660466062`.
- Remote CORS smoke `34660465938`.
- Original Basri download contract `34660465898`.
- Trusted download filename `34660465924`.
- Web smoke `34660465931`.
- CORS boundary `34660465921`.
- Remote movie playback smoke `34660466141`.
- Live provider smoke `34660465958`, including the expanded episode-numbering step.
- Mobile WebKit `34660465912` was still running when this handoff update was written; the final documentation head requires a fresh complete gate set anyway.

## Main deployment evidence at run start
For main `9339af55d9957e537606ff30b5f9de8df42ac4e6`, GitHub Pages run `34660177547` completed successfully. The latest main push also had the normal web/runtime workflow set active and green where observed.

Render access is connected, but two workspaces are visible (`My Workspace` and `بيانات`) and no repository evidence identifies the correct workspace unambiguously. Per safety rules no workspace was guessed, so no Render deployment/log claim is made in this run.

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
Flutter remains blocked. Playback is broadly proven on real iPhone Safari and the main branch contains the MPEG-TS/HLS, watchability, duration, and media-proxy fixes, but PR #51 must first prove episode numbering across multiple live content classes without playback regressions. Physical iPhone confirmation remains stronger evidence than CI for device-level timeline/seek behavior.

## Next-run goals
1. Re-fetch PR #51 actual final head and require every workflow green on that exact SHA.
2. Fetch exact logs for any failure and fix only on `test/multi-series-episode-numbering-51` while it remains open.
3. Reconfirm the expanded live episode matrix, especially Arabic/Ramadan duplicate cases that exposed the root defect.
4. Merge PR #51 only after all required gates are green on the final head.
5. After merge, wait for GitHub Pages and deployed runtime checks for the exact new main commit.
6. Re-run live search/category/details/episodes/watch/media checks, including `الذئب الوحيد` and `The Odyssey`, with bounded concurrency.
7. Keep GTA/watchability, media-type detection, 206 Range, upstream URL privacy, explicit Download, matches/news, CORS and Safari WebKit regressions green.
8. Verify the live player continues to avoid fabricated 43200-second duration metadata and preserves honest duration/seek behavior.
9. Do not guess a Render workspace; only inspect logs/deploys after repository evidence or explicit workspace confirmation identifies the correct one.
10. Do not start Flutter until live Web parity conditions remain satisfied after these episode-number corrections.
