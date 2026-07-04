# Timeline Validation Hollow Plan

## Plan Status

Planning exists, Pass 25 added shared timeline validation types plus pure helper functions, Pass 26 implemented `hollow.timeline.schema_check`, and Pass 27 implemented duration/reference timeline Hollows. Overlap, media-fit, export-alignment, and caption-overlap Timeline Hollows are not implemented yet.

## Purpose

Future timeline Hollows will validate timeline structure, timing, references, and export readiness inputs without rendering or mutating media.

## Future Hollow Families

Planned future Hollow IDs:

- `hollow.timeline.schema_check`
- `hollow.timeline.duration_consistency`
- `hollow.timeline.asset_reference_check`
- `hollow.timeline.track_reference_check`
- `hollow.timeline.overlap_check`
- `hollow.timeline.caption_overlap_check`
- `hollow.timeline.media_fit_check`
- `hollow.timeline.export_target_alignment_check`

## Shared Input Contract

```json
{
  "project": {},
  "timeline": {},
  "assets": [],
  "tracks": [],
  "captions": [],
  "media_evidence": [],
  "validation_policy": {}
}
```

Rules:

- `project` and `timeline` are supplied objects, not read from disk by the Hollow.
- `media_evidence` must be EvidencePacket-derived or clearly marked untrusted.
- `validation_policy` controls strict/warning behavior.
- No broad filesystem access.

## Shared Output Contract

```json
{
  "valid": true,
  "timeline_id": "string",
  "checks": [],
  "warnings": [],
  "errors": [],
  "summary": {},
  "evidence_refs": []
}
```

Output still starts as `T0`/unverified and must pass Verified Return Path if implemented as Hollow output.

## Timeline Schema Check Hollow

Purpose: validate timeline object shape.

Allowed:

- inspect supplied timeline JSON.
- validate required fields.
- validate numeric timing fields.

Forbidden:

- media reads.
- rendering.
- export.
- mutation.

## Duration Consistency Hollow

Purpose: check timeline duration against item end times.

Checks:

- max item end time.
- timeline duration too short.
- timeline duration much longer than content.
- zero/negative durations.

## Asset Reference Check Hollow

Purpose: check item asset refs against project assets.

Checks:

- missing asset refs.
- unused assets.
- asset type mismatch.

## Track Reference Check Hollow

Purpose: check item track refs and track item lists.

Checks:

- missing track refs.
- mismatched item lists.
- duplicate track IDs.

## Overlap Check Hollow

Purpose: check overlaps according to track type.

Policy examples:

- same visual track overlap warning/error.
- audio overlap allowed or warning depending policy.
- caption overlap warning/error.
- cross-track visual overlap may be allowed by layer policy.

## Media Fit Check Hollow

Purpose: compare timeline/project dimensions to verified media metadata.

Rules:

- must use EvidencePackets or clearly supplied media evidence.
- must not inspect files directly.
- must not trust `metadata_hint` as verified truth.

## Export Target Alignment Check Hollow

Purpose: check export target settings against timeline dimensions/fps/aspect ratio.

Rules:

- settings-only validation.
- no export.
- no FFmpeg.

## Safety Rules

- no file reads unless explicitly supplied in future authorized pass.
- no media probing.
- no FFmpeg.
- no shell.
- no network.
- no mutation.
- no Ledger writes directly.
- no trust assignment by Hollow implementation.

## Recommended Implementation Sequence

- Pass 25 — Timeline Validation Types and Shared Helpers. Implemented as pure types and helper functions only.
- Pass 26 — Timeline Schema Check Hollow. Implemented as supplied-state schema validation only.
- Pass 27 — Timeline Duration and Reference Hollows. Implemented as supplied-state duration and reference validation only.
- Pass 28 — Timeline Overlap Check Hollow.
- Pass 29 — Caption Timing and Reading Speed Contracts.
- Pass 30 — Export Readiness Contracts.

## Next Recommended Pass

Pass 28 — Timeline Overlap Check Hollow.

## Final Plan Statement

Timeline Validation Hollows may begin only after this plan and safety policy are accepted.
