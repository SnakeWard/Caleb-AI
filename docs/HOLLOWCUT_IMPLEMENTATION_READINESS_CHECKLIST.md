# Hollowcut Implementation Readiness Checklist

## Purpose

This checklist must be satisfied before any Hollowcut runtime code is added.

## Required Existing Caleb Capabilities

- [x] V1 MVP accepted.
- [x] V1 milestone snapshot created.
- [x] Hollow Registry exists.
- [x] Hollow Runner exists.
- [x] Verified Return Path exists.
- [x] JSONL Ledger exists.
- [x] Change Guard exists.
- [x] Report Builder exists.
- [x] CLI exists.
- [x] Acceptance tests pass.

## Required Hollowcut Planning Artifacts

- [x] Hollowcut integration plan exists.
- [x] Caleb/Hollowcut boundary exists.
- [x] Hollowcut boundary lock exists.
- [x] media safety policy documented.
- [x] media metadata contracts documented.
- [x] media metadata implementation plan documented.
- [x] export side-effect policy documented.
- [x] Hollowcut project contract documented.
- [x] Hollowcut project example fixtures documented.
- [x] future folder shape documented.
- [x] launch model documented.
- [x] first Hollow families documented.

## Before First Hollowcut Runtime Pass

- [ ] no dependencies added without explicit pass.
- [ ] no UI framework selected without explicit pass.
- [ ] no FFmpeg/export code in first runtime pass.
- [ ] path safety requirements reviewed.
- [ ] media metadata contracts reviewed.
- [ ] media safety policy reviewed.
- [ ] media implementation plan reviewed.
- [x] media path safety/types foundation complete.
- [x] first media metadata Hollow exists.
- [x] aspect ratio media metadata Hollow exists.
- [x] provided-metadata duration media Hollows exist.
- [x] media catalog boundary exists.
- [x] media CLI boundary exists.
- [x] Hollowcut project contract reviewed.
- [x] example project fixtures reviewed.
- [x] project types and pure validator implemented in Pass 22.
- [x] project CLI inspect command implemented in Pass 23 as read-only validation only.
- [x] timeline schema contracts reviewed.
- [x] timeline safety policy reviewed.
- [x] timeline validation Hollow plan reviewed.
- [x] timeline shared helpers implemented in Pass 25.
- [x] timeline schema check Hollow implemented in Pass 26.
- [x] timeline duration/reference Hollows implemented in Pass 27 (including temporal integrity check).
- [x] dedicated Hollowcut catalog (separate from V1) with 9 Hollows (including project_state_check, project_timeline_cross_check, export_readiness_check (hollow.hollowcut.export_readiness_check), export_plan_preview (hollow.hollowcut.export_plan_preview), and temporal_integrity_check) and CLI surfaces (list-hollowcut-hollows, run-hollowcut-hollow). V1 catalog remains exactly 13 after AUD-1. `hollow.hollowcut.export_readiness_check` validates only supplied project_state + timeline_state + optional export_profile for deterministic structural readiness only; does not export, render, mutate, inspect media, call ffmpeg or create artifacts. Hardened export_profile + target/profile alignment active (represented fields only). Reports full backward-compatible shape plus deterministic readiness_summary/rollup with ready/status (ready|ready_with_warnings|not_ready|invalid), counts, blocking_categories/warning_categories, next_required_actions (known codes only), unmapped_issue_codes (unknowns; no invention), safe_to_hand_to_future_export (true only when ready+valid+blocking=0+errors=0), supplied_state_only. Contract artifacts exist: docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md and docs/contracts/hollowcut-export-readiness-result.schema.json. Valid/invalid outputs conform to the contract. Supports existing CLI path. Full suite green post-pass. T0 raw from runner; VRP to T2; Ledger/report via existing.
- [ ] timeline overlap/media-fit/export Hollows require separate pass approval.
- [ ] timeline CLI/catalog adapter requires separate pass approval.
- [ ] next Hollowcut runtime additions require separate pass approval.
- [ ] no additional runtime media Hollow implementation before an authorized pass.
- [ ] Snapshot requirement reviewed.
- [ ] Ledger/report behavior reviewed.
- [ ] Verified Return Path behavior reviewed.
- [ ] no direct model calls.
- [ ] no shell command execution.

