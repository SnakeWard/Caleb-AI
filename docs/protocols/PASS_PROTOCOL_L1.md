# Caleb AI - Pass Protocol L1

## 1. Pass name

L1 — Logic Engine Route-Input Hardening Protocol

## 2. Purpose

L1 hardens the Logic Engine route-input surface so only approved decision-facing records may move Caleb's state machine.

Core doctrine:

Model output may enter Caleb.

Model output may not steer Caleb.

L1 is an allowlist-based route-input hardening pass. It is not a denial-list cleanup, not a model-routing feature, and not a role-rotation pass.

## 3. Prior summary

M3 accepted the raw output consumption boundary. Model/provider output may become a Caleb artifact and may be consumed through approved boundaries, but it remains capped at T1 and cannot govern routing, side effects, trust promotion, or persistence as truth.

M3-A locked M3 acceptance evidence. M3-B manually verified the M3/M3-A lock, including the golden path, structural tier split, NEVER-flow absence checks, display deferral, and artifact-store substrate.

L1 follows directly from M3/M3-A/M3-B: Caleb now has a model-output consumption boundary, so the Logic Engine route-input surface must be hardened to ensure only approved decision-facing records can move routing/state transitions.

## 4. Core rules

- L1 must be allowlist-based, not denylist-based.
- Logic Engine route/state movement must reject unregistered record types by construction.
- Model output may enter Caleb through M3-approved consumption boundaries.
- Model output may not steer Caleb.
- Provider/model output remains capped at T1.
- `measurement_tier` and `subject_tier` are provenance-only fields and must not be route inputs.
- Only decision-facing records exposing `effective_tier` may be considered for route input, and only if their record type is explicitly allowlisted.
- Digest presence, storage presence, provider identity, model confidence, report inclusion, display text, and provenance metadata do not grant route authority.
- No new provider adapter, provider egress call site, egress allowlist expansion, or SDK dependency is authorized by L1.
- H5 network traps and credential-read traps must remain intact.
- V1 Hollow catalog count must remain exactly 12.
- Hollowcut catalog count must remain exactly 9.

The L1 route-input gate may accept only these categories:

- contract-validated TaskFrames
- engine-internal state
- deterministic Hollow signals at approved effective tiers
- accepted gate/policy results
- human/Pat approval records
- snapshot/change-guard states
- lineage-resolved decision-facing records exposing `effective_tier` only

Everything outside the allowlist is rejected by construction, including:

- raw model output
- T1 provider/model output
- role artifact prose
- display summaries
- report text
- provider identity
- model confidence
- digest presence
- storage presence
- `measurement_tier`
- `subject_tier`
- any provenance-only field
- any unregistered record type

The implementation must distinguish:

- data Caleb may store or display
- evidence Caleb may report
- records Caleb may consume
- records Caleb may use to move state

Only the last category is in L1 scope.

## 5. Files to create

The L1 diagnostic must propose the final implementation file list before implementation. Expected implementation artifacts may include:

- Logic Engine route-input gate types
- an allowlist registry or closed discriminated union for route-input records
- route-input validator/gate implementation
- focused unit tests for accepted allowlist inputs and rejected non-authority inputs
- acceptance test locking route-input hardening
- L1 implementation documentation

No file creation is authorized until the L1 diagnostic is complete and Pat approves the implementation plan.

## 6. Files to modify

The L1 diagnostic must propose the exact modification list before implementation.

Likely implementation modifications may include:

- Logic Engine route-input validation or route event builder files
- Logic Engine type exports if needed
- acceptance boundary locks if they enumerate Logic Engine files
- `PLANS.md`
- `docs/STATUS_LOG.md`

L1 must not modify:

- provider adapters
- provider types
- egress allowlists
- package files or lockfiles
- V1 Hollow catalog registration
- Hollowcut catalog registration
- M3 raw-output runtime behavior
- historical Ledger content
- UI files
- role-rotation runtime

## 7. Documentation requirements

L1 implementation documentation must state:

