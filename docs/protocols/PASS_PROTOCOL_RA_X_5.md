# RA-X-5 — Exhaustive Dynamic-Rotation Mock Rehearsal

**Pass ID:** RA-X-5  
**Seat:** Implementer (Grok), `F:\Caleb AI`.  
**Authorized by:** Pat (T4).  
**Reviewer/planner:** Claude Fable 5.  
**Status:** proving pass — no new classifier/table/matrix capability.

## Objective

Prove the full dynamic-rotation chain on mocks for all eight classifier table
rows: gated decision-facing record → verifier → classifier → LE-2 selection →
mock role execution → ledger → execution-keyed reconstruction from ledger.jsonl
alone.

## Detectors

T1 eight-route correctness · T2 reconstruction all eight · T3 request-only seam
in-route · T4 non-promoter exhaustive · T5 negative mid-route · T6 legality
in-route · T7 determinism/replay.

## Enablement note

RA-R2 gains route_mode `planner_analyst_critic` so classifier row 2
(`[planner, analyst, critic]`) can bridge/execute. Table `rax4.1.0`, classifier
lookup, matrix (39), L1 (8), catalogs (14/9) unchanged.

## Report

`docs/RA_X_5_MOCK_REHEARSAL_REPORT.md`
