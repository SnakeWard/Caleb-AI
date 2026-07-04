# Caleb AI

Caleb AI is a Hollow-first orchestration system.

Doctrine: **Models think. Hollows work. Caleb orchestrates.**

## Current Status

This repository is in Pass 27 - Timeline Duration and Reference Hollows (Hollowcut supplied-state lane extensions). The current foundation provides local TypeScript V1 primitives for Hollow manifests, the Hollow Registry, Hollow Runner, Verified Return Path, JSONL Ledger, Auto Snapshot and Change Guard, production text/validation/provenance/code Hollows, the Basic Report Builder, a thin explicit CLI, shared media metadata path-safety/type helpers, read-only media metadata Hollows, a separate media Hollow catalog adapter, media CLI demo docs, Hollowcut project contract planning fixtures, the first pure Hollowcut project format validator, an explicit read-only Hollowcut project inspection CLI command, planning timeline schema contracts, timeline helper foundation code, supplied-state timeline validation Hollows for schema, duration, asset references, and track references (including temporal integrity), a dedicated Hollowcut catalog (separate from V1) with 9 Hollows including project_state_check, project_timeline_cross_check, export_readiness_check, export_plan_preview, and temporal_integrity_check, and explicit Hollowcut CLI surfaces (list-hollowcut-hollows and run-hollowcut-hollow). V1 catalog remains exactly 12 and protected. Hollowcut catalog is separate; export_readiness_check (hollow.hollowcut.export_readiness_check) validates only supplied project_state + timeline_state + optional export_profile for deterministic structural readiness (no export, no render, no mutate, no media file inspection, no ffmpeg, no build artifacts). Hardened export_profile contract and export target/profile alignment (on represented fields) remain active. When both supplied, contradictions produce blockers; multiples produce warnings. It reports the full backward-compatible shape (ready/valid/status/checks/issues/warnings/blockers/skipped_checks/summary) plus a deterministic readiness_summary/rollup object for consumers containing ready, status (ready|ready_with_warnings|not_ready|invalid), project_id, timeline_id, export_profile_present, export_targets_count, matched_export_target_count, asset_count, track_count, timeline_item_count, blocking_count, error_count, warning_count, skipped_check_count, blocking_categories, warning_categories, top_blockers, next_required_actions, unmapped_issue_codes, safe_to_hand_to_future_export, and supplied_state_only. Contract artifacts exist: docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md and docs/contracts/hollowcut-export-readiness-result.schema.json. See docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md for the defined future export runtime boundary (first phase is non-destructive Export Plan Preview only; strictly gated behind T2 verified readiness evidence, readiness_summary contract conformance, safe_to_hand_to_future_export true, and zero blockers). No export runtime exists yet. Explicit Hollowcut CLI surfaces exist: `list-hollowcut-hollows` and `run-hollowcut-hollow` (support --json, --write-ledger, --write-report via existing mechanisms). Hollowcut runtime remains limited to supplied-state validation only; V1 catalog remains exactly 12 and protected. Full suite green. Runner emits raw T0/unverified invocation. VRP promotes clean deterministic to T2 only. Ledger/report via existing. ine_id, export_profile_present, export_targets_count, matched_export_target_count, asset_count, track_count, timeline_item_count, blocking_count, error_count, warning_count, skipped_check_count, blocking_categories, warning_categories, top_blockers, next_required_actions, unmapped_issue_codes, safe_to_hand_to_future_export, and supplied_state_only. Contract artifacts exist: docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md and docs/contracts/hollowcut-export-readiness-result.schema.json. Valid and invalid outputs conform to the documented contract. Runner emits raw T0/unverified; VRP promotes only clean deterministic to T2. Ledger/report via existing. Full suite green. ine_id, export_profile_present, export_targets_count, matched_export_target_count, asset_count, track_count, timeline_item_count, blocking_count, error_count, warning_count, skipped_check_count, blocking_categories, warning_categories, top_blockers, next_required_actions (deterministic only from known issue codes), unmapped_issue_codes (unknown codes; no invented actions), safe_to_hand_to_future_export (true only when ready && valid && blocking_count===0 && error_count===0), and supplied_state_only. Supports run-hollowcut-hollow + list-hollowcut-hollows (incl. --write-ledger/--write-report); raw runner output is T0/unverified; Verified Return Path promotes clean deterministic output to T2; Ledger/report via existing mechanisms. Full suite green.

V1 begins with the Hollow Server MVP foundation. Role Rotation, multi-model provider APIs, production auth, cloud deployment, and 3D UI / Thinking Mode are future phases.

## V1 MVP Status

Caleb AI V1 is a Hollow-first, explicit-command local foundation. The V1 acceptance report is tracked in `docs/V1_MVP_ACCEPTANCE_REPORT.md`.

V1 does not include Orchestration Core, Role Rotation, Model API Layer, 3D UI / Thinking Mode, or Hollowcut runtime integration; those remain future phases. The deterministic decision layer inside the future Orchestration Core (Logic Engine) is defined in docs/CALEB_LOGIC_ENGINE_CONTRACT.md (documentation and contract only; no runtime in this or unauthorized passes).

## V1 Milestone and Hollowcut Planning

The V1 MVP foundation is accepted and preserved as a milestone in `docs/V1_MILESTONE_SNAPSHOT.md`.

