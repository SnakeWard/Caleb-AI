# Role Artifact Contract Layer

## 1. Purpose

The Role Artifact Contract Layer defines the first structured artifact boundary above the accepted Logic Engine V0 Functional Core.

R1 creates types, validators, documentation, and tests only. It does not execute roles, call models, perform Role Rotation, invoke Hollows, or connect to Logic Engine runtime execution.

## 2. Relationship To Accepted Logic Engine V0

Logic Engine V0 is accepted as the deterministic orchestration foundation:

```text
route -> validate -> execute -> gate -> snapshot -> verify -> ledger -> context -> telemetry -> trace -> CLI surface -> acceptance lock
```

The Role Artifact Contract Layer sits above that locked foundation. It defines what future roles may produce and how those artifacts can refer back to `task_id`, `run_id`, `trace_id`, and `context_id`.

This layer does not reopen Logic Engine V0.

## 3. Non-Goals

- no role execution
- no model calls
- no role rotation loops
- no multi-model orchestration
- no Hollow execution
- no Logic Engine V0 reopening
- no Hollow chains
- no full DAG execution
- no Thinking Mode UI
- no replay runtime
- no new CLI flags
- no authenticated approval
- no enterprise readiness claims
- no production readiness claims

## 4. Role Definition

A Role is a named future orchestration participant with a bounded artifact contract.

R1 defines only role identifiers and validation boundaries. It does not create role runners, model prompts, role scheduling, or handoff execution.

Allowed R1 role IDs:

- `planner`
- `implementer`
- `verifier`
- `critic`
- `synthesizer`
- `reporter`
- `recovery`
- `human_operator`

## 5. RoleArtifact Definition

A RoleArtifact is a structured, sanitized record of what a role is allowed to hand back to Caleb AI.

It may include summary, claims, assumptions, constraints, open questions, recommendations, evidence references, confidence, handoff notes, required next role, acceptance status, and warnings.

It must not contain hidden chain-of-thought, private reasoning transcripts, raw model scratchpad, unbounded thought logs, secrets, credentials, raw file contents, raw Hollow input, `input_payload`, or embedded telemetry event arrays.

## 6. RoleContract Definition

A RoleContract declares which artifact types and acceptance statuses a role is allowed to emit.

R1 RoleContract validation is static. It does not execute a role, call a model, invoke a Hollow, or mutate state.

## 7. RoleHandoffEnvelope Definition

A RoleHandoffEnvelope describes a future handoff from one role to another by referencing validated artifacts.

R1 validates the envelope shape only. It does not execute the handoff, call Logic Engine runtime, call models, or perform Role Rotation.

## 8. Allowed Content

Allowed RoleArtifact content may include:

- `summary`
- `claims`
- `assumptions`
- `constraints`
- `open_questions`
- `recommendations`
- `evidence_refs`
- `confidence`
- `handoff_notes`
- `required_next_role`
- `acceptance_status`
- `warnings`

## 9. Forbidden Content

Forbidden content includes:

- hidden chain-of-thought
- private reasoning transcripts
- raw model scratchpad
- unbounded thought logs
- secrets
- credentials
- raw file contents
- raw Hollow input
- `input_payload`
- embedded telemetry event arrays
- embedded `telemetry_trace.events`

The validator rejects forbidden snake_case and camelCase keys recursively.

## 10. Schema Versioning

R1 uses:

```text
schema_version: "0.1.0"
```

for:

- RoleArtifact
- RoleContract
- RoleHandoffEnvelope

This schema is separate from Logic Engine execution context `0.5.0`, telemetry event `0.6.0`, and telemetry trace `0.7.0`.

## 11. Validation Rules

R1 validators:

- reject null, arrays, and non-object roots
- require `schema_version === "0.1.0"`
- require all required fields
- require required strings to be non-empty
- require allowed `role_id` values
- require allowed artifact types
- require allowed acceptance and handoff statuses
- require numeric confidence from 0 through 1
- require list fields to be arrays
- bound arrays and strings
- recursively reject forbidden keys
- reject embedded telemetry event arrays
- reject `hollow_input` and `input_payload`
- require `required_next_role` to be null or an allowed RoleId
- validate `created_at` as a non-empty ISO-like string

