# LIVE-R2-E1-A8 — Acceptance Report (First Complete E1 Rotation)

**Event ID:** LIVE-R2-E1-A8  
**Assembly pass:** REC-1 (documentation only; no live re-execution)  
**Evidence commit:** `e30e4200fbc8eac19e9f7ec8f3255de072f70694`  
**Evidence subject:** `LIVE-R2-E1-A8: attempt eight ledger evidence - append-only records from live execution`  
**Terminal ledger activity:** `rotation_execution_completed`  
**Sources:** `.caleb/ledger/ledger.jsonl`; `docs/LIVE_EVENT_AUTHORIZATIONS.md`; `docs/STATUS_LOG.md`; execution-keyed reconstruction via `reconstructRotationChainFromLedgerJsonl` (offline, read-only)

A recap is not a report. Every claim below is sourced; gaps are **NOT IN RECORD**.

---

## 1. Event identity

| Field | Value | Source |
| --- | --- | --- |
| Attempt | Eight (E1 fixed single-cycle `planner_critic`) | Register label LIVE-R2-E1-A8; commit subject |
| Evidence commit | `e30e4200fbc8eac19e9f7ec8f3255de072f70694` | Register; `git` |
| Terminal status | `"completed"` | Register Outcome; ledger `status: completed` |
| Plan ID | `plan_a108ac09-63fc-57aa-81b5-a44ad276aa02` | Ledger terminal result |
| Execution ID | `execution_11850824-74ad-46f9-b7ff-3dc67cbd54b8` | Ledger terminal result |
| Bridge ledger ID | `bridge_7dc987bb-43ab-48e5-af1d-fd570cd23b08` | Ledger |
| Source RRP | `rrp_223e4567-e89b-42d3-a456-426614174100` | Ledger |
| Terminal ledger ID | `rotation_2ad0e7f8-bfcd-4cc4-aee8-25c877a74472` | Ledger |
| Execution start ledger ID | `rotation_5157eb22-00c5-4259-ae1d-751207878fbf` | Reconstruction chain |
| Wall-clock (ledger timestamp) | `2026-07-20T14:36:20` (local parse of terminal record timestamp) | Ledger terminal |

### Register entry (verbatim)

From `docs/LIVE_EVENT_AUTHORIZATIONS.md`:

```
## LIVE-R2-E1-A8
- Authorization: "Pat, authorized and ran test for attempt eight, LIVE-R2-E1, single-cycle planner_critic"
- Stated by: Pat (T4)
- Stated when: post-run retroactive, 2026-07-20
- Recorded where first: conversation record with reviewer
- Register entry created: 2026-07-20, AUTH-2 (for backfill)
- Evidence commit: e30e4200fbc8eac19e9f7ec8f3255de072f70694
- Outcome: "completed"
```

**Honest authorization note (from AUTH-2):** Pat's A8 sentence was **not** present in any committed file at AUTH-2 extraction; the entry is labeled **post-run retroactive**. This is a citation of the **authorization-after-the-fact** defect class (named at REC-1 in the operating contract). Structural fixes AUTH-2/AUTH-3 apply to subsequent events. Source: `docs/AUTH_2_LIVE_EVENT_AUTHORIZATION_REGISTER_REPORT.md`; register fields above.

---

## 2. The rotation (ledger invocations)

Digests and telemetry only — no model prose (M2 redaction guarantee).

### Step 0 — Planner

