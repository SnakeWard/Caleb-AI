# Caleb AI V1 MVP Acceptance Report

## Acceptance Status

Accepted.

## Executive Summary

Caleb AI V1 proves the Hollow-first local deterministic path:

```text
CLI -> V1 Hollow Catalog -> Hollow Registry -> Hollow Runner -> Verified Return Path -> optional Ledger -> optional Report Builder
```

The V1 MVP can list production Hollows, inspect manifests, run one explicit Hollow with explicit JSON input, verify deterministic output into T2 EvidencePacket form, optionally write append-only JSONL Ledger entries, and optionally write local Markdown/JSON reports.

V1 does not include Orchestration Core, Role Rotation, Model API Layer, 3D Thinking Mode, Hollowcut Video Studio, autonomous planning, model calls, shell command Hollows, network Hollows, or side-effecting Hollows beyond explicit local Ledger/report writes.

## Current Component Inventory

- Governance docs: source authority, operating contract, phase boundaries, canonical contracts, storage/Ledger decisions, permission policy, test plan, execution battleplan, Change Guard plan, and future 3D UI plan are present.
- Type layer: canonical TypeScript contracts exist under `src/types/`.
- Hollow Registry: in-memory manifest validation, duplicate prevention, lookup, listing, and V1-safe filtering exist under `src/hollows/`.
- Hollow Runner: local implementation invocation, safety gates, input bounds, timeout/failure normalization, and T0/unverified output exist under `src/hollows/`.
- Verified Return Path: structural checks, V1 safety checks, T1/T2 assignment, and EvidencePacket creation exist under `src/verification/`.
- JSONL Ledger: append-only local JSONL writer, reader, validation, and entry factories exist under `src/ledger/`.
- Auto Snapshot and Change Guard: snapshot creation, manifest validation, file hashing, rollback restore, guard command runner, change risk classification, and snapshot ID hardening exist under `src/changeGuard/`.
- Production Text Hollows: character count, prompt limit, section balance, and repetition scan exist under `src/hollows/categories/text/`.
- Production Validation Hollows: JSON schema subset validator and placeholder detector exist under `src/hollows/categories/validation/`.
- Production Provenance Hollows: file hash and ledger provenance inspection exist under `src/hollows/categories/provenance/`.
- Production Code Inspection Hollows: line count, import surface, export surface, and code safety scan exist under `src/hollows/categories/code/`.
- Report Builder: deterministic report object creation, Markdown rendering, JSON rendering, and explicit report writing exist under `src/reports/`.
- Minimal CLI: explicit help/info/list/inspect/run commands exist under `src/cli/`.
- V1 demo fixtures: static safe JSON fixtures exist under `examples/v1-demo/`.

## Production Hollow Catalog

