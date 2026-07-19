# Caleb AI — Pass Protocol TIME-1

Date: 2026-07-18

Authority: Pat's explicit TIME-1 go-order following LE-3 implementation commit
`56544f4`.

## Purpose

TIME-1 is a scoped timeout-budget micro-pass. It repairs the canonical-suite gate
without weakening assertions or raising Vitest's global default.

## Authorized envelope

1. Commit and push the LE-3 implementation with acceptance explicitly pending
   TIME-1 before changing timeout policy.
2. Only tests that directly or transitively spawn operating-system processes may
   receive an explicit timeout.
3. Every adjusted test must first pass serially with unchanged assertions under a
   command-line-only diagnostic ceiling, and its measured duration must be
   recorded.
4. Each eligible adjusted test receives a 30-second per-test budget. The budget is
   headroom for process startup, Git, antivirus, filesystem, and scheduler
   variance; it is not a global default.
5. `vitest.config.ts` remains byte-identical. In-process tests continue to use the
   5-second global default.
6. Zero assertion changes. A timeout raise on an assertion-failing test is
   evidence tampering.
7. A machine-checkable guard must prove that adjusted test files differ from
   their pre-change versions only by the approved timeout token and that every
   recorded pre-adjustment run passed.
8. After TIME-1 validation, run the canonical suite. Only a green canonical run
   authorizes the LE-3 acceptance verdict and LE-3-A under the original LE-3
   protocol.

## Standing rule established

Process-spawning tests declare explicit, measured per-test timeout budgets. The
global Vitest default remains the budget for in-process tests.

## Authorized scope extension

The canonical rerun after the initial six adjustments identified
`minimal CLI > create-milestone-snapshot is recognized as a command (parse level)`
as the sole remaining timeout. Pat authorized it as the seventh TIME-1 test under
the same masking guard, measurement, explicit-budget, zero-assertion-change, and
unchanged-global-config rules. This is a named post-pass scope extension, not a
general expansion of timeout eligibility.

## Exclusions

No assertion edits, global timeout, Vitest/package/config change, production-code
change, provider/network change, L1 widening, LE-3 runtime change, or timeout for
an in-process test is authorized.
