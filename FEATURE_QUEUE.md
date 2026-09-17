---
schema_version: 1
cycle_id: CYCLE-0001
base_sha: af9e884c403b1cd8f60535f1f078fe6fd3c35ed6
target_count: 20
status: ACTIVE
---

# Al-Qahtani TV — Active Feature Queue

This cycle was opened only after independent monitoring published valid `APPROVED` feedback on exact product SHA `af9e884c403b1cd8f60535f1f078fe6fd3c35ed6` via `control/feedback`. All implementation remains pending independent review on the eventual exact cycle head.

## Current 20-feature cycle

| # | FEATURE_ID | Feature | Area | User Value | Acceptance Criteria | Status | SHA |
|---:|---|---|---|---|---|---|---|
| 1 | FEAT-0001 | Playback-driven bounded provider recovery | Server playback | Recover playback without loops or provider leakage | Retry only after explicit player failure; attempts bounded 1..5; success requires playback signal + `playing`; opaque refs expose no provider identity/URL | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 2 | FEAT-0002 | Internal-player opaque fallback consumption | Flutter player | Seamless recovery without exposing providers | Flutter consumes opaque refs only; no provider/session URL in client; fallback triggered by real player failure; widget/runtime tests cover recovery | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 3 | FEAT-0003 | Persistent search-source selector | Search | User explicitly controls primary/fallback search | Basri remains default; selector persists locally; TMDB calls remain server-side; RTL/mobile/TV behavior tested | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 4 | FEAT-0004 | Empty-search fallback CTA | Search | Clear recovery when primary has no result | Empty Basri result offers explicit Arabic fallback CTA; no automatic source switch; source ambiguity fails closed | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 5 | FEAT-0005 | Search movie-series-year filters | Search | Faster result narrowing | Type/year filters preserve query and source; deterministic filtering/pagination tests; RTL controls remain accessible | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 6 | FEAT-0006 | Search query/source/scroll restoration | Search UX | Return to prior search context | Navigation round-trip restores query, selected source, filters and scroll position without network/provider leakage | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 7 | FEAT-0007 | Local-only search history suggestions | Search UX | Faster repeat searches with privacy | Suggestions are persisted locally only, bounded/deduped/clearable and never sent except as an explicit search query | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 8 | FEAT-0008 | Continue Watching quick resume | Library | Resume verified progress quickly | Resume uses real persisted progress and content identity; completed/invalid progress excluded; mobile/TV focus tests included | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 9 | FEAT-0009 | Download lifecycle state clarity | Downloads | Honest verifying/completed/missing/failed states | Completed shown only after final local-file existence/readability/size verification; missing/failed/verifying states deterministic | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 10 | FEAT-0010 | Download storage summary and safe cleanup | Downloads | Manage storage without deleting active media | Storage accounting excludes unsafe paths; cleanup protects active/partial files and reports reclaimed bytes deterministically | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 11 | FEAT-0011 | Missing-download recovery actions | Downloads | Recover broken library entries | Missing file exposes remove/retry actions; export/play requires verified local file; no false completed state | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 12 | FEAT-0012 | Offline-ready badge after verification | Downloads | Know what truly works offline | Badge appears only after verified final local file; callback alone cannot grant badge; regression tests cover restart state | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 13 | FEAT-0013 | Simple player connection state | Player UX | Understand loading/recovery without internals | Arabic states distinguish connecting/recovering/playing/error; provider names/URLs remain hidden; playing evidence drives success | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 14 | FEAT-0014 | Resume prompt from real progress | Player UX | Avoid accidental restart | Prompt appears only for valid nontrivial persisted progress; resume/start-over actions deterministic and TV-focusable | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 15 | FEAT-0015 | Quick favorite action | Library UX | Save content with fewer taps | Favorite toggle is idempotent, persists locally, updates semantics and remains D-pad/touch accessible | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 16 | FEAT-0016 | Library sorting | Library UX | Find saved content predictably | Stable sort options include recent/title/progress where applicable; choice persists; deterministic ordering tests included | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 17 | FEAT-0017 | Stable loading-empty-error states | UX | Predictable feedback instead of blank screens | Search/details/library expose distinct loading/empty/error states; no layout-breaking provider internals; RTL tests included | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 18 | FEAT-0018 | Accessibility and touch-target semantics | Accessibility | Easier phone and TV operation | Primary controls have meaningful semantics and minimum practical targets; keyboard/D-pad focus remains visible and ordered | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 19 | FEAT-0019 | TV focus restoration | Android TV | Return to the exact prior control | Route/player/library round-trips restore valid focus; remote-only navigation has no focus trap; LEANBACK contract remains green | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| 20 | FEAT-0020 | Image/cache/cancellation performance budget | Performance | Reduce stale work and memory churn | Image/network work is bounded/cancellable where applicable; stale requests cannot overwrite newer state; deterministic cancellation/cache tests included | QUEUED | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |

## Device-required waiting list

| FEATURE_ID | Feature | Device Evidence Required | Queue Replacement | Status |
|---|---|---|---|---|
| LEGACY-001 | iPhone completed-download restart/local playback/export lifecycle recheck | Real iPhone: download -> restart -> Library -> local offline playback/seek/pause/resume -> missing-file recovery -> Save to Files/share | Not counted in CYCLE-0001; all 20 queue slots are software-testable | DEVICE_REQUIRED_PENDING |

## Cycle release gate

| Gate | Required | State | Evidence |
|---|---|---|---|
| Web/PWA deployment | YES | NOT_RUN | CYCLE-0001 implementation not complete |
| Android Mobile APK | YES | NOT_RUN | CYCLE-0001 implementation not complete |
| Android TV APK LEANBACK + D-Pad/focus | YES | NOT_RUN | CYCLE-0001 implementation not complete |
| iOS IPA UNSIGNED/no-codesign | YES | NOT_RUN | CYCLE-0001 implementation not complete |
| Same product commit/version parity | YES | NOT_RUN | CYCLE-0001 implementation not complete |
| SHA256SUMS + PROVENANCE | YES | NOT_RUN | CYCLE-0001 implementation not complete |
| Independent monitoring review | YES | PENDING_REVIEW | Exact final cycle head not yet submitted |
