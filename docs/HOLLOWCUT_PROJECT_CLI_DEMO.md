# Hollowcut Project CLI Demo

## Purpose

This demo validates Hollowcut project JSON files through an explicit read-only CLI command. It exposes the project validator without turning project inspection into trust promotion, rendering, export, Ledger writing, or project mutation.

## What This Demo Proves

`CLI -> explicit project file -> Hollowcut Project Validator -> structured validation result`

Project validation is local and read-only. It does not create EvidencePackets, write Ledger entries, render media, export media, call Hollows, or call the Verified Return Path.

## What This Demo Does Not Do

This demo does not implement Hollowcut UI, a studio page or window, project save or repair commands, FFmpeg/export, rendering, media conversion, timeline/caption/export Hollows, orchestration, model calls, or 3D UI.

## Command

```bash
npm run cli -- inspect-hollowcut-project --input-file examples/hollowcut-project-demo/minimal-project.json --json
npm run cli -- inspect-hollowcut-project --input-file examples/hollowcut-project-demo/slideshow-project.json --json
npm run cli -- inspect-hollowcut-project --input-file examples/hollowcut-project-demo/narrated-video-project.json --json
```

Invalid fixture examples:

```bash
npm run cli -- inspect-hollowcut-project --input-file examples/hollowcut-project-demo/invalid-missing-project-id.json --json
npm run cli -- inspect-hollowcut-project --input-file examples/hollowcut-project-demo/invalid-unsafe-asset-path.json --json
```

## Expected Behavior

Valid fixtures should parse and validate with no blocking errors, though planning warnings may be reported. Invalid fixtures should return `validation_result.valid: false`. Malformed JSON and missing files return CLI input errors. Validation errors are structured results, not process crashes.

## Safety Boundaries

The command reads only the explicit input file and applies a max file size limit. It performs no broad filesystem scan, project mutation, Ledger/report writes, trust promotion, HollowRunner invocation, media probing, FFmpeg, or export.

## Troubleshooting

If `--input-file` is missing, provide a project JSON file path. If JSON is malformed, fix the JSON syntax before validation can run. Invalid project refs and unsafe asset paths appear as validation issues. Validation warnings describe project quality or trust-boundary concerns; CLI errors describe command/input failures.
