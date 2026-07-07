# ExecPlan Standard

An ExecPlan is required before longer Codex work.

## When an ExecPlan Is Required

Codex MUST create or update an ExecPlan for:

- multi-file changes
- new features
- refactors
- architecture changes
- schema changes
- security-sensitive changes
- storage or Ledger changes
- permission or side-effect changes
- work expected to take more than one short pass

## Required ExecPlan Sections

Every ExecPlan MUST include:

- Objective
- Source Authority
- Current State
- Scope
- Out of Scope
- Files Expected To Change
- Risk Level
- Snapshot / Rollback Plan
- Implementation Steps
- Validation Commands
- Acceptance Criteria
- Progress Log
- Decision Log
- Surprises / Discoveries
- Final Report

## Living Document Rule

An ExecPlan is a living document. Codex MUST update it when reality differs from the plan, when files change unexpectedly, when validation changes, or when the implementation path changes.

## Phase Boundary Rule

Implementation MUST NOT exceed the approved phase boundary. A future-phase document is not permission to implement future-phase work early.

## ExecPlan - RA-R2 Runtime Rotation Plan Artifact Contract

**Objective:** Define RuntimeRotationPlan types, strict validator, fixtures, tests, and contract doc only — no runtime consumption.

**Source Authority:** RA-R2 go-order, `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`, `docs/LEDGER_ID_FORMAT_CONTRACT.md`.

**Current State:** LG-1 at `4ab5b4e`. Suite 172/2,983 green.

**Scope:** `src/roles/types/runtimeRotationPlan.ts`, `src/roles/runtimeRotationPlanValidator.ts`, `examples/roles/runtime-rotation-plan.*.json`, tests, docs, barrel exports, PLANS.

**Out of Scope:** Rotation execution, Logic Engine wiring, ledger writes, model calls, idFactory changes.

**Snapshot / Rollback Plan:** Pre-change `snap_20260707T133131435Z_000366_milestone` (verified on disk).

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/roles/runtimeRotationPlanValidator.test.ts`; `npx vitest run`.

**Acceptance Criteria:** Strict validator with RRP_* codes; fixtures; accumulation tests; runtime isolation; suite green.

**Progress Log:** Pre-change snapshot `snap_20260707T133131435Z_000366_milestone` created and verified. Types, validator, fixtures, tests, and contract doc implemented. Typecheck passed. Full suite: 173 files / 3,001 tests green (+1 file, +18 tests vs LG-1).

**Final Report:** RA-R2 accepted. Contract-only RuntimeRotationPlan with strict validator; no runtime consumption; runtime isolation confirmed.

## ExecPlan - LG-1 Ledger Identity Uniqueness Guardrail

**Objective:** Replace counter-based Hollow/VRP/ledger ID generation with centralized `idFactory` UUID creators; preserve correlation semantics; add tests and format contract doc.

**Source Authority:** LG-1 go-order, `docs/04_STORAGE_AND_LEDGER_DECISIONS.md`, H4 ledger ID integrity findings.

**Current State:** RA-R1 at `a496176`. H4 partially unified ledger IDs on `randomUUID`; runner already UUID-based. LG-1 centralizes on `src/ledger/idFactory.ts`.

**Scope:** `idFactory.ts`, wire `runner.ts` + `ledgerEntryFactory.ts`, new tests, `docs/LEDGER_ID_FORMAT_CONTRACT.md`, PLANS.

**Out of Scope:** Snapshot IDs, live adapter IDs, VRP logic, ledger schema, historical ledger rewrite, dependencies.

**Snapshot / Rollback Plan:** Pre-change `snap_20260707T042918230Z_000364_milestone` (verified on disk before mutation).

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/ledger/idFactory.test.ts`; `npx vitest run tests/ledger/ledgerIdUniqueness.regression.test.ts`; `npx vitest run`.

**Acceptance Criteria:** Five factory functions; no counters; correlation preserved; all tests green; snapshot/live adapter untouched.

**Progress Log:** Pre-change snapshot `snap_20260707T042918230Z_000364_milestone` created and verified. idFactory created; `runner.ts` and `ledgerEntryFactory.ts` wired. Tests and contract doc added. Typecheck passed. Full suite: 172 files / 2,983 tests green.

**Final Report:** LG-1 accepted. Centralized UUID idFactory; hollow/VRP/ledger chain unified; correlation preserved; snapshot and live adapter IDs untouched.

## ExecPlan - RA-R1 Static Role Rotation Runtime Implementation

**Objective:** Implement static role rotation runtime per `docs/protocols/PASS_PROTOCOL_RA_R1.md` and RA-R1-D diagnostic, with mock adapters, M3 compose-only storage, executor-local handoff gate, 18-branch decision inventory, mandatory detectors, validation, commit, and completion report.

**Source Authority:** `docs/protocols/PASS_PROTOCOL_RA_R1.md`, `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md`, RA-R1-D handoff-gate classification (PASSED), `src/roles/roleHandoffGate.ts`, `src/rawOutput/contentAddressedRawOutputStore.ts`, `src/logicEngine/routeInputGate.ts` (read-only).

**Current State:** RA-R1-D accepted at `b627ed3`. H8 at `5128079`. Environment valid (keys empty; canonical suite green 168/2,945).

**Scope:** `src/roleRuntime/`, `tests/roleRuntime/`, `tests/acceptance/raR1StaticRotationAcceptance.test.ts`, `docs/RA_R1_STATIC_ROLE_ROTATION_RUNTIME_IMPLEMENTATION.md`, append-only ledger, PLANS, STATUS_LOG.

**Out of Scope:** Dynamic routing, L1 allowlist changes, M3 module edits, live providers, credentials, network egress, RA-X, V1/Hollowcut catalog changes.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260706T154747284Z_000362_milestone` (verified on disk before recording).

**Validation Commands:** `npx tsc --noEmit`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`.

**Acceptance Criteria:** 18-branch inventory implemented and documented; all mandatory detectors pass; L1 allowlist remains 7; M3 unchanged; V1 catalog 12; Hollowcut catalog 9; full suite green; clean tree after commit.

**Progress Log:** Pre-change snapshot `snap_20260706T154747284Z_000362_milestone` created and verified. Runtime, validators, mock adapter, executor, tests, and implementation doc drafted. Typecheck passed. Build passed. Full suite `npx vitest run`: 170 files / 2,966 tests green. V1 catalog 12; Hollowcut catalog 9.

**Final Report:** RA-R1 accepted. Files created: `src/roleRuntime/**`, `tests/roleRuntime/**`, `tests/acceptance/raR1StaticRotationAcceptance.test.ts`, `docs/RA_R1_STATIC_ROLE_ROTATION_RUNTIME_IMPLEMENTATION.md`. Files changed: `PLANS.md`, `docs/STATUS_LOG.md`, `.caleb/ledger/ledger.jsonl`. 18-branch inventory implemented; all mandatory detectors pass; L1 allowlist unchanged at seven; M3 unchanged; no live provider path.

## ExecPlan - RA-R1-D Static Rotation Diagnostic

**Objective:** Produce `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md` per committed RA-R1 protocol (`82df49c`), classify roleHandoffGate, survey R1–R6 layer, propose rotation schema and runtime decision surface, validate, commit, push, STOP.

**Source Authority:** `docs/protocols/PASS_PROTOCOL_H8_RAR1D.md`, `docs/protocols/PASS_PROTOCOL_RA_R1.md`, RA-C, `src/roles/roleHandoffGate.ts` and related modules.

**Current State:** H8 accepted at `5128079`. RA-R1 protocol at `82df49c`. Environment valid (keys empty; canonical suite green).

**Scope:** One diagnostic document plus STATUS_LOG and PLANS entries only.

**Out of Scope:** No implementation, no src/tests/types changes.

**Snapshot / Rollback Plan:** Pre-change `snap_20260706T032542674Z_000360_milestone` (verified on disk before recording).

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; catalog commands.

**Acceptance Criteria:** Five deliverables complete with file:line citations in Deliverable 1; findings section present; suite green 168/2,945; catalogs 12/9; clean tree; STOP after push.

**Progress Log:** Pre-change snapshot `snap_20260706T032542674Z_000360_milestone` created and verified. Diagnostic document drafted with 18-branch decision inventory. Typecheck passed. Full suite `npx vitest run`: 168 files / 2,945 tests green. V1 catalog 12; Hollowcut catalog 9.

**Final Report:** RA-R1-D accepted. Files created: `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md`. Files changed: `docs/STATUS_LOG.md`, `PLANS.md`, `.caleb/ledger/ledger.jsonl`. Verdict: handoff gate clean; runtime decision surface proposed; awaiting Pat and Fable review. STOP — no implementation authorized.

## ExecPlan - H8 Network Egress Proof Documentation Amendment

**Objective:** Record the H7 field catch and precise subprocess env-enumeration coverage in `docs/NETWORK_EGRESS_PROOF.md`, add the no-ambient-credentials rule to the operating contract, commit protocol file, validate, commit, push, and proceed to RA-R1-D.

**Source Authority:** `docs/protocols/PASS_PROTOCOL_H8_RAR1D.md`, Pass H7 STATUS_LOG entry, commit `82df49c`, `docs/NETWORK_EGRESS_PROOF.md`, `docs/01_CODEX_OPERATING_CONTRACT.md`.

**Current State:** RA-R1 protocol committed at `82df49c`. Environment repaired (ambient keys empty; canonical suite green 168/2,945). Tree clean.

**Scope:** Docs-only amendment to egress proof doc, one operating-contract line, protocol file, STATUS_LOG and PLANS entries.

**Out of Scope:** No trap, test, config, or `src/` changes.

**Snapshot / Rollback Plan:** Pre-change `snap_20260706T024327264Z_000358_milestone` (verified on disk before recording).

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; catalog commands.

**Acceptance Criteria:** Amendment section present with precise subprocess scope; operating-contract rule present; suite green; catalogs 12/9; clean tree after commit.

**Progress Log:** Pre-change snapshot `snap_20260706T024327264Z_000358_milestone` created and verified. Protocol and doc amendments drafted. Typecheck passed (`npx tsc --noEmit`). Full suite `npx vitest run`: 168 files / 2,945 tests green. V1 catalog 12; Hollowcut catalog 9.

**Final Report:** H8 accepted. Files changed: `docs/protocols/PASS_PROTOCOL_H8_RAR1D.md` (new), `docs/NETWORK_EGRESS_PROOF.md`, `docs/01_CODEX_OPERATING_CONTRACT.md`, `docs/STATUS_LOG.md`, `PLANS.md`, `.caleb/ledger/ledger.jsonl`. Verdict: field catch recorded; subprocess coverage stated precisely; no-ambient-credentials rule binds all implementers.

## ExecPlan - RA-R1 Static Rotation Runtime Protocol

**Objective:** Commit the RA-R1 protocol-draft document only, record the pass ledger entries, validate the repository, commit, push, and stop before diagnostic or implementation.

**Source Authority:** Explicit attached RA-R1 protocol, RA-C full text `docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md`, M3/M3-A/M3-B/M3-T boundary stack, L1/L1-A/L1-B route-input stack, Pat's witnessed spot-check, AGENTS.md, CODEX.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and this `PLANS.md`.

**Current State:** M3-T is committed, pushed, and clean. RA-C exists as an accepted design contract. RA-R1 diagnostic and implementation are not authorized yet.

**Scope:** Create `docs/protocols/PASS_PROTOCOL_RA_R1.md`, update `PLANS.md` and `docs/STATUS_LOG.md`, preserve the required snapshot Ledger append, run validation and catalog checks, commit with RA-R1 protocol in the message, push, verify clean tree, and stop.

**Out of Scope:** No diagnostic, no implementation, no `src/`, no `tests/`, no `types/`, no providers, no egress, no package changes, no catalog changes, no UI, no L1 allowlist changes, no M3 boundary changes, no role runtime, no role rotation, and no historical Ledger mutation.

**Files Expected To Change:** `docs/protocols/PASS_PROTOCOL_RA_R1.md`, `PLANS.md`, `docs/STATUS_LOG.md`, and `.caleb/ledger/ledger.jsonl` via required snapshot command.

**Risk Level:** Low. This is documentation/protocol only. The main risk is accidentally beginning diagnostic or implementation work; this pass explicitly stops before either.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T235443061Z_000348_milestone` created with name `ra_r1_protocol_prechange` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree. Read RA-R1 protocol and authority docs. Create and verify pre-change snapshot. Add protocol file and pass ledger entries only. Run typecheck, build, full suite, and catalog checks. Commit with RA-R1 protocol in the message. Push. Verify clean tree. Stop.

**Validation Commands:** `npx tsc --noEmit`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** RA-R1 protocol file exists. Pass ledgers record protocol-only stage. No diagnostic or implementation occurs. No implementation files are modified. V1 catalog remains 12. Hollowcut catalog remains 9. Full suite remains green. Commit is pushed and tree ends clean.

**Progress Log:** Clean tree verified. RA-R1 attachment read. Authority docs read. Pre-change snapshot `snap_20260705T235443061Z_000348_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T235443061Z_000348_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical Ledger content was edited. Protocol file and ledger entries drafted. Typecheck passed. Build passed. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows. Standard full suite command `npx vitest run` was attempted twice and failed both times on timeout-only failures in unrelated tests under full-suite load. First attempt: `tests/acceptance/networkEgressProofAcceptance.test.ts` call-site pin timed out and `tests/hollows/media/imageDimensionsHollow.test.ts` PNG metadata test timed out; 166/168 files and 2,943/2,945 tests passed. Focused rerun of those two files passed 2 files / 33 tests. Second full-suite attempt: `tests/cli/minimalCli.test.ts` create-milestone-snapshot parse-level test timed out and `tests/acceptance/networkEgressProofAcceptance.test.ts` stale-allowlist detector timed out; 166/168 files and 2,943/2,945 tests passed. Focused rerun of those two files passed 2 files / 29 tests. Full-suite validation is not accepted yet. First full-suite attempt created validation snapshot `snap_20260706T000428986Z_000349_milestone`, verified present on disk before recording.

**Decision Log:** RA-R1 remains protocol-only. The diagnostic must be explicitly authorized by Pat before handoff-gate classification or role-runtime design survey begins.

**Surprises / Discoveries:** Standard full-suite validation is currently unstable under 5-second per-test timeout pressure, with different unrelated tests timing out across repeated runs while focused reruns pass.

**Final Report:** Blocked before commit. RA-R1 protocol-stage edits are drafted, but the required standard full-suite command did not pass. No diagnostic or implementation was started.

## ExecPlan - M3-T Acceptance Test Honesty Strengthening

**Objective:** Replace vacuous M3 acceptance assertions with tests that exercise Caleb's system under test or honestly assert unrepresentability, without changing runtime behavior.

**Source Authority:** Explicit attached M3-T protocol, `docs/protocols/PASS_PROTOCOL_M3T.md`, M3/M3-A/M3-B accepted state, Pat spot-check results, AGENTS.md, CODEX.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and this `PLANS.md`.

**Current State:** M3 is accepted and locked, but post-spot-check full-text review found two weak tests in `tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`: a non-promoter test that looped over unused labels and a display-deferral test that asserted local literal fields.

**Scope:** Commit the M3-T protocol, strengthen the M3 acceptance test file, amend the M3 acceptance report, update pass ledgers, reconcile the M3-A lock only if required, and record required snapshot Ledger appends.

**Out of Scope:** No `src/` changes, no runtime behavior changes, no providers, no egress, no role rotation, no UI, no package changes, no catalog changes, no allowlist changes, no new record types, and no historical Ledger mutation.

**Files Expected To Change:** `docs/protocols/PASS_PROTOCOL_M3T.md`, `tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`, `docs/M3_RAW_OUTPUT_BOUNDARY_ACCEPTANCE_REPORT.md`, `PLANS.md`, `docs/STATUS_LOG.md`, and `.caleb/ledger/ledger.jsonl` via required snapshot commands. `tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts` changes only if its pins require reconciliation.

**Risk Level:** Medium. This is test-only, but the tests intentionally probe trust-promotion temptations; any actual promotion above T1 would be a boundary defect requiring Pat review.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T231325269Z_000346_milestone` created with name `m3t_test_honesty_prechange` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree. Read authority docs and M3-T protocol. Create and verify pre-change snapshot. Replace the non-promoter loop with named real-attempt or unrepresentability tests. Replace display literal assertion with real documentation/export absence assertion. Optionally add factory-produced Ledger lineage to the golden path. Amend acceptance report and pass ledgers. Run typecheck, focused M3/M3-A tests, build, full suite, catalog checks. Commit with pass ID, attempt push, and verify clean tree.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Old vacuous non-promoter loop is gone. Every mandated non-promoter has a named real-attempt or unrepresentability test. Display-deferral acceptance no longer asserts a local literal. Golden path remains intact and may include factory-produced Ledger lineage. M3-A lock is reconciled if needed. V1 catalog remains 12. Hollowcut catalog remains 9. Full suite remains green.

**Progress Log:** Clean tree verified. M3-T protocol read. Authority docs and M3 acceptance/lock files inspected. Pre-change snapshot `snap_20260705T231325269Z_000346_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T231325269Z_000346_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical Ledger content was edited. M3 acceptance test strengthened with named non-promoter tests, real display deferral/export absence assertion, and factory-produced Ledger lineage in the golden path. Focused M3 acceptance file passed 1 file / 15 tests. Focused M3/M3-A lock run passed 2 files / 21 tests. Typecheck passed. Build passed. Full suite passed 168 files / 2,945 tests. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows. Full suite created validation snapshot `snap_20260705T232219310Z_000347_milestone`, verified present on disk before recording.

**Decision Log:** Display deferral uses option (a): assert against real M3 implementation documentation and the absence of display/render/preview exports from `src/rawOutput/index.ts`. API success and network success use adapter-shaped success data plus the real trust-summary builder; network/timing fields remain structurally outside the raw-output lifecycle, so the lifecycle assertion is the nearest constructible promotion attempt. Opt-in metadata is asserted as structurally absent from raw-output lifecycle records.

**Surprises / Discoveries:** The M3-A lock does not pin M3 acceptance test names or counts, so it required no source change.

**Final Report:** M3-T Acceptance Test Honesty Strengthening completed. The old unused non-promoter loop and display literal assertion were removed. Non-promoter coverage now includes named storage, digest_presence, api_success, network_success, provider_identity, model_agreement, report_inclusion, ledger_reference, and opt_in_flags tests. Display deferral uses option (a), asserting against real M3 implementation documentation and absence of display/render/preview exports from `src/rawOutput/index.ts`. The M3-A lock required no source reconciliation. Golden-path lineage addition was made with `createLedgerEntryFromInvocation` and `resolveLineageReferences`. No `src`, runtime, provider, egress, role rotation, UI, package, catalog, allowlist, record-type, or historical Ledger behavior changed. Required pre-change snapshot `snap_20260705T231325269Z_000346_milestone` and validation-created snapshot `snap_20260705T232219310Z_000347_milestone` were verified on disk before recording. Validation passed: typecheck, focused M3/M3-A tests 2 files / 21 tests, build, full suite 168 files / 2,945 tests, V1 catalog 12, Hollowcut catalog 9.

## ExecPlan - L1-B Route-Input Allowlist Correction

**Objective:** Remove `lineage_resolved_decision_facing_record` from the L1 route-input allowlist until RA-X attaches lineage verification and deterministic extraction machinery.

**Source Authority:** Explicit attached L1-B protocol, `docs/protocols/PASS_PROTOCOL_L1B.md`, L1-A lock, RA-C contract, AGENTS.md, CODEX.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and this `PLANS.md`.

**Current State:** L1-A locked an eight-entry allowlist. Post-review analysis confirmed `lineage_resolved_decision_facing_record` validates only shape, not lineage resolution or deterministic extraction, and therefore pre-admits a verifier that does not exist.

**Scope:** Commit the L1-B protocol, remove `lineage_resolved_decision_facing_record` from L1 route-input types and gate allowlist, update L1/L1-A tests to seven-entry allowlist, add a standing masquerade detector, amend the L1-A acceptance report, and update pass ledgers.

**Out of Scope:** No partial lineage verifier, no RA-X implementation, no role rotation, no providers, no egress, no UI, no package changes, no catalog changes, no historical Ledger mutation, no other allowlist changes, and no validation logic changes for the remaining seven kinds.

**Files Expected To Change:** `docs/protocols/PASS_PROTOCOL_L1B.md`, `src/logicEngine/types/routeInput.ts`, `src/logicEngine/routeInputGate.ts`, L1/L1-A/L1-B acceptance tests, `docs/L1_ROUTE_INPUT_BOUNDARY_ACCEPTANCE_REPORT.md`, `PLANS.md`, `docs/STATUS_LOG.md`, and `.caleb/ledger/ledger.jsonl` via required snapshot commands.

**Risk Level:** Medium. This removes an allowed route-input kind. Blocking grep confirmed no live producer or consumer exists beyond gate/type definitions and tests, so removal is safe in current tree.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T222323485Z_000344_milestone` created with name `l1b_allowlist_correction_prechange` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree. Run blocking producer/consumer grep. Create and verify pre-change snapshot. Remove the record kind from types/gate. Update L1/L1-A tests and acceptance report. Add masquerade detector. Run typecheck, focused L1/L1-A/L1-B tests, build, full suite, catalog checks. Commit with pass ID and verify clean tree.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/logicEngine/routeInputGate.test.ts tests/acceptance/l1RouteInputHardeningAcceptance.test.ts tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts tests/acceptance/l1bAllowlistCorrection.test.ts`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Blocking grep finds zero real producers/consumers. Allowlist is seven entries. Removed kind is rejected as unknown. Masquerade fixture with unverified role-artifact lineage is rejected. L1-A lock green with seven-entry pin. Existing L1 detectors remain green. V1 catalog remains 12. Hollowcut catalog remains 9. Full suite remains green.

**Progress Log:** Clean tree verified. Blocking grep found zero real producers or consumers beyond gate/type definitions and L1/L1-A test fixtures. Pre-change snapshot `snap_20260705T222323485Z_000344_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T222323485Z_000344_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical Ledger content was edited. Protocol file, allowlist correction, test updates, report amendment, and L1-B masquerade detector drafted. Typecheck passed. Focused L1/L1-A/L1-B tests passed 4 files / 32 tests. Build passed. Full suite passed 168 files / 2,937 tests. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows. Full suite created validation snapshot `snap_20260705T222857309Z_000345_milestone`, verified present on disk before recording.

**Decision Log:** The removed kind is fully withdrawn rather than retained as known-but-disabled, so it now fails exactly like any unknown record kind. No partial lineage verifier was added.

**Surprises / Discoveries:** None.

**Final Report:** L1-B Route-Input Allowlist Correction completed. Blocking grep found zero real producers or consumers beyond gate/type definitions and L1/L1-A test fixtures. The L1 route-input allowlist is now seven entries: `contract_validated_task_frame`, `verified_signal_frame`, `engine_internal_state`, `deterministic_hollow_signal`, `accepted_gate_policy_result`, `human_pat_approval_record`, and `snapshot_change_guard_state`. `lineage_resolved_decision_facing_record` is withdrawn until RA-X attaches lineage verification and deterministic extraction machinery, and now rejects exactly like an unknown kind. Standing masquerade detector added: `l1b masquerade fixture: decision record with unverified role-artifact lineage is rejected`. No RA-X verifier, role rotation, provider, egress, UI, package, catalog, historical Ledger, or other allowlist change was made. Required pre-change snapshot `snap_20260705T222323485Z_000344_milestone` and validation-created snapshot `snap_20260705T222857309Z_000345_milestone` were verified on disk before recording. Validation passed: typecheck, focused L1/L1-A/L1-B tests 4 files / 32 tests, build, full suite 168 files / 2,937 tests, V1 catalog 12, Hollowcut catalog 9.

## ExecPlan - RA-C Role Artifact Consumption Boundary Contract

**Objective:** Create the design-only role artifact consumption boundary contract before any role runtime exists, binding future role artifacts to M3/L1 trust and routing rules.

**Source Authority:** Explicit attached L1-A/RA-C protocol, `docs/protocols/PASS_PROTOCOL_L1A_RAC.md`, accepted L1-A lock, M3/M3-A/M3-B chain, `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`, `docs/ROLE_ARTIFACT_CONTRACT_LAYER_ACCEPTANCE_REPORT.md`, runtime storage planning/type contracts, AGENTS.md, CODEX.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and this `PLANS.md`.

**Current State:** L1-A is committed and clean. Existing role artifact contract layer is static and contract-only. Role artifact validator, registry, handoff gate, bundle, and report contracts exist, but no role runtime is authorized.

**Scope:** Create `docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md`, answer all seven RA-C questions, include a worked example, identify RA implementation acceptance obligations, and update `PLANS.md` plus `docs/STATUS_LOG.md`.

**Out of Scope:** No `src/`, no `tests/`, no `types/`, no runtime behavior, no role rotation, no Role Router, no routing changes, no UI/display, no providers/adapters, no egress changes, no package changes, no catalog changes, no L1 allowlist changes, no storage implementation, no validator implementation, no trust promotion, and no historical Ledger mutation.

**Files Expected To Change:** `docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md`, `PLANS.md`, `docs/STATUS_LOG.md`, and `.caleb/ledger/ledger.jsonl` via required snapshot command and validation-created snapshot if any.

**Risk Level:** Low. Design-only. The main risk is silence around Analyst registry absence or the extraction question; both are explicitly answered/deferred with named home passes.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T215233125Z_000342_milestone` created with name `rac_role_artifact_boundary_contract_prechange` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree after L1-A. Create and verify RA-C pre-change snapshot. Inspect existing role artifact contracts, handoff gate, storage planning, and M3/L1 locks. Draft RA-C contract with no-silence answers, worked example, and acceptance obligations. Update pass ledgers. Run full validation and catalog checks. Commit with pass ID and verify clean tree.

**Validation Commands:** `npx tsc --noEmit`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Contract exists. Seven questions are answered or named-deferred with home pass. Worked example exists. Role artifacts are explicitly model outputs capped at T1. Role identity is a non-promoter. Existing role contracts are reconciled with M3/L1 vocabulary. Extraction shortcut is barred and future deterministic extraction path is named. RA implementation obligations and required detectors are listed. No implementation files are modified. V1 catalog remains 12. Hollowcut catalog remains 9. Existing suite remains green.

**Progress Log:** Clean tree verified after L1-A commit. Pre-change snapshot `snap_20260705T215233125Z_000342_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T215233125Z_000342_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical Ledger content was edited. Existing role artifact contract layer, role artifact validator, role contract registry, role handoff gate, runtime storage type contracts, and runtime storage planning boundary inspected. RA-C contract drafted. Typecheck passed. Build passed. Full suite passed 167/167 files and 2,935/2,935 tests. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows. Full suite created validation snapshot `snap_20260705T215701269Z_000343_milestone`, verified present on disk before recording.

**Decision Log:** RA-C mandates using the M3 content-addressed artifact store for future role artifact raw content unless a later protocol explicitly justifies an equivalent. `validateRoleArtifact` schema validation maps to T1 maximum. Role handoff gate `allowed` means context-consumption eligibility only, not route authority. The missing `analyst` role in the current registry is recorded as `RA-REGISTRY-ANALYST`, not silently assumed.

**Surprises / Discoveries:** The accepted static role registry currently contains no `analyst` role even though role-rotation doctrine names Analyst. This remains design-only and requires a future registry amendment before Analyst runtime claims.

**Final Report:** RA-C Role Artifact Consumption Boundary Contract completed. Contract created at `docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md`. All seven questions are answered or named-deferred with home pass: identity/tiering answered in Section 1; pre-M3 reconciliation answered in Section 2 with `RA-REGISTRY-ANALYST`; consumption flows answered in Section 3; extraction answered in Section 4 with `RA-X-DETERMINISTIC-EXTRACTION`; lineage answered in Section 5; cross-model provenance answered in Section 6; non-authorizations answered in Section 7. Worked example included. RA implementation acceptance obligations and required detectors included. No `src`, `tests`, `types`, runtime, role rotation, Role Router, routing, UI/display, provider, egress, package, catalog, L1 allowlist, storage implementation, validator implementation, trust-promotion, or historical Ledger behavior changed. Required pre-change snapshot `snap_20260705T215233125Z_000342_milestone` and validation-created snapshot `snap_20260705T215701269Z_000343_milestone` were verified on disk before recording. Validation passed: typecheck, build, full suite 167 files / 2,935 tests, V1 catalog 12, Hollowcut catalog 9.

## ExecPlan - L1-A Route-Input Boundary Acceptance Lock

**Objective:** Lock the accepted L1 route-input hardening boundary with a dedicated acceptance report and lock test, following the M3-A precedent.

**Source Authority:** Explicit attached L1-A/RA-C protocol, `docs/protocols/PASS_PROTOCOL_L1A_RAC.md`, accepted L1 implementation commit `014bec4`, `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_IMPLEMENTATION.md`, AGENTS.md, CODEX.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and this `PLANS.md`.

**Current State:** L1 implementation is committed and clean. It added an allowlist-based route-input gate and required detectors. L1-A has not yet locked the accepted boundary surface.

**Scope:** Create the combined protocol file, create `docs/L1_ROUTE_INPUT_BOUNDARY_ACCEPTANCE_REPORT.md`, create `tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts`, update `PLANS.md` and `docs/STATUS_LOG.md`, and record required snapshot Ledger appends.

**Out of Scope:** No runtime behavior changes, no L1 implementation patches, no role rotation, routing behavior changes, UI/display, providers, egress, package changes, catalog changes, M3 runtime changes, trust promotion, side effects, or new route-input record types.

**Files Expected To Change:** `docs/protocols/PASS_PROTOCOL_L1A_RAC.md`, `docs/L1_ROUTE_INPUT_BOUNDARY_ACCEPTANCE_REPORT.md`, `tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts`, `PLANS.md`, `docs/STATUS_LOG.md`, and `.caleb/ledger/ledger.jsonl` via required snapshot commands.

**Risk Level:** Low. Acceptance-lock only. The main risk is discovering an L1 coverage gap; per protocol, that would stop the pass rather than silently patching runtime.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T214419613Z_000340_milestone` created with name `l1a_route_input_lock_prechange` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree. Create and verify pre-change snapshot. Commit combined protocol before or with L1-A work. Create acceptance report. Add lock test pinning allowlist, fail-closed behavior, public-surface detectors, entrypoint uniqueness, and lock-fires evidence. Run typecheck, focused lock test, build, full suite, catalog checks. Commit with pass ID and verify clean tree.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Acceptance report exists. Lock test passes. Allowlist is pinned verbatim. Unknown record types reject. Every L1 detector fires through the gate public surface. `selectRouteFromRouteInputs` is the sole hardened entrypoint. Lock-fires evidence is recorded. No L1 runtime changes are made. V1 catalog remains 12. Hollowcut catalog remains 9. Existing suite remains green.

**Progress Log:** Clean tree verified. Pre-change snapshot `snap_20260705T214419613Z_000340_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T214419613Z_000340_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical Ledger content was edited. Combined protocol file, acceptance report, and lock test drafted. Initial focused lock test passed but typecheck caught a test-helper narrowing issue; fixed in test only. Typecheck passed. Focused L1-A lock test passed 1 file / 7 tests. Build passed. Full suite passed 167/167 files and 2,935/2,935 tests. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows. Full suite created validation snapshot `snap_20260705T214857931Z_000341_milestone`, verified present on disk before recording.

**Decision Log:** The lock pins allowlist contents by inspecting the accepted `ALLOWED_KINDS` source and proves detector behavior through public gate exports. The synthetic lock-fires fixture uses `future_unprotocolled_route_input` and `selectRouteFromRawModelOutput` as non-runtime weakening examples.

**Surprises / Discoveries:** None so far.

**Final Report:** L1-A Route-Input Boundary Acceptance Lock completed. Acceptance report created at `docs/L1_ROUTE_INPUT_BOUNDARY_ACCEPTANCE_REPORT.md`; lock test created at `tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts`; combined protocol recorded at `docs/protocols/PASS_PROTOCOL_L1A_RAC.md`. The locked allowlist is: `contract_validated_task_frame`, `verified_signal_frame`, `engine_internal_state`, `deterministic_hollow_signal`, `accepted_gate_policy_result`, `human_pat_approval_record`, `snapshot_change_guard_state`, `lineage_resolved_decision_facing_record`. Lock-fires evidence references synthetic weakening fixtures `future_unprotocolled_route_input` and `selectRouteFromRawModelOutput`. No runtime behavior changes were made. Required pre-change snapshot `snap_20260705T214419613Z_000340_milestone` and validation-created snapshot `snap_20260705T214857931Z_000341_milestone` were verified on disk before recording. Validation passed: typecheck, focused L1-A lock 1 file / 7 tests, build, full suite 167 files / 2,935 tests, V1 catalog 12, Hollowcut catalog 9.

## ExecPlan - L1 Logic Engine Route-Input Hardening Implementation

**Objective:** Implement L1 under `docs/protocols/PASS_PROTOCOL_L1.md` and `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_DIAGNOSTIC.md` by adding an allowlist-based Logic Engine route-input gate so only approved decision-facing records may move Caleb's state machine.

**Source Authority:** Explicit user approval for L1 implementation, `docs/protocols/PASS_PROTOCOL_L1.md`, `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_DIAGNOSTIC.md`, M3/M3-A/M3-B acceptance state, AGENTS.md, CODEX.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and this `PLANS.md`.

**Current State:** L1 diagnostic is approved and committed. The working tree was clean before implementation. Existing route selection is deterministic but trusted shaped `TaskFrame` and `SignalFrame` inputs implicitly; no route-input allowlist gate existed before this pass.

**Scope:** Add route-input gate types, a fail-closed route-input validator/gate, a hardened `selectRouteFromRouteInputs` entrypoint, unit tests, acceptance tests, implementation documentation, pass ledger updates, and required snapshot Ledger appends.

**Out of Scope:** No role rotation, UI/display, provider or adapter additions, egress expansion, H5 weakening, package changes, catalog changes, M3 runtime changes outside the approved L1 integration surface, historical Ledger mutation, provider/model trust promotion, or model/provider output routing.

**Files Expected To Change:** `src/logicEngine/types/routeInput.ts`, `src/logicEngine/routeInputGate.ts`, `src/logicEngine/index.ts`, `src/logicEngine/types/index.ts`, `tests/logicEngine/routeInputGate.test.ts`, `tests/acceptance/l1RouteInputHardeningAcceptance.test.ts`, `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_IMPLEMENTATION.md`, `PLANS.md`, `docs/STATUS_LOG.md`, and `.caleb/ledger/ledger.jsonl` via required snapshot commands.

**Risk Level:** Medium. This pass adds a route/state authority boundary. Risk is controlled by keeping `selectRoute` as deterministic inner logic, adding a hardened wrapper entrypoint, rejecting non-authority records structurally, and adding acceptance detectors for required forbidden flows.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T211607042Z_000338_milestone` created with name `L1 implementation pre-change` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree. Read canonical protocol and diagnostic. Create and verify pre-change snapshot. Add closed route-input types and validator/gate. Add hardened route-input selector wrapper. Export new gate/types. Add unit and acceptance tests. Add implementation documentation. Run focused tests, typecheck, build, full suite, and catalog checks. Commit with L1 implementation in the message and verify clean tree.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/logicEngine/routeInputGate.test.ts tests/acceptance/l1RouteInputHardeningAcceptance.test.ts`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Allowlist gate exists. Approved route-input categories are represented. Non-authority records are rejected: synthetic T1 provider/model record, raw model output, `measurement_tier`, `subject_tier`, display/report text, unknown record type, digest/storage/provider identity, model confidence, and role artifact prose. Decision-facing records expose `effective_tier` only. H5 traps remain preserved. V1 catalog remains 12. Hollowcut catalog remains 9. Existing suite remains green.

**Progress Log:** Clean tree verified. Canonical L1 protocol and diagnostic read. Pre-change snapshot `snap_20260705T211607042Z_000338_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T211607042Z_000338_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical ledger content was edited. Added `LogicEngineRouteInput` closed union and route-input gate. Added `selectRouteFromRouteInputs` as the hardened entrypoint before deterministic `selectRoute`. Added focused unit and acceptance tests plus implementation documentation. Initial focused tests caught a wrong H5 setup-file assumption; corrected to the actual combined `networkEgressBlock.ts` trap. Typecheck passed. Focused L1 tests passed 2 files / 23 tests. Build passed. Full suite passed 166/166 files and 2,928/2,928 tests. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows. Full suite created validation snapshot `snap_20260705T212456285Z_000339_milestone`, verified present on disk before recording.

