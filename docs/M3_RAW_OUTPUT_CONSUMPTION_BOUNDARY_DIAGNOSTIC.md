# M3 Raw Output Consumption Boundary Diagnostic

Status: Diagnostic only - pending Pat approval before implementation
Date: 2026-07-05
Canonical protocol: `docs/protocols/PASS_PROTOCOL_M3.md`
Design contract: `docs/RAW_OUTPUT_BOUNDARY_CONTRACT.md`
Pre-change snapshot: `snap_20260705T173738508Z_000327_milestone` (verified on disk before recording)

## 1. Diagnostic Scope

This diagnostic evaluates M3 implementation shape only. It does not implement M3.

No `src/`, `tests/`, `types/`, provider adapter, egress allowlist, storage implementation, validator, lineage gate, trust logic, catalog, package, or UI file is changed by this diagnostic.

M3 remains CLI/test-only. M3 does not add a user-facing UI. Display flow is deferred to `M4-DISPLAY-BOUNDARY` or another Pat-approved display-boundary pass.

## 2. M3-C Obligation Coverage

The canonical protocol fully represents the M3-C contract obligations.

Covered obligations:

- raw provider/model output enters as T0
- schema-valid provider/model output may become T1 only
- provider/model output is capped at T1 forever
- storage, digest presence, API success, network success, provider identity, model agreement, report inclusion, ledger reference, and opt-in flags are non-promoters
- raw content must not be written raw into the Ledger
- raw/model/provider Ledger references must remain digest/ref-only
- every derived-evidence record must carry `measurement_tier`, `subject_tier`, and `effective_tier`
- `effective_tier = min(measurement_tier, subject_tier)`
- downstream decision logic may consume `effective_tier` only
- `measurement_tier` and `subject_tier` are provenance fields only
- lineage must resolve through a lineage-resolution gate
- new lineage may use post-H4 UUID-style ledger IDs only
- counter-era IDs are barred from new lineage use
- authorized-deleted content must be distinct from unresolved missing content
- deletion removes content only, never ledger records
- Ledger digest references persist forever
- display flow and consumption flow are separate
- M3 implements consumption flow only
- display flow is a named deferral
- NEVER-flow absence assertions are required for persistence-as-truth, side-effect triggers, trust-promotion inputs, and Logic Engine routing decisions
- the golden-path worked example is executable acceptance, not documentation only
- H5 network and credential-read traps must remain preserved
- V1 catalog remains exactly 12
- Hollowcut catalog remains exactly 9

Coverage finding: no missing M3-C obligation was found in `docs/protocols/PASS_PROTOCOL_M3.md`.

## 3. Artifact-Store Substrate Evaluation

### Option A: In-memory extension

Description: extend the existing `InMemoryArtifactStore` pattern with raw-output records and digest-addressed content held only in process memory.

Strengths:

- simplest implementation surface
- easiest focused unit testing
- no filesystem raw-content risk
- no `.gitignore` change required
- naturally offline and compatible with H5 traps
- good fit for synthetic fixtures and detector tests

Weaknesses:

- weak replay value after process exit
- deletion semantics are less realistic because content disappears with process lifetime
- less representative of M3-C's content-addressed raw-output storage contract
- harder to prove Ledger digest references persist while content can be authorized-deleted later
- less useful for future audit, CLI replay, and post-run inspection

Fit for M3: acceptable as an internal fast-path test adapter, but too thin as the main M3 authority substrate.

### Option B: `.caleb/artifacts/` content-addressed store

Description: create a local content-addressed store under `.caleb/artifacts/`, keyed by sha256 digest, with digest verification on retrieval and structured absence states.

Strengths:

- best matches M3-C wording: content-addressed artifact store keyed by sha256 digest
- strong replay value across process boundaries
- realistic deletion semantics: content can be deleted while Ledger provenance remains
- clear Ledger compatibility: Ledger stores digest/ref only, artifact store stores content
- testable corruption path by altering temp-store content
- clean fit for golden-path acceptance: live-call-shaped text becomes digest/ref content consumed by Character Count Hollow
- future-proof for later display-boundary and audit passes

Weaknesses:

