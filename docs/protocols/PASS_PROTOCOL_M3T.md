# Pass Protocol M3-T - M3 Acceptance Test Honesty Strengthening

## 1. Pass name

M3-T - M3 Acceptance Test Honesty Strengthening.

## 2. Purpose

Replace vacuous assertions in the M3 acceptance surface with tests that exercise the system under test. This pass strengthens acceptance evidence only. It does not change M3 runtime behavior or any model-output trust boundary.

## 3. Prior summary

M3, M3-A, and M3-B are accepted and locked. L1, L1-A, and L1-B are accepted and locked with a seven-entry route-input allowlist. Pat's spot-check saw the M3 NEVER-flow test, L1 detectors, and L1-A/L1-B locks pass on a clean tree. Follow-up full-text review found the M3 golden path strong, but found two weak acceptance tests: the non-promoter test looped over unused labels, and the display-deferral test asserted locally constructed literal fields.

## 4. Core rules

- Scope is tests and documentation only.
- Do not modify `src/`.
- Do not change runtime behavior.
- Do not add providers, egress, role rotation, UI, allowlist entries, record types, packages, or catalog entries.
- If any real non-promoter attempt can promote provider/model output past T1, stop and report to Pat as a boundary defect.
- Every rewritten assertion must exercise real Caleb code or honestly assert unrepresentability.
- Acceptance tests must not certify locally constructed literals as evidence.

## 5. Files to create

- `docs/protocols/PASS_PROTOCOL_M3T.md`

No new test file is expected unless the non-promoter coverage outgrows the existing M3 acceptance file.

## 6. Files to modify

- `tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`
- `tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts`, only if lock pins require reconciliation
- `docs/M3_RAW_OUTPUT_BOUNDARY_ACCEPTANCE_REPORT.md`
- `PLANS.md`
- `docs/STATUS_LOG.md`
- `.caleb/ledger/ledger.jsonl` through required snapshot commands

## 7. Documentation requirements

Amend the M3 acceptance report with the origin chain: Pat spot-check, full-text review, M3-T correction. Record the standing rule:

An acceptance test must exercise the system under test; a test that asserts a locally constructed literal's own fields certifies nothing, and its green is not evidence.

## 8. Acceptance requirements

- The old unused non-promoter loop is gone.
- Each mandated non-promoter has a named test that performs a real attempt or honestly asserts unrepresentability.
- The display-deferral acceptance is resolved by a real artifact/doc/export assertion or removed with rationale.
- The golden path remains intact; optional factory-produced Ledger lineage may be added if cheap.
- The M3-A lock is reconciled if it pins changed names or counts.
- Full validation remains green.
- V1 catalog remains exactly 12.
- Hollowcut catalog remains exactly 9.

## 9. Validation commands

- `git status --short`
- `npm run --silent cli -- create-milestone-snapshot --name "m3t_test_honesty_prechange"`
- `npx tsc --noEmit`
- `npx vitest run tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts`
- `npm run build`
- `npx vitest run`
- `npm run --silent cli -- list-hollows --json`
- `npm run --silent cli -- list-hollowcut-hollows --json`
- `git status --short`

## 10. Report format

Report the pre-change snapshot, files changed, per-promoter table, display option chosen with one-line argument, whether the M3-A lock required reconciliation, whether golden-path lineage addition was made or deferred, validation results, catalog counts, commit hash, push result, and final clean-tree status.

Verdict:

M3 Acceptance Test Honesty Strengthening: Accepted - every assertion in the locked acceptance surface now exercises the system or honestly claims unrepresentability; vacuous green eliminated.
