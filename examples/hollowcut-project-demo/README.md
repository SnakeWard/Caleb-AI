# Hollowcut Project Demo Fixtures

These are static planning fixtures for the future Hollowcut project contract.

They do not run Hollowcut runtime, render media, call FFmpeg, convert files, probe audio/video files, or create exports.

They show the expected shape of future Hollowcut project JSON. `metadata_hint` values are not trusted evidence. Verified metadata must come from future EvidencePackets created through Caleb-owned Hollows and the Verified Return Path.

## Fixtures

- `minimal-project.json` is a minimal valid planning fixture.
- `slideshow-project.json` is a valid image slideshow planning fixture.
- `narrated-video-project.json` is a valid narrated media planning fixture.
- `invalid-missing-project-id.json` omits `project_id`.
- `invalid-unsafe-asset-path.json` includes an unsafe asset path.
- `invalid-missing-asset-reference.json` includes a timeline item that references a missing asset.

Use `docs/HOLLOWCUT_PROJECT_CLI_DEMO.md` for the explicit read-only CLI validation command. Invalid fixtures should produce structured validation failures, not project mutation, Ledger writes, trusted evidence, rendering, or export.

For planning-only timeline contract examples, see `examples/hollowcut-timeline-demo/` and `docs/TIMELINE_SCHEMA_CONTRACTS.md`. Those fixtures do not implement timeline runtime validation or timeline Hollows.
