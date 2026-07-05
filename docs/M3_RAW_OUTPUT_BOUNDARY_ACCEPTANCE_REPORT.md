# M3-A Raw Output Boundary Acceptance Report

Status: Accepted - acceptance lock
Date: 2026-07-05
Protocol: `docs/protocols/PASS_PROTOCOL_M3.md`
Implementation doc: `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_IMPLEMENTATION.md`
Acceptance test: `tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`
Pre-change snapshot: `snap_20260705T180028231Z_000331_milestone` (verified on disk before recording)

## Purpose

M3-A locks M3 as accepted and records the acceptance evidence that protects Caleb's model-output trust boundary from regression.

Model output may enter Caleb.

Model output may not govern Caleb.

## Acceptance Verdict

M3 Raw Output Consumption Boundary: Accepted.

The accepted boundary is consumption-only. M3 remains CLI/test-only. Display flow remains deferred to `M4-DISPLAY-BOUNDARY` or another Pat-approved display-boundary pass.

## Locked Boundary Claims

- Provider/model output starts as T0 raw.
- Schema-valid provider/model output may become T1 only.
- Provider/model output is capped at T1 forever.
- Provider/model output can never become T2, T3, or T4 by itself.
- Storage does not promote trust.
- Digest presence does not promote trust.
- API success does not promote trust.
- Network success does not promote trust.
- Provider identity does not promote trust.
- Model agreement does not promote trust.
- Report inclusion does not promote trust.
- Ledger reference does not promote trust.
- Opt-in flags do not promote trust.
- Raw provider/model content must not be written raw into the Ledger.
- Ledger refs for raw/model/provider content must remain digest/ref-only.
- H5 network traps and credential-read traps remain preserved.
- V1 Hollow catalog remains exactly 12.
- Hollowcut catalog remains exactly 9.

## Structural Split Lock

Provenance-facing derived-evidence records must carry:

- `measurement_tier`
- `subject_tier`
- `effective_tier`

Decision-facing interfaces must expose:

- `effective_tier` only

Decision-facing interfaces expose effective_tier only.

Downstream decision logic must consume `effective_tier` only. `measurement_tier` and `subject_tier` are provenance fields and must not be consumed directly for routing, allow/block decisions, trust promotion, persistence-as-truth decisions, release decisions, side-effect decisions, or Logic Engine transitions.

## Golden-Path Evidence Lock

The M3 acceptance test locks the worked example:

1. live-call-shaped provider/model output enters Caleb as T0 raw output
2. the output becomes schema-valid T1 only
3. raw content is stored by sha256 digest/ref
4. the Ledger-shaped record contains digest/ref metadata only
5. Character Count Hollow consumes stored/ref-addressed content through the approved boundary
6. derived evidence carries `measurement_tier = T2`
7. derived evidence carries `subject_tier = T1`
8. derived evidence carries `effective_tier = T1`
9. `effective_tier` is computed as `min(measurement_tier, subject_tier)`
10. downstream consumption honors `effective_tier` only
11. the Character Count measurement does not promote provider/model content above T1

## NEVER-Flow Evidence Lock

The acceptance surface locks absence checks for provider/model output flowing into:

- persistence as truth
- side-effect triggers
- trust-promotion inputs
- Logic Engine routing decisions

## Artifact Store Evidence Lock

Authority path:

- `.caleb/artifacts/` content-addressed store
- `.gitignore` guardrail for `.caleb/artifacts/`
- digest verification on retrieval
- structured `integrity_failure` on corrupted content
- structured `content_deleted` for authorized-deleted content
- deletion removes content only, never Ledger records

Fast path:

- in-memory adapter for pure unit tests and fixtures only

## Acceptance Coverage Map

Required M3 categories locked by report and tests:

1. Raw output lifecycle acceptance
2. Trust ceiling acceptance
3. Non-promoter acceptance
4. Mandatory tier split field acceptance
5. `effective_tier` computation acceptance
6. `measurement_tier` misuse detector acceptance
7. `subject_tier` misuse detector acceptance
8. Laundering detector acceptance
9. Ledger raw-content absence acceptance
10. Content-addressing acceptance
11. Lineage-resolution gate acceptance
12. Deletion/dangling-reference distinction acceptance
13. Display vs consumption acceptance
14. Persistence-as-truth NEVER-flow absence acceptance
15. Side-effect trigger NEVER-flow absence acceptance
16. Trust-promotion input NEVER-flow absence acceptance
17. Logic Engine routing NEVER-flow absence acceptance
18. H5 network trap preservation acceptance
19. Golden-path worked-example acceptance
20. V1 Hollow catalog count acceptance: exactly 12
21. Hollowcut catalog count acceptance: exactly 9
22. Existing suite acceptance
23. Completion report acceptance

## Non-Changes

M3-A does not implement:

- role rotation
- display UI
- 3D Thinking Mode
- 2D inspector
- new providers or adapters
- egress expansion
- H5 weakening
- package dependencies
- catalog changes
- historical Ledger mutation
- provider/model output above T1
- model/provider-driven routing, side effects, trust promotion, or persistence as truth

## Final Verdict

M3-A Raw Output Boundary Acceptance Lock: Accepted.

M3 is locked as accepted; future work must preserve the model-output trust boundary and acceptance evidence above.
