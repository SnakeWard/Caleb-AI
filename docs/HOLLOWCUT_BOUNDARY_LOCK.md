# Hollowcut Boundary Lock

## Boundary Status

Boundary locked.

The only Hollowcut runtime currently allowed is the narrow Pass 22 project validation layer under `src/hollowcut/project`, the Pass 23 explicit read-only `inspect-hollowcut-project` CLI command, the Pass 25 timeline helper foundation under `src/hollowcut/timeline`, the Pass 26 `hollow.timeline.schema_check` Hollow, the Pass 27 duration/reference timeline Hollows under `src/hollows/categories/timeline` (including temporal integrity check), the dedicated Hollowcut catalog (separate from V1, containing 9 Hollows including `hollow.hollowcut.project_state_check`, `hollow.hollowcut.project_timeline_cross_check`, `hollow.hollowcut.export_readiness_check`, `hollow.hollowcut.export_plan_preview`, and `hollow.timeline.temporal_integrity_check`), and explicit Hollowcut CLI surfaces (`list-hollowcut-hollows`, `run-hollowcut-hollow`). `hollow.hollowcut.export_readiness_check` validates only supplied project_state + timeline_state + optional export_profile; deterministic structural readiness checks only (does not export, render, mutate, inspect media files, call ffmpeg, or create build artifacts). Hardened export_profile contract + target/profile alignment (represented fields) active. Reports full backward-compatible fields plus deterministic readiness_summary/rollup (ready/status ready|ready_with_warnings|not_ready|invalid, counts, blocking_categories, warning_categories, next_required_actions from known codes only, unmapped_issue_codes for unknowns, safe_to_hand_to_future_export true only on ready+valid+no blockers+no errors, supplied_state_only). Contract artifacts exist: docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md and docs/contracts/hollowcut-export-readiness-result.schema.json. See docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md for the defined future export runtime boundary (first phase is non-destructive Export Plan Preview only; strictly gated behind T2 verified readiness evidence, readiness_summary contract conformance, safe_to_hand_to_future_export true, and zero blockers). No export runtime exists yet. Valid/invalid outputs conform to the contract. Supports existing run-hollowcut-hollow path. Additional Hollowcut runtime (UI, mutation, etc.) is not authorized. V1 catalog remains exactly 13 after AUD-1 and protected. Full suite green after pass. Runner T0/unverified; Verified Return Path to T2 only for clean deterministic; Ledger/report flags via existing mechanisms.

Hollowcut UI/studio runtime, timeline/caption/export runtime, FFmpeg/export, media conversion, project save/repair/mutation, orchestration, model API, role routing, and 3D UI runtime are not started.

## Core Statement

Hollowcut Video Studio is a future vertical studio module launched from Caleb AI. Hollowcut is not Caleb Core. Hollowcut may request Caleb services, but Caleb Core remains the source of truth for trust, verification, Ledger, snapshots, reports, permissions, and future orchestration.

## Launch Boundary

- Hollowcut should open from Caleb Dashboard as a dedicated page/window.
- The launch action is a UI navigation/open-window action only.
- Launching Hollowcut does not grant direct trust or side-effect authority.
- Hollowcut must call Caleb service surfaces for validation, evidence, snapshots, reports, and exports.

## Caleb Core Ownership

Caleb owns:

- Hollow Registry.
- Hollow Runner.
- Verified Return Path.
- Trust tiers.
- Ledger.
- Change Guard.
- Report Builder.
- permissions.
- future Orchestration Core.
- future Role Router.
- future Model API Layer.
- future Thinking Mode telemetry contract.

## Hollowcut Ownership

Hollowcut owns:

- studio layout.
- project UI.
- media bin UI.
- timeline UI.
- caption/narration UI.
- preview UI.
- export settings UI.
- validation panel UI.
- studio-specific project JSON format.
- user-facing workflow affordances.

## Non-Bypass Rules

Hollowcut MUST NOT:

- bypass Verified Return Path.
- assign trust tiers.
- write trusted evidence directly.
- bypass Ledger for accepted outputs.
- bypass Change Guard before risky mutations.
- execute FFmpeg/export commands without approval.
- call shell commands directly.
- call model providers directly.
- become the Orchestration Core.
- hide warnings/errors.
- perform destructive file operations in first phase.
- scan the repository or filesystem broadly.
- write outside approved workspace/output paths.

## First Hollowcut Phase Scope

