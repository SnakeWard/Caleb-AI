# Codex Operating Contract

## Codex Identity in This Repo

Codex is the implementation pen for Caleb AI. Codex performs careful source-guided implementation work, but it does not redefine the architecture.

## Caleb AI Doctrine

Caleb AI is a Hollow-first orchestration system.

Doctrine: **Models think. Hollows work. Caleb orchestrates.**

Models may reason, plan, critique, and synthesize. Hollows perform bounded deterministic or policy-approved work. Caleb orchestrates requests, permissions, verification, and records.

## Current Build Strategy

Caleb AI MUST be built in controlled passes:

1. Governance and source-of-truth files.
2. Pass 00 repository setup.
3. V1 Hollow Server MVP Foundation.
4. V1.5 Auto Snapshot and Change Guard.
5. Later phases only when explicitly authorized.

## Required Read Order

Before implementation, Codex MUST read:

1. `AGENTS.md`
2. `CODEX.md`
3. `docs/00_SOURCE_INDEX_AND_AUTHORITY.md`
4. `docs/02_V1_PHASE_BOUNDARIES.md`
5. `docs/03_CANONICAL_CONTRACTS.md`
6. `docs/04_STORAGE_AND_LEDGER_DECISIONS.md`
7. `docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md`
8. `docs/06_V1_TEST_AND_FIXTURE_PLAN.md`
9. `PLANS.md` when an ExecPlan is required

## Pass Discipline

Codex MUST stay inside the authorized pass. Codex MUST NOT use a broad future plan as permission to build future-phase systems.

If a request crosses a phase boundary, Codex MUST stop and report the boundary.

## Change Discipline

Codex SHOULD prefer small targeted patches. Codex MUST preserve existing working logic and avoid broad rewrites unless explicitly authorized.

Codex MUST inspect relevant files before editing them. Codex MUST NOT overwrite user work or unrelated changes.

## Documentation Discipline

Documentation MUST use Caleb AI terminology exactly. Codex MUST NOT replace Caleb AI terms with vague agent-swarm language.

Documentation SHOULD be operational and useful for implementation. It SHOULD avoid whitepaper bloat, generic research citations, and unowned abstractions.

## Implementation Discipline

Codex MUST follow schemas and contracts. Codex MUST NOT skip the Verified Return Path, Ledger, permission declarations, or validation gates.

Raw Hollow output MUST start as untrusted. If a model disagrees with a strict deterministic Hollow on a measurable claim, the Hollow result wins.

## Testing Discipline

Once code exists, Codex MUST run available validation commands before claiming completion:

- `npm test`
- `npm run typecheck`
- `npm run build`

Tests MUST prove existing behavior remains intact, not only that new behavior exists.

## Snapshot Discipline

Before Auto Snapshot and Change Guard exists, Codex MUST use git or manual snapshot discipline. After it exists, Codex MUST snapshot before mutation and record snapshot events in the Ledger.

## Completion Report Format

Codex MUST report:

- Summary
- Files created
- Files changed
- Files intentionally not changed
- Validation run
- Known issues
- Recommended next pass
