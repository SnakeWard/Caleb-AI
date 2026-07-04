# Timeline Schema Contracts

## Contract Status

Planning contract exists. Timeline validation shared TypeScript types and pure helper functions began in Pass 25. Pass 26 adds `hollow.timeline.schema_check` as the first supplied-state timeline validation Hollow. Pass 27 adds duration consistency, asset reference, and track reference timeline Hollows. Overlap, caption-overlap, media-fit, and export-alignment timeline Hollows remain planned only.

## Purpose

This document defines the future Hollowcut timeline JSON structure before timeline runtime validation or timeline Hollows begin.

## Core Boundary

- Timeline JSON is project state, not rendered media.
- Timeline JSON is not trusted evidence.
- Timeline validation does not render, export, mutate, or probe media.
- Timeline validation must not bypass Caleb Core.
- Future timeline evidence must come through Verified Return Path if implemented as Hollows.

## Timeline Object Shape

```json
{
  "timeline_id": "string",
  "duration_ms": 0,
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "aspect_ratio": "16:9",
  "timebase": "milliseconds",
  "items": [],
  "markers": [],
  "warnings": []
}
```

Rules:

- `timeline_id` must be non-empty.
- `duration_ms` must be finite and non-negative.
- `fps` must be finite and positive.
- `width` and `height` must be finite positive numbers.
- `aspect_ratio` must be a label or custom value.
- `timebase` for first implementation should be milliseconds.
- `items` must not imply rendering.
- `warnings` are project-local warnings, not EvidencePackets.

## Timeline Item Contract

```json
{
  "item_id": "string",
  "asset_id": "string",
  "track_id": "string",
  "item_type": "visual | audio | caption | narration | effect | unknown",
  "start_ms": 0,
  "duration_ms": 1000,
  "end_ms": 1000,
  "layer": 0,
  "enabled": true,
  "transition_in": null,
  "transition_out": null,
  "effects": [],
  "metadata": {},
  "warnings": []
}
```

Rules:

- `item_id` must be non-empty.
- `asset_id` must reference a project asset unless `item_type` allows virtual future items.
- `track_id` must reference a project track.
- `start_ms`, `duration_ms`, and `end_ms` must be finite non-negative numbers.
- `end_ms` should equal `start_ms + duration_ms` unless future policy allows overrides.
- `layer` must be integer-like and non-negative.
- `enabled: false` means ignored by future render/export but still validated structurally.
- `effects` are declarations only, not execution.

## Track Contract

```json
{
  "track_id": "string",
  "track_type": "visual | audio | caption | narration | effect",
  "name": "string",
  "locked": false,
  "muted": false,
  "visible": true,
  "items": []
}
```

Rules:

- `track_id` must be non-empty.
- `items` should reference timeline item IDs.
- `muted` affects audio/narration behavior later but does not mutate assets.
- `locked` is UI/editor state only.
- `visible` is UI/editor state only.

## Timeline Marker Contract

```json
{
  "marker_id": "string",
  "time_ms": 0,
  "label": "string",
  "marker_type": "beat | scene | warning | note | custom",
  "notes": "string | null"
}
```

Rules:

- Markers are planning aids.
- Markers do not affect rendering unless future policy says so.
- Warning markers are not Verified Return Path warnings.

## Transition Contract

```json
{
  "transition_type": "none | fade | crossfade | cut | custom",
  "duration_ms": 0,
  "settings": {}
}
```

Rules:

- Transitions are declarative only.
- Transition duration must be non-negative.
- Transition validation is future work.
- Transitions do not execute effects.

## Effect Contract

```json
{
  "effect_id": "string",
  "effect_type": "zoom | pan | opacity | volume | color | custom",
  "enabled": true,
  "settings": {},
  "requires_render": true
}
```

Rules:

- Effects are declarative only.
- No effect executes in schema validation.
- Effects requiring render belong to a future approval-gated export/rendering path.

## Timing Policy

- All time values use milliseconds in the first contract.
- Negative timing is invalid.
- `duration_ms` of zero may be allowed for markers but not timeline items unless future policy says so.
- `end_ms` mismatch should be validation warning or error in future policy.
- Timeline duration should be at least max item `end_ms`, or mismatch should be warning/error.
- Item overlaps may be valid or invalid depending on track type.
- Visual overlaps on the same track should likely warn or error.
- Audio overlaps may be allowed depending on mix policy.
- Caption overlaps should likely warn or error.
- Cross-track overlaps are often valid.

## Reference Policy

- Timeline item `asset_id` must reference assets.
- Timeline item `track_id` must reference tracks.
- Track item lists should reference timeline items.
- Narration/caption references are future-specific.
- Broken refs are validation errors.
- Stale `evidence_refs` are future validator warnings.

## Media Metadata Policy

- Timeline dimensions/aspect ratio may be compared to media EvidencePackets later.
- Timeline validation must not directly trust `metadata_hint`.
- Verified media metadata must come from EvidencePackets.
- Timeline validation must not probe media files directly unless a future approved Hollow does so.

## Export Boundary

- Timeline JSON does not export.
- Export targets are settings only.
- Rendering/export requires a future approval-gated side-effect path.
- No FFmpeg in timeline validation.

## Future Timeline Validators

Planned validators:

- `hollow.timeline.schema_check`
- `hollow.timeline.duration_consistency`
- `hollow.timeline.asset_reference_check`
- `hollow.timeline.track_reference_check`
- `hollow.timeline.overlap_check`
- `hollow.timeline.caption_overlap_check`
- `hollow.timeline.media_fit_check`
- `hollow.timeline.export_target_alignment_check`

These are future planned, not implemented now.

## Final Contract Statement

Timeline schema contracts, shared helper foundation, `hollow.timeline.schema_check`, and Pass 27 duration/reference Hollows are approved for supplied-state inspection only. Additional runtime timeline Hollow validation requires a separate authorized pass.