## 12. Context And Trace Linkage

RoleArtifact carries:

- `task_id`
- `run_id`
- `trace_id`
- `context_id`

RoleArtifact may reference telemetry by ID only:

```ts
telemetry_trace_ref: {
  trace_id: string;
  context_id: string;
}
```

RoleArtifact may reference execution context by ID only:

```ts
execution_context_ref: {
  context_id: string;
}
```

## 13. Why Artifacts Reference Traces By ID Only

Telemetry traces are observable event records. Role artifacts are role output contracts. Embedding telemetry events inside artifacts would duplicate trace state, increase artifact size, and blur the boundary between role output and execution observability.

R1 therefore references traces by `trace_id` and `context_id` only.

## 14. Why Artifacts Do Not Contain Hidden Chain-Of-Thought

Role artifacts store conclusions and audit-friendly structure, not private reasoning.

Allowed fields capture what a future role asserts, what evidence it references, what assumptions it carries, what constraints matter, and what next step it recommends. Hidden chain-of-thought, scratchpads, private reasoning transcripts, and unbounded thought logs are explicitly forbidden.

## 15. R1 Limitations

- Types and validators only
- No role runners
- No model calls
- No Role Rotation
- No runtime handoff execution
- No Logic Engine V0 runtime integration
- No CLI surface
- No Ledger writes
- No trace export
- No replay runtime

## 16. Future Phases

Future authorized phases may add:

- RoleContract registry
- RoleHandoffGate validation integration
- artifact store boundaries
- role artifact Ledger references
- model-produced artifacts after Model API Layer authorization
- Role Rotation only after contracts and gates are proven

Those future phases must begin from a fresh snapshot and must not treat this R1 contract as permission to execute roles or call models.

## 17. R2 Role Contract Registry

R2 adds a static Role Contract Registry at `src/roles/roleContractRegistry.ts`.

The registry is a contract lookup surface only. It records the known role contracts, display names, descriptions, required artifact fields, forbidden artifact fields, allowed future next-role references, and whether a role may hand off to a human in a future authorized phase.

Known registered role IDs:

- `planner`
- `implementer`
- `verifier`
- `critic`
- `synthesizer`
- `reporter`
- `recovery`
- `human_operator`

The registry exports:

- `listRoleContracts()`
- `getRoleContract(role_id)`
- `hasRoleContract(role_id)`
- `validateRoleContractRegistry()`

Registry functions return copy-safe data so callers cannot mutate the internal static registry.

## 18. R2 Fixture Artifacts

R2 adds locked valid fixture artifacts under `examples/roles`.

The fixtures prove that each known role can emit one validator-compatible `RoleArtifact` shape without running a role, calling a model, invoking a Hollow, writing storage, or changing Logic Engine V0 behavior.

Fixture files:

- `planner.valid-artifact.json`
- `implementer.valid-artifact.json`
- `verifier.valid-artifact.json`
- `critic.valid-artifact.json`
- `synthesizer.valid-artifact.json`
- `reporter.valid-artifact.json`
- `recovery.valid-artifact.json`
- `human_operator.valid-artifact.json`

## 19. R2 ID-Only Context And Trace Linkage

R2 fixtures reference telemetry and execution context by ID only:

```json
"telemetry_trace_ref": {
  "trace_id": "trace_role_fixture_001",
  "context_id": "context_role_fixture_001"
}
```

```json
"execution_context_ref": {
  "context_id": "context_role_fixture_001"
}
```

Fixtures must not embed `telemetry_trace`, `telemetry_trace.events`, `execution_context`, raw Hollow input, or `input_payload`.

## 20. R2 Guarantees

R2 provides:

- no role execution
- no model calls
- no runtime handoff execution
- no artifact storage
- no Ledger integration
- no CLI surface
- no Logic Engine V0 integration
- no Hollow execution
- no full DAG execution
- no Thinking Mode UI

The Role Contract Registry and fixtures are static contract assets only.

## 21. R3 Role Handoff Gate

R3 adds a pure static handoff gate validator at `src/roles/roleHandoffGate.ts`.