- higher implementation complexity than in-memory
- raw-content commit risk if `.caleb/artifacts/` is not ignored before any real content write
- requires careful path safety and digest normalization
- deletion event design must avoid mutating historical Ledger content

Fit for M3: recommended authority substrate if Pat approves the required guardrails.

### Required guardrails if Option B is approved

- Add `.caleb/artifacts/` to `.gitignore` before any implementation writes raw content there.
- Tests should use temp artifact-store roots by default, not the live workspace store.
- Any workspace `.caleb/artifacts/` write must be explicit and CLI/test-only.
- Ledger entries must contain digest/ref metadata only.
- Retrieval must re-hash content and fail with structured corruption on mismatch.
- Deletion must return structured `content_deleted` absence and must never delete or rewrite Ledger records.

## 4. Fast Path vs Authority Path

Fast Path:

- Use an in-memory content-addressed adapter for pure unit tests.
- Exercise tier math, structural split, detector fixtures, and simple retrieval without touching disk.
- Keep it deterministic, cheap, and independent of filesystem state.

Authority Path:

- Implement `.caleb/artifacts/` content-addressed storage for the actual M3 boundary.
- Use temp directories in acceptance tests to prove the same authority-path behavior without risking committed raw content.
- Add `.caleb/artifacts/` to `.gitignore` before any raw-content write.

Recommendation: approve both paths with a strict division. The in-memory path is a testing fast path only. The `.caleb/artifacts/` content-addressed store is the M3 authority path.

## 5. Structural Split Recommendation

Recommendation: use the structural split.

Provenance-facing records should carry:

- `measurement_tier`
- `subject_tier`
- `effective_tier`

Decision-facing interfaces should expose:

- `effective_tier` only

Rationale:

- It makes correct consumption easier than incorrect consumption.
- It prevents downstream decision code from casually keying off `measurement_tier`.
- It preserves the explanation of the tier outcome for audit and reports.
- It still requires behavioral misuse detectors, as the protocol states.

Required detector coverage remains:

- synthetic `measurement_tier` misuse detector
- synthetic `subject_tier` misuse detector
- laundering detector
- NEVER-flow absence assertions

## 6. CLI/Test-Only Boundary

M3 should remain CLI/test-only.

Allowed for M3:

- executable acceptance tests
- focused unit tests
- optional CLI/report-safe summaries if Pat explicitly approves the CLI surface
- digest/ref metadata needed for acceptance reporting

Not allowed for M3:

- UI
- 3D Thinking Mode
- 2D inspector
- display text as a consumption input
- display text as a routing input
- display text as a trust-promotion input
- display text as a persistence-as-truth input
- display text as a side-effect trigger

Diagnostic recommendation: do not add a new user-facing CLI command unless Pat explicitly wants it. The first M3 implementation can be accepted through tests and docs while still remaining CLI/test-only.

## 7. Proposed Files To Create

If Pat approves the recommended authority path, M3 implementation should create a narrow raw-output boundary module set:

- `src/rawOutput/rawOutputArtifactTypes.ts`
- `src/rawOutput/contentAddressedRawOutputStore.ts`
- `src/rawOutput/rawOutputLifecycle.ts`
- `src/rawOutput/derivedEvidenceTypes.ts`
- `src/rawOutput/derivedEvidencePolicy.ts`
- `src/rawOutput/lineageResolutionGate.ts`
- `src/rawOutput/rawOutputConsumptionBoundary.ts`
- `src/rawOutput/index.ts`
- `tests/rawOutput/contentAddressedRawOutputStore.test.ts`
- `tests/rawOutput/rawOutputLifecycle.test.ts`
- `tests/rawOutput/derivedEvidencePolicy.test.ts`
- `tests/rawOutput/lineageResolutionGate.test.ts`
- `tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`
- `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_IMPLEMENTATION.md`

If Pat wants the fast path only, reduce the create list to the raw-output types, lifecycle, policy, in-memory content-addressed store, and tests. That path is not recommended as the final M3 implementation substrate.

## 8. Proposed Files To Modify

Recommended authority-path modifications:

