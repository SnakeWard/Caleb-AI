# RA-C Role Artifact Consumption Boundary Contract

Status: Accepted - design contract
Date: 2026-07-05
Protocol: `docs/protocols/PASS_PROTOCOL_L1A_RAC.md`
Pre-change snapshot: `snap_20260705T215233125Z_000342_milestone` (verified on disk before recording)

## Purpose

RA-C defines how future Planner, Analyst, Critic, and Synthesizer artifacts are stored, validated, consumed, referenced in lineage, and prevented from becoming route authority.

Role artifacts are model outputs.

Role artifacts may enter Caleb.

Role artifacts may not steer Caleb.

This contract is design-only. It does not implement role rotation runtime, Role Router behavior, route changes, L1 allowlist changes, UI/display, providers, egress, side effects, storage code, validators, or trust promotion.

## No-Silence Answer Table

| Required question | Status | Home section |
| --- | --- | --- |
| 1. Identity and tiering | Answered | Section 1 |
| 2. Reconciliation with pre-M3 role contract layer | Answered with one named open item | Section 2 |
| 3. Consumption flows | Answered | Section 3 |
| 4. Extraction question | Answered with named home pass | Section 4 |
| 5. Lineage | Answered | Section 5 |
| 6. Cross-model provenance | Answered | Section 6 |
| 7. What this contract does not authorize | Answered | Section 7 |

Named open item:

- `RA-REGISTRY-ANALYST`: the accepted static role registry currently has `planner`, `implementer`, `verifier`, `critic`, `synthesizer`, `reporter`, `recovery`, and `human_operator`, but not `analyst`. A future Pat-approved role-registry amendment or RA implementation protocol must add `analyst` before any Analyst runtime or Analyst artifact emission is claimed.

## 1. Identity and Tiering

A role artifact is a model output.

Raw role artifact content enters at T0.

If the artifact validates against its role contract through `validateRoleArtifact`, it may become schema-valid T1 only.

Role artifact content is permanently capped at T1. It cannot become T2, T3, or T4 by itself.

Role identity does not promote trust. A Critic artifact, Planner artifact, Analyst artifact, or Synthesizer artifact is T1 prose after schema validation. A Critic verdict is not higher-trust because it came from the Critic role.

Formal non-promoters:

- role identity
- role name
- role order
- role confidence
- model confidence
- provider identity
- model identity
- agreement between roles
- artifact storage
- digest presence
- Ledger reference
- report inclusion
- display inclusion
- handoff-gate acceptance
- role contract validation beyond T1

Only deterministic Hollow/VRP evidence, policy-approved gates, human/Pat approval, or future explicitly approved decision-facing records may raise route-relevant trust according to their own contracts.

## 2. Reconciliation With The Pre-M3 Role Contract Layer

The accepted R1-R6 role artifact contract layer remains the static role artifact foundation.

Current accepted pieces:

- `src/roles/types/roleArtifact.ts`
- `src/roles/roleArtifactValidator.ts`
- `src/roles/roleContractRegistry.ts`
- `src/roles/roleHandoffGate.ts`
- role artifact reference bundle contracts
- role artifact bundle consistency report contracts
- `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`
- `docs/ROLE_ARTIFACT_CONTRACT_LAYER_ACCEPTANCE_REPORT.md`

Post-M3 composition rule:

- `validateRoleArtifact` schema validation confers the same trust class as M3 schema-valid provider/model output: T1 maximum.
- The role contract registry defines permitted static shapes and allowed handoff targets; it does not authorize runtime execution.
- The role handoff gate validates contract handoff eligibility; it does not route Caleb, execute a handoff, promote trust, trigger side effects, or persist truth.
- Role artifact validation and role handoff validation are consumption gates, not steering authority.

Storage doctrine:

- Future role artifact raw content should use the M3 `.caleb/artifacts/` content-addressed store.
- The Ledger should carry digests, artifact refs, trust state, role/provider/model provenance, and lineage refs, not raw role content.
- One storage doctrine beats two: role artifacts are model outputs, so they inherit M3 content-addressed storage, digest verification, redaction, deletion/dangling-reference semantics, and raw-content absence from the Ledger.
- A parallel role-artifact storage path is not authorized by RA-C. If a future pass argues for one, it must explain why two storage doctrines are safer than one and must preserve M3 trust, deletion, lineage, and redaction guarantees.

