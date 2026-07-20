# LIVE-F8 Adapter Failure Evidence — Section 9 STOP Report

**Pass:** LIVE-F8  
**Date:** 2026-07-19  
**Authorization:** Pat (T4), remote authorization  
**Result:** STOP before source mutation

## Outcome

LIVE-F8 discovered an additional evidence-losing executor exit beyond the
diagnosed returned adapter failure. Section 9 requires this finding to reach Pat
before scope grows, so implementation did not begin.

The diagnosed path is a resolved adapter result with `ok: false`. Execution
reaches the explicit adapter-failure branch, currently at
`src/roleRuntime/roleRuntimeExecutor.ts:108`. LIVE-F8 was scoped to add evidence
before that return.

The newly discovered path is a rejected or thrown `adapter.invoke()` call. The
executor awaits the adapter without a catch boundary at
`src/roleRuntime/roleRuntimeExecutor.ts:94`. The exception therefore bypasses
the `ok: false` branch entirely. The seam also awaits `executeStaticRotation()`
without a catch boundary at `src/logicEngine/rotationExecutionSeam.ts:423`, so it
does not reach live-state capture at line 430 or terminal construction at line
433. This path loses the per-step record, failed-step reconstruction, terminal
record, and safe live-state telemetry as a single attempt boundary.

This is distinct from the fifth citation named by LIVE-F8 and is a candidate
**sixth telemetry-collapse citation**. Expanding LIVE-F8 to catch and classify it
without Pat's word would violate Section 9.

## Required disposition

The smallest safe amendment is additive:

1. Make the executor an exception boundary around `adapter.invoke()`.
2. On rejection/throw, emit `role_invocation_failed` before return with the known
   stage and role/step identity, exact taxonomy when available, and `null` for
   attribution or telemetry that cannot be proven.
3. Never serialize exception text, stack data, payload prose, or inferred
   provider attribution.
4. Add a throwing-adapter detector at step 0 and step 1, including terminal and
   execution-keyed reconstruction assertions.
5. Keep the originally scoped returned-failure T1-T6 detector set unchanged.

No gate, validator, normalization, prompt, L1, LE-3, provider transport, or live
fixture change is needed.

## Starting-state verification

- Git starting state: clean and synchronized at
  `5925e356ec824f5974bc7418200175ed13e5cf26`.
- Baseline suite: **201 files / 3,210 tests green**, exit 0.
- Governed typecheck: exit 0.
- Build: exit 0.
- Catalogs: **V1 = 13, Hollowcut = 9.**
- Planner prompt:
  `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`.
- Critic prompt:
  `sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`.
- PRE-7 runbook codification: present.
- Credential-shaped provider variables: absent.
- Pre-change snapshot:
  `snap_20260720T001213891Z_000443_milestone`, 18 files captured, Ledgered.

## Mandatory-line disposition

- L1: not touched.
- `role_invocation_failed` field list as implemented: **not implemented — Section
  9 STOP occurred before source mutation.**
- Telemetry-collapse class: **fifth citation remains open; candidate sixth
  citation discovered at the thrown adapter boundary.**
- T1: not run — implementation stopped.
- T2: not run — implementation stopped.
- T3: not run — implementation stopped.
- T4: not run — implementation stopped.
- T5: not run — implementation stopped; current success baseline remains green.
- T6: not run — implementation stopped.
- AUD-2: not run because the pass stopped before implementation.
- Honest deviations: **none. Section 9 was followed as written.**
- Live calls/network attempts: none.
- Credentials used: none.

## Files changed before STOP

- `.caleb/ledger/ledger.jsonl` — append-only baseline and pre-change snapshot
  evidence.
- `PLANS.md` — LIVE-F8 ExecPlan and STOP disposition.
- `docs/protocols/PASS_PROTOCOL_LIVE_F8.md` — committed authority chain.
- `docs/LIVE_F8_ADAPTER_FAILURE_EVIDENCE_STOP_REPORT.md` — this report.
- `docs/STATUS_LOG.md` — STOP finding.

No source, test, prompt, fixture, gate, matrix, L1, LE-3, provider, or transport
file changed.

PRE-7 remains stopped, and E1 attempt seven remains unauthorized.
