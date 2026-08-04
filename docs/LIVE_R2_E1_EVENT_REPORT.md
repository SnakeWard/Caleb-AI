> **Supersession notice (REC-1, 2026-08-04).** This document is an accurate historical record of the early LIVE-R2 E1 era (attempts **one through five**, with surrounding stop/failure narrative). It is **superseded for completion purposes** by `docs/LIVE_R2_E1_A8_ACCEPTANCE_REPORT.md` (first complete E1 rotation, evidence commit `e30e420`). Authoritative register outcomes for all E1 attempts (including A6–A8) live in `docs/LIVE_EVENT_AUTHORIZATIONS.md`. **Do not treat this file as the final E1 crown report.** The body below is intentionally unchanged from the pre-REC-1 commit.

---
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

## 2026-07-19 authorized E1 retry after LIVE-F1

Pat freshly authorized one E1 retry after LIVE-F1. No prompt, model, route,
transport, retry policy, or budget changed.

### Credential proofs

- Independent pre-injection Codex sibling: zero credential-shaped variables;
  `API_KEY` absent; `ANTHROPIC_API_KEY` absent.
- The separate leaf shell's own pre-injection gate passed before it prompted for
  the credential; the value was never printed or sent through chat.
- Leaf cleanup: `LEAF_CREDENTIAL_UNSET_AFTER=True`.
- Independent post-event Codex sibling: zero credential-shaped variables.

The LIVE-F1 credential-tree correction is therefore satisfied for this retry.

### Snapshot and trace

- Fresh snapshot: `snap_20260719T053346308Z_000418_milestone`, Ledgered and
  verified on disk.
- Bridge: `bridge_ca29eb4b-0b00-475c-a971-04dcf9e0c2f3`, completed.
- Execution start: `rotation_dc28062d-8416-434b-83db-ff10be284ebc`.
- Terminal: `rotation_f1c2afe1-439d-4beb-b6ff-c4952e655c65`, failed at Planner
  step 0 after approximately 59 ms wall time.
- Source/derived plan and prompt digests are byte-identical to the first attempt.
- Output/store/artifact digests: none. Critic was not invoked.

### Preserved failure taxonomy

- Orchestration failure: `live_provider_invocation_failed`.
- Provider failure kind: `network_failure`.
- Provider failure status: `failed`.
- Provider retryability: `true`.
- Tokens: 0 input / 0 output / 0 total. Spend: USD 0.

LIVE-F1 resolved the earlier diagnostic ambiguity: the adapter did not classify
this as missing credentials, authentication failure, rate limiting, timeout, or
provider rejection. No second retry or diagnostic network call was made.

### Reconstruction finding

The raw Ledger unambiguously contains the retry bridge, start, and terminal chain
listed above. However, `reconstructRotationChainFromLedgerJsonl` accepts only a
deterministic `plan_id`. Both E1 attempts share that ID, so the helper paired the
first attempt's bridge/start (`bridge_99b4eefc...` / `rotation_3dc74e51...`) with
the retry terminal (`rotation_f1c2afe1...`) and returned `ok:true` for a mixed
chain. This is a false-positive reconstruction result. The retry is manually
reconstructable from parent references, but the crown assertion through the
current helper is not satisfied. Fixing attempt correlation requires a separately
authorized repair; this event does not alter code.

### Post-retry validation and verdict

- Offline canonical suite: 193/193 files, 3,142/3,142 tests, exit 0.
- Canonical typecheck: exit 0. Build: exit 0.
- No source, tests, prompts, fixtures, provider code, or configuration changed.
- AUD-2 self-smoke: compliant/T2 across 5 changed paths, zero violations.

`LIVE-R2 First Live Rotation retry: STOP — credentials were correctly isolated and failure taxonomy was preserved, but the Planner ended in network_failure; no Critic answered, and repeated-plan reconstruction is not attempt-safe.`

E2 and any further E1 attempt remain unauthorized.

## 2026-07-19 E1 attempt four after LIVE-F1 through LIVE-F4