- `.gitignore` - add `.caleb/artifacts/`
- `src/index.ts` - export raw-output boundary module if repo export style requires it
- `PLANS.md` - living ExecPlan for M3 implementation
- `docs/STATUS_LOG.md` - completion entry

Possible modifications if tests or exports require them:

- `src/storage/index.ts` - only if the content-addressed store is placed under `src/storage/` instead of `src/rawOutput/`
- `tests/acceptance/v1PhaseBoundary.test.ts` - only if the existing boundary lock enumerates new source directories and requires explicit allowance

Files that should not be modified in M3 unless Pat separately approves:

- provider adapters
- provider types
- egress allowlists
- live adapter gate chain
- historical Ledger content
- V1 Hollow catalog
- Hollowcut catalog
- UI files
- package or lockfiles

## 9. Proposed Acceptance Tests

Minimum acceptance additions:

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

Golden-path acceptance should be one end-to-end test:

1. create live-call-shaped provider/model output as T0 raw
2. schema-validate it to T1 only
3. store raw text by sha256 digest/ref
4. write or synthesize Ledger refs containing digest/ref only
5. resolve content through the approved consumption boundary
6. run Character Count Hollow on the resolved content
7. produce derived evidence with `measurement_tier = T2`, `subject_tier = T1`, `effective_tier = T1`
8. prove `effective_tier = min(measurement_tier, subject_tier)`
9. prove downstream decision view exposes/consumes `effective_tier` only
10. prove the measurement does not promote subject/model content above T1

## 10. Open Risks

- `.caleb/artifacts/` is not currently ignored. Authority-path implementation must add the ignore rule before writing raw content.
- Existing `RuntimeStorageRecordKind` does not include a raw-output artifact kind. M3 can avoid this by keeping raw-output records in the new raw-output module, or Pat can approve extending runtime storage types.
- Existing `LedgerEntry` type does not have first-class `derived_from`, `source_tiers`, `measurement_tier`, `subject_tier`, or `effective_tier` fields. M3 can store those under `provenance`/`artifact_refs` without changing the base Ledger type, or Pat can approve a typed Ledger extension.
- The golden-path test must consume stored/ref-addressed content without teaching the Character Count Hollow to dereference artifacts itself. The cleaner path is a boundary wrapper that resolves content and then invokes the existing Hollow.
- Deletion semantics require a structured absence result, but actual content deletion should be test-scoped in M3 unless Pat authorizes workspace `.caleb/artifacts/` exercise.
- Acceptance tests must be careful not to use raw provider/model text strings that later appear in Ledger scans as test labels or expected messages.
- The H5 egress scanner may require a source allowlist update for any new raw-output files if keywords such as `fetch` or `network` appear in tests or docs; implementation should check before committing.

## 11. Decisions Requiring Pat Approval

1. Approve the recommended authority path: `.caleb/artifacts/` content-addressed store with `.gitignore` guard and temp-dir tests.
2. Approve keeping the in-memory path as a fast-path test adapter only.
3. Approve the structural split: provenance-facing tier triplet, decision-facing `effective_tier` only.
4. Decide whether M3 may extend runtime storage types or should keep raw-output types separate under `src/rawOutput/`.
5. Decide whether M3 may extend Ledger types or should record lineage/tier metadata under existing `provenance` and `artifact_refs`.
6. Decide whether M3 should add any CLI surface, or remain test/docs accepted with no new command.
7. Confirm `.gitignore` modification for `.caleb/artifacts/` is authorized before implementation writes raw content.

## 12. Diagnostic Recommendation

Recommended M3 implementation plan:

- Use `.caleb/artifacts/` content-addressed storage as the authority path.
- Add `.caleb/artifacts/` to `.gitignore` before raw content writes.
- Use temp artifact-store roots in tests.
- Keep in-memory content-addressed storage only as a fast-path test adapter.
- Use the structural split for provenance-facing vs decision-facing data.
- Keep M3 CLI/test-only and add no UI.
- Defer display flow to `M4-DISPLAY-BOUNDARY`.
- Avoid provider adapter, egress allowlist, catalog, package, and historical Ledger changes.

Ready for Pat approval: yes.

Stop condition: do not implement M3 until Pat explicitly approves the diagnostic decisions above.
