# Hollowcut Project Contract

## Contract Status

Planning contract exists. Hollowcut project TypeScript types and a pure local project validator began in Pass 22. Pass 23 adds the explicit `inspect-hollowcut-project` CLI command for read-only validation of user-provided project JSON files.

Hollowcut UI, studio launch/runtime, project mutation, project save/repair commands, timeline/caption/export Hollows, FFmpeg/export, and media rendering are still not implemented. The project validator and CLI inspection command do not render, export, mutate project files, probe media, assign trust tiers, call HollowRunner, call the Verified Return Path, or write Ledger entries.

## Purpose

This document defines the future Hollowcut project JSON shape before runtime implementation begins.

## Core Boundary

- Hollowcut project JSON is a project description, not trusted evidence.
- Project fields must be validated by Caleb-owned validators.
- Media metadata must come from verified media Hollow EvidencePackets.
- Project loading must not bypass Verified Return Path, Ledger, or Change Guard.

## Project Object Shape

```json
{
  "schema_version": "1.0.0",
  "project_id": "string",
  "project_name": "string",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp",
  "project_root": "string",
  "assets": [],
  "timeline": {},
  "tracks": [],
  "captions": [],
  "narration": {},
  "export_targets": [],
  "validation_state": {},
  "ledger_refs": [],
  "artifact_refs": [],
  "provenance": {}
}
```

## Asset Contract

```json
{
  "asset_id": "string",
  "asset_type": "image | audio | video | text | unknown",
  "relative_path": "string",
  "display_name": "string",
  "expected_media_type": "image | audio | video | unknown",
  "metadata_hint": {},
  "verified_metadata": null,
  "evidence_refs": [],
  "warnings": []
}
```

Rules:

- `relative_path` must be path-safe.
- `metadata_hint` is not trusted evidence.
- `verified_metadata` must come from an EvidencePacket.
- `evidence_refs` should refer to verified media Hollow outputs.

## Timeline Contract

Timeline details are further defined in `docs/TIMELINE_SCHEMA_CONTRACTS.md`. Timeline validation remains future work. Timeline JSON is project state, not rendered media or trusted evidence.

Pass 25 adds shared timeline validation helper functions for future validators. Pass 26 adds `hollow.timeline.schema_check` for supplied timeline structure validation. Pass 27 adds duration consistency, asset reference, and track reference Hollows for supplied timeline/project state (including temporal integrity check). A dedicated Hollowcut catalog (separate from the protected V1 catalog of exactly 13 after AUD-1) now contains 9 Hollows, including `hollow.hollowcut.project_state_check`, `hollow.hollowcut.project_timeline_cross_check`, `hollow.hollowcut.export_readiness_check`, `hollow.hollowcut.export_plan_preview`, and `hollow.timeline.temporal_integrity_check`. `hollow.hollowcut.export_readiness_check` validates only supplied project_state + timeline_state + optional export_profile; checks deterministic structural readiness only (does not export, render, mutate, inspect media files, call ffmpeg, or create build artifacts). Hardened export_profile contract and export target/profile alignment on represented fields remain active (target_platform match or blocker; contradictions on dims/fps/format/duration = blockers; multiples = warnings). Reports the full backward-compatible fields (ready/valid/status/checks/issues/warnings/blockers/skipped_checks/summary) plus deterministic readiness_summary/rollup (ready, status ready|ready_with_warnings|not_ready|invalid, ids, export_profile_present, export_targets_count, matched_export_target_count, asset/track/timeline_item counts, blocking/error/warning/skipped counts, blocking_categories, warning_categories, top_blockers, next_required_actions (only from known issue codes), unmapped_issue_codes (unknown codes; no invented actions), safe_to_hand_to_future_export (true only when ready && valid && no blockers && no errors), supplied_state_only). Contract artifacts exist: docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md and docs/contracts/hollowcut-export-readiness-result.schema.json. See docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md for the defined future export runtime boundary (first phase is non-destructive Export Plan Preview only; strictly gated behind T2 verified readiness evidence, readiness_summary contract conformance, safe_to_hand_to_future_export true, and zero blockers). No export runtime exists yet. Valid and invalid outputs conform to the documented contract. Explicit Hollowcut CLI surfaces (`list-hollowcut-hollows` and `run-hollowcut-hollow`) exist for the lane (supports --json, --write-ledger, --write-report via existing). The project validator and timeline Hollows remain separate from V1. Hollowcut runtime is still supplied-state validation only. V1 catalog remains exactly 13 after AUD-1 and locked. Full suite is green. Raw runner output T0/unverified; Verified Return Path promotes clean deterministic to T2 only. Ledger/report supported through existing mechanisms.

