# Caleb AI - Pass Protocols L1-A and RA-C

Prepared by: Claude Fable 5 (reviewer/planner), for execution by Codex (implementer)

Convention: commit this file to `docs/protocols/PASS_PROTOCOL_L1A_RAC.md` before or with the L1-A work. Handoff rule applies: first action is `git status --short`; if the tree is not clean and the work is not yours, stop and report to Pat.

Sequencing: L1-A then RA-C. Role artifact runtime implementation may not begin until both are accepted and Pat has approved the RA implementation protocol separately. Nothing herein authorizes role rotation runtime, routing changes, UI/display, new adapters, side effects, or trust promotion.

## Pass L1-A - Route-Input Boundary Acceptance Lock

### 1. Pass name

L1-A - Logic Engine Route-Input Boundary Acceptance Lock

### 2. Purpose

Convert the L1 route-input hardening from implemented-and-tested into a protected acceptance surface, following the M3-A precedent: a dedicated acceptance report plus a lock test that future passes must visibly break to weaken.

### 3. Accepted prior pass summary

L1 accepted at commit `014bec4`: allowlist-based fail-closed route-input gate, `selectRouteFromRouteInputs` hardened entrypoint, and detectors proving rejection of synthetic T1 provider/model input, raw model output, `measurement_tier`, `subject_tier`, display/report text, unknown record types, digest/storage/provider identity, model confidence, and role artifact prose. Suite: 166 files / 2,928 tests. Catalogs: 12/9. Tree clean.

### 4. Core rules

- No runtime behavior changes. This pass creates a report and a lock test only.
- If the lock test reveals a gap in L1 coverage, stop, report the gap to Pat, and await direction. Do not silently patch L1 inside a lock pass.
- The lock test must assert the continued presence and shape of the boundary's core claims.
- The lock must pin the route-input allowlist contents as of L1 acceptance, enumerated verbatim.
- The lock must pin the fail-closed default: unknown record types are rejected.
- The lock must prove every L1 detector listed in section 3 through the gate public surface.
- The lock must pin `selectRouteFromRouteInputs` as the sole hardened entrypoint.
- The lock must demonstrate that it fires against a synthetic weakening fixture.
- Absence assertions: no role rotation, no routing behavior change, no new record types added to the allowlist in this pass.

### 5. Files to create

- `docs/L1_ROUTE_INPUT_BOUNDARY_ACCEPTANCE_REPORT.md`
- `tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts`

### 6. Files to modify

- `docs/STATUS_LOG.md`
- `PLANS.md`

### 7. Main doc requirements

The acceptance report must state what is locked, the verbatim allowlist, the entrypoint uniqueness claim, the lock-fires evidence, and the standing rule that allowlist growth requires a protocol-governed pass amending the lock test in a visible diff.

### 8. Acceptance test requirements

- Lock test green on current tree.
- Lock-fires demonstration recorded in the report.
- Full suite green under H5 traps, counts recorded.
- Catalogs: V1 = 12, Hollowcut = 9.

### 9. Validation commands

Pre-change snapshot `l1a_route_input_lock_prechange`, verified on disk before recording. Then:

```text
npx tsc --noEmit
npx vitest run tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts
npm run build
npx vitest run
npm run --silent cli -- list-hollows --json
npm run --silent cli -- list-hollowcut-hollows --json
```

Commit with pass ID and clean tree.

### 10. Final report format

House style. Mandatory lines: the verbatim allowlist as locked; the lock-fires evidence reference.

Verdict: `L1-A Route-Input Boundary Acceptance Lock: Accepted - steering boundary locked; allowlist growth now requires a visible protocol-governed diff.`

## Pass RA-C - Role Artifact Consumption Boundary Contract

### 1. Pass name

RA-C - Role Artifact Consumption Boundary Contract

### 2. Purpose

Define, before any role runtime exists, the contract governing how Planner, Analyst, Critic, and Synthesizer artifacts are stored, validated, consumed, referenced in lineage, and prevented from becoming route authority.

Role artifacts are model outputs. They receive M3-style trust handling: T0 raw to at most T1 schema-valid, capped. They hit the L1 gate as non-route-authority prose.

### 3. Accepted prior pass summary

L1-A accepted: steering boundary locked, allowlist pinned, entrypoint uniqueness asserted. M3 chain accepted and locked: raw-output consumption boundary with mandatory tier triplet, effective-tier-only decisions, content-addressed storage, lineage-resolution gate, and display deferred to M4-DISPLAY-BOUNDARY. Existing substrate to reconcile: role artifact contract layer from the R1-R6 era, including role artifact validation, role contract registry, and role handoff gate.

### 4. Core rules

- Design only. One contract document plus `docs/STATUS_LOG.md` and `PLANS.md` entries.
- No `src/`, no `tests/`, no `types/`.
- The contract must answer seven questions explicitly, each answered or deferred as a named open item with a home pass:
  1. Identity and tiering.
  2. Reconciliation with the pre-M3 role contract layer.
  3. Consumption flows.
  4. Extraction question.
  5. Lineage.
  6. Cross-model provenance.
  7. What this contract does not authorize.
- Worked example required: Planner invocation ledgered, Planner artifact T1, digest-stored, lineage-linked, Critic consumes as context, Critic artifact T1, hypothetical defects decision blocked at L1 as prose, legal deterministic extraction path sketched beside it.
- The contract closes with RA implementation acceptance-test obligations, including detectors for synthetic role artifact route input, role identity trust promotion attempt, and broken lineage link.

### 5. Files to create

- `docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md`

### 6. Files to modify

- `docs/STATUS_LOG.md`
- `PLANS.md`

### 7. Main doc requirements

As specified in the core rules, including the worked example and the seven answers with the no-silence rule applied in the completion report.

### 8. Acceptance test requirements

None executable. Accepted on document completeness against the seven questions, worked example, and imposed obligations.

### 9. Validation commands

Pre-change snapshot `rac_role_artifact_boundary_contract_prechange`, verified on disk. Full suite untouched. Commit with pass ID and clean tree.

### 10. Final report format

House style with per-question answered/deferred table.

Verdict: `Role Artifact Consumption Boundary Contract: Accepted - role artifacts are model outputs, tiered and gated as such; the rotation runtime is unblocked for protocolization and bound to this contract.`

## Standing Rules

Snapshot before mutation, verified on disk before recording the ID. Diagnostic before implementation where a pass has implementation. No fabricated references. Honest deviation reporting is mandatory. Absence assertions accompany every boundary. Commit per pass with pass ID and verify clean tree. Catalogs 12/9 asserted every pass. Suite runs under permanent H5 traps. Provider output and role artifacts cap at T1. After RA-C, the RA implementation protocol is drafted for Pat approval; it is not authorized by this document.