Post-M3/L1 handoff vocabulary:

- `allowed` from `validateRoleHandoffGate` means "contract handoff candidate accepted for consumption as context."
- `allowed` does not mean "route Caleb."
- `blocked` means the contract can be understood but policy-like handoff rules block consumption.
- `invalid` means the candidate is structurally unfit for handoff evaluation.
- Handoff-gate acceptance may feed a future role invocation as context only; it is not a Logic Engine route input.

Open item:

- `RA-REGISTRY-ANALYST`: add or map the Analyst role before any role runtime claims Planner -> Analyst -> Critic -> Synthesizer rotation. RA-C does not alter `src/roles`.

## 3. Consumption Flows

Allowed flows for T1 role artifacts:

- Context for a subsequent role model invocation.
- Example: Critic may read a Planner plan as context.
- Context references for role handoff gate evaluation.
- Hollow input payloads under the M3 taint rule, where deterministic measurement can be T2, model/role subject remains T1, and effective tier remains the minimum.
- Human display, deferred to `M4-DISPLAY-BOUNDARY`.
- Lineage records through `derived_from`.
- Digest/ref-only Ledger provenance.

Never flows for T1 role artifacts:

- Logic Engine route inputs.
- Side-effect triggers.
- Trust-promotion inputs.
- Persistence as truth.
- Route-mode selection.
- Snapshot/approval gate bypass.
- L1 allowlist expansion.
- Release/final truth authority.

L1-A is the steering lock. Role artifact prose is already locked as non-route-authority by the L1-A lock and must remain rejected at the Logic Engine gate.

## 4. Extraction Question

Rotation eventually needs structured decisions derived from role artifacts, such as "Critic found defects: true."

A model-emitted or role-emitted field such as `defects_found: true` is still T1 role prose. It cannot route Caleb, trigger loopback, promote trust, persist as truth, or change route state.

Legal path:

1. Store the role artifact as T0 raw content and T1 schema-valid content.
2. Reference it by digest and lineage.
3. Run a deterministic extraction/validation step, preferably a Hollow or equivalent deterministic boundary, over the referenced content.
4. Produce deterministic evidence with provenance and tier split.
5. Project that evidence into a decision-facing record exposing `effective_tier` only.
6. Add that decision-facing record type to the L1 allowlist only through a future protocol-governed pass that visibly amends `tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts`.
7. Only then may the decision-facing record become route-relevant.

Illegal shortcuts:

- Critic prose routes Caleb.
- Critic `confidence` routes Caleb.
- Critic role identity routes Caleb.
- Provider/model identity routes Caleb.
- A JSON boolean emitted by a role routes Caleb.
- Report/display text routes Caleb.
- Digest or storage presence routes Caleb.
- Handoff-gate acceptance routes Caleb.
- L1 allowlist changes hidden inside a role runtime pass.

Named home pass:

- `RA-X-DETERMINISTIC-EXTRACTION`: future extraction-boundary design for role-artifact-derived decisions. It must define extractor/Hollow behavior, evidence records, lineage, effective-tier projection, and the protocol-governed L1-A lock amendment. RA-C sketches the path but does not add a record type now.

## 5. Lineage

Every future role artifact must carry lineage sufficient to reconstruct a rotation chain from the Ledger alone.

Required lineage references:

- role invocation ledger entry
- prompt/input reference
- model/provider invocation reference when applicable
- prior role artifact refs consumed as context
- Hollow evidence refs consumed as context
- human approval refs when applicable
- content-addressed artifact digest/ref
- deletion record if raw content has been deleted

Lineage rules:

- `derived_from` must use post-H4 UUID-style Ledger IDs.
- Counter-era ledger IDs are barred from new lineage use.
- All lineage refs must resolve through the M3 lineage-resolution gate.
- Deletion removes content, never provenance.
- A deleted artifact becomes a dangling content reference with preserved provenance; it is not erased from history.
- A broken lineage link blocks role artifact consumption in future RA implementation tests.

