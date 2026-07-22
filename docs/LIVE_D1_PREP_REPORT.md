# LIVE-D1-PREP — Live Dynamic-Selection Seam (Classifier → Wire)

**Pass ID:** LIVE-D1-PREP  
**Seat:** Implementer (Grok 4.3, Grok Build TUI) — **`F:\Caleb AI`**  
**Authorized by:** Pat (T4)  
**Reviewer/planner:** Claude Fable 5  
**Date:** 2026-07-22  
**Base HEAD (pre-pass):** `7b924a1` (RA-X-5)

A recap is not a report.

## Summary

`execute-live-rotation` is now classifier-capable for table row 1. An optional
`lineage_resolved_decision_facing_record` on the live fixture activates:

decision-facing → five-check verifier → `rax4.1.0` classifier → row-1 lock
(`[planner, critic]`) → sequence→`planner_critic` RRP verify → production
`route_classification_decision` ledger line → existing guarded live bridge/execute.

Fixed path (no decision-record) is unchanged. Reconstruction additively surfaces
selection fields when present; historical chains reconstruct with selection `null`.

**No live call in this pass.**

## Suite / catalogs / digests

| Check | Result |
| --- | --- |
| Before | **212 files / 3,284 tests**, exit 0 |
| After | **213 files / 3,294 tests**, exit **0** |
| tsc / build | exit **0** / exit **0** |
| Catalogs | **V1 = 14**, **Hollowcut = 9** (unchanged) |
| Planner digest | `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` **unchanged** |
| Critic digest | `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f` **unchanged** |

## Not-touched declarations

| Surface | Declaration |
| --- | --- |
| L1 allowlist | **eight entries — not touched** |
| Consumption matrix | **39 transitions — not touched** |
| Routing table | **`rax4.1.0` — not touched** |
| Classifier lookup / five-check verifier | not modified (called, not edited) |
| Prompts / digests | unchanged |
| E1/E2 fixtures | unchanged |
| Budgets / gate-evidence validators | unchanged |

## D3 derivation choice

**Verify (not derive-from-scratch):** fixture still carries full RRP including
`live_rotation_gate_evidence`. Classifier `role_sequence` maps to expected live
RRP shape; fixture RRP must match or refuse. Classifier decides; fixture cannot
override.

### Sequence → live route_mode mapping (committed)

| role_sequence | live `route_mode` | `max_cycles` |
|---|---|---|
| `["planner", "critic"]` | `planner_critic` | 1 |

Unmapped sequences refuse (`live_dynamic_sequence_unmapped` / row-1 lock).  
**Never** use `RouteDecision.route_mode` (`single_pass` for two roles).

## Event-d1 fixture

**Path:** `examples/live-rotation/event-d1.dynamic.fixture.json`

| Field | Value |
|---|---|
| Features (constraints) | `feature:stakes=low`, `feature:ambiguity=bounded`, `feature:evidence_need=none` |
| Lineage | `gated:contract_validated_task_frame:route_input.live_d1` |
| Gate evidence | Planner **1536** / Critic **2048** / run **8192** / **$0.05** / **2** inv; both `anthropic_live_adapter` + `claude-haiku-4-5`; digests pinned; `approved_by: "Pat"` |
| RRP | `planner_critic` / `["planner","critic"]` / `max_cycles: 1` |

## Detectors T1–T8

| Detector | Result |
| --- | --- |
| **T1 dress rehearsal** | **Pass** — see quoted selection below |
| T2 verifier refusal | Pass — broken lineage / route pre-commit refuse before execution |
| T3 row-1 lock | Pass — `evidence_need=required` → `live_dynamic_row1_lock_failed` |
| T4 vocabulary | Pass — mapping + RRP contradiction refuse |
| **T5 fixed-path invariance** | **Pass** — E1 no decision-record → no classification line; selection null |
| **T6 historical honesty** | **Pass** — pre-D1 chain selection all null |
| T7 evidence-before-execution | Pass — classification line before any role start |
| T8 budget parity | Pass — dynamic keeps same gate evidence budgets as E1 |

### T1 reconstructed selection fields (quoted)

```
selection_path: "classifier"
table_version: "rax4.1.0"
role_sequence: ["planner", "critic"]
features: { stakes: "low", ambiguity: "bounded", evidence_need: "none" }
```

Role chain: `["planner", "critic"]`, terminal `completed`, from ledger.jsonl alone.

## LIVE-D1 host-shell command string (source-cited; not authorized yet)

Exact production entry after AUTH-3 + register (single-key Anthropic):

```text
caleb execute-live-rotation --fixture-file examples/live-rotation/event-d1.dynamic.fixture.json --confirm --credential-env-var anthropic=ANTHROPIC_API_KEY --approved-by Pat --ledger-path .caleb/ledger/live-d1-ledger.jsonl --json
```

Source: `handleExecuteLiveRotationCommand` in `src/cli/commandHandlers.ts` (flags: `fixture_file`, `confirm`, `credential_env_var`, `approved_by`, optional `ledger_path`, `json`).  
Host-shell only; no live call authorized by this pass.

## AUD-2

**compliant / T2**, **12 paths** (6 create / 6 modify), **0 violations**  
(base-ref RA-X-5 `7b924a1`). Manifest: `examples/audit/live-d1-prep-pass-manifest.valid.json`.

## Flake rate on F:

**0** timeout flakes on the green full suite (213 / 3,294). CLI smoke may be timing-sensitive under load; not attributed to this pass after green re-run.

## Honest deviations

**F8 T5 pin update:** additive `selection` fields on `ReconstructedRotationLedgerChain` changed the pre-F8 success reconstruction JSON pin (`tests/fixtures/live-f8/pre-f8-success-reconstruction.sha256.json`). Historical selection is honestly `null`. Not a fixed-path behavior change for live execution — reconstruction shape only.

Otherwise: **none**.

## Files created

- `docs/protocols/PASS_PROTOCOL_LIVE_D1_PREP.md`
- `docs/LIVE_D1_PREP_REPORT.md`
- `examples/audit/live-d1-prep-pass-manifest.valid.json`
- `examples/live-rotation/event-d1.dynamic.fixture.json`
- `src/logicEngine/liveDynamicSelectionSeam.ts`
- `tests/acceptance/liveD1PrepDynamicSelectionAcceptance.test.ts`

## Files changed

- `src/cli/commandHandlers.ts` — optional dynamic selection before bridge
- `src/logicEngine/rotationExecutionSeam.ts` — additive selection on reconstruct
- `src/logicEngine/index.ts` — export seam
- `tests/fixtures/live-f8/pre-f8-success-reconstruction.sha256.json` — pin for null selection
- `docs/STATUS_LOG.md`

## Roadmap

**LIVE-D1 is wire-ready** pending Pat’s event-specific authorization (AUTH-3 echo,
register before wire, host-shell, single-key Anthropic, teardown, evidence
`LIVE-D1-A1`). No live call authorized by LIVE-D1-PREP.

## Verdict

**LIVE-D1-PREP accepted offline.** Dynamic selection seam on live path proven by
mock dress rehearsal; fixed path invariant; reconstruction honest.
