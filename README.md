# Caleb AI

Caleb AI is a Hollow-first orchestration system.

Doctrine: **Models think. Hollows work. Caleb orchestrates.**

Models are consulted for reasoning; deterministic local Hollows do the work; the
Logic Engine owns dispatch. Nothing is trusted until the Verified Return Path
promotes it, and every action leaves ledger evidence.

## Current status

The V1 MVP foundation is accepted and locked (`docs/V1_MVP_ACCEPTANCE_REPORT.md`,
`docs/V1_MILESTONE_SNAPSHOT.md`). Pass-by-pass history lives in
[docs/STATUS_LOG.md](docs/STATUS_LOG.md) — status is never appended to this README.
The forward plan is [docs/CALEB_AI_ROADMAP_TO_LIVE_BOUNDARY.md](docs/CALEB_AI_ROADMAP_TO_LIVE_BOUNDARY.md).

What exists today, all local and deterministic:

- **Hollow Runner + protected V1 catalog** (exactly 12 Hollows: text, validation,
  provenance, code) with manifest-enforced permissions and V1 safety gates.
- **Verified Return Path (VRP)** — the only trust promoter. Runner output is always
  T0/unverified; VRP promotes clean deterministic results to T2 at most.
- **JSONL Ledger, Auto Snapshot + Change Guard, Basic Report Builder.**
- **Logic Engine V0 functional core** (accepted): TaskFrame → Signals → Route →
  WorkGraph → gated dispatch → VRP → Ledger, with telemetry traces.
- **Media Hollow catalog** (read-only, provided-metadata-only) and a separate
  **Hollowcut catalog** (9 Hollows) for supplied-state project/timeline validation,
  including `export_readiness_check` — structural readiness only; no export, no
  render, no media file inspection.
- **Role Artifact Contract Layer, runtime storage contracts, and model-boundary
  contracts/stubs** — planning and no-network scaffolding for the future live
  adapter. No model API call exists anywhere in this repository.

## What V1 is not

Orchestration with live models, Role Rotation, the Model API Layer, Hollowcut
runtime/UI, real media probing, FFmpeg/export, cloud deployment, and 3D UI /
Thinking Mode are future phases. Boundary docs: `docs/02_V1_PHASE_BOUNDARIES.md`,
`docs/HOLLOWCUT_BOUNDARY_LOCK.md`, `docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md`.

## Validation

```bash
npm test
npm run typecheck
npm run build
```

## CLI

The CLI exposes explicit local commands only. It does not plan tasks, call models,
or run hidden workflows. Side effects (`--write-ledger`, `--write-report`) are opt-in.

```bash
npm run cli -- help
npm run cli -- list-hollows --json
npm run cli -- run-hollow --id hollow.text.character_count --input-json "{\"text\":\"hello\"}"

# Media catalog (inspection-only)
npm run cli -- list-media-hollows --json
npm run cli -- run-media-hollow --id hollow.media.aspect_ratio --input-json "{\"width\":1920,\"height\":1080,\"expected_ratio\":\"16:9\"}" --json

# Hollowcut catalog (supplied-state validation only)
npm run cli -- list-hollowcut-hollows --json
npm run cli -- run-hollowcut-hollow --id hollow.hollowcut.export_readiness_check --input-file <state.json> --json

# Hollowcut project inspection
npm run cli -- inspect-hollowcut-project --input-file <project.json> --json
```

Demos: `docs/V1_CLI_DEMO.md`, `docs/MEDIA_CLI_DEMO.md`, `docs/HOLLOWCUT_PROJECT_CLI_DEMO.md`.

## Key documentation

- Governance and doctrine: `CODEX.md`, `docs/00_SOURCE_INDEX_AND_AUTHORITY.md`,
  `docs/01_CODEX_OPERATING_CONTRACT.md`, `docs/03_CANONICAL_CONTRACTS.md`
- Logic Engine: `docs/CALEB_LOGIC_ENGINE_CONTRACT.md`,
  `docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md`
- Trust and safety: `docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md`,
  `docs/AUTO_SNAPSHOT_AND_CHANGE_GUARD.md`, `docs/MEDIA_METADATA_SAFETY_POLICY.md`
- Hollowcut planning: `docs/HOLLOWCUT_VIDEO_STUDIO_INTEGRATION_PLAN.md`,
  `docs/HOLLOWCUT_CALEB_BOUNDARY.md`,
  `docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md`
- Live adapter (future): `docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md`,
  `docs/ONE_PROVIDER_ADAPTER_EXPLICIT_OPT_IN_PLANNING.md`
