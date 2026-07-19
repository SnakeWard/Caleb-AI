# LIVE-R2 Event E1 Report

## Verdict

`LIVE-R1 Live Rotation Gate Chain: Accepted — live bindings are bridgeable with evidence and refused without it; budgets bind; nothing is ambient.`

`LIVE-R2 First Live Rotation: STOP — E1 reached the governed Planner invocation, the provider invocation failed, the Critic was not called, and the Ledger proves the fail-closed boundary.`

This is not the protocol's completed-event verdict. A real Planner/Critic
exchange did not occur, so Caleb must not claim one. No retry or E2 call was made.

## Authorization and snapshot

- Pat's fresh words authorized only E1: one `planner_critic` cycle, both roles on
  `claude-haiku-4-5`, LIVE-R1 budgets.
- Pre-event tree: clean and synchronized with `origin/main` at `e1c64ac`.
- Snapshot: `snap_20260719T041007671Z_000414_milestone`.
- Snapshot path and `manifest.json`: verified on disk; snapshot Ledger entry:
  `ledger_snap_20260719T041007671Z_000414_milestone`.

## Ledger trace summary

| Stage | Ledger ID | Result |
| --- | --- | --- |
| Bridge | `bridge_99b4eefc-c6b4-4742-a1a8-8cd0a05e857c` | completed; live evidence verified |
| Execution start | `rotation_3dc74e51-7035-4904-bb21-3ab9a7f5c8dc` | running; sequence length 2 |
| Terminal | `rotation_0617e657-1fb3-40e1-b5f2-33285f461534` | failed at step 0 |

- RuntimeRotationPlan: `rrp_223e4567-e89b-42d3-a456-426614174100`.
- Derived plan: `plan_af0be112-cce8-52f5-a80c-ce4511590832`.
- Source plan digest: `sha256:7aa97fdd136504ae45f0180cb6d51193bec2815a67ed38028bce16a45975bff1`.
- Derived plan digest: `sha256:9af6800680b12334ef9403cd8d706fadc056224d7b255a657f80e93d29b75570`.
- Planner prompt digest: `sha256:9cdda40130bb28d647a5c503d216e9c1ba643ee4c9c233ca5ed9e5197a5cb4c9`.
- Output/store/artifact digests: none; no valid provider output crossed the observer boundary.
- Failure: `live_provider_invocation_failed`; completed steps 0; failed step 0; Critic not invoked.

## Usage, spend, timings, and budgets

| Role | Input | Output | Total | Spend | Recorded latency | Budget |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Planner | 0 | 0 | 0 | USD 0 | 0 ms | 512 output tokens / 30,000 ms / 1 MiB |
| Critic | not invoked | not invoked | not invoked | USD 0 | n/a | same |
| Run | 1 attempted | — | 0 tokens | USD 0 | ~987 ms start-to-terminal | 2 invocations / 4,096 tokens / USD 0.05 |

The runtime records zero latency for failures without a provider response; the
Ledger timestamps provide the approximate 987 ms wall interval. No budget was exceeded.

## Credential lifecycle

- Preflight found exactly one credential-shaped name, `API_KEY`; no value was
  printed or serialized. It was declared explicitly for Anthropic, so the CLI's
  "no OTHER credential" trap passed.
- The credential value was read only by the sanctioned declared-variable closure.
- The invocation shell removed it and verified `CREDENTIAL_UNSET_AFTER=True`.
- Deviation: `API_KEY` was already inherited before the event rather than set
  freshly in the invocation shell. New Codex subprocesses continue to inherit it
  from the desktop parent. Invocation cleanup is real but cannot mutate its
  parent. This does not satisfy the strictest H8 never-ambient doctrine.

## Ledger-only reconstruction

`reconstructRotationChainFromLedgerJsonl` returned `ok:true` from the Ledger
alone. It reconstructed the plan, source plan, bridge/start/terminal IDs, final
status `failed`, completed steps 0, failed step 0, and failure code. There are
correctly zero invocation records because no role completed. The failed chain is
reconstructable; the completed two-artifact crown assertion is not met.

## Assumptions reality broke

1. The available generic `API_KEY` was assumed usable as the declared Anthropic
   credential. The event record cannot confirm that assumption.
2. LIVE-R1 preserves `live_provider_invocation_failed` but drops the adapter's
   safe structured failure class. The Ledger cannot distinguish credential,
   provider rejection, network, or other adapter failure without another call.
3. No successful Planner response arrived, so no M3 artifact, context handoff,
   Critic response, or completed live reconstruction exists.
4. The declared-name ambient trap is weaker than the standing credential
   doctrine: it permits a declared variable that was already ambient.

## Post-event validation

- Offline canonical suite: 191/191 files, 3,135/3,135 tests, exit 0.
- Canonical `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.
- Build: exit 0.
- No source code or prompt changed.
- AUD-2 self-smoke: compliant/T2 across 5 changed paths, zero violations.

## Next authority boundary

STOP. E2 remains unauthorized. A retry also requires fresh authority after a
protocol decision on credential injection and safe provider-failure telemetry.
