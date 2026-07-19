# Caleb AI — Pass Protocol LIVE-F4

**Authorized by:** Pat, 2026-07-19
**Origin:** LIVE-R2 E1 execution attempt three reached Anthropic successfully but
halted at the Planner normalized-output observer with
`live_observer_artifact_invalid`. LIVE-F3 proved that the model had been assigned
authoritative RoleArtifact envelope construction and that observer rejection
discarded both field-level validation evidence and billable response telemetry.

## Purpose

Apply Caleb AI doctrine to artifact anatomy: models contribute bounded semantic
content; the runtime constructs authoritative identity, route lineage, and time.
Preserve the strict RoleArtifact validator while giving valid model content a
runtime-owned path through it.

## Binding implementation envelope

1. Replace the live observer's full-RoleArtifact expectation with a dedicated,
   strict semantic-payload contract. The payload contains model-owned content
   only: summary, claims, assumptions, constraints, open questions,
   recommendations, evidence references, confidence, handoff notes, and
   acceptance status. It is closed, recursively bounded, type checked, and
   forbidden-content checked before trust promotion or storage.
2. Construct the canonical RoleArtifact in runtime code. The runtime owns schema
   version, artifact ID, role and artifact type, task/run/trace/context identity,
   route-derived required-next-role, creation time, and provenance references.
   `validateRoleArtifact` remains strict and is not loosened.
3. Verify invocation identity after construction, including the exact
   route-derived `required_next_role`. A Planner in E1 must resolve to `critic`;
   the terminal Critic resolves to `null`.
4. Preserve LIVE-R1 observer guarantees: the provider adapter still hashes the
   exact normalized bytes observed by the runtime; those bytes alone enter the
   raw T0 store; no output prose reaches results, failures, or Ledger records;
   optional-observer absence remains compatible; transport and credential
   behavior remain frozen.

## Amendment A1 — two-artifact provenance

The normalized provider payload is stored as T0 evidence under its raw digest.
The runtime-built canonical RoleArtifact is stored under its own digest. The
canonical artifact's Ledger provenance carries `derived_from` containing the T0
raw digest. Reconstruction preserves that link, and the M3 lineage-resolution
surface must be able to resolve the digest through the content-addressed store.
Two stored artifacts without this explicit relationship do not satisfy LIVE-F4.

## Amendment B — payload strictness and route identity

- The semantic-payload validator applies the full artifact contract's 4,000
  character string bound and 50-entry array bound recursively.
- Required fields, closed object shapes, array element types, claim/evidence
  reference shapes, confidence range, acceptance enum, and forbidden keys are
  enforced independently of the full RoleArtifact validator.
- Invalid semantic content remains untrusted and is not stored as accepted
  content.
- The runtime derives `required_next_role`; invocation validation verifies it.

## Amendment C — observer-failure response telemetry

`LiveAdapterFailure` gains a visible additive optional response-telemetry block
for failures that occur after an HTTP response was successfully parsed. It may
contain only safe structured response metadata: provider response ID, normalized
output digest, finish reason, token usage, and timing. It contains no raw text,
wire body, prompt, headers, credentials, or provider prose.

Anthropic and xAI observer-failure result paths populate this block. The live
runtime uses it for real token counts, spend estimation, output digest, and
latency. Zero-valued empty telemetry remains reserved for failures where no wire
response metadata exists. An HTTP-success-then-observer-reject detector proves
that a billable call is never recorded as zero-cost fallback telemetry.

## Amendment D — staged diagnostics and permanent regression

Observer validation records one safe stage code:

- `json_parse`
- `payload_validation`
- `envelope_validation`
- `identity_mismatch`

Diagnostics contain validator `code` and `path` only. They never contain model
text or provider prose. A fixture proves each stage. A permanent attempt-three
regression fixture supplies the former model-manufactured full envelope to the
new payload boundary and proves fail-closed `payload_validation` with safe
`{code,path}` detail. The historical output bytes were not retained, so the
fixture reproduces the observer-visible contract shape rather than inventing
unrecoverable prose.

## Expected files

- Add the semantic payload type/validator and LIVE-F4 regression fixture.
- Modify the live runtime adapter, Role Runtime provenance plumbing, rotation
  seam serialization/reconstruction, M3 lineage gate, and additive live failure
  contract/validator.
- Modify only the normalized-success/result portions of the Anthropic and xAI
  adapters; fetch sites, endpoints, headers, credentials, retries, request wire
  bodies, and transport behavior remain unchanged.
- Align the Planner and Critic templates to semantic-payload output.
- Add focused provider, runtime, M3, seam, acceptance, and regression detectors.
- Add the LIVE-F4 report/audit manifest; update `PLANS.md`, `docs/STATUS_LOG.md`,
  and append-only snapshot Ledger records.

## Prohibited changes

- No live call, retry, new provider, model/budget change, route or registry
  change, CLI behavior change, credential/config change, dependency change,
  validator loosening, display work, E2 work, or historical Ledger rewrite.
- No raw output in result, error, diagnostic, or Ledger serialization.
- No test assertion weakening and no global timeout change.

## Required detectors

1. Strict valid and invalid semantic-payload matrices, including all bounds and
   nested claim/evidence shapes.
2. Runtime-owned envelope fields cannot be supplied or spoofed by model output.
3. Canonical RoleArtifact passes the unchanged strict validator and exact
   invocation identity/required-next-role gate.
4. Raw and canonical digests are distinct, Ledger `derived_from` names the raw
   digest, reconstruction preserves it, and the M3 gate resolves it.
5. HTTP-success observer failure preserves real usage, timing, provider response
   ID, digest, and spend while remaining fail-closed with no later role.
6. Wire-never-answered failures alone use empty telemetry.
7. All four stage codes fire with code/path-only diagnostics; attempt three's
   envelope-shaped payload is permanently rejected at `payload_validation`.
8. Serialization sweeps prove prompt/output/credential/provider prose absence.
9. Existing no-observer adapter tests remain green without behavior edits.
10. Transport-function and protected-surface diffs remain empty.

## Validation and stop

Commit this protocol together with the preserved third-attempt Ledger evidence,
then create and verify a pre-change snapshot. Run focused LIVE-F4/provider/M3/
Role Runtime/seam detectors; the canonical offline suite; canonical governed-pass
typecheck; build; catalogs; AUD-2 self-smoke; redaction, egress, and transport-diff
checks. Commit and push on a clean synchronized tree, report the offline verdict,
and STOP. LIVE-F4 does not authorize a provider invocation or an E1 retry.
