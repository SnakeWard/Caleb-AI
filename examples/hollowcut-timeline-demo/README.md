# Hollowcut Timeline Demo Fixtures

These fixtures are static contract examples for future Hollowcut timeline validators.

They do not run timeline runtime validation, render media, call FFmpeg, convert files, mutate projects, probe media, or create exports. They are examples of planned timeline JSON shapes only. `metadata_hint` values are not trusted evidence; verified media metadata must come from EvidencePackets in future authorized passes.

## Fixtures

- `simple-slideshow-timeline.json` models a small 16:9 image slideshow timeline.
- `layered-narration-timeline.json` models visual, narration/audio, and caption tracks with cross-track overlap.
- `invalid-overlap-timeline.json` models two visual items overlapping on the same visual track.
- `invalid-asset-reference-timeline.json` models an item referencing a missing asset.
- `invalid-negative-duration-timeline.json` models an item with invalid negative duration.

These invalid fixtures are contract examples only. Timeline runtime validators and timeline Hollows are not implemented in this pass.