Hollowcut Video Studio is planned as a future separate studio launched from Caleb AI and powered by Caleb AI. Hollowcut is not implemented in V1. See `docs/HOLLOWCUT_VIDEO_STUDIO_INTEGRATION_PLAN.md`, `docs/HOLLOWCUT_CALEB_BOUNDARY.md`, `docs/HOLLOWCUT_BOUNDARY_LOCK.md`, and `docs/HOLLOWCUT_IMPLEMENTATION_READINESS_CHECKLIST.md`.

Media Metadata Hollow contracts are documented. Pass 16 added shared TypeScript types plus path-safety/type/math helpers, Pass 17 added `hollow.media.image_dimensions`, Pass 18 added `hollow.media.aspect_ratio`, Pass 19 added `hollow.media.audio_duration` plus `hollow.media.video_duration` as provided-metadata-only read-only normalization Hollows, Pass 20 added a separate media Hollow catalog plus explicit media CLI commands, Pass 21 added the media CLI demo plus Hollowcut project contract planning, Pass 22 added Hollowcut project TypeScript types plus a pure local validator, Pass 23 exposes that validator through `inspect-hollowcut-project` for explicit project JSON inspection, Pass 24 adds timeline schema contracts, Pass 25 adds timeline validation types plus shared pure helper functions, Pass 26 adds `hollow.timeline.schema_check`, and Pass 27 adds `hollow.timeline.duration_consistency`, `hollow.timeline.asset_reference_check`, `hollow.timeline.track_reference_check`, and `hollow.timeline.temporal_integrity_check`. A dedicated Hollowcut catalog (separate from the protected V1 catalog of exactly 12) now contains 9 Hollows, including `hollow.hollowcut.project_state_check`, `hollow.hollowcut.project_timeline_cross_check`, `hollow.hollowcut.export_readiness_check`, `hollow.hollowcut.export_plan_preview`, and `hollow.timeline.temporal_integrity_check`. `hollow.hollowcut.export_readiness_check` validates only supplied project_state + timeline_state + optional export_profile for deterministic structural readiness only (no export/render/mutate/inspect media/call ffmpeg/create artifacts); reports ready/valid/status/checks/issues/warnings/blockers/skipped_checks/summary plus readiness_summary/rollup. Contract artifacts exist: docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md and docs/contracts/hollowcut-export-readiness-result.schema.json. Valid/invalid outputs conform to the contract. Explicit Hollowcut CLI surfaces exist: `list-hollowcut-hollows` and `run-hollowcut-hollow` (support --json, --write-ledger, --write-report via existing mechanisms). Hollowcut runtime remains limited to supplied-state validation only; V1 catalog remains exactly 12 and protected. Full suite green. Runner emits raw T0/unverified invocation. VRP promotes clean deterministic to T2 only. Ledger/report via existing. d Return Path promotes only clean deterministic output to T2. Ledger/report flags supported through existing mechanisms. Hollowcut UI/studio, project or timeline save/repair/mutation, overlap/media-fit/export timeline Hollows, real audio/video file probing, FFmpeg/export, Orchestration Core, Role Rotation, Model API Layer, and 3D UI runtime remain unimplemented. See `docs/MEDIA_METADATA_HOLLOW_CONTRACTS.md`, `docs/MEDIA_METADATA_SAFETY_POLICY.md`, `docs/MEDIA_METADATA_IMPLEMENTATION_PLAN.md`, `docs/MEDIA_CLI_DEMO.md`, `docs/HOLLOWCUT_PROJECT_CONTRACT.md`, `docs/HOLLOWCUT_PROJECT_IMPLEMENTATION_PLAN.md`, `docs/HOLLOWCUT_PROJECT_CLI_DEMO.md`, `docs/TIMELINE_SCHEMA_CONTRACTS.md`, `docs/TIMELINE_VALIDATION_HOLLOW_PLAN.md`, and `docs/TIMELINE_SAFETY_POLICY.md`. V1 cornerstone and protected V1 catalog remain locked.

## Validation

Run:

```bash
npm test
npm run typecheck
npm run build
```

Start the compiled entry point after building:

```bash
npm start
```

## Minimal CLI

The CLI exposes explicit local commands only. It does not plan tasks, call models, implement Role Rotation, or run hidden workflows.

```bash
npm run cli -- help
npm run cli -- info
npm run cli -- list-hollows
npm run cli -- inspect-hollow --id hollow.text.character_count
npm run cli -- run-hollow --id hollow.text.character_count --input-json "{\"text\":\"hello\"}"
```

V1 CLI commands remain V1-only. Media Hollows use explicit media commands and remain inspection-only:

```bash
npm run cli -- list-media-hollows --json
npm run cli -- inspect-media-hollow --id hollow.media.aspect_ratio --json
npm run cli -- run-media-hollow --id hollow.media.aspect_ratio --input-json "{\"width\":1920,\"height\":1080,\"expected_ratio\":\"16:9\"}" --json
```

Optional local side effects are opt-in:

```bash
npm run cli -- run-hollow --id hollow.text.character_count --input-json "{\"text\":\"hello\"}" --write-ledger --write-report
```

## Caleb AI V1 CLI Demo

The V1 CLI demo proves the explicit local loop from CLI to Hollow Runner to Verified Return Path, with opt-in Ledger and report output. See `docs/V1_CLI_DEMO.md`.

```bash
npm run cli -- list-hollows --json
npm run cli -- inspect-hollow --id hollow.text.character_count --json
npm run cli -- run-hollow --id hollow.text.character_count --input-file examples/v1-demo/character-count-input.json --json
```

The V1 CLI is explicit-command only. It does not call models, perform Role Rotation, or run autonomous planning.
