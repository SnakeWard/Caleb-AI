# Hollowcut Export Runtime Boundary Plan

## Purpose
This document defines the future Hollowcut export runtime boundary. It is a documentation-only planning artifact. No export runtime, no Hollows, no CLI commands, and no runtime behavior are implemented in this pass.

The goal is to establish clear, enforceable principles for any future export-related work so that:
- Export actions are strictly gated behind Verified Return Path (VRP) approved T2 evidence.
- The first allowed future phase is non-destructive ("Export Plan Preview").
- Destructive, side-effecting, or unverified export behavior remains explicitly forbidden until later authorized passes.
- All future work must satisfy the acceptance requirements listed below.

This plan builds on the existing `hollow.hollowcut.export_readiness_check` (with its contract snapshot) and the Hollowcut supplied-state validation lane.

## 1. Current State
- V1 catalog remains locked at exactly 13 Hollows after AUD-1 and is protected.
- Hollowcut catalog is separate from V1 and remains at exactly 9 Hollows (including `hollow.hollowcut.project_state_check`, `hollow.hollowcut.project_timeline_cross_check`, `hollow.hollowcut.export_readiness_check`, `hollow.hollowcut.export_plan_preview`, and the five timeline validation Hollows).
- `hollow.hollowcut.export_readiness_check` exists, is deterministic, supplied-state-only, and has a stable contract snapshot:
  - `docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md`
  - `docs/contracts/hollowcut-export-readiness-result.schema.json`
- Valid and invalid outputs from `export_readiness_check` conform to the documented contract (proven by tests using the canonical fixtures in `examples/hollowcut-project-demo/`).
- `readiness_summary` (with `ready`, `status`, `project_id`, `timeline_id`, `export_profile_present`, `export_targets_count`, `matched_export_target_count`, counts for assets/tracks/timeline_items, `blocking_count`/`error_count`/`warning_count`, `blocking_categories`/`warning_categories`, `top_blockers`, `next_required_actions`, `unmapped_issue_codes`, `safe_to_hand_to_future_export`, `supplied_state_only`) is part of the contract.
- No export runtime, rendering, FFmpeg, media transformation, or build artifacts exist in the current Hollowcut lane. All current Hollowcut work is read-only structural validation of supplied state.
- Raw Runner output is T0/unverified. VRP is required for any promotion to T2.
- Ledger and report writing remain opt-in through existing mechanisms (`--write-ledger`, `--write-report`).

## 2. Future Export Runtime Principle
Any future Hollowcut export runtime (in a later authorized pass) **MUST** obey these principles:

- Export runtime may only consume Verified Return Path-approved T2 readiness evidence.
- Raw T0 Hollow output may never trigger export.
- Export runtime may not run if `safe_to_hand_to_future_export` is false.
- Export runtime may not run if `blocking_count > 0`.
- Export runtime may not run if `readiness_summary` is missing from the result.
- Export runtime may not run if contract conformance (per `HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md` and the schema) fails.

These gates are non-negotiable. The `export_readiness_check` result (after VRP) is the only trusted signal for export eligibility.

## 3. First Allowed Future Runtime Phase
The first future export/runtime step is defined as **non-destructive only**.

**Phase Name:** Export Plan Preview

This future phase **may** (when explicitly authorized in a later pass):

- Read a T2 verified export readiness result (produced by `hollow.hollowcut.export_readiness_check` + VRP).
- Read the `readiness_summary`.
- Produce a dry-run export plan (a data structure or report only).
- List intended output details: format, dimensions, fps, duration, source timeline items, asset references, track references, and target platform.
- Produce **no** media file.
- Call **no** FFmpeg or external media tools.
- Perform **no** mutation of any files or assets.
- Write only a report artifact **if** explicitly requested through the existing report paths (`--write-report` or equivalent future mechanism).

This phase produces planning/preview information only. It is strictly read-only with respect to media and the filesystem (except for opt-in reports via existing Caleb mechanisms).

## 4. Explicitly Forbidden Until Later Authorization
The following are **explicitly forbidden** in the first (and any early) export/runtime phase. They require separate, explicit future authorization passes:

