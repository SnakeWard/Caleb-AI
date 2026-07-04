# Timeline Safety Policy

## Policy Status

Planning policy exists. Pass 25 adds pure timeline validation helper code for supplied-state inspection. Pass 26 adds `hollow.timeline.schema_check` as the first supplied-state timeline Hollow. Pass 27 adds duration consistency, asset reference, and track reference Hollows for supplied state only. Timeline CLI commands, UI, export, mutation, media probing, overlap/media-fit/export Hollows, and caption validation remain unimplemented.

## Safety Goal

Timeline validation must support Hollowcut planning without opening rendering, mutation, media probing, shell, network, or export pathways.

## Allowed Future First-Phase Behavior

Allowed later:

- validate supplied timeline JSON.
- check references among supplied project structures.
- compute timing math.
- detect overlaps/gaps.
- compare against supplied EvidencePacket-derived media metadata.
- return structured warnings/errors.
- produce reports through the existing Report Builder only if explicitly requested in a later pass.

## Forbidden Timeline Behavior

Forbidden:

- render timeline.
- export video.
- invoke FFmpeg.
- mutate project files.
- repair project files automatically.
- read arbitrary media files.
- scan directories.
- watch folders.
- call shell commands.
- call network.
- call models.
- assign trust tiers.
- write Ledger directly without Caleb-owned path.

## Time and Numeric Safety

- reject non-finite numbers.
- reject negative timing.
- bound extremely large durations.
- use milliseconds as canonical unit.
- avoid floating point drift where possible.
- treat `fps` as a finite positive number.

## Reference Safety

- broken asset refs are errors.
- broken track refs are errors.
- duplicate IDs are errors.
- stale evidence refs are warnings unless future policy says error.
- `metadata_hint` is not evidence.

## Export Boundary

- export target validation is settings-only.
- export status does not mean file exists.
- output paths must be path-safe in future export validation.
- actual export requires approval-gated side-effect path.

## UI Boundary

- UI may display timeline validation state later.
- UI must not bypass validators.
- UI must not assign trust.
- UI must not hide warnings/errors.

## Final Safety Statement

Timeline validation is allowed only as deterministic supplied-state inspection. Rendering/export belongs to a later approval-gated side-effect track.
