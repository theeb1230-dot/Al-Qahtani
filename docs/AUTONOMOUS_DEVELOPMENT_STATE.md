# Autonomous Development State

## Source of truth
GitHub repository state wins over this handoff if they disagree. The original uploaded archive `albasritv.github.io-main.zip` remains the behavioral baseline.

## Product boundary
- `Al-Qahtani` is independent from `theeb1230-dot/akwam-indexer` and Theeb Engine.
- No `THEEB_SERVICE_TOKEN`, Theeb provider API, or akwam-indexer runtime dependency belongs in this project.
- The original Basri project behavior is the compatibility baseline.
- Matches/news continue to use the original Basri workers.
- Cinema keeps the original Basri content chain. The historical cinema worker currently returns `403 FORBIDDEN_ORIGIN` even for the original Basri origin, so the backend uses a server-side direct compatibility fallback for the same original chain while keeping source/media URLs behind Al-Qahtani.

## Current state
- PR #17 `Restore original Basri cinema runtime` was merged after Web smoke and Live provider smoke were green.
- Current production/main merge commit: `6414d7c6a89da13b542bc10e2979d87f705b5bcf`.
- Render deployed that exact commit successfully to `al-qahtani-api` in Frankfurt.
- GitHub Pages deployment for the same commit succeeded.
- The first post-deploy Remote runtime smoke failed because its assertions still encoded two pre-restoration assumptions, not because the newly deployed Arabic search/details chain was unavailable.
- Active follow-up branch: `fix/remote-live-parity-18`.

## Root causes established
- Matches provider is healthy and returns live match data.
- News provider is healthy.
- The legacy cinema worker `https://albas.albesriali03.workers.dev/` returns `403 FORBIDDEN_ORIGIN` for the historical Basri origin.
- The underlying original cinema source chain remains reachable server-side: category -> search -> series details -> episodes -> watch -> media.
- Arabic slugs caused raw non-ASCII Referer values that Node rejected; Referers are percent-encoded.
- The resolved legacy media host has an incomplete TLS certificate chain (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`). Browser-facing media remains behind Al-Qahtani. The proxy first uses normal certificate verification and only retries with broken-chain compatibility for the already allowlisted `.downet.net` media host and only for known certificate-chain errors. All other upstream TLS verification remains strict.

## Completed on PR #17
- Removed cross-project Theeb/akwam-indexer runtime integration.
- Restored the original Basri product boundary and same-source cinema behavior.
- Added strict source/media host allowlisting.
- Added server-side fallback for category, search, details, episodes and watch resolution when the historical cinema worker is forbidden/errors/returns empty.
- Kept worker/session handling server-side.
- Preserved opaque short-lived `/api/cinema/media?id=...` references so direct media URLs stay out of the browser UI.
- Preserved CORS and Safari byte-range semantics.
- Added real-data live probes that reject `200 + []` as success for populated category paths.
- Added local backend E2E through proxied playback.
- Added scoped TLS compatibility for the legacy allowlisted media host.
- Verified local/E2E Safari-style `Range: bytes=0-1023` returns HTTP 206 with `Content-Range` and `Accept-Ranges: bytes`.

## Post-deploy evidence on main `6414d7c6...`
Remote runtime run #9 reached the actual Render deployment and proved:
- backend health PASS;
- matches PASS with 8 entries;
- Arabic search PASS with 4 real items from `basri-direct`;
- Arabic search details PASS with title `Tracker الموسم الثالث` and 14 episodes;
- episode playback resolution PASS and returned `/api/cinema/media?id=...`;
- anime series category PASS with 24 items.

The same run failed two obsolete assertions:
1. It only accepted old media proxy shapes (`session=` or `provider-media`) and rejected the current intended `/api/cinema/media?id=...` path even though playback resolution itself succeeded.
2. It required search results for the hard-coded query `The Odyssey`; the restored original source returned zero results at that moment. A single transient/catalog-specific title is not a valid whole-site parity gate.

## Active PR #18 scope
- Update the remote gate to accept the current secured `/api/cinema/media?id=...` contract.
- Require an actual HTTP 206 byte-range response and validate `Content-Range` plus `Accept-Ranges` remotely.
- Keep a known working Arabic search -> details -> episode -> playback test.
- Verify the Basri news worker remotely.
- Verify all 12 categories visible in `web/core/catalog-config.js`, not just one anime category.
- Open details from each populated category so `200 + cards` alone cannot hide a broken details path.
- Remove the unrelated hard-coded `The Odyssey` dependency from parity gating.

## Current CI/deploy state
- PR #17 head Web smoke: green.
- PR #17 head Live provider smoke: green.
- Main GitHub Pages deployment for `6414d7c6...`: green.
- Render deploy `dep-dahu2bhsrm7s73d9kegg`: live on exact commit `6414d7c6...`.
- Main Remote runtime smoke #9: failed for the stale assertions described above.
- Do not claim full deployed Web parity until PR #18 gates are green after merge and a fresh remote run succeeds against the resulting deployed runtime.

## Required gate
1. CI green on PR #18.
2. Merge PR #18 only when green.
3. Confirm GitHub Pages and Render state after merge.
4. Fresh Remote runtime smoke must pass health, matches, news, Arabic search/details/playback, Safari Range, every visible category, and details opening from each category.
5. Review Render logs for server-side failures during the remote test.
6. Flutter remains blocked until this deployed Web parity gate is fully green.

## Next run goals
1. Inspect PR #18 Web/Live CI and fix failures on the same branch.
2. Merge PR #18 only after green checks.
3. Confirm the post-merge remote runtime run tests all 12 visible categories.
4. Confirm remote Safari byte-range returns 206 with correct headers.
5. Inspect Render request/app logs for any 4xx/5xx generated by the parity run.
6. Verify GitHub Pages uses only the Al-Qahtani backend and contains no Theeb runtime integration.
7. Spot-check `Player.html` behavior against iPhone Safari assumptions.
8. Verify category/details poster and episode metadata remain intact.
9. Record deployed parity evidence in this handoff.
10. Start Flutter only after deployed Web parity is green.
