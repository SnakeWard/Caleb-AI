# LIVE-D1-PREP — Live Dynamic-Selection Seam (Classifier → Wire)

**Pass ID:** LIVE-D1-PREP  
**Seat:** Implementer (Grok), `F:\Caleb AI`.  
**Authorized by:** Pat (T4).  
**Reviewer/planner:** Claude Fable 5.  
**Status:** offline prep — no live call.

## Objective

Make `execute-live-rotation` classifier-capable for table row 1: decision-facing
record → five-check verifier → `rax4.1.0` classifier → row-1 lock → RRP verify
against sequence→`planner_critic` mapping → production `route_classification_decision`
ledger line → existing guarded live machinery. Reconstruction surfaces selection
fields additively.

## D3 choice

**Verify:** fixture still carries full RRP (with gate evidence). Classifier
`role_sequence` is mapped to expected live RRP shape; fixture RRP must match
exactly or refuse. Classifier decides; fixture cannot override.

## Mapping table

| role_sequence | live route_mode | max_cycles |
|---|---|---|
| `["planner","critic"]` | `planner_critic` | 1 |

Unmapped sequences refuse fail-closed.

## Report

`docs/LIVE_D1_PREP_REPORT.md`