- Actual media rendering or encoding.
- FFmpeg invocation or equivalent media processing.
- File conversion or transcoding.
- Asset copying or extraction.
- Timeline flattening to video.
- Audio muxing or mixing.
- Writing video, image, audio, or any media outputs to disk or network.
- Cloud upload or external distribution.
- UI export button or direct user-triggered export action.
- Background job queue or asynchronous export execution.
- External tool execution outside the Hollow/Caleb sandbox.
- Any action based on unverified model claims (only VRP-approved T2 evidence from the readiness contract may be used).
- Any destructive or side-effecting operation before the required future gates (see section 5) are satisfied.

Export runtime must remain approval-gated and side-effect-policy compliant per existing Caleb rules (`docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md` and boundary locks).

## 5. Required Future Gate Before Export Runtime
Before any export runtime (even the non-destructive preview phase) may execute, the following **must** be satisfied:

1. Run `export_readiness_check` on the supplied project/timeline state (+ optional export_profile).
2. Verify the result through the Verified Return Path (VRP).
3. Confirm the invocation has reached T2 (via `trust_tier` and `verified_return_path` evidence).
4. Confirm `safe_to_hand_to_future_export` is true in `readiness_summary`.
5. Confirm contract conformance (shape matches `HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md` and schema; `readiness_summary` present with all required fields).
6. Confirm `blocking_count === 0` and no error-severity issues.
7. Confirm report/ledger behavior (if requested) uses only existing opt-in mechanisms.

Only after all gates pass may a future export plan preview (or later runtime) be allowed to proceed.

## 6. Future CLI Shape Proposal (Not Implemented)
For planning purposes only, a future (non-implemented) CLI surface may be considered in a later pass. Example (clearly marked as future):

```
npm run cli -- preview-hollowcut-export-plan --input-file <readiness-result-or-project-state> --json
```

**This command does not exist and must not be implemented in the current or any unauthorized pass.** It is recorded here solely as a shape proposal for future consideration. Any implementation would be subject to the full acceptance requirements in section 8, a new snapshot, green baseline, contract conformance, and explicit authorization.

## 7. Trust and Ledger Requirements
- Any future dry-run plan or preview output starts as T0 (raw from its Hollow or preview logic).
- The Verified Return Path (VRP) decides whether the dry-run plan/evidence can be promoted to T2.
- When `--write-ledger` (or future equivalent) is used, the Ledger must record the invocation and associated evidence packet.
- Reports remain strictly opt-in through existing Caleb report builder/writer mechanisms. No automatic or background report generation for export plans.
- The readiness contract (`readiness_summary`, `safe_to_hand_to_future_export`, etc.) plus VRP evidence form the only trusted basis for export decisions.

## 8. Acceptance Requirements for Any Future Implementation
Any future pass that begins implementing export runtime (even the preview phase) **must** satisfy these acceptance criteria:

- Pre-mutation snapshot created with a clear name.
- Baseline `npm run typecheck && npm run build && npm test` is fully green before edits.
- No modifications to the protected V1 catalog (remains exactly 13).
- Hollowcut catalog remains exactly 9 (including export_plan_preview) and separate.
- `export_readiness_check` and its contract artifacts remain the gate.
- Contract conformance tests (valid/invalid fixtures + `readiness_summary` rules) pass.
- Exact CLI smokes (list-hollowcut-hollows, run on valid/invalid) continue to work.
- Ledger and report proofs via existing opt-in flags.
- Full test suite remains green (1007+ tests, zero failures).
- Documentation (including this plan and status docs) is updated only via minimal, targeted changes where explicitly required.
- No export side effects in the preview phase.
- Future runtime strictly gated behind T2 + `safe_to_hand_to_future_export` + contract conformance + no blockers.
- No architecture drift from Hollow-first, VRP, Ledger, Change Guard, and supplied-state principles.

## Related Documents
- `docs/HOLLOWCUT_BOUNDARY_LOCK.md`
- `docs/HOLLOWCUT_CALEB_BOUNDARY.md`
- `docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md`
- `docs/contracts/hollowcut-export-readiness-result.schema.json`
- `docs/HOLLOWCUT_IMPLEMENTATION_READINESS_CHECKLIST.md`
- `docs/HOLLOWCUT_PROJECT_CONTRACT.md`
- `src/hollowcut/exportReadinessCheckHollow.ts` (current implementation reference only)

This plan is the authoritative boundary for export runtime planning. Implementation of any part of it requires a new, explicitly authorized pass that begins with a fresh snapshot and satisfies the acceptance requirements above.

**End of plan document.** (Documentation only; no runtime implied or created.)
