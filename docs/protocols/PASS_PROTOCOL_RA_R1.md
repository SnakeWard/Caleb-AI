# Pass Protocol RA-R1 - Role Artifact Runtime: Static Rotation V1

Prepared by: Claude Fable 5 (reviewer/planner), for execution by Codex (implementer)

Convention: this file is committed as the RA-R1 protocol-draft pass. After this protocol-stage commit, stop. The RA-R1 diagnostic does not begin without Pat approval. Implementation does not begin without Pat approval of the diagnostic.

Canonical sources, in authority order: RA-C full text (`docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md`), M3/M3-A/M3-B/M3-T boundary stack, L1/L1-A/L1-B route-input stack, Pat's witnessed spot-check, Fable's full-text RA-C review, and Pat's compiled RA-R1 requirements. Where this protocol and RA-C conflict, RA-C wins and the conflict is reported.

## 1. Pass name

RA-R1 - Role Artifact Runtime: Static Rotation V1 (protocol -> diagnostic -> implementation, each gated on Pat approval)

## 2. Purpose

Implement the first role rotation runtime: a deterministic executor that walks a statically declared role sequence, invokes each role against injected model adapters, handles every emitted artifact under the RA-C contract, enforces context as inert transport with mandatory context provenance, and produces a rotation chain fully reconstructable from the Ledger alone.

The runtime moves artifacts and invocations. It decides nothing. Every decision it appears to make was made earlier by the declared sequence, deterministic gates, or Pat.

## 3. Prior summary

RA-C accepted at full text: role artifacts are model outputs, T1-capped; consumption flows are enumerated; extraction path is defined and deferred to RA-X; the worked example shows Planner -> Critic with `defects_found: true` blocked as route authority. L1-B locked a seven-entry route-input allowlist and standing masquerade fixture. M3-T strengthened non-promoter and display-deferral acceptance evidence. Catalogs remain V1 = 12 and Hollowcut = 9.

## 4. Core rules

### A. Doctrine

- Role artifacts are model-originated T1/advisory content.
- Role identity promotes nothing.
- Context influencing a model is legal; context influencing the runtime is a breach.
- The runtime never reads artifact content for any purpose other than computing its digest, storing it in the M3 content-addressed store, and assembling it into a subsequent role's model-invocation context.
- The runtime may not parse, inspect fields, keyword-check, length-branch, summarize, extract from, or otherwise condition behavior on artifact prose.
- Runtime inputs are structure and identity: sequence position, artifact digests, validation verdicts, and tier fields, never prose.

### B. Static sequencing

- The rotation sequence is statically declared in a contract-validated rotation plan.
- The plan contains an ordered role list, per-role adapter binding, and structural stop conditions.
- Stop conditions are structural only: sequence exhaustion, max-invocation ceiling, or fail-closed halt.
- V1 rotation plans are human-authored or test-fixture only.
- A model-emitted rotation plan is T1 prose choosing the sequence and is illegal until an RA-X-era extraction path exists for plan proposals.
- The plan validator must record plan provenance with `authored_by: human | fixture` and reject `model`.

Illegal sequencing must be detector-backed: runtime inspecting artifact content to choose the next role; `defects_found` or any artifact field as routing authority; model judgment selecting roles; artifact content stopping, continuing, looping, or skipping rotation; and role substitution at runtime.

### C. Context provenance and inert transport

- Every role invocation's Ledger entry enumerates exactly the artifact digests that entered that invocation's context.
- Context refs use post-H4 IDs and digest refs only.
- Raw prose must not be written into the Ledger.
- Context assembly is inert: resolve digests through the M3 store, concatenate or format with a fixed deterministic template, and deliver to the adapter.
- The runtime may not act on, filter by meaning, summarize, or extract from context content en route.
- Formatting is structure-only: ordering by declared sequence position and fixed delimiters.
- Context content cannot become a route input, trust promoter, gate bypass, release authority, or side-effect trigger.

### D. Role handoff gate classification

The RA-R1 diagnostic must classify the existing `roleHandoffGate` before implementation:

- what it checks
- whether every check is deterministic over artifact structure
- whether any check evaluates content quality, argument quality, completeness of reasoning, defect truth, or anything judgment-shaped
- what tier its verdict carries
- what consumes the verdict
- whether the verdict can move Caleb's state machine and, if so, through which of the seven L1-approved route-input types

Judgment-shaped checks are named and either removed from the gate or deferred to RA-X. They must not enter the runtime as deterministic gate evidence. If the gate is structure-only, its verdict may gate artifact acceptance and proceed/halt within the declared sequence as a structural stop condition; the diagnostic must state this with the verdict's tier.

### E. Trust and storage