| Field | Value | Source |
| --- | --- | --- |
| Role | `planner` | Ledger live_invocations[0] |
| Provider / adapter / model | `anthropic` / `anthropic_live_adapter` / `claude-haiku-4-5` | Ledger |
| Prompt digest | `sha256:e5fd77d17f2935cf4514ab3e1066278f58db55cf57ef2fa7ae069cd06817d4b4` | Ledger |
| Output digest | `sha256:5c5de3d585cf8eec1ebe119142a47c5df7e22215b3a39b38bd4afc406c9843d3` | Ledger |
| Observed store digest | `sha256:5c5de3d585cf8eec1ebe119142a47c5df7e22215b3a39b38bd4afc406c9843d3` | Ledger |
| Tokens (in/out/total) | 332 / 1007 / **1339** | Ledger |
| Est. spend USD | 0.005367 | Ledger |
| Latency ms | 10586 | Ledger |
| Provider response ID | `msg_011CdDUdUuABeMuS9awtuMN4` | Ledger |
| Budget | max_tokens **1536**, timeout_ms 30000, max_response_bytes 1048576 | Ledger |
| Invocation ledger ID | `rotation_dc1f64c7-dd03-47ef-bdb8-85fec8544ee2` | Ledger |
| Trust tier (invocation record) | **T1** | Ledger `trust_tier` on invocation entry |
| Failure code | null / empty | Ledger |

### Step 1 — Critic

| Field | Value | Source |
| --- | --- | --- |
| Role | `critic` | Ledger live_invocations[1] |
| Provider / adapter / model | `anthropic` / `anthropic_live_adapter` / `claude-haiku-4-5` | Ledger |
| Prompt digest | `sha256:43484e621ba4feb36c7da8a5835baa53d830e361cd5bac8fa0e38e864bdf9fca` | Ledger |
| Output digest | `sha256:ed0be26c26293f8e4ac3d3f1b088306c48ef3cd3dd16aaac0d45f336692a6d15` | Ledger |
| Observed store digest | `sha256:ed0be26c26293f8e4ac3d3f1b088306c48ef3cd3dd16aaac0d45f336692a6d15` | Ledger |
| Tokens (in/out/total) | 1674 / 1097 / **2771** | Ledger |
| Est. spend USD | 0.007159 | Ledger |
| Latency ms | 13209 | Ledger |
| Provider response ID | `msg_011CdDUeGnvYANa4QDUA1k9p` | Ledger |
| Budget | max_tokens **2048**, timeout_ms 30000, max_response_bytes 1048576 | Ledger |
| Invocation ledger ID | `rotation_918d932f-a338-447d-beac-24a00d8a019b` | Ledger |
| Trust tier | **T1** | Ledger |
| Observer normalization stage (reconstruction) | `markdown_fence_unwrapped` | Reconstruction chain (F6 stage telemetry) |
| Failure code | null / empty | Ledger |

Artifact IDs (terminal artifact_refs): `artifact_6bfef142-9e27-4a74-b885-f4eb97bf93b1`, `artifact_2102246c-254f-45e3-b7f5-a25e0f2b4195` — terminal ledger record.

---

## 3. Totals against budgets

| Metric | Actual | Budget (ledger `live_run_budget`) | Standing |
| --- | --- | --- | --- |
| Invocations | 2 | 2 | at ceiling, not exceeded |
| Total tokens | **4110** (1339+2771) | 8192 | under |
| Est. spend USD | **0.012526** | 0.05 | under |

Cross-check: SEAT-E2-PREP-A2 records “A8's completed rotation totaled **4,110** tokens (1,339 Planner + 2,771 Critic)” — `docs/SEAT_E2_PREP_REPORT.md`. Matches ledger.

---

## 4. Reconstruction result (headline evidence)

Offline call (REC-1 assembly; no live network):

```text
reconstructRotationChainFromLedgerJsonl(
  <contents of .caleb/ledger/ledger.jsonl>,
  "plan_a108ac09-63fc-57aa-81b5-a44ad276aa02",
  "execution_11850824-74ad-46f9-b7ff-3dc67cbd54b8"
)
```

**Result (assembled fields):**

