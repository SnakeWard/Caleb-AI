# Caleb AI — Pass Protocol LE-1

**Prepared by:** Claude Fable 5 (reviewer/planner, returning seat), for execution by the current implementer
**Convention:** commit this file to `docs/protocols/PASS_PROTOCOL_LE1.md` before or with the work. Handoff rule: first action `git status --short`; if dirty and not yours, STOP and report to Pat.
**Pass type:** contract / read-only integration. No rotation execution, no role invocations, no provider adapters, no side effects, no runtime behavior mutation beyond the read-only decision seam this pass creates.

---

## Preconditions (blocking — resolved in the diagnostic before any implementation)

The TRUE-2 report omitted mandatory lines; the LE-1 diagnostic must restore them to the record before the seam is built:

- **P1 — Catalog disposition, stated affirmatively.** Current V1 count and Hollowcut count, and the catalog placement of the AUD-1 Auditor Hollow: (a) added to V1 via a visible protocol-governed amendment of the catalog pin (cite the pass and diff), (b) resident in a new named catalog with its own count now asserted in every pass, or (c) outside the catalog system (state the doctrine for why, in one sentence). If the Auditor Hollow changed a locked count with no visible pin amendment, that is a finding — STOP and report before LE-1 proceeds.
- **P2 — RA-R1-D classification review status.** Confirm whether the full-text review of the roleHandoffGate classification (required at the Fable→GPT reviewer handoff) was performed, by whom, and its outcome. If it was never performed, it is performed NOW, inside the LE-1 diagnostic, against the criteria in the handoff briefing (structural vs. judgment-shaped, citation spot-checks) — because LE-1 is where the rotation contract layer first touches the steering boundary, and an unreviewed "clean" must not be load-bearing there.
- **P3 — RA-R1 implementation status.** State whether RA-R1 static rotation runtime was implemented, deferred, or restructured into the RA-R2 contract-first path. LE-1's seam design references whichever is true; the diagnostic states it so the record stops being ambiguous.

---

## Pass LE-1 — Logic Engine RuntimeRotationPlan Consumption Seam

### 1. Pass name
LE-1 — Logic Engine RuntimeRotationPlan Consumption Seam (read-only)

### 2. Purpose
Prove the Logic Engine can consume, validate, and classify a RuntimeRotationPlan (the RA-R2 contract) at its route-selection boundary and record a deterministic route-decision artifact — without executing rotation, invoking any role or provider, or mutating runtime behavior. This is the first physical connection between the rotation contract layer and the engine, built as a seam: the engine learns to READ rotation plans before it is ever allowed to RUN them.

### 3. Prior summary
RA-R2 defined the RuntimeRotationPlan contract. AUD-1/AUD-2 delivered the Auditor Hollow wired to real git changesets. TRUE-1/TRUE-2 root-caused and eliminated Vitest/git audit noise. Suite at 180 files / 3,055 tests green, typecheck clean, tree clean at `3711cea`. Preconditions P1–P3 above restore the mandatory record lines this summary depends on.

### 4. Core rules

**A. The L1 boundary rule — the load-bearing constraint of this pass.** The route-input allowlist is seven entries, locked by L1-A, corrected by L1-B, guarded by the masquerade fixture. A RuntimeRotationPlan may enter the route-selection boundary ONLY as (or wrapped in) an existing allowlisted type — the expected vehicle is `contract_validated_task_frame`, since a rotation plan is precisely a contract-validated frame describing declared work. The diagnostic must state which allowlisted type carries the plan and why. **LE-1 may NOT add, widen, or reinterpret any allowlist entry.** If the seam cannot be built without a new route-input type, STOP: that is an L1-A lock amendment decision belonging to Pat via its own visible protocol-governed pass (the L1-B precedent), not a side effect of an integration pass. Any perceived need for an eighth entry is itself a reportable finding.

**B. Validation at the seam (all deterministic, all structural):**
- Contract validation against the RA-R2 schema: required fields, ordered role list, per-role adapter binding shape, structural stop conditions.
- **Authorship rule enforced at the seam, not just at plan creation:** `authored_by: human | fixture` accepted; `model` rejected with a structured refusal artifact. The seam re-checks even if an upstream validator already did — defense in depth at the boundary where it matters.
- Referential shape checks: post-H4 UUID-format IDs only; no raw prose fields consumed for any classification decision.
- Classification output is a closed enum (e.g., `valid_rotation_plan | invalid_schema | rejected_authorship | rejected_reference_format | unknown`), each value driven by a structural check — no content interpretation anywhere in the seam.

