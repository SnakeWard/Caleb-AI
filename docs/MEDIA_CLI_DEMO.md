# Media CLI Demo

## Purpose

The media CLI demo proves that media Hollows are accessible only through explicit media commands and remain separate from the accepted V1 catalog.

## What This Demo Proves

The demo proves:

```text
Media CLI -> Media Hollow Catalog -> Hollow Registry -> Hollow Runner -> Verified Return Path -> optional Ledger -> optional Report Builder
```

- media runner output starts `T0` and `unverified`.
- Verified Return Path may promote valid deterministic media output to `T2`.
- Ledger and report writes remain opt-in.

## What This Demo Does Not Do

This demo does not implement:

- Hollowcut runtime.
- Hollowcut UI.
- FFmpeg/export.
- media conversion.
- audio/video file probing.
- browser metadata bridge.
- orchestration.
- role rotation.
- model calls.
- 3D UI.

## Catalog Boundary

V1 commands:

- `list-hollows`
- `inspect-hollow`
- `run-hollow`

Media commands:

- `list-media-hollows`
- `inspect-media-hollow`
- `run-media-hollow`

V1 commands remain V1-only. Media commands remain media-only. `run-hollow` must not run `hollow.media.*`. `run-media-hollow` must not run V1-only Hollows.

## Commands

List the accepted V1 catalog:

```bash
npm run cli -- list-hollows --json
```

List the separate media catalog:

```bash
npm run cli -- list-media-hollows --json
```

Inspect the Aspect Ratio Hollow:

```bash
npm run cli -- inspect-media-hollow --id hollow.media.aspect_ratio --json
```

Run Aspect Ratio from a fixture:

```bash
npm run cli -- run-media-hollow --id hollow.media.aspect_ratio --input-file examples/media-demo/aspect-ratio-input.json --json
```

Run Audio Duration from provided metadata:

```bash
npm run cli -- run-media-hollow --id hollow.media.audio_duration --input-file examples/media-demo/audio-duration-provided-metadata-input.json --json
```

Run Video Duration from provided metadata:

```bash
npm run cli -- run-media-hollow --id hollow.media.video_duration --input-file examples/media-demo/video-duration-provided-metadata-input.json --json
```

Optional local Ledger/report example:

```bash
npm run cli -- run-media-hollow --id hollow.media.aspect_ratio --input-file examples/media-demo/aspect-ratio-input.json --json --write-ledger --ledger-path .caleb/tmp/media-demo-ledger.jsonl --write-report --report-dir .caleb/tmp/media-demo-reports
```

## Expected Behavior

- `list-hollows` returns 12 accepted V1 Hollows.
- `list-media-hollows` returns 4 media Hollows.
- `run-media-hollow` Aspect Ratio returns a completed invocation, accepted verification, and `T2` evidence.
- Audio and video duration examples are provided-metadata-only.
- No FFmpeg/export occurs.

## Safety Boundaries

- no shell.
- no network.
- no conversion.
- no export.
- no file mutation.
- no dependency additions.
- image dimensions reads explicit path-safe image files only.
- duration Hollows do not probe audio/video files.

## Troubleshooting

If a media Hollow is not found under `run-hollow`, use `run-media-hollow`.

If a V1 Hollow is not found under `run-media-hollow`, use `run-hollow`.

Image dimensions requires an explicit path-safe image file unless a supported metadata fallback is used by the Hollow.

Generated Ledger/report files should remain under `.caleb/tmp` or temporary test paths.