| Hollow ID | Category | Purpose | Permission profile | V1-safe | Runner | T2 through Verified Return Path |
|---|---|---|---|---|---|---|
| `hollow.text.character_count` | text | Count characters, lines, words, and newlines. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.text.prompt_limit` | text | Check whether text fits a character limit. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.text.section_balance` | text | Inspect bracketed text sections and balance signals. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.text.repetition_scan` | text | Detect repeated deterministic word/phrase n-grams. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.validation.json_schema_validator` | validation | Validate a value against a V1 JSON Schema subset. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.validation.placeholder_detector` | validation | Detect placeholder/stub/fake-completion signals. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.provenance.file_hash` | provenance | Hash one explicit path-safe file inside a provided project root. | `read_only`, workspace-read boundary, no network/shell | yes | yes | yes |
| `hollow.provenance.ledger_provenance` | provenance | Inspect provided LedgerEntry-like records for consistency. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.code.line_count` | code | Count lines and newline structure in provided text. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.code.import_surface` | code | Inspect import-like statements in provided text. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.code.export_surface` | code | Inspect export-like declarations in provided text. | `none`, no file/network/shell | yes | yes | yes |
| `hollow.code.safety_scan` | code | Detect deterministic code safety signals in provided text. | `none`, no file/network/shell | yes | yes | yes |

## Trust and Verification Summary

Hollow Runner output starts as `trust_tier: "T0"` and `verification_status: "unverified"`. The Verified Return Path is the only V1 path that promotes valid deterministic Hollow output to `T2` evidence. The Ledger preserves supplied trust tiers but does not promote trust. The Report Builder reports supplied trust tiers but does not promote trust. The CLI exposes this verified path but does not decide trust outside the Verified Return Path.

## Ledger and Report Summary

The JSONL Ledger is local and append-only. CLI Ledger writing is explicit and opt-in through `--write-ledger`. CLI report writing is explicit and opt-in through `--write-report`. Tests use temporary directories for generated Ledger and report files. Reports summarize supplied records; they do not invent evidence, promote trust, or invent Ledger references.

## Change Guard Summary

Change Guard supports pre-change, post-change, emergency, and milestone snapshots for explicitly supplied files. Snapshot manifests are validated, captured files are hashed, rollback preview/restore is available, structured guard commands run without shell strings, and change risk classification is deterministic. Pass 07.5 hardened snapshot ID generation so IDs remain unique across manager instances and process restarts. Snapshot creation in this acceptance pass produced pre-change and post-change snapshots without modifying source files outside the captured snapshot artifacts.

## CLI Demo Summary

Manual demo commands verified in this pass:

```bash
npm run cli -- list-hollows --json
npm run cli -- inspect-hollow --id hollow.text.character_count --json
npm run cli -- run-hollow --id hollow.text.character_count --input-file examples/v1-demo/character-count-input.json --json
npm run cli -- run-hollow --id hollow.text.prompt_limit --input-file examples/v1-demo/prompt-limit-input.json --json --write-ledger --ledger-path .caleb/tmp/pass12-demo-ledger.jsonl --write-report --report-dir .caleb/tmp/pass12-reports
```

The CLI smoke path demonstrated that tests avoid real project `.caleb` writes, while the manual opt-in artifact command writes only to the controlled `.caleb/tmp` runtime area.

## Validation Results

| Command | Result | Notes |
|---|---|---|
| `npm run acceptance:v1` | passed | 2 acceptance test files, 14 tests passed. |
| `npm test` | passed | 44 test files, 475 tests passed on standalone final run. A parallel rerun with typecheck/build had one CLI smoke timeout, then passed when rerun alone. |
| `npm run typecheck` | passed | TypeScript completed with no errors. |
| `npm run build` | passed | TypeScript build completed with no errors. |
| `npm audit --audit-level=critical` | passed | `found 0 vulnerabilities`. |
| `npm run cli -- list-hollows --json` | passed | Returned 12 V1 Hollows. |
| `npm run cli -- inspect-hollow --id hollow.text.character_count --json` | passed | Returned the Character Count manifest. |
| `npm run cli -- run-hollow --id hollow.text.character_count --input-file examples/v1-demo/character-count-input.json --json` | passed | Invocation completed as T0/unverified; Verified Return Path accepted T2 evidence. |
| `npm run cli -- run-hollow --id hollow.text.prompt_limit --input-file examples/v1-demo/prompt-limit-input.json --json --write-ledger --ledger-path .caleb/tmp/pass12-demo-ledger.jsonl --write-report --report-dir .caleb/tmp/pass12-reports` | passed | Wrote two Ledger entries and Markdown/JSON report files by explicit opt-in. |

## Phase Boundary Confirmation

No runtime implementation was detected for Orchestration Core, Role Router, Role Rotation, Model API Layer, 3D Thinking Mode, Hollowcut Video Studio, shell command Hollows, network Hollows, media processing Hollows, database storage, or cloud storage.

The repository contains future-facing governance and planning documents for later phases. `src/types/thinkingEvent.ts` exists as a future UI telemetry contract only, not as a 3D UI runtime implementation.

## Known Issues

No blocking V1 known issues at acceptance time.

## V1 Acceptance Criteria

- [x] Governance docs present.
- [x] TypeScript foundation passes.
- [x] Core contracts exist.
- [x] Hollow Registry works.
- [x] Hollow Runner works.
- [x] Verified Return Path works.
- [x] Ledger works.
- [x] Change Guard works.
- [x] 12 production V1 Hollows exist.
- [x] Report Builder works.
- [x] CLI works.
- [x] CLI demo works.
- [x] Tests pass.
- [x] Typecheck passes.
- [x] Build passes.
- [x] No phase bleed detected.

## Recommended Next Steps

- Pass 13 — V1 Milestone Snapshot.
- Pass 14 — Hollowcut Video Studio Integration Plan.
- Later: Media Metadata Hollows.
- Later: Timeline Validation Hollows.
- Later: Orchestration Core.
- Later: Role Router and Role Rotation.
- Later: Model API Layer.
- Later: 3D Thinking Mode telemetry UI.

## Post-Acceptance Planning

Pass 13 records the accepted V1 foundation as a formal milestone and documents Hollowcut Video Studio as a future separate launched studio module. This planning work does not implement Hollowcut runtime code.

Pass 14 locks the Hollowcut planning boundary and adds an implementation readiness checklist. That lock remains documentation-only and does not authorize Hollowcut runtime code.

## Final Acceptance Statement

Caleb AI V1 MVP is accepted as a Hollow-first local deterministic foundation because all validation commands passed and no blocking known issues remained at acceptance time.
