# Media Metadata Safety Policy

## Policy Status

Planning policy exists. Path-safety helper implementation began in Pass 16. Image dimension inspection is allowed in Pass 17 as read-only header inspection. Aspect ratio inspection is allowed in Pass 18 as read-only metadata/math inspection. Duration Hollows currently validate provided metadata only in Pass 19. Pass 20 adds explicit media catalog CLI access without adding export, FFmpeg, shell, network, or mutation capability. FFmpeg/export/conversion/media mutation remains forbidden.

## Safety Goal

Media metadata inspection must support Hollowcut without opening unsafe file, shell, network, or mutation pathways. Media metadata Hollows are Caleb-owned inspection workers, not renderers, exporters, converters, or model tools.

## Allowed First-Phase Behavior

Allowed in the first media runtime phase later:

- explicit file path inspection.
- path-safe read-only access.
- safe file stat.
- safe header inspection if implemented without external dependencies.
- provided metadata validation.
- structured unsupported result.
- warnings for unsupported formats.
- Verified Return Path promotion only after checks.

## Forbidden First-Phase Behavior

Forbidden:

- FFmpeg execution.
- shell commands.
- transcoding.
- rendering.
- conversion.
- file mutation.
- deletion.
- broad directory scan.
- watching folders.
- network metadata lookup.
- cloud upload.
- dependency installation without an explicit dependency pass.
- trusting `metadata_hint` as verified file truth by default.

## Path Safety Rules

- `relative_path` must be relative.
- absolute `relative_path` is forbidden.
- `../` traversal is forbidden.
- resolved target must stay inside `project_root`.
- `node_modules`, `dist`, `.git`, and `.caleb` are blocked.
- directories are not valid media files for these Hollows.
- symlink behavior must be considered before implementation; the safest first policy is to reject symlinks or resolve and verify containment.

## Permission Policy

Media metadata Hollows require `read_only` permission only.

They must not request:

- `workspace_write`
- `shell_command`
- `network`
- `external_side_effect`

## Side-Effect Boundary

Metadata Hollows do not create, modify, delete, convert, or export files. The Image Dimensions Hollow reads only a bounded image header from one explicit path-safe file. The Aspect Ratio Hollow performs deterministic ratio math from explicit dimensions, metadata hints, or supported image header dimensions.

The Audio Duration and Video Duration Hollows validate and normalize provided `metadata_hint` duration values only. They may check path safety if a path is supplied, but they do not read, stat, decode, or probe audio/video files.

Media CLI commands do not grant export, FFmpeg, shell, network, media conversion, or mutation capability. They only expose explicit listing, manifest inspection, and one-Hollow execution through the media catalog and Verified Return Path. The media CLI demo in `docs/MEDIA_CLI_DEMO.md` remains inspection-only.

## Unsupported Media Policy

If media metadata cannot be determined safely:

- return a structured unsupported result.
- include a warning.
- do not crash unless input is invalid.
- do not attempt fallback shell commands.
- do not attempt network lookup.

## Future Export Boundary

Export/rendering is separate and approval-gated. It requires:

- pre-change snapshot.
- explicit approval.
- `workspace_write`.
- `approved_side_effect`.
- output hash.
- Ledger entry.
- report.

## Test Requirements

Future safety tests must prove:

- explicit file paths are required.
- absolute paths and traversal are blocked.
- blocked runtime/source folders are rejected.
- directories and unsupported media are handled safely.
- no FFmpeg, shell, network, or media mutation path exists.
- warnings are preserved through Hollow Runner and Verified Return Path.
- Ledger and report generation remain separate from Hollow implementation.

## Final Safety Statement

Media metadata inspection is allowed only as explicit, read-only, path-safe inspection. Rendering/export belongs to a later approval-gated side-effect track.
