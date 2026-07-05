# Caleb AI - Pass Protocol L1-B

Prepared by: Claude Fable 5 (reviewer/planner), for execution by Codex (implementer)

Convention: commit this file to `docs/protocols/PASS_PROTOCOL_L1B.md` before or with the work. Handoff rule: first action `git status --short`; if the tree is not clean and the work is not yours, stop and report to Pat.

Origin: post-L1-A review finding. L1-A stated the locked allowlist verbatim. Review identified that `lineage_resolved_decision_facing_record` was admitted before lineage verification existed. Codex confirmed the gate validates `lineage_refs` shape only; it does not dereference lineage, detect role-artifact ancestry, or verify deterministic extraction.

## 1. Pass Name

L1-B - Route-Input Allowlist Correction

## 2. Purpose

Remove `lineage_resolved_decision_facing_record` from the L1 route-input allowlist until RA-X deterministic extraction and lineage verification machinery exists.

## 3. Accepted Prior Pass Summary

L1-A accepted at commit `f0a9dca`: steering boundary locked; eight-entry allowlist pinned verbatim. RA-C accepted at commit `b532ac3`: role artifacts are model outputs capped at T1; deterministic extraction deferred to RA-X.

## 4. Core Rules

- Blocking producer/consumer grep before mutation.
- Remove the type from the allowlist and L1-A lock in the same commit.
- Do not add partial lineage verification.
- Add a standing masquerade detector for unverified role-artifact lineage.
- Removed kind must behave like any unknown kind.
- No other allowlist entries touched.
- No role rotation, providers, egress, UI, package, catalog, historical Ledger, or trust-promotion changes.

## 5. Files To Create

- `tests/acceptance/l1bAllowlistCorrection.test.ts`

## 6. Files To Modify

- `src/logicEngine/types/routeInput.ts`
- `src/logicEngine/routeInputGate.ts`
- L1/L1-A/L1-B tests
- `docs/L1_ROUTE_INPUT_BOUNDARY_ACCEPTANCE_REPORT.md`
- `docs/STATUS_LOG.md`
- `PLANS.md`

## 7. Documentation Requirements

The L1-A report gains a dated amendment explaining the review chain, seven-entry allowlist, RA-X re-admission condition, and standing masquerade detector.

## 8. Acceptance Requirements

- Masquerade fixture rejected.
- Removed kind behaves as unknown kind.
- L1-A lock test green with seven-entry pin.
- Existing L1 detectors remain green.
- Full suite green.
- V1 catalog = 12.
- Hollowcut catalog = 9.

## 9. Validation Commands

```text
npx tsc --noEmit
npx vitest run tests/logicEngine/routeInputGate.test.ts tests/acceptance/l1RouteInputHardeningAcceptance.test.ts tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts tests/acceptance/l1bAllowlistCorrection.test.ts
npm run build
npx vitest run
npm run --silent cli -- list-hollows --json
npm run --silent cli -- list-hollowcut-hollows --json
```

## 10. Final Report Format

Mandatory lines: producer/consumer grep result, seven-entry allowlist verbatim, masquerade detector test name.

Verdict: `Route-Input Allowlist Correction: Accepted - seven-entry allowlist; decision-record type withdrawn until RA-X attaches its verifier; masquerade fixture is a standing detector.`
