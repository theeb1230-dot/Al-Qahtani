# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs in this project.
- The original Basri project behavior is the compatibility baseline.
- Matches/news use the original Basri workers.
- Cinema remains on the original Basri content chain. The historical cinema worker currently returns `403 FORBIDDEN_ORIGIN`, so the Al-Qahtani backend uses a server-side compatibility fallback over the same original content source rather than switching to another project/provider.

## Current state
- PR #17 `Restore original Basri cinema runtime` merged successfully.
- PR #18 `Fix deployed Basri parity gate` merged successfully.
- Current validated main/runtime commit: `2a18d199be194df143bd6961a2fc4ccf5764cb53`.
- Render deployment `dep-dahu3ucs728c73bq3eig` is live on that exact commit in Frankfurt.
- GitHub Pages deployment is enabled from main.
- Remote runtime smoke #10 passed against the actual deployed Render service.
- Web parity gate is now green for the restored Basri runtime. Flutter may proceed in later work, but must preserve this independent Al-Qahtani source boundary.

## Root causes fixed/contained
- Removed cross-project Theeb/akwam-indexer runtime integration.
- Restored category/search/details/episodes/watch behavior from the Basri chain.
- Historical cinema worker origin lock (`403 FORBIDDEN_ORIGIN`) is handled server-side with same-source fallback.
- Arabic URL Referers are percent-encoded before Node HTTP requests.
- Legacy `.downet.net` media currently presents an incomplete TLS chain. The media proxy first uses strict TLS and retries with broken-chain compatibility only for the already allowlisted `.downet.net` host and only for known certificate-chain failures. All other TLS remains strict.
- Direct media URLs remain hidden behind short-lived `/api/cinema/media?id=...` references.
- CORS and Safari byte-range forwarding are preserved.

## Deployed Web parity evidence
Remote runtime smoke #10 on main `2a18d199...` passed all required live checks:
- backend health reports `basri-original`;
- matches: 8 live entries;
- Basri news worker: HTTP 200/success;
- Arabic search: 4 real results from `basri-direct`;
- Arabic search details: `Tracker الموسم الثالث`, 14 episodes;
- episode playback resolved to `/api/cinema/media?id=...`;
- Safari range request returned HTTP 206;
- `Content-Range: bytes 0-1023/350455536`;
- `Accept-Ranges: bytes`.

All 12 visible cinema categories returned real cards and opened details remotely:
- series أجنبية: 24, details `Reacher الموسم الرابع`, 7 episodes;
- series عربية: 24, details `حب ع ورق`, 65 episodes;
- series تركية: 24, details `شراب التوت الموسم الرابع مدبلج`, 81 episodes;
- series آسيوية: 24, details `Agent Kim Reactivated`, 2 episodes;
- series أنمي: 24, details `Alley Cats`, 6 episodes;
- series رمضان: 24, details `البراني`, 15 episodes;
- movie أجنبية: 30, details opened;
- movie عربية: 30, details opened;
- movie هندية: 30, details opened;
- movie آسيوية: 30, details opened;
- movie تركية: 30, details opened;
- movie أنمي: 30, details opened.

## Render observations
- The successful parity run produced the expected `CINEMA_SESSION_403` fallback diagnostics because the legacy worker is origin-locked.
- Render logs during the live parity window showed fallback activity for search/category/details but no fatal application errors in the inspected window.
- Production service URL: `https://al-qahtani-api.onrender.com`.

## CI state
- PR #17 Web smoke: green.
- PR #17 Live provider smoke: green.
- PR #18 Web smoke: green.
- PR #18 Live provider smoke: green.
- Main Remote runtime smoke #10: green.

## Next run goals
1. Re-check main, PRs, CI, Render deploy/logs and this handoff before changes.
2. Keep Al-Qahtani independent from Theeb/akwam-indexer permanently.
3. Inspect `Player.html` and iPhone Safari UX now that backend playback parity is proven.
4. Add browser-level regression coverage for navigation from category/search to details, episode selection and player page.
5. Verify poster/title/episode-number metadata visually on mobile Safari-sized layouts.
6. Verify movie playback paths, not only series episode playback, with a deployed media Range probe.
7. Review download behavior from the original Basri flow and preserve it safely if exposed by the UI.
8. Continue ad/popup/tracking/deep-link regression checks.
9. Begin Flutter only as a faithful client over the proven Al-Qahtani backend, with Android Mobile/TV/iOS parity and no cross-project provider dependency.
10. Update this handoff at the end of every run with actual PR/commit/CI/Render/live-test evidence.
