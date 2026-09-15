---
schema_version: 1
cycle_id: CYCLE-0000
base_sha: 029113262ac6d83a30c60f63f234119031d1dbfd
target_count: 20
status: BLOCKED_FEEDBACK
---

# Al-Qahtani TV — Active Feature Queue

The queue remains intentionally empty while `FEEDBACK.md` is `CHANGES_REQUIRED`. No new feature IDs may be allocated and no feature work may begin until independent monitoring returns valid, non-stale `APPROVED` feedback on the exact reviewed SHA.

## Current 20-feature cycle

| # | FEATURE_ID | Feature | Area | User Value | Acceptance Criteria | Status | SHA |
|---:|---|---|---|---|---|---|---|

## Device-required waiting list

| FEATURE_ID | Feature | Device Evidence Required | Queue Replacement | Status |
|---|---|---|---|---|

## Cycle release gate

| Gate | Required | State | Evidence |
|---|---|---|---|
| Web/PWA deployment | YES | NOT_RUN | blocked by feedback |
| Android Mobile APK | YES | NOT_RUN | blocked by feedback |
| Android TV APK LEANBACK + D-Pad/focus | YES | NOT_RUN | blocked by feedback |
| iOS IPA UNSIGNED/no-codesign | YES | NOT_RUN | blocked by feedback |
| Same product commit/version parity | YES | NOT_RUN | blocked by feedback |
| SHA256SUMS + PROVENANCE | YES | NOT_RUN | blocked by feedback |
| Independent monitoring review | YES | CHANGES_REQUIRED | `FEEDBACK.md` |
