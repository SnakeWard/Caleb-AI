# Caleb AI V1 CLI Demo

## Purpose

This demo proves the explicit local Caleb AI V1 path using deterministic Hollows and existing runtime primitives.

## What This Demo Proves

The demo proves:

```text
CLI -> V1 Hollow Catalog -> Hollow Registry -> Hollow Runner -> Verified Return Path -> optional Ledger -> optional Report Builder
```

It shows that a human or Codex can list registered Hollows, inspect a manifest, run one explicit Hollow by ID with explicit JSON input, receive raw runner output as `T0`, pass that output through the Verified Return Path, and optionally write local Ledger entries and reports.

## What This Demo Does Not Do

This demo does not implement:

- Orchestration Core
- Role Rotation
- Model API Layer
- 3D UI / Thinking Mode
- autonomous planning
- model calls
- shell command Hollows

## Prerequisites

Install project dependencies first:

```bash
npm install
```

The repo already includes the local `tsx` dev dependency used by the CLI script.

## Commands

List the V1 Hollow catalog:

```bash
npm run cli -- list-hollows --json
```

Inspect a specific Hollow manifest:

```bash
npm run cli -- inspect-hollow --id hollow.text.character_count --json
```

Run Character Count with a demo fixture:

```bash
npm run cli -- run-hollow --id hollow.text.character_count --input-file examples/v1-demo/character-count-input.json --json
```

Run Prompt Limit with optional local Ledger and report output:

```bash
npm run cli -- run-hollow --id hollow.text.prompt_limit --input-file examples/v1-demo/prompt-limit-input.json --json --write-ledger --write-report --report-dir .caleb/reports
```

Run Code Safety Scan:

```bash
npm run cli -- run-hollow --id hollow.code.safety_scan --input-file examples/v1-demo/code-safety-input.json --json
```

## Expected Behavior

- `list-hollows` returns the V1 production Hollow catalog.
- `inspect-hollow` returns the requested manifest.
- `run-hollow` runs exactly one explicit Hollow.
- Runner output starts as `trust_tier: "T0"` and `verification_status: "unverified"`.
- Verified Return Path returns accepted deterministic evidence as `trust_tier: "T2"`.
- Warning-producing Hollows preserve warnings in the invocation and EvidencePacket.

## Ledger And Report Flags

Ledger writing is opt-in:

```bash
--write-ledger
```

Use `--ledger-path` to choose a local JSONL path. Without it, the default Ledger path is `.caleb/ledger/ledger.jsonl`.

Report writing is opt-in:

```bash
--write-report
```

Use `--report-dir` to choose an output directory. Use `--report-format markdown`, `--report-format json`, or `--report-format both`.

## Safety Boundaries

- The CLI does not call models.
- The CLI does not choose a Hollow from natural language.
- The CLI does not execute shell commands.
- The CLI does not scan the repository.
- `--input-file` reads only the explicit JSON file supplied by the caller.
- Ledger and report writes occur only when their flags are present.

The V1 commands `list-hollows`, `inspect-hollow`, and `run-hollow` remain scoped to the accepted 12-Hollow V1 catalog. Media-track Hollows use explicit separate commands: `list-media-hollows`, `inspect-media-hollow`, and `run-media-hollow`.

For media command examples, see `docs/MEDIA_CLI_DEMO.md`.

## Troubleshooting

If a command fails, re-run with `--json` to inspect the structured `errors` array.

If `npm run cli -- ...` does not pass arguments, make sure the `--` separator is present after `cli`.

If report or Ledger files are not created, confirm that `--write-report` or `--write-ledger` was included.
