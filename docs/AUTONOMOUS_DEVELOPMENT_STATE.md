# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main` is the behavioral baseline.

## Current branch
- Active development branch: `migration/web-parity-01`
- Main remains the stable baseline until the PR gates are green.

## Completed in this run
- Re-audited the current GitHub repository and confirmed only `main` existed before this run.
- Confirmed the repository documentation was ahead of the actual web files: core provider modules existed, but the migrated HTML pages were not yet present on GitHub.
- Re-inspected the original uploaded archive and confirmed it contains 9 files.
- Confirmed ad-network references are in the original `index.html` and the legacy Android package is referenced by `Player.html` / `bsr-Player.html`.
- Added a web-native `Player.html` that supports direct HLS, MP4 and embed playback.
- Added temporary compatibility decoding for legacy `intent?data=...` payloads without launching `com.bsr.player.pro`.
- Added `scripts/prepare_clean_web.py` to make the cleanup reproducible from the original extracted archive instead of relying on one-off manual edits.
- Strengthened `.github/workflows/web-smoke.yml` to reject ad domains, obfuscated news bootstrap, legacy package coupling in `Player.html`, and the old cinema host lock.
- Preserved `bsr-Player.html` as a temporary migration utility until equivalent behavior is proven in the new web-native flow.

## Verified original archive findings
- `index.html`: direct ad network scripts plus an advertising `window.open()` during server selection.
- `news.html`: XOR/base64 bootstrap that expands to a readable news page using `news.albesriali03.workers.dev`.
- `Player.html`: legacy app bridge targeting `com.bsr.player.pro`.
- `bsr-Player.html`: payload/Intent generator for the same legacy app.
- `basrimatches.html`: structured match/session flow with HLS/embed handling; preserve this behavior when unifying.
- `albasri-cinema.html`: cinema Worker plus old-host authorization lock; preserve cinema functionality while removing the lock.

## Current limitations
- The large cleaned HTML pages from the original archive are prepared locally during this run but are not all committed to GitHub yet.
- GitHub Actions returned no push-associated workflow run for the previous baseline commit through the available connector endpoint, so no green claim is made for that baseline.
- External provider liveness/playability is not yet proven by CI; static gates only protect repository structure and known regressions.

## Next run goals
1. Commit the cleaned `index.html`, decoded `news.html`, `basrimatches.html`, unlocked `albasri-cinema.html`, and compatibility `bsr-Player.html` into the active migration branch.
2. Update `sitemap.xml` to the Al-Qahtani GitHub Pages path.
3. Route UI fetches through provider modules instead of adding new Worker URLs to page code.
4. Expand normalized contracts for cinema search/details/episodes and match session/server payloads.
5. Add player source validation and typed playable-source failure states.
6. Add a GitHub Pages deployment workflow after static parity files are present.
7. Run/inspect PR CI and fix failures on the same branch.
8. Merge only after web parity gates are green.
9. Start the Flutter workspace only after the web behavior is testable end-to-end.
10. Add Android Mobile, Android TV and iOS build/release pipelines incrementally after Flutter parity begins.
