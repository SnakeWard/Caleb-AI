# LIVE-F4 Runtime Artifact Authority Report

- Status: Accepted offline
- Date: 2026-07-19
- Protocol commit: `4158061`
- Pre-change snapshot: `snap_20260719T140753751Z_000424_milestone`
- Validation snapshot: `snap_20260719T142922696Z_000426_milestone`
- Rollback anchor: Git commit `4158061`

## Result

LIVE-F4 moves authoritative RoleArtifact envelope construction out of model
output and into Caleb's live Role Runtime boundary. The provider now contributes
only a closed semantic payload. Caleb supplies schema version, UUID artifact ID,
role and artifact type, task/run/trace/context identity, route-derived next role,
creation time, and trace/context references.

The existing `validateRoleArtifact` implementation is unchanged. A constructed
artifact must pass that strict validator and a second invocation-identity check,
including exact `required_next_role`, before normalized provider bytes enter M3.

## Strict semantic boundary

The new semantic contract allows exactly:

- `summary`
- `claims`
- `assumptions`
- `constraints`
- `open_questions`
- `recommendations`
- `evidence_refs`
- `confidence`
- `handoff_notes`
- `acceptance_status`

The validator is closed at the root and at nested claim/evidence objects. It
checks required fields, nested types, reference enums, acceptance enum,
confidence range, recursive forbidden keys, 4,000-character string bounds, and
50-entry array bounds. Envelope and identity fields supplied by a model are
rejected as unexpected rather than trusted or overwritten silently.

The Planner and Critic templates now ask for semantic content only and say
explicitly that Caleb constructs the authoritative envelope. Their committed
template digests are:

- Planner: `sha256:8407f826668198c871da24fa9db9323c588aa6805d392d317fef6be090884697`
- Critic: `sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`

## Two-artifact provenance

On a successful invocation:

1. Exact normalized semantic bytes are validated and stored as T0 evidence.
2. The provider adapter's output digest must equal the M3 store digest.
3. Caleb constructs and strictly validates the canonical RoleArtifact.
4. The Role Runtime stores the canonical artifact under its own digest.
5. The invocation Ledger result and provenance record `derived_from` containing
   the T0 raw digest.
6. The JSONL reconstruction surface retains `derived_from`.
7. The M3 digest-lineage gate resolves the link through the content-addressed
   store and rejects malformed, duplicate, missing, or non-T0 sources.

The raw and canonical digests therefore identify different bytes with an
explicit model-said → Caleb-enveloped relationship.

## Observer-failure telemetry

`LiveAdapterFailure` now has an additive optional `response_telemetry` block for
post-response failures. It is a closed safe structure containing only provider
response ID, normalized output digest, finish reason, token counts, and timing.
Anthropic and xAI populate it when a normalized-output observer rejects or
throws. No raw output, reasoning content, prompt, wire body, headers,
credentials, or provider prose is admitted.

The seam converts that metadata into real invocation token totals, spend,
latency, response ID, and digest. `emptyTelemetry` remains the wire-never-answered
fallback; its detector locks zero tokens/spend and null response identity only
for a thrown provider invoker without response metadata.

## Safe staged diagnostics

Observer artifact failures retain exactly one stage plus validator code/path
pairs:

- `json_parse`
- `payload_validation`
- `envelope_validation`
- `identity_mismatch`

No validator messages or model text are serialized. The permanent regression
fixture `live-f4-attempt-three-envelope-shaped-payload.json` represents the
full-envelope output contract used by E1 attempt three. Because the historical
provider bytes were discarded, the fixture does not invent their prose. It
proves the former model-manufactured envelope is now structurally impossible to
accept and fails at `payload_validation` with safe `unexpected_field` paths.

## Scope proof

- No live provider invocation or E1 retry occurred.
- No dependency, package, TypeScript, Vitest, CLI, credential, model, budget,
  endpoint, header, fetch-site, retry, route, registry, or catalog change.
- `src/roles/roleArtifactValidator.ts` is unchanged.
- Provider changes are confined to additive failure construction and normalized
  success/result plumbing; request transport functions are unchanged.
- Existing no-observer paths retain the same success response shape and
  digest-only behavior.

## Validation record

- Pre-change canonical baseline: 195 files / 3,157 tests, exit 0.
- Focused LIVE-F4 matrix: 8 files / 88 tests, exit 0.
- Widened LIVE-F4/LIVE-R1/F1/F2/LE-3 regression matrix: 14 files / 134 tests,
  exit 0.
- Canonical offline suite: 197 files / 3,173 tests, exit 0, 110.72 seconds.
- Canonical governed `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `npm run build`: exit 0.
- Catalogs: V1 13; Hollowcut 9.
- AUD-2 self-smoke: compliant/T2 with zero violations or forbidden hits.
- Anthropic and xAI `invokeLive` transport-function hashes are byte-identical to
  protocol base `4158061`; egress remains exactly two fetch sites.
- Protected diffs are empty for CLI, package/config, the strict RoleArtifact
  validator, role/handoff registries, live gate evidence, and plan bridge.
- Validation snapshot `snap_20260719T142922696Z_000426_milestone` is Ledgered and
  verified on disk. Canonical snapshot-CLI tests also created their normal
  isolated test milestone records `000423` and `000425`.

## Verdict

`LIVE-F4 Runtime Artifact Authority: Accepted — models supply bounded semantic
content; Caleb owns identity, route, time, and reconstructable provenance; a
billable observer failure can no longer masquerade as zero telemetry.`

LIVE-F4 does not authorize a live call. Any E1 retry still requires Pat's fresh
host-shell authorization under the credential-tree doctrine.
