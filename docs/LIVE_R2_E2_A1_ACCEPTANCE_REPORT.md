# LIVE-R2-E2-A1 — Acceptance Report (First Cross-Family Live Rotation)

**Event ID:** LIVE-R2-E2-A1  
**Assembly pass:** REC-1 (documentation only; no live re-execution)  
**Evidence commit:** `873276c767fa32783a820a69499d87215c82f798`  
**Evidence subject:** `LIVE-R2-E2-A1: cross-family showcase - first complete Anthropic+xAI rotation, first attempt`  
**Terminal ledger activity:** `rotation_execution_completed`  
**Sources:** `.caleb/ledger/ledger.jsonl`; `docs/LIVE_EVENT_AUTHORIZATIONS.md`; `docs/AUTH_3_E2_A1_REGISTER_AND_ECHO_REPORT.md`; `docs/SEAT_E2_PREP_REPORT.md`; offline reconstruction

**Why a new file (not an append):** No prior `docs/LIVE_R2_E2*` acceptance report exists in the repository (grep of `docs/` at REC-1). Creating `docs/LIVE_R2_E2_A1_ACCEPTANCE_REPORT.md` is the correct home; AUTH-3 remains the process report for the register/echo fix, not the event crown narrative.

A recap is not a report. Gaps are **NOT IN RECORD**.

---

## 1. Event identity

| Field | Value | Source |
| --- | --- | --- |
| Event | First cross-family live rotation (Planner Anthropic + Critic xAI) | Commit subject; ledger providers |
| Evidence commit | `873276c767fa32783a820a69499d87215c82f798` | Register |
| Terminal status | `"completed"` | Register; ledger |
| Plan ID | `plan_9fb2c1f9-0b72-5656-93db-e487263eede2` | Ledger |
| Execution ID | `execution_0d5260fc-a2b6-4dc1-a93e-358cd2a6e04d` | Ledger |
| Bridge ledger ID | `bridge_6075a780-f0b1-4006-a2ef-fa66472e44db` | Ledger |
| Source RRP | `rrp_323e4567-e89b-42d3-a456-426614174100` | Ledger |
| Terminal ledger ID | `rotation_6cb75ee9-e214-4d3d-9943-0818cd0c8e71` | Ledger |
| Execution start ledger ID | `rotation_d1b60a78-6f22-4994-994f-5b6fc02d2bad` | Reconstruction |

### Register entry (verbatim)

From `docs/LIVE_EVENT_AUTHORIZATIONS.md` (post DEBT-1 field correction of “Recorded where first”):

```
## LIVE-R2-E2-A1
- Authorization: "I Pat authorize. Make it so."
- Stated by: Pat (T4)
- Stated when: post-run retroactive, 2026-07-20
- Recorded where first: implementer session, registered immediately
- Register entry created: 2026-07-20, post-event
- Evidence commit: 873276c767fa32783a820a69499d87215c82f798
- Outcome: "completed"
```

**Honest authorization note:** Register records **post-run retroactive** / **post-event** creation. AUTH-3 exists because this event ran without a pre-run register entry — third citation of **authorization-after-the-fact** (with A7/A8 and D1-A1). Source: `docs/AUTH_3_E2_A1_REGISTER_AND_ECHO_REPORT.md`; register fields above; Corrections log DEBT-1 entry in the same register file.

---

## 2. The rotation (ledger invocations)

### Step 0 — Planner (Anthropic)

| Field | Value | Source |
| --- | --- | --- |
| Role | `planner` | Ledger |
| Provider / adapter / model | `anthropic` / `anthropic_live_adapter` / `claude-haiku-4-5` | Ledger |
| Prompt digest | `sha256:e5fd77d17f2935cf4514ab3e1066278f58db55cf57ef2fa7ae069cd06817d4b4` | Ledger |
| Output digest | `sha256:551cc01bf05a6fbba3d08a9e819586a52e09fa0b296046e03f7bd2670ae3ce89` | Ledger |
| Observed store digest | `sha256:551cc01bf05a6fbba3d08a9e819586a52e09fa0b296046e03f7bd2670ae3ce89` | Ledger |
| Tokens (in/out/total) | 332 / 1047 / **1379** | Ledger |
| Est. spend USD | 0.005567 | Ledger |
| Latency ms | 10594 | Ledger |
| Provider response ID | `msg_011CdDfBR33nLsqYzfccztxv` | Ledger |
| Budget | max_tokens **1536**, timeout_ms 30000, max_response_bytes 1048576 | Ledger |
| Invocation ledger ID | `rotation_944af0dc-d8df-4a65-8001-dae5058898cf` | Ledger |
| Trust tier | **T1** | Ledger |

### Step 1 — Critic (xAI)

