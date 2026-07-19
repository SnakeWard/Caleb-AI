# Caleb AI — Pass Protocol LIVE-F5

**Authorized by:** Pat, 2026-07-19  
**Origin:** LIVE-R2 E1 attempt four, executed by Pat from a host leaf shell under
LIVE-F1 through LIVE-F4, reached Anthropic and consumed the complete 512-token
Planner output budget. The normalized output observer classified the incomplete
payload as `json_parse`. Its safe response telemetry survived, but its T0 bytes
did not: the Ledger records an output digest and a null observed-store digest,
and the corresponding content-addressed T0 content and record files are absent.

## Purpose

Make bounded provider truncation a first-class, evidence-preserving observer
failure. A response that ended because of its output budget must never be
misreported as malformed JSON, and normalized bytes received by the observer
must survive validation failure as raw T0 evidence.

## Attempt-four evidence lock

- Execution: `execution_73c1f247-f3db-4f58-b283-c5b9158bfaa5`.
- Bridge/start/terminal Ledger IDs:
  `bridge_10ba5573-0eae-4cc7-8658-1922bf07950c`,
  `rotation_46bb3c7c-462b-4675-b27f-37a3d2e4945c`, and
  `rotation_4e25e9bc-3cc2-4f8d-b314-717a49d24c42`.
- Planner usage: 291 input / 512 output / 803 total tokens; USD 0.002851;
  5,897 ms; Critic not invoked.
- Safe failure record: `live_observer_artifact_invalid`, stage `json_parse`,
  `{code: invalid_json, path: $}`.
- Output digest:
  `sha256:2a699062d4920fcda79c85962634b856be2a3757fdc0d82b60ee36d79e5ef812`.
- `observed_store_digest` is null. Without reading or reproducing output prose,
  the matching `.txt` and `.json` objects were verified absent from
  `.caleb/artifacts/raw-output/live-role-rotation/`.

The historical attempt-four bytes are therefore unrecoverable. The permanent
regression fixture must reproduce the truncation condition without pretending
to be those bytes.

## Binding implementation envelope

1. **Truncation precedes parsing.** The normalized-output observer receives a
   safe metadata object containing the adapter-computed output digest, provider
   finish/stop reason, and output-token count. After bounded T0 storage and
   digest binding, it classifies `output_truncated` before attempting JSON parse
   when either the provider reason is `max_tokens` or output tokens equal the
   invocation's `max_tokens` budget. The overall runtime failure is distinct and
   fail-closed; no later role executes.
2. **Budget amendment.** E1 Planner and Critic `max_tokens` become 1,536 each.
   E1 `max_total_tokens` becomes 8,192 to cover both outputs plus input/context
   growth. `max_spend_usd` remains USD 0.05; timeouts, response-byte limits,
   invocation count, route, models, prompts, and all other evidence stay fixed.
   The live gate ceiling is amended to admit 1,536 per role while retaining the
   existing 8,192 run ceiling.
3. **Failure-path T0 persistence.** Once bounded normalized text reaches the
   observer, it is stored as T0 before truncation, JSON, payload, envelope, or
   identity validation. The store-computed digest must equal the adapter's
   reported digest. Failure telemetry and the terminal Ledger record retain the
   observed-store digest and a `raw-output:<digest>` artifact reference. Raw
   output text remains absent from results, diagnostics, and Ledger JSON.
4. **Permanent regression.** Add a synthetic, clearly labeled truncation
   fixture. Detectors prove both independent signals (`max_tokens` reason and
   token-count equality), truncation-before-parse ordering, retained T0 bytes,
   digest equality, fail-closed halt before Critic, safe serialization, and the
   historical attempt-four no-T0 finding.

## Compatibility and protected boundaries

- Observer absence remains behaviorally identical. Existing no-observer adapter
  tests run unchanged and green.
- Anthropic and xAI transport functions, fetch sites, endpoints, headers,
  credential closures, request bodies, retries, timeouts, and response-size
  behavior remain unchanged. Only normalized-success observer metadata/result
  plumbing may change in provider files.
- The strict semantic and RoleArtifact validators are not loosened.
- No prompt, model, route, registry, CLI, dependency, global test timeout, E2
  event, or historical Ledger rewrite is authorized.
- No live provider invocation is authorized by LIVE-F5.

## Required detectors

1. Invalid/truncated JSON with reason `max_tokens` returns stage
   `output_truncated`, never `json_parse`.
2. Invalid/truncated JSON with output tokens equal to the role budget returns
   `output_truncated` even with another non-truncation finish reason.
3. Invalid JSON below budget with a non-truncation reason still returns
   `json_parse`.
4. Truncation stores exact normalized bytes as T0, adapter/store digests match,
   telemetry and terminal Ledger name the store digest/reference, and neither
   raw text nor provider prose is serialized.
5. A synthetic digest mismatch fails closed with the existing distinct digest
   mismatch code rather than parsing or trusting the channel.
6. E1 fixture and live evidence accept 1,536 per role and 8,192 per run while
   refusing values above those ceilings; spend remains USD 0.05.
7. Planner truncation halts before Critic and retains real usage, spend, timing,
   response ID, finish reason classification, and output/store digest evidence.
8. Existing LIVE-F4 four-stage fixtures, no-observer behavior, redaction sweeps,
   and transport pins remain green.

## Validation and stop

Commit this protocol with the append-only attempt-four Ledger evidence, then
create and verify a pre-change snapshot. Run focused LIVE-F5/LIVE-F4/provider/
gate/seam/M3 detectors; canonical offline tests; governed typecheck; build;
catalog locks; AUD-2 self-smoke; prompt/redaction/egress/transport/protected-diff
checks. Commit and push a clean synchronized tree, report the offline verdict,
and STOP. A fifth E1 attempt requires fresh human authorization after LIVE-F5.