The gate answers whether a supplied `RoleHandoffEnvelope` is allowed according to:

- R1 `RoleHandoffEnvelope` validation
- R1 `RoleArtifact` validation
- R2 Role Contract Registry allowed next-role metadata
- artifact-to-handoff identity consistency
- artifact reference consistency
- acceptance status rules
- handoff status rules
- forbidden content rules

The exported function is:

```ts
validateRoleHandoffGate({
  handoff,
  source_artifact,
  registry
})
```

The optional `registry` override is for tests. Default behavior uses the static R2 registry.

## 22. R3 Gate Result

R3 returns a contract-validation result only:

```ts
{
  allowed: boolean;
  status: "allowed" | "blocked" | "invalid";
  errors: readonly RoleHandoffGateError[];
}
```

`invalid` means the envelope, artifact, registry, role identity, or artifact reference cannot be structurally trusted enough to evaluate as a valid handoff candidate.

`blocked` means the envelope and artifact are structurally understandable, but policy-like contract rules block the handoff.

`allowed` means the static contract gate passed. It does not execute the handoff.

## 23. R3 Status Rules

Artifact acceptance status rules:

- `accepted` allows handoff when every other gate passes
- `needs_revision` allows handoff only to `recovery` or `human_operator` when the registry also allows that transition
- `blocked` blocks handoff
- `rejected` blocks handoff

Handoff status rules:

- `ready` can be allowed
- `pending` is structurally valid but blocked
- `blocked` is blocked
- `rejected` is blocked
- `completed` is blocked because R3 has no runtime handoff execution

## 24. R3 Guarantees

R3 provides:

- no role execution
- no model calls
- no role rotation
- no runtime handoff execution
- no artifact storage
- no Ledger integration
- no CLI surface
- no Logic Engine V0 integration
- no Hollow execution
- no full DAG execution
- no Thinking Mode UI

The handoff gate validates contracts only. It does not store, replay, dispatch, schedule, execute, or mutate anything.

## 25. R4 Artifact Reference Bundle

R4 adds a reference-only bundle contract for grouping validated role artifact references and compact handoff gate decision summaries for one task/run/context.

The bundle type is `RoleArtifactReferenceBundle`.

It is a manifest, not a store. It records artifact IDs and handoff gate summaries only.

The bundle carries:

- `schema_version`
- `bundle_id`
- `task_id`
- `run_id`
- `trace_id`
- `context_id`
- `artifact_refs`
- `handoff_gate_refs`
- `bundle_status`
- `created_at`
- optional `warnings`

`artifact_refs` contain only:

- `artifact_id`
- `role_id`
- `artifact_type`
- `acceptance_status`

`handoff_gate_refs` contain only:

- `source_role`
- `target_role`
- `source_artifact_id`
- `allowed`
- `status`
- `error_codes`

## 26. R4 Bundle Validation

R4 adds `validateRoleArtifactReferenceBundle(input)`.

The validator checks the supplied bundle object only. It does not load artifacts, read storage, write storage, call Ledger, call Logic Engine runtime, execute handoffs, invoke Hollows, or call models.

The validator enforces:

- schema version `0.1.0`
- required identity fields
- non-empty `artifact_refs`
- array-shaped `handoff_gate_refs`
- unique `artifact_id` values
- known registered role IDs
- known artifact types
- known acceptance statuses
- `handoff_gate_refs[].source_artifact_id` exists in `artifact_refs`
- `allowed: true` matches `status: "allowed"`
- `status: "allowed"` matches `allowed: true`
- blocked or invalid handoff refs include at least one error code
- no duplicate handoff gate ref for the same source role, target role, and source artifact ID
- supplied `bundle_status` is one of `complete`, `incomplete`, `blocked`, or `invalid`
- forbidden keys are absent recursively

## 27. R4 Reference-Only Boundary

R4 bundles must not embed:

- full `RoleArtifact` objects
- full `RoleHandoffEnvelope` objects
- full `RoleHandoffGateResult` objects
- `telemetry_trace`
- `telemetryTrace`
- `execution_context`
- `executionContext`
- `hollow_input`
- `input_payload`
- hidden chain-of-thought
- scratchpads
- private reasoning

