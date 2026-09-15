# Al-Qahtani Autonomous Project State

## Authority and evidence hierarchy
1. GitHub source, exact commit SHA, CI logs and release artifacts are authoritative for code/build facts.
2. Live runtime probes are authoritative only for the behavior they actually exercise.
3. Physical-device evidence is required for device-only claims.
4. AI review is advisory evidence and may never overrule a failing deterministic gate.
5. Never promote `DEVICE_REQUIRED_PENDING` to verified from CI.

## Product targets
| Target | Status | Required gate |
|---|---|---|
| Web / PWA | ACTIVE | web build + existing web/runtime smoke gates |
| Android mobile | ACTIVE | Flutter analyze/test + APK build |
| Android TV | ACTIVE | Android TV APK + LEANBACK/D-pad/focus regression gates |
| iOS | ACTIVE | no-codesign iOS build / unsigned IPA release gate |
| Samsung TV / Tizen | NOT CONFIGURED | Do not claim support until Tizen project/toolchain/build gate exists |

## Current objective
- Install a zero-cost Self-Correction & Automated Review Agent Loop.
- Preferred reviewer: Gemini Free Tier.
- Free fallback: OpenRouter `openrouter/free` only.
- Paid inference fallback: FORBIDDEN.

## Completed features
<!-- Append only evidence-backed completed work. Format:
- [APPROVED] Feature — SHA `<sha>` — CI `<run/check>` — device evidence if applicable.
-->
- Existing product/release history remains documented in `docs/AUTONOMOUS_DEVELOPMENT_STATE.md`.

## In progress
- [IN_PROGRESS] Self-Correction & Automated Review Agent Loop.

## Pending features
- Safe opaque HLS playlist/segment rewriting.
- Playback-driven bounded provider fallback.
- Internal-player fallback consumption without provider URL leakage.
- TMDB fallback user selector and empty-result CTA after safe playback integration.
- Physical-device recheck of iPhone download/local playback/export lifecycle.

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

## Agent loop state
- Maximum automatic correction attempts per exact failing SHA: **1**.
- Automatic rerun is allowed only for classified `UPSTREAM_TRANSIENT` or `INFRA_FAILURE`.
- `CODE_DEFECT`, `TEST_DEFECT`, `SECURITY_BOUNDARY`, `UNKNOWN`, physical-device requirements and destructive changes are never auto-rerun/fixed blindly.
- A generated `REVIEW_REPORT.md` is evidence for the next executor pass, not a license to merge.

## Approval definition
A feature may be marked `[APPROVED]` only when all applicable deterministic tests/builds pass on the exact head SHA, the independent review has no BLOCKER/HIGH finding, protected invariants remain satisfied, and every required device-only claim has either physical evidence or is explicitly marked `DEVICE_REQUIRED_PENDING`.

## Review history
<!-- One compact entry per reviewed head SHA. Do not rewrite old evidence.
### <UTC date> — <SHA>
- Goal:
- CI:
- AI reviewer:
- Findings fixed:
- Remaining:
- Final state: [APPROVED] / [CHANGES_REQUIRED] / [DEVICE_REQUIRED_PENDING]
-->
