# Strict Autonomous Review & Self-Correction Rules

## 1. Read order on every executor pass
1. Read `docs/AUTONOMOUS_DEVELOPMENT_STATE.md`.
2. Read `PROJECT_STATE.md`.
3. Read the latest `REVIEW_REPORT.md` when present.
4. Inspect the exact head SHA, open PR state and all applicable CI checks/logs.
5. Reproduce the smallest failing deterministic gate before editing code.

## 2. Evidence precedence
Deterministic compiler/analyzer/test/build failures outrank AI prose. Security boundaries outrank feature convenience. Physical-device evidence outranks CI for device-only behavior. AI may identify risks and missing tests but may not fabricate successful execution.

## 3. Finding classification
Every failure is classified before action:
- `UPSTREAM_TRANSIENT`: external dependency/network/service temporarily failed.
- `INFRA_FAILURE`: runner/toolchain/cache/infrastructure failure unrelated to product logic.
- `CODE_DEFECT`: production implementation defect.
- `TEST_DEFECT`: incorrect/stale/non-deterministic test or fixture.
- `SECURITY_BOUNDARY`: possible secret leak, SSRF/allowlist regression, unsafe URL exposure, permission escalation or trust-boundary violation.
- `DEVICE_REQUIRED`: claim cannot be established without real device evidence.
- `UNKNOWN`: evidence is insufficient or contradictory.

## 4. Automatic action policy
- `UPSTREAM_TRANSIENT` and `INFRA_FAILURE`: at most one rerun on the exact SHA, then re-triage.
- `CODE_DEFECT`: executor may make one minimal root-cause correction batch on the existing feature/PR branch, add/adjust regression tests, then run the complete applicable gates again.
- `TEST_DEFECT`: fix only when evidence proves the test is wrong; never weaken an assertion merely to turn CI green.
- `SECURITY_BOUNDARY`: stop automatic correction/merge. Require explicit review of the boundary and fail closed.
- `DEVICE_REQUIRED`: keep the code/CI state separate and mark `DEVICE_REQUIRED_PENDING`; never invent verification.
- `UNKNOWN`: stop. Gather evidence; no speculative patching.

## 5. One-PR / one-correction discipline
- Reuse the single open product PR when one exists.
- Do not open parallel PRs for the same objective.
- One correction batch is followed by a full re-review. A second unrelated guess is forbidden without new evidence.
- Never rewrite broad areas of the app to solve a narrow failing gate.

## 6. Protected platform rules
- Android mobile, Android TV, iOS and Web/PWA are current verified/configured product targets.
- Samsung TV/Tizen is **not configured in the repository at present**. It cannot be marked built or verified until an actual Tizen target, toolchain and CI build gate are added.
- TV changes must preserve remote/D-pad focus and LEANBACK contracts.
- iOS release checks remain unsigned/no-codesign.
- Web/PWA must remain deployable and must not become a wrapper that depends on a native app.

## 7. `[APPROVED]` contract
The exact head SHA receives `[APPROVED]` only when:
1. all applicable deterministic tests/analyzers/builds pass on that exact SHA;
2. the independent reviewer reports no `BLOCKER` or `HIGH` issue;
3. no security/trust-boundary issue is unresolved;
4. protected invariants in `PROJECT_STATE.md` remain intact;
5. every device-only requirement is either backed by physical evidence or explicitly excluded from approval as `DEVICE_REQUIRED_PENDING`;
6. no claim is made for Samsung/Tizen until its real target/build gate exists.

`[APPROVED]` is SHA-scoped. Any subsequent product-code change invalidates it and starts a new review.

## 8. Zero-cost policy
- Preferred inference: Gemini API Free Tier only.
- Fallback inference: OpenRouter `openrouter/free` only.
- No paid model, paid runner, paid VPS or automatic billing fallback is permitted by this loop.
- If both free reviewers are unavailable or rate-limited, the result is not approved; deterministic CI still runs and the report records reviewer unavailability.

## 9. Memory update policy
After a successful correction/review cycle, append a compact SHA-scoped entry to `PROJECT_STATE.md` containing objective, CI evidence, reviewer used, fixed findings, remaining device evidence and final state. Historical defect evidence is append-only; do not erase an old physical failure merely because newer code appears fixed.
