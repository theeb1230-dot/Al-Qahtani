---
schema_version: 1
registry_version: 1
last_audit_at: 2026-09-15T14:29:00Z
last_feature_index: 0
---

# Al-Qahtani TV — Feature Registry

`FEATURE_REGISTRY.md` is the single source of truth for feature identity and lifecycle history. Audit rows are append-only/event-sourced. Current status is derived only from the newest event for a `FEATURE_ID`. Historical events must never be deleted or rewritten. New IDs are allocated as `FEAT-NNNN` by incrementing `last_feature_index`. Regressions and reopenings reuse the original ID and canonical name; aliases are descriptive only.

## Feature Identity Table

| FEATURE_ID | Canonical Name | Area | Aliases | First Seen SHA |
|---|---|---|---|---|
| LEGACY-001 | Existing product/release history | Existing application | historical baseline | historical |

## Audit Event Table

| FEATURE_ID | Timestamp | Exact SHA | Cycle ID | Source | Evidence | New Status |
|---|---|---|---|---|---|---|
| LEGACY-001 | 2026-09-15T14:00:00Z | 537d00df4fadce707cb0b33351c36ac6f1cd406f | LEGACY | migration | `docs/AUTONOMOUS_DEVELOPMENT_STATE.md`; v1.0.33 release evidence | APPROVED |

## Active-state derivation

Only the latest Audit Event per `FEATURE_ID` defines current status. Completed phase events may be archived under `docs/archives/` by a documented compatible archival process; normal development reads the active-state projection here and does not replay completed archive files unless an audit requires it.
