# TIME-1 Process-Spawn Timeout Budgets

Status: Accepted

Date: 2026-07-18

Protocol: `docs/protocols/PASS_PROTOCOL_TIME1.md`

Base implementation commit: `56544f4`

Pre-change snapshot: `snap_20260718T220634787Z_000396_milestone` (Ledgered and
verified on disk)

## Standing rule

Process-spawning tests declare explicit, measured per-test timeout budgets. The
global Vitest default remains the budget for in-process tests.

TIME-1 does not change `vitest.config.ts`. Its pre-change SHA-256 is
`6141e1903f82b0acc1911446e2949fb3bb4e6bed2bee24f5654ad39db7bca05b`, and the
guard requires that byte hash to remain unchanged.

## Pre-adjustment masking guard

Before any test source changed, the eligible tests ran serially with unchanged
assertions and a command-line-only diagnostic ceiling:

```text
npx vitest run tests/cli/auditPassComplianceCli.test.ts tests/changeGuard/guardRunner.test.ts tests/cli/minimalCli.test.ts tests/acceptance/aud2GitChangesetCollectionSeamAcceptance.test.ts --no-file-parallelism --testTimeout=30000 --reporter=verbose -t <six-candidate-name-filter>
```

The first six measured candidates passed. The snapshot CLI candidate was excluded
because its implementation does not reach `child_process`; TIME-1 does not change
it. A complete affected-file run then exposed one additional eligible AUD-2 path,
which passed its own unchanged serial pre-adjustment measurement. The six eligible
process-spawning tests are:

| Test | Pre-adjustment serial result | Measured duration | Explicit budget | Process proof |
| --- | --- | ---: | ---: | --- |
| `audit-pass-compliance CLI > compliant audit returns ok:true with verified T2 hollow result` | passed | 10,974 ms (prior observed timeout: 6,146 ms) | 30,000 ms | Direct Git `execFileSync`, then audited Git collection |
| `audit-pass-compliance CLI > non-compliant audit returns ok:true with compliant false verdict` | passed | 3,388 ms (prior observed timeout: 5,735 ms) | 30,000 ms | Audit command → Git `execFileSync` |
| `audit-pass-compliance CLI > handler returns JSON-serializable payload with --json` | passed | 8,225 ms | 30,000 ms | CLI handler → audit command → Git `execFileSync` |
| `GuardRunner > runCommand captures stdout` | passed | 727 ms | 30,000 ms | `GuardRunner.runCommand` → Node `spawn` |
| `GuardRunner > runCommand captures stderr` | passed | 1,093 ms | 30,000 ms | `GuardRunner.runCommand` → Node `spawn` |
| `AUD-2 git changeset collection seam acceptance > invokes hollow.audit.pass_compliance_check through registry/runner/VRP path` | passed | 6,092 ms | 30,000 ms | Audit command → Git `execFileSync` |
| `minimal CLI > create-milestone-snapshot is recognized as a command (parse level)` | passed | 1,435 ms (canonical timeout: 5,078 ms; prior focused observation: 4,276 ms) | 30,000 ms | Seventh test, identified post-pass by canonical re-run; explicit scope extension for snapshot/filesystem variance |

The 30-second budget supplies process-start variance headroom. It does not change
the command's own timeout, its behavior assertions, or the global test budget.

## Canonical scope extension

The first canonical rerun after the six process-spawn adjustments passed
3,119/3,120 tests. Its sole failure was the snapshot CLI test at 5,078 ms. Pat
authorized the **seventh test, identified post-pass by canonical re-run**, as a
TIME-1 scope extension. Before adjustment it passed alone with unchanged
assertions at 1,435 ms. Its earlier focused observation was 4,276 ms. It receives
the same 30-second variance class; this does not alter the standing rule or create
a general in-process timeout category.

## Structurally excluded timeouts

- The H5 source-tree scan timeouts were in-process filesystem checks. They are
  ineligible.

## Timeout-only integrity guard

`scripts/verify-time1-timeout-budgets.mjs` consumes the immutable measurement
record in `examples/audit/time1-process-spawn-measurements.valid.json`. It checks:

1. every adjusted test had `serial_pre_adjustment_status: passed`;
2. every recorded duration is below its explicit budget;
3. process-spawn evidence tokens still exist at each recorded call-chain path;
4. `vitest.config.ts` remains byte-identical;
5. removing the exact approved `, 30_000` tokens and restoring canonical checkout
   line endings and each file's committed terminal-newline convention restores its
   pre-change SHA-256 exactly; and
6. each file contains exactly the declared number of timeout tokens.

Therefore any assertion, fixture, setup, import, or unrelated timeout edit makes
the guard fail.

## Validation record

- Timeout-only integrity guard: green; 7 adjusted tests, global config unchanged,
  assertion changes 0.
- Initial affected surface after process-spawn adjustments: 3 files / 19 tests,
  all passed.
- Seventh test, normal configuration: 1 file / 1 selected test passed.
- Canonical typecheck: exit 0.
- Build: exit 0.
- Catalogs: V1 13; Hollowcut 9.
- AUD-2 self-smoke: compliant/T2 across 12 paths; zero violations.
- First post-extension canonical attempt: 3,105/3,120 passed with 15 timeout-
  only failures across six files during abnormal machine-wide contention; duration
  731.53 seconds. No assertion failure was reported and no further timeout edits
  were made from that pathological sample.
- Clean canonical rerun: 187/187 files and 3,120/3,120 tests passed, exit 0, in
  317.41 seconds.

TIME-1: Accepted — seven measured, assertion-preserving local budgets; global
Vitest policy unchanged.
