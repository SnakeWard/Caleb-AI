# LIVE-F1 Failure Taxonomy and Credential-Tree Repair Report

## Outcome

LIVE-F1 preserves safe provider failure classification through the live Role
Runtime adapter into the LE-3 terminal Ledger record. The orchestration-level
halt remains `live_provider_invocation_failed`; each terminal live invocation now
also records:

- `provider_failure_kind`
- `provider_failure_status`
- `provider_failure_retryable`

These fields are populated only from a structured failed adapter result. A thrown
provider invoker leaves all three null, preventing fabricated attribution.
Provider error prose, raw bodies, error references, credentials, and headers are
not copied.

## Credential-tree amendment

`docs/01_CODEX_OPERATING_CONTRACT.md` now makes the process tree explicit:

1. Parent implementer and sibling processes must contain no provider credential.
2. An independent sibling from the same parent verifies name/presence absence
   before any live network attempt and never reads a value.
3. Any sibling-visible credential is a STOP. Declaring its name is not a cure.
4. Only after that proof may a one-command leaf shell receive the credential.
5. The leaf uses the sanctioned closure, removes its copy, and verifies absence.
6. Live reports must carry both the pre-injection sibling proof and post-use leaf
   proof.

This resolves the E1 ambiguity: leaf cleanup cannot clean or prove its parent.

## Detectors

- `preserves provider_auth_failed in fail-closed terminal Ledger telemetry`
- `preserves network_failure in fail-closed terminal Ledger telemetry`
- `preserves provider_rate_limited in fail-closed terminal Ledger telemetry`
- `does not fabricate adapter taxonomy when the provider invoker throws`
- `locks the leaf-shell credential tree and sibling-process pre-run STOP rule`
- `pins taxonomy-only seam plumbing and redaction`
- `keeps the two transport sites and single sanctioned CLI env read unchanged`

All synthetic failures stop after one Planner attempt, produce no Critic call,
retain exact kind/status/retryability, and exclude injected provider prose from
serialized terminal Ledger records.

## Scope proof

- Provider adapter diff: empty.
- CLI diff: empty.
- Prompt and fixture diff: empty.
- Transport, endpoint, header, retry, credential closure, model, budget, route,
  registry, and configuration changes: none.
- Live provider calls: none.

## Validation

- Protocol commit: `fb367b7`.
- Snapshot: `snap_20260719T042829716Z_000416_milestone`, Ledgered and verified
  on disk.
- Focused LIVE-F1: 2/2 files, 7/7 tests, green.
- Wider LIVE-F1/LIVE-R1/LE-3 matrix: 5 files, 23 tests; final assertions green.
- Canonical offline suite: 193/193 files, 3,142/3,142 tests, exit 0.
- Canonical `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.
- Build: exit 0.
- AUD-2 self-smoke: compliant/T2 across 10 changed paths, zero violations.

`LIVE-F1 Failure Taxonomy and Credential-Tree Repair: Accepted — provider failure class survives the seam; credentials belong only to a sibling-verified leaf.`

No retry or live event is authorized by this verdict.
