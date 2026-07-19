# LIVE-R1 Live Rotation Gate Chain Acceptance Report

## Scope and outcome

LIVE-R1 implements the evidence-gated bridge, confirm-gated CLI path, bounded
runtime observer/store seam, fail-closed budgets, ledger reconstruction fields,
two committed prompt templates, and offline E1/E2 fixtures. No live provider call
was made. LIVE-R2 still waits on Pat's fresh explicit words.

Amendment A is implemented under A1–A5. Existing Anthropic/Grok adapter suites
were not edited and remain green. The observer is optional; the observed bytes
and adapter digest are independently bound through the M3 content address;
observer failures halt; output prose is absent from results/errors/Ledger; Grok
reasoning content is excluded; and transport request behavior remains frozen.

## Detectors

- `Envelope 8: evidence-gated live bindings re-admit visibly; evidence-free live and inherited failures reject`
- `accepts only the complete closed evidence envelope and rejects every gate class`
- `stores the exact observed bytes and requires the store digest to match the adapter digest`
- `turns observer refusal and slow providers into distinct fail-closed invocation failures`
- `Anthropic passes normalized text transiently, redacts it from results, and fails distinctly on observer refusal`
- `Grok passes only content; reasoning_content and normalized prose stay out of the result`
- LIVE-R1 acceptance lock: observer/redaction, two-site transport pin, and complete gate/offline-default detectors.

The transport-function diffs are empty, defined and checked as the request body,
fetch endpoint, headers, retry loop, and credential closure. Exactly two egress
sites remain. The provider-file diff is limited to the optional normalized-output
observer on the success result path.

## Locked boundaries

The L1 route-input allowlist remains exactly:

1. `contract_validated_task_frame`
2. `verified_signal_frame`
3. `engine_internal_state`
4. `deterministic_hollow_signal`
5. `accepted_gate_policy_result`
6. `human_pat_approval_record`
7. `snapshot_change_guard_state`

Catalogs remain V1 13 / Hollowcut 9. The only historical acceptance-lock change
is the visible LE-2 Envelope 8 amendment; the evidence-free rejection remains.
The LE-3 graph remains provider-free because live runtime state is consumed by a
structural duck-typed seam boundary rather than a provider import.

## Validation record

- Pre-change snapshot: `snap_20260719T023049028Z_000408_milestone`, Ledgered and
  verified on disk.
- Focused LIVE-R1 matrix: 4 files / 16 tests green.
- Canonical suite: 191/191 files and 3,135/3,135 tests, exit 0.
- Canonical typecheck: exit 0. Build: exit 0.
- AUD-2 self-smoke: compliant/T2 across 28 changed paths, zero violations.
- Existing Anthropic/Grok adapter test-file diff: empty. Extracted request-body,
  fetch, endpoint, header, retry, and credential-closure diff: empty.

`LIVE-R1 Live Rotation Gate Chain: Accepted — live bindings are bridgeable with evidence and refused without it; budgets bind; nothing is ambient.`