Rotation reconstruction requirement:

Planner -> Analyst -> Critic -> Synthesizer must be reconstructable from digest refs, role artifact refs, handoff refs, invocation refs, and lineage refs without reading raw content from the Ledger.

## 6. Cross-Model Provenance

Role rotation may span providers and models.

Each role artifact record must carry provider/model identity as provenance when a model produced the artifact:

- provider_id
- model_id
- adapter_id when applicable
- invocation ledger ref
- timestamp
- role_id
- role_version or contract version

Provider/model identity explains origin. It never authorizes routing, trust promotion, side effects, persistence as truth, or L1 allowlist membership.

Cross-model disagreement remains advisory until deterministic verification or approved human/Pat action resolves it.

## 7. What RA-C Does Not Authorize

RA-C does not authorize:

- role rotation runtime
- Role Router
- Planner runtime
- Analyst runtime
- Critic runtime
- Synthesizer runtime
- routing by model judgment
- routing by role judgment
- new L1 allowlist record types
- L1 route-input gate changes
- role-artifact-derived loopback
- side effects
- UI/display
- provider adapters
- egress expansion
- package changes
- catalog changes
- production auth
- model/provider trust promotion
- persistence as truth

The role runtime gets its own protocol after RA-C is accepted.

## Worked Example

Scenario: two-role Planner -> Critic exchange.

1. Planner invocation is recorded in the Ledger.
2. Planner emits a plan artifact.
3. The raw Planner artifact enters at T0.
4. `validateRoleArtifact` validates schema and contract shape.
5. The Planner artifact becomes schema-valid T1 only.
6. Raw Planner artifact content is stored in the M3 `.caleb/artifacts/` content-addressed store.
7. Ledger entry records digest/ref, role identity, provider/model provenance, and lineage, not raw artifact prose.
8. Critic consumes the Planner artifact as context through a role invocation context ref.
9. Critic emits a critique artifact.
10. The raw Critic artifact enters at T0.
11. `validateRoleArtifact` validates schema and contract shape.
12. The Critic artifact becomes schema-valid T1 only.
13. Critic artifact content is digest-stored and lineage-linked to the Planner artifact and Critic invocation.
14. Critic artifact says: `defects_found: true`.
15. That claim is role prose. It is blocked at the L1 gate as route authority.
16. Legal path beside the block: a future deterministic extractor/Hollow reads the referenced Critic artifact, emits deterministic evidence, computes effective tier, and a future protocol-governed L1-A amendment adds a specific decision-facing record type if Pat approves.

Result:

- Planner context flow is legal.
- Critic context flow is legal.
- Critic prose route flow is illegal.
- Deterministic extraction path is sketched but not implemented.

## RA Implementation Acceptance Obligations

Future RA implementation must include tests for:

- role artifact raw content starts T0
- role artifact schema validation reaches T1 maximum
- role identity does not promote trust
- provider/model identity does not promote trust
- role confidence does not promote trust
- role artifact content is stored through M3 content-addressed storage or a separately approved equivalent
- raw role artifact content is absent from Ledger
- role artifact digest/ref resolves
- role artifact deletion preserves provenance and creates dangling content semantics
- role artifact lineage refs use post-H4 IDs
- broken lineage link is caught
- Planner -> Critic context consumption is allowed
- role artifact presented as Logic Engine route input is rejected by L1
- synthetic `defects_found: true` role field cannot route Caleb
- handoff-gate `allowed` cannot route Caleb
- report/display text cannot route Caleb
- deterministic extraction is required before role-artifact-derived decisions can become route-relevant
- L1-A lock must be visibly amended before any new decision-facing record type is route-relevant

Required detectors:

- synthetic role artifact presented as route input caught
- synthetic role identity trust-promotion attempt caught
- rotation chain with a broken lineage link caught

## Final Verdict

Role Artifact Consumption Boundary Contract: Accepted - role artifacts are model outputs, tiered and gated as such; the rotation runtime is unblocked for protocolization and bound to this contract.
