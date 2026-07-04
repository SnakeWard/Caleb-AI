# Media Metadata Hollow Contracts

## Contract Status

Planning contract exists. Shared TypeScript types and path-safety helpers began in Pass 16. `hollow.media.image_dimensions` is implemented in Pass 17 as the first read-only media metadata Hollow. `hollow.media.aspect_ratio` is implemented in Pass 18 as read-only metadata/math inspection. `hollow.media.audio_duration` and `hollow.media.video_duration` are implemented in Pass 19 as provided-metadata-only duration Hollows. Pass 20 adds a separate media catalog adapter and explicit media CLI command boundary. Pass 21 documents the media CLI demo. Actual audio/video file header probing remains future-only.

## Purpose

Future media metadata Hollows will provide deterministic, read-only inspection of explicit media inputs for Hollowcut Video Studio and Caleb AI validation flows. They are intended to help Caleb and Hollowcut reason about media duration, dimensions, aspect ratio, and supported metadata without starting a rendering, export, or mutation path.

## Core Boundary

Media metadata Hollows inspect. They do not render, transcode, convert, mutate, export, or execute shell commands.

## Future Hollow IDs

These Hollow IDs are media-track Hollows, not current V1 production Hollows:

- `hollow.media.audio_duration` - implemented in Pass 19 outside the V1 catalog as provided-metadata-only.
- `hollow.media.video_duration` - implemented in Pass 19 outside the V1 catalog as provided-metadata-only.
- `hollow.media.aspect_ratio` - implemented in Pass 18 outside the V1 catalog.
- `hollow.media.image_dimensions` - implemented in Pass 17 outside the V1 catalog.

They are assembled by the separate media catalog, not by the accepted V1 catalog. The V1 catalog remains unchanged at 12 Hollows.

## Shared Input Contract

Future shared input shape:

```json
{
  "project_root": "string",
  "relative_path": "string",
  "expected_media_type": "audio | video | image | unknown",
  "metadata_hint": {}
}
```

Rules:

- `project_root` is required for file-based inspection.
- `relative_path` must be relative and path-safe.
- `metadata_hint` is optional and must never be treated as verified file metadata unless the Hollow contract explicitly says so.
- file paths must stay inside `project_root`.
- no broad directory scan is allowed.

## Shared Output Contract

Future shared result fields:

```json
{
  "relative_path": "string",
  "media_type": "audio | video | image | unknown",
  "inspection_method": "header_probe | browser_metadata | provided_metadata | future_adapter",
  "metadata_confidence": "high | medium | low",
  "warnings": [],
  "unsupported_reason": "string | null"
}
```

Every media Hollow result still starts as raw Hollow Runner output and must pass Verified Return Path before becoming evidence.

## Audio Duration Hollow Contract

Hollow ID:
`hollow.media.audio_duration`

Purpose:
Determine or validate duration metadata for an explicit audio file or supplied metadata object.

Input:

```json
{
  "project_root": "string",
  "relative_path": "string",
  "expected_media_type": "audio",
  "metadata_hint": {
    "duration_ms": 123456
  }
}
```

Future result:

```json
{
  "duration_ms": 123456,
  "duration_seconds": 123.456,
  "duration_source": "header_probe | browser_metadata | provided_metadata | unsupported",
  "codec_hint": "string | null",
  "container_hint": "string | null"
}
```

The Pass 19 implementation validates and normalizes `metadata_hint.duration_ms` and/or `metadata_hint.duration_seconds` only. It does not inspect audio file headers, decode media, use FFmpeg, or read files.

## Video Duration Hollow Contract

Hollow ID:
`hollow.media.video_duration`

Purpose:
Determine or validate duration metadata for an explicit video file or supplied metadata object.

Future result fields:

- `duration_ms`
- `duration_seconds`
- `duration_source`
- `frame_rate_hint`
- `container_hint`
- `codec_hint`

The Pass 19 implementation validates and normalizes `metadata_hint.duration_ms` and/or `metadata_hint.duration_seconds` only, and validates optional `frame_rate_hint`. No decoding, rendering, transcoding, file header probing, or FFmpeg is allowed.

## Aspect Ratio Hollow Contract

Hollow ID:
`hollow.media.aspect_ratio`

Purpose:
Determine or validate width, height, and aspect ratio for explicit image or video metadata.

Future result fields:

- `width`
- `height`
- `aspect_ratio_decimal`
- `aspect_ratio_label`
- `orientation`
- `matches_expected_ratio`
- optional `expected_ratio`

Supported labels:

- `16:9`
- `9:16`
- `1:1`
- `4:5`
- `21:9`
- `custom`

The Pass 18 implementation supports direct dimensions, metadata hints, and supported path-safe image header dimensions through the existing Image Dimensions Hollow helper. Video duration/metadata remains future and must not use FFmpeg.

## Image Dimensions Hollow Contract

Hollow ID:
`hollow.media.image_dimensions`

Purpose:
Determine image width and height for explicit image files.

Future result fields:

- `width`
- `height`
- `megapixels`
- `orientation`
- `format_hint`

The first implementation supports safe local header inspection for PNG, JPEG/JPG, and GIF without dependencies. Unsupported formats may use clearly marked `provided_metadata` only when a valid `metadata_hint` is supplied.

## Manifest Expectations

Future manifests must declare:

- `category`: `media`
- `permissions`: `["read_only"]`
- `permissions_required`: `["read_only"]`
- `file_access_scope`: `provided_handles_only` or `workspace_read`
- `network_access`: `false`
- `execution_mode`: `local_inspection`
- `deterministic`: `true`
- `deterministic_level`: `bounded_external_state` or `strict` depending on implementation method
- `supports_batching`: `false` unless implemented
- `supports_streaming`: `false`
- `owner`: `caleb-ai-core`
- `status`: `draft` until fully tested

## Trust Expectations

- Runner output starts as `T0` and `unverified`.
- Verified Return Path may promote valid deterministic media metadata to `T2` only if V1 safety passes.
- Ledger records metadata evidence but does not promote trust.
- Reports summarize metadata but do not promote trust.
- `metadata_hint` should not be promoted to truth unless clearly marked and verified by policy.

## Future Tests Required

Future implementation must include tests for:

- manifest validation.
- V1-safe validation.
- path traversal blocked.
- absolute path blocked.
- blocked folders rejected.
- missing file handled.
- unsupported media handled.
- valid metadata result promoted to `T2`.
- invalid input rejected.
- no FFmpeg dependency.
- no shell commands.
- no network calls.
- no file mutation.

## Current Media Runtime Status

- `hollow.media.image_dimensions` exists as a read-only media Hollow outside the V1 catalog.
- `hollow.media.aspect_ratio` exists as a read-only media Hollow outside the V1 catalog.
- `hollow.media.audio_duration` exists as a provided-metadata-only read-only media Hollow outside the V1 catalog.
- `hollow.media.video_duration` exists as a provided-metadata-only read-only media Hollow outside the V1 catalog.
- The separate media catalog contains exactly these four `hollow.media.*` Hollows.
- Media CLI access is explicit through `list-media-hollows`, `inspect-media-hollow`, and `run-media-hollow`.
- Media CLI demo commands are documented in `docs/MEDIA_CLI_DEMO.md`.
- Real audio/video file probing remains unimplemented.
- Hollowcut runtime remains unimplemented.

## Final Contract Statement

Additional media metadata Hollow runtime requires a separate authorized pass.