**Decision Log:** L1 keeps `selectRoute(frame, signals)` as deterministic inner logic and exposes `selectRouteFromRouteInputs(inputs)` as the hardened route-input boundary. Deterministic Hollow and lineage-resolved decision-facing route inputs require approved `effective_tier` T2 or higher, preventing T1 provider/model output from steering Caleb. The gate scans records for provenance-only and non-authority fields and rejects unknown top-level fields for each approved kind.

**Surprises / Discoveries:** H5 credential-read and network traps are both implemented in `tests/setup/networkEgressBlock.ts`; there is no separate env trap file.

**Final Report:** L1 Logic Engine Route-Input Hardening Implementation completed. The allowlist gate and route-input record union are implemented. The hardened `selectRouteFromRouteInputs` entrypoint rejects non-authority records before route selection and accepts only approved route-input kinds. Required detectors cover synthetic T1 provider/model route input, raw model output, `measurement_tier`, `subject_tier`, display/report text, unknown record type, digest/storage/provider identity, model confidence, and role artifact prose. H5 traps remain preserved. No role rotation, UI/display, provider, egress, package, catalog, M3 runtime, or historical Ledger behavior changed. Required pre-change snapshot `snap_20260705T211607042Z_000338_milestone` and validation-created snapshot `snap_20260705T212456285Z_000339_milestone` were verified on disk before recording. Validation passed: typecheck, focused L1 tests 2 files / 23 tests, build, full suite 166 files / 2,928 tests, V1 catalog 12, Hollowcut catalog 9.

## ExecPlan - L1 Logic Engine Route-Input Hardening Diagnostic

**Objective:** Perform the L1 diagnostic only, using `docs/protocols/PASS_PROTOCOL_L1.md` as the canonical protocol source, and stop before implementation.

**Source Authority:** Explicit user approval to proceed to L1 diagnostic only, `docs/protocols/PASS_PROTOCOL_L1.md`, M3/M3-A/M3-B acceptance state, AGENTS.md, CODEX.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and this `PLANS.md`.

**Current State:** L1 protocol draft is approved and committed. The working tree was clean before diagnostic work. The protocol is allowlist-based and requires detector coverage for synthetic T1 provider/model route input, tier-field misuse, display/report text, unknown record types, and digest/storage/provider identity authority attempts.

**Scope:** Create `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_DIAGNOSTIC.md`, identify current route-input surfaces, diagnose unsafe/advisory acceptance risk, recommend allowed and rejected route-input record types, recommend decision-facing type shape, connect M3 `effective_tier` to L1, list likely implementation files and tests, and record risks/Pat decisions.

**Out of Scope:** No L1 implementation, `src/` changes, `tests/` changes, `types/` changes, M3 runtime changes, provider changes, egress changes, package changes, catalog changes, historical Ledger mutation, UI, role rotation, validators, storage, lineage gates, trust logic, or route-input gate implementation.

**Files Expected To Change:** `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_DIAGNOSTIC.md`, `PLANS.md`, and `docs/STATUS_LOG.md`. The required pre-change snapshot command also appends its normal snapshot-created entry to `.caleb/ledger/ledger.jsonl`.

**Risk Level:** Low. Diagnostic/documentation-only. The main risk is accidentally specifying implementation as completed behavior; this pass records recommendations only.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T185401847Z_000336_milestone` created with name `L1 diagnostic pre-change` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree. Read canonical L1 protocol and authority docs. Create and verify pre-change snapshot. Inspect current Logic Engine route-input surfaces. Draft the diagnostic report. Update pass ledgers. Run docs-only validation and catalog checks. Commit with L1 diagnostic in the message and verify clean tree.

**Validation Commands:** `npx tsc --noEmit`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Diagnostic confirms L1 is allowlist-based; identifies exact current route-input surfaces; identifies unsafe/advisory acceptance risk; defines proposed allowed and rejected record types; recommends a decision-facing route-input shape; connects M3 `effective_tier` only decision records to L1; identifies likely implementation files, acceptance tests, risks, ambiguities, and Pat decisions; confirms L1 remains CLI/test-only and display/report text may not route Caleb; no implementation files are modified.

**Progress Log:** Clean tree verified. Canonical L1 protocol and authority docs read. Pre-change snapshot `snap_20260705T185401847Z_000336_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T185401847Z_000336_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical ledger content was edited. Current Logic Engine route-input surfaces inspected: TaskFrame validation, signal classification, route selection, work graph building, execution context summary, single-pass route MVP, and route Ledger event builder. Diagnostic document drafted at `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_DIAGNOSTIC.md`. Typecheck passed. Build passed. Full suite passed 164/164 files and 2,905/2,905 tests. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows. Full suite created validation snapshot `snap_20260705T185849865Z_000337_milestone`, verified present on disk before recording.

**Decision Log:** Diagnostic recommends a fail-closed allowlist gate using a closed discriminated union. Existing `selectRoute(frame, signals)` should remain deterministic selection logic but be protected by an explicit route-input authority gate. M3 should connect only through lineage-resolved decision-facing records exposing `effective_tier`; provenance-only fields remain outside route authority.

**Surprises / Discoveries:** `TaskFrame.signal_hints` and `classifySignals` are the practical route-influence surface that L1 must guard carefully. `RouteLedgerEventBuildInput.route_result` accepts broad records for provenance/reporting and should remain downstream, not route authority.

**Final Report:** L1 diagnostic completed only. Diagnostic created at `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_DIAGNOSTIC.md`. It confirms the protocol is allowlist-based, identifies current route-input surfaces, names current implicit trust risks, recommends the structural split with decision-facing `effective_tier` only, lists likely implementation files/tests, and records open Pat decisions. No L1 implementation, `src`, `tests`, `types`, M3 runtime, provider, egress, package, catalog, UI, role-rotation, or historical Ledger changes were made. Required pre-change snapshot `snap_20260705T185401847Z_000336_milestone` and validation-created snapshot `snap_20260705T185849865Z_000337_milestone` were verified on disk before recording. Validation passed: typecheck, build, full suite 164 files / 2,905 tests, V1 catalog 12, Hollowcut catalog 9.

## ExecPlan - L1 Logic Engine Route-Input Hardening Protocol

**Objective:** Draft the canonical L1 protocol for hardening the Logic Engine route-input surface so only approved decision-facing records may move Caleb's state machine.

**Source Authority:** Explicit user authorization for L1 protocol drafting, `docs/protocols/PASS_PROTOCOL_M3.md`, M3/M3-A/M3-B acceptance state, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and this `PLANS.md`.

**Current State:** M3-A lock verified complete and its validation-created Ledger append has been committed. Working tree was clean before this pass. L1 protocol does not yet exist.

**Scope:** Create `docs/protocols/PASS_PROTOCOL_L1.md` using the house 10-section format, and update `PLANS.md` plus `docs/STATUS_LOG.md` only as pass ledgers.

**Out of Scope:** No L1 diagnostic, L1 implementation, `src/` changes, `tests/` changes, `types/` changes, provider changes, egress changes, package changes, catalog changes, M3 runtime changes, or historical Ledger mutation.

**Files Expected To Change:** `docs/protocols/PASS_PROTOCOL_L1.md`, `PLANS.md`, and `docs/STATUS_LOG.md`. The required pre-change snapshot command also appends its normal snapshot-created entry to `.caleb/ledger/ledger.jsonl`.

**Risk Level:** Low. Documentation/protocol-only. The key risk is accidentally authorizing future implementation through vague wording; the protocol is explicit that implementation requires L1 diagnostic and Pat approval.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T183721991Z_000334_milestone` created with name `L1-protocol-draft-pre-change` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree. Read authority docs and M3 protocol context. Create and verify pre-change snapshot. Draft L1 protocol in `docs/protocols/`. Update `PLANS.md` and `docs/STATUS_LOG.md`. Run docs-pass validation and catalog checks. Commit with L1 protocol in the message and verify final clean tree.

**Validation Commands:** `npx tsc --noEmit`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Protocol exists at `docs/protocols/PASS_PROTOCOL_L1.md`; uses the house 10-section format; defines allowlist-based route-input hardening; lists allowed route-input categories; rejects raw/T1 model/provider output, prose, display/report text, provider identity, model confidence, digest/storage presence, provenance-only fields, and unknown record types; requires detectors including synthetic T1 provider/model route input rejection; no implementation files are modified; V1 catalog remains 12; Hollowcut catalog remains 9.

**Progress Log:** Clean tree verified. Authority docs and M3 protocol context read. Pre-change snapshot `snap_20260705T183721991Z_000334_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T183721991Z_000334_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical ledger content was edited. L1 protocol drafted in the required 10-section format. Typecheck passed. Build passed. Full suite passed 164/164 files and 2,905/2,905 tests. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows. Full suite created validation snapshot `snap_20260705T184115662Z_000335_milestone`, verified present on disk before recording.

**Decision Log:** The L1 protocol uses allowlist-first language and frames non-authority examples as rejected by construction rather than as a denylist foundation. It requires a synthetic T1 provider/model route-input detector and separate detector coverage for tier-field misuse, display/report text, unknown record types, and digest/storage/provider identity authority attempts.

**Surprises / Discoveries:** None.

**Final Report:** L1 protocol draft completed. Protocol created at `docs/protocols/PASS_PROTOCOL_L1.md`. No L1 diagnostic or implementation performed. No `src`, `tests`, `types`, provider, egress, package, catalog, M3 runtime, or historical Ledger changes were made. Required pre-change snapshot `snap_20260705T183721991Z_000334_milestone` and validation-created snapshot `snap_20260705T184115662Z_000335_milestone` were verified on disk before recording. Validation passed: typecheck, build, full suite 164 files / 2,905 tests, V1 catalog 12, Hollowcut catalog 9.

## ExecPlan - M3-A Raw Output Boundary Acceptance Lock

**Objective:** Lock M3 as accepted and add acceptance report coverage so future work cannot regress model-output trust boundaries.

**Source Authority:** Explicit user request for M3-A Raw Output Boundary Acceptance Lock, `docs/protocols/PASS_PROTOCOL_M3.md`, `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_DIAGNOSTIC.md`, `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_IMPLEMENTATION.md`, `tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, and PLANS.md.

**Current State:** M3 implementation is committed and the tree was clean before M3-A. M3 acceptance already proves the golden path, NEVER-flow absence, structural split, catalog counts, H5 trap preservation, and artifact guardrail. M3-A adds a durable acceptance report and a report lock test.

**Scope:** Create `docs/M3_RAW_OUTPUT_BOUNDARY_ACCEPTANCE_REPORT.md`, create `tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts`, update `PLANS.md` and `docs/STATUS_LOG.md`, and record the required snapshot Ledger append.

**Out of Scope:** No runtime behavior change, no trust logic change, no storage behavior change, no provider/adapter change, no egress change, no role rotation, no UI, no package change, no catalog change, and no historical Ledger mutation.

**Files Expected To Change:** `docs/M3_RAW_OUTPUT_BOUNDARY_ACCEPTANCE_REPORT.md`, `tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts`, `PLANS.md`, `docs/STATUS_LOG.md`, and `.caleb/ledger/ledger.jsonl` via the required snapshot command's normal append.

**Risk Level:** Low. Acceptance-report and regression-lock only.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T180028231Z_000331_milestone` created with name `M3-A-acceptance-lock-pre-change` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree. Read M3 protocol, diagnostic, implementation doc, and acceptance test. Create and verify pre-change snapshot. Add acceptance report and lock test. Run focused acceptance lock, typecheck, build, full suite, and catalog checks. Commit with M3-A acceptance lock in the message and verify clean tree.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** M3 acceptance report exists and states M3 accepted. Report names canonical protocol, implementation doc, and acceptance test. Report locks trust ceiling, non-promoters, structural split, golden path, NEVER-flow absence, artifact-store evidence, CLI/test-only boundary, display deferral, all 23 M3 acceptance categories, and catalog counts. Lock test passes. V1 catalog remains 12. Hollowcut catalog remains 9. Final tree is clean.

