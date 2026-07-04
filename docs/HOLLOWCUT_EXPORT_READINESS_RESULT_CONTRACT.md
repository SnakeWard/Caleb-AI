# Hollowcut Export Readiness Result Contract

## Contract Status
This is the stable artifact contract for the result shape produced by `hollow.hollowcut.export_readiness_check` (implemented in `src/hollowcut/exportReadinessCheckHollow.ts`).

The contract was captured as a milestone after the rollup shape pass. It is the canonical description for downstream consumers (future UI, export engines, reports) so they do not need to infer readiness from raw issue arrays.

`hollow.hollowcut.export_readiness_check` remains:
- supplied-state-only
- deterministic
- read_only permissions
- no file access, no mutation, no media inspection, no FFmpeg, no render, no build artifacts

Raw Runner output is always T0/unverified. The Verified Return Path (VRP) decides promotion to T2 for clean deterministic results only.

## Purpose
Define the exact fields, types, and semantic rules for the readiness result so that:
- Consumers have a stable target.
- Tests can prove conformance.
- Backward compatibility for legacy fields (ready/valid/status/checks/issues/warnings/blockers/skipped_checks/summary) is explicitly required.
- The new `readiness_summary` rollup is the preferred consumer shape.

## Core Boundary
- Input is always caller-supplied `project_state` + `timeline_state` (+ optional `export_profile`).
- Output describes structural readiness only.
- `next_required_actions` MUST be derived deterministically from known issue codes only (see NEXT_ACTION_MAP in implementation). No AI-generated or invented advice.
- Unknown/unmapped issue codes MUST be placed in `unmapped_issue_codes`.
- `safe_to_hand_to_future_export` is true **only** when `ready === true && valid === true && blocking_count === 0 && error_count === 0`.
- Warnings are allowed alongside `ready_with_warnings` / `safe_to_hand_to_future_export` under the existing contract.
- The Hollow never trusts its own output; VRP + Ledger + Report Builder are the path to durable artifacts.
- V1 catalog remains exactly 12 and protected. Hollowcut catalog is separate (exactly 9 Hollows, including export_plan_preview).

## Result Shape (Top Level)
```json
{
  "ready": boolean,
  "valid": boolean,
  "status": "valid" | "warnings" | "invalid",
  "warning_count": number,
  "error_count": number,
  "blocking_count": number,
  "blockers": string[],
  "checks": [{ "check_id": string, "label": string, "status": string, "severity": "info"|"warning"|"error" }, ...],
  "issues": [{ "path": string, "severity": "warning"|"error", "code": string, "message": string }, ...],
  "warnings": array,
  "blockers": string[],
  "skipped_checks": [],
  "summary": { /* legacy summary object, must remain for backward compat */ },
  "readiness_summary": { /* see below */ },
  "blocking_reasons": string[],
  "next_required_actions": string[],
  "unmapped_issue_codes": string[]
}
```

One of the checks will always include:
```json
{ "check_id": "supplied_state_only_confirmed", "label": "Supplied State Only Confirmed", ... }
```

## readiness_summary (Primary Consumer Rollup)
```json
{
  "ready": boolean,
  "status": "ready" | "ready_with_warnings" | "not_ready" | "invalid",
  "project_id": string | null,
  "timeline_id": string | null,
  "export_profile_present": boolean,
  "export_targets_count": number,
  "matched_export_target_count": number,
  "asset_count": number,
  "track_count": number,
  "timeline_item_count": number,
  "blocking_count": number,
  "error_count": number,
  "warning_count": number,
  "skipped_check_count": number,
  "blocking_categories": string[],   // e.g. ["asset", "export_profile", "timing", ...] or []
  "warning_categories": string[],
  "top_blockers": string[],
  "next_required_actions": string[],
  "unmapped_issue_codes": string[],
  "safe_to_hand_to_future_export": boolean,
  "supplied_state_only": true
}
```

## Contract Rules (Normative)
- `next_required_actions`: ONLY strings from the internal deterministic `NEXT_ACTION_MAP` for codes that appear in the issues. Examples of mapped codes include `export_profile_platform_not_in_targets`, `unknown_asset_reference`, `negative_duration`, `timeline_exceeds_profile_duration_limit`, etc. Unknown codes never produce an action entry.
- `unmapped_issue_codes`: Array of any issue `code` values that have no entry in the known action map. Sorted. Present even if empty. This is how unknown codes are captured instead of invented advice.
- `safe_to_hand_to_future_export`:
  - `true` **if and only if** `ready === true && valid === true && blocking_count === 0 && error_count === 0`.
  - May be true when warnings exist (under `ready_with_warnings` / `status` normalization).
  - Must be `false` for any invalid / blocking / error case.
- `blocking_categories` / `warning_categories`: Derived deterministically from issue `code` + `path` (asset, track, timing, export_profile, export_target, project, timeline, alignment, supplied_state, unknown).
- Legacy fields (`ready`, `valid`, `status`, `checks`, `issues`, `warnings`, `blockers`, `blocking_count`, `skipped_checks`, `summary`, and the `supplied_state_only_confirmed` check) **MUST** remain present indefinitely for backward compatibility.
- The entire Hollow result (and the `readiness_summary` inside it) is produced by pure supplied-state logic. The CLI `run-hollowcut-hollow` wrapper adds `invocation`, `verification_result`, `evidence_packet`, `ledger_entries`, `report_paths`, and trust_tier (T0 raw; T2 only after VRP for clean results).
- `confidence_level` on the invocation is `"deterministic_supplied_state_hollowcut_export_readiness"`.

## Backward Compatibility Requirement
All pre-rollup fields must continue to be emitted exactly as before. The `readiness_summary` (and `blocking_reasons`, `next_required_actions`, `unmapped_issue_codes`) were added *in addition to* the legacy shape.

## Trust & Provenance Notes
- Raw output from the Hollow Runner is T0 / unverified.
- Only after `VerifiedReturnPath.verifyInvocation(...)` succeeds for a clean deterministic result is the output considered for T2.
- Durable artifacts (Ledger entries, reports) are produced only via the existing Caleb report/ledger paths when the caller opts in with `--write-ledger` / `--write-report`.
- The contract itself is documentation + test-enforced shape. It is not an EvidencePacket.

## Conformance
Implementations and tests must prove that both valid-aligned and invalid inputs produce results matching this contract (field presence, types, `next_required_actions` determinism, `unmapped_issue_codes` behavior, and the exact `safe_to_hand_to_future_export` rule).

See `tests/hollowcut/exportReadinessCheckHollow.test.ts` for contract conformance tests using the canonical fixtures.

## Related
- `src/hollowcut/exportReadinessCheckHollow.ts` (source of truth implementation)
- `docs/HOLLOWCUT_PROJECT_CONTRACT.md`
- `docs/HOLLOWCUT_BOUNDARY_LOCK.md`
- `docs/contracts/hollowcut-export-readiness-result.schema.json` (companion JSON Schema snapshot)
- Hollowcut catalog in `src/hollows/hollowcutHollowCatalog.ts` (exactly 9 Hollows including export_plan_preview, separate from V1's 12)

This contract is frozen for the current authorized pass. Future changes to the result shape require a new authorized pass + new snapshot contract.