Pat freshly authorized and executed attempt four from a host shell under the
standing live-event doctrine. The repository Ledger contains one new,
execution-keyed bridge/start/terminal chain:

- Execution: `execution_73c1f247-f3db-4f58-b283-c5b9158bfaa5`.
- Bridge: `bridge_10ba5573-0eae-4cc7-8658-1922bf07950c`.
- Start: `rotation_46bb3c7c-462b-4675-b27f-37a3d2e4945c`.
- Terminal: `rotation_4e25e9bc-3cc2-4f8d-b314-717a49d24c42`.
- Planner: 291 input / 512 output / 803 total tokens; USD 0.002851;
  5,897 ms; response identity retained.
- Critic: not invoked.
- Failure: `live_observer_artifact_invalid`, observer stage `json_parse`, safe
  issue `{code: invalid_json, path: $}`.

The Planner used exactly its 512-token output budget. That is sufficient evidence
of truncation under the subsequently authorized LIVE-F5 rule even though the old
terminal shape did not retain the provider stop reason. Attempt four therefore
exposed a classification error: a budget-truncated document was reported as
malformed JSON.

The Ledger retained output digest
`sha256:2a699062d4920fcda79c85962634b856be2a3757fdc0d82b60ee36d79e5ef812`
but recorded `observed_store_digest: null`. A metadata-only filesystem check
confirmed that neither the matching content file nor its T0 record exists in the
live role-rotation content-addressed store. The output bytes were not read,
printed, or recovered; they are unavailable for backfill. LIVE-F5 was authorized
to correct future classification and failure-path evidence persistence offline.

`LIVE-R2 E1 attempt four: STOP — Planner reached Anthropic and exhausted its
512-token output budget; the observer misclassified truncation as invalid JSON,
discarded the T0 witness, and correctly halted before Critic.`

## 2026-07-19 E1 attempt five after LIVE-F1 through LIVE-F5

Pat freshly authorized and executed attempt five from a host shell. The Ledger
contains one execution-keyed bridge/start/terminal chain:

- Execution: `execution_0caeae10-2427-46e2-b2b0-6a8d4e1d00d8`.
- Bridge: `bridge_a583fa69-5153-4eaf-9562-86e0afb576c7`.
- Start: `rotation_80800089-79aa-409a-8d9c-18a79e48b140`.
- Terminal: `rotation_c4c7bb2c-3c73-4ebc-a661-6f3f469eb47f`.
- Planner: 291 input / 1,139 output / 1,430 total tokens; USD 0.005986;
  11,305 ms; response identity retained.
- Critic: not invoked.
- Failure: `live_observer_artifact_invalid`, observer stage `json_parse`, safe
  issue `{code: invalid_json, path: $}`.
- Output and observed-store digest:
  `sha256:679eee9d6bdb9989eb820c155e6dec6ab75b460819794d7fa8c4c6ea34e25b40`.

LIVE-F5 worked as designed: the response did not hit either truncation signal,
and the exact normalized bytes survived as digest-bound T0 evidence before the
parse failure. The terminal record names the raw-output reference, and no output
text appears in the Ledger.

The authorized LIVE-F6 diagnostic read only the stored T0 structure. The 4,543
bytes have no BOM, preamble, trailing prose, or outer whitespace. The first line
is exactly a `json` Markdown fence, the last line is exactly the closing fence,
and those are the only fence lines. Removing exactly those two complete lines
yields one strict JSON object. Its closed semantic shape passes the unchanged
LIVE-F4 payload validator with zero issues. No payload prose was quoted or
recorded in this report.

This report does not claim a sibling-absence or leaf-cleanup credential proof for
attempt five: those facts are not present in the safe Ledger chain and were not
separately supplied for the record. LIVE-F6 remains offline-only and does not
reinterpret that missing operational evidence.

`LIVE-R2 E1 attempt five: STOP — Planner returned a complete strict semantic
object inside one exact Markdown JSON fence; T0 evidence survived, strict parsing
correctly rejected the wrapper, and Critic was not invoked.`
