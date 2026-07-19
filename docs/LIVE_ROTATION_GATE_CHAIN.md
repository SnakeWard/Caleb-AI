# LIVE-R1 Live Rotation Gate Chain

## Boundary

LIVE-R1 re-admits `adapter_kind: "live"` to the LE-2 bridge only when a closed
`live_rotation_gate_evidence` block proves explicit opt-in, explicit live request,
network permission, a named approver, allowlisted provider/model bindings,
committed prompt digests, per-role budgets, and a total run budget. Missing or
invalid evidence retains `bridge_rejected_live_adapter_unavailable` unchanged.

The only authorized route is one `planner_critic` cycle: two invocations, no side
effects, no code mutation. Dynamic sequencing, RA-X, registry changes, UI, and
additional adapters or egress sites remain absent.

## Gate order

1. The bridge validates the ordinary RuntimeRotationPlan and the closed LIVE-R1
   evidence independently, then derives live adapter bindings only if both pass.
2. The confirm-gated CLI requires a committed fixture, matching approver, and an
   exact per-provider credential declaration. Before reading any value it refuses
   if another credential-shaped environment name is present.
3. Prompt templates are LF-normalized and checked against committed SHA-256
   digests. Provider requests use the existing Anthropic and xAI adapters only.
4. A transient observer receives exactly the normalized text used by the adapter
   digest. It validates a RoleArtifact, stores those bytes through M3, and requires
   the M3 content address to equal the adapter output digest.
5. The unchanged role executor validates the artifact/handoff and the LE-3 seam
   ledgers each invocation, its budgets, digests, lineage, and terminal state.
   Any observer, digest, timeout, token, invocation, response-size, or spend
   failure halts the rotation.

## Budgets and bindings

- Per role: 512 output tokens, 30,000 ms, 1 MiB normalized response.
- Per run: exactly two maximum invocations, at most 8,192 total tokens, and no
  more than USD 0.05. The committed E1/E2 fixtures tighten total tokens to 4,096.
- Anthropic is pinned to `anthropic_live_adapter` / `claude-haiku-4-5`.
- xAI is pinned to `grok_live_adapter` / `grok-3-mini`.
- The price schedule used for the pre-call estimate was verified on 2026-07-19:
  Haiku 4.5 USD 1/M input and USD 5/M output; the governed grok-3-mini schedule
  is USD 0.30/M input and USD 0.50/M output. Availability and actual billed usage
  must be rechecked at LIVE-R2 because xAI's current public catalog has moved on.

## Credential and content lifecycle

Credential values are read only through the single declared environment-read
closure, copied into provider-scoped closures, never serialized, and cleared from
the child process after the run. Tests and CI never enter this path.

The observer is optional. With no observer, the pre-LIVE-R1 digest-only result is
unchanged and the existing adapter tests run without edits. With an observer,
normalized text exists transiently in memory and in the M3 content-addressed
store; it never enters adapter results, failures, CLI output, or Ledger entries.
Headers, credentials, and raw wire bodies never enter the observer. Grok
`reasoning_content` remains excluded from normalized output and therefore never
reaches the observer.

The transport-function diffs are empty: the extracted fetch sites, endpoints,
headers, retry loop, request bodies, and credential closures are unchanged. The
only provider-adapter change is optional normalized-success result plumbing.
Egress remains exactly two call sites: Anthropic `/v1/messages` and xAI
`/v1/chat/completions`.

## Deferred

LIVE-R2 E1 and E2 are fixtures only. No live call is authorized until Pat gives
fresh explicit words after LIVE-R1 is accepted. M4 display, dynamic sequencing,
RA-X extraction, capability-bearing plans, new route inputs, and provider/model
substitution each require their own argued pass.
