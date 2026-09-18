---
schema_version: 1
registry_version: 1
last_audit_at: 2026-09-18T01:15:00Z
last_feature_index: 20
---

# Al-Qahtani TV — Feature Registry

`FEATURE_REGISTRY.md` is the single source of truth for feature identity and lifecycle history. Audit rows are append-only/event-sourced. Current status is derived only from the newest event for a `FEATURE_ID`. Historical events must never be deleted or rewritten. New IDs are allocated as `FEAT-NNNN` by incrementing `last_feature_index`. Regressions and reopenings reuse the original ID and canonical name; aliases are descriptive only.

## Feature Identity Table

| FEATURE_ID | Canonical Name | Area | Aliases | First Seen SHA |
|---|---|---|---|---|
| LEGACY-001 | Existing product/release history | Existing application | historical baseline | historical |
| FEAT-0001 | Playback-driven bounded provider recovery | Server playback | bounded fallback; playing evidence | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0002 | Internal-player opaque fallback consumption | Flutter player | opaque player fallback | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0003 | Persistent search-source selector | Search | source selector | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0004 | Empty-search fallback CTA | Search | fallback CTA | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0005 | Search movie-series-year filters | Search | search filters | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0006 | Search query/source/scroll restoration | Search UX | search restoration | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0007 | Local-only search history suggestions | Search UX | local search history | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0008 | Continue Watching quick resume | Library | quick resume | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0009 | Download lifecycle state clarity | Downloads | download states | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0010 | Download storage summary and safe cleanup | Downloads | storage cleanup | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0011 | Missing-download recovery actions | Downloads | missing-file recovery | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0012 | Offline-ready badge after verification | Downloads | offline badge | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0013 | Simple player connection state | Player UX | player state | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0014 | Resume prompt from real progress | Player UX | resume prompt | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0015 | Quick favorite action | Library UX | favorite toggle | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0016 | Library sorting | Library UX | saved-content sorting | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0017 | Stable loading-empty-error states | UX | skeleton; empty state; error state | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0018 | Accessibility and touch-target semantics | Accessibility | semantics; targets | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0019 | TV focus restoration | Android TV | D-pad focus restoration | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |
| FEAT-0020 | Image/cache/cancellation performance budget | Performance | cancellation; cache budget | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 |

## Audit Event Table

| FEATURE_ID | Timestamp | Exact SHA | Cycle ID | Source | Evidence | New Status |
|---|---|---|---|---|---|---|
| LEGACY-001 | 2026-09-15T14:00:00Z | 537d00df4fadce707cb0b33351c36ac6f1cd406f | LEGACY | migration | `docs/AUTONOMOUS_DEVELOPMENT_STATE.md`; v1.0.33 release evidence | APPROVED |
| FEAT-0001 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0002 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0003 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0004 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0005 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0006 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0007 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0008 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0009 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0010 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0011 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0012 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0013 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0014 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0015 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0016 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0017 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0018 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0019 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0020 | 2026-09-17T13:47:29Z | af9e884c403b1cd8f60535f1f078fe6fd3c35ed6 | CYCLE-0001 | independent-approved queue allocation | `control/feedback:FEEDBACK.md`; run `35228366598` | QUEUED |
| FEAT-0001 | 2026-09-17T14:42:00Z | 76912425906859517a33e4518d936ecf04a31b12 | CYCLE-0001 | development-loop | `server/fallback-runtime.mjs`; `scripts/fallback_runtime_test.mjs`; Actions run `35230892339` deterministic + independent critic success | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0002 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `server/fallback-runtime.mjs`; opaque fallback/runtime tests; exact-head run `35290144640` | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0003 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `flutter_app/lib/src/cycle_feature_policy.dart`; `cycle_feature_policy_test.dart` | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0004 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `SearchCycleState.canOfferFallback`; explicit Basri fallback policy tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0005 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `filterSearchResults`; deterministic type/year/dedupe tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0006 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `SearchCycleState` query/source/type/year/scroll restoration tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0007 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | bounded local-history policy (`maxLocalSearchHistory`); Flutter tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0008 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `library_store.dart`; Continue Watching UI; resume progress tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0009 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `download_service.dart`; media validation/lifecycle tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0010 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | download storage/cleanup implementation; `batch1_storage_test.dart` | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0011 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `download_library_section.dart`; missing-file recovery tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0012 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | verified-download persistence/playback tests; no callback-only completion | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0013 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | Arabic `PlayerConnectionState`; provider-internal leakage regression test | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0014 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `shouldOfferResume`; real-progress boundary tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0015 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `library_store.dart`; persistent idempotent favorite UI/state | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0016 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | library persistence/order implementation and Flutter regression suite | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0017 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | search/details/library explicit loading/empty/error states; Flutter tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0018 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | 48px minimum target policy; semantics/focus regression tests | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0019 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `route_focus_restorer_test.dart`; `details_page_focus_test.dart`; TV gate success | IMPLEMENTED_PENDING_REVIEW |
| FEAT-0020 | 2026-09-18T01:15:00Z | ed37f93b0e4826b68e412aeb126a3156ac865300 | CYCLE-0001 | development-loop | `RequestGeneration`; bounded timeout/history/cache policies; cancellation tests | IMPLEMENTED_PENDING_REVIEW |

## Active-state derivation

Only the latest Audit Event per `FEATURE_ID` defines current status. Completed phase events may be archived under `docs/archives/` by a documented compatible archival process; normal development reads the active-state projection here and does not replay completed archive files unless an audit requires it.
