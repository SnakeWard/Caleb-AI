# Media Metadata Implementation Plan

## Implementation Status

Types and path-safety foundation started in Pass 16. Pass 17 implemented the Image Dimensions Hollow as the first read-only media metadata Hollow. Pass 18 implemented Aspect Ratio Hollow as read-only media metadata/math inspection. Pass 19 implemented Provided Metadata Duration Hollows for audio and video without file probing. Pass 20 implemented the separate Media Hollow Catalog Adapter and CLI Boundary.

## Recommended Pass Sequence

- Pass 16 — Media Metadata Path Safety and Types. Completed as the shared types/path-safety foundation.
- Pass 17 — Image Dimensions Hollow. Implemented as read-only PNG, GIF, and JPEG header inspection.
- Pass 18 — Aspect Ratio Hollow. Implemented as read-only direct dimension, metadata hint, and supported image header aspect ratio inspection.
- Pass 19 — Provided Metadata Duration Hollows. Implemented as metadata_hint duration normalization only.
- Pass 20 — Media Hollow Catalog Adapter and CLI Boundary. Implemented as a separate media catalog and explicit media CLI commands without changing the accepted V1 catalog.
- Pass 21 — Media CLI Demo and Hollowcut Project Contract Planning. Added media CLI demo documentation and static Hollowcut project contract examples without runtime Hollowcut code.
- Pass 22 — Hollowcut Project Format Types and Validator.
- Later — FFmpeg Export Boundary, approval-gated only.

## First Implementation Strategy

Start with the safest pieces:

- shared media types.
- path safety helper reused from provenance if appropriate.
- image dimensions if safe local header parsing is feasible.
- aspect ratio from supplied width and height.
- aspect ratio from supported image header dimensions.
- provided metadata duration validation.
- no FFmpeg.
- no dependencies unless separately approved.

## Implementation Constraints

- no dependencies in the first implementation pass unless explicitly authorized.
- no shell.
- no network.
- no workspace write.
- no broad scanning.
- no actual export/render.

## Future Folder Shape

Planning only:

```text
src/hollows/categories/media/
  mediaHollowTypes.ts
  mediaPathSafety.ts
  imageDimensionsHollow.ts
  aspectRatioHollow.ts
  audioDurationHollow.ts
  videoDurationHollow.ts
  mediaHollowManifests.ts
  index.ts

tests/hollows/media/
  mediaPathSafety.test.ts
  imageDimensionsHollow.test.ts
  aspectRatioHollow.test.ts
  audioDurationHollow.test.ts
  videoDurationHollow.test.ts
  mediaHollowIntegration.test.ts
```

Do not create these folders until an authorized runtime pass begins.

## Contract-to-Code Mapping

Each planned Hollow maps to:

- manifest.
- input type.
- result type.
- implementation.
- direct unit tests.
- integration tests through Registry, Runner, Verified Return Path, and Ledger factory.

Planned mapping:

| Hollow ID | Manifest | Input/result types | Implementation | Tests |
|---|---|---|---|---|
| `hollow.media.audio_duration` | `audioDurationManifest` | `AudioDurationInput`, `AudioDurationResult` | `audioDurationImplementation` | unit plus media integration |
| `hollow.media.video_duration` | `videoDurationManifest` | `VideoDurationInput`, `VideoDurationResult` | `videoDurationImplementation` | unit plus media integration |
| `hollow.media.aspect_ratio` | `aspectRatioManifest` | `AspectRatioInput`, `AspectRatioResult` | `aspectRatioImplementation` | unit plus media integration |
| `hollow.media.image_dimensions` | `imageDimensionsManifest` | `ImageDimensionsInput`, `ImageDimensionsResult` | `imageDimensionsImplementation` | unit plus media integration |

## Acceptance Criteria for First Runtime Media Pass

- [ ] no dependencies added.
- [ ] no FFmpeg.
- [ ] no shell.
- [ ] no network.
- [ ] no file mutation.
- [ ] manifests validate.
- [ ] manifests are V1-safe.
- [ ] runner output starts `T0`.
- [ ] Verified Return Path promotes eligible output to `T2`.
- [ ] Ledger factory can consume accepted evidence.
- [ ] tests use temp dirs only.
- [ ] no Hollowcut UI runtime added.

## Risks and Deferrals

- duration metadata may be hard without dependencies.
- video metadata may need a future adapter.
- browser metadata may belong to a UI/runtime boundary later.
- FFmpeg belongs to the export track, not the metadata first phase.

## Next Recommended Pass

Pass 22 should begin Hollowcut Project Format Types and Validator if the project contract is accepted.

## Final Implementation Statement

Additional media metadata runtime implementation may proceed only through separately authorized passes that preserve the read-only, path-safe, no-FFmpeg boundary.
