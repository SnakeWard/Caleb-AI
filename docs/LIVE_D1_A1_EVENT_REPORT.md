# LIVE-D1-A1 — First Live Dynamic Rotation Event Report

**Event ID:** LIVE-D1-A1  
**Date:** 2026-07-22  
**Seat seal:** SEAL-D1 (docs/status only)  
**Authorized by:** Pat (T4)  
**Evidence commit:** `f52861a318db9b5d6d70b606a3b3f23fc7285cd3`  
**Register-before-wire:** intended pre-run; durable register entry sealed at SEAL-D1 (see honest deviations). LIVE-D1-PREP at `fa83d03` delivered the wire-ready path and fixture; evidence landed at `f52861a`.

A recap is not a report.

## Summary

First live rotation in which Caleb **selected** the route via the production
classifier path before the wire: gated decision-facing record → five-check
verifier → table `rax4.1.0` → `selection_path: "classifier"` → row-1
`["planner", "critic"]` → existing live gate evidence / Anthropic Haiku
execution → ledger → reconstructable selection fields.

**Outcome:** completed (both roles schema-valid; handoff allowed; terminal
`rotation_execution_completed`).

## Selection (from production `route_classification_decision`)

| Field | Value |
| --- | --- |
| `selection_path` | `classifier` |
| `table_version` | `rax4.1.0` |
| `role_sequence` | `["planner", "critic"]` |
| Features | stakes=`low`, ambiguity=`bounded`, evidence_need=`none` |
| `decision_record_id` | `route_input.decision_facing.live_d1` |
| `decision_record_digest` | `sha256:9f3f907821e86a94730895ef1959e2ad59f1605816b4c5c6dd1902aaef8fd124` |
| Classification ledger id | `route_class_895873f187ab` |
| Source RRP id | `rrp_d15e0001-0000-4000-8000-0000000000d1` |

Feature tokens match RA-X-5 route-1 / event-d1 fixture constraints.

## Execution identity

| Field | Value |
| --- | --- |
| `plan_id` | `plan_2842e23d-103a-56a8-bbcf-f35d68032521` |
| `execution_id` | `execution_ff8fd976-90d5-4e68-9121-929432e6f7dd` |
| Bridge ledger id | `bridge_df5ae040-0b89-4f30-89a0-1ef781f4862d` |
| Terminal activity | `rotation_execution_completed` |
| Role order | planner → critic |

## Per-role tokens / spend

| Role | Input | Output | Total | Est. spend USD | Provider / model |
| --- | --- | --- | --- | --- | --- |
| planner | 332 | 1032 | 1364 | 0.005492 | anthropic / claude-haiku-4-5 |
| critic | 1682 | 1107 | 2789 | 0.007217 | anthropic / claude-haiku-4-5 |

## Totals and budget standing

| Metric | Actual | Budget | Standing |
| --- | --- | --- | --- |
| Invocations | 2 | 2 | at ceiling, not exceeded |
| Total tokens | 4153 | 8192 | under |
| Est. spend USD | 0.012709 | 0.05 | under |

Planner budget max_tokens 1536; Critic 2048 (gate evidence; not exceeded).

## ABSENT proofs noted

| Absence | Status |
| --- | --- |
| No second live attempt under same plan without new AUTH | Noted — single execution_id in evidence |
| No Analyst / synthesizer live steps | Absent (row-1 lock + live gate) |
| No raw model prose in ledger results | Digest-only / T1 role artifacts (standing live doctrine) |
| No T2+ on model role invocations | Planner/critic ledger trust_tier **T1** |
| No fallthrough / fixed-signal selection | `selection_path` is **classifier**, not fixed_signal |

## Register and commits

| Item | Value |
| --- | --- |
| Register label | LIVE-D1-A1 |
| Evidence commit (full) | `f52861a318db9b5d6d70b606a3b3f23fc7285cd3` |
| Evidence subject | `LIVE-D1-A1: first live dynamic rotation evidence - classifier-selected planner_critic, table rax4.1.0` |
| LIVE-D1-PREP (wire path) | `fa83d03` |
| Outcome | `"completed"` |

## Live reconstruction (production API)

Command shape (offline reconstruct against committed ledger bytes):

```text
reconstructRotationChainFromLedgerJsonl(
  <contents of .caleb/ledger/ledger.jsonl>,
  "plan_2842e23d-103a-56a8-bbcf-f35d68032521",
  "execution_ff8fd976-90d5-4e68-9121-929432e6f7dd"
)
```

**Result:** `ok: true`, `final_status: "completed"`, `completed_steps: 2`,
role order `["planner", "critic"]`.

### Selection fields returned (verbatim)

```json
{
  "selection_path": "classifier",
  "table_version": "rax4.1.0",
  "role_sequence": [
    "planner",
    "critic"
  ],
  "features": {
    "stakes": "low",
    "ambiguity": "bounded",
    "evidence_need": "none"
  },
  "decision_record_id": "route_input.decision_facing.live_d1",
  "classification_ledger_id": "route_class_895873f187ab"
}
```

No unexpected reconstruction outcome. **No STOP.**

## Honest deviations (event + SEAL-D1)

1. **Register timing:** A pre-run LIVE-D1-A1 section was **not** present in
   `docs/LIVE_EVENT_AUTHORIZATIONS.md` at `fa83d03` or at evidence commit
   `f52861a`. SEAL-D1 appends the **single** canonical entry with completed
   evidence fields (not a second entry). See Corrections log in the register.
2. **AUTH-2 detector scope:** The register acceptance detector still keys only
   `LIVE-R2-E*-A*` labels and evidence subjects. LIVE-D1-A1 is human/auth durable
   in the register file; expanding the detector is a future AUTH pass if desired
   (out of SEAL-D1 docs-only scope).

## Verdict

**LIVE-D1-A1 accepted as completed live dynamic selection.** The ledger line
where the system decided is reconstructable: classifier / rax4.1.0 /
planner→critic, under budget.