- Every role artifact enters as T0 raw.
- `validateRoleArtifact` may validate it to T1 maximum.
- Raw content is stored in `.caleb/artifacts/` through the M3 content-addressed store.
- Ledger entries carry digest/ref, role identity, provider/model provenance, and lineage.
- Role identity, provider identity, model identity, digest presence, storage presence, report inclusion, display inclusion, and handoff-gate acceptance promote nothing.
- No role artifact, verdict, or runtime state may touch the L1 allowlist, which remains seven entries.

### F. Adapters and offline default

- The runtime invokes roles through an injected adapter interface satisfied by mock adapters in all default tests.
- Existing live adapters are not wired into any default path.
- Live rotation is a future separate manual gated acceptance event and is not part of RA-R1.
- The full suite must remain green under H5 traps with zero live configuration.

### G. Failure semantics

- Fail closed on adapter failure, artifact validation failure, storage failure, or lineage failure.
- Halt rotation with a structured Ledgered failure record.
- Record which roles completed, which role failed, and why by code, not prose.
- No skip-and-continue, no runtime-initiated retry, and no role substitution.
- Recovery is a human decision or future deterministic policy.

### H. Process

This document's commit is the RA-R1 protocol pass. Diagnostic next, only on Pat approval. Implementation only after Pat approves the diagnostic. Snapshot must be verified on disk before recording at every mutation stage. Honest deviations are mandatory.

## 5. Files to create

Protocol stage:

- `docs/protocols/PASS_PROTOCOL_RA_R1.md`

Future implementation stage, subject to diagnostic and Pat approval:

- `src/roleRuntime/`
- `tests/roleRuntime/`
- `tests/acceptance/raR1StaticRotationAcceptance.test.ts`
- `docs/RA_R1_STATIC_ROTATION_IMPLEMENTATION.md`
- diagnostic document at diagnostic stage

## 6. Files to modify

Protocol stage:

- `docs/STATUS_LOG.md`
- `PLANS.md`
- `.caleb/ledger/ledger.jsonl` through required snapshot command

Not authorized in this stage:

- `src/`
- `tests/`
- `types/`
- providers
- egress
- package files
- catalogs
- UI
- historical Ledger content
- L1 allowlist files or lock tests
- M3 boundary modules

## 7. Documentation requirements

The future implementation document must contain the runtime decision inventory, rotation-plan schema with authorship rule, context-assembly template, handoff-gate classification outcome, failure semantics, and statement that live rotation is a named future gated event.

This protocol-stage commit records only the canonical RA-R1 protocol and pass ledgers.

## 8. Acceptance requirements

Future implementation acceptance must include:

- Golden rotation test: fixture Planner -> Critic with mock adapters, artifacts T0 -> T1, digest-stored and lineage-linked, exact `context_refs`, Critic context containing Planner content delivered to the mock adapter while runtime records only digests.
- Chain reconstructability test from `ledger.jsonl` alone.
- Detectors for artifact content steering, `defects_found` as sequencing or stop authority, model-authored plan rejection, context content as route input, and mid-rotation fail-closed halt.
- Absence assertions for context influence over runtime routing/state transitions, unchanged L1 allowlist, M3 non-promoters, M3-T agreement non-promotion, display deferral, and no live adapter default path.
- V1 catalog remains 12.
- Hollowcut catalog remains 9.

Protocol-stage acceptance:

- Protocol file exists.
- `PLANS.md` and `docs/STATUS_LOG.md` record the protocol-only stage.
- No implementation files are modified.
- Typecheck, build, full suite, and catalog checks pass.
- Commit with RA-R1 protocol in the message.
- Push and end clean.

## 9. Validation commands

Protocol stage:

- `git status --short`
- `npm run --silent cli -- create-milestone-snapshot --name "ra_r1_protocol_prechange"`
- `npx tsc --noEmit`
- `npm run build`
- `npx vitest run`
- `npm run --silent cli -- list-hollows --json`
- `npm run --silent cli -- list-hollowcut-hollows --json`
- `git status --short`

Future stages must use their own pre-change snapshots: `ra_r1_diagnostic_prechange` and `ra_r1_implementation_prechange`.

## 10. Report format

Protocol-stage report must include files created/changed, pre-change snapshot, validation results, catalog counts, commit hash, push result, final clean-tree status, and explicit stop statement.

Future implementation verdict, only after Pat-approved diagnostic and implementation:

`RA-R1 Static Rotation Runtime: Accepted - Caleb rotates roles by declared sequence; artifacts flow, prose does not steer; the chain is reconstructable from the Ledger alone.`

## Standing rules

This commit is protocol-draft only. No `src/`, `tests/`, `types/`, providers, egress, package, catalog, UI, or historical Ledger changes are authorized in this stage. Diagnostic and implementation each require Pat's explicit approval. If handoff-gate classification later finds judgment-shaped checks, that is a finding for Pat, not a thing to quietly fix. If any rule appears to require touching the L1 allowlist, stop and report.