| Field | Value |
| --- | --- |
| `ok` | **true** |
| `refusal_code` | null |
| `errors` | `[]` |
| `chain.final_status` | **`completed`** |
| `chain.completed_steps` | **2** |
| `chain.failed_step_index` | null |
| `chain.failure_code` | null |
| `chain.failed_step` | null |
| Role order | planner → critic |
| Planner artifact digest | `sha256:c59431fcd182c8e29e8a0bbde55f8e8f07e3ce52e6ce0d1442b810bd25790517` |
| Planner derived_from (T0) | `sha256:5c5de3d585cf8eec1ebe119142a47c5df7e22215b3a39b38bd4afc406c9843d3` |
| Critic artifact digest | `sha256:e28edb998b441bf99aaa0d8b8a97edb672c3f2c63f450077cd0dbdaf8395c708` |
| Critic derived_from (T0) | `sha256:ed0be26c26293f8e4ac3d3f1b088306c48ef3cd3dd16aaac0d45f336692a6d15` |
| Critic context_refs | step 0 digest `sha256:c59431fcd182c8e29e8a0bbde55f8e8f07e3ce52e6ce0d1442b810bd25790517` |

**Anomaly:** none. Clean completed chain from ledger bytes alone.

---

## 5. Credential lifecycle as recorded

| Proof | Status |
| --- | --- |
| Sibling-process ABSENT for `ANTHROPIC_API_KEY` before injection (this event) | **NOT IN RECORD** as a committed event-specific checklist |
| Leaf ABSENT after cleanup (this event) | **NOT IN RECORD** as a committed event-specific checklist |
| Standing doctrine requiring leaf/sibling proofs | Recorded in `docs/01_CODEX_OPERATING_CONTRACT.md` (LIVE-F1 / host-shell doctrine) — not a substitute for event-bound proofs |

---

## 6. Corrective ladder that made A8 possible

One line each, from `docs/STATUS_LOG.md` era entries (and pass reports):

| Pass | What it fixed (record one-liner) | Citation |
| --- | --- | --- |
| LIVE-F1 | Failure taxonomy preserved; credential-tree / leaf-shell doctrine | STATUS_LOG LIVE-F1 |
| LIVE-F2 | Execution-instance Ledger identity; host-shell live execution doctrine | STATUS_LOG LIVE-F2 |
| LIVE-F4 | Runtime artifact authority; models supply semantics; Caleb owns identity | STATUS_LOG LIVE-F4 |
| LIVE-F5 | Truncation evidence before parse; E1 budgets raised | STATUS_LOG LIVE-F5 |
| LIVE-F6 | Exact Markdown fence unwrap; speculative normalization forbidden | STATUS_LOG LIVE-F6; commit `46cf0c2` |
| LIVE-F7 | Check-11 consumption matrix; gate-refusal Ledger evidence | STATUS_LOG LIVE-F7; `docs/LIVE_F7_HANDOFF_GATE_EVIDENCE_REPORT.md` |
| LIVE-F8 / A1 | Adapter failure + throw evidence (telemetry-collapse citations 5–6) | STATUS_LOG LIVE-F8 |
| PRE-7 | Full mock E1 rotation through Critic; evidence-commit runbook | STATUS_LOG PRE-7 |
| LIVE-F9 | Critic max_tokens 2048; Critic prompt bounds; ledger `-text` | STATUS_LOG LIVE-F9 |

A8 is the first register outcome `"completed"` on the fixed E1 path after that ladder — register §LIVE-R2-E1-A8.

---

## 7. Findings

**No findings list is committed for A8** as a dedicated findings document or register sub-list.

Affirmative: the register Outcome is only `"completed"`; the terminal ledger status is `completed` with empty failure codes on both live invocations; reconstruction `failed_step` is null.

**Note:** Absence of recorded findings for a crown success is itself unusual relative to the A1–A7 campaign history (which is rich in failure taxonomy). That observation is meta-record commentary from SYNC-1/REC-1 assembly scope, not an invented A8 finding.

---

## 8. NOT IN RECORD index (this report)

1. Event-specific sibling ABSENT proof (ANTHROPIC)  
2. Event-specific leaf ABSENT proof  
3. Dedicated A8 findings list document  
4. Pre-run register entry (register itself records post-run retroactive)  

---

## Verdict

**LIVE-R2-E1-A8 accepted as the first completed fixed-path E1 live rotation.** The chain reconstructs from the ledger alone (`ok: true`, `final_status: "completed"`, two steps). Authorization was registered post-run (AUTH-2 citation of authorization-after-the-fact). No live re-execution performed in REC-1.