| Field | Value | Source |
| --- | --- | --- |
| Role | `critic` | Ledger |
| Provider / adapter / model | `xai` / `grok_live_adapter` / `grok-3-mini` | Ledger |
| Prompt digest | `sha256:ab7c92ebaf11ea61929a81360d92668575c20b8915ed07d89d4740b9169a6fe6` | Ledger |
| Output digest | `sha256:59ae07e9b23e83075b2e0a959258b6561e6a368f52153de582bd2b9f6d176066` | Ledger |
| Observed store digest | `sha256:59ae07e9b23e83075b2e0a959258b6561e6a368f52153de582bd2b9f6d176066` | Ledger |
| Tokens (in/out/total) | 1590 / 212 / **1802** | Ledger |
| Est. spend USD | 0.000583 | Ledger |
| Latency ms | 9723 | Ledger |
| Provider response ID | `f8a6a10b-22c5-9bb2-b52c-51ded85fc380` | Ledger |
| Budget | max_tokens **2048**, timeout_ms 30000, max_response_bytes 1048576 | Ledger |
| Invocation ledger ID | `rotation_0eba4099-50f3-474a-b336-740ff878bf3d` | Ledger |
| Trust tier | **T1** | Ledger |

Artifact IDs (terminal): `artifact_ef43b9a8-5cd9-4f71-8139-17b53f504564`, `artifact_aac1697c-cb48-4a4a-ad6e-412537115755`.

---

## 3. Totals against budgets

| Metric | Actual | Budget (ledger) | Standing |
| --- | --- | --- | --- |
| Invocations | 2 | 2 | at ceiling |
| Total tokens | **3181** | 8192 | under |
| Est. spend USD | **0.00615** | 0.05 | under |

---

## 4. Reconstruction result

```text
reconstructRotationChainFromLedgerJsonl(
  <contents of .caleb/ledger/ledger.jsonl>,
  "plan_9fb2c1f9-0b72-5656-93db-e487263eede2",
  "execution_0d5260fc-a2b6-4dc1-a93e-358cd2a6e04d"
)
```

| Field | Value |
| --- | --- |
| `ok` | **true** |
| `final_status` | **`completed`** |
| `completed_steps` | **2** |
| `failed_step` | null |
| Role order | planner → critic |
| Planner artifact digest | `sha256:992098493c4855a6c3427cdcacf12e39f008fbb1d521cf943fba11903d9ce112` |
| Critic artifact digest | `sha256:aaa1c0bd95e96f0870e1e0815ea821845d1d37c7c88cf83af995aca5b371de45` |
| Critic context_refs | planner artifact digest at step 0 |

**Anomaly:** none.

---

## 5. Credential-ABSENT table (two-key lifecycle)

Standing two-key doctrine (not event-bound proofs) lives in `docs/01_CODEX_OPERATING_CONTRACT.md` (SEAT-E2-PREP) and is exercised by the committed sibling-check form for `ANTHROPIC_API_KEY` and `XAI_API_KEY`.

| Proof required | ANTHROPIC_API_KEY | XAI_API_KEY | Source of truth for claim |
| --- | --- | --- | --- |
| Sibling-process ABSENT before injection (this event) | **NOT IN RECORD** | **NOT IN RECORD** | No committed event-specific ABSENT checklist for E2-A1 (SYNC-1 gap; AUTH-3 does not include ABSENT table) |
| Leaf ABSENT after cleanup (this event) | **NOT IN RECORD** | **NOT IN RECORD** | Same |
| Keys named in runbook for cross-family events | yes | yes | Operating contract two-key section |

**Do not read standing doctrine as proof that the proofs were taken for this event.**

---

## 6. What cross-family demonstrates (same-family does not)

E2-A1 places two **different provider families** in one governed exchange: Anthropic Planner and xAI Critic, both completing under the same plan/execution identity with ledgered digests and **T1** invocation trust tiers on both roles (ledger `trust_tier: T1`). Neither vendor identity appears as a trust-promotion path in the terminal record — both remain T1 model-bound outputs with digest-only ledger presence. Same-family E1-A8 proves the rotation machinery; **cross-family E2-A1 proves the membrane does not privilege a vendor**: two competing models can converse under one budget envelope without either being elevated by brand. Doctrine background: provider/model output ceilings and non-promotion by lineage (e.g. `docs/RAW_OUTPUT_BOUNDARY_CONTRACT.md` T1 provider ceiling); agent/model family as non-promoters in `docs/01_CODEX_OPERATING_CONTRACT.md` seat-binding clause. This paragraph is interpretive of those recorded tiers and doctrines applied to this ledger shape — it does not invent additional event telemetry.

---

## 7. Findings

No dedicated findings list for E2-A1 beyond:

1. **Authorization-after-the-fact** (register post-event) — AUTH-3 finding closed for the process gap; event still completed.  
2. **Credential ABSENT proofs not committed** — REC-1 / SYNC-1 assembly finding (NOT IN RECORD rows above).

---

## 8. NOT IN RECORD index (this report)

1–4. Two-key sibling ABSENT × two keys  
5–6. Two-key leaf ABSENT × two keys  
7. Event-time host-shell transcript  
8. Pre-run register entry (register records post-event)

---

## Verdict

**LIVE-R2-E2-A1 accepted as the first completed cross-family live rotation.** Reconstruction clean (`ok: true`, completed, two steps). Authorization registered after the fact (AUTH-3 citation). Credential ABSENT proofs for this event are **NOT IN RECORD**. No live re-execution in REC-1.