## First Recommended Implementation Passes

- Pass 15 — Media Metadata Hollow Planning and Contracts.
- Pass 16 — Media Metadata Path Safety and Types.
- Pass 17 — Image Dimensions Hollow.
- Pass 18 — Aspect Ratio Hollow.
- Pass 19 — Provided Metadata Duration Hollows.
- Pass 20 — Media Hollow Catalog Adapter and CLI Boundary.
- Pass 21 — Media CLI Demo and Hollowcut Project Contract Planning.
- Pass 22 — Hollowcut Project Format Types and Validator.
- Pass 23 — Hollowcut Project Fixtures and CLI Inspect Command.
- Pass 24 — Timeline Schema Contracts.
- Pass 25 — Timeline Validation Types and Shared Helpers. Implemented as pure helper foundation only.
- Pass 26 — Timeline Schema Check Hollow. Implemented as supplied-state schema validation only.
- Pass 27 — Timeline Duration and Reference Hollows. Implemented as supplied-state validation only.

## Stop Conditions

Stop if:

- runtime implementation starts before boundary lock is accepted.
- Hollowcut tries to assign trust tiers.
- Hollowcut bypasses Verified Return Path.
- Hollowcut writes Ledger entries directly without Caleb service path.
- Hollowcut attempts FFmpeg/export before approval-gated side-effect policy exists.
- Hollowcut adds dependencies without explicit dependency pass.
- Hollowcut creates 3D UI runtime before telemetry exists.

## Current Runtime Boundary

`src/hollowcut/project` is allowed only for project format types, validation result types, structured validation issues, and pure local validation helpers. `inspect-hollowcut-project` is allowed only as an explicit read-only CLI validator surface. `src/hollowcut/timeline` is allowed only for Pass 25 timeline validation types and pure shared helpers. `src/hollows/categories/timeline` is allowed only for Pass 26 schema check and Pass 27 duration/reference Hollows. A dedicated Hollowcut catalog (in `src/hollows/hollowcutHollowCatalog.ts`, separate from protected V1 catalog of exactly 13 after AUD-1) and explicit Hollowcut CLI surfaces (`list-hollowcut-hollows`, `run-hollowcut-hollow`) are allowed for supplied-state Hollows (including `hollow.hollowcut.project_state_check`, `hollow.hollowcut.project_timeline_cross_check`, and `hollow.hollowcut.export_readiness_check`). `hollow.hollowcut.export_readiness_check` validates only supplied project_state + timeline_state (+ optional export_profile); deterministic structural readiness only (no export/render/mutate/media inspect/ffmpeg/artifacts); reports ready/valid/status/checks/issues/warnings/blockers/skipped_checks/summary plus readiness_summary/rollup. Contract artifacts exist: docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md and docs/contracts/hollowcut-export-readiness-result.schema.json. See docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md for the defined future export runtime boundary (first phase is non-destructive Export Plan Preview only; strictly gated behind T2 verified readiness evidence, readiness_summary contract conformance, safe_to_hand_to_future_export true, and zero blockers). No export runtime exists yet. Valid/invalid outputs conform to the contract. Additional Hollowcut runtime folders, UI, project or timeline save/repair/mutation, overlap/media-fit/export timeline Hollow systems, FFmpeg/export, orchestration, role routing, model APIs, and 3D UI runtime remain unauthorized. V1 cornerstone remains locked. Full suite green. T0 from runner, VRP promotes clean to T2; Ledger/report via existing.

## Final Readiness Statement

Hollowcut implementation is not authorized until this checklist is accepted for the specific pass being started.