```json
{
  "timeline_id": "string",
  "duration_ms": 0,
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "aspect_ratio": "16:9",
  "items": []
}
```

Timeline item shape:

```json
{
  "item_id": "string",
  "asset_id": "string",
  "track_id": "string",
  "start_ms": 0,
  "duration_ms": 1000,
  "end_ms": 1000,
  "transition_in": null,
  "transition_out": null,
  "effects": [],
  "warnings": []
}
```

Rules:

- `end_ms` should equal `start_ms + duration_ms` unless explicitly overridden by future policy.
- Timeline validation belongs to later Timeline Validation Hollows.
- Timeline JSON does not imply rendering.

## Track Contract

```json
{
  "track_id": "string",
  "track_type": "visual | audio | caption | narration | effect",
  "name": "string",
  "locked": false,
  "muted": false,
  "items": []
}
```

## Caption Contract

```json
{
  "caption_id": "string",
  "text": "string",
  "start_ms": 0,
  "end_ms": 1000,
  "style_ref": "string | null",
  "reading_speed_wpm": null,
  "warnings": []
}
```

Rules:

- Caption timing validation is future work.
- Reading speed validation is future work.

## Narration Contract

```json
{
  "script": "string",
  "voice_profile": "string | null",
  "estimated_duration_ms": null,
  "audio_asset_id": "string | null",
  "evidence_refs": []
}
```

## Export Target Contract

```json
{
  "target_id": "string",
  "platform": "youtube | youtube_shorts | tiktok | instagram | custom",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "format": "mp4",
  "status": "planned | validated | exported",
  "output_path": "string | null",
  "requires_approval": true,
  "warnings": []
}
```

Rules:

- Export targets are settings only.
- Export does not occur from project JSON.
- Export/rendering is future approval-gated side-effect work.

## Validation State Contract

```json
{
  "last_validated_at": "ISO timestamp | null",
  "validation_status": "not_validated | valid | warnings | invalid",
  "checks": [],
  "warnings": [],
  "errors": [],
  "evidence_refs": [],
  "report_refs": []
}
```

## Provenance and Ledger Contract

- `ledger_refs` are references to actual Ledger entries.
- Project files may store refs but must not invent accepted evidence.
- Future project validators should identify missing or stale refs.
- Reports may summarize project validation state.

## Safety Rules

- no broad filesystem scan.
- no implicit media probing.
- no export/rendering.
- no shell commands.
- no network calls.
- no trust assignment by Hollowcut project JSON.
- no project mutation without Change Guard policy in future runtime.

## Future Validators

Planned future validators:

- `hollow.hollowcut.project_schema`
- `hollow.hollowcut.asset_path_safety`
- `hollow.timeline.duration_consistency`
- `hollow.timeline.asset_reference_check`
- `hollow.caption.timing_check`
- `hollow.caption.reading_speed_check`
- `hollow.export.readiness_check`

These are future planned Hollows, not implemented now.

## Pass 22 Validator Status

Pass 22 adds `src/hollowcut/project` as the first narrow Hollowcut runtime layer:

- TypeScript project format types.
- structured validation issues.
- pure object validation.
- asset path-safety checks through existing media path safety helpers.
- no filesystem reads or writes.
- no trust assignment.
- no Ledger writes.
- no Hollowcut UI/studio runtime.

## Pass 23 CLI Inspection Status

Pass 23 adds `inspect-hollowcut-project` as an explicit read-only CLI surface for the Pass 22 validator:

- validates only an explicit `--input-file` project JSON file.
- returns structured validation results.
- does not mutate project files.
- does not create EvidencePackets.
- does not write Ledger entries or reports.
- does not assign trust or call the Verified Return Path.
- does not render, export, probe media, or call HollowRunner.

## Final Contract Statement

The Hollowcut project contract is approved for the narrow Pass 22 project validator, Pass 23 read-only CLI inspection command, Pass 24 timeline contracts, Pass 25 timeline helper foundation, Pass 26 timeline schema check Hollow, and Pass 27 duration/reference timeline Hollows only. Additional Hollowcut runtime parsing, mutation, UI, timeline Hollow validation beyond duration/reference, caption, export, or studio behavior requires a separate authorized pass.
