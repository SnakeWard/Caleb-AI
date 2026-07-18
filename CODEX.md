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

The current authorized work is the combined GOV-1 + LE-2 pass in
`docs/protocols/PASS_PROTOCOL_GOV1_LE2.md`.

GOV-1 is limited to governance and handoff reconciliation. LE-2 is limited to a
non-executing, deterministic RA-R2-to-RA-R1 bridge that derives an executable-plan
artifact or refuses fail-closed. LE-2 does not authorize Role Rotation execution,
provider invocation, side effects, role/registry changes, route-input widening, or
UI work. Any deviation from the protocol's pre-approved decision envelope requires
a stop and report.

## What Codex May Do

- Perform the GOV-1 reconciliation work named in the committed combined protocol.
- Create or update the exact governance, protocol, report, source, test, example,
  and barrel-export files authorized for LE-2.
- Run the required snapshots, audits, tests, typecheck, build, Git commits, and
  pushes for those two stages.
- Inspect the repository tree and source document locations.

## What Codex Must Not Do

- MUST NOT install packages or add dependencies.
- MUST NOT execute Role Rotation or wire the bridge into routing.
- MUST NOT invoke providers or add network paths.
- MUST NOT modify the L1 allowlist, role/handoff registries, RA-R1 executor,
  provider modules, H5 traps, M3 boundary, package files, or catalog manifests.
- MUST NOT build the 3D UI, cloud deployment, production auth, or side-effecting
  runtime behavior.

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