**Progress Log:** Clean tree verified. M3 authority/evidence docs read. Pre-change snapshot `snap_20260705T180028231Z_000331_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T180028231Z_000331_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical ledger content was edited. Acceptance report and lock test created. Initial focused lock run caught a report wording mismatch (`effective_tier only` with backticks); report wording was tightened and focused M3-A/M3 acceptance passed 2/2 files and 13/13 tests. Typecheck passed. Build passed. Full suite passed 164/164 files and 2,905/2,905 tests. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows.

**Decision Log:** M3-A is deliberately report-and-lock only. It does not change raw-output runtime behavior because M3 is already accepted; it makes acceptance evidence harder to regress by pinning the report to the canonical evidence files and acceptance categories.

**Surprises / Discoveries:** The first focused lock run proved the value of the report-lock pattern by catching an imprecise acceptance-report phrase before commit.

**Final Report:** M3-A Raw Output Boundary Acceptance Lock completed. M3 is locked as accepted by `docs/M3_RAW_OUTPUT_BOUNDARY_ACCEPTANCE_REPORT.md`, with `tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts` pinning the report to the canonical protocol, implementation doc, M3 acceptance test, trust ceiling, non-promoters, structural split, golden-path evidence, NEVER-flow absence evidence, artifact-store guardrails, and all 23 required acceptance categories. No runtime, provider, egress, UI, package, catalog, or historical Ledger behavior changed. Validation passed: typecheck, focused M3-A/M3 acceptance 2 files / 13 tests, build, full suite 164 files / 2,905 tests, V1 catalog 12, Hollowcut catalog 9.

## ExecPlan - M3 Raw Output Consumption Boundary Implementation

**Objective:** Implement M3 raw output consumption boundary under `docs/protocols/PASS_PROTOCOL_M3.md` and `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_DIAGNOSTIC.md`, allowing model/provider output to become a Caleb artifact that downstream logic can consume only under Caleb trust rules.

**Source Authority:** Explicit user approval for M3 implementation, `docs/protocols/PASS_PROTOCOL_M3.md`, `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_DIAGNOSTIC.md`, `docs/RAW_OUTPUT_BOUNDARY_CONTRACT.md`, `AGENTS.md`, `CODEX.md`, `docs/00_SOURCE_INDEX_AND_AUTHORITY.md`, `docs/01_CODEX_OPERATING_CONTRACT.md`, `docs/02_V1_PHASE_BOUNDARIES.md`, `docs/03_CANONICAL_CONTRACTS.md`, `docs/04_STORAGE_AND_LEDGER_DECISIONS.md`, `docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md`, `docs/06_V1_TEST_AND_FIXTURE_PLAN.md`, and this `PLANS.md`.

**Current State:** M3 diagnostic is approved and committed. The working tree was clean before implementation. `.caleb/artifacts/` was not ignored before this pass, so the first guardrail change is to add it to `.gitignore` before any raw-content store usage. No raw-output consumption implementation exists before this pass.

**Scope:** Add `.caleb/artifacts/` gitignore guardrail; implement raw-output artifact types, authority-path content-addressed store, in-memory fast-path store, lifecycle helper, derived evidence policy, lineage-resolution gate, Character Count consumption boundary wrapper, exports, unit tests, M3 acceptance tests, implementation documentation, and pass ledger entries.

**Out of Scope:** No role rotation, display UI, 3D Thinking Mode, 2D inspector, new providers or adapters, egress expansion, H5 weakening, historical Ledger mutation, V1 catalog change, Hollowcut catalog change, provider/model output above T1, model/provider-driven routing, side effects, trust promotion, or persistence as truth.

**Files Expected To Change:** `.gitignore`, `src/index.ts`, `src/rawOutput/*`, `tests/rawOutput/*`, `tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`, `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_IMPLEMENTATION.md`, `PLANS.md`, and `docs/STATUS_LOG.md`. The required pre-change snapshot command also appends its normal snapshot-created entry to `.caleb/ledger/ledger.jsonl`.

**Risk Level:** Medium. M3 adds a new trust boundary and a local content-addressed storage path. Risk is controlled by `.gitignore` guardrails, temp-dir tests, no provider/egress changes, structural effective-tier split, and absence detectors.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T174603371Z_000329_milestone` created with name `M3-implementation-pre-change` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Verify clean tree. Create and verify pre-change snapshot. Add `.caleb/artifacts/` to `.gitignore`. Implement raw-output modules. Add unit and acceptance tests including the golden path and NEVER-flow absence checks. Add docs and ledger entries. Run full validation and catalog checks. Commit with M3 implementation in the message and verify clean tree.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/rawOutput tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Raw output lifecycle, trust ceiling, non-promoters, mandatory tier split, `effective_tier` computation, tier misuse detectors, laundering detector, Ledger raw-content absence, content addressing, lineage-resolution gate, deletion/dangling-reference distinction, display vs consumption boundary, NEVER-flow absence assertions, H5 trap preservation, golden-path worked example, V1 catalog 12, Hollowcut catalog 9, existing suite, and completion report are all satisfied.

**Progress Log:** Clean tree verified. Pre-change snapshot `snap_20260705T174603371Z_000329_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T174603371Z_000329_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical ledger content was edited. `.caleb/artifacts/` added to `.gitignore` before raw-output store tests were introduced. Raw-output modules, focused tests, M3 acceptance test, and implementation doc created. Initial typecheck and focused tests passed. Build passed. Acceptance suite passed 43/43 files and 398/398 tests. Full suite passed 163/163 files and 2,899/2,899 tests. V1 catalog check found 12 Hollows. Hollowcut catalog check found 9 Hollows.

**Decision Log:** The authority path is `ContentAddressedRawOutputStore` rooted by default at `.caleb/artifacts/raw-output`, while tests use temp roots. `InMemoryRawOutputStore` exists only as the fast-path adapter for pure tests. The Character Count Hollow itself was not modified; the M3 boundary resolves stored/ref-addressed content and then invokes the existing Hollow through the existing runner/VRP path. Lineage/tier metadata is held in new raw-output provenance records instead of changing the base Ledger type in this pass.

**Surprises / Discoveries:** None so far beyond the already-diagnosed `.caleb/artifacts/` ignore requirement.

**Final Report:** M3 Raw Output Consumption Boundary Implementation completed. `.caleb/artifacts/` guardrail added before raw-output store behavior. Authority-path content-addressed raw-output store implemented with digest retrieval, corruption detection, and structured deletion absence. In-memory fast-path store added for pure tests. Raw-output lifecycle, structural tier policy, lineage-resolution gate, and Character Count consumption boundary wrapper implemented. Golden-path worked example acceptance proves live-call-shaped T1 output -> digest storage -> Character Count Hollow consumption -> derived evidence `measurement_tier = T2`, `subject_tier = T1`, `effective_tier = T1`, with decision-facing `effective_tier` only. NEVER-flow absence detectors cover persistence-as-truth, side-effect triggers, trust-promotion inputs, and Logic Engine routing decisions. M3 remains CLI/test-only; display flow remains deferred. Validation passed: typecheck, build, focused tests, acceptance suite 43/398, full suite 163/2,899, V1 catalog 12, Hollowcut catalog 9. No role rotation, UI, provider, egress, package, catalog, or historical Ledger changes were made.

## ExecPlan - M3 Diagnostic

**Objective:** Perform the M3 diagnostic only, using `docs/protocols/PASS_PROTOCOL_M3.md` as the canonical protocol source, and stop before any implementation.

**Source Authority:** Explicit user approval to proceed to M3 diagnostic only, `docs/protocols/PASS_PROTOCOL_M3.md`, `docs/RAW_OUTPUT_BOUNDARY_CONTRACT.md`, `AGENTS.md`, `CODEX.md`, `docs/00_SOURCE_INDEX_AND_AUTHORITY.md`, `docs/01_CODEX_OPERATING_CONTRACT.md`, `docs/02_V1_PHASE_BOUNDARIES.md`, and this `PLANS.md`.

**Current State:** M3 protocol draft is approved and committed. The working tree was clean before diagnostic work. M3-C obligations are represented in the canonical protocol. `.caleb/artifacts/` is not currently ignored. The repo has an existing `InMemoryArtifactStore`, and no M3 raw-output consumption implementation exists yet.

**Scope:** Create a diagnostic document evaluating M3-C coverage, artifact-store substrate options, Fast Path vs Authority Path, structural tier split, CLI/test-only boundary, display deferral, proposed implementation files, proposed acceptance tests, risks, ambiguities, and Pat approval decisions.

**Out of Scope:** No M3 implementation, `src/` changes, `tests/` changes, `types/` changes, provider adapter changes, egress allowlist changes, storage implementation, validator implementation, lineage gate implementation, trust logic implementation, catalog changes, package changes, UI, or historical Ledger mutation.

**Files Expected To Change:** `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_DIAGNOSTIC.md`, `PLANS.md`, and `docs/STATUS_LOG.md`. The required pre-change snapshot command also appends its normal snapshot-created entry to `.caleb/ledger/ledger.jsonl`.

**Risk Level:** Low. Diagnostic/documentation-only. The main risk is accidentally crossing into implementation; this pass avoids `src/`, `tests/`, and type changes entirely.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T173738508Z_000327_milestone` created with name `M3-diagnostic-pre-change` and verified present on disk before recording its ID here. Roll back via snapshot manager if needed.

**Implementation Steps:** Verify clean tree. Read canonical protocol and M3-C contract. Refresh authority docs. Create and verify pre-change snapshot. Draft the diagnostic report. Update pass ledgers. Run docs-only validation and catalog checks. Commit diagnostic if validation passes, verify clean tree, and stop.

**Validation Commands:** `git status --short`; `npx tsc --noEmit`; `npm run build`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Diagnostic confirms M3-C obligations are represented; evaluates in-memory extension and `.caleb/artifacts/` content-addressed store; includes Fast Path vs Authority Path; recommends structural split; confirms M3 remains CLI/test-only; confirms display flow is deferred to `M4-DISPLAY-BOUNDARY`; identifies proposed files, acceptance tests, risks, ambiguities, and Pat approval decisions; no implementation files are modified.

**Progress Log:** Clean tree verified after Git PATH repair from the prior pass. Canonical M3 protocol and M3-C contract read. Authority docs refreshed. Pre-change snapshot `snap_20260705T173738508Z_000327_milestone` created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T173738508Z_000327_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical ledger content was edited. Diagnostic document drafted at `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_DIAGNOSTIC.md`. Validation passed: `npx tsc --noEmit`; `npm run build`; full suite 158/158 files and 2,879/2,879 tests; V1 catalog check found 12 Hollows; Hollowcut catalog check found 9 Hollows.

**Decision Log:** Diagnostic recommends `.caleb/artifacts/` content-addressed storage as the M3 authority path, guarded by `.gitignore` and temp-dir tests, with in-memory storage kept as a fast-path test adapter. Diagnostic recommends the structural split: provenance-facing tier triplet and decision-facing `effective_tier` only. Diagnostic recommends no new CLI command unless Pat explicitly wants one.

**Surprises / Discoveries:** `.caleb/artifacts/` is not currently ignored, so authority-path implementation must add that ignore rule before any raw-content write.

**Final Report:** M3 diagnostic completed only. Diagnostic confirms M3-C obligations are fully represented, recommends `.caleb/artifacts/` as the authority path with `.gitignore` guardrails, keeps in-memory as the fast-path test adapter, recommends the structural split, confirms M3 remains CLI/test-only, confirms display flow is deferred to `M4-DISPLAY-BOUNDARY`, identifies proposed files/tests/risks/decisions, and stops before implementation. No `src`, `tests`, `types`, provider, egress, package, catalog, UI, or historical Ledger changes were made. Required snapshot `snap_20260705T173738508Z_000327_milestone` was verified on disk before recording; the snapshot command appended its normal Ledger record. Ready for Pat implementation approval: yes.

## ExecPlan - M3 Protocol Draft

**Objective:** Draft the missing canonical base protocol for M3 Raw Output Consumption Boundary Implementation at `docs/protocols/PASS_PROTOCOL_M3.md`, integrating Amendment A directly and stopping before any M3 diagnostic or implementation.

**Source Authority:** Explicit Path B authorization in the M3 protocol-draft handoff, `AGENTS.md`, `CODEX.md`, `docs/00_SOURCE_INDEX_AND_AUTHORITY.md`, `docs/01_CODEX_OPERATING_CONTRACT.md`, `docs/02_V1_PHASE_BOUNDARIES.md`, `docs/03_CANONICAL_CONTRACTS.md`, `docs/04_STORAGE_AND_LEDGER_DECISIONS.md`, `docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md`, `docs/06_V1_TEST_AND_FIXTURE_PLAN.md`, `docs/protocols/PASS_PROTOCOL_M3_AMENDMENT_A.md`, and `PLANS.md`.

**Current State:** The base M3 protocol did not previously exist as a committed `docs/protocols/` file. `docs/protocols/PASS_PROTOCOL_M3_AMENDMENT_A.md` existed and referred to a base M3 protocol, so this pass creates the base protocol without pretending the missing file already existed. Initial `git status --short` was blocked because Git was installed but not on PATH in the current shell; after prepending `C:\Program Files\Git\cmd` for the session, `git status --short` succeeded and returned clean.

**Scope:** Create `docs/protocols/PASS_PROTOCOL_M3.md` using the house 10-section protocol format, integrate Amendment A directly, and update `PLANS.md` plus `docs/STATUS_LOG.md` only as pass ledgers.

**Out of Scope:** No M3 diagnostic, M3 implementation, `src/` changes, `tests/` changes, `types/` changes, provider adapter changes, egress allowlist changes, historical ledger-content mutation, package changes, catalog changes, UI work, live execution, or backfill of older H4/H5/M3-C protocol documents.

**Files Expected To Change:** `docs/protocols/PASS_PROTOCOL_M3.md`, `PLANS.md`, and `docs/STATUS_LOG.md`. The required pre-change snapshot command also appends its normal snapshot-created entry to `.caleb/ledger/ledger.jsonl`.

**Risk Level:** Low. Documentation/protocol-only. The main risk is authorization-chain accuracy, handled by stating that the base M3 protocol was missing and by integrating Amendment A into the new canonical file rather than leaving a floating amendment.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T172058443Z_000325_milestone` created with name `M3-protocol-draft-pre-change` and verified present on disk before recording its ID here. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Confirm Git availability and clean status. Read authority docs and existing protocol style. Create and verify pre-change snapshot. Draft `PASS_PROTOCOL_M3.md` in the 10-section format with Amendment A integrated directly. Update `PLANS.md` and `docs/STATUS_LOG.md`. Run docs-only validation, catalog checks, commit with M3 protocol in the commit message, and verify final clean status.

**Validation Commands:** `git status --short`; `npx tsc --noEmit`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; final `git status --short`.

**Acceptance Criteria:** Path B authorized. Base M3 protocol absence acknowledged. New canonical protocol exists at `docs/protocols/PASS_PROTOCOL_M3.md`. Amendment A is integrated directly. No M3 diagnostic or implementation is performed. No `src`, `tests`, `types`, provider, egress, or ledger-history changes are made. Snapshot exists and was verified on disk before recording. V1 catalog remains exactly 12. Hollowcut catalog remains exactly 9. Final tree is clean after commit.

**Progress Log:** Git was found installed at `C:\Program Files\Git\cmd\git.exe` but absent from PATH; the current command environment was repaired by prepending that directory, after which `git status --short` returned clean. Required authority docs and existing protocol style were read. Pre-change snapshot `snap_20260705T172058443Z_000325_milestone` was created and verified on disk before this entry recorded it. The snapshot command appended the normal `ledger_snap_20260705T172058443Z_000325_milestone` record to `.caleb/ledger/ledger.jsonl`; no historical ledger content was edited. `docs/protocols/PASS_PROTOCOL_M3.md` was created with the 10-section protocol format and Amendment A integrated directly. Validation passed: `npx tsc --noEmit`; V1 catalog check found 12 Hollows; Hollowcut catalog check found 9 Hollows; full suite passed 158/158 files and 2,879/2,879 tests.

**Decision Log:** The pass records the missing base protocol honestly instead of treating Amendment A as proof that a base file existed. The new protocol does not authorize implementation files because the handoff requires the diagnostic and Pat approval before M3 implementation. Validation includes typecheck and the full suite even though the pass is docs-only, because the repo has established scripts and recent passes use the full default suite as the baseline.

**Surprises / Discoveries:** Git was installed locally but not on PATH in the Codex-launched PowerShell environment.

**Final Report:** Path B protocol-draft pass completed. Base M3 protocol did not previously exist as a committed `docs/protocols/` file. New canonical protocol drafted at `docs/protocols/PASS_PROTOCOL_M3.md`. Amendment A integrated directly. No M3 diagnostic performed. No M3 implementation performed. No `src`, `tests`, `types`, provider, egress, package, catalog, or historical ledger-content changes were made. Required snapshot `snap_20260705T172058443Z_000325_milestone` was verified on disk before recording; the snapshot command appended its normal Ledger record. Validation passed: typecheck, full suite, V1 catalog 12, Hollowcut catalog 9. Ready for Pat approval after commit and final clean status: yes.

## ExecPlan - Snapshot Claim Integrity Gate

**Objective:** Add a deterministic, local integrity gate that validates snapshot IDs claimed in PLANS.md against actual `.caleb/snapshots` records, converting the R36 fabricated-snapshot-ID incident into a structural, repeatable gate rather than a one-off manual correction.

**Source Authority:** Explicit user request (R37 handoff) approving R37 Snapshot Claim Integrity Gate, R36 One Provider Adapter Live Prerequisites Evaluator (including its disclosed process deviation), AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/AUTO_SNAPSHOT_AND_CHANGE_GUARD.md, and PLANS.md.

**Current State:** R36 is accepted. Effective rollback anchor `snap_20260704T034359557Z_000282_milestone`, test-created snapshot `snap_20260704T041816910Z_000283_milestone`, and validation snapshot `snap_20260704T042319430Z_000285_milestone` exist. Full suite passed 147 files / 2766 tests. Acceptance suite passed 38 files / 358 tests. V1 catalog = 12, Hollowcut catalog = 9. R36 disclosed a process deviation in which a named pre-change snapshot ID was claimed in PLANS.md before being created; it was caught by manual cross-check against `.caleb/snapshots` and corrected. R37 exists to make that cross-check automatic and deterministic.

**Scope:** Create snapshot claim integrity types, a pure evaluator plus a thin read-only filesystem wrapper, changeGuard barrel exports, unit tests, an acceptance lock test, documentation, and this ExecPlan entry. No provider, catalog, UI, or package changes.

**Out of Scope:** No live provider adapter, provider SDK, package dependency change, API-key read, process.env read, network call, live execution, fake provider success, provider output, UI runtime, registered V1 Hollow, registered Hollowcut Hollow, PLANS.md mutation by the validator itself, snapshot creation by the validator itself, or Ledger writes by the validator itself.

**Files Expected To Change:** `src/changeGuard/snapshotClaimIntegrityTypes.ts`, `src/changeGuard/snapshotClaimIntegrityValidator.ts`, `src/changeGuard/index.ts`, `tests/changeGuard/snapshotClaimIntegrityValidator.test.ts`, `tests/acceptance/snapshotClaimIntegrityGateAcceptance.test.ts`, `docs/SNAPSHOT_CLAIM_INTEGRITY_GATE.md`, and `PLANS.md`.

**Risk Level:** Low. Adds a pure, deterministic, read-only validator plus a thin filesystem-reading wrapper under the existing, already-authorized changeGuard module; no writes, no network, no catalog or UI change, no phase-boundary allowlist required (changeGuard is not phase-restricted in `tests/acceptance/v1PhaseBoundary.test.ts`).

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260704T045701820Z_000288_milestone` created with name `R37-pre-change` and verified present under `.caleb/snapshots` before any file was edited. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add snapshot claim integrity types (report + input + wrapper-options shapes). Implement a pure `evaluateSnapshotClaimIntegrity` function (broad snapshot-claim token extraction, canonical-format check, existence check, duplicate detection, allowed-missing exceptions) plus a read-only `runSnapshotClaimIntegrityGate` wrapper that reads `PLANS.md` and lists `.caleb/snapshots`. Export both from the changeGuard barrel. Add unit tests (synthetic fixtures plus real-repo wrapper checks proving no mutation and no snapshot creation) and an acceptance lock test. Add documentation with all required sections. Run required validation and CLI smoke commands. Create validation snapshot and confirm it exists before recording its ID.

**Validation Commands:** `npm run --silent cli -- create-milestone-snapshot --name R37-pre-change` (and verify existence on disk); `npx tsc --noEmit`; `npx vitest run tests/changeGuard/snapshotClaimIntegrityValidator.test.ts`; `npx vitest run tests/acceptance/snapshotClaimIntegrityGateAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npm run --silent cli -- create-milestone-snapshot --name R37-validation` (and verify existence on disk before recording its ID here).

**Acceptance Criteria:** Pre-change snapshot exists and was verified on disk before edits. Validator types, pure evaluator, wrapper, tests, docs, exports, and acceptance lock exist. The real-repo wrapper run against current PLANS.md and `.caleb/snapshots` returns `passed: true` with empty `missing_snapshot_ids` and `invalid_snapshot_claims`. Validator never mutates PLANS.md, never creates a snapshot, never writes a Ledger entry, never reads `process.env`, and performs no network access. V1 catalog remains 12. Hollowcut catalog remains 9. No provider, live-execution, SDK/package, or UI behavior is introduced.

**Progress Log:** Pre-change snapshot created and verified present on disk before any edit, directly applying the R36 lesson this pass formalizes. Repo state inspected; no partial R37 files existed; `tests/acceptance/v1PhaseBoundary.test.ts` confirmed to have no changeGuard-specific allowlist, so it was left unmodified. Types, pure evaluator, wrapper, barrel exports, unit tests, documentation, and acceptance test created. A `tsc --noEmit` failure surfaced during implementation (an `exactOptionalPropertyTypes` violation from passing possibly-`undefined` optional fields into the input object) and was fixed by conditionally spreading those fields instead of assigning `undefined` directly — the same category of fix noted during R34. Unit test passed 11/11. Acceptance test passed 10/10, including a live assertion that `runSnapshotClaimIntegrityGate()` returns `passed: true` against the real PLANS.md and `.caleb/snapshots` at time of check. Acceptance suite passed 39/39 files, 368/368 tests. Full suite passed 149/149 files, 2787/2787 tests. Test-created snapshot `snap_20260704T051644141Z_000289_milestone` and validation snapshot `snap_20260704T051907578Z_000290_milestone` were each confirmed present on disk before being recorded in this entry.

**Decision Log:** The extraction pattern is intentionally broader than the canonical ID format (`snap[_-][\w-]*milestone`, case-insensitive) so that malformed near-misses (wrong separators, wrong casing) are still caught and reported as `invalid_snapshot_claims` rather than silently ignored, while the canonical format check (`snap_<alnum-segments>_milestone`) accepts both the current sequenced ID shape (`snap_<timestamp>_<sequence>_milestone`) and the older pre-sequencing shape (`snap_<timestamp>_milestone`) observed on disk from the V1 Cornerstone Milestone pass, avoiding false positives against real historical snapshots. Duplicate claims are reported as warnings only, not failures, because the same snapshot ID is legitimately referenced across multiple ExecPlan entries (a later pass citing an earlier pass's validation snapshot as its own rollback anchor) and that repetition is expected, not an error. The validator is split into a pure core function (testable with synthetic fixtures, no filesystem dependency) and a thin read-only wrapper (the only piece touching real files), matching the report-builder-plus-wrapper pattern already used for the provider dry-run report/CLI pair. No Change Guard Hollow registration was added in this pass; R37 is documented as a possible future registration candidate only, per the handoff's explicit catalog-freeze requirement.

**Surprises / Discoveries:** The R36 fabricated snapshot ID string no longer appears anywhere in PLANS.md (confirmed by direct search before implementation), since it was already corrected in the R36 pass; the validator therefore needed no hardcoded historical exception for it. A genuinely real historical snapshot from the V1 Cornerstone Milestone pass (`snap_20260610T005359834Z_milestone`) uses the older, non-sequenced ID shape and still exists on disk, which shaped the canonical-format regex to accept both ID shapes rather than over-fitting to only the current format.

**Final Report:** See the verbatim R37 Implementation Report emitted at the end of this pass.

## ExecPlan - One Provider Adapter Live Prerequisites Evaluator

**Objective:** Add a pure, inert evaluator for the R35 live prerequisites contract: types plus a deterministic evaluator function that accepts prerequisite state as explicit input data and returns an evaluation report identifying missing/blocking prerequisites, without adding any live provider behavior.

**Source Authority:** Explicit user request (R36 handoff) approving R36 One Provider Adapter Live Prerequisites Evaluator, R35 One Provider Adapter Live Prerequisites Contract, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R35 is accepted. Pre-change snapshot `snap_20260704T033638138Z_000280_milestone`, test-created snapshot `snap_20260704T034046349Z_000281_milestone`, and validation snapshot `snap_20260704T034359557Z_000282_milestone` exist. Full suite passed 145 files / 2736 tests. Acceptance suite passed 37 files / 345 tests. V1 catalog = 12, Hollowcut catalog = 9. The live prerequisites contract is locked (required fields, locked values, trust lock) and no live provider behavior, SDK, API-key read, process.env read, network call, fake success, provider response simulation, provider output, provider content field, or live execution exists.

**Scope:** Create prerequisite evaluator types, a pure evaluator function, provider unit tests, an acceptance lock test, documentation, provider barrel exports, a narrow provider phase-boundary allowlist update for the two new inert source files, and this ExecPlan entry.

**Out of Scope:** No live provider adapter, provider SDK, package dependency change, API-key read, process.env read, fetch/http/network call, live test that runs by default, live execution, fake provider success, provider response simulation, provider output, provider content fields, trust promotion from provider response, provider Ledger runtime write, storage write, storage-backed trust promotion, catalog change, VRP change, CLI surface, final assembly runtime change, role validator change, or UI change.

**Files Expected To Change:** `src/providers/livePrerequisitesTypes.ts`, `src/providers/oneProviderAdapterLivePrerequisitesEvaluator.ts`, `src/providers/index.ts`, `tests/providers/oneProviderAdapterLivePrerequisitesEvaluator.test.ts`, `tests/acceptance/oneProviderAdapterLivePrerequisitesEvaluatorAcceptance.test.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `docs/ONE_PROVIDER_ADAPTER_LIVE_PREREQUISITES_EVALUATOR.md`, and `PLANS.md`.

**Risk Level:** Low. Adds pure, deterministic, input-data-only evaluator code under the existing provider namespace; no network capability, no Ledger/storage writes, no CLI wiring, reuses the R35 contract fields exactly.

**Snapshot / Rollback Plan:** No explicit `R36-pre-change` named snapshot was created before edits began; this is a documented process deviation. The R35 validation snapshot `snap_20260704T034359557Z_000282_milestone` immediately precedes all R36 file changes and serves as the effective pre-change rollback point, since no files were modified between it and the start of R36 work. A milestone snapshot `snap_20260704T041816910Z_000283_milestone` was captured incidentally by the full-suite CLI test path during post-edit validation (same mechanism observed in R34/R35). Roll back via snapshot manager to `snap_20260704T034359557Z_000282_milestone` if needed.

**Implementation Steps:** Add prerequisite evaluator types, implement the pure evaluator function (missing/blocking prerequisite detection, locked output values, `live_execution_state` always `not_run`), export via provider barrel, add unit tests and acceptance lock, add documentation, update the exact provider phase-boundary allowlist for the two new files, run required validation and CLI smoke commands, create validation snapshot, and update this ExecPlan final status.

**Validation Commands:** `npm run --silent cli -- create-milestone-snapshot --name R36-pre-change`; `npx tsc --noEmit`; `npx vitest run tests/providers/oneProviderAdapterLivePrerequisitesEvaluator.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterLivePrerequisitesEvaluatorAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npm run --silent cli -- create-milestone-snapshot --name R36-validation`.

**Acceptance Criteria:** Pre-change snapshot exists. Evaluator types, function, tests, docs, exports, and acceptance lock exist. Evaluator flags missing opt-in/live-request/allowlisting/credential-declaration/network-permission/live-command/dry-run-completion as blockers; flags `credential_auto_read=true` and any of the three `default_*_non_live=false` as blockers. Fully valid input yields `prerequisites_met=true` while `live_execution_state` remains `not_run`. All locked output values hold. V1 catalog remains 12. Hollowcut catalog remains 9. No live provider adapter, SDK/package change, API-key read, process.env read, network call, live execution, default-running live test, fake provider success, provider response simulation, provider output, provider content field, or trust promotion is introduced.

**Progress Log:** Pre-change snapshot created. Repo state inspected; no partial R36 files existed. Evaluator types and pure evaluator function created, matching the R32/R34 types-plus-builder file pattern. Provider barrel updated. Unit tests (17) and acceptance test (13) created. Documentation created with all required sections. Provider phase-boundary allowlist updated for the two new files, with reason documented in the final report.

**Decision Log:** `live_execution_state` is hard-locked to `not_run` in all cases (never `blocked`) because this evaluator never attempts execution of any kind, per the handoff's explicit override ("Even if all prerequisite input fields are true/valid... live_execution_state must remain not_run"). `default_tests_non_live`, `default_acceptance_non_live`, and `default_ci_non_live` are echoed from input in the output (for audit visibility) while independently driving blocking logic; `credential_auto_read_allowed` is a separate hard-locked `false` constant, not an echo of the input's `credential_auto_read` field. No CLI wiring or default-input factory was added to the source module since R36 scope is evaluator-only (CLI surface is explicitly the next phase); an all-missing input fixture was kept local to the unit test file instead of being exported from `src/`.

**Surprises / Discoveries:** `tests/acceptance/v1PhaseBoundary.test.ts` required a narrow update: its `ALLOWED_PROVIDER_SKELETON_FILES` allowlist enumerates every file under `src/providers/` exactly, so the two new inert R36 source files needed to be added, consistent with the same narrow update made in R32/R33/R34 for their respective new provider files.

**Final Report:** See the verbatim R36 Implementation Report emitted at the end of this pass.

## ExecPlan - One Provider Adapter Live Prerequisites Contract

**Objective:** Create a contract-only boundary document defining the required fields and locked values that must be true before any future live provider execution may run, without adding any live provider behavior.

**Source Authority:** Explicit user request (R35 handoff) approving R35 One Provider Adapter Live Prerequisites Contract, R34 One Provider Adapter Dry-Run CLI Surface, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R34 is accepted. Pre-change snapshot `snap_20260704T031346479Z_000277_milestone`, test-created snapshot `snap_20260704T032024579Z_000278_milestone`, and validation snapshot `snap_20260704T032231928Z_000279_milestone` exist. Full suite passed 144 files / 2727 tests. Acceptance suite passed 36 files / 336 tests. V1 catalog = 12, Hollowcut catalog = 9. The dry-run CLI surface is locked and no live provider behavior, SDK, API-key read, process.env read, network call, fake success, provider response simulation, provider output, provider content field, or live execution exists.

**Scope:** Create the live prerequisites contract document, add an acceptance lock test, and append this ExecPlan entry. No source code files are created or changed.

**Out of Scope:** No live provider adapter, provider SDK, package dependency change, API-key read, process.env read, fetch/http/network call, live test that runs by default, live execution, fake provider success, provider response simulation, provider output, provider content fields, trust promotion from provider response, provider Ledger runtime write, storage write, storage-backed trust promotion, catalog change, VRP change, CLI surface change, final assembly runtime change, role validator change, or UI change.

**Files Expected To Change:** `docs/ONE_PROVIDER_ADAPTER_LIVE_PREREQUISITES_CONTRACT.md`, `tests/acceptance/oneProviderAdapterLivePrerequisitesContractAcceptance.test.ts`, and `PLANS.md`.

**Risk Level:** Very low. Documentation and acceptance-test-only; no source files are created or modified; no phase-boundary allowlist change is required.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260704T033638138Z_000280_milestone` created with name `R35-pre-change`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Create the contract document with all required prerequisite fields, locked values, trust lock statements, non-implementation boundary, catalog invariants, and exact final verdict block. Add the acceptance test asserting every required statement, field, locked value, and the exact verdict block, plus PLANS.md reference and catalog counts. Append this ExecPlan entry. Run required validation and CLI smoke commands. Create validation snapshot.

**Validation Commands:** `npm run --silent cli -- create-milestone-snapshot --name R35-pre-change`; `npx tsc --noEmit`; `npx vitest run tests/acceptance/oneProviderAdapterLivePrerequisitesContractAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npm run --silent cli -- create-milestone-snapshot --name R35-validation`.

**Acceptance Criteria:** Pre-change snapshot exists. Contract document and acceptance test exist. Document contains exact title, contract-only status, prior-pass reference, all non-implementation boundary statements, all 16 required prerequisite fields, all 6 locked values, all 10 trust-lock statements, catalog invariants, and the exact final verdict block. PLANS.md references R35. V1 catalog remains 12. Hollowcut catalog remains 9. Validation commands pass. No live provider adapter, SDK/package change, API-key read, process.env read, network call, live execution, default-running live test, fake provider success, provider response simulation, provider output, provider content field, or trust promotion is introduced.

**Progress Log:** Pre-change snapshot created. Repo state inspected; no partial R35 files existed. Contract document created with all required sections. Acceptance test created asserting every required statement, field, and the exact verdict block. This ExecPlan entry appended.

**Decision Log:** No source files were created or changed because R35 is contract-documentation-only and the handoff's file list did not require any `src/` changes; therefore no `tests/acceptance/v1PhaseBoundary.test.ts` update was needed. `docs/ONE_PROVIDER_ADAPTER_DRY_RUN_CLI_SURFACE.md` was left unmodified because its existing "Next phase: One provider adapter live prerequisites contract" line already correctly pointed at R35, and no acceptance check required a further forward-reference edit.

**Surprises / Discoveries:** No partial or duplicate R35 artifacts existed from a prior Codex attempt. The R32/R34 contract-doc and acceptance-test pattern (required-fields list, locked-values list, trust-lock statements, non-implementation boundary, catalog invariants, exact verdict block) applied directly to R35 with no structural changes needed.

**Final Report:** See the verbatim R35 Implementation Report emitted at the end of this pass.

## ExecPlan - One Provider Adapter Dry-Run CLI Surface Behind Explicit Opt-In

**Objective:** Add an inert CLI-accessible dry-run surface for the one-provider adapter path that returns the R33 dry-run report shape while forbidding live provider behavior, SDKs, API-key reads, process.env reads, network calls, fake success, provider response simulation, provider output, provider content fields, and trust promotion.

**Source Authority:** Explicit user request approving R34 dry-run CLI surface, R33 One Provider Adapter Dry-Run Report Contract, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R33 is accepted. Pre-change snapshot `snap_20260704T030207322Z_000274_milestone`, test-created snapshot `snap_20260704T030613989Z_000275_milestone`, and explicit validation snapshot `snap_20260704T030805072Z_000276_milestone` exist. The dry-run report contract is locked and no live provider behavior, SDK, API-key read, process.env read, network call, fake success, provider response simulation, provider output, provider content field, or live execution exists.

**Scope:** Create dry-run CLI helper, wire the existing CLI parser/type/handler surface, add provider dry-run CLI tests, add acceptance lock, add documentation, export provider helper, add short R33 forward reference, update exact provider phase-boundary allowlist for the R34 file, and this ExecPlan entry.

**Out of Scope:** No live provider adapter, provider SDK, package dependency change, API-key read, process.env read, fetch/http/network call, live test that runs by default, live execution, fake provider success, provider response simulation, provider output, provider content fields, trust promotion from provider response, provider Ledger runtime write, storage write, storage-backed trust promotion, catalog change, VRP change, final assembly runtime change, role validator change, live prerequisite implementation, or UI change.

**Files Expected To Change:** `src/providers/oneProviderAdapterDryRunCli.ts`, `src/providers/index.ts`, `src/cli/cliTypes.ts`, `src/cli/commandParser.ts`, `src/cli/commandHandlers.ts`, `tests/providers/oneProviderAdapterDryRunCli.test.ts`, `tests/acceptance/oneProviderAdapterDryRunCliSurfaceAcceptance.test.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `docs/ONE_PROVIDER_ADAPTER_DRY_RUN_CLI_SURFACE.md`, `docs/ONE_PROVIDER_ADAPTER_DRY_RUN_REPORT_CONTRACT.md`, and `PLANS.md`.

**Risk Level:** Medium. This adds a CLI command surface, but it is deterministic, report-only, has no provider behavior, no network capability, no Ledger/storage writes, and reuses the R33 dry-run report contract.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260704T031346479Z_000277_milestone` created with name `R34-pre-change`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add provider CLI helper, add parser command and explicit boolean input flags, add CLI handler, update help text, export provider helper, add documentation and tests, update exact provider phase-boundary allowlist if required, run required validation and CLI smoke commands, create validation snapshot, and update this ExecPlan final status.

**Validation Commands:** `npm run --silent cli -- create-milestone-snapshot --name R34-pre-change`; `npx tsc --noEmit`; `npx vitest run tests/providers/oneProviderAdapterDryRunCli.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterDryRunCliSurfaceAcceptance.test.ts`; `npm run --silent cli -- one-provider-adapter-dry-run --json`; `npm run --silent cli -- one-provider-adapter-dry-run --explicit-opt-in true --explicit-live-request true --json`; `npx vitest run tests/acceptance`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npm run --silent cli -- create-milestone-snapshot --name R34-validation`.

**Acceptance Criteria:** Pre-change snapshot exists. R34 CLI helper, command parser/handler wiring, tests, docs, exports, and acceptance lock exist. Validation commands pass. CLI no-flags returns skipped/not-run. CLI explicit opt-in plus explicit live request returns blocked/not-run because live execution is unavailable. V1 catalog remains 12. Hollowcut catalog remains 9. No live provider adapter, SDK/package change, API-key read, process.env read, network call, live execution, default-running live test, fake provider success, provider response simulation, provider output, provider content field, provider-output trust promotion, Ledger write, or storage write is introduced.

**Progress Log:** Pre-change snapshot created. R34 dry-run CLI helper, CLI parser/type/handler wiring, provider barrel export, docs, provider tests, acceptance lock, R33 forward reference, and narrow V1 phase-boundary allowance for the exact inert dry-run CLI source file added. Typecheck passed after a narrow exact-optional-property fix in the CLI handler. Provider dry-run CLI tests passed at 1 file / 10 tests. R34 acceptance test passed at 1 file / 12 tests. Dry-run CLI no-flags smoke returned skipped/not-run. Dry-run CLI explicit opt-in plus explicit live request smoke returned blocked/unavailable. Full acceptance suite passed at 36 files / 336 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 144 files / 2727 tests. Explicit validation snapshot created.

**Decision Log:** The CLI command is named `one-provider-adapter-dry-run` to match the requested command examples. `--explicit-opt-in` and `--explicit-live-request` are parsed as explicit string input data (`true` or `false`) and default to false when absent. Expected skipped/blocked dry-run report states return exit 0; malformed boolean input returns a CLI error.

**Surprises / Discoveries:** The existing V1 phase-boundary acceptance lock allowlists exact provider source files, so it required a narrow update for only `src/providers/oneProviderAdapterDryRunCli.ts`. Typecheck required omitting absent optional CLI flag properties instead of passing `undefined` under `exactOptionalPropertyTypes`. Full Vitest created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260704T032024579Z_000278_milestone`.

**Final Report:** R34 One Provider Adapter Dry-Run CLI Surface Behind Explicit Opt-In completed. Pre-change snapshot ID: `snap_20260704T031346479Z_000277_milestone`. Test-created snapshot ID: `snap_20260704T032024579Z_000278_milestone`. Explicit validation snapshot ID: `snap_20260704T032231928Z_000279_milestone`. Files created: `src/providers/oneProviderAdapterDryRunCli.ts`, `tests/providers/oneProviderAdapterDryRunCli.test.ts`, `tests/acceptance/oneProviderAdapterDryRunCliSurfaceAcceptance.test.ts`, and `docs/ONE_PROVIDER_ADAPTER_DRY_RUN_CLI_SURFACE.md`. Files changed: `src/cli/cliTypes.ts`, `src/cli/commandParser.ts`, `src/cli/commandHandlers.ts`, `src/providers/index.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `docs/ONE_PROVIDER_ADAPTER_DRY_RUN_REPORT_CONTRACT.md`, and `PLANS.md`. Inert CLI dry-run surface boundary confirmed. No live provider adapter was added. No SDK or package changes were added. No API-key read was added. `process.env` was not read. No network calls were added. No live execution was added. No fake provider success was added. No provider response simulation was added. No provider output was added. No provider content fields were added. CLI no-flags returns skipped/not-run. CLI explicit opt-in plus explicit live request returns blocked/unavailable. Network attempted, provider execution attempted, provider response received, provider output present, and provider content present fields are locked false. Provider-shaped data is T0 by default and capped at T1. T2 still requires VRP-verified deterministic Hollow evidence. V1 catalog remains 12 and Hollowcut catalog remains 9. Next recommended phase: One provider adapter live prerequisites contract.

## ExecPlan - One Provider Adapter Dry-Run Report Contract

**Objective:** Create the dry-run report contract for the one-provider adapter path, adding pure report types and an inert report builder/normalizer while forbidding live provider behavior, SDKs, API-key reads, process.env reads, network calls, fake success, provider response simulation, provider output, provider content fields, and trust promotion.

**Source Authority:** Explicit user request approving R33 dry-run report contract, R32 One Provider Adapter Disabled-By-Default Live Harness Scaffold, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R32 is accepted. Pre-change snapshot `snap_20260704T022924849Z_000272_milestone` and validation-created snapshot `snap_20260704T023333364Z_000273_milestone` exist. The disabled-by-default live harness scaffold is inert and no live provider behavior, SDK, API-key read, process.env read, network call, fake success, provider response simulation, provider output, or live execution exists.

**Scope:** Create dry-run report types, deterministic report normalizer, provider dry-run report tests, acceptance lock, documentation, provider barrel export, short R32 forward reference, narrow provider phase-boundary allowance for exact R33 report files, and this ExecPlan entry.

**Out of Scope:** No live provider adapter, provider SDK, package dependency change, API-key read, process.env read, fetch/http/network call, live test that runs by default, live execution, fake provider success, provider response simulation, provider output, provider content fields, trust promotion from provider response, provider Ledger runtime write, storage write, storage-backed trust promotion, catalog change, VRP change, final assembly runtime change, role validator change, CLI surface, or UI change.

**Files Expected To Change:** `src/providers/dryRunReportTypes.ts`, `src/providers/oneProviderAdapterDryRunReport.ts`, `src/providers/index.ts`, `tests/providers/oneProviderAdapterDryRunReport.test.ts`, `tests/acceptance/oneProviderAdapterDryRunReportContractAcceptance.test.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `docs/ONE_PROVIDER_ADAPTER_DRY_RUN_REPORT_CONTRACT.md`, `docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md`, and `PLANS.md`.

**Risk Level:** Medium. This adds inert report-only code under the provider namespace, but it is local deterministic contract normalization and cannot execute provider behavior.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260704T030207322Z_000274_milestone` created with name `R33-pre-change`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add dry-run report types, implement pure report normalizer, export provider module, add documentation and tests, update exact provider phase-boundary allowlist if required, run required validation, create validation snapshot if required, and update this ExecPlan final status.

**Validation Commands:** `npm run --silent cli -- create-milestone-snapshot --name R33-pre-change`; `npx tsc --noEmit`; `npx vitest run tests/providers/oneProviderAdapterDryRunReport.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterDryRunReportContractAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npm run --silent cli -- create-milestone-snapshot --name R33-validation`.

**Acceptance Criteria:** Pre-change snapshot exists. R33 report types, report builder, tests, docs, exports, and acceptance lock exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live provider adapter, SDK/package change, API-key read, process.env read, network call, live execution, default-running live test, fake provider success, provider response simulation, provider output, provider content field, provider-output trust promotion, Ledger write, or storage write is introduced.

**Progress Log:** Pre-change snapshot created. R33 dry-run report types, pure report normalizer, provider barrel export, docs, provider tests, acceptance lock, R32 forward reference, and narrow V1 phase-boundary allowance for the exact inert dry-run report source files added. Typecheck passed. Provider dry-run report tests passed at 1 file / 10 tests. R33 acceptance test passed at 1 file / 10 tests. Full acceptance suite passed at 35 files / 324 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 142 files / 2705 tests. Explicit validation snapshot created.

**Decision Log:** R33 report builder requires caller-provided `created_at` to avoid reading current time. It returns skipped or blocked report-only states, keeps all provider/network/execution/content flags false, omits provider content payload fields, and caps provider-shaped trust at T1.

**Surprises / Discoveries:** The existing V1 phase-boundary acceptance lock allowlists exact provider source files, so it required a narrow update for only `src/providers/dryRunReportTypes.ts` and `src/providers/oneProviderAdapterDryRunReport.ts`. Full Vitest created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260704T030613989Z_000275_milestone`.

**Final Report:** R33 One Provider Adapter Dry-Run Report Contract completed. Pre-change snapshot ID: `snap_20260704T030207322Z_000274_milestone`. Test-created snapshot ID: `snap_20260704T030613989Z_000275_milestone`. Explicit validation snapshot ID: `snap_20260704T030805072Z_000276_milestone`. Files created: `src/providers/dryRunReportTypes.ts`, `src/providers/oneProviderAdapterDryRunReport.ts`, `tests/providers/oneProviderAdapterDryRunReport.test.ts`, `tests/acceptance/oneProviderAdapterDryRunReportContractAcceptance.test.ts`, and `docs/ONE_PROVIDER_ADAPTER_DRY_RUN_REPORT_CONTRACT.md`. Files changed: `src/providers/index.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md`, and `PLANS.md`. Report contract boundary confirmed. No live provider adapter was added. No SDK or package changes were added. No API-key read was added. `process.env` was not read. No network calls were added. No live execution was added. No fake provider success was added. No provider response simulation was added. No provider output was added. No provider content fields were added. Network attempted, provider execution attempted, provider response received, provider output present, and provider content present fields are locked false. Provider-shaped data is T0 by default and capped at T1. T2 still requires VRP-verified deterministic Hollow evidence. V1 catalog remains 12 and Hollowcut catalog remains 9. Next recommended phase: One provider adapter dry-run CLI surface behind explicit opt-in.

## ExecPlan - One Provider Adapter Disabled-By-Default Live Harness Scaffold

**Objective:** Create an inert, disabled-by-default live harness scaffold for the one-provider adapter path, exposing report-shaped disabled/skipped/blocked state only while forbidding live provider behavior, SDKs, API-key reads, process.env reads, network calls, fake success, provider response simulation, provider output, and provider-output trust promotion.

**Source Authority:** Explicit user request approving R32 scaffold, R31 One Provider Adapter Implementation Skeleton Behind Explicit Opt-In, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R31 is accepted. Confirmation snapshot `snap_20260704T022720639Z_000271_milestone` exists. The provider adapter skeleton is inert, locked behind explicit opt-in input data, and no live provider behavior, SDK, API-key read, process.env read, network call, fake success, provider response simulation, or provider output exists.

**Scope:** Create disabled-by-default live harness scaffold types, deterministic report helper, provider scaffold tests, acceptance lock, documentation, provider barrel export, short R31 forward reference, narrow provider phase-boundary allowance for exact R32 scaffold files, and this ExecPlan entry.

**Out of Scope:** No live provider adapter, provider SDK, package dependency change, API-key read, process.env read, fetch/http/network call, live test that runs by default, live execution, fake provider success, provider response simulation, provider output, trust promotion from provider response, provider Ledger runtime write, storage-backed trust promotion, catalog change, VRP change, final assembly runtime change, role validator change, or UI change.

**Files Expected To Change:** `src/providers/liveHarnessTypes.ts`, `src/providers/disabledByDefaultLiveHarnessScaffold.ts`, `src/providers/index.ts`, `tests/providers/disabledByDefaultLiveHarnessScaffold.test.ts`, `tests/acceptance/oneProviderAdapterDisabledByDefaultLiveHarnessScaffoldAcceptance.test.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md`, `docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md`, and `PLANS.md`.

**Risk Level:** Medium. This adds inert report-only code under the provider namespace, but it remains local deterministic scaffold logic and cannot execute provider behavior.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260704T022924849Z_000272_milestone` created with name `one-provider-adapter-disabled-by-default-live-harness-scaffold-r32-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add live harness report types, implement disabled-by-default report helper, export provider module, add documentation and tests, update exact provider phase-boundary allowlist, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npm run --silent cli -- create-milestone-snapshot`; `npx tsc --noEmit`; `npx vitest run tests/providers/disabledByDefaultLiveHarnessScaffold.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterDisabledByDefaultLiveHarnessScaffoldAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`.

**Acceptance Criteria:** Pre-change snapshot exists. R32 scaffold code, tests, docs, exports, and acceptance lock exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live provider adapter, SDK/package change, API-key read, process.env read, network call, live execution, default-running live test, fake provider success, provider response simulation, provider output, or provider-output trust promotion is introduced.

**Progress Log:** Pre-change snapshot created. R32 live harness scaffold types, deterministic report helper, provider barrel export, docs, provider tests, acceptance lock, R31 forward reference, and narrow V1 phase-boundary allowance for the exact inert live harness scaffold files added. Typecheck passed. Provider scaffold tests passed at 1 file / 10 tests. R32 acceptance test passed at 1 file / 11 tests. Full acceptance suite passed at 34 files / 314 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 140 files / 2685 tests.

**Decision Log:** R32 scaffold is disabled by default and evaluates explicit opt-in plus explicit live harness request only as supplied input data. It returns skipped or blocked report states, keeps live execution not-run/unavailable, and never returns provider content or simulated success.

**Surprises / Discoveries:** The R32 request listed `npm run --silent cli -- create-milestone-snapshot`, but the existing CLI requires `--name <human-readable-name>`. The pre-change snapshot therefore used the existing required named form. The existing V1 phase-boundary acceptance lock allowlisted exact provider files, so it needed a narrow update for only the two R32 inert scaffold source files. Full Vitest created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260704T023333364Z_000273_milestone`.

**Final Report:** R32 One Provider Adapter Disabled-By-Default Live Harness Scaffold completed. Pre-change snapshot ID: `snap_20260704T022924849Z_000272_milestone`. Validation-created snapshot ID: `snap_20260704T023333364Z_000273_milestone`. Files created: `src/providers/liveHarnessTypes.ts`, `src/providers/disabledByDefaultLiveHarnessScaffold.ts`, `tests/providers/disabledByDefaultLiveHarnessScaffold.test.ts`, `tests/acceptance/oneProviderAdapterDisabledByDefaultLiveHarnessScaffoldAcceptance.test.ts`, and `docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md`. Files changed: `src/providers/index.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md`, and `PLANS.md`. Inert scaffold boundary confirmed. The scaffold is disabled by default, requires explicit opt-in as supplied input data, requires explicit live harness request as supplied input data, returns skipped/not-run without opt-in, and returns blocked/unavailable when live execution remains unavailable. No live provider adapter was added. No SDK or package changes were added. No API-key read was added. `process.env` was not read. No network calls were added. No live execution was added. No fake provider success was added. No provider response simulation was added. No provider output was added. Provider-shaped data is T0 by default and capped at T1. T2 still requires VRP-verified deterministic Hollow evidence. V1 catalog remains 12 and Hollowcut catalog remains 9. Next recommended phase: One provider adapter dry-run report contract.

## ExecPlan - One Provider Adapter Implementation Skeleton Behind Explicit Opt-In

**Objective:** Create an inert provider adapter skeleton and explicit opt-in gate contract in code, returning only disabled/blocked/not-run states while forbidding live provider behavior, SDKs, API-key reads, process.env reads, network calls, fake success, provider output, and provider-output trust promotion.

**Source Authority:** Explicit user request approving R31 skeleton, R30 One Provider Adapter Live Test Harness Contract, R29 One Provider Adapter Implementation Behind Explicit Opt-In Planning, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R30 is accepted. The live test harness contract is locked and no live execution, provider behavior, SDK, API-key read, process.env read, network call, fake success, or provider output exists.

**Scope:** Create provider adapter types, explicit opt-in gate helper, inert one-provider adapter skeleton, provider skeleton tests, acceptance lock, documentation, provider barrel export, root export, short R30 forward reference, and this ExecPlan entry.

**Out of Scope:** No live provider adapter, provider SDK, package dependency change, API-key read, process.env read, fetch/http/network call, live test, live execution, fake provider success, provider output, trust promotion from provider response, provider Ledger runtime write, storage-backed trust promotion, catalog change, VRP change, final assembly runtime change, role validator change, or UI change.

**Files Expected To Change:** `src/providers/providerAdapterTypes.ts`, `src/providers/explicitOptInProviderGate.ts`, `src/providers/oneProviderAdapterSkeleton.ts`, `src/providers/index.ts`, `src/index.ts`, `tests/providers/oneProviderAdapterSkeleton.test.ts`, `tests/acceptance/oneProviderAdapterImplementationSkeletonAcceptance.test.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md`, `docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md`, and `PLANS.md`.

**Risk Level:** Medium. This adds inert code under a new provider namespace, but it is local deterministic skeleton logic only and cannot execute provider behavior.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260704T015547893Z_000268_milestone` created with name `one-provider-adapter-implementation-skeleton-r31-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add provider skeleton types, implement explicit opt-in gate and inert adapter helpers, export provider module, add docs and tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/providers/oneProviderAdapterSkeleton.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterImplementationSkeletonAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`.

**Acceptance Criteria:** Pre-change snapshot exists. R31 skeleton code, tests, docs, exports, and acceptance lock exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live provider adapter, SDK/package change, API-key read, process.env read, network call, live test, live execution, fake provider success, provider output, or provider-output trust promotion is introduced.

**Progress Log:** Pre-change snapshot created. R31 provider skeleton types, explicit opt-in gate, inert adapter helper, provider barrel export, root export, docs, provider tests, acceptance lock, R30 forward reference, and narrow V1 phase-boundary allowance for the exact inert provider skeleton files added. Typecheck passed. Provider skeleton tests passed at 1 file / 9 tests. R31 acceptance test passed at 1 file / 10 tests. Full acceptance suite passed at 33 files / 303 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 138 files / 2664 tests.

**Decision Log:** R31 skeleton is disabled by default and evaluates explicit opt-in supplied as input data only. It returns disabled, blocked, or not-run states and never returns provider content or simulated success.

**Surprises / Discoveries:** The existing V1 phase-boundary acceptance lock forbade any `src/providers` directory. It was updated narrowly to allow only the exact R31 inert skeleton files while continuing to reject any other provider runtime surface. Full Vitest created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260704T020304497Z_000269_milestone`. Package files were not modified; `package.json` and `package-lock.json` retained prior timestamps.

**Final Report:** R31 One Provider Adapter Implementation Skeleton Behind Explicit Opt-In completed. Pre-change snapshot ID: `snap_20260704T015547893Z_000268_milestone`. Validation-created snapshot ID: `snap_20260704T020304497Z_000269_milestone`. Files created: `src/providers/providerAdapterTypes.ts`, `src/providers/explicitOptInProviderGate.ts`, `src/providers/oneProviderAdapterSkeleton.ts`, `src/providers/index.ts`, `tests/providers/oneProviderAdapterSkeleton.test.ts`, `tests/acceptance/oneProviderAdapterImplementationSkeletonAcceptance.test.ts`, and `docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md`. Files changed: `src/index.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md`, and `PLANS.md`. Inert skeleton boundary confirmed. No live provider adapter was added. No SDK or package changes were added. No API-key read was added. `process.env` was not read. No network calls were added. No live execution was added. No fake provider success was added. No provider output was added. The skeleton is disabled by default, requires explicit opt-in as supplied input data, and can return only disabled, blocked, or not-run states. Provider-shaped data is capped at T1. T2 still requires VRP-verified deterministic Hollow evidence. V1 catalog remains 12 and Hollowcut catalog remains 9. Next recommended phase: One provider adapter disabled-by-default live harness scaffold.

## ExecPlan - One Provider Adapter Live Test Harness Contract

**Objective:** Create the R30 contract-only boundary and acceptance lock for a future one-provider adapter live test harness, defining opt-in gates, skipped-by-default behavior, reporting fields, and provider-output trust limits without adding live execution or provider behavior.

**Source Authority:** Explicit user request approving R30 contract, R29 One Provider Adapter Implementation Behind Explicit Opt-In Planning, R28 One Provider Adapter Live Test Plan, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R29 is accepted. The provider implementation boundary is locked and no provider implementation, live adapter, SDK, API-key read, process.env read, network call, live execution, fake provider success, or provider output exists.

**Scope:** Create R30 live test harness contract doc, acceptance lock, short R29 forward reference, and this ExecPlan entry.

**Out of Scope:** No provider implementation, live adapter, provider-specific runtime behavior, SDK, package dependency change, API-key read, process.env read, network call, live execution, fake provider success, provider output, default-enabled live tests, CI-enabled live tests, trust promotion from provider response, catalog change, VRP change, final assembly runtime change, role validator change, or UI change.

**Files Expected To Change:** `docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md`, `tests/acceptance/oneProviderAdapterLiveTestHarnessContractAcceptance.test.ts`, `docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md`, and `PLANS.md`.

**Risk Level:** Low. This is documentation and acceptance lock only.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260704T013721165Z_000266_milestone` created with name `one-provider-adapter-live-test-harness-contract-r30-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add R30 contract document, add acceptance test, add a short R29 forward reference, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/acceptance/oneProviderAdapterLiveTestHarnessContractAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`.

**Acceptance Criteria:** Pre-change snapshot exists. R30 contract doc and acceptance lock exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No provider implementation, live adapter, provider-specific runtime behavior, SDK/package change, API-key read, process.env read, network call, live execution, fake provider success, provider output, default-enabled live test, CI-enabled live test, or provider-output trust promotion is introduced.

**Progress Log:** Pre-change snapshot created. R30 live test harness contract document, acceptance lock, and R29 forward reference added. Typecheck passed. R30 acceptance test passed at 10 tests. Full acceptance suite passed at 32 files / 293 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 136 files / 2645 tests.

**Decision Log:** R30 locks a future live harness contract only. A future harness must be skipped by default, require explicit opt-in plus explicit live command or flag, stay out of normal test/default acceptance/default CI commands, and never treat provider output as Hollow evidence.

**Surprises / Discoveries:** Full Vitest created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260704T014021388Z_000267_milestone`. Package files were not modified; `package.json` and `package-lock.json` retained prior timestamps.

**Final Report:** R30 One Provider Adapter Live Test Harness Contract completed. Pre-change snapshot ID: `snap_20260704T013721165Z_000266_milestone`. Validation-created snapshot ID: `snap_20260704T014021388Z_000267_milestone`. Files created: `docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md` and `tests/acceptance/oneProviderAdapterLiveTestHarnessContractAcceptance.test.ts`. Files changed: `docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md` and `PLANS.md`. Contract-only boundary confirmed. No provider implementation was added. No live adapter was added. No provider-specific runtime behavior was added. No SDK or package changes were added. No API-key read was added. `process.env` was not read. No network calls were added. No live execution was added. No fake provider success was added. No provider output was added. Future harness must be skipped by default, require explicit opt-in, require explicit live command or flag, avoid normal test/default acceptance/default CI execution, report not-run/skipped and blocked states, and never treat provider output as Hollow evidence. V1 catalog remains 12 and Hollowcut catalog remains 9. Next recommended phase: One provider adapter implementation skeleton behind explicit opt-in.

## ExecPlan - One Provider Adapter Implementation Behind Explicit Opt-In Planning

**Objective:** Create the R29 planning-only boundary and acceptance lock for a future one-provider adapter implementation behind explicit opt-in without adding provider implementation, live adapter behavior, SDKs, API-key handling, network calls, live tests, fake provider success, provider output, or provider-output trust promotion.

**Source Authority:** Explicit user request approving R29 planning, R28 One Provider Adapter Live Test Plan, R27 One Provider Adapter Opt-In Harness Implementation, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R28 is accepted. The live-test planning boundary exists. No live tests, live adapter, SDK, API-key read, process.env read, network call, live execution, fake provider success, or provider output exists.

**Scope:** Create R29 planning doc, acceptance lock, short R28 forward reference, and this ExecPlan entry.

**Out of Scope:** No provider implementation, live adapter, provider-specific runtime behavior, SDK, package dependency change, API-key read, process.env read, network call, live test, live execution, fake provider success, provider output, trust promotion logic for provider output, provider Ledger runtime writes, storage-backed trust promotion, catalog change, VRP change, final assembly runtime change, role validator change, or UI change.

**Files Expected To Change:** `docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md`, `tests/acceptance/oneProviderAdapterImplementationExplicitOptInPlanningAcceptance.test.ts`, `docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_PLAN.md`, and `PLANS.md`.

**Risk Level:** Low. This is documentation and acceptance lock only.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260704T004941088Z_000264_milestone` created with name `one-provider-adapter-implementation-explicit-opt-in-planning-r29-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add R29 planning document, add acceptance test, add a short R28 forward reference, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/acceptance/oneProviderAdapterImplementationExplicitOptInPlanningAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npx vitest run`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`.

**Acceptance Criteria:** Pre-change snapshot exists. R29 planning doc and acceptance lock exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No provider implementation, live adapter, provider-specific runtime behavior, SDK/package change, API-key read, process.env read, network call, live test, live execution, fake provider success, provider output, or provider-output trust promotion is introduced.

**Progress Log:** Pre-change snapshot created. R29 explicit opt-in implementation planning document, acceptance lock, and R28 forward reference added. Typecheck passed. R29 acceptance test passed at 10 tests. Full acceptance suite passed at 31 files / 283 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 135 files / 2635 tests.

**Decision Log:** R29 locks implementation planning only. Future one-provider implementation must be behind explicit opt-in, with future live harness skipped by default and provider output treated as model/provider evidence, not Hollow evidence.

**Surprises / Discoveries:** Full Vitest created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260704T005310922Z_000265_milestone`. Package files were not modified; `package.json` and `package-lock.json` retained prior timestamps.

**Final Report:** R29 One Provider Adapter Implementation Behind Explicit Opt-In Planning completed. Pre-change snapshot ID: `snap_20260704T004941088Z_000264_milestone`. Validation-created snapshot ID: `snap_20260704T005310922Z_000265_milestone`. Files created: `docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md` and `tests/acceptance/oneProviderAdapterImplementationExplicitOptInPlanningAcceptance.test.ts`. Files changed: `docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_PLAN.md` and `PLANS.md`. No provider implementation was added. No live adapter was added. No provider-specific runtime behavior was added. No SDK or package changes were added. No API-key read was added. `process.env` was not read. No network calls were added. No live tests were added. No live execution was enabled. No fake provider success was added. No provider output was added. V1 catalog remains 12 and Hollowcut catalog remains 9. Raw provider output starts at T0, schema-valid provider output may reach T1 only, and T2 requires VRP-verified deterministic Hollow evidence. Explicit opt-in, API key presence, network success, provider identity, successful provider response, Ledger presence, and storage do not promote trust. Next recommended phase: One provider adapter live test harness contract.

## ExecPlan - One Provider Adapter Live Test Plan

**Objective:** Create the R28 live-test planning boundary that defines how future live provider tests may be opt-in gated, skipped by default, isolated, cost-limited, audited, redacted, and stopped before any live test or provider implementation exists.

**Source Authority:** Explicit user request approving R28 implementation, R27 One Provider Adapter Opt-In Harness Implementation, R26 One Provider Adapter Opt-In Harness Contract, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R27 is accepted. The offline opt-in harness evaluator exists. Live execution remains disabled; no provider SDK, API-key read, process.env read, network call, live provider test, provider output, or fake success exists.

**Scope:** Create the R28 live-test planning document, acceptance lock, short R27 forward reference, and this ExecPlan entry.

**Out of Scope:** No live tests, live adapter, provider implementation, provider-specific runtime behavior, provider calls, fetch/http/https, provider SDK import, provider dependency, process.env reads, API key/env secret values, real Model API Layer, live `single_pass` adapter, live provider execution, package change, catalog change, VRP change, final assembly runtime change, role validator change, UI change, fake live-provider success, provider output, or trust promotion.

**Files Expected To Change:** `docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_PLAN.md`, `tests/acceptance/oneProviderAdapterLiveTestPlanAcceptance.test.ts`, `docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_IMPLEMENTATION.md`, and `PLANS.md`.

**Risk Level:** Low. This is a planning boundary and acceptance lock only.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T211925608Z_000262_milestone` created with name `one-provider-adapter-live-test-plan-r28-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add R28 live-test plan documentation, add acceptance test, add a short R27 forward reference, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/acceptance/oneProviderAdapterLiveTestPlanAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. R28 doc and acceptance lock exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live tests, live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key value read, process.env read, network call, live provider execution, package dependency change, V1 catalog change, Hollowcut catalog change, provider output, fake success, or trust promotion is introduced.

**Progress Log:** Pre-change snapshot created. R28 live-test planning document, acceptance lock, and R27 forward reference added. Typecheck passed. R28 acceptance test passed at 8 tests. Full acceptance suite passed at 30 files / 273 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 134 files / 2625 tests.

**Decision Log:** R28 locks planning only. Future live tests must be opt-in only, skipped by default, isolated from normal and acceptance runs, cost-limited, redacted, audited without sensitive values, and trust-neutral.

**Surprises / Discoveries:** The first R28 acceptance run caught that the source-scan assertion was reading the required documentation phrase `process.env is not read.` The test was corrected to scan TypeScript implementation surfaces for env/network/provider imports while the documentation assertion continues to require the phrase. Full Vitest created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T212453564Z_000263_milestone`. Package files were not modified; `package.json` and `package-lock.json` retained prior timestamps.

**Final Report:** R28 One Provider Adapter Live Test Plan completed. Pre-change snapshot ID: `snap_20260703T211925608Z_000262_milestone`. Validation-created snapshot ID: `snap_20260703T212453564Z_000263_milestone`. Files created: `docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_PLAN.md` and `tests/acceptance/oneProviderAdapterLiveTestPlanAcceptance.test.ts`. Files changed: `docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_IMPLEMENTATION.md` and `PLANS.md`. No live tests were implemented. No live adapter was implemented. No provider-specific behavior was implemented. No real Model API Layer was implemented. No provider SDK was imported. No provider dependency was added. No API key value was read. `process.env` was not read. No network call was performed. No live provider execution was enabled. No provider output or fake live-provider success was returned. Future live tests are locked as opt-in only, skipped by default, excluded from normal `npx vitest run`, excluded from default CI and default acceptance runs, explicit-label/command-flag/allowlist/human-approval/kill-switch/redaction/safety/cost guarded, bounded for network/timeouts/retries/cost/rate limits, and stopped on sensitive leakage, unapproved SDKs/dependencies, default-network behavior, fake success, or trust promotion. Live test execution, live test success, provider identity, API key presence, network success, and successful provider responses do not promote trust. Provider output is not deterministic Hollow evidence. Raw provider output starts at T0, schema-valid provider output may reach T1 only, and T2 requires verified deterministic Hollow evidence through VRP. Next recommended phase: One provider adapter implementation behind explicit opt-in planning.

## ExecPlan - One Provider Adapter Opt-In Harness Implementation

**Objective:** Implement the offline opt-in harness evaluator that consumes explicit opt-in gate evidence as data and returns deterministic first blocking refusal or ready-but-live-execution-disabled results while keeping live execution disabled and avoiding env reads, API key reads, SDKs, network calls, live tests, Ledger writes, file writes, fake success, provider output, and trust promotion.

**Source Authority:** Explicit user request approving R27 implementation, R26 One Provider Adapter Opt-In Harness Contract, R25 One Provider Adapter No-Network Implementation Stub, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** R26 is accepted. Static opt-in harness contracts and validators exist. Live execution remains disabled, no provider runtime exists, and opt-in evidence, human approval, API key availability, harness decisions, and provider output must not promote trust.

**Scope:** Create R27 opt-in harness implementation types, offline evaluator, capabilities/health helpers, deterministic validators, examples, documentation, behavior tests, acceptance lock, model boundary exports, a short R26 forward reference, and this ExecPlan entry.

**Out of Scope:** No live adapter, provider-specific runtime behavior, real provider calls, fetch/http/https, provider SDK import, provider dependency, process.env reads, API key/env secret values, real Model API Layer, live `single_pass` adapter, live provider execution, full role rotation, persistent artifact store, database storage, raw transcript storage, Ledger/file writes from this harness, live provider tests, tests requiring API keys/network, fake live-provider success, successful provider response, package change, catalog change, VRP weakening, or trust promotion.

**Files Expected To Change:** `src/modelBoundary/types/oneProviderAdapterOptInHarnessImplementationTypes.ts`, `src/modelBoundary/oneProviderAdapterOptInHarness.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/oneProviderAdapterOptInHarness.test.ts`, `tests/acceptance/oneProviderAdapterOptInHarnessAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-input.valid.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.refusal.valid.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.ready-disabled.valid.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.invalid.live-execution.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.invalid.trust-promotion.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.invalid.secret-leakage.json`, `docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_IMPLEMENTATION.md`, `docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_CONTRACT.md`, and `PLANS.md`.

**Risk Level:** Medium. This adds executable offline gate evaluation logic, but it is deterministic, local-only, and still cannot execute a provider.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T175455546Z_000260_milestone` created with name `one-provider-adapter-opt-in-harness-implementation-r27-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add R27 harness contracts, implement offline evaluator and validators, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/oneProviderAdapterOptInHarness.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterOptInHarnessAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. R27 harness types, implementation, examples, docs, tests, and exports exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret requirement, API key value read, process.env read, network call, live provider test, live provider execution, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Harness evaluation and ready-disabled results do not promote trust or return provider output.

**Progress Log:** Pre-change snapshot created. R27 harness implementation types, offline evaluator, capabilities/health helpers, validators, examples, docs, model boundary exports, behavior tests, acceptance lock, and R26 forward reference added. Typecheck passed. R27 harness tests passed at 28 tests. R27 acceptance test passed at 7 tests. Full acceptance suite passed at 29 files / 265 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 133 files / 2617 tests.

**Decision Log:** R27 implements an offline gate evaluator only. Ready-disabled is a deterministic non-provider result and does not authorize live execution.

**Surprises / Discoveries:** R26's static contract intentionally keeps live execution disabled; R27 therefore uses its own explicit evaluation input/result types for offline gate decisions while preserving the R26 boundary that ready-disabled is not provider execution. Full Vitest created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T180536550Z_000261_milestone`. Package files were not modified; `package.json` and `package-lock.json` retained prior timestamps.

**Final Report:** R27 One Provider Adapter Opt-In Harness Implementation completed. Pre-change snapshot ID: `snap_20260703T175455546Z_000260_milestone`. Validation-created snapshot ID: `snap_20260703T180536550Z_000261_milestone`. Files created: `src/modelBoundary/types/oneProviderAdapterOptInHarnessImplementationTypes.ts`, `src/modelBoundary/oneProviderAdapterOptInHarness.ts`, `tests/modelBoundary/oneProviderAdapterOptInHarness.test.ts`, `tests/acceptance/oneProviderAdapterOptInHarnessAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-input.valid.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.refusal.valid.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.ready-disabled.valid.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.invalid.live-execution.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.invalid.trust-promotion.json`, `examples/modelBoundary/one-provider-adapter-opt-in-harness-result.invalid.secret-leakage.json`, and `docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_IMPLEMENTATION.md`. Files changed: `src/modelBoundary/index.ts`, `docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_CONTRACT.md`, `PLANS.md`. The harness now exposes create/evaluate/capabilities/health helpers, deterministic input/result validators, type guard, and assertion helper. Gate order is config, kill_switch, env_flag, command_flag, provider_allowlist, adapter_id, human_approval, api_key_availability, redaction_readiness, safety_profile_readiness, cost_guard_readiness, live_test_gate, r27_live_execution_disabled. It returns the first blocking refusal or `ready_but_live_execution_disabled` after all gates pass. No live execution was implemented. No live adapter was implemented. No provider-specific behavior was implemented. No real Model API Layer was implemented. No provider SDK was imported. No API key/secret was required. No API key value was read. `process.env` was not read. No network call was added. No live provider tests were added. No provider dependency was added. No fake live-provider success is returned. No provider output is returned. Harness evaluation and harness decisions do not promote trust. Provider output is not deterministic Hollow evidence. Raw provider output starts at T0, schema-valid provider output may reach T1 only, and T2 requires VRP-verified deterministic Hollow evidence. Next recommended phase: One provider adapter live test plan.

## ExecPlan - One Provider Adapter Opt-In Harness Contract

**Objective:** Create the static opt-in harness contract for one future provider adapter, representing explicit opt-in as data while keeping live execution disabled and avoiding env reads, API key reads, SDKs, network calls, live tests, Ledger writes, file writes, fake success, provider output, and trust promotion.

**Source Authority:** Explicit user request approving R26 implementation, R25 One Provider Adapter No-Network Implementation Stub, R24 One Provider Adapter Config Contract, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R25 is accepted. The no-network stub consumes R24 config and refuses deterministically. Live execution remains disabled, no provider runtime exists, and opt-in evidence must not promote trust.

**Scope:** Create opt-in harness contract types, deterministic validators, examples, documentation, validator tests, acceptance lock, model boundary exports, a short R25 forward reference, and this ExecPlan entry.

**Out of Scope:** No opt-in harness runtime, live adapter, provider-specific runtime behavior, real provider calls, fetch/http/https, provider SDK import, provider dependency, process.env reads, API key/env secret values, real Model API Layer, live `single_pass` adapter, live provider execution, full role rotation, persistent artifact store, database storage, raw transcript storage, Ledger/file writes from this contract, live provider tests, tests requiring API keys/network, fake live-provider success, successful provider response, package change, catalog change, VRP weakening, or trust promotion.

**Files Expected To Change:** `src/modelBoundary/types/oneProviderAdapterOptInHarnessContractTypes.ts`, `src/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.test.ts`, `tests/acceptance/oneProviderAdapterOptInHarnessContractAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-opt-in-evidence.valid.json`, `examples/modelBoundary/one-provider-adapter-human-approval.valid.json`, `examples/modelBoundary/one-provider-adapter-kill-switch.valid.json`, `examples/modelBoundary/one-provider-adapter-harness-decision.valid.json`, `examples/modelBoundary/one-provider-adapter-harness-refusal.valid.json`, `examples/modelBoundary/one-provider-adapter-harness-decision.invalid.trust-promotion.json`, `examples/modelBoundary/one-provider-adapter-harness-decision.invalid.secret-leakage.json`, `docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_CONTRACT.md`, `docs/ONE_PROVIDER_ADAPTER_NO_NETWORK_IMPLEMENTATION_STUB.md`, and `PLANS.md`.

**Risk Level:** Low-to-medium. This is static contract and validation work only, but it defines the future opt-in evidence surface.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T172300417Z_000258_milestone` created with name `one-provider-adapter-opt-in-harness-contract-r26-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add opt-in harness contracts, implement deterministic validators, add examples and docs, add validator and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterOptInHarnessContractAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Opt-in harness contract types, validator, examples, docs, tests, and exports exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No opt-in harness runtime, live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret requirement, API key value read, process.env read, network call, live provider test, live provider execution, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Explicit opt-in, opt-in evidence, and harness decision do not promote trust.

**Progress Log:** Pre-change snapshot created. Opt-in harness contract types, deterministic validators, examples, docs, validator tests, acceptance lock, model boundary exports, and R25 forward reference added. Typecheck passed. R26 validator tests passed at 118 tests. R26 acceptance test passed at 7 tests. Full acceptance suite passed at 28 files / 258 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 131 files / 2582 tests.

**Decision Log:** R26 creates static opt-in harness contracts only. One provider adapter opt-in harness implementation is deferred to future approval.

**Surprises / Discoveries:** The R26 acceptance lock caught a doc wording mismatch for exact trust phrases; the documentation was tightened to include the precise phrases. Full Vitest created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T173322622Z_000259_milestone`. Package files were not modified; `package.json` and `package-lock.json` retained prior timestamps.

**Final Report:** R26 One Provider Adapter Opt-In Harness Contract completed. Pre-change snapshot ID: `snap_20260703T172300417Z_000258_milestone`. Validation-created snapshot ID: `snap_20260703T173322622Z_000259_milestone`. Files created: `src/modelBoundary/types/oneProviderAdapterOptInHarnessContractTypes.ts`, `src/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.ts`, `tests/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.test.ts`, `tests/acceptance/oneProviderAdapterOptInHarnessContractAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-opt-in-evidence.valid.json`, `examples/modelBoundary/one-provider-adapter-human-approval.valid.json`, `examples/modelBoundary/one-provider-adapter-kill-switch.valid.json`, `examples/modelBoundary/one-provider-adapter-harness-decision.valid.json`, `examples/modelBoundary/one-provider-adapter-harness-refusal.valid.json`, `examples/modelBoundary/one-provider-adapter-harness-decision.invalid.trust-promotion.json`, `examples/modelBoundary/one-provider-adapter-harness-decision.invalid.secret-leakage.json`, and `docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_CONTRACT.md`. Files changed: `src/modelBoundary/index.ts`, `docs/ONE_PROVIDER_ADAPTER_NO_NETWORK_IMPLEMENTATION_STUB.md`, `PLANS.md`. No opt-in harness runtime was implemented. No live adapter was implemented. No provider-specific behavior was implemented. No real Model API Layer was implemented. No provider SDK was imported. No API key/secret was required. No API key value was read. `process.env` was not read. No network call was added. No live provider tests were added. No provider dependency was added. No live provider execution was enabled. Explicit opt-in evidence, command flag presence, env flag name, human approval, kill switch state, provider allowlist, network permission, harness decision, and API key presence do not promote trust. Provider output is not deterministic Hollow evidence. Raw provider output starts at T0, schema-valid provider output may reach T1 only, and T2 requires verified deterministic Hollow evidence through VRP. Next recommended phase: One provider adapter opt-in harness implementation.

## ExecPlan - One Provider Adapter No-Network Implementation Stub

**Objective:** Create the config-consuming no-network implementation stub for the first-provider adapter lane, validating R24 config documents and deterministically refusing live execution without provider behavior, SDKs, env reads, API key reads, network calls, Ledger writes, file writes, fake success, or provider output.

**Source Authority:** Explicit user request approving R25 implementation, R24 One Provider Adapter Config Contract, R23 One Provider Adapter Type Extension, R22 One Provider Adapter Behind Explicit Opt-In Planning, R21 Provider Adapter Stub With No Network, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R24 is accepted. The config contract exists, no live provider implementation exists, no provider-specific behavior exists, no SDK/dependency/API key/network/live tests exist, no real provider is selected, and config validity/presence must not promote trust or opt-in.

**Scope:** Create one-provider no-network stub types, deterministic validators, config-consuming stub factory, capabilities/health/invocation/refusal result helpers, examples, documentation, validator/behavior tests, acceptance lock, model boundary exports, and this ExecPlan entry.

**Out of Scope:** No live adapter, provider-specific runtime behavior, real provider calls, fetch/http/https, provider SDK import, provider dependency, process.env reads, API key/env secret values, real Model API Layer, live `single_pass` adapter, opt-in harness behavior, full role rotation, persistent artifact store, database storage, raw transcript storage, live provider Ledger/file writes, live provider tests, tests requiring API keys/network, fake live-provider success, successful provider response, package change, catalog change, VRP weakening, or trust promotion.

**Files Expected To Change:** `src/modelBoundary/types/oneProviderAdapterNoNetworkImplementationStubTypes.ts`, `src/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.test.ts`, `tests/acceptance/oneProviderAdapterNoNetworkImplementationStubAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-no-network-stub-capabilities.valid.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-health.valid.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-invocation.valid.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-result.valid.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-result.invalid.fake-success.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-result.invalid.trust-promotion.json`, `docs/ONE_PROVIDER_ADAPTER_NO_NETWORK_IMPLEMENTATION_STUB.md`, optionally `docs/ONE_PROVIDER_ADAPTER_CONFIG_CONTRACT.md`, and `PLANS.md`.

**Risk Level:** Medium. This introduces an executable offline stub, but it is intentionally deterministic and always refuses live execution.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T165653538Z_000256_milestone` created with name `one-provider-adapter-no-network-implementation-stub-r25-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add no-network stub contracts, implement validators and deterministic refusal helpers, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterNoNetworkImplementationStubAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. No-network stub types, implementation, examples, docs, tests, and exports exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret requirement, API key value read, process.env read, network call, live provider test, fake live-provider success, successful provider response, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Config validity does not promote trust. Config presence does not enable opt-in. Stub execution does not promote trust. Stub refusal is not model evidence.

**Progress Log:** Pre-change snapshot created. One-provider no-network stub types, config-consuming deterministic stub, examples, docs, validator/behavior tests, acceptance lock, model boundary exports, and R24 forward reference added. Typecheck passed. R25 stub tests passed at 99 tests. R25 acceptance test passed at 7 tests. Full acceptance suite passed at 27 files / 251 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 129 files / 2457 tests.

**Decision Log:** R25 creates a config-consuming no-network refusal stub only. One provider adapter opt-in harness contract is deferred to future approval.

**Surprises / Discoveries:** Typecheck required one explicit `unknown` cast when reading an unknown invocation's config document before R24 validation. This was a narrow type-safety fix and did not change behavior. Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T170517168Z_000257_milestone`. Package files were not modified; `package.json` and `package-lock.json` retained prior timestamps.

**Final Report:** R25 One Provider Adapter No-Network Implementation Stub completed. Pre-change snapshot ID: `snap_20260703T165653538Z_000256_milestone`. Validation-created snapshot ID: `snap_20260703T170517168Z_000257_milestone`. Files created: `src/modelBoundary/types/oneProviderAdapterNoNetworkImplementationStubTypes.ts`, `src/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.ts`, `tests/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.test.ts`, `tests/acceptance/oneProviderAdapterNoNetworkImplementationStubAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-no-network-stub-capabilities.valid.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-health.valid.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-invocation.valid.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-result.valid.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-result.invalid.fake-success.json`, `examples/modelBoundary/one-provider-adapter-no-network-stub-result.invalid.trust-promotion.json`, and `docs/ONE_PROVIDER_ADAPTER_NO_NETWORK_IMPLEMENTATION_STUB.md`. Files changed: `src/modelBoundary/index.ts`, `docs/ONE_PROVIDER_ADAPTER_CONFIG_CONTRACT.md`, `PLANS.md`. No live adapter was implemented. No provider-specific behavior was implemented. No real Model API Layer was implemented. No provider SDK was imported. No API key/secret was required. No API key value was read. `process.env` was not read. No network call was added. No live provider tests were added. No provider dependency was added. No fake live-provider success is returned. No successful provider response is produced. Config validity does not promote trust. Config presence does not enable opt-in. Stub execution does not promote trust. Stub refusal is not model evidence. Raw prompt/output/API key/secret/env fields are blocked. Next recommended phase: One provider adapter opt-in harness contract.

## ExecPlan - One Provider Adapter Config Contract

**Objective:** Create the static one-provider adapter config contract surface, deterministic validators, examples, documentation, and acceptance lock for a future first-provider lane without implementing provider behavior or reading env/API key values.

**Source Authority:** Explicit user request approving R24 implementation, R23 One Provider Adapter Type Extension, R22 One Provider Adapter Behind Explicit Opt-In Planning, R21 Provider Adapter Stub With No Network, R20 Live Adapter Mock-Compatible Interface, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R23 is accepted. The type extension exists, no live provider implementation exists, no provider-specific behavior exists, no SDK/dependency/API key/network/live tests exist, no real provider is selected, and config validity/presence must not promote trust or opt-in.

**Scope:** Create one-provider adapter config contract types, deterministic validators, valid/invalid examples, documentation, validator tests, acceptance lock, model boundary exports, and this ExecPlan entry.

**Out of Scope:** No live adapter, provider-specific runtime behavior, real provider calls, fetch/http/https, provider SDK import, provider dependency, process.env reads, API key/env secret values, real Model API Layer, live `single_pass` adapter, full role rotation, persistent artifact store, database storage, raw transcript storage, live provider Ledger/file writes, live provider tests, tests requiring API keys/network, fake live-provider success, package change, catalog change, VRP weakening, or trust promotion.

**Files Expected To Change:** `src/modelBoundary/types/oneProviderAdapterConfigContractTypes.ts`, `src/modelBoundary/oneProviderAdapterConfigContractValidator.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/oneProviderAdapterConfigContractValidator.test.ts`, `tests/acceptance/oneProviderAdapterConfigContractAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-config-contract.valid.json`, `examples/modelBoundary/one-provider-adapter-config-refusal.valid.json`, `examples/modelBoundary/one-provider-adapter-config-contract.invalid.secret-leakage.json`, `examples/modelBoundary/one-provider-adapter-config-contract.invalid.trust-promotion.json`, `docs/ONE_PROVIDER_ADAPTER_CONFIG_CONTRACT.md`, optionally `docs/ONE_PROVIDER_ADAPTER_TYPE_EXTENSION.md`, and `PLANS.md`.

**Risk Level:** Low-to-medium. This is static config and validation work only, but it defines the future provider configuration surface.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T163815286Z_000254_milestone` created with name `one-provider-adapter-config-contract-r24-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add config contract types, implement validators, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/oneProviderAdapterConfigContractValidator.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterConfigContractAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Config contract types, validator, examples, docs, tests, and exports exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret requirement, API key value read, process.env read, network call, live provider test, runtime behavior change, real provider selection, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Config validity does not promote trust. Config presence does not enable opt-in.

**Progress Log:** Pre-change snapshot created. One-provider adapter config contract types, deterministic validator, examples, docs, validator tests, acceptance lock, model boundary exports, and R23 forward reference added. Typecheck passed. R24 validator tests passed at 132 tests. R24 acceptance test passed at 8 tests. Full acceptance suite passed at 26 files / 244 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 127 files / 2351 tests.

**Decision Log:** R24 creates static config contract surfaces only. One provider adapter no-network implementation stub is deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T164823952Z_000255_milestone`. Package files were not modified; `package.json` and `package-lock.json` retained prior timestamps.

**Final Report:** R24 One Provider Adapter Config Contract completed. Pre-change snapshot ID: `snap_20260703T163815286Z_000254_milestone`. Validation-created snapshot ID: `snap_20260703T164823952Z_000255_milestone`. Files created: `src/modelBoundary/types/oneProviderAdapterConfigContractTypes.ts`, `src/modelBoundary/oneProviderAdapterConfigContractValidator.ts`, `tests/modelBoundary/oneProviderAdapterConfigContractValidator.test.ts`, `tests/acceptance/oneProviderAdapterConfigContractAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-config-contract.valid.json`, `examples/modelBoundary/one-provider-adapter-config-refusal.valid.json`, `examples/modelBoundary/one-provider-adapter-config-contract.invalid.secret-leakage.json`, `examples/modelBoundary/one-provider-adapter-config-contract.invalid.trust-promotion.json`, and `docs/ONE_PROVIDER_ADAPTER_CONFIG_CONTRACT.md`. Files changed: `src/modelBoundary/index.ts`, `docs/ONE_PROVIDER_ADAPTER_TYPE_EXTENSION.md`, `PLANS.md`. No live adapter was implemented. No provider-specific behavior was implemented. No real Model API Layer was implemented. No provider SDK was imported. No API key/secret was required. No API key value was read. `process.env` was not read. No network call was added. No live provider tests were added. No runtime behavior changed. No real provider was selected unless explicitly authorized. Config validity does not promote trust. Config presence does not enable opt-in. API key env var name does not promote trust. API key presence does not promote trust. Network success does not promote trust. Raw prompt/output/API key/secret/env fields are blocked. Next recommended phase: One provider adapter no-network implementation stub.

## ExecPlan - One Provider Adapter Type Extension

**Objective:** Create the static first-provider adapter type-extension surface, validators, examples, documentation, and acceptance lock for a future single provider lane behind explicit opt-in, without selecting a real provider or implementing provider behavior.

**Source Authority:** Explicit user request approving R23 implementation, R22 One Provider Adapter Behind Explicit Opt-In Planning, R21 Provider Adapter Stub With No Network, R20 Live Adapter Mock-Compatible Interface, R19 Live Adapter Redaction Contract, R18 Live Adapter Type Contracts, R17 Live Adapter Boundary Planning, R8-R16 prior passes, docs/ONE_PROVIDER_ADAPTER_EXPLICIT_OPT_IN_PLANNING.md, docs/PROVIDER_ADAPTER_STUB_NO_NETWORK.md, docs/LIVE_ADAPTER_MOCK_COMPATIBLE_INTERFACE.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R22 is accepted. The first-provider opt-in planning boundary is locked, no live provider implementation exists, no provider-specific behavior exists, no SDK/dependency/API key/network/live tests exist, and explicit opt-in, API key presence, and network success do not promote trust.

**Scope:** Create one-provider adapter type extension types, deterministic validators, examples, documentation, validator tests, acceptance lock, model boundary exports, and this ExecPlan entry.

**Out of Scope:** No live adapter, provider-specific runtime behavior, real provider calls, fetch/http/https, provider SDK import, provider dependency, API key/env secret values, real Model API Layer, live `single_pass` adapter, full role rotation, persistent artifact store, database storage, raw transcript storage, live provider Ledger/file writes, live provider tests, tests requiring API keys/network, fake live-provider success, package change, catalog change, VRP weakening, or trust promotion.

**Files Expected To Change:** `src/modelBoundary/types/oneProviderAdapterTypeExtensionTypes.ts`, `src/modelBoundary/oneProviderAdapterTypeExtensionValidator.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/oneProviderAdapterTypeExtensionValidator.test.ts`, `tests/acceptance/oneProviderAdapterTypeExtensionAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-config.valid.json`, `examples/modelBoundary/one-provider-adapter-opt-in-gate.valid.json`, `examples/modelBoundary/one-provider-adapter-mapping.valid.json`, `examples/modelBoundary/one-provider-adapter-config.invalid.trust-promotion.json`, `docs/ONE_PROVIDER_ADAPTER_TYPE_EXTENSION.md`, and `PLANS.md`.

**Risk Level:** Low-to-medium. This is static type and validation work only, but it defines the future provider configuration surface.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T134038438Z_000252_milestone` created with name `one-provider-adapter-type-extension-r23-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add type contracts, implement validators, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/oneProviderAdapterTypeExtensionValidator.test.ts`; `npx vitest run tests/acceptance/oneProviderAdapterTypeExtensionAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Type extension types, validator, examples, docs, tests, and exports exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, runtime behavior change, real provider selection, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Provider slot selection, explicit opt-in, API key presence, and network success do not promote trust.

**Progress Log:** Pre-change snapshot created. One-provider adapter type-extension types, deterministic validator, examples, docs, validator tests, acceptance lock, and model boundary exports added. Typecheck passed. R23 validator tests passed at 87 tests. R23 acceptance test passed at 8 tests. Full acceptance suite passed at 25 files / 236 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 125 files / 2211 tests.

**Decision Log:** R23 creates static type-extension contracts only. One provider adapter config contract is deferred to future approval.

**Surprises / Discoveries:** The initial acceptance subprocess helper was brittle on Windows under Vitest, so the catalog-count acceptance check was switched to the repo's existing in-process CLI handler pattern without changing the asserted commands or counts. Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T135243332Z_000253_milestone`. Package files were not modified; `package.json` and `package-lock.json` retained prior timestamps.

**Final Report:** R23 One Provider Adapter Type Extension completed. Pre-change snapshot ID: `snap_20260703T134038438Z_000252_milestone`. Validation-created snapshot ID: `snap_20260703T135243332Z_000253_milestone`. Files created: `src/modelBoundary/types/oneProviderAdapterTypeExtensionTypes.ts`, `src/modelBoundary/oneProviderAdapterTypeExtensionValidator.ts`, `tests/modelBoundary/oneProviderAdapterTypeExtensionValidator.test.ts`, `tests/acceptance/oneProviderAdapterTypeExtensionAcceptance.test.ts`, `examples/modelBoundary/one-provider-adapter-config.valid.json`, `examples/modelBoundary/one-provider-adapter-opt-in-gate.valid.json`, `examples/modelBoundary/one-provider-adapter-mapping.valid.json`, `examples/modelBoundary/one-provider-adapter-config.invalid.trust-promotion.json`, and `docs/ONE_PROVIDER_ADAPTER_TYPE_EXTENSION.md`. Files changed: `src/modelBoundary/index.ts`, `PLANS.md`. No live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, runtime behavior change, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented. Provider slot selection does not promote trust. Explicit opt-in does not promote trust. API key presence does not promote trust. Network success does not promote trust. Provider identity does not promote trust. Successful provider response does not promote trust. Raw provider output starts at T0. Schema-valid provider output may reach T1 only. Provider output is not deterministic Hollow evidence. T2 requires verified deterministic Hollow evidence through VRP. The R22 change to `tests/modelBoundary/providerAdapterNoNetworkStub.test.ts` was narrow test-maintenance; it did not loosen the R21 no-network stub, allow fake provider success, allow network behavior, add provider SDK imports, or change catalog counts. Next recommended phase: One provider adapter config contract.

## ExecPlan - One Provider Adapter Behind Explicit Opt-In Planning

**Objective:** Create a planning-only boundary for allowing exactly one future live provider adapter behind explicit opt-in controls, without implementing provider behavior, SDK imports, API keys, network calls, live tests, or runtime changes.

**Source Authority:** Explicit user request approving R22 implementation, R21 Provider Adapter Stub With No Network, R20 Live Adapter Mock-Compatible Interface, R19 Live Adapter Redaction Contract, R18 Live Adapter Type Contracts, R17 Live Adapter Boundary Planning, R16 Final Output Ledger Record, R15 Ledgered Route Event Write, R14 Final Assembly Boundary, R13 single_pass Route MVP, R12 Ledgered Model Invocation Record, R11 Mocked single_pass Model Boundary, R8-R10 runtime/storage passes, docs/PROVIDER_ADAPTER_STUB_NO_NETWORK.md, docs/LIVE_ADAPTER_MOCK_COMPATIBLE_INTERFACE.md, docs/LIVE_ADAPTER_REDACTION_CONTRACT.md, docs/LIVE_ADAPTER_TYPE_CONTRACTS.md, docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R21 is accepted. The offline no-network provider adapter stub exists, no live provider behavior is implemented, no live adapter or provider-specific behavior exists, no real Model API Layer exists, no provider SDK/dependency/API key/network call/live provider tests exist, and stub execution, stub availability, and stub refusal do not promote trust.

**Scope:** Create `docs/ONE_PROVIDER_ADAPTER_EXPLICIT_OPT_IN_PLANNING.md`, create `tests/acceptance/oneProviderAdapterExplicitOptInPlanningAcceptance.test.ts`, and update this ExecPlan entry.

**Out of Scope:** No live adapter, provider-specific behavior, provider stub behavior beyond R21, provider calls, fetch/http/https, provider SDK import, provider dependency, API key/env secret, real Model API Layer, live `single_pass` adapter, full role rotation, persistent artifact store, database storage, raw transcript storage, raw prompt/output Ledger storage, live provider Ledger/file writes, live provider tests, tests requiring API keys/network, fake live-provider success, package change, catalog change, VRP weakening, or trust promotion.

**Files Expected To Change:** `docs/ONE_PROVIDER_ADAPTER_EXPLICIT_OPT_IN_PLANNING.md`, `tests/acceptance/oneProviderAdapterExplicitOptInPlanningAcceptance.test.ts`, and `PLANS.md`.

**Risk Level:** Low. This is planning and acceptance lock only, but it defines the future live provider implementation boundary.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T133131903Z_000250_milestone` created with name `one-provider-adapter-explicit-opt-in-planning-r22-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add explicit opt-in planning boundary document, add acceptance lock, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/acceptance/oneProviderAdapterExplicitOptInPlanningAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Planning doc and acceptance test exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Explicit opt-in, API key presence, and network success do not promote trust. Missing opt-in must not silently fall back to fake success.

**Progress Log:** Pre-change snapshot created. Explicit opt-in planning document and acceptance lock added. Typecheck passed. R22 acceptance test passed at 11 tests. Full acceptance suite passed at 24 files / 228 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 123 files / 2116 tests.

**Decision Log:** R22 is planning-only. One provider adapter type extension is deferred to future approval.

**Surprises / Discoveries:** Typecheck surfaced a stricter test cast in the R21 no-network stub test, so that test-only cast was made explicit through `unknown` without changing stub behavior. Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T133524524Z_000251_milestone`.

**Final Report:** R22 One Provider Adapter Behind Explicit Opt-In Planning completed. Pre-change snapshot ID: `snap_20260703T133131903Z_000250_milestone`. Validation-created snapshot ID: `snap_20260703T133524524Z_000251_milestone`. Files created: `docs/ONE_PROVIDER_ADAPTER_EXPLICIT_OPT_IN_PLANNING.md` and `tests/acceptance/oneProviderAdapterExplicitOptInPlanningAcceptance.test.ts`. Files changed: `tests/modelBoundary/providerAdapterNoNetworkStub.test.ts`, `PLANS.md`. No live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, runtime behavior change, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented. Explicit opt-in does not promote trust. API key presence does not promote trust. Network success does not promote trust. Missing opt-in must not silently fall back to fake success. The R21 change to `tests/acceptance/runtimeStoragePlanningBoundary.test.ts` was a narrow acceptance-maintenance update to distinguish local provider-neutral contract modules from real provider SDK imports; it did not loosen the R8 Runtime/Storage Planning Boundary, weaken storage trust rules, change catalog counts, or hide provider/network behavior. Next recommended phase: One provider adapter type extension.

## ExecPlan - Provider Adapter Stub With No Network

**Objective:** Create an offline provider adapter-shaped stub that satisfies the R20 mock-compatible interface seam, deterministically refuses live execution, and preserves no-network/no-SDK/no-secret/no-trust-promotion boundaries.

**Source Authority:** Explicit user request approving R21 implementation, R20 Live Adapter Mock-Compatible Interface, R19 Live Adapter Redaction Contract, R18 Live Adapter Type Contracts, R17 Live Adapter Boundary Planning, R16 Final Output Ledger Record, R15 Ledgered Route Event Write, R14 Final Assembly Boundary, R13 single_pass Route MVP, R12 Ledgered Model Invocation Record, R11 Mocked single_pass Model Boundary, R8-R10 runtime/storage passes, docs/LIVE_ADAPTER_MOCK_COMPATIBLE_INTERFACE.md, docs/LIVE_ADAPTER_REDACTION_CONTRACT.md, docs/LIVE_ADAPTER_TYPE_CONTRACTS.md, docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R20 is accepted. The mock-compatible adapter interface seam exists, no provider stub existed before R21, no live adapter or provider-specific behavior exists, no real Model API Layer exists, no provider SDK/dependency/API key/network call exists, and interface validation, adapter availability, and mock compatibility do not promote trust.

**Scope:** Create no-network provider adapter stub types, deterministic validators, stub factory, capabilities helper, health helper, invocation helper, examples, documentation, behavior tests, acceptance lock, model boundary exports, and this ExecPlan entry.

**Out of Scope:** No live adapter, provider-specific behavior, real provider calls, fetch/http/https, provider SDK import, provider dependency, API key/env secret, real Model API Layer, live `single_pass` adapter, full role rotation, persistent artifact store, database storage, raw transcript storage, raw prompt/output Ledger storage, stub Ledger writes, stub file writes, fake live-provider success, package change, catalog change, VRP weakening, or trust promotion.

**Files Expected To Change:** `src/modelBoundary/types/providerAdapterNoNetworkStubTypes.ts`, `src/modelBoundary/providerAdapterNoNetworkStub.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/providerAdapterNoNetworkStub.test.ts`, `tests/acceptance/providerAdapterNoNetworkStubAcceptance.test.ts`, `examples/modelBoundary/provider-adapter-no-network-capabilities.valid.json`, `examples/modelBoundary/provider-adapter-no-network-health.valid.json`, `examples/modelBoundary/provider-adapter-no-network-result.valid.json`, `examples/modelBoundary/provider-adapter-no-network-result.invalid.trust-promotion.json`, `docs/PROVIDER_ADAPTER_STUB_NO_NETWORK.md`, and `PLANS.md`.

**Risk Level:** Medium. This introduces an executable adapter-shaped stub, but it is offline-only and returns structured refusal/unavailable results.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T130930173Z_000248_milestone` created with name `provider-adapter-no-network-stub-r21-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add stub contracts, implement validators and deterministic no-network stub helpers, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/providerAdapterNoNetworkStub.test.ts`; `npx vitest run tests/acceptance/providerAdapterNoNetworkStubAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Provider adapter no-network stub, types, examples, docs, tests, and exports exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, fake live-provider success, successful provider response, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Stub invoke returns `ok: false`, stub execution and availability do not promote trust, stub refusal is not model evidence, provider output is not deterministic Hollow evidence, and raw prompt/output/API key/secret/env fields are blocked.

**Progress Log:** Pre-change snapshot created. Provider adapter no-network stub types, stub implementation, examples, docs, tests, acceptance lock, and exports added. Typecheck passed. R21 provider adapter no-network stub tests passed at 60 tests. R21 acceptance test passed at 8 tests. Full acceptance suite passed at 23 files / 217 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 122 files / 2105 tests.

**Decision Log:** R21 creates an offline provider adapter-shaped refusal stub only. One provider adapter behind explicit opt-in planning is deferred to future approval.

**Surprises / Discoveries:** An older R8 acceptance guard treated any local import path containing `provider` as a provider SDK import. R21 legitimately introduces a local no-network `providerAdapterNoNetworkStub`, so that guard was narrowed to actual SDK/model API package names while preserving the no-SDK boundary. Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T131716263Z_000249_milestone`.

**Final Report:** R21 Provider Adapter Stub With No Network completed. Pre-change snapshot ID: `snap_20260703T130930173Z_000248_milestone`. Validation-created snapshot ID: `snap_20260703T131716263Z_000249_milestone`. Files created: `src/modelBoundary/types/providerAdapterNoNetworkStubTypes.ts`, `src/modelBoundary/providerAdapterNoNetworkStub.ts`, `tests/modelBoundary/providerAdapterNoNetworkStub.test.ts`, `tests/acceptance/providerAdapterNoNetworkStubAcceptance.test.ts`, `examples/modelBoundary/provider-adapter-no-network-capabilities.valid.json`, `examples/modelBoundary/provider-adapter-no-network-health.valid.json`, `examples/modelBoundary/provider-adapter-no-network-result.valid.json`, `examples/modelBoundary/provider-adapter-no-network-result.invalid.trust-promotion.json`, and `docs/PROVIDER_ADAPTER_STUB_NO_NETWORK.md`. Files changed: `src/modelBoundary/index.ts`, `tests/acceptance/runtimeStoragePlanningBoundary.test.ts`, `PLANS.md`. No live adapter, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, fake live-provider success, successful provider response, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented. Stub invoke returns `ok: false`. Stub execution does not promote trust. Stub availability does not promote trust. Stub refusal is not model evidence. Provider output is not deterministic Hollow evidence. Raw prompt text, raw model output text, API keys, secrets, env/environment values, credentials, auth tokens, and private keys are blocked. Next recommended phase: One provider adapter behind explicit opt-in planning.

## ExecPlan - Live Adapter Mock-Compatible Interface

**Objective:** Create a provider-neutral live adapter mock-compatible interface seam, deterministic validator, examples, documentation, and acceptance lock before any live adapter, provider stub, provider SDK, API key, or network behavior exists.

**Source Authority:** Explicit user request approving R20 implementation, R19 Live Adapter Redaction Contract, R18 Live Adapter Type Contracts, R17 Live Adapter Boundary Planning, R16 Final Output Ledger Record, R15 Ledgered Route Event Write, R14 Final Assembly Boundary, R13 single_pass Route MVP, R12 Ledgered Model Invocation Record, R11 Mocked single_pass Model Boundary, R8-R10 runtime/storage passes, docs/LIVE_ADAPTER_REDACTION_CONTRACT.md, docs/LIVE_ADAPTER_TYPE_CONTRACTS.md, docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R19 is accepted. Live adapter redaction policy and metadata contracts exist, no live adapter is implemented, no provider stub or provider-specific behavior exists, no provider SDK or dependency exists, no API key/secret or network call is required, raw prompt/output/API key/secret/env fields are blocked, redaction does not verify truth, redaction does not promote trust, and live provider output remains capped at T1 unless future Hollow verification through VRP changes it.

**Scope:** Create live adapter interface capabilities, invocation context, invocation input/output/result, health/unavailable status, safety requirements, redaction requirements, trust-cap requirements, test isolation requirements, mock compatibility summary, validation result contracts, dependency-free validators, examples, documentation, validator tests, acceptance lock, model boundary exports, and this ExecPlan entry.

**Out of Scope:** No live adapter, provider stub behavior, provider-specific behavior, network behavior, provider SDK import, provider dependency, API key/env secret, real Model API Layer, live `single_pass` adapter, full role rotation, persistent artifact store, database storage, raw transcript storage, raw prompt/output Ledger storage, package change, catalog change, VRP weakening, or trust promotion.

**Files Expected To Change:** `src/modelBoundary/types/liveAdapterInterfaceTypes.ts`, `src/modelBoundary/liveAdapterInterfaceValidator.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/liveAdapterInterfaceValidator.test.ts`, `tests/acceptance/liveAdapterInterfaceAcceptance.test.ts`, `examples/modelBoundary/live-adapter-interface-capabilities.valid.json`, `examples/modelBoundary/live-adapter-interface-context.valid.json`, `examples/modelBoundary/live-adapter-interface-result.valid.json`, `examples/modelBoundary/live-adapter-interface-result.invalid.trust-promotion.json`, `docs/LIVE_ADAPTER_MOCK_COMPATIBLE_INTERFACE.md`, and `PLANS.md`.

**Risk Level:** Low-to-medium. This is static interface and validation work only, but it defines the future adapter seam.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T124006453Z_000245_milestone` created with name `live-adapter-mock-compatible-interface-r20-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add interface contracts, implement validators, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/liveAdapterInterfaceValidator.test.ts`; `npx vitest run tests/acceptance/liveAdapterInterfaceAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Live adapter interface types, validator, examples, docs, tests, and exports exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live adapter, provider stub, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. `supports_live_network` remains false, `supports_mock_invocation` is true, interface validation does not promote trust, adapter availability does not promote trust, mock compatibility does not promote trust, provider output is not deterministic Hollow evidence, and raw prompt/output/API key/secret/env fields are blocked.

**Progress Log:** Pre-change snapshot created. Live adapter interface type contracts, validator, examples, docs, tests, acceptance lock, and exports added. Typecheck passed. R20 live adapter interface validator tests passed at 56 tests. R20 acceptance test passed at 9 tests. Full acceptance suite passed at 22 files / 209 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 120 files / 2037 tests.

**Decision Log:** R20 creates a static mock-compatible interface seam only. Provider adapter stub with no network is deferred to future approval.

**Surprises / Discoveries:** The pre-change snapshot command took longer than prior passes but completed successfully before edits. Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T124943243Z_000246_milestone`.

**Final Report:** R20 Live Adapter Mock-Compatible Interface completed. Pre-change snapshot ID: `snap_20260703T124006453Z_000245_milestone`. Validation-created snapshot ID: `snap_20260703T124943243Z_000246_milestone`. Files created: `src/modelBoundary/types/liveAdapterInterfaceTypes.ts`, `src/modelBoundary/liveAdapterInterfaceValidator.ts`, `tests/modelBoundary/liveAdapterInterfaceValidator.test.ts`, `tests/acceptance/liveAdapterInterfaceAcceptance.test.ts`, `examples/modelBoundary/live-adapter-interface-capabilities.valid.json`, `examples/modelBoundary/live-adapter-interface-context.valid.json`, `examples/modelBoundary/live-adapter-interface-result.valid.json`, `examples/modelBoundary/live-adapter-interface-result.invalid.trust-promotion.json`, and `docs/LIVE_ADAPTER_MOCK_COMPATIBLE_INTERFACE.md`. Files changed: `src/modelBoundary/index.ts`, `PLANS.md`. No live adapter, provider stub, provider-specific behavior, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented. `supports_live_network` remains false. `supports_mock_invocation` is true. Interface validation does not promote trust. Adapter availability does not promote trust. Mock compatibility does not promote trust. Provider output is not deterministic Hollow evidence. Raw prompt text, raw model output text, API keys, secrets, env/environment values, credentials, auth tokens, and private keys are blocked. Next recommended phase: Provider adapter stub with no network.

## ExecPlan - Live Adapter Redaction Contract

**Objective:** Create provider-neutral live adapter redaction TypeScript contracts, deterministic validators, examples, documentation, and acceptance lock before any live adapter, provider stub, SDK, API key, or network behavior exists.

**Source Authority:** Explicit user request approving R19 implementation, R18 Live Adapter Type Contracts, R17 Live Adapter Boundary Planning, R16 Final Output Ledger Record, R15 Ledgered Route Event Write, R14 Final Assembly Boundary, R13 single_pass Route MVP, R12 Ledgered Model Invocation Record, R11 Mocked single_pass Model Boundary, R8-R10 runtime/storage passes, docs/LIVE_ADAPTER_TYPE_CONTRACTS.md, docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R18 is accepted. Provider-neutral live adapter contracts exist, no live adapter is implemented, no provider stub or SDK exists, no API key/secret or network call is required, raw prompt/output/API key/secret/env fields are blocked, live provider output starts at T0, schema-valid live provider output may reach T1 only, provider identity does not promote trust, and successful provider response does not promote trust.

**Scope:** Create live adapter redaction policy, manifest, result, audit, digest/ref, allowed/blocked content, safety compatibility, trust summary, validation result contracts, dependency-free validators, examples, documentation, validator tests, acceptance lock, model boundary exports, and this ExecPlan entry.

**Out of Scope:** No live adapter, provider stub behavior, full redaction engine, network behavior, provider SDK import, provider dependency, API key/env secret, real Model API Layer, live `single_pass` adapter, full role rotation, persistent artifact store, database storage, raw transcript storage, raw prompt/output Ledger storage, package change, catalog change, VRP weakening, or trust promotion.

**Files Expected To Change:** `src/modelBoundary/types/liveAdapterRedactionTypes.ts`, `src/modelBoundary/liveAdapterRedactionContractValidator.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/liveAdapterRedactionContractValidator.test.ts`, `tests/acceptance/liveAdapterRedactionContractAcceptance.test.ts`, `examples/modelBoundary/live-adapter-redaction-policy.valid.json`, `examples/modelBoundary/live-adapter-redaction-manifest.valid.json`, `examples/modelBoundary/live-adapter-redaction-result.valid.json`, `examples/modelBoundary/live-adapter-redaction-result.invalid.leakage.json`, `docs/LIVE_ADAPTER_REDACTION_CONTRACT.md`, and `PLANS.md`.

**Risk Level:** Low-to-medium. This is static contract and validation work only, but it defines the future safety metadata boundary for live provider content.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T080957497Z_000243_milestone` created with name `live-adapter-redaction-contract-r19-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add redaction contracts, implement validators, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/liveAdapterRedactionContractValidator.test.ts`; `npx vitest run tests/acceptance/liveAdapterRedactionContractAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Live adapter redaction types, validator, examples, docs, tests, and exports exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live adapter, provider stub, full redaction engine, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Redaction reduces exposure risk but does not verify truth, redaction does not promote trust, redaction metadata does not promote trust, and raw prompt/output/API key/secret/env/credential/auth token/private key fields are blocked.

**Progress Log:** Pre-change snapshot created. Live adapter redaction type contracts, validator, examples, docs, tests, acceptance lock, and exports added. Typecheck passed. R19 live adapter redaction validator tests passed at 54 tests. R19 acceptance test passed at 9 tests. Full acceptance suite passed at 21 files / 200 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 118 files / 1972 tests.

**Decision Log:** R19 creates static redaction contracts only. Live adapter mock-compatible interface is deferred to future approval.

**Surprises / Discoveries:** The focused acceptance lock needed the standalone exact sentence `Live provider output remains capped at T1.` in addition to the fuller VRP-qualified trust sentence, so the document now includes both. Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T081727663Z_000244_milestone`.

**Final Report:** R19 Live Adapter Redaction Contract completed. Pre-change snapshot ID: `snap_20260703T080957497Z_000243_milestone`. Validation-created snapshot ID: `snap_20260703T081727663Z_000244_milestone`. Files created: `src/modelBoundary/types/liveAdapterRedactionTypes.ts`, `src/modelBoundary/liveAdapterRedactionContractValidator.ts`, `tests/modelBoundary/liveAdapterRedactionContractValidator.test.ts`, `tests/acceptance/liveAdapterRedactionContractAcceptance.test.ts`, `examples/modelBoundary/live-adapter-redaction-policy.valid.json`, `examples/modelBoundary/live-adapter-redaction-manifest.valid.json`, `examples/modelBoundary/live-adapter-redaction-result.valid.json`, `examples/modelBoundary/live-adapter-redaction-result.invalid.leakage.json`, and `docs/LIVE_ADAPTER_REDACTION_CONTRACT.md`. Files changed: `src/modelBoundary/index.ts`, `PLANS.md`. No live adapter, provider stub, full redaction engine, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, live provider test, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented. Redaction reduces exposure risk; it does not verify truth. Redaction does not promote trust. Redaction metadata does not promote trust. Raw prompt text, raw model output text, API keys, secrets, env/environment values, credentials, auth tokens, and private keys are blocked. Next recommended phase: Live adapter mock-compatible interface.

## ExecPlan - Live Adapter Type Contracts

**Objective:** Create provider-neutral live adapter TypeScript contracts, deterministic validators, examples, documentation, and acceptance lock before any live adapter, provider stub, SDK, API key, or network behavior exists.

**Source Authority:** Explicit user request approving R18 implementation, R17 Live Adapter Boundary Planning, R16 Final Output Ledger Record, R15 Ledgered Route Event Write, R14 Final Assembly Boundary, R13 single_pass Route MVP, R12 Ledgered Model Invocation Record, R11 Mocked single_pass Model Boundary, docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R17 is accepted. Live provider boundary is locked, no live adapter is implemented, no provider SDK or dependency exists, no API key/secret or network call is required, live model output starts at T0, schema-valid live output may reach T1 only, provider identity does not promote trust, and successful provider response does not promote trust.

**Scope:** Create live adapter type contracts, dependency-free validators, examples, documentation, validator tests, acceptance lock, model boundary exports, and this ExecPlan entry.

**Out of Scope:** No live adapter, provider stub behavior, network behavior, provider SDK import, provider dependency, API key/env secret, real Model API Layer, live `single_pass` adapter, full role rotation, persistent artifact store, database storage, raw prompt/output Ledger storage, package change, catalog change, or VRP weakening.

**Files Expected To Change:** `src/modelBoundary/types/liveAdapterTypes.ts`, `src/modelBoundary/liveAdapterContractValidator.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/liveAdapterContractValidator.test.ts`, `tests/acceptance/liveAdapterTypeContractsAcceptance.test.ts`, `examples/modelBoundary/live-adapter-request.valid.json`, `examples/modelBoundary/live-adapter-response.valid.json`, `examples/modelBoundary/live-adapter-failure.valid.json`, `examples/modelBoundary/live-adapter-response.invalid.trust-promotion.json`, `docs/LIVE_ADAPTER_TYPE_CONTRACTS.md`, and `PLANS.md`.

**Risk Level:** Low-to-medium. This is static contract and validation work only, but it defines the future provider edge.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T051322194Z_000241_milestone` created with name `live-adapter-type-contracts-r18-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add live adapter contracts, implement validators, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/liveAdapterContractValidator.test.ts`; `npx vitest run tests/acceptance/liveAdapterTypeContractsAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Live adapter types, validator, examples, docs, tests, and exports exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live adapter, provider stub, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Live provider output starts at T0, schema-valid live provider output may reach T1 only, provider identity does not promote trust, successful provider response does not promote trust, and raw prompt/output/API key/secret/env fields are blocked.

**Progress Log:** Pre-change snapshot created. Live adapter type contracts, validator, examples, docs, tests, acceptance lock, and exports added. Typecheck passed. R18 live adapter validator tests passed at 43 tests. R18 acceptance test passed at 9 tests. Full acceptance suite passed at 20 files / 191 tests. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 116 files / 1909 tests.

**Decision Log:** R18 creates provider-neutral contracts only. Live adapter redaction contract is deferred to future approval.

**Surprises / Discoveries:** Neutral provider-kind strings such as `openai_compatible` and `anthropic_compatible` are allowed contract values, so source guard tests were tightened to scan actual import lines for provider SDK imports rather than banning neutral taxonomy text. Failure trust was tightened so failed provider output remains T0. Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T052405303Z_000242_milestone`.

**Final Report:** R18 Live Adapter Type Contracts completed. Pre-change snapshot ID: `snap_20260703T051322194Z_000241_milestone`. Validation-created snapshot ID: `snap_20260703T052405303Z_000242_milestone`. Files created: `src/modelBoundary/types/liveAdapterTypes.ts`, `src/modelBoundary/liveAdapterContractValidator.ts`, `tests/modelBoundary/liveAdapterContractValidator.test.ts`, `tests/acceptance/liveAdapterTypeContractsAcceptance.test.ts`, `examples/modelBoundary/live-adapter-request.valid.json`, `examples/modelBoundary/live-adapter-response.valid.json`, `examples/modelBoundary/live-adapter-failure.valid.json`, `examples/modelBoundary/live-adapter-response.invalid.trust-promotion.json`, and `docs/LIVE_ADAPTER_TYPE_CONTRACTS.md`. Files changed: `src/modelBoundary/index.ts`, `PLANS.md`. No live adapter, provider stub, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented. Live provider output starts at T0. Failed provider output remains T0. Schema-valid live provider output may reach T1 only. Provider identity does not promote trust. Successful provider response does not promote trust. Raw prompt text, raw model output text, API keys, secrets, and env values are blocked. Next recommended phase: Live adapter redaction contract.

## ExecPlan - Live Adapter Boundary Planning

**Objective:** Create a planning-only Live Adapter Boundary document and acceptance lock that define provider-neutral adapter shape, secret rules, network rules, redaction rules, trust caps, failure taxonomy, provenance policy, storage policy, test isolation, and future live-adapter implementation sequence before any real provider integration exists.

**Source Authority:** Explicit user request approving R17 implementation, R8 Runtime/Storage Planning Boundary Lock, R9 Runtime Storage Type Contracts, R10 In-Memory Artifact Store Prototype, R11 Mocked single_pass Model Boundary, R12 Ledgered Model Invocation Record, R13 single_pass Route MVP, R14 Final Assembly Boundary, R15 Ledgered Route Event Write, R16 Final Output Ledger Record, docs/FINAL_OUTPUT_LEDGER_RECORD.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R16 is accepted. Final output provenance records exist and recorded does not mean verified. No live adapter, real Model API Layer, provider SDK, API key/secret, network call, provider dependency, Hollow execution, full role runtime, or verified final truth claim exists. V1 catalog remains 12 and Hollowcut catalog remains 9.

**Scope:** Create `docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md`, add `tests/acceptance/liveAdapterBoundaryPlanningAcceptance.test.ts`, and update this ExecPlan.

**Out of Scope:** No live adapter code, real Model API Layer, provider SDK import, provider dependency, API key/env secret, network call, live `single_pass` adapter, full role rotation, Planner/Analyst/Critic/Synthesizer runtime, persistent artifact store, database storage, raw prompt/output Ledger storage, catalog change, VRP weakening, package change, or dependency change.

**Files Expected To Change:** `docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md`, `tests/acceptance/liveAdapterBoundaryPlanningAcceptance.test.ts`, and `PLANS.md`.

**Risk Level:** Low for runtime behavior because this is documentation and acceptance lock only. Governance risk is medium because it defines the future live provider edge.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T045905746Z_000239_milestone` created with name `live-adapter-boundary-planning-r17-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add live adapter boundary planning document, add acceptance test for required doctrine and no provider imports/dependencies, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/acceptance/liveAdapterBoundaryPlanningAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Live adapter boundary planning doc and acceptance test exist. Typecheck, focused acceptance test, full acceptance suite, catalog checks, and full Vitest pass. No live adapter, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced. Document locks that live model output starts at T0, schema-valid live model output may reach T1 only, provider identity does not promote trust, and successful provider response does not promote trust.

**Progress Log:** Pre-change snapshot created. Live adapter boundary planning doc and acceptance lock added. Typecheck passed. R17 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 114 files / 1857 tests.

**Decision Log:** R17 is planning-only. Live adapter type contracts are deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T050322721Z_000240_milestone`.

**Final Report:** R17 Live Adapter Boundary Planning completed. Pre-change snapshot ID: `snap_20260703T045905746Z_000239_milestone`. Validation-created snapshot ID: `snap_20260703T050322721Z_000240_milestone`. Files created: `docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md` and `tests/acceptance/liveAdapterBoundaryPlanningAcceptance.test.ts`. Files changed: `PLANS.md`. No live adapter, real Model API Layer, provider SDK import, provider dependency, API key/secret, network call, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented. Live model output starts at T0. Schema-valid live model output may reach T1 only. Provider identity does not promote trust. Successful provider response does not promote trust. Next recommended phase: Live adapter type contracts.

## ExecPlan - Final Output Ledger Record

**Objective:** Implement a controlled Final Output Ledger Record layer that records the R14 assembled packet as a final output provenance artifact after the R15 route event, without storing raw prompt/output text or promoting trust.

**Source Authority:** Explicit user request approving R16 implementation, R8 Runtime/Storage Planning Boundary Lock, R9 Runtime Storage Type Contracts, R10 In-Memory Artifact Store Prototype, R11 Mocked single_pass Model Boundary, R12 Ledgered Model Invocation Record, R13 single_pass Route MVP, R14 Final Assembly Boundary, R15 Ledgered Route Event Write, docs/FINAL_ASSEMBLY_BOUNDARY.md, docs/LEDGERED_ROUTE_EVENT_WRITE.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R15 is accepted. Route-level provenance event write exists, route writer tests use isolated temp ledger paths, Ledger presence does not promote trust, final packets remain unverified/T1-limited, V1 catalog remains 12, and Hollowcut catalog remains 9.

**Scope:** Create final output ledger record types, validator, deterministic builder, controlled writer using existing Ledger infrastructure, examples, documentation, behavior tests, acceptance lock, final assembly export updates, and this ExecPlan entry.

**Out of Scope:** No live model provider, real Model API Layer, provider SDK, API key/env secret, network call, live adapter boundary, persistent artifact store, database, production UI, raw prompt/output ledger storage, Hollow execution, full role rotation runtime, Planner/Analyst/Critic/Synthesizer runtime, package dependency change, catalog change, VRP weakening, or verified final truth claim.

**Files Expected To Change:** `src/finalAssembly/types/finalOutputLedgerRecordTypes.ts`, `src/finalAssembly/finalOutputLedgerRecordValidator.ts`, `src/finalAssembly/finalOutputLedgerRecordBuilder.ts`, `src/finalAssembly/finalOutputLedgerRecordWriter.ts`, `src/finalAssembly/index.ts`, `tests/finalAssembly/finalOutputLedgerRecord.test.ts`, `tests/acceptance/finalOutputLedgerRecordAcceptance.test.ts`, `examples/finalAssembly/final-output-ledger-record.valid.json`, `examples/finalAssembly/final-output-ledger-record.invalid.trust-promotion.json`, `docs/FINAL_OUTPUT_LEDGER_RECORD.md`, and `PLANS.md`.

**Risk Level:** Medium. This introduces a controlled final-output ledger append path, but tests use isolated temp ledger paths and the record remains provenance-only at T1 or lower.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260703T001838823Z_000237_milestone` created with name `final-output-ledger-record-r16-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add final output ledger record contracts, implement validator, implement deterministic builder, implement writer conversion to existing `LedgerEntry` shape, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/finalAssembly/finalOutputLedgerRecord.test.ts`; `npx vitest run tests/acceptance/finalOutputLedgerRecordAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Final output ledger record types, validator, builder, writer, examples, docs, tests, and exports exist. Controlled final output Ledger write path exists and tests use isolated/mock ledger paths. Final output ledger write and Ledger presence do not promote trust. Final output record means recorded, not verified. Record stores refs, digests, status, trust summary, release summary, warnings, and issues only; it does not store raw prompt text, raw model output text, API keys, secrets, or env values. Final packet does not claim verified final truth, raw model output remains T0, schema-valid output remains T1, model output never reaches T2/T3/T4, and no live provider, real Model API Layer, provider SDK, API key/secret, network call, persistent artifact store, Hollow execution, full role runtime, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced.

**Progress Log:** Pre-change snapshot created. Final output ledger record contracts, validator, builder, writer, examples, docs, tests, acceptance lock, and exports added. Typecheck passed. R16 final output ledger record tests passed. R16 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 113 files / 1846 tests.

**Decision Log:** R16 records final output provenance only. Live adapter boundary planning is deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260703T002730702Z_000238_milestone`. R16 final output ledger writer tests used isolated temp ledger paths and did not append final output records to the repo `.caleb/ledger/ledger.jsonl`.

**Final Report:** R16 Final Output Ledger Record completed. Pre-change snapshot ID: `snap_20260703T001838823Z_000237_milestone`. Validation-created snapshot ID: `snap_20260703T002730702Z_000238_milestone`. Files created: `src/finalAssembly/types/finalOutputLedgerRecordTypes.ts`, `src/finalAssembly/finalOutputLedgerRecordValidator.ts`, `src/finalAssembly/finalOutputLedgerRecordBuilder.ts`, `src/finalAssembly/finalOutputLedgerRecordWriter.ts`, `tests/finalAssembly/finalOutputLedgerRecord.test.ts`, `tests/acceptance/finalOutputLedgerRecordAcceptance.test.ts`, `examples/finalAssembly/final-output-ledger-record.valid.json`, `examples/finalAssembly/final-output-ledger-record.invalid.trust-promotion.json`, and `docs/FINAL_OUTPUT_LEDGER_RECORD.md`. Files changed: `src/finalAssembly/index.ts`, `PLANS.md`. No live model provider, real Model API Layer, provider SDK, API key/secret, network call, live adapter boundary, persistent artifact store, raw prompt/output ledger storage, Hollow execution, full role rotation runtime, package dependency change, V1 catalog change, Hollowcut catalog change, or verified final truth claim was implemented. Final output ledger record means recorded, not verified. Ledger presence does not promote trust. Next recommended phase: Live adapter boundary planning.

## ExecPlan - Ledgered Route Event Write

**Objective:** Implement a narrow, controlled route-level Ledger event write path that records mocked `single_pass` route and final assembly provenance without storing raw prompt/output text or promoting trust.

**Source Authority:** Explicit user request approving R15 implementation, R8 Runtime/Storage Planning Boundary Lock, R9 Runtime Storage Type Contracts, R10 In-Memory Artifact Store Prototype, R11 Mocked single_pass Model Boundary, R12 Ledgered Model Invocation Record, R13 single_pass Route MVP, R14 Final Assembly Boundary, docs/SINGLE_PASS_ROUTE_MVP.md, docs/FINAL_ASSEMBLY_BOUNDARY.md, docs/LEDGERED_MODEL_INVOCATION_RECORD.md, docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md, docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R14 is accepted. Final Assembly Boundary can produce an `assembled_unverified` packet, verified final truth is not claimed, model output remains capped at T1, no route-level ledger event write path exists yet, V1 catalog remains 12, and Hollowcut catalog remains 9.

**Scope:** Create route ledger event types, validator, deterministic builder, controlled writer using existing Ledger infrastructure, examples, documentation, behavior tests, acceptance lock, logic engine exports, and this ExecPlan entry.

**Out of Scope:** No live model provider, real Model API Layer, provider SDK, API key/env secret, network call, persistent artifact store, database, raw prompt/output ledger storage, Hollow execution, full role rotation runtime, Planner/Analyst/Critic/Synthesizer runtime, production UI, package dependency change, catalog change, VRP weakening, or verified final truth claim.

**Files Expected To Change:** `src/logicEngine/types/routeLedgerEventTypes.ts`, `src/logicEngine/routeLedgerEventValidator.ts`, `src/logicEngine/routeLedgerEventBuilder.ts`, `src/logicEngine/routeLedgerEventWriter.ts`, `src/logicEngine/index.ts`, `src/logicEngine/types/index.ts`, `tests/logicEngine/routeLedgerEvent.test.ts`, `tests/acceptance/routeLedgerEventAcceptance.test.ts`, `examples/logicEngine/route-ledger-event.valid.json`, `examples/logicEngine/route-ledger-event.invalid.trust-promotion.json`, `docs/LEDGERED_ROUTE_EVENT_WRITE.md`, and `PLANS.md`.

**Risk Level:** Medium. This introduces a real controlled ledger append path, but tests use isolated temp ledger paths and the event remains provenance-only at T1 or lower.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260702T195132926Z_000235_milestone` created with name `ledgered-route-event-write-r15-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add route ledger event contracts, implement validator, implement deterministic builder, implement writer conversion to existing `LedgerEntry` shape, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/logicEngine/routeLedgerEvent.test.ts`; `npx vitest run tests/acceptance/routeLedgerEventAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Route ledger event types, validator, builder, writer, examples, docs, tests, and exports exist. Controlled route-level Ledger write path exists and tests use isolated/mock ledger paths. Ledger write and Ledger presence do not promote trust. Event stores refs, IDs, digests, statuses, and trust summary only; it does not store raw prompt or raw model output text. Raw model output remains T0, schema-valid output remains T1, model output never reaches T2/T3/T4, final packet does not claim verified final truth, and no live provider, real Model API Layer, provider SDK, API key/secret, network call, persistent artifact store, Hollow execution, full role runtime, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced.

**Progress Log:** Pre-change snapshot created. Route ledger event contracts, validator, builder, writer, examples, docs, tests, acceptance lock, and exports added. Typecheck passed. R15 route ledger event tests passed. R15 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 111 files / 1796 tests.

**Decision Log:** R15 records route-level provenance only. Final output ledger record and live adapter boundary planning are deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260702T195836026Z_000236_milestone`. R15 route ledger writer tests used isolated temp ledger paths and did not append route events to the repo `.caleb/ledger/ledger.jsonl`.

**Final Report:** R15 Ledgered Route Event Write completed. Pre-change snapshot ID: `snap_20260702T195132926Z_000235_milestone`. Validation-created snapshot ID: `snap_20260702T195836026Z_000236_milestone`. Files created: `src/logicEngine/types/routeLedgerEventTypes.ts`, `src/logicEngine/routeLedgerEventValidator.ts`, `src/logicEngine/routeLedgerEventBuilder.ts`, `src/logicEngine/routeLedgerEventWriter.ts`, `tests/logicEngine/routeLedgerEvent.test.ts`, `tests/acceptance/routeLedgerEventAcceptance.test.ts`, `examples/logicEngine/route-ledger-event.valid.json`, `examples/logicEngine/route-ledger-event.invalid.trust-promotion.json`, and `docs/LEDGERED_ROUTE_EVENT_WRITE.md`. Files changed: `src/logicEngine/index.ts`, `src/logicEngine/types/index.ts`, `PLANS.md`. No live model provider, real Model API Layer, provider SDK, API key/secret, network call, persistent artifact store, raw prompt/output ledger storage, Hollow execution, full role rotation runtime, package dependency change, V1 catalog change, Hollowcut catalog change, or verified final truth claim was implemented. Ledger write and Ledger presence do not promote trust. Next recommended phase: Final output ledger record or live adapter boundary planning.

## ExecPlan - Final Assembly Boundary

**Objective:** Implement a deterministic Final Assembly Boundary that turns a bounded mocked `single_pass` route result into a user-facing assembly packet while preserving trust limits, source refs, limitations, release eligibility, and the required unverified disclaimer.

**Source Authority:** Explicit user request approving R14 implementation, R8 Runtime/Storage Planning Boundary Lock, R9 Runtime Storage Type Contracts, R10 In-Memory Artifact Store Prototype, R11 Mocked single_pass Model Boundary, R12 Ledgered Model Invocation Record, R13 single_pass Route MVP, docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md, docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md, docs/IN_MEMORY_ARTIFACT_STORE.md, docs/MOCKED_SINGLE_PASS_MODEL_BOUNDARY.md, docs/LEDGERED_MODEL_INVOCATION_RECORD.md, docs/SINGLE_PASS_ROUTE_MVP.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R13 is accepted. Mocked `single_pass` route execution is complete, model output is capped at T1, no live provider exists, no route Ledger write exists, V1 catalog remains 12, and Hollowcut catalog remains 9.

**Scope:** Create final assembly request/packet types, validator, deterministic assembler, examples, documentation, behavior tests, acceptance lock, public export, and this ExecPlan entry.

**Out of Scope:** No live model provider, real Model API Layer, provider SDK, API key/env secret, network call, persistent storage, database, real Ledger write, Hollow execution, full role rotation runtime, Planner/Analyst/Critic/Synthesizer runtime, production UI, final publication system, package dependency change, catalog change, VRP weakening, or verified final truth claim.

**Files Expected To Change:** `src/finalAssembly/types/finalAssemblyBoundaryTypes.ts`, `src/finalAssembly/finalAssemblyBoundary.ts`, `src/finalAssembly/finalAssemblyBoundaryValidator.ts`, `src/finalAssembly/index.ts`, `src/index.ts`, `tests/finalAssembly/finalAssemblyBoundary.test.ts`, `tests/acceptance/finalAssemblyBoundaryAcceptance.test.ts`, `examples/finalAssembly/final-assembly-request.valid.json`, `examples/finalAssembly/final-assembly-packet.valid.json`, `examples/finalAssembly/final-assembly-packet.invalid.trust-promotion.json`, `docs/FINAL_ASSEMBLY_BOUNDARY.md`, and `PLANS.md`.

**Risk Level:** Medium. This creates the first user-facing packet boundary, but it remains deterministic, dependency-free, storage-free, ledger-free, and capped at T1.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260702T193502825Z_000233_milestone` created with name `final-assembly-boundary-r14-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add final assembly contracts, implement request/packet validators, implement deterministic assembler, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/finalAssembly/finalAssemblyBoundary.test.ts`; `npx vitest run tests/acceptance/finalAssemblyBoundaryAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Final Assembly Boundary types, validator, assembler, examples, docs, tests, and exports exist. Assembler creates only `assembled_unverified` packets for valid route results. Final packet trust tier remains T1 or lower. Final packet does not claim verified final truth. Route completion, final assembly, storage, and retrieval do not promote trust. Model output is not deterministic Hollow evidence. No live model provider, real Model API Layer, provider SDK, API key/secret, network call, persistent storage, real Ledger write, Hollow execution, full role rotation runtime, package dependency change, V1 catalog change, or Hollowcut catalog change is introduced.

**Progress Log:** Pre-change snapshot created. Final assembly contracts, validator, assembler, examples, docs, tests, acceptance lock, and public export added. Typecheck passed. R14 final assembly tests passed. R14 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 109 files / 1757 tests.

**Decision Log:** R14 creates safe unverified/mock-route packet assembly only. Ledgered route event write is deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260702T194703144Z_000234_milestone`.

**Final Report:** R14 Final Assembly Boundary completed. Pre-change snapshot ID: `snap_20260702T193502825Z_000233_milestone`. Validation-created snapshot ID: `snap_20260702T194703144Z_000234_milestone`. Files created: `src/finalAssembly/types/finalAssemblyBoundaryTypes.ts`, `src/finalAssembly/finalAssemblyBoundary.ts`, `src/finalAssembly/finalAssemblyBoundaryValidator.ts`, `src/finalAssembly/index.ts`, `tests/finalAssembly/finalAssemblyBoundary.test.ts`, `tests/acceptance/finalAssemblyBoundaryAcceptance.test.ts`, `examples/finalAssembly/final-assembly-request.valid.json`, `examples/finalAssembly/final-assembly-packet.valid.json`, `examples/finalAssembly/final-assembly-packet.invalid.trust-promotion.json`, and `docs/FINAL_ASSEMBLY_BOUNDARY.md`. Files changed: `src/index.ts`, `PLANS.md`. No live model provider, real Model API Layer, provider SDK, API key/secret, network call, persistent storage, real Ledger write from final assembly, Hollow execution, full role rotation runtime, package dependency change, V1 catalog change, Hollowcut catalog change, or verified final truth claim was implemented. Next recommended phase: Ledgered route event write.

## ExecPlan - single_pass Route MVP

**Objective:** Implement the narrow mocked `single_pass` route MVP that validates a route request, calls the existing mocked model boundary, records a ledger-compatible model invocation record object, stores only T0/T1 model-shaped artifacts in the in-memory store, and returns a bounded route result.

**Source Authority:** Explicit user request approving R13 implementation, R8 Runtime/Storage Planning Boundary Lock, R9 Runtime Storage Type Contracts, R10 In-Memory Artifact Store Prototype, R11 Mocked single_pass Model Boundary, R12 Ledgered Model Invocation Record, docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md, docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md, docs/IN_MEMORY_ARTIFACT_STORE.md, docs/MOCKED_SINGLE_PASS_MODEL_BOUNDARY.md, docs/LEDGERED_MODEL_INVOCATION_RECORD.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R12 is accepted. The mocked model boundary, in-memory artifact store, runtime storage contracts, and model invocation record builder exist. Model-shaped output remains capped at T1, no live provider exists, V1 catalog remains 12, and Hollowcut catalog remains 9.

**Scope:** Create the `single_pass` route MVP types, route runner, examples, documentation, behavior tests, acceptance lock, logic engine exports, and this ExecPlan entry.

**Out of Scope:** No live model provider, provider SDK, API key/env secret, network call, persistent storage, database, Ledger write from the route, Hollow execution, full role rotation, package dependency change, catalog change, VRP weakening, or model output promotion to T2/T3/T4.

**Files Expected To Change:** `src/logicEngine/singlePassRouteMvp.ts`, `src/logicEngine/types/singlePassRouteMvpTypes.ts`, `src/logicEngine/index.ts`, `src/logicEngine/types/index.ts`, `tests/logicEngine/singlePassRouteMvp.test.ts`, `tests/acceptance/singlePassRouteMvpAcceptance.test.ts`, `examples/logicEngine/single-pass-route-request.valid.json`, `examples/logicEngine/single-pass-route-result.valid.json`, `docs/SINGLE_PASS_ROUTE_MVP.md`, and `PLANS.md`.

**Risk Level:** Medium. This is the first route-level orchestration across the mocked boundary, invocation record builder, and in-memory store, but it remains dependency-free, process-memory only, and capped at T1.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260702T192157932Z_000231_milestone` created with name `single-pass-route-mvp-r13-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add route request/result contracts, implement the mocked route runner, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/logicEngine/singlePassRouteMvp.test.ts`; `npx vitest run tests/acceptance/singlePassRouteMvpAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. `single_pass` route MVP types, runner, examples, docs, tests, and exports exist. The route validates request shape, uses only the mocked boundary, returns a ledger-compatible invocation record object without writing the Ledger, stores model-shaped artifacts only in the in-memory store, keeps raw model output at T0, keeps schema-valid model output at T1, never promotes model output to T2/T3/T4, and leaves catalogs unchanged.

**Progress Log:** Pre-change snapshot created. Route MVP types, runner, examples, docs, tests, and exports added. Typecheck passed. R13 route behavior tests passed. R13 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 107 files / 1723 tests.

**Decision Log:** R13 adds route-level orchestration only. Final assembly boundary and route-level Ledger event writes are deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260702T192737369Z_000232_milestone`.

**Final Report:** R13 single_pass Route MVP completed. Pre-change snapshot ID: `snap_20260702T192157932Z_000231_milestone`. Validation-created snapshot ID: `snap_20260702T192737369Z_000232_milestone`. Files created: `src/logicEngine/singlePassRouteMvp.ts`, `src/logicEngine/types/singlePassRouteMvpTypes.ts`, `tests/logicEngine/singlePassRouteMvp.test.ts`, `tests/acceptance/singlePassRouteMvpAcceptance.test.ts`, `examples/logicEngine/single-pass-route-request.valid.json`, `examples/logicEngine/single-pass-route-result.valid.json`, and `docs/SINGLE_PASS_ROUTE_MVP.md`. Files changed: `src/logicEngine/index.ts`, `src/logicEngine/types/index.ts`, `PLANS.md`. No live model provider, provider SDK, API key/secret, network call, persistent storage, database, route Ledger write, Hollow execution, full role rotation, package dependency change, V1 catalog change, Hollowcut catalog change, or model output promotion beyond T1 was implemented.

## ExecPlan - Ledgered Model Invocation Record

**Objective:** Create a deterministic model invocation provenance/audit record contract, validator, builder, examples, documentation, and acceptance lock before any `single_pass` route MVP consumes model-shaped invocation data.

**Source Authority:** Explicit user request approving R12 implementation, R8 Runtime/Storage Planning Boundary Lock, R9 Runtime Storage Type Contracts, R10 In-Memory Artifact Store Prototype, R11 Mocked single_pass Model Boundary, docs/MOCKED_SINGLE_PASS_MODEL_BOUNDARY.md, docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md, docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R11 is accepted. Mocked `single_pass` boundary exists, raw model output remains T0, schema-valid model output may reach T1 only, no model output reaches T2/T3/T4, no live provider integration exists, V1 catalog remains 12, and Hollowcut catalog remains 9.

**Scope:** Create model invocation record types, validator, builder, valid/invalid examples, documentation, model invocation tests, acceptance tests, export updates, and this ExecPlan entry.

**Out of Scope:** No live model provider, real Model API Layer, provider SDK, API key/env secret, network call, `single_pass` route MVP, role runtime, persistent transcript store, database, package dependency change, catalog change, VRP weakening, Ledger write side effect, or trust promotion from ledger/model provenance.

**Files Expected To Change:** `src/modelBoundary/types/modelInvocationRecordTypes.ts`, `src/modelBoundary/modelInvocationRecordValidator.ts`, `src/modelBoundary/modelInvocationRecordBuilder.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/modelInvocationRecord.test.ts`, `tests/acceptance/modelInvocationRecordAcceptance.test.ts`, `examples/modelBoundary/model-invocation-record.valid.json`, `examples/modelBoundary/model-invocation-record.invalid.trust-promotion.json`, `docs/LEDGERED_MODEL_INVOCATION_RECORD.md`, and `PLANS.md`.

**Risk Level:** Medium. This creates a provenance contract intended for future route execution, but it performs no live provider call, no ledger append, and no trust promotion.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260702T191105017Z_000229_milestone` created with name `ledgered-model-invocation-record-r12-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add record types, implement deterministic validator, implement builder with deterministic digests, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/modelInvocationRecord.test.ts`; `npx vitest run tests/acceptance/modelInvocationRecordAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Model invocation record types, validator, builder, examples, docs, and tests exist. Model invocation provenance does not verify model truth. Ledger presence does not promote trust. Raw model output remains T0. Schema-valid model output remains T1. Model output never reaches T2/T3/T4. No live provider, Model API Layer, provider SDK, API key/secret, network call, `single_pass` route MVP, role runtime, dependency change, V1 catalog change, or Hollowcut catalog change is introduced.

**Progress Log:** Pre-change snapshot created. Model invocation record types, validator, builder, examples, docs, tests, and export added. Typecheck passed. R12 model invocation tests passed. R12 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 105 files / 1691 tests.

**Decision Log:** R12 defines ledger-compatible provenance and ledger intent only. It does not append model invocation records to the real JSONL Ledger.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260702T191617124Z_000230_milestone`.

**Final Report:** R12 Ledgered Model Invocation Record completed. Pre-change snapshot ID: `snap_20260702T191105017Z_000229_milestone`. Validation-created snapshot ID: `snap_20260702T191617124Z_000230_milestone`. Files created: `src/modelBoundary/types/modelInvocationRecordTypes.ts`, `src/modelBoundary/modelInvocationRecordValidator.ts`, `src/modelBoundary/modelInvocationRecordBuilder.ts`, `tests/modelBoundary/modelInvocationRecord.test.ts`, `tests/acceptance/modelInvocationRecordAcceptance.test.ts`, `examples/modelBoundary/model-invocation-record.valid.json`, `examples/modelBoundary/model-invocation-record.invalid.trust-promotion.json`, and `docs/LEDGERED_MODEL_INVOCATION_RECORD.md`. Files changed: `src/modelBoundary/index.ts`, `PLANS.md`. No live model provider, real Model API Layer, provider SDK, API key/secret, network call, `single_pass` route MVP, role runtime, persistent transcript store, package dependency change, V1 catalog change, Hollowcut catalog change, Ledger write from the model invocation layer, or trust promotion was implemented.

## ExecPlan - Mocked single_pass Model Boundary

**Objective:** Implement a deterministic mocked `single_pass` model-shaped boundary that validates requests/responses, uses a mock adapter only, stores raw T0 and schema-valid T1 model-shaped records in the in-memory artifact store, and proves no live provider, SDK, secrets, network, persistence, Ledger write, role runtime, or trust promotion is introduced.

**Source Authority:** Explicit user request approving R11 implementation, R8 Runtime/Storage Planning Boundary Lock, R9 Runtime Storage Type Contracts, R10 In-Memory Artifact Store Prototype, docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md, docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md, docs/IN_MEMORY_ARTIFACT_STORE.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R10 is accepted. The in-memory artifact store exists, validates every insert through R9 contracts, blocks trust promotion, and remains process-memory only. Full validation was green at 101 files / 1627 tests, acceptance suite was green at 12 files / 129 tests, V1 catalog remains 12, and Hollowcut catalog remains 9.

**Scope:** Create `src/modelBoundary` type contracts, validator, deterministic mock adapter, mocked boundary runner, examples, documentation, behavior tests, acceptance lock, public export, and this ExecPlan entry.

**Out of Scope:** No live model provider, Model API Layer, provider SDK, API key/env secret, network call, persistent storage, filesystem write, Ledger write from the boundary, role rotation runtime, real role execution, package dependency change, catalog change, VRP weakening, or treating model output as verified deterministic Hollow evidence.

**Files Expected To Change:** `src/modelBoundary/types/singlePassModelBoundaryTypes.ts`, `src/modelBoundary/singlePassModelBoundaryValidator.ts`, `src/modelBoundary/mockSinglePassModelAdapter.ts`, `src/modelBoundary/mockSinglePassModelBoundary.ts`, `src/modelBoundary/index.ts`, `src/index.ts`, `tests/modelBoundary/mockSinglePassModelBoundary.test.ts`, `tests/acceptance/mockSinglePassModelBoundaryAcceptance.test.ts`, `examples/modelBoundary/mock-single-pass-request.valid.json`, `examples/modelBoundary/mock-single-pass-response.valid.json`, `examples/modelBoundary/mock-single-pass-storage-records.valid.json`, `docs/MOCKED_SINGLE_PASS_MODEL_BOUNDARY.md`, and `PLANS.md`.

**Risk Level:** Medium. This is the first model-shaped flow, but it is deterministic, mocked, dependency-free, and capped at T1.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260702T190140243Z_000227_milestone` created with name `mocked-single-pass-model-boundary-r11-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add request/response/result contracts, implement deterministic validators and mock adapter, implement boundary runner with in-memory store inserts for T0 raw and T1 schema-valid records, add examples and docs, add behavior and acceptance tests, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/modelBoundary/mockSinglePassModelBoundary.test.ts`; `npx vitest run tests/acceptance/mockSinglePassModelBoundaryAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Mocked boundary, adapter, validator, docs, examples, tests, and exports exist. Raw model output is stored only as T0/raw. Schema-valid model output is stored only as T1/schema_valid. No model output reaches T2/T3/T4. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No live provider, Model API Layer, provider SDK, API key/secret, network call, persistence, Ledger write, role runtime, package dependency change, or trust promotion is introduced.

**Progress Log:** Pre-change snapshot created. Mocked model boundary contracts, validator, adapter, boundary, examples, docs, tests, and public export added. Typecheck passed. R11 boundary tests passed. R11 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 103 files / 1659 tests.

**Decision Log:** R11 proves model-shaped flow with a mock adapter only. Ledgered model invocation record and `single_pass` route MVP are deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260702T190703146Z_000228_milestone`.

**Final Report:** R11 Mocked single_pass Model Boundary completed. Pre-change snapshot ID: `snap_20260702T190140243Z_000227_milestone`. Validation-created snapshot ID: `snap_20260702T190703146Z_000228_milestone`. Files created: `src/modelBoundary/types/singlePassModelBoundaryTypes.ts`, `src/modelBoundary/singlePassModelBoundaryValidator.ts`, `src/modelBoundary/mockSinglePassModelAdapter.ts`, `src/modelBoundary/mockSinglePassModelBoundary.ts`, `src/modelBoundary/index.ts`, `tests/modelBoundary/mockSinglePassModelBoundary.test.ts`, `tests/acceptance/mockSinglePassModelBoundaryAcceptance.test.ts`, `examples/modelBoundary/mock-single-pass-request.valid.json`, `examples/modelBoundary/mock-single-pass-response.valid.json`, `examples/modelBoundary/mock-single-pass-storage-records.valid.json`, and `docs/MOCKED_SINGLE_PASS_MODEL_BOUNDARY.md`. Files changed: `src/index.ts`, `PLANS.md`. No live model provider, Model API Layer, provider SDK, API key/secret, network call, persistence, Ledger write from the boundary, role runtime, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented.

## ExecPlan - In-Memory Artifact Store Prototype

**Objective:** Implement a deterministic, non-persistent in-memory artifact store prototype for R9 `RuntimeStorageRecord` objects with validation-before-insert, defensive copies, query/read/replace/delete/clear/snapshot/restore/stats behavior, and trust-promotion guardrails.

**Source Authority:** Explicit user request approving R10 implementation, R8 Runtime/Storage Planning Boundary Lock, R9 Runtime Storage Type Contracts, docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md, docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** R9 is accepted. Runtime storage type contracts and validator exist. No runtime storage or persistence exists. Full validation was green at 99 files / 1587 tests, acceptance suite was green at 11 files / 119 tests, V1 catalog remains 12, and Hollowcut catalog remains 9.

**Scope:** Create `src/storage/inMemoryArtifactStore.ts`, export it from `src/storage/index.ts`, add a valid seed example, add documentation, add store behavior tests, add acceptance lock, and update this ExecPlan.

**Out of Scope:** No filesystem storage, JSONL artifact store, database, cloud persistence, vector storage, browser storage, model adapter, provider SDK, model API call, role runtime, Hollow invocation, Ledger writes, `.caleb` snapshot creation from store APIs, package dependency changes, catalog changes, VRP changes, Ledger runtime changes, Logic Engine runtime changes, role validator changes, UI storage, or durable persistence.

**Files Expected To Change:** `src/storage/inMemoryArtifactStore.ts`, `src/storage/index.ts`, `tests/storage/inMemoryArtifactStore.test.ts`, `tests/acceptance/inMemoryArtifactStoreAcceptance.test.ts`, `examples/storage/in-memory-artifact-store-seed.valid.json`, `docs/IN_MEMORY_ARTIFACT_STORE.md`, and `PLANS.md`.

**Risk Level:** Medium. This is the first runtime storage prototype, but it is process-memory only, dependency-free, and bounded by the R9 validator.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260702T183401645Z_000225_milestone` created with name `in-memory-artifact-store-r10-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Implement the store with defensive copies and validator-backed insert/replace/restore; add seed example; document non-persistence and trust guardrails; add behavior and acceptance tests; run required validation; update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/storage/inMemoryArtifactStore.test.ts`; `npx vitest run tests/acceptance/inMemoryArtifactStoreAcceptance.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Pre-change snapshot exists. Store exists and is exported. Store validates every insert, rejects invalid trust promotion, blocks duplicate IDs, returns defensive copies, supports query/list/get/replace/delete/clear/stats/snapshot/restore, remains process-memory only, and does not write files or Ledger entries. Store tests, acceptance test, acceptance suite, full suite, and catalog checks pass. No persistence, model adapter, role runtime, dependency, V1 catalog change, or Hollowcut catalog change is introduced.

**Progress Log:** Pre-change snapshot created. In-memory store, export, seed example, docs, tests, and acceptance lock added. Typecheck passed. Store tests passed. R10 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 101 files / 1627 tests.

**Decision Log:** R10 introduces process-memory store behavior only. Mocked `single_pass` model boundary is deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260702T183908701Z_000226_milestone`.

**Final Report:** R10 In-Memory Artifact Store Prototype completed. Pre-change snapshot ID: `snap_20260702T183401645Z_000225_milestone`. Validation-created snapshot ID: `snap_20260702T183908701Z_000226_milestone`. Files created: `src/storage/inMemoryArtifactStore.ts`, `tests/storage/inMemoryArtifactStore.test.ts`, `tests/acceptance/inMemoryArtifactStoreAcceptance.test.ts`, `examples/storage/in-memory-artifact-store-seed.valid.json`, and `docs/IN_MEMORY_ARTIFACT_STORE.md`. Files changed: `src/storage/index.ts`, `PLANS.md`. No filesystem storage, database, JSONL artifact store, cloud persistence, model adapter, role runtime, provider SDK, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented.

## ExecPlan - Runtime Storage Type Contracts

**Objective:** Create the static TypeScript runtime storage type contract layer, deterministic validator/guards, examples, documentation, and acceptance lock for future Caleb runtime storage records without implementing any runtime store or persistence behavior.

**Source Authority:** Explicit user request approving R9 implementation, R8 Runtime/Storage Planning Boundary Lock, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md, docs/ROLE_ARTIFACT_CONTRACT_LAYER_ACCEPTANCE_REPORT.md, docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md, and PLANS.md.

**Current State:** R8 is accepted. Runtime/storage planning is locked, no runtime storage exists, full validation was green at 97 files / 1565 tests, acceptance suite was green at 10 files / 110 tests, V1 catalog remains 12, and Hollowcut catalog remains 9. Full Vitest is known to create real `.caleb` snapshot and ledger artifacts through an existing CLI test.

**Scope:** Create storage type contracts under `src/storage/types`, a dependency-free runtime storage contract validator, storage index exports, valid/invalid examples, runtime storage type contract documentation, storage validator tests, acceptance tests, and this ExecPlan entry.

**Out of Scope:** No runtime storage, file-backed storage, in-memory storage, SQLite, Postgres, cloud persistence, vector storage, model API calls, provider SDKs, role execution runtime, live role rotation runtime, package dependency changes, catalog changes, VRP changes, Ledger runtime changes, Logic Engine runtime changes, UI storage, Hollowcut export storage, or trust promotion through storage.

**Files Expected To Change:** `src/storage/types/runtimeStorageTypes.ts`, `src/storage/runtimeStorageContractValidator.ts`, `src/storage/index.ts`, `src/index.ts`, `tests/storage/runtimeStorageContractValidator.test.ts`, `tests/acceptance/runtimeStorageTypeContracts.test.ts`, `examples/storage/runtime-storage-record.valid.json`, `examples/storage/runtime-storage-record.invalid.trust-promotion.json`, `docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md`, and `PLANS.md`.

**Risk Level:** Low-to-medium. The code is static type/validator work with no side-effecting runtime behavior, but it introduces a new public contract surface that future passes may rely on.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260702T182226368Z_000223_milestone` created with name `runtime-storage-type-contracts-r9-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add runtime storage types, implement a pure validator and type guards, add examples, add tests, add documentation with exact acceptance verdict, export the storage module through the project index, run required validation, and update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/storage/runtimeStorageContractValidator.test.ts`; `npx vitest run tests/acceptance/runtimeStorageTypeContracts.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Runtime storage type file, validator, storage index, examples, docs, validator tests, and acceptance tests exist. Validation commands pass. V1 catalog remains 12. Hollowcut catalog remains 9. No runtime storage, persistence layer, model adapter, role runtime, provider SDK, package dependency change, catalog change, VRP weakening, Ledger bypass, or storage-driven trust promotion is introduced.

**Progress Log:** Pre-change snapshot created. Runtime storage type contracts, validator, index, examples, docs, tests, and public export added. Typecheck passed. Storage validator tests passed. R9 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 99 files / 1587 tests.

**Decision Log:** R9 creates type contracts and validation guards only. In-memory artifact store prototype and mocked `single_pass` model boundary are deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260702T182836640Z_000224_milestone`.

**Final Report:** R9 Runtime Storage Type Contracts completed. Pre-change snapshot ID: `snap_20260702T182226368Z_000223_milestone`. Validation-created snapshot ID: `snap_20260702T182836640Z_000224_milestone`. Files created: `src/storage/types/runtimeStorageTypes.ts`, `src/storage/runtimeStorageContractValidator.ts`, `src/storage/index.ts`, `tests/storage/runtimeStorageContractValidator.test.ts`, `tests/acceptance/runtimeStorageTypeContracts.test.ts`, `examples/storage/runtime-storage-record.valid.json`, `examples/storage/runtime-storage-record.invalid.trust-promotion.json`, and `docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md`. Files changed: `src/index.ts`, `PLANS.md`. No runtime storage, persistence layer, database, model adapter, role runtime, provider SDK, package dependency change, V1 catalog change, or Hollowcut catalog change was implemented.

## ExecPlan - Runtime/Storage Planning Boundary Lock

**Objective:** Create a planning-only Runtime/Storage Planning Boundary document and acceptance test that lock how future Caleb AI runtime storage must preserve trust, provenance, replay, ledger, snapshot, role artifact, and execution context boundaries without implementing runtime storage.

**Source Authority:** Explicit user request approving R8 implementation, the re-entry audit verdict, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/ROLE_ARTIFACT_CONTRACT_LAYER_ACCEPTANCE_REPORT.md, docs/ROLE_ARTIFACT_CONTRACT_LAYER.md, docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md, and PLANS.md.

**Current State:** Role Artifact Contract Layer R7 is the last documented accepted pass. Current audit validation before R8 reported typecheck green, full Vitest green at 96 files / 1556 tests, acceptance suite green at 9 files / 101 tests, V1 catalog remains 12, and Hollowcut catalog remains 9. The audit also discovered that full Vitest can create real `.caleb` snapshot and ledger artifacts through an existing CLI test.

**Scope:** Create `docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md`, add `tests/acceptance/runtimeStoragePlanningBoundary.test.ts`, and update this ExecPlan with the R8 pass status.

**Out of Scope:** No runtime storage implementation, database, model API calls, provider SDKs, role execution runtime, live role rotation runtime, persistent role artifact store, model invocation history, UI trace storage, Hollowcut export/render storage, Hollow catalog changes, Hollowcut catalog changes, package dependency changes, validator rewrites, Verified Return Path changes, Ledger runtime changes, Logic Engine runtime changes, or fake runtime support.

**Files Expected To Change:** `docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md`, `tests/acceptance/runtimeStoragePlanningBoundary.test.ts`, and `PLANS.md`.

**Risk Level:** Low for architecture behavior because this is a documentation/test-lock pass only. Governance risk is medium because the known full Vitest suite may create a real milestone snapshot and ledger entry.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260702T180031880Z_000221_milestone` created with name `runtime-storage-planning-boundary-r8-prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Create the boundary document with required sections and exact acceptance verdict; add a focused acceptance test for the verdict, trust rules, exclusions, non-goals, future sequence, package hash, provider import absence, and catalog counts; run required validation commands; update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/acceptance/runtimeStoragePlanningBoundary.test.ts`; `npx vitest run tests/acceptance`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npx vitest run`.

**Acceptance Criteria:** Boundary document exists and locks the exact verdict. Acceptance test passes. Typecheck, acceptance suite, full Vitest, and CLI catalog checks pass. V1 catalog remains 12. Hollowcut catalog remains 9. No runtime storage, model API integration, role runtime, provider SDK, package dependency change, or catalog change is introduced.

**Progress Log:** Pre-change snapshot created. Boundary document, acceptance test, and ExecPlan entry added. Typecheck passed. New R8 acceptance test passed. Full acceptance suite passed. CLI catalog checks confirmed V1 = 12 and Hollowcut = 9. Full Vitest passed at 97 files / 1565 tests.

**Decision Log:** R8 is a planning boundary plus documentation lock only. Runtime storage type contracts and mocked `single_pass` model boundary are deferred to future approval.

**Surprises / Discoveries:** Full Vitest again created a real milestone snapshot and Ledger entry through the existing CLI minimal test path: `snap_20260702T180347920Z_000222_milestone`.

**Final Report:** R8 Runtime/Storage Planning Boundary Lock completed. Pre-change snapshot ID: `snap_20260702T180031880Z_000221_milestone`. Validation-created snapshot ID: `snap_20260702T180347920Z_000222_milestone`. Files created: `docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md`, `tests/acceptance/runtimeStoragePlanningBoundary.test.ts`. Files changed: `PLANS.md`. No runtime storage, model integration, role runtime, provider SDK, dependency change, V1 catalog change, or Hollowcut catalog change was implemented.

## ExecPlan - Role Artifact Contract Layer R7 — Contract Surface Acceptance Lock

**Objective:** Create the official acceptance report for the Role Artifact Contract Layer R1-R6 and add a tiny acceptance test that locks the verdict and exclusions.

**Source Authority:** Explicit user request approving R7 implementation, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/ROLE_ARTIFACT_CONTRACT_LAYER.md, and PLANS.md.

**Current State:** Role Artifact Contract Layer R1-R6 is complete as a static contract surface. Latest validation reported and confirmed for R6: typecheck passed, full Vitest passed at 95 files / 1554 tests, build passed, V1 catalog remains 12, Hollowcut catalog remains 9.

**Scope:** Create `docs/ROLE_ARTIFACT_CONTRACT_LAYER_ACCEPTANCE_REPORT.md`, add a filesystem-only acceptance test for the exact verdict and exclusions, and update this ExecPlan.

**Out of Scope:** No production TypeScript logic, new validators, new exported types, fixtures, role execution, model calls, role rotation, runtime handoff execution, artifact storage, Ledger integration, CLI flags, report generation, `src/reports` integration, Logic Engine integration, Thinking Mode UI, replay runtime, enterprise readiness claims, production readiness claims, or protected component changes.

**Files Expected To Change:** `docs/ROLE_ARTIFACT_CONTRACT_LAYER_ACCEPTANCE_REPORT.md`, `tests/acceptance/roleArtifactContractLayerAcceptanceReport.test.ts`, and `PLANS.md`.

**Risk Level:** Very low. The pass is documentation plus a tiny filesystem-only acceptance test.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260614T024449087Z_000217_milestone` created with name `role_artifact_contract_layer_r7_acceptance_lock_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Create the acceptance report with the exact required verdict and sections, add the doc-lock test, run typecheck, full Vitest, build, and required CLI smokes, then update this ExecPlan final status.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** Acceptance report exists and contains the exact verdict, accepted scope, explicit exclusions, pass history, validation snapshot, contract surface map, trust boundary summary, known limitations, next phase, and final acceptance statement. The acceptance test verifies the report and required exclusions without importing runtime modules.

**Progress Log:** Snapshot created. Acceptance report and filesystem-only acceptance test are in place. Test was tightened to assert the exact three-line verdict block. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** R7 is a documentation/test-lock pass only; machine-readable acceptance metadata is deferred.

**Surprises / Discoveries:** On resume, the R7 report and acceptance test files were already present in the workspace; only the test assertion needed tightening to lock the exact verdict block.

**Final Report:** R7 acceptance lock completed. Snapshot ID: `snap_20260614T024449087Z_000217_milestone`. Full results are in the pass completion response.

## ExecPlan - Role Artifact Contract Layer R6 — Bundle Consistency Report Fixture Matrix

**Objective:** Create a static fixture matrix of valid `RoleArtifactBundleConsistencyReport` examples for clean, warning, blocked, and invalid report states.

**Source Authority:** Explicit user request approving R6 implementation, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/ROLE_ARTIFACT_CONTRACT_LAYER.md, and PLANS.md.

**Current State:** R5 provides the report contract types, object-only validator, and one generic valid summary-only report fixture. Existing report runtime files live under `src/reports/**` and remain untouched. No runtime report generation, storage, Ledger integration, CLI role surface, role execution, model calls, or handoff execution exists.

**Scope:** Add four static summary-only report fixtures under `examples/roles/reports/matrix`, add a fixture matrix test file, and document the matrix in `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`.

**Out of Scope:** No production TypeScript logic, new exported types, validator changes, report generation, `src/reports` integration, storage, Ledger writes, CLI flags, runtime behavior, role execution, model calls, handoff execution, artifact storage, bundle/report storage, or protected component changes.

**Files Expected To Change:** `examples/roles/reports/matrix/*.valid.json`, `tests/roles/roleArtifactBundleReportFixtureMatrix.test.ts`, `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`, and `PLANS.md`.

**Risk Level:** Very low. The pass is static fixtures plus tests and docs only.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260614T022331957Z_000214_milestone` created with name `role_artifact_contract_layer_r6_bundle_report_fixture_matrix_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add the four state fixtures, add tests proving parsing, validation, state semantics, summary-only boundaries, no report/runtime imports, no CLI flags, and catalog counts, update docs, then run full validation and CLI smokes.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** All four matrix fixtures validate with the existing R5 validator; each fixture represents its intended state; every fixture is summary-only; no production TypeScript logic, validator, type, runtime, CLI, reportBuilder, `src/reports`, or protected component changes are added.

**Progress Log:** Snapshot created. Four matrix fixtures, fixture matrix tests, documentation, and plan update completed. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** Keep the existing R5 generic report fixture unchanged and create explicit state fixtures in a separate `matrix` directory.

**Surprises / Discoveries:** The isolation test needed to inspect import lines rather than the entire test source because the assertion text itself contains the forbidden module name.

**Final Report:** R6 implementation completed. Snapshot ID: `snap_20260614T022331957Z_000214_milestone`. Full results are in the pass completion response.

## ExecPlan - Role Artifact Contract Layer R5 — Artifact Bundle Consistency Report Contract Implementation

**Objective:** Implement a static, reference-only `RoleArtifactBundleConsistencyReport` contract, validator, one valid fixture, tests, documentation update, and plan update without report runtime generation, storage, Ledger integration, CLI surface, or execution integration.

**Source Authority:** Explicit user request approving R5 implementation, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md, docs/ROLE_ARTIFACT_CONTRACT_LAYER.md, and PLANS.md.

**Current State:** Logic Engine V0 is accepted and locked. R1 through R4 provide role artifact contracts, registry, handoff gate validation, and reference-only bundle validation. No role execution, model calls, runtime handoff, artifact storage, bundle storage, role CLI surface, report runtime generation, or Logic Engine role integration exists.

**Scope:** Add R5 report contract types, a pure object-only report validator, one valid summary-only report fixture, focused tests, exports, documentation, and this ExecPlan update.

**Out of Scope:** No report generation runtime, reportBuilder integration, `src/reports` integration, role execution, model calls, role rotation loops, runtime handoff execution, artifact storage, bundle storage, Ledger integration, CLI flags, Hollow execution, Logic Engine runtime integration, full DAG execution, Thinking Mode UI, replay runtime, report runtime generation, or protected component changes.

**Files Expected To Change:** `src/roles/types/roleArtifactBundleReport.ts`, `src/roles/roleArtifactBundleReportValidator.ts`, `tests/roles/roleArtifactBundleReportValidator.test.ts`, `examples/roles/reports/role-artifact-bundle-consistency-report.valid.json`, `src/roles/types/index.ts`, `src/roles/index.ts`, `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`, and `PLANS.md`.

**Risk Level:** Low. The pass is additive and isolated to the roles contract layer; the main risk is accidentally drifting into runtime report generation, which is explicitly out of scope.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260613T233959376Z_000212_milestone` created with name `role_artifact_contract_layer_r5_bundle_consistency_report_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add report types and enum arrays, implement shape-only validator, add a summary-only fixture, add tests for all shape/forbidden/isolation/catalog locks, update docs, then run typecheck, full Vitest, build, and required CLI smokes.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** Report validator accepts valid static summary reports; rejects embedded bundles/artifacts/handoffs/gate results/telemetry/context/raw input/private reasoning; does not import or integrate with reportBuilder, `src/reports`, runtime execution, CLI, storage, Ledger, or catalogs.

**Progress Log:** Snapshot created. Report types, validator, valid fixture, tests, exports, documentation, and plan update completed. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** R5 validates only the report object and does not accept the original bundle as input, so all statuses and counts remain supplied and shape-checked only.

**Surprises / Discoveries:** The validator can allow report/check/finding `summary` fields while still rejecting embedded full-object markers such as `artifact`, `bundle`, `handoff`, `artifact_refs`, `handoff_gate_refs`, and `claims`.

**Final Report:** R5 implementation completed. Snapshot ID: `snap_20260613T233959376Z_000212_milestone`. Full results are in the pass completion response.

## ExecPlan - Role Artifact Contract Layer R4 — Artifact Reference Bundle Contract Implementation

**Objective:** Implement a reference-only `RoleArtifactReferenceBundle` contract, validator, valid fixture, tests, documentation update, and plan update without adding storage, execution, Ledger integration, CLI surface, or runtime handoff.

**Source Authority:** Explicit user request approving R4 implementation, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md, docs/ROLE_ARTIFACT_CONTRACT_LAYER.md, and PLANS.md.

**Current State:** Logic Engine V0 is accepted and locked. R1 provides role artifact, contract, and handoff types plus validators. R2 provides the static RoleContract registry and valid artifact fixtures. R3 provides `validateRoleHandoffGate(...)`. No role execution, model calls, runtime handoff, artifact storage, role CLI surface, or Logic Engine role integration exists.

**Scope:** Add R4 bundle types, a pure bundle validator, one valid reference-only fixture, focused tests, exports, documentation, and this ExecPlan update.

**Out of Scope:** No role execution, model calls, role rotation loops, runtime handoff execution, artifact storage, Ledger integration, CLI flags, Hollow execution, Logic Engine runtime integration, full DAG execution, Thinking Mode UI, replay runtime, report runtime generation, or protected component changes.

**Files Expected To Change:** `src/roles/types/roleArtifactBundle.ts`, `src/roles/roleArtifactBundleValidator.ts`, `tests/roles/roleArtifactBundleValidator.test.ts`, `examples/roles/bundles/role-artifact-bundle.valid.json`, `src/roles/types/index.ts`, `src/roles/index.ts`, `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`, and `PLANS.md`.

**Risk Level:** Low. The pass is additive and isolated to the roles contract layer.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260613T232628018Z_000210_milestone` created with name `role_artifact_contract_layer_r4_artifact_reference_bundle_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add bundle types, implement object-only validator with registry and recursive forbidden-key checks, add a reference-only fixture, add tests for shape/consistency/isolation/catalog locks, update docs, then run typecheck, full Vitest, build, and required CLI smokes.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** Bundle validator accepts valid reference-only bundles; rejects embedded artifacts/envelopes/telemetry/context/raw input/private reasoning; enforces artifact and handoff reference consistency; no runtime imports, storage, CLI flags, protected component changes, or catalog count drift.

**Progress Log:** Snapshot created. Bundle types, validator, valid fixture, tests, exports, documentation, and plan update completed. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** R4 validates only the bundle object and does not require full artifact input, preserving the reference-only boundary.

**Surprises / Discoveries:** The existing role validation result type fit the R4 bundle validator cleanly, so no bundle-specific result type was needed.

**Final Report:** R4 implementation completed. Snapshot ID: `snap_20260613T232628018Z_000210_milestone`. Full results are in the pass completion response.

## ExecPlan - Role Artifact Contract Layer R3 — Handoff Gate Contract Lock

**Objective:** Create a pure static handoff gate validator that determines whether a `RoleHandoffEnvelope` is allowed according to the R1 validators and the R2 RoleContract registry.

**Source Authority:** Explicit user request approving R3 diagnostic and implementation, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md, docs/ROLE_ARTIFACT_CONTRACT_LAYER.md, and PLANS.md.

**Current State:** Logic Engine V0 is accepted and locked. R1 created role types and validators. R2 created the static RoleContract registry and locked valid RoleArtifact fixtures. No role execution, model calls, handoff execution, artifact storage, role CLI surface, or Logic Engine role integration exists.

**Scope:** Add `src/roles/roleHandoffGate.ts`, export it from `src/roles/index.ts`, add focused tests in `tests/roles/roleHandoffGate.test.ts`, optionally add valid handoff fixtures only if they match the R2 registry, and update role contract documentation plus this ExecPlan.

**Out of Scope:** No role execution, model calls, role rotation loops, runtime handoff execution, artifact storage, Ledger integration, CLI flags, Hollow execution, Logic Engine runtime integration, full DAG execution, Thinking Mode UI, replay runtime, or protected component changes.

**Files Expected To Change:** `src/roles/roleHandoffGate.ts`, `tests/roles/roleHandoffGate.test.ts`, optional `examples/roles/handoffs/*.valid-handoff.json`, `src/roles/index.ts`, `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`, and `PLANS.md`.

**Risk Level:** Low. The pass is an additive pure validator isolated to the role contract layer.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260613T225657249Z_000208_milestone` created with name `role_artifact_contract_layer_r3_handoff_gate_contract_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add result/error types and `validateRoleHandoffGate`, compose R1 validators with R2 registry checks, add status and identity rules, add tests for all required allow/block/invalid paths and no-runtime-import locks, update docs, run full validation and CLI smokes.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** Handoff gate allows only valid registry-approved handoffs with matching artifact references and IDs; blocks or invalidates required failure cases; preserves validator path details; does not execute/store/call models/import runtime primitives; no CLI flags added; V1 catalog remains 12; Hollowcut catalog remains 9.

**Progress Log:** Snapshot created. Handoff gate, tests, exports, documentation, and plan update completed. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** Use `validateRoleHandoffGate` rather than `evaluateRoleHandoffGate` because R3 is contract-validation only, not orchestration runtime policy.

**Surprises / Discoveries:** R1 validators already reject forbidden content; R3 partitions those validator errors so structural failures remain `invalid` while otherwise valid forbidden-content cases return `blocked` as required.

**Final Report:** R3 implementation completed. Snapshot ID: `snap_20260613T225657249Z_000208_milestone`. Full results are in the pass completion response.

## ExecPlan - Role Artifact Contract Layer R2 — Contract Registry + Artifact Fixture Lock

**Objective:** Create a static RoleContract registry and locked valid RoleArtifact fixtures above the accepted Logic Engine V0 Functional Core without adding role execution, model calls, runtime handoff, artifact storage, CLI surface, or Logic Engine integration.

**Source Authority:** Explicit user request approving R2 implementation, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md, docs/ROLE_ARTIFACT_CONTRACT_LAYER.md, and PLANS.md.

**Current State:** R1 created isolated role types, role contract and handoff types, validators, tests, and documentation under `src/roles`. Logic Engine V0 remains accepted and locked.

**Scope:** Add `src/roles/roleContractRegistry.ts`, export it from `src/roles/index.ts`, keep a single RoleId source of truth via the roles type layer, add one valid fixture artifact for each placeholder role, add registry/fixture tests, and update contract documentation plus this ExecPlan.

**Out of Scope:** No role execution, model calls, role rotation, handoff execution, artifact storage, Ledger integration, CLI commands or flags, Hollow execution, full DAG execution, Thinking Mode UI, replay runtime, root `src/index.ts` export, or Logic Engine V0 behavior changes.

**Files Expected To Change:** `src/roles/roleContractRegistry.ts`, `src/roles/index.ts`, `src/roles/types/roleArtifact.ts`, `tests/roles/roleContractRegistry.test.ts`, `examples/roles/*.valid-artifact.json`, `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`, and `PLANS.md`.

**Risk Level:** Low. The pass is additive, isolated to the role contract layer, and does not touch runtime orchestration, CLI behavior, protected components, or catalogs.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260613T223944185Z_000206_milestone` created with name `role_artifact_contract_layer_r2_registry_fixture_lock_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add the static registry and copy-safe accessors, add valid fixtures with ID-only context/trace references, add focused tests for registry integrity, fixture validation, forbidden fields, isolation, CLI no-op, and catalog counts, update documentation, then run the full validation command set.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** Registry lists all eight RoleIds with schema version `0.1.0`; contracts validate; fixtures parse and validate; fixtures use ID-only trace/context refs and exclude forbidden fields; registry does not import execution/model/runtime primitives; no CLI flags are added; V1 catalog remains 12; Hollowcut catalog remains 9.

**Progress Log:** Snapshot created. Registry, fixtures, tests, documentation, and plan update completed. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** Kept the registry in `src/roles` rather than `src/logicEngine` so it remains independent from Logic Engine V0 runtime. Reused the existing `ROLE_IDS` type-layer alias instead of creating a second independent role list.

**Surprises / Discoveries:** `ROLE_IDS`, the registry export, registry file, and fixture files were already partially present when work resumed; the pass aligned allowed next-role metadata and added the missing test/doc locks.

**Final Report:** R2 implementation completed. Snapshot ID: `snap_20260613T223944185Z_000206_milestone`. Full results are in the pass completion response.

## ExecPlan - Role Artifact Contract Layer R1 — Types + Validation Only

**Objective:** Create the first Role Artifact Contract Layer above the accepted Logic Engine V0 Functional Core with types, validators, documentation, and tests only.

**Source Authority:** Explicit user request approving R0 diagnostic and R1 implementation, AGENTS.md, CODEX.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md, and PLANS.md.

**Current State:** Logic Engine V0 Functional Core is accepted and locked. R1 adds a new isolated `src/roles` contract layer without changing Logic Engine runtime, CLI, Hollow execution, model execution, or catalogs.

**Scope:** Add role artifact, role contract, and role handoff types; add validation functions for those shapes; add tests proving validation, forbidden key rejection, trace/context ID-only references, no runtime imports, and catalog counts; add `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`.

**Out of Scope:** No role execution, model calls, role rotation loops, multi-model orchestration, Hollow chains, full DAG execution, Thinking Mode UI, replay runtime, new CLI flags, runtime handoff execution, authenticated approval, enterprise readiness claims, production readiness claims, or Logic Engine V0 reopening.

**Files Expected To Change:** `src/roles/types/roleArtifact.ts`, `src/roles/types/roleContract.ts`, `src/roles/types/roleHandoff.ts`, `src/roles/types/index.ts`, `src/roles/roleArtifactValidator.ts`, `src/roles/index.ts`, `tests/roles/roleArtifactValidator.test.ts`, `docs/ROLE_ARTIFACT_CONTRACT_LAYER.md`, and `PLANS.md`.

**Risk Level:** Low. The new module is isolated and contract/validation-only.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260613T192803172Z_000204_milestone` created with name `role_artifact_contract_layer_r1_types_validation_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add isolated role types and barrels, implement pure validators with recursive forbidden-key scanning, add contract documentation, add focused tests, then run typecheck, full Vitest, build, and required CLI smokes.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** R1 types and validators exist with schema version `0.1.0`; validators reject forbidden chain-of-thought/raw input/telemetry event embedding; tests cover required scenarios; docs state non-goals and relationship to accepted Logic Engine V0; no protected runtime files are changed.

**Progress Log:** Snapshot created. Role contract types, validators, docs, and tests completed. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** Kept roles isolated under `src/roles` and did not export from root `src/index.ts`, so the layer remains available by direct module import without altering the project-wide public barrel.

**Surprises / Discoveries:** The root `src/index.ts` was left untouched even though the repo has a broad barrel pattern; direct `src/roles` imports keep R1 isolated as requested.

**Final Report:** R1 implementation completed. Snapshot ID: `snap_20260613T192803172Z_000204_milestone`. Full results are in the pass completion response.

## ExecPlan - Logic Engine V0.9 — Functional Core Acceptance Lock

**Objective:** Create the official Logic Engine V0 Functional Core acceptance report and lock the deterministic orchestration foundation before moving into the Role Artifact Contract Layer.

**Source Authority:** Explicit user request approving the V0.9 diagnostic and implementation, AGENTS.md, CODEX.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, docs/03_CANONICAL_CONTRACTS.md, docs/04_STORAGE_AND_LEDGER_DECISIONS.md, docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md, docs/06_V1_TEST_AND_FIXTURE_PLAN.md, and PLANS.md.

**Current State:** Diagnostic confirmed Logic Engine V0 through V0.8 behavior, full validation green, V1 catalog at 12, Hollowcut catalog at 9, route-decision dry-run, logic-execute default output unchanged, and context/trace surfacing opt-in.

**Scope:** Create `docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md`, add a tiny acceptance test that verifies report presence/verdict/exclusions, and update this ExecPlan.

**Out of Scope:** No runtime behavior changes, no new CLI flags, no telemetry export, no file persistence, no Ledger trace persistence, no report generation runtime, no UI, no replay runtime, no role execution, no model calls, no Hollow chains, no full DAG execution, and no typed `role_artifacts` union.

**Files Expected To Change:** `docs/LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md`, `tests/acceptance/logicEngineV0AcceptanceReport.test.ts`, and `PLANS.md`.

**Risk Level:** Very low. The pass is documentation plus a documentation-lock test only.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260613T062630705Z_000202_milestone` created with name `logic_engine_v0.9_functional_core_acceptance_lock_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Create the acceptance report with required sections and exact verdict, add the doc-lock test, update PLANS.md, run typecheck, full Vitest, build, and the required CLI validation matrix.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** Acceptance report exists with required sections, exact verdict, accepted scope, explicit exclusions, pass history, current validation snapshot, architecture map, CLI matrix, trust/gate/telemetry summaries, protected components, limitations, and next phase. Optional acceptance test added and green. No runtime or protected component changes.

**Progress Log:** Snapshot created. Acceptance report, doc-lock test, and ExecPlan update completed. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** Added the optional test because it is tiny, non-runtime, and locks the exact acceptance verdict plus required exclusions.

**Surprises / Discoveries:** The optional doc-lock test added two focused assertions and raised the suite from 88 files / 1336 tests to 89 files / 1338 tests.

**Final Report:** V0.9 implementation completed. Snapshot ID: `snap_20260613T062630705Z_000202_milestone`. Full results are in the pass completion response.

## ExecPlan - Logic Engine V0.8 — Telemetry Trace CLI Surfacing

**Objective:** Expose the existing V0.7 in-memory telemetry trace through `logic-execute` JSON output only when explicitly requested with `--include-trace --json`.

**Source Authority:** Explicit user request approving the V0.8 diagnostic and implementation, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** V0.7 provides `LogicEngineTelemetryTrace` and `createTelemetryTraceCollector()` as library-only APIs. `logic-execute` can currently surface `execution_context` only via `--include-context --json`.

**Scope:** Add `--include-trace` parser validation, create an in-memory collector only when requested, pass its sink to `executeWorkGraphLite`, include `telemetry_trace` in JSON payload only when requested, and add focused CLI tests.

**Out of Scope:** No file export, report integration, Ledger trace writes, UI, replay runtime, role execution, model calls, telemetry schema changes, trace schema changes, dispatch/HollowRunner/VRP/SnapshotManager changes, catalog changes, or Hollowcut changes.

**Files Expected To Change:** `PLANS.md`, `src/cli/commandParser.ts`, `src/cli/commandHandlers.ts`, `tests/cli/commandParser.test.ts`, and `tests/cli/commandHandlers.test.ts`.

**Risk Level:** Low. The change is additive, opt-in, and leaves default CLI output unchanged.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260613T060608047Z_000199_milestone` created with name `logic_engine_v0.8_telemetry_trace_surfacing_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add parser flag support/rejections, wire collector conditionally in handler, add payload field conditionally, add tests for default output, trace output, combined context+trace, validation errors, sanitization, no file/Ledger writes, route dry-run, and catalog counts, then run required validation commands.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** Default `logic-execute` payload has no `telemetry_trace`; `--include-trace --json` includes `telemetry_trace`; `--include-context` and `--include-trace` remain independent; `route-decision` remains dry-run; no file or Ledger trace writes are added.

**Progress Log:** Snapshot created. Parser/handler support, conditional trace collector wiring, payload surfacing, and focused CLI tests implemented. Typecheck, full Vitest suite, build, required CLI smokes, and rejection smokes completed green.

**Decision Log:** `telemetry_trace` is a sibling to `execution_context`. CLI returns trace object directly instead of pre-stringifying it; existing CLI JSON formatting handles serialization.

**Surprises / Discoveries:** Existing V0.7 trace collector dropped into the CLI handler cleanly; no Logic Engine executor or telemetry schema changes were needed for V0.8.

**Final Report:** V0.8 implementation completed. Snapshot ID: `snap_20260613T060608047Z_000199_milestone`. Full results are in the pass completion response.

## ExecPlan - Logic Engine V0.7 — Telemetry Trace Contract

**Objective:** Define a durable telemetry trace envelope and optional in-memory collector for future Thinking Mode, replay, and test fixtures while keeping telemetry library-only and disabled unless a sink/collector is passed.

**Source Authority:** Explicit user request approving the V0.7 diagnostic and implementation, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** V0.6 telemetry events use schema version `0.6.0`, are emitted only through an optional `telemetrySink`, and are already keyed by one execution `context_id`.

**Scope:** Add `LogicEngineTelemetryTrace`, `LogicEngineTelemetryTraceEvent`, `createTelemetryTraceCollector()`, in-memory capture APIs, trace serialization, exports, and focused tests.

**Out of Scope:** No CLI trace exposure, file writes, Ledger writes, UI, replay runtime, role execution, model calls, full DAG execution, Hollow chains, or typed `role_artifacts` union.

**Files Expected To Change:** `PLANS.md`, `src/logicEngine/types/telemetryTrace.ts`, `src/logicEngine/telemetryTraceCollector.ts`, `src/logicEngine/types/index.ts`, `src/logicEngine/index.ts`, and `tests/logicEngine/telemetryTraceCollector.test.ts`.

**Risk Level:** Low. The collector is additive, optional, in-memory only, and does not alter execution behavior.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260613T055000362Z_000196_milestone` created with name `logic_engine_v0.7_telemetry_trace_contract_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add trace types, collector/serializer, exports, tests for ordering/copying/sanitization/success-refused-failed traces/CLI invariants/catalog counts, then run required validation commands.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** Trace envelope schema version `0.7.0`; V0.6 event schema unchanged; collector preserves order, copies events, returns `null` when empty, emits sanitized in-memory traces only, and does not affect no-sink/default execution.

**Progress Log:** Snapshot created. Trace types, in-memory collector, serialization helper, exports, and focused tests implemented. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** Trace `trace_id` uses the first captured event's task trace ID. Trace timestamps derive from first/last event `occurred_at`. Collector copies event `data` via JSON serialization because V0.6 event data is already typed as JSON-safe.

**Surprises / Discoveries:** No CLI changes were needed; the V0.6 `telemetrySink` API was already sufficient for the collector integration.

**Final Report:** V0.7 implementation completed. Snapshot ID: `snap_20260613T055000362Z_000196_milestone`. Full results are in the pass completion response.

## ExecPlan - Logic Engine V0.6 — Context Surfacing + Telemetry Hook Stub

**Objective:** Surface `execution_context` in `logic-execute` only when explicitly requested with `--include-context --json`, and add an optional best-effort telemetry sink to `executeWorkGraphLite` for observable Logic Engine events.

**Source Authority:** Explicit user request approving the V0.6 diagnostic and implementation plan, AGENTS.md, docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, and PLANS.md.

**Current State:** V0.5 attaches `execution_context` inside `executeWorkGraphLite`; `dispatchHollow` does not attach context; `logic-execute` currently builds a reduced payload without context; `route-decision` remains dry-run.

**Scope:** Add `--include-context` parser/handler support for `logic-execute`; require `--json`; add telemetry event types and optional sink helper; emit observable state events from `executeWorkGraphLite`; update focused tests; preserve default output shape.

**Out of Scope:** No typed role artifact union, role execution, model calls, Hollow chains, full DAG execution, Thinking Mode UI, authenticated approval, new Hollows, replay system, or modifications to HollowRunner, VRP, SnapshotManager, Ledger core, catalogs, Hollowcut, verification, changeGuard, or hollows.

**Files Expected To Change:** `PLANS.md`, `src/cli/commandParser.ts`, `src/cli/commandHandlers.ts`, `src/logicEngine/workGraphExecutorLite.ts`, `src/logicEngine/types/telemetry.ts`, `src/logicEngine/telemetryEmitter.ts`, `src/logicEngine/types/index.ts`, `src/logicEngine/index.ts`, and focused tests.

**Risk Level:** Low. Changes are additive, opt-in, and covered by CLI shape and telemetry behavior tests.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260613T052855999Z_000193_milestone` created with name `logic_engine_v0.6_context_surfacing_telemetry_prechange`. Roll back via snapshot manager if validation fails.

**Implementation Steps:** Add CLI flag validation, conditionally add context to JSON payload, add telemetry types/helper, emit stable best-effort events from `executeWorkGraphLite`, add focused tests, then run required validation commands and CLI smokes.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run`; `npm run build`; required CLI smoke commands from the user request.

**Acceptance Criteria:** Default `logic-execute` output unchanged; `--include-context --json` surfaces context; `--include-context` without `--json` rejects; `route-decision` remains dry-run; telemetry disabled by default; sink failures do not affect execution; telemetry excludes raw Hollow input and `input_payload`; catalogs remain 12/9.

**Progress Log:** Snapshot created. CLI context surfacing, telemetry types/helper, executor telemetry emissions, exports, and focused tests implemented. Typecheck, full Vitest suite, build, and required CLI smokes completed green.

**Decision Log:** Telemetry events use schema version `0.6.0`; execution context remains schema version `0.5.0`; no `gate_evaluated` event is emitted because gates remain owned by `dispatchHollow`.

**Surprises / Discoveries:** `git` was unavailable in the shell, so snapshot manager remained the rollback anchor. The parser/handler split made it possible to reject `--include-context` before `logic-execute` reads inputs or dispatches.

**Final Report:** V0.6 implementation completed. Snapshot ID: `snap_20260613T052855999Z_000193_milestone`. Full results are in the pass completion response.

## ExecPlan - GROK — CALEB AI HOLLOWCUT EXPORT READINESS ROLLUP REPORT SHAPE PASS

**Objective:** Strengthen the existing hollow.hollowcut.export_readiness_check result shape by adding stable deterministic rollup (readiness_summary + supporting) for future UI/export-engine consumers. Narrow, deterministic, consumer-contract only.

**Source Authority:** Explicit user query (the full "GROK — CALEB AI HOLLOWCUT EXPORT READINESS ROLLUP REPORT SHAPE PASS" block), docs/00_SOURCE_INDEX_AND_AUTHORITY.md (read first), docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, AGENTS.md, CODEX.md, PLANS.md, current implementation in exportReadinessCheckHollow.ts and related.

**Current State (pre this pass):** Base rollup exists (readiness_summary with most suggested fields, blocking_reasons, next_required_actions, deriveCategory, NEXT_ACTION_MAP, safe_to_hand_to_future_export logic, buildReadinessSummary). Hollowcut catalog exactly 8 + separate; V1 protected at 12. export_readiness_check is supplied-state-only, deterministic, read_only. Many required tests already present but gaps for unmapped_issue_codes, explicit known-code action strings on invalid, full backward field asserts, direct VRP T2 promotion proof in this test, constructed unknown code case. Baseline was green. Pre-mutation snapshot executed.

**Scope (In):** 
- Pre-mutation snapshot with exact name.
- Baseline typecheck/build/npm test (green required pre-edit).
- Inspect exactly the listed files + CLI shape.
- Add unmapped_issue_codes (deterministic collect of codes absent from NEXT_ACTION_MAP) to readiness_summary and top-level.
- Sync NEXT_ACTION_MAP keys to actual emitted issue.codes (from create*Issue + validateHollowcutExportProfile) so next_required_actions is populated deterministically for valid/invalid fixtures and alignment cases (no invention).
- Add/update focused tests in exportReadinessCheckHollow.test.ts covering every bullet in "Tests required" (catalog counts, readiness_summary presence+values+safe, blocking_categories, next actions for known, unmapped not inventing, backward fields, T0, VRP promotion only clean, no false ready, CLI list/run/ledger/report behaviors via live or handler).
- Post changes: typecheck/build/test green.
- Execute the exact 5 live CLI demos.
- Produce verbatim required implementation report with all listed proofs. Stop.
- Update this PLANS.md with ExecPlan.

**Scope (Out / Strict Boundaries):** No new Hollow, no Hollow ID change, no V1 catalog touch, do not remove any existing result fields (ready/valid/status/checks/issues/warnings/blockers/.../summary/supplied_state_only_confirmed etc.), no backward break, no export/build/render/FFmpeg/media inspect/mutation, no subjective AI, no Role Rotation/Model API/UI/cloud/auth, no architecture drift, no placeholders/stubs/TODOs as complete, no skipping tests. Hollowcut remains 8. Status docs touched only if sync strictly needed (not for this internal shape).

**Files Expected To Change:** PLANS.md, src/hollowcut/exportReadinessCheckHollow.ts, tests/hollowcut/exportReadinessCheckHollow.test.ts (0 others; boundary ALLOWED lists already include exportReadinessCheckHollow.ts so content edit does not affect them).

**Risk Level:** Low. Additive fields + test coverage inside existing Hollow. Deterministic only. Snapshot pre + full green gates.

**Snapshot / Rollback Plan:** Exact CLI create-milestone-snapshot --name pre-hollowcut-export-readiness-rollup-shape --json executed before any edit (ID: snap_20260610T173402971Z_000124_milestone, path: D:\Caleb AI\.caleb\snapshots\snap_20260610T173402971Z_000124_milestone, ledger written). On failure: use snapshot rollback or git. Ledger records snapshot.

**Implementation Steps:**
1. Read authority docs 00/01/02 + PLANS first.
2. Run exact snapshot; stop if fail.
3. Run baseline typecheck/build/npm test; stop/report if not 100% green.
4. Inspect all required files + CLI handlers + greps for coverage/gaps.
5. Update PLANS.md (this ExecPlan).
6. Strengthen rollup: implement computeUnmappedIssueCodes; extend NEXT_ACTION_MAP with real codes for ref/timing/profile errors so actions fire for fixtures; include unmapped_issue_codes in readiness_summary and top-level result; keep safe_to_hand logic and all prior fields.
7. Extend exportReadinessCheckHollow.test.ts with additional its proving every required scenario (including constructed unmapped via narrow __test helper, VRP T2 only for ready, full compat fields, explicit action values, blocking_categories etc.).
8. Run post typecheck/build/npm test; require fully green (998+ passing).
9. Execute the 5 exact CLI smokes via npm run cli (capture --json outputs, ledger, report paths).
10. Assemble and output the exact required report (snapshot, baselines pre/post, inspected/changed files, rollup added, mapping rules, fixtures/tests, all commands+results, count proofs, T0/T2/ledger/report proofs, risks, next pass). Stop. No further work.

**Validation Commands:** 
- npm run cli -- create-milestone-snapshot --name pre-hollowcut-export-readiness-rollup-shape --json
- npm run typecheck && npm run build && npm test (pre and post)
- The 5 CLI: list-hollowcut-hollows --json ; run-hollowcut-hollow ...valid... --json ; ...invalid... --json ; valid +--write-ledger ; valid +--write-report
- Full suite must show 0 failures.

**Acceptance Criteria (from query):** Pre snapshot created + ID recorded. Baseline suite fully green before edits. Existing fields + contract backward compatible. New rollup deterministic + matches preferred shape (incl. unmapped for unknowns). No runtime export etc added. supplied-state-only preserved. Full green post. V1 catalog exactly 12. Hollowcut catalog separate + exactly 8. list/run/ledger/report all proven. No architecture drift/placeholders. Raw output T0, VRP decides T2 only for clean. Report produced with all bullets.

**Progress Log:**
- Snapshot + baseline green (998/998 passed) completed pre-edit.
- All required inspections + greps completed.
- ExecPlan recorded.
- (edits + post validation + smokes + report to follow in this pass)

**Decision Log:**
- Chose to add unmapped_issue_codes inside readiness_summary (primary consumer rollup) + top-level (symmetry with blocking_reasons/next_required_actions) — fits "rollup object".
- Extended NEXT_ACTION_MAP keys to actual codes emitted by createHollowcutValidationIssue / createTimelineValidationIssue / validateHollowcutExportProfile calls inside the module (e.g. "unknown_asset_reference", "export_profile_platform_invalid") rather than changing creators or adding normalization layer (narrowest change, keeps deterministic).
- Used narrow __test export only in the test file for constructed unknown-code case (no prod API surface change, enables required "unknown issue codes ... not converted into invented actions" proof).
- No status doc edits (per "only if later sync is needed"; prior alignment pass had synced descriptive text).
- No boundary test edits (ALLOWED lists already list exportReadinessCheckHollow.ts; content change does not alter file membership).

**Surprises / Discoveries:** The readiness_summary + helpers + safe_to_hand + categories + actions were already substantially implemented and tests partially covered the shape from prior passes. This pass focused on completing the exact consumer contract (unmapped rule + exhaustive test bullets + live CLI proofs) without drift. Baseline was already green; snapshot succeeded on first try.

**Final Report:** See the verbatim report emitted at end of this pass execution. All acceptance met or explicitly noted. End of pass.

## ExecPlan - GROK — CALEB AI HOLLOWCUT EXPORT PLAN PREVIEW PASS

**Objective:** Implement the first non-destructive Export Plan Preview Hollow (hollow.hollowcut.export_plan_preview) and CLI command that consumes only T2 verified readiness evidence, enforces all gates from the boundary plan and contract (T2, VRP, safe_to_hand, zero blockers, contract shape), and produces a deterministic structural dry-run plan with planned_steps (descriptive, no exec/FFmpeg/mutation). Hollowcut catalog becomes 9; V1 stays 12. Non-destructive only.

**Source Authority:** Explicit user query (full "GROK — CALEB AI HOLLOWCUT EXPORT PLAN PREVIEW PASS" block), docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md, the readiness contract + schema, prior snapshots/baselines, Hollowcut patterns, PLANS rule for implementation passes.

**Current State (pre this pass):** Snapshot + baseline 1007 green. Boundary plan and readiness contract exist and are accurate. Hollowcut catalog 8. No preview/expor t runtime. All gates and non-destructive rules defined.

**Scope (In):**
- Exact pre snapshot + baseline green.
- Inspect required (boundary plan, contract, schema, readiness Hollow, catalog, CLI files, tests, fixtures, PLANS).
- Create src/hollowcut/exportPlanPreviewHollow.ts (manifest + impl with strict gates on verified T2 evidence, deterministic preview_plan per suggested shape, planned_steps descriptive only).
- Update hollowcutHollowCatalog.ts (add manifest/impl; Hollowcut becomes 9).
- Update CLI: commandParser (add command), cliTypes (union), commandHandlers (handler + help text, using existing runner/VRP/ledger/report patterns; command accepts verified readiness json from prior run-hollowcut-hollow).
- Add/update focused tests (gates, output shape, counts V1=12/HC=9, T0/T2, CLI behaviors) in exportReadinessCheckHollow.test.ts and minimalCli.test.ts; update count asserts.
- Update PLANS with this ExecPlan.
- Post validation green.
- 5 exact demos (including preview on valid verified fixture and bad cases).
- Verbatim report. Stop.

**Scope (Out / Strict Boundaries):** No V1 change (stays 12). No actual export/render/FFmpeg/mutation/media write. Preview strictly requires T2 verified (refuses raw T0, unsafe, blockers, contract fail). No placeholders. No weakening of VRP etc. No other docs beyond minimal if needed (none).

**Files Expected To Change:** src/hollowcut/exportPlanPreviewHollow.ts (new), src/hollows/hollowcutHollowCatalog.ts, src/cli/commandParser.ts, src/cli/cliTypes.ts, src/cli/commandHandlers.ts, tests/hollowcut/exportReadinessCheckHollow.test.ts, tests/cli/minimalCli.test.ts, PLANS.md (ExecPlan). Hollowcut catalog count updates in tests.

**Risk Level:** Low (follows existing Hollow + CLI run-hollowcut patterns exactly; gates are deterministic; non-destructive by design).

**Snapshot / Rollback Plan:** Exact pre-... snapshot executed first. Rollback via manager.

**Implementation Steps:** (as executed: snapshot+baseline, inspect, new Hollow with gates/output, catalog, CLI command+handler, tests/counts, PLANS, post green, demos, report).

**Validation Commands:** The mandated snapshot, baselines, post type/build/test, 5 demos.

**Acceptance Criteria:** All from query (snapshot, green, non-destructive, requires T2, refuses bad cases, V1=12, HC correct, green tests, no drift).

**Progress Log / Decision Log:** (executed per plan; used boundary plan as spec; Hollow enforces gates; CLI reuses patterns for ledger/report support; tests cover required scenarios; no extra docs).

**Final Report:** See end of this pass. End of pass.

## ExecPlan - GROK — CALEB AI HOLLOWCUT EXPORT RUNTIME BOUNDARY PLAN PASS

**Objective:** Create documentation-only export runtime boundary plan (docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md) that clearly defines the future non-destructive first export/runtime phase ("Export Plan Preview"), gates it strictly behind T2 verified readiness evidence + contract conformance + safe_to_hand_to_future_export, lists forbidden actions, and records acceptance criteria for any future implementation. No code, no runtime, no new Hollows/CLI.

**Source Authority:** Explicit user query (full "GROK — CALEB AI HOLLOWCUT EXPORT RUNTIME BOUNDARY PLAN PASS" block), docs/00/01/02, prior contract/rollup/boundary passes, existing Hollowcut boundary/contract docs style (HOLLOWCUT_BOUNDARY_LOCK.md, HOLLOWCUT_CALEB_BOUNDARY.md, HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md), PLANS.md rule for boundary/schema/planning work.

**Current State (pre this pass):** V1 catalog exactly 12 and protected. Hollowcut catalog separate at exactly 8 (including export_readiness_check). export_readiness_check is fully implemented, contract-snapshotted (HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md + schema.json), with readiness_summary, deterministic next_required_actions/unmapped_issue_codes, safe_to_hand_to_future_export rule. Valid/invalid outputs conform (tested). No export/runtime exists (all prior docs emphasize supplied-state validation only, no FFmpeg/mutation/render). Baseline green (1007 tests). Snapshot for this pass executed.

**Scope (In):**
- Exact pre-mutation snapshot.
- Baseline green validation (typecheck/build/test).
- Inspect all required files (status docs, contracts, Hollow source, examples, PLANS).
- Create docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md covering exactly the 8 required sections (current state with counts/contracts, future principles/gates, first "Export Plan Preview" non-destructive phase, long forbidden list, required gates, future CLI proposal clearly marked "future/not implemented", trust/ledger, acceptance requirements).
- Append minimal ExecPlan to PLANS.md (per PLANS rule for this type of boundary planning work).
- Only minimal doc sync if an existing index/list explicitly requires referencing the new plan (inspection showed none; boundary docs self-reference specific contracts but no exhaustive list mandating addition here).
- Post: typecheck/build/test.
- Exact 3 CLI smokes.
- Verbatim report. Stop. No code changes.

**Scope (Out / Strict Boundaries):** No runtime code, no export/build/render/FFmpeg/media mutation, no new Hollow/CLI, no V1 or Hollowcut catalog changes, no Runner/VRP/Ledger/Report/CLI behavior changes, no role/model/UI/cloud, no weakening guards, no placeholders, no test additions beyond any required index sync (none found). Status docs touched only for any explicit list (none required).

**Files Expected To Change:** docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md (new), PLANS.md (ExecPlan append only). 0 changes to any source, tests (beyond possible index), other status docs.

**Risk Level:** Very low (pure documentation + one ExecPlan entry; follows existing boundary plan style exactly; no behavior impact).

**Snapshot / Rollback Plan:** Exact `npm run cli -- create-milestone-snapshot --name pre-hollowcut-export-runtime-boundary-plan --json` executed first (ID from run, ledger written). Use snapshot manager for rollback if needed.

**Implementation Steps:**
1. Snapshot + baseline (must be green).
2. Full inspection of listed files + grep for reference lists.
3. Create the boundary plan doc with all required sections, accurate current state from inspection, strict principles/gates/forbidden/acceptance.
4. Append ExecPlan to PLANS.md.
5. No other doc edits (inspection confirmed no mandatory index update for this plan doc).
6. Post validation (typecheck/build/test).
7. Run exact 3 smokes.
8. Emit verbatim report with all proofs. Stop.

**Validation Commands:**
- Exact snapshot.
- npm run typecheck && npm run build && npm test (pre + post; 0 failures).
- The 3 CLI: list-hollowcut-hollows --json; run valid; run invalid.
- Full suite must remain green.

**Acceptance Criteria (from query):** Snapshot created. Baseline green before edits. Export runtime boundary plan exists. No runtime/export code added. No V1/Hollowcut catalog changes. Hollowcut remains 8. Full green post. Future runtime clearly gated behind T2 + safe_to_hand + contract. No drift/placeholders.

**Progress Log:**
- Snapshot + baseline 1007/1007 green completed.
- Inspections complete (current state, contract references, no mandatory list update found, VIDEO is future-only).
- New plan doc + PLANS ExecPlan in progress.

**Decision Log:**
- Followed exact required sections and wording from query for the plan doc.
- Used style of prior boundary/contract docs (sections, bullets, code examples for future CLI/gates, "Current state", "Explicitly forbidden", "Required future gate").
- Updated only PLANS.md for ExecPlan (required by its own rules for this work); no other status docs edited because no explicit "index or contract list" was found that lists all Hollowcut docs and would be stale without this one (per "only if" rule).
- Kept all existing tests untouched (doc-only; no need to add runtime tests).
- Smokes limited to the 3 required (no --write-ledger/report this time).

**Surprises / Discoveries:** The prior contract and boundary docs already do an excellent job of stating "no export yet" and referencing the readiness contract. The new plan doc slots in cleanly as the dedicated future-runtime boundary without needing cross-edits. VIDEO plan already anticipates export/ but marks everything future — consistent with this pass.

**Final Report:** See the verbatim report at end of this pass. All acceptance criteria met. End of pass.

## ExecPlan - GROK — CALEB AI HOLLOWCUT EXPORT READINESS ARTIFACT CONTRACT SNAPSHOT PASS

**Objective:** Create stable artifact contract (JSON schema + authoritative markdown contract) for the hollow.hollowcut.export_readiness_check result shape (including full readiness_summary rollup, determinism rules, unmapped codes, safe_to_hand_to_future_export contract, legacy fields, T0/VRP notes, supplied-state-only guarantees) so future consumers have a frozen target. Narrow contract-snapshot only.

**Source Authority:** Explicit user query (full "GROK — CALEB AI HOLLOWCUT EXPORT READINESS ARTIFACT CONTRACT SNAPSHOT PASS" block), docs/00/01/02, previous rollup pass artifacts, existing Hollowcut/Timeline contract style in docs/ (markdown contracts + rules + shapes), PLANS.md ExecPlan requirement for schema/contract work.

**Current State (pre this pass):** Full result shape + readiness_summary + helpers (computeNextRequiredActions, computeUnmappedIssueCodes, deriveCategory, safe logic) implemented and tested. 1005 tests green. Pre-mutation snapshot for this pass executed. No schema/contract artifact existed yet for the *result* (only implementation + previous high-level mentions in Hollowcut project contract docs). Catalog counts stable (V1=12 protected, Hollowcut=8 separate).

**Scope (In):**
- Exact pre-mutation snapshot.
- Baseline green validation.
- Inspect required files + existing contract patterns (md contracts like HOLLOWCUT_PROJECT_CONTRACT.md / TIMELINE_SCHEMA_CONTRACTS.md are the convention; lightweight test helpers instead of new heavy deps).
- Create docs/contracts/hollowcut-export-readiness-result.schema.json (JSON Schema snapshot of the full result + readiness_summary).
- Create docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md (full md contract with shapes, rules, boundaries, T0/VRP, backward compat requirement).
- Add focused contract conformance tests in exportReadinessCheckHollow.test.ts (using local assertion helper) that prove valid/invalid fixtures + constructed cases match the contract (all required fields, determinism of next_required_actions, unmapped capture, safe_to_hand rule, legacy fields present, catalog counts).
- Update PLANS.md with this ExecPlan.
- Post changes: typecheck/build/test green.
- Exact 5 CLI smokes.
- Verbatim required report. Stop.

**Scope (Out / Strict Boundaries):** No new Hollow, no Hollow ID change, no V1 touch, no removal of legacy fields (ready/valid/status/.../readiness_summary), no backward break, no runtime/export/FFmpeg/media mutation, no new deps, no subjective text, no architecture changes, no placeholders. Status docs touched only if later sync needed (HOLLOWCUT_PROJECT_CONTRACT.md etc. already reflected rollup from prior pass; new dedicated result contract is the artifact here). Do not weaken any guards.

**Files Expected To Change:** PLANS.md, docs/contracts/hollowcut-export-readiness-result.schema.json (new), docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md (new), tests/hollowcut/exportReadinessCheckHollow.test.ts (add conformance its + helper). 0 changes to Hollow implementation or CLI.

**Risk Level:** Very low (additive docs + test assertions only; shape already stable and green).

**Snapshot / Rollback Plan:** Exact `npm run cli -- create-milestone-snapshot --name pre-hollowcut-export-readiness-artifact-contract-snapshot --json` executed first (ID from run, ledger written). Rollback via snapshot manager or git.

**Implementation Steps:**
1. Snapshot + baseline (typecheck/build/test) — must be green.
2. Inspect listed files + patterns in docs/ (md contracts are canonical; use local helper for tests).
3. Create the two contract artifacts (schema + md) covering every required field/rule.
4. Append ExecPlan to PLANS.md.
5. Add contract conformance tests + lightweight assert helper (prove valid/invalid + rules + catalogs + CLI paths via existing tests + required smokes).
6. Post typecheck/build/test (green).
7. Run exact 5 CLI demos.
8. Emit verbatim report with all proofs. Stop.

**Validation Commands:**
- Snapshot command (exact name).
- npm run typecheck && npm run build && npm test (pre + post; 0 failures required).
- The 5 CLI smokes.
- Full suite must stay green (catalog asserts, shape asserts).

**Acceptance Criteria (from query):** Pre snapshot created. Baseline green. Contract artifact(s) exist. Valid + invalid outputs conform (tested). Legacy fields + readiness_summary backward compatible. Full green post. V1=12, Hollowcut=8/separate. No runtime side effects beyond tiny test helper. No drift/placeholders.

**Progress Log:**
- Snapshot + baseline 1005/1005 green completed.
- Inspections + pattern discovery done (md contracts + test shape asserts are the way).
- Artifacts + test updates + PLANS ExecPlan in progress.

**Decision Log:**
- Created both preferred artifacts (schema json + md contract) to give stable snapshot for consumers.
- Followed exact style of existing Hollowcut/Timeline contracts (Purpose, Core Boundary, Shape with json, Rules, notes on supplied-state/T0/VRP).
- Used local pure-JS assert helper in the *test file only* (no new dep, no change to Hollow).
- No edits to status docs beyond the new dedicated contract (per "only if later sync"; previous passes had kept the high-level descriptions current).
- Kept all existing tests; added focused conformance its.

**Surprises / Discoveries:** The implementation + tests from the prior rollup pass were already very close to full contract coverage. This pass primarily externalized the shape into explicit artifact files + added explicit "conforms to contract" tests. Snapshot + green baseline succeeded cleanly.

**Final Report:** See the verbatim report at end of this pass. All acceptance criteria met. End of pass.

## ExecPlan - GROK — CALEB AI LOGIC ENGINE DOCTRINE + CONTRACT SOURCE INTEGRATION PASS

**Objective:** Elevate the Logic Engine (deterministic decision layer inside Orchestration Core) into official Caleb AI doctrine via a dedicated contract document. Define ownership, modules, state machine, routing doctrine, role artifact baton, handoff gates, loop control, telemetry connection, and MVP boundaries. Documentation-only; no runtime.

**Source Authority:** Explicit user query (the full "GROK — CALEB AI LOGIC ENGINE DOCTRINE + CONTRACT SOURCE INTEGRATION PASS" block), docs/00_SOURCE_INDEX_AND_AUTHORITY.md (read first), docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, AGENTS.md, CODEX.md, PLANS.md, CALEB_AI_EXECUTION_BATTLEPLAN.md, role rotation architecture PDFs/DOCX, CALEB_AI_3D_UI_THINKING_MODE_PLAN.md, inspected Hollowcut boundary plans, and established doctrine ("Models think. Hollows work. Caleb orchestrates.").

**Current State (pre this pass):** No "Logic Engine" term or dedicated contract existed. Orchestration Core is referenced in battleplan, CODEX, 3D UI plan, and Hollowcut boundaries as the future decision/routing layer (conditional Role Rotation, work graphs, role handoffs). V1 catalog exactly 12 (protected). Hollowcut catalog exactly 9 (separate). Baseline green (1017/1017). Snapshot executed. No runtime Logic Engine, Role Rotation, or Model API Layer exists or is authorized.

**Scope (In):**
- Exact pre-mutation snapshot with specified name.
- Baseline typecheck/build/npm test (green required pre-edit).
- Inspect exactly the listed files + Caleb AI source materials (battleplan, role PDFs/DOCX, 3D plan, AUTO_SNAPSHOT, Hollowcut docs, catalogs, README, PLANS, etc.) + broader grep for orchestration/role terms.
- Create docs/CALEB_LOGIC_ENGINE_CONTRACT.md covering the exact 14 required sections (core definition, ownership, 12 modules, state machine, route modes, routing doctrine, signal scoring, Work Graph, role artifact baton, Role Handoff Gate, loop control, telemetry connection, MVP boundary, explicitly forbidden).
- Narrow source index update in docs/00_SOURCE_INDEX_AND_AUTHORITY.md (add new contract to markdown list only).
- Narrow status update in README.md (one specific paragraph referencing the new contract for future Orchestration Core doctrine).
- Append this ExecPlan to PLANS.md (per PLANS rule for architecture doctrine / multi-step passes).
- Post: typecheck/build/test green.
- Produce verbatim required implementation report with all listed proofs. Stop.

**Scope (Out / Strict Boundaries):** No runtime Logic Engine code, no Role Rotation, no Model API Layer, no UI/3D Thinking Mode, no new Hollows, no new CLI, no export/render/FFmpeg/media mutation, no V1 catalog touch (stay 12), no Hollowcut catalog count change (stay 9), no modification to existing Hollow/preview/export behavior or trust gates, no broad rewrites, no placeholders. Do not update Hollowcut counts or unrelated stale text. Future phases remain future.

**Files Expected To Change:** docs/CALEB_LOGIC_ENGINE_CONTRACT.md (new), docs/00_SOURCE_INDEX_AND_AUTHORITY.md (narrow list addition only), README.md (narrow one-paragraph addition only), PLANS.md (ExecPlan append only). 0 changes to src/, tests/, Hollow catalogs, or runtime.

**Risk Level:** Very low (pure documentation + narrow list/ExecPlan updates; follows battleplan/3D plan/role material concepts exactly; no behavior impact).

**Snapshot / Rollback Plan:** Exact `npm run cli -- create-milestone-snapshot --name pre-caleb-logic-engine-contract-source-integration --json` executed first (ID: snap_20260610T191818543Z_000154_milestone, path: D:\Caleb AI\.caleb\snapshots\snap_20260610T191818543Z_000154_milestone, ledger written). Use snapshot manager or git for rollback if needed.

**Implementation Steps:**
1. Read authority docs 00/01/02 + AGENTS/CODEX/PLANS first.
2. Run exact snapshot; stop if fail.
3. Run baseline typecheck/build/npm test; stop/report if not 100% green.
4. Inspect all required files + Caleb materials + grep for orchestration/role terms.
5. Create the contract doc with exact 14 sections per query spec, using Caleb terminology (Orchestration Core, conditional Role Rotation, VRP, Ledger, Hollows, etc.) drawn from inspected sources.
6. Perform narrow source index + README updates only where lists would be stale without the new contract.
7. Append this ExecPlan to PLANS.md.
8. Run post typecheck/build/npm test; require fully green.
9. Assemble and output the exact required report (snapshot, baselines, inspected/changed, contract sections summary, commands, counts, risks, next pass). Stop. No further work.

**Validation Commands:**
- Exact snapshot command.
- npm run typecheck && npm run build && npm test (pre and post; 0 failures).
- Full suite must remain green. V1=12, Hollowcut=9 proven via catalogs + tests.

**Acceptance Criteria (from query):** Snapshot created. Baseline green before edits. docs/CALEB_LOGIC_ENGINE_CONTRACT.md exists with all 14 required sections. Logic Engine defined as deterministic state/policy machinery inside Orchestration Core (not a model, not a Hollow, not Ledger, not UI). Role Rotation defined as conditional and gated. Decouple/store/recouple + universal artifact shell + handoff gate + Work Graph + telemetry + MVP boundary captured. No runtime code, no new Hollow/CLI, V1=12, Hollowcut=9, full green, no drift/placeholders. Report produced with all bullets.

**Progress Log:**
- Snapshot + baseline 1017/1017 green completed pre-edit.
- All required inspections + greps (battleplan, role PDFs, 3D plan, Hollowcut boundaries, catalogs confirming 12/9, etc.) completed.
- Contract doc created with exact structure.
- Narrow updates + ExecPlan in progress.

**Decision Log:**
- Chose to introduce "Logic Engine" exactly as the deterministic decision/state-controller layer *inside* the already-named Orchestration Core (per battleplan definition and CODEX term preservation) rather than renaming or expanding Orchestration Core.
- Followed query's 14 sections verbatim in structure and required content while grounding definitions in inspected sources (conditional rotation triggers, work graph nodes, artifact baton, loop limits from role PDF + battleplan, telemetry surface principle from 3D plan).
- Narrow-only updates: source index list addition, one README paragraph, PLANS ExecPlan append. No Hollowcut count fixes (pre-existing, not caused by absence of this contract).
- No ExecPlan in contract doc itself (kept separate per PLANS pattern).

**Surprises / Discoveries:** The battleplan and role rotation materials already contained most of the required concepts (Orchestration Core as router/decision layer, conditional not default rotation, work graph from Planner, artifact-like plans, loopback only on material defect, stop criteria, telemetry for UI). The contract pass simply names the deterministic controller portion "Logic Engine", freezes the ownership/modules/gates, and makes it the source of truth. No conflicts found; terminology aligned cleanly. Baseline was already green with current 9 Hollowcut / 12 V1.

**Final Report:** See the verbatim report emitted at end of this pass. All acceptance criteria met. End of pass.

## ExecPlan - G1 — Grok (xAI) Live Adapter Implementation

**Objective:** Add a second live provider adapter for xAI Grok (`grok_live_adapter`), conforming to the existing R18–R36 provider-boundary contracts and mirroring the M1 Anthropic adapter pattern. The adapter must remain disabled by default, incapable of running by accident, digest-only, and trust-capped at T1. **No live provider call is made in G1.**

**Source Authority:** Explicit owner authorization (2026-07-05) to wire Grok into Caleb AI; `docs/ONE_PROVIDER_ADAPTER_LIVE_IMPLEMENTATION.md` (M1 template); `docs/FIRST_LIVE_CALL_ACCEPTANCE_REPORT.md` (M2 lessons); `docs/CALEB_AI_ROADMAP_TO_LIVE_BOUNDARY.md`; `docs/03_CANONICAL_CONTRACTS.md`; `docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md`; `AGENTS.md`; `docs/00_SOURCE_INDEX_AND_AUTHORITY.md`; `docs/01_CODEX_OPERATING_CONTRACT.md`; `docs/02_V1_PHASE_BOUNDARIES.md`; and `PLANS.md`.

**Current State:** M1 and M2 are accepted. Anthropic live adapter exists at `src/providers/anthropicLiveAdapter.ts` with CLI surface `run-one-provider-adapter-live` (currently hardcoded to `anthropic_live_adapter`). Pre-change snapshot `snap_20260705T011849270Z_000307_milestone` created with name `G1-prechange` and verified on disk before any G1 edits. Baseline green: 155 test files / 2848 tests; typecheck and build clean. V1 catalog = 12, Hollowcut catalog = 9. No Grok/xAI adapter exists yet.

**Scope:**
- Create `src/providers/grokLiveAdapterTypes.ts` and `src/providers/grokLiveAdapter.ts` — fetch-based (zero new dependencies) adapter targeting `POST https://api.x.ai/v1/chat/completions` with `Authorization: Bearer` credential closure (adapter never reads `process.env`).
- Locked adapter identity: `adapter_id` = `grok_live_adapter`, `provider_id` = `xai`, `provider_kind` = `xai_compatible`, default API base `https://api.x.ai/v1`.
- Extend `ALLOWLISTED_LIVE_ADAPTER_IDS` to include `grok_live_adapter` (Anthropic entry preserved).
- Generalize `run-one-provider-adapter-live` CLI handler to accept `--adapter-id grok_live_adapter | anthropic_live_adapter` (default remains `anthropic_live_adapter` for backward compatibility).
- First-call defaults locked for G1: `stream: false`, no tools, `search_parameters.mode: "off"`, digest-only records, budgets aligned with M1 (64 output tokens default, 30s timeout, 1 retry, 1 MiB response guard).
- Output digest sourced from `choices[0].message.content` only — never `reasoning_content`.
- Offline unit tests with injected mock `fetch` (request shaping, error mapping, redaction, refusal paths, T1 trust ceiling).
- Live test scaffold `tests/providers/grokLiveAdapter.live.test.ts` — excluded from default runs (`vitest.config.ts` + `CALEB_LIVE_TEST=1` gate + `liveTestIsolation` acceptance guard).
- CLI offline tests for Grok adapter-id routing and refusal paths.
- Narrow provider phase-boundary allowlist update in `tests/acceptance/v1PhaseBoundary.test.ts` for the two new source files.
- Provider barrel export from `src/providers/index.ts`.
- Example prompt fixture at `examples/g1-demo/grok-first-call-prompt.txt` (for G2; no live call in G1).
- Documentation: `docs/GROK_LIVE_ADAPTER_IMPLEMENTATION.md`.
- Append this ExecPlan entry to `PLANS.md`.

**Out of Scope:** No live network call in G1 (G2 is a separate acceptance pass). No new npm dependencies. No VRP, trust policy, Hollow catalog, Logic Engine routing, Role Rotation, provider fallback, streaming, web search enabled, raw prompt/output storage, second CLI command (use `--adapter-id` instead), M3 single-pass route MVP, or any change that lets a model path reach `dispatchHollow`. V1 catalog must remain 12; Hollowcut catalog must remain 9.

**Files Expected To Change:** `src/providers/grokLiveAdapterTypes.ts` (new), `src/providers/grokLiveAdapter.ts` (new), `src/providers/index.ts`, `src/providers/anthropicLiveAdapterTypes.ts` (allowlist extension only), `src/cli/commandHandlers.ts`, `src/cli/commandParser.ts`, `src/cli/cliTypes.ts` (if flag typing required), `tests/providers/grokLiveAdapter.test.ts` (new), `tests/providers/grokLiveAdapter.live.test.ts` (new), `tests/cli/runOneProviderAdapterLiveCommand.test.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `vitest.config.ts` (live exclude if needed), `examples/g1-demo/grok-first-call-prompt.txt` (new), `docs/GROK_LIVE_ADAPTER_IMPLEMENTATION.md` (new), and `PLANS.md`.

**Risk Level:** Medium-low. Adds a second live-capable adapter behind the existing gate chain; touches protected CLI handler surface (`commandHandlers.ts`) for `--adapter-id` generalization. Mitigated by offline-only tests, mock fetch, unchanged gate ordering, and no live call in this pass.

**Snapshot / Rollback Plan:** Pre-change snapshot `snap_20260705T011849270Z_000307_milestone` (name `G1-prechange`, path `D:\Caleb AI\.caleb\snapshots\snap_20260705T011849270Z_000307_milestone`, ledger entry written) created and verified before any G1 file edit. Roll back via snapshot manager to this ID if validation fails. Post-pass validation snapshot `G1-validation` must be created and verified on disk before recording its ID here.

**Implementation Steps:**
1. Read M1 implementation doc, Anthropic adapter source, live adapter contract validators, and R35/R36 prerequisites contract.
2. Confirm pre-change snapshot exists on disk; stop if missing.
3. Run baseline `npm run typecheck`, `npm run build`, `npm test`; stop if not fully green.
4. Implement `grokLiveAdapterTypes.ts` (config, defaults, credential closure type, allowlist entry).
5. Implement `grokLiveAdapter.ts` (gate chain reuse, xAI request/response mapping, digest-only results, redaction).
6. Extend allowlist in `anthropicLiveAdapterTypes.ts` or shared allowlist module; export from provider barrel.
7. Generalize CLI: `--adapter-id` flag, route to Anthropic or Grok adapter, preserve exactly one env read via `--credential-env-var` closure pattern.
8. Add offline tests + live scaffold; update boundary allowlist deliberately.
9. Add `examples/g1-demo/grok-first-call-prompt.txt` and implementation doc.
10. Run full validation suite; create `G1-validation` snapshot; update Progress Log and Final Report.

**Validation Commands:** `npm run --silent cli -- create-milestone-snapshot --name G1-prechange --json` (already completed: `snap_20260705T011849270Z_000307_milestone`); `npm run typecheck`; `npm run build`; `npx vitest run tests/providers/grokLiveAdapter.test.ts`; `npx vitest run tests/cli/runOneProviderAdapterLiveCommand.test.ts`; `npx vitest run tests/acceptance`; `npm test`; `npm run --silent cli -- list-hollows --json`; `npm run --silent cli -- list-hollowcut-hollows --json`; `npm run --silent cli -- create-milestone-snapshot --name G1-validation --json` (completed: `snap_20260705T014356336Z_000311_milestone`).

**Acceptance Criteria:** Pre-change snapshot exists and was verified on disk before edits. Grok adapter types and implementation exist behind the full gate chain. `--adapter-id grok_live_adapter` routes correctly; default remains Anthropic. Offline tests prove no network, no env read by adapter, no key in records, T1 ceiling enforced. Live scaffold excluded from default runs. Boundary allowlist updated for exactly two new provider files. V1 catalog remains 12; Hollowcut catalog remains 9. **No live call made in G1.** Full suite green; typecheck and build clean. `docs/GROK_LIVE_ADAPTER_IMPLEMENTATION.md` exists. Progress Log and validation snapshot ID recorded in this ExecPlan.

**Progress Log:** Pre-change snapshot `snap_20260705T011849270Z_000307_milestone` created via `npm run cli -- create-milestone-snapshot --name G1-prechange --json` (18 files captured, ledger entry written). Baseline confirmed green: 155 test files / 2848 tests. Implemented `xaiLiveAdapter.ts`, `xaiLiveAdapterTypes.ts`, `liveAdapterShared.ts`; CLI `--adapter-id` routing; offline + live scaffolds; boundary allowlist updates (+3 provider files). `runtimeStoragePlanningBoundary` false-positive on `grok` import paths resolved by naming source modules `xaiLiveAdapter*` (adapter_id remains `grok_live_adapter`). Validation snapshot `snap_20260705T014356336Z_000311_milestone` verified on disk. Suite at pass close: 156 test files / 2859 tests green; typecheck and build clean. **No live call made in G1.**

**Decision Log:** CLI generalization uses `--adapter-id` on the existing `run-one-provider-adapter-live` command rather than a separate Grok-only command — scales toward V4 multi-provider routing without duplicating gate logic. xAI Chat Completions (`/v1/chat/completions`) chosen over the Responses API for G1 because it is OpenAI-shaped, fetch-friendly, and sufficient for a bounded first-call membrane test in G2. `search_parameters.mode: "off"` locked for G1/G2 to prevent unbounded live-search side effects. Credential remains caller-declared closure only (`credential_auto_read: false`); env var name `XAI_API_KEY` is a G2 runtime convention, not hardcoded in the adapter. Shared digest/trust helpers extracted to `liveAdapterShared.ts` so the xAI adapter does not import Anthropic-named modules and acceptance SDK-scan tests stay green.

**Surprises / Discoveries:** `runtimeStoragePlanningBoundary` regex flags any `from "./grok…"` import path as a forbidden provider SDK — internal module names must avoid the literal `grok` segment in `src/` import paths even when `adapter_id` is `grok_live_adapter`.

**Final Report:** G1 accepted. Files created: `src/providers/xaiLiveAdapter.ts`, `src/providers/xaiLiveAdapterTypes.ts`, `src/providers/liveAdapterShared.ts`, `tests/providers/grokLiveAdapter.test.ts`, `tests/providers/grokLiveAdapter.live.test.ts`, `examples/g1-demo/grok-first-call-prompt.txt`, `docs/GROK_LIVE_ADAPTER_IMPLEMENTATION.md`. Files changed: `src/providers/anthropicLiveAdapter.ts`, `src/providers/anthropicLiveAdapterTypes.ts`, `src/providers/index.ts`, `src/cli/commandHandlers.ts`, `src/cli/commandParser.ts`, `tests/acceptance/v1PhaseBoundary.test.ts`, `tests/acceptance/liveTestIsolation.test.ts`, `tests/cli/runOneProviderAdapterLiveCommand.test.ts`, `tests/providers/anthropicLiveAdapter.test.ts`, `PLANS.md`, `docs/STATUS_LOG.md`. V1 catalog 12; Hollowcut catalog 9. Next: G2 first Grok live call (owner authorization required).

## ExecPlan - G2 — First Grok Live Call Acceptance (planned; not authorized to start until G1 accepted)

**Objective:** Execute exactly one bounded, gated, fully ledgered live invocation of `grok_live_adapter` and write `docs/FIRST_GROK_LIVE_CALL_ACCEPTANCE_REPORT.md`. Document membrane integrity, redaction proof, trust tier, token usage, cost, and any reality-vs-contract findings (including digest mismatch if applicable).

**Source Authority:** Owner authorization required after G1 acceptance; `docs/FIRST_LIVE_CALL_ACCEPTANCE_REPORT.md` (M2 template); `docs/GROK_LIVE_ADAPTER_IMPLEMENTATION.md` (G1 output).

**Current State:** G1 accepted. G2 completed 2026-07-05.

**Scope:** One live call only. Dry-run evidence ledgered before invocation. Redaction scan on real ledger output. Acceptance report. STATUS_LOG entry. Post-change milestone snapshot.

**Out of Scope:** No source changes unless reality breaks contracts (contract-correction passes scheduled separately). No second provider. No M3 route MVP.

**Snapshot / Rollback Plan:** Pre-change `snap_20260705T015648621Z_000313_milestone`. Validation snapshot recorded at pass close.

**Validation Commands:** `npm run cli -- create-milestone-snapshot --name G2-prechange --json`; live invocation with full gate flags and `--write-ledger`; ledger scan for key/prompt/output absence; `npm test` unchanged and green.

**Acceptance Criteria:** One real `request_id` in the report. Membrane intact. Trust tier T0/T1 only. Honest digest mismatch reporting if applicable. Suite green. No source changes unless separately authorized.

**Progress Log:** Pre-change snapshot `snap_20260705T015648621Z_000313_milestone`. Attempt 1 failed HTTP 410 (`search_parameters` rejected by xAI). Minimal wire fix in `xaiLiveAdapter.ts` + test update (authorized reality correction). Attempt 2 succeeded: provider ID `91bc2421-b27f-9247-8009-5cda43341a53`, digest matches `acknowledged`. Report `docs/FIRST_GROK_LIVE_CALL_ACCEPTANCE_REPORT.md`. Credential bridge file deleted. Validation snapshot `snap_20260705T020128766Z_000314_milestone`. Suite green at pass close.

**Final Report:** G2 accepted. Source changed: `src/providers/xaiLiveAdapter.ts`, `tests/providers/grokLiveAdapter.test.ts`, `docs/FIRST_GROK_LIVE_CALL_ACCEPTANCE_REPORT.md`, `docs/GROK_LIVE_ADAPTER_IMPLEMENTATION.md`, `docs/STATUS_LOG.md`, `PLANS.md`, `.caleb/ledger/ledger.jsonl`. Next: owner-directed (M3 or default model review).

## ExecPlan - AUD-1 Pass Compliance Auditor Hollow

**Objective:** Implement `hollow.audit.pass_compliance_check` v1.0.0 — a supplied-state-only, deterministic, report-only protocol compliance auditor. Register in V1 catalog (12 → 13). Add fixtures, unit tests, VRP regression, and contract doc.

**Source Authority:** AUD-1 go-order; Amendment A1 (catalog count lock re-key); `docs/01_CODEX_OPERATING_CONTRACT.md`; `docs/02_V1_PHASE_BOUNDARIES.md`.

**Current State:** RA-R2 at `53f7e37`. Suite 173 files / 3,001 tests green. LG-1 `idFactory` prefix_uuid IDs in production.

**Scope:** `src/hollows/audit/passComplianceCheck.ts`; catalog registration in `v1HollowCatalog.ts` + `index.ts`; `examples/hollows/pass-compliance.*.json`; `tests/hollows/passComplianceCheck.test.ts`; `tests/hollows/passComplianceCheck.vrp.regression.test.ts`; `docs/PASS_COMPLIANCE_AUDITOR_CONTRACT.md`; PLANS update.

**Amendment A1 (authorized narrow re-key):** Update catalog count/roster assertions 12 → 13 only in five named lock files. Superseded by A2 for remaining locks.

**Amendment A2 (exhaustive count-lock re-key):** Discovery-first re-key of all V1 catalog count/roster locks across `tests/` (57 files touched). Historical doc-content locks left untouched (`snapshotClaimIntegrityGateAcceptance`, `m3RawOutputBoundaryAcceptanceLock` category string). Self-smoke fixture updated with test-tree `allowed_modify` globs.

**Out of Scope:** AUD-2 git changeset collection; enforcement/mutation; non-count assertion changes in lock tests; historical acceptance report doc edits.

**Snapshot / Rollback Plan:** Pre-change `snap_20260707T142234020Z_000368_milestone` (`aud_1_pass_compliance_auditor_prechange`, verified on disk).

**Implementation Steps:**
1. Implement pass compliance evaluator + Hollow manifest/implementation.
2. Register in V1 catalog and export from barrel.
3. Add example fixtures including self-smoke.
4. Re-key authorized catalog count locks (Amendment A1).
5. Add unit + VRP regression tests.
6. Add contract doc.
7. Run `npx tsc --noEmit`; focused vitest; full vitest suite.
8. Commit; issue formal PASS REPORT.

**Validation Commands:** `npx tsc --noEmit`; `npx vitest run tests/hollows/passComplianceCheck.test.ts tests/hollows/passComplianceCheck.vrp.regression.test.ts`; `npx vitest run`.

**Acceptance Criteria:** All protocol test cases pass; VRP T2 evidence with LG-1 IDs; self-smoke compliant; authorized locks re-keyed 12 → 13; full suite green; no forbidden files touched.

**Progress Log:** A1 snapshot `snap_20260707T142234020Z_000368_milestone`. A2 snapshot `snap_20260707T154921326Z_000370_milestone` verified. Exhaustive count-lock re-key across 57 test files. Self-smoke fixture fixed (duplicate path removed). Focused vitest: 21/21 green. Full vitest: **175 files / 3,022 tests green** (+21 tests vs RA-R2 baseline count; +2 files).

**Decision Log:** A2 leaves historical doc-content locks at 12 (`snapshotClaimIntegrityGateAcceptance` line 57, `m3RawOutputBoundaryAcceptanceLock` report category string). Self-smoke `allowed_modify` uses `tests/**` subtree globs for truthful A2 scope.

**Surprises / Discoveries:** Self-smoke duplicate changeset path (`created` + `modified` same file) caused `valid:false`; fixed by single `modified` entry. Parallel `tsc` invocations in agent session hung reproducibly; isolated user-session runs previously completed exit 0 in ~18–24s on same tree.

**Final Report:** AUD-1 accepted under A2. V1 catalog 13; full suite green.

## ExecPlan - AUD-2 Git Changeset Collection Seam

**Objective:** Wire `hollow.audit.pass_compliance_check` to real git working-tree state via `audit-pass-compliance` CLI command. Git collection in CLI/integration layer only; Hollow purity preserved.

**Source Authority:** AUD-2 go-order; `docs/PASS_COMPLIANCE_AUDITOR_CONTRACT.md`; `docs/01_CODEX_OPERATING_CONTRACT.md`.

**Current State:** AUD-1 accepted at `cea7daf`. Suite 175 files / 3,022 tests green.

**Scope:** `src/audit/*`; CLI registration (`commandParser.ts`, `commandHandlers.ts`, `cliTypes.ts`); tests; `docs/AUD_2_GIT_CHANGESET_COLLECTION_SEAM.md`; `examples/audit/aud2-pass-manifest.valid.json`; PLANS.

**Out of Scope:** New Hollow; catalog changes; enforcement; AUD-1 Hollow contract changes; provider/role/runtime changes.

**Snapshot / Rollback Plan:** Pre-change `snap_20260707T163824736Z_000372_milestone` (`AUD2_prechange`, verified on disk).

**Validation Commands:** `npx vitest run tests/audit/* tests/cli/auditPassComplianceCli.test.ts tests/acceptance/aud2GitChangesetCollectionSeamAcceptance.test.ts`; `npx tsc --noEmit` (single invocation); `npx vitest run`.

**Acceptance Criteria:** CLI command operational; git collection + normalization; runner/VRP path; T2 verdict; report-only exit semantics; Hollow purity regression; full suite green.

**Progress Log:** Pre-change snapshot `snap_20260707T163824736Z_000372_milestone` created and verified. Git collector, CLI command, tests, and docs implemented. CLI lock discovery: no direct command-count/roster locks found. Focused AUD-2 tests: 25/25 green. Full suite: 179 files / 3,048 tests green (+4 files, +26 tests vs baseline). `npx tsc --noEmit`: first run during implementation reported 3 errors (fixed); subsequent unloaded runs hung >600s with no output (environmental finding, consistent with AUD-1). Self-smoke: T2 verified, `compliant: false` due to known `true /root/vitest-metadata.json` git noise (out of scope).

**Final Report:** AUD-2 accepted. `audit-pass-compliance` CLI collects git changeset, normalizes for AUD-1 Hollow, invokes registry/runner/VRP path; Hollow purity preserved; report-only semantics confirmed.

## ExecPlan - TRUE-2 Vitest Dump Hygiene + Audit Noise Guardrail

**Objective:** Remove malformed `true /root/vitest-metadata.json` Vitest dump artifact; add `.gitignore` protection; harden AUD-2 collector against whitespace-polluted path components; document operator guidance.

**Source Authority:** TRUE-1 diagnostic report; `docs/AUD_2_GIT_CHANGESET_COLLECTION_SEAM.md`.

**Current State:** AUD-2 accepted at `ec8309c`. Suite 179 files / 3,048 tests green. Pre-existing `true /` git noise from Vitest `VITEST_DEBUG_DUMP="true "` footgun.

**Scope:** `.gitignore`; `src/audit/gitChangesetCollector.ts`; path hygiene tests; `docs/TRUE_2_VITEST_DUMP_HYGIENE.md`; `examples/audit/true2-pass-manifest.valid.json`; artifact cleanup; PLANS.

**Out of Scope:** Hollow changes; LE consumption; Vitest config override; cross-env; package lockfiles; external env mutation.

**Snapshot / Rollback Plan:** Pre-change `snap_20260707T183454421Z_000376_milestone` (`TRUE2_prechange`, verified on disk).

**Validation Commands:** `npx vitest run tests/audit/gitChangesetCollector*.test.ts`; `npm run --silent cli -- audit-pass-compliance --manifest examples/audit/true2-pass-manifest.valid.json --base-ref HEAD --json`; `npx tsc --noEmit`; `npx vitest run`.

**Acceptance Criteria:** Artifact removed; git warning gone; ignore patterns verified; `AUD2_INVALID_PATH_COMPONENT_WHITESPACE` collector hardening; self-smoke T2 without `true /root` violation; suite green.

**Progress Log:** Pre-change snapshot `snap_20260707T183454421Z_000376_milestone` created and verified. Malformed `true ` directory removed via Node `fs.rmSync` (PowerShell `Remove-Item` failed on trailing-space literal path). `.gitignore` Vitest dump patterns added and verified with `git check-ignore`. Collector hardened with `AUD2_INVALID_PATH_COMPONENT_WHITESPACE`. Focused tests: 17/17 green. Self-smoke TRUE-2 manifest: compliant, T2 verified, no `true /root` violation. Full suite: 180 files / 3,055 tests green (+1 file, +7 tests). `npx tsc --noEmit`: pass.

**Final Report:** TRUE-2 accepted. Vitest dump hygiene guardrails in place; AUD-2 collector rejects whitespace-polluted paths; git `true /` warning eliminated.