- L1 implements Logic Engine route-input hardening.
- L1 is allowlist-based, not denylist-based.
- Model output may enter Caleb but may not steer Caleb.
- The route-input allowlist is the only source of route/state authority.
- Raw model output and T1 provider/model output are never route inputs.
- `measurement_tier` and `subject_tier` are provenance-only and never route inputs.
- Decision-facing records may expose `effective_tier` only.
- Digest presence, storage presence, provider identity, model confidence, report text, display summaries, and provenance-only metadata do not grant route authority.
- Unknown/unregistered record types are rejected by construction.
- L1 does not implement role rotation, new providers, egress expansion, UI, or provider/model trust promotion.
- V1 Hollow catalog remains exactly 12.
- Hollowcut catalog remains exactly 9.

## 8. Acceptance requirements

L1 must include acceptance coverage for allowed route inputs:

1. Contract-validated TaskFrame acceptance
2. Engine-internal state acceptance
3. Deterministic Hollow signal acceptance at approved effective tiers
4. Accepted gate/policy result acceptance
5. Human/Pat approval record acceptance
6. Snapshot/change-guard state acceptance
7. Lineage-resolved decision-facing record acceptance exposing `effective_tier` only

L1 must include rejection/detector coverage for non-authority inputs:

1. Synthetic T1 model/provider record presented as a Logic Engine route input is rejected.
2. `measurement_tier` presented as a route input is rejected.
3. `subject_tier` presented as a route input is rejected.
4. Display/report text presented as a route input is rejected.
5. Unknown record type presented as a route input is rejected.
6. Digest presence used as route authority is rejected.
7. Storage presence used as route authority is rejected.
8. Provider identity used as route authority is rejected.
9. Model confidence used as route authority is rejected.
10. Role artifact prose used as route authority is rejected.
11. Any provenance-only field used as route authority is rejected.

Mandatory detector:

- A synthetic T1 model/provider record presented as a Logic Engine route input must be rejected.

Routing-input absence is mandatory and must be explicitly tested.

L1 must also prove:

- the route-input gate is allowlist-based
- unregistered record types are rejected by construction
- decision-facing records expose `effective_tier` only
- `measurement_tier` and `subject_tier` cannot move routing/state transitions
- H5 network traps remain preserved
- V1 Hollow catalog remains exactly 12
- Hollowcut catalog remains exactly 9
- existing suite remains green

## 9. Validation commands

Use the repo's actual scripts from `package.json` and existing docs.

Minimum expected for L1 implementation:

```text
git status --short
npx tsc --noEmit
npm run build
npx vitest run
npm run --silent cli -- list-hollows --json
npm run --silent cli -- list-hollowcut-hollows --json
```

L1 implementation must also run focused tests for:

- route-input allowlist acceptance
- T1 model/provider route-input rejection
- `measurement_tier` route-input rejection
- `subject_tier` route-input rejection
- display/report text route-input rejection
- unknown record type route-input rejection
- digest/storage/provider identity route-authority rejection

For this docs-only protocol pass, run validation appropriate to the docs-only scope and report exactly what was run. Do not claim unrun validation.

## 10. Report format

Completion report for L1 implementation must include:

- Pass name and verdict
- Allowlist implemented: yes/no
- Allowed route-input categories implemented
- Rejected non-authority categories implemented
- Synthetic T1 provider/model route-input detector result
- `measurement_tier` route-input detector result
- `subject_tier` route-input detector result
- Display/report route-input detector result
- Unknown record type detector result
- Digest/storage/provider identity route-authority detector result
- Role artifact prose route-authority detector result
- H5 trap preservation result
- V1 Hollow catalog count
- Hollowcut catalog count
- Existing suite result
- Files created
- Files modified
- Files intentionally not changed
- Snapshot ID verified on disk before mutation
- Final clean-tree status
- Ready for next pass: yes/no

Completion report for this L1 protocol-draft pass must include:

- Protocol drafted at `docs/protocols/PASS_PROTOCOL_L1.md`
- No L1 diagnostic performed
- No L1 implementation performed
- No `src`/`tests`/`types`/provider/egress/package/catalog/historical-Ledger changes
- Snapshot verified on disk before recording
- Files created
- Files modified
- Validation results
- V1 catalog count
- Hollowcut catalog count
- Final clean-tree status
- Ready for Pat approval: yes/no

Stop condition: after committing `docs/protocols/PASS_PROTOCOL_L1.md` and reporting clean status, stop. Do not proceed to L1 diagnostic until Pat explicitly approves the protocol.
