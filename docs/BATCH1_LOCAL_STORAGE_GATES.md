# Batch #1 local storage verification matrix

This batch extends existing download/storage behavior without replacing the established Range/.part implementation.

## Gates

- Background Downloads: CI verifies lifecycle/state contracts. Physical iPhone background execution remains `DEVICE_REQUIRED_PENDING`.
- Save to Files: CI verifies export abstraction and source validation. Physical iOS Files/document-picker behavior remains `DEVICE_REQUIRED_PENDING`.
- M3U Cache Engine: CI verifies persistence, expiry and offline stale-read behavior.
- Storage Quota & Cleanup: CI verifies quota accounting, oldest-first cleanup and protected active files.
- Resume Interrupted Download: existing Range/206 tests remain authoritative; Batch #1 adds restart-time partial discovery. Real interrupted-network resume on iPhone remains `DEVICE_REQUIRED_PENDING`.

CI success must not promote any device-required item to physical-device verified.