**C. The route-decision artifact:**
- Deterministic, engine-produced, ledgered: plan digest, classification result, the structural inputs that drove it, timestamps, post-H4 ID, lineage reference to the plan artifact. Digests and refs only — no plan prose in the ledger, per the standing redaction guarantee.
- The artifact records a decision ABOUT a plan; it does not trigger anything. Read-only means: after LE-1, the engine's observable behavior on every existing path is byte-identical; the seam only adds the ability to be asked "what do you make of this plan?" and to answer on the record.
- The artifact's own trust status: engine-produced deterministic evidence over a plan whose authorship is human/fixture — state its tier explicitly in the diagnostic (expected: this is deterministic measurement over non-model content, so no T1 subject cap applies; argue it, don't assume it).

**D. Absence rules (each backed by an assertion or detector):**
- No role rotation executed; no Planner/Analyst/Critic/Synthesizer invocation exists in any LE-1 code path.
- No provider adapter imported or called from the seam (the H5 egress pin and traps must remain green — cite them, don't duplicate them).
- No side effects; no mutation of TaskFrame processing, routing outcomes, WorkGraph construction, or dispatch for any existing input.
- No L1 allowlist change (lock test green, seven entries verbatim in the report).

**E. Detectors (R37 discipline, each proven to fire):**
- Model-authored plan presented at the seam → rejected with the structured refusal artifact.
- Structurally invalid plan (missing required field; malformed role list) → correct classification, ledgered.
- Plan containing counter-era (pre-H4) ID references → rejected.
- A synthetic attempt to use the route-decision artifact itself as a rotation trigger → nothing fires; assert the artifact has no consumer with execution authority (absence assertion over the codebase: nothing imports the artifact type into an execution path).
- Read-only proof: a representative existing routing test corpus runs byte-identical before and after the seam exists (snapshot the routing outputs; compare).

### 5. Files to create
- `src/logicEngine/rotationPlanSeam.ts` (or the diagnostic's argued equivalent) — validation, classification, decision-artifact construction.
- `tests/logicEngine/rotationPlanSeam.test.ts` — unit coverage of every classification enum value.
- `tests/acceptance/le1RotationPlanSeamAcceptance.test.ts` — detectors, read-only proof, L1 lock verbatim assertion, ledger record shape.
- `docs/LE1_ROTATION_PLAN_CONSUMPTION_SEAM.md` — implementation doc including the seam's decision inventory (every branch, its structural input) per the RA-R1 house standard.

### 6. Files to modify
- `docs/STATUS_LOG.md`, `PLANS.md` — LE-1 entries (diagnostic and implementation stages).
- Barrel exports as needed. Explicitly NOT: `routeInput.ts`, the L1-A/L1-B lock tests, M3 modules, providers, vitest config, H5 traps, package files, catalog manifests, historical Ledger.

### 7. Documentation requirements
The implementation doc states: which allowlisted type carries the plan and the argument for it; the classification enum with each value's structural driver; the decision artifact's schema and tier argument; the read-only proof method; and the P1–P3 precondition resolutions (or references to where the diagnostic recorded them).

### 8. Acceptance requirements
- All P1–P3 preconditions resolved on the record.
- All detectors fire; read-only proof passes; every classification enum value covered.
- L1 lock green with seven entries verbatim; H5 traps green; M3 boundary suite green.
- Catalog counts stated per P1's resolution (and asserted in tests accordingly).
- Full suite green, canonical command, counts verbatim. Typecheck and build clean. Tree clean.

### 9. Validation commands
Diagnostic stage: pre-change snapshot `le1_seam_diagnostic_prechange`, verified on disk; diagnostic doc committed; STOP for Pat's approval. Implementation stage (on approval): `le1_seam_implementation_prechange` snapshot, verified; then `npx tsc --noEmit`; focused seam tests; `npm run build`; full suite; catalog commands per P1. Commit per stage with pass ID; push; clean tree.

### 10. Report format
House style. Mandatory lines: P1/P2/P3 resolutions verbatim; the allowlisted carrier type; the classification enum; seam decision-inventory branch count (all structurally annotated: yes/no); L1 allowlist verbatim (seven entries); every detector's test name; suite counts. Verdict: `LE-1 Rotation Plan Consumption Seam: Accepted — the engine can read rotation plans on the record; it cannot run them; the steering boundary is unchanged.`

---

## Standing rules (restated)

The record outranks memory. Canonical validation only; a shell that cannot run `npx vitest run` is not a valid implementer environment. Credentials never ambient. Snapshots verified on disk before recording. No fabricated references — every citation, ID, and count real at the moment of writing. Honest deviations mandatory; they become gates. Absence assertions accompany every boundary. Commit per pass; push; clean tree. Locked surfaces (L1 seven-entry allowlist, H5 traps and pins, M3 boundary, catalog counts per P1's resolution) change only by visible protocol-governed diffs. Mandatory report lines are not optional — a report missing catalog counts or lock confirmations is returned, not accepted. After LE-1: STOP; the next pass is Pat's call, with LE-2 (consumption seam → guarded execution seam) the natural candidate once the rotation runtime question (P3) is resolved.