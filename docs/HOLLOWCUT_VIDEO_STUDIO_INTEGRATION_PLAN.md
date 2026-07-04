# Hollowcut Video Studio Integration Plan

## Product Definition

Hollowcut Video Studio is a separate video production studio/workbench launched from Caleb AI in its own browser window or dedicated page, powered by Caleb AI's Hollow Server, Verified Return Path, Ledger, Change Guard, Report Builder, and future Orchestration Core.

Hollowcut is not the Caleb Core. Hollowcut may request Caleb services, but Caleb Core remains the source of truth for verification, Ledger, snapshots, permissions, reports, and future orchestration.

## Core Product Metaphor

Caleb AI is the engine.

Hollowcut Video Studio is the studio cockpit.

The 3D Thinking Mode is the future gauge cluster / camera port into the engine.

## Launch Model

Intended UI launch shape:

Caleb AI Dashboard:

- Hollow Server Console.
- Ledger / Reports.
- Change Guard / Snapshots.
- Future 3D Thinking Mode.
- Open Hollowcut Video Studio.

Clicking Open Hollowcut Video Studio opens a dedicated Hollowcut page or window.

Hollowcut should be launched by Caleb, but must not bypass Caleb.

The launch action is navigation only. It does not grant Hollowcut direct trust-tier, Ledger, snapshot, export, model-provider, shell, or workspace-write authority.

## Separation of Responsibilities

| Caleb Core owns | Hollowcut owns |
|---|---|
| Hollow Registry | project UI |
| Hollow Runner | timeline UI |
| Verified Return Path | media bin UI |
| Ledger | caption editing UI |
| Change Guard | preview UI |
| Report Builder | export settings UI |
| future Orchestration Core | user-facing validation panel |
| future Role Router | studio-specific project format |
| future Model API Layer | calls into Caleb services |
| permissions and trust | studio workflow presentation |

## Non-Negotiable Boundaries

Hollowcut MUST NOT:

- bypass Verified Return Path.
- write trusted evidence directly.
- bypass Ledger for accepted outputs.
- bypass Change Guard before risky mutations.
- execute FFmpeg or exports without explicit approval.
- use shell commands directly.
- call model providers directly.
- become the Orchestration Core.
- own trust-tier decisions.
- hide warnings/errors from Caleb.
- perform destructive file operations in the first phase.
- scan the repository or filesystem broadly.
- write outside approved workspace/output paths.

## Proposed Future Folder Shape

Planning only. Do not implement now.

```text
src/hollowcut/
  project/
  timeline/
  captions/
  media/
  export/
  reports/

src/hollows/categories/media/
  audioDurationHollow.ts
  videoDurationHollow.ts
  aspectRatioHollow.ts
  imageDimensionsHollow.ts

src/hollows/categories/timeline/
  timelineDurationHollow.ts
  slideTimingHollow.ts
  captionTimingHollow.ts
  audioVideoAlignmentHollow.ts

src/hollows/categories/export/
  platformPresetCheckHollow.ts
  exportReadinessHollow.ts
  filenameSafetyHollow.ts
```

These folders and files are future planning targets only.

## First Future Hollowcut Hollow Families

Media metadata Hollows:

- `hollow.media.audio_duration`
- `hollow.media.video_duration`
- `hollow.media.aspect_ratio`
- `hollow.media.image_dimensions`

Timeline Hollows:

- `hollow.timeline.total_duration`
- `hollow.timeline.slide_duration_check`
- `hollow.timeline.caption_timing_check`
- `hollow.timeline.audio_video_alignment`

Caption/script Hollows:

- `hollow.caption.overflow_check`
- `hollow.caption.reading_speed_check`
- `hollow.script.scene_balance`
- `hollow.script.narration_runtime_estimate`

Export validation Hollows:

- `hollow.export.platform_preset_check`
- `hollow.export.aspect_ratio_preset_check`
- `hollow.export.filename_safety_check`
- `hollow.export.readiness_check`

## Media Safety Policy

The first Hollowcut phase is inspection-only.

No FFmpeg mutation in the first integration pass. No media conversion in the first integration pass. No destructive file operations. All media file access must be explicit and path-safe. Media metadata Hollows are read-only.

Export/rendering is a future approval-gated side-effect class.

