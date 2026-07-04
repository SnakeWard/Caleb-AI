# Codex Operating Contract

## Mission

Build Caleb AI according to the existing Caleb AI doctrine and source documents. Caleb AI is a Hollow-first orchestration system where Models think, Hollows work, and Caleb orchestrates.

## Codex Role

Codex is the implementation pen, not the architect. Codex implements the plan; it does not redefine Caleb AI.

Codex MUST preserve these terms: Caleb AI, Orchestration Core, Model API Layer, Hollow Server Layer, Hollow, Hollow Server Agent, Communication Bus, Verified Return Path, Ledger, Forge, Role Router, Role Rotation, Planner, Analyst, Critic, Synthesizer, Deterministic Core, Adaptive Layer, Auto Snapshot and Change Guard, and 3D UI / Thinking Mode.

## Non-Negotiable Rules

- Codex MUST NOT collapse Hollows into generic tools.
- Codex MUST NOT let models directly execute arbitrary local actions.
- Codex MUST NOT skip schemas.
- Codex MUST NOT skip Ledger entries.
- Codex MUST NOT treat raw Hollow output as trusted.
- Codex MUST NOT add Role Rotation before the Hollow Server foundation works.
- Codex MUST NOT overbuild V1.
- Codex MUST NOT introduce cloud dependencies into the local Deterministic Core unless explicitly authorized.
- Codex MUST NOT create placeholder modules that pretend to work.
- Every implementation pass MUST compile and test before continuing once code exists.
- Codex SHOULD prefer small targeted patches over broad rewrites.
- Codex MUST preserve existing working logic.

## Current Authorized Phase

The current authorized phase is a documentation and governance pass only.

Codex MUST create repository-level governance, source-of-truth, operating, phase-boundary, contract, storage, permission, and test-planning markdown files. Codex MUST NOT implement application code in this pass.

## What Codex May Do

- Create or update the requested root markdown files.
- Create or update the requested `docs/` markdown files.
- Create `docs/` if missing.
- Copy source documents into `docs/` when needed while leaving originals untouched.
- Inspect the repository tree and source document locations.
- Report a diff summary if git is available.

## What Codex Must Not Do

- MUST NOT install packages.
- MUST NOT add dependencies.
- MUST NOT build the Hollow Server yet.
- MUST NOT build the Model API Layer yet.
- MUST NOT build Role Rotation yet.
- MUST NOT build the 3D UI yet.
- MUST NOT build snapshots yet.
- MUST NOT modify existing source code unless needed only to add documentation references.
- MUST NOT create TypeScript source files unless absolutely necessary to preserve an existing repo convention.

## Snapshot and Rollback Expectations

Before Auto Snapshot and Change Guard exists, Codex MUST use git or manual snapshot discipline. After the Change Guard exists, Codex MUST create a snapshot before mutation and record snapshot actions in the Ledger.

Rollback plans MUST be explicit for implementation passes that touch multiple files, schemas, storage, permissions, or user data.

## Testing Expectations

Once code exists, every implementation pass MUST run available validation commands before claiming completion:

- `npm test`
- `npm run typecheck`
- `npm run build`

If scripts do not exist yet, Codex MUST report that validation was not available and SHOULD recommend adding scripts in Pass 00.

## Reporting Expectations

Codex completion reports MUST include:

- summary
- files created
- files changed
- files intentionally not changed
- validation run
- known issues
- recommended next pass

## Stop Conditions

Codex MUST stop when the authorized pass is complete. Codex MUST stop and ask for instruction if the task requires future-phase work, undefined architecture changes, missing authorization for side effects, or replacing Caleb AI doctrine with a different system.
