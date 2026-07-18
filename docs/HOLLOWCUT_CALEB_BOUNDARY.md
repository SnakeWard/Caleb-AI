# Hollowcut / Caleb Boundary

## What Caleb Owns

- Hollow Registry.
- Hollow Runner.
- Verified Return Path.
- Ledger.
- Change Guard.
- Report Builder.
- permissions and trust.
- future Thinking Mode telemetry contract.
- future Orchestration Core.
- future Role Router and Role Rotation.
- future Model API Layer.

## What Hollowcut Owns

- studio UI.
- timeline UI.
- media bin UI.
- caption editing UI.
- preview UI.
- export settings UI.
- studio-specific project format.
- user-facing validation panel.
- requests into Caleb services.

## Must Pass Through Verified Return Path

- Hollow invocation output.
- media metadata evidence.
- timeline validation evidence.
- caption validation evidence.
- export readiness evidence.
- any result that a model, user, report, or future orchestration layer may consume as evidence.

Media metadata Hollows are planned as read-only Caleb-owned Hollows. Hollowcut must consume their verified EvidencePackets rather than directly trusting media metadata or `metadata_hint` values.

Hollowcut project files are not trusted merely because they exist. Future Hollowcut project validation must pass through Caleb-owned validation paths, and media evidence must come from verified media Hollow outputs rather than direct UI assumptions.

The Pass 22 Hollowcut project validator may validate project structure, references, and asset path safety. It must not assign trust tiers, treat `metadata_hint` as evidence, call HollowRunner, write Ledger entries directly, mutate project files, probe media, render previews, export media, or bypass Caleb Core.

The Pass 23 `inspect-hollowcut-project` CLI command is a read-only wrapper around that validator. It validates structure only, does not assign trust or write Ledger entries, and any validated project JSON remains project state rather than an EvidencePacket.

Timeline validation must remain Caleb-owned. Timeline JSON must not assign trust, timeline items must not imply export or rendering, and future timeline evidence must come from the Verified Return Path if implemented as Hollows.

The Pass 25 timeline helpers are pure calculations and reference checks only. They do not assign trust, write Ledger entries, call HollowRunner, call the Verified Return Path, render media, export media, mutate project files, or expose a timeline CLI command.

The Pass 26 Timeline Schema Check Hollow validates supplied timeline/project-state objects only. Its runner output starts T0/unverified, and Verified Return Path is required before any EvidencePacket promotion. The Hollow itself does not assign trust, write Ledger entries, mutate project files, render, export, probe media, call models, or expose a timeline CLI command.

The Pass 27 timeline duration/reference Hollows (plus later Hollowcut lane additions) validate supplied timeline/project-state objects only. A dedicated Hollowcut catalog (separate from the protected V1 catalog of exactly 13 after AUD-1) now contains 9 Hollows, including `hollow.hollowcut.project_state_check`, `hollow.hollowcut.project_timeline_cross_check`, `hollow.hollowcut.export_readiness_check`, `hollow.hollowcut.export_plan_preview`, and `hollow.timeline.temporal_integrity_check`. `hollow.hollowcut.export_readiness_check` validates only supplied project_state + timeline_state + optional export_profile; deterministic structural readiness only (does not export, render, mutate, inspect media files, call ffmpeg, or create build artifacts). Hardened export_profile + target/profile alignment (represented fields) active. Reports full backward-compatible fields plus deterministic readiness_summary/rollup for consumers (ready/status ready|ready_with_warnings|not_ready|invalid, project/timeline ids, export_profile_present, counts for targets/matched/assets/tracks/items, blocking/error/warning/skipped, blocking_categories, warning_categories, top_blockers, next_required_actions (known codes only), unmapped_issue_codes (unknowns; no invention), safe_to_hand_to_future_export (true only when ready+valid+blocking=0+error=0), supplied_state_only). Contract artifacts exist: docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md and docs/contracts/hollowcut-export-readiness-result.schema.json. Valid/invalid outputs conform to the contract. Explicit Hollowcut CLI surfaces (`list-hollowcut-hollows`, `run-hollowcut-hollow`) exist. Runner output starts T0/unverified; Verified Return Path is required before EvidencePacket promotion to T2. These do not assign trust outside VRP, mutate files, render, export, probe media, call models, or create Hollowcut runtime beyond supplied-state validation. V1 cornerstone and catalog remain locked. Full suite green. Ledger/report via existing. list-hollowcut-hollows shows the new Hollow.

## Must Write Ledger

- accepted EvidencePackets intended for durable provenance.
- approved export attempts.
- export artifacts and hashes.
- snapshot and rollback events.
- validation reports that become durable run records.

## Requires Snapshot

- project file mutation.
- timeline rewrite.
- caption batch edits.
- export settings mutation.
- media output creation.
- any future workflow that may overwrite user-owned work.

## Requires Explicit Approval

- workspace writes.
- export/render operations.
- FFmpeg or equivalent media processing.
- destructive cleanup.
- network publication.
- external service calls.

## Future-Only

- Hollowcut runtime source.
- Hollowcut UI routes.
- media metadata Hollows.
- timeline validation Hollows.
- export/rendering Hollows.
- FFmpeg integration.
- approval-gated export pipeline.
- 3D Thinking Mode telemetry UI.

## Forbidden In First Hollowcut Phase

- bypassing Caleb verification.
- bypassing Caleb Ledger.
- direct shell commands.
- direct model provider calls.
- destructive file operations.
- broad repository or filesystem scanning.
- workspace writes outside approved paths.
- media conversion.
- export rendering.
- owning trust-tier decisions.

## Boundary Lock Reference

`docs/HOLLOWCUT_BOUNDARY_LOCK.md` is the formal lock for this planning boundary. `docs/HOLLOWCUT_IMPLEMENTATION_READINESS_CHECKLIST.md` must be reviewed before any future Hollowcut runtime pass begins.

Media metadata planning references are in `docs/MEDIA_METADATA_HOLLOW_CONTRACTS.md`, `docs/MEDIA_METADATA_SAFETY_POLICY.md`, and `docs/MEDIA_METADATA_IMPLEMENTATION_PLAN.md`.

Hollowcut project validation is currently limited to `src/hollowcut/project` types, pure validation helpers, the explicit read-only `inspect-hollowcut-project` CLI command, the Pass 25 `src/hollowcut/timeline` shared helper foundation, the Pass 26 `hollow.timeline.schema_check` supplied-state Hollow, Pass 27 supplied-state duration/reference timeline Hollows, and the dedicated Hollowcut catalog (9 Hollows incl. hollow.hollowcut.export_plan_preview for supplied-state-only structural export readiness checks). Hollowcut runtime remains supplied-state validation only. V1 catalog remains exactly 13 after AUD-1 and protected. T0 runner -> VRP T2; Ledger/report existing mechanisms. Full suite green. No mutation/export/render in Hollowcut Hollows.

Hollowcut project planning references are in `docs/HOLLOWCUT_PROJECT_CONTRACT.md`, `docs/HOLLOWCUT_PROJECT_IMPLEMENTATION_PLAN.md`, and `docs/HOLLOWCUT_PROJECT_CLI_DEMO.md`. Timeline planning references are in `docs/TIMELINE_SCHEMA_CONTRACTS.md`, `docs/TIMELINE_VALIDATION_HOLLOW_PLAN.md`, and `docs/TIMELINE_SAFETY_POLICY.md`.