Media metadata planning is captured in:

- `docs/MEDIA_METADATA_HOLLOW_CONTRACTS.md`
- `docs/MEDIA_METADATA_SAFETY_POLICY.md`
- `docs/MEDIA_METADATA_IMPLEMENTATION_PLAN.md`
- `docs/MEDIA_CLI_DEMO.md`

These documents define future contracts only. They do not authorize runtime media Hollow implementation.

## Future FFmpeg / Export Policy

FFmpeg/export operations must require:

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

Do not implement FFmpeg now.

## Hollowcut Project Format Planning

Future Hollowcut project JSON concept:

- `project_id`
- `project_name`
- `created_at`
- `updated_at`
- `assets`
- `timeline`
- `tracks`
- `captions`
- `narration`
- `export_targets`
- `validation_state`
- `ledger_refs`
- `artifact_refs`

This is planning only and must be formalized later.

Pass 21 formalizes the planning contract in `docs/HOLLOWCUT_PROJECT_CONTRACT.md` and the future implementation sequence in `docs/HOLLOWCUT_PROJECT_IMPLEMENTATION_PLAN.md`. Static examples live under `examples/hollowcut-project-demo/`.

Pass 22 begins the first narrow Hollowcut runtime layer as project format TypeScript types plus a pure local validator under `src/hollowcut/project`. This layer validates structure, references, and path safety only. It does not implement Hollowcut UI, studio launch, project mutation, timeline/caption/export Hollows, FFmpeg/export, media conversion, trust assignment, Ledger writes, model calls, or orchestration.

Pass 23 exposes that validator through `inspect-hollowcut-project`, the first user-facing Hollowcut project validation surface. The command reads one explicit project JSON file and returns structured validation results only; it does not save, repair, mutate, assign trust, write Ledger entries, call the Verified Return Path, render, or export.

Pass 24 adds planning-only timeline schema contracts in `docs/TIMELINE_SCHEMA_CONTRACTS.md`, `docs/TIMELINE_VALIDATION_HOLLOW_PLAN.md`, and `docs/TIMELINE_SAFETY_POLICY.md`. Pass 25 adds pure timeline foundation helpers for future validation Hollows. Pass 26 adds the first timeline validation Hollow, `hollow.timeline.schema_check`, for supplied-state schema inspection only. Pass 27 adds duration consistency, asset reference, and track reference timeline validation Hollows. Hollowcut UI is still not implemented.

## Hollowcut Validation Panel

The right-side Caleb Validation Panel should show:

- caption warnings.
- duration mismatch.
- aspect ratio checks.
- missing asset warnings.
- export readiness.
- Ledger/report status.
- snapshot status.
- trust-tier status.

## Future 3D Thinking Mode Integration

Hollowcut should eventually emit telemetry such as:

- `HOLLOWCUT_PROJECT_OPENED`
- `TIMELINE_VALIDATION_STARTED`
- `MEDIA_HOLLOW_INVOKED`
- `CAPTION_WARNING_FOUND`
- `EXPORT_READINESS_CHECKED`
- `SNAPSHOT_CREATED`
- `LEDGER_ENTRY_WRITTEN`
- `REPORT_CREATED`

The 3D UI should render real telemetry only, never fake reasoning.

## Roadmap

- Pass 14 — Hollowcut Plan Review and Boundary Lock.
- Pass 15 — Media Metadata Hollow Planning and Contracts.
- Pass 16 — Media Metadata Path Safety and Types.
- Pass 17 — Hollowcut Project Format.
- Pass 18 — Hollowcut CLI Adapter.
- Pass 19 — Hollowcut Launch Page / Separate Studio Window.
- Pass 20 — Hollowcut Validation Panel.
- Later — Approval-Gated Export Pipeline.
- Later — 3D Thinking Mode Telemetry.

## Final Statement

Hollowcut Video Studio is approved as a future vertical studio module powered by Caleb AI, but no Hollowcut runtime implementation begins until the integration boundary is accepted.

See `docs/HOLLOWCUT_BOUNDARY_LOCK.md` for the locked planning boundary and `docs/HOLLOWCUT_IMPLEMENTATION_READINESS_CHECKLIST.md` before any future runtime implementation pass begins.
