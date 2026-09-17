# Al-Qahtani Autonomous Project State

## Authority and evidence hierarchy
1. GitHub source, exact commit SHA, CI logs and release artifacts are authoritative for code/build facts.
2. Live runtime probes are authoritative only for the behavior they actually exercise.
3. Physical-device evidence is required for device-only claims.
4. AI review is advisory evidence and may never overrule a failing deterministic gate.
5. Never promote `DEVICE_REQUIRED_PENDING` to verified from CI.

## Closed-loop control plane
- Product code remains on the active PR branch; CI and independent review must evaluate its exact head SHA.
- `FEEDBACK.md` on a product branch is bootstrap/history only once `control/feedback` exists.
- The authoritative current monitoring feedback is `FEEDBACK.md` on the dedicated `control/feedback` ref.
- The independent review workflow alone publishes that control ref after exact-SHA hard gates and reviewer evidence. Development code never writes `APPROVED`.
- Publishing feedback must never create a commit on the product PR branch. The control ref is intentionally outside the `agent/**`, `feature/**`, `fix/**`, and `main` workflow trigger set, preventing review recursion.
- A feedback verdict is valid only when its required YAML frontmatter parses and `reviewed_sha` exactly equals the current product PR head. Missing, invalid, or stale control feedback remains Fail-Closed.
- This is a compatible authority migration: the FEEDBACK schema and field names are unchanged; only the Git ref carrying the independent verdict is separated from the product head to eliminate self-mutating-head deadlock.

## Product targets
| Target | Status | Required gate |
|---|---|---|
| Web / PWA | ACTIVE | web build + existing web/runtime smoke gates |
| Android mobile | ACTIVE | Flutter analyze/test + APK build |
| Android TV | ACTIVE | Android TV APK + LEANBACK/D-pad/focus regression gates |
| iOS | ACTIVE | no-codesign iOS build / unsigned IPA release gate |
| Samsung TV / Tizen | NOT CONFIGURED | Do not claim support until Tizen project/toolchain/build gate exists |

## Current objective
- Execute `CYCLE-0001` as one 20-feature queue on the active PR after independent exact-SHA approval.
- Keep the zero-cost Self-Correction & Automated Review Agent Loop operational.
- Preferred reviewer: Gemini Free Tier.
- Free fallback: OpenRouter `openrouter/free` only.
- Paid inference fallback: FORBIDDEN.

## Completed features
<!-- Append only evidence-backed completed work. Format:
- [APPROVED] Feature — SHA `<sha>` — CI `<run/check>` — device evidence if applicable.
-->
- Existing product/release history remains documented in `docs/AUTONOMOUS_DEVELOPMENT_STATE.md`.

## In progress
- [IN_PROGRESS] CYCLE-0001 — exactly 20 software-testable features registered as `FEAT-0001` through `FEAT-0020` in `FEATURE_REGISTRY.md` and queued in `FEATURE_QUEUE.md`.
- [IN_PROGRESS] Self-Correction & Automated Review Agent Loop remains the independent review/control-plane gate.

## Pending features
- See `FEATURE_QUEUE.md` for the authoritative active 20-feature cycle.
- Physical-device recheck of iPhone download/local playback/export lifecycle remains outside the 20-slot software queue as `DEVICE_REQUIRED_PENDING`.

## Known device-required items
- iOS completed-download -> restart -> Library -> local playback -> offline seek/pause/resume -> missing-file recovery -> Save to Files/share.
- Real native/background download execution.
- Interrupted physical transfer/resume behavior.
- Native-to-internal-WebView fallback behavior.
- Live-device match playback/failover.

## Protected invariants
- Arabic default and RTL remain intact.
- TV remote-only navigation, focus restoration and LEANBACK remain intact.
- iOS release remains unsigned/no-codesign unless policy explicitly changes.
- Web/PWA remains independently usable and deployable.
- Provider URLs, provider sessions and server-side API secrets never enter Flutter/APK/IPA.
- Media references exposed to clients remain opaque and expiring.
- SSRF boundaries, HTTPS/hostname/redirect allowlists remain fail-closed.
- HTTP 200 is never treated as playback success by itself.
- Playback success requires media/player evidence, including `playing` where applicable.
- Preserve MP4/HLS/MPEG-TS handling and Range/206/Content-Range/Accept-Ranges semantics.
- Watch and Download resolution remain independent user-visible actions.
- A download callback is not equivalent to a verified completed local file.
- Preserve trusted filenames and episode identity (`episode_id` vs `episode_number`).
- Preserve score precedence, match failover, logos and Saudi-time behavior.
- Preserve search dedupe and pagination contracts.

## Historical defects / anti-regression memory
| ID | Defect | Rule that prevents recurrence | Evidence state |
|---|---|---|---|
| DL-001 | iPhone Library showed completed file that was not actually available | Completed requires explicit final local-file existence/readability/size verification | CI fixed; physical retest pending |
| SCORE-001 | Ended matches could show fake 0-0 | Never synthesize 0-0 when authoritative score is unavailable | CI verified |
| PLAY-001 | Playback/provider success inferred too early | Require actual media/player evidence; bound fallback attempts | Partially implemented |
| TV-001 | TV UX can regress through touch-first UI | D-pad/focus/LEANBACK are release gates | CI verified baseline |
| LOOP-001 | Review evidence commit moved the product head after CI, making feedback stale forever | Evidence/FEEDBACK is published on `control/feedback`; never commit monitoring evidence onto product head | CI + independent control-plane verified on `af9e884c403b1cd8f60535f1f078fe6fd3c35ed6` |

## Agent loop state
- Maximum automatic correction attempts per exact failing SHA: **1**.
- Automatic rerun is allowed only for classified `UPSTREAM_TRANSIENT` or `INFRA_FAILURE`.
- `CODE_DEFECT`, `TEST_DEFECT`, `SECURITY_BOUNDARY`, `UNKNOWN`, physical-device requirements and destructive changes are never auto-rerun/fixed blindly.
- A generated `REVIEW_REPORT.md` is evidence for the next executor pass, not a license to merge.

## Approval definition
A feature may be marked `[APPROVED]` only when all applicable deterministic tests/builds pass on the exact head SHA, the independent review has no BLOCKER/HIGH finding, protected invariants remain satisfied, and every required device-only claim has either physical evidence or is explicitly marked `DEVICE_REQUIRED_PENDING`.

## Review history
<!-- One compact entry per reviewed head SHA. Do not rewrite old evidence. -->
### 2026-09-17 — af9e884c403b1cd8f60535f1f078fe6fd3c35ed6
- Goal: repair the independent reviewer/control-plane deadlock without mutating the product head.
- CI: Actions run `35228366598` completed SUCCESS on the exact SHA; deterministic Node/runtime, Flutter analyze/tests, Android Mobile, Android TV contract, Flutter Web, iOS no-codesign and Samsung/Tizen truth gates were green.
- AI reviewer: Independent AI critic SUCCESS; exact-SHA `REVIEW_REPORT` artifact uploaded.
- Control plane: `control/feedback` published valid machine-parseable `APPROVED` for the same exact SHA without a product-branch evidence commit.
- LIVE: not promoted by this CI run.
- PHYSICAL: not promoted; iPhone lifecycle recheck remains `DEVICE_REQUIRED_PENDING`.
- Final state: [APPROVED] for CI-verifiable cycle entry only; CYCLE-0001 subsequently opened and any new product head requires fresh independent review before approval/merge.