R4 provides:

- no role execution
- no model calls
- no role rotation
- no runtime handoff execution
- no artifact storage
- no Ledger integration
- no CLI surface
- no Logic Engine V0 integration
- no Hollow execution
- no full DAG execution
- no Thinking Mode UI
- no replay runtime
- no report runtime generation

## 28. R5 Bundle Consistency Report Contract

R5 adds a static, reference-only consistency report contract for describing the state of a `RoleArtifactReferenceBundle`.

The report type is `RoleArtifactBundleConsistencyReport`.

It is a contract object only. It is not produced automatically at runtime, not written to storage, not written to Ledger, and not integrated with `src/reports`.

The report carries:

- `schema_version`
- `report_id`
- `bundle_id`
- `task_id`
- `run_id`
- `trace_id`
- `context_id`
- `report_status`
- `bundle_status`
- `validation_status`
- `artifact_ref_summary`
- `handoff_gate_summary`
- `consistency_checks`
- `findings`
- optional `warnings`
- `created_at`

Report status values:

- `clean`
- `warning`
- `blocked`
- `invalid`

Validation status values:

- `valid`
- `invalid`
- `not_evaluated`

Consistency check status values:

- `pass`
- `warn`
- `fail`
- `not_applicable`

Finding severity values:

- `info`
- `warning`
- `error`
- `critical`

## 29. R5 Report Validation

R5 adds `validateRoleArtifactBundleConsistencyReport(input)`.

The validator checks only the supplied report object. It does not accept the original bundle as input, derive statuses, derive counts, cross-check counts against a bundle, load bundle fixtures, call report runtime, import `src/reports`, or write anything.

The validator enforces:

- schema version `0.1.0`
- required report and identity fields
- known report status
- known validation status
- known bundle status
- artifact reference summary object shape
- non-negative artifact summary counts
- known role IDs in artifact summaries
- known artifact types in artifact summaries
- known acceptance statuses in artifact summaries
- handoff gate summary object shape
- non-negative handoff summary counts
- known handoff gate statuses
- array-shaped consistency checks
- `check_id`, `status`, and `summary` on each consistency check
- known consistency check statuses
- known related roles when provided
- array-shaped findings
- `finding_id`, `severity`, `code`, and `summary` on each finding
- known finding severities
- known related roles when provided
- optional warnings as strings
- forbidden keys are absent recursively

## 30. R5 Static Report Boundary

R5 reports must not embed:

- full `RoleArtifactReferenceBundle` objects
- full `RoleArtifact` objects
- full `RoleHandoffEnvelope` objects
- full `RoleHandoffGateResult` objects
- `telemetry_trace`
- `telemetryTrace`
- `execution_context`
- `executionContext`
- `hollow_input`
- `input_payload`
- hidden chain-of-thought
- scratchpads
- private reasoning

R5 provides:

- no report generation runtime
- no reportBuilder integration
- no `src/reports` integration
- no role execution
- no model calls
- no role rotation
- no runtime handoff execution
- no artifact storage
- no bundle storage
- no Ledger integration
- no CLI surface
- no Logic Engine V0 integration
- no Hollow execution
- no full DAG execution
- no Thinking Mode UI
- no replay runtime

## 31. R6 Bundle Report Fixture Matrix

R6 adds a static fixture matrix for `RoleArtifactBundleConsistencyReport` states.

The matrix lives under `examples/roles/reports/matrix` and demonstrates that the R5 report contract can represent:

- `clean`
- `warning`
- `blocked`
- `invalid`

The `invalid-state` fixture is still valid JSON and a valid R5 report object. It represents an invalid bundle/report state; it is not an invalid fixture.

R6 fixtures are summary-only. They do not embed:

- full bundles
- full artifacts
- full handoff envelopes
- full handoff gate results
- telemetry traces
- execution contexts
- raw Hollow input
- private reasoning

R6 provides:

- no production TypeScript logic changes
- no new exported types
- no validator changes
- no report runtime generation
- no reportBuilder integration
- no `src/reports` integration
- no Ledger writes
- no CLI surface
- no storage
- no role execution
- no model calls
- no runtime handoff execution