The first Hollowcut implementation phase should be inspection-only and planning-oriented.

Pass 15 added media metadata contracts as planning artifacts. Pass 16 allowed shared media foundation types and path-safety helpers. Pass 17 adds the read-only Image Dimensions Hollow. Pass 18 adds the read-only Aspect Ratio Hollow. Pass 19 adds provided-metadata-only Audio Duration and Video Duration Hollows. Pass 20 adds a separate media catalog adapter and explicit media CLI boundary. Pass 21 adds media CLI demo documentation plus Hollowcut project contract examples. Pass 22 allows only Hollowcut project format types and a pure validator. Pass 23 allows only explicit read-only Hollowcut project CLI inspection. Pass 24 adds timeline schema contracts and static timeline fixtures. Pass 25 allows only timeline validation types and pure shared helper functions. Pass 26 allows only the `hollow.timeline.schema_check` supplied-state Hollow. Pass 27 allows duration consistency, asset reference, and track reference timeline Hollows. Hollowcut catalog now 9 (incl. hollow.hollowcut.export_plan_preview for supplied project+timeline+export_profile structural readiness only). Hollowcut studio/UI runtime is still absent, FFmpeg/export remains forbidden, and the media implementation track remains inspection-only. V1=12 locked; Hollowcut separate; T0->T2 via VRP; no behavior change in this milestone lock pass.

Allowed now:

- project format TypeScript definitions.
- pure project structure/reference/path validator.
- explicit `inspect-hollowcut-project` CLI validation command.
- timeline schema contracts and static timeline example fixtures.
- timeline validation types and pure shared helper functions.

Allowed later, but not now:

- media metadata Hollows.
- timeline validation Hollows beyond schema/duration/reference checks.
- caption validation Hollows.
- export-readiness validation Hollows.
- project save/repair/mutation commands.
- launch page.

Not allowed in first Hollowcut runtime phase:

- FFmpeg export.
- media conversion.
- destructive operations.
- shell execution.
- direct model-provider calls.
- autonomous planning.

## Approval-Gated Future Export Boundary

FFmpeg/export requires:

- pre-change snapshot.
- explicit user approval.
- `workspace_write` permission.
- `approved_side_effect` execution mode.
- bounded output path.
- captured stdout/stderr.
- output artifact hash.
- Ledger entry.
- export report.
- rollback notes where applicable.

## Thinking Mode Boundary

The 3D Thinking Mode may later visualize Hollowcut telemetry, but it must render real Caleb events only. It must not fake reasoning or become the execution engine.

## Boundary Lock Checklist

- [x] Hollowcut runtime absent.
- [x] media export and timeline Hollow runtime absent.
- [x] Caleb Core trust ownership preserved.
- [x] Verified Return Path required.
- [x] Ledger required for accepted outputs.
- [x] Change Guard required for risky mutations.
- [x] export side effects approval-gated.
- [x] no shell/network/model calls in first phase.
- [x] launch shape documented.
- [x] roadmap documented.
- [x] media metadata contracts planned.
- [x] media foundation types/path safety allowed.
- [x] image dimensions media Hollow exists.
- [x] aspect ratio media Hollow exists.
- [x] provided-metadata audio/video duration hollows exist.
- [x] media catalog adapter exists.
- [x] media CLI boundary exists.
- [x] Hollowcut project contract exists.
- [x] Hollowcut project examples exist.
- [x] Hollowcut project types/validator exists as the only allowed Hollowcut runtime layer.
- [x] Hollowcut project CLI inspection exists as a read-only validator surface.
- [x] timeline contracts exist.
- [x] timeline helper foundation exists.
- [x] timeline schema check Hollow exists.
- [x] timeline duration/reference Hollows exist.
- [x] timeline overlap/media-fit/export Hollows remain absent.
- [x] Hollowcut UI/studio runtime still absent.
- [x] project save/repair/mutation runtime still absent.
- [x] real audio/video file probing not implemented.
- [x] Hollowcut runtime remains limited to project validation only.
- [x] `src/hollowcut/timeline` is allowed only for Pass 25 helper foundation files.
- [x] `src/hollows/categories/timeline` is allowed only for schema, duration, asset reference, and track reference Hollow files plus manifests and index.
- [x] FFmpeg/export still forbidden.
- [x] first media implementation remains inspection-only.

## Final Boundary Lock Statement

Hollowcut may proceed to future planning and implementation passes only if this boundary remains intact.
