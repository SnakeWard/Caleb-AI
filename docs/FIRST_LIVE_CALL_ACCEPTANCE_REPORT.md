# First Live Call Acceptance Report (Pass M2)

Status: Accepted — first live model invocation completed, membrane intact
Date: 2026-07-04
Pre-change snapshot: `snap_20260704T231711622Z_000303_milestone`
Approved by: plittle78
Prior boundary pass: M1 — docs/ONE_PROVIDER_ADAPTER_LIVE_IMPLEMENTATION.md

## 1. What Happened

Caleb AI made its first live model API call: one bounded, gated, fully ledgered
invocation of `claude-haiku-4-5` through `run-one-provider-adapter-live`,
via the M1 adapter (`anthropic_live_adapter` v0.1.0). Every gate in the chain
was exercised for real: in-process dry-run evidence (ledgered before the call),
R36 prerequisites, kill switch, caller-granted network permission, human
approval, allowlist, request contract validation, prompt digest integrity, and
the caller-declared credential closure.

## 2. The Invocation Record (digest-only, as ledgered)

| Field | Value |
| --- | --- |
| Provider response ID | `msg_0191Nnz9uYGtuT9yYTHWefiB` |
| Model | `claude-haiku-4-5` |
| Result status | `response_schema_valid` |
| Finish reason | `end_turn` |
| Token usage | 14 input / 5 output / 19 total |
| Latency | 1,120 ms, attempt 1 of max 2, no timeout |
| Output digest | `sha256:d87cdf8aa30447b1939653bdbb8f15cabe3bd6fd6c56880e7917dffe27b2b44b` |
| Trust tier | Output capped at T1; `requires_hollow_verification_for_t2: true` |
| Cost | ≈ $0.000039 (14 × $1/MTok input + 5 × $5/MTok output) |
| Ledger chain | `one_provider_adapter_live_dry_run_evidence` → `one_provider_adapter_live_invocation` (parent-linked), write status ok |

## 3. Redaction Verification (on real output)

- The API key appears nowhere in the CLI result, the ledger, or any record
  (verified by scanning the full ledger for key material: none).
- Raw prompt text appears nowhere in the ledger (verified by scan: none).
- Raw model output was never stored, displayed, or persisted anywhere.

## 4. The Digest Mismatch — Reality's First Correction

`digest_match: false`. The prompt asked for exactly `acknowledged`; the model
replied with different bytes. Per the approved M2 criteria, this is a
successful adapter test and a documented finding, not a failure — the entire
loop (gates → wire call → normalization → digest → ledger) worked.

Candidate digest comparison (offline, no output storage needed) identified the
actual reply: **`Acknowledged`** — capital A. The digest-only design proved
itself twice in one call: it kept the output out of every record, and it still
allowed exact content verification after the fact.

Assumption corrected for future passes: model output is nondeterministic in
form even under maximally constrained prompts. Exact-match expectations must be
normalization-aware (or judged by a deterministic Hollow) — never assumed.

## 5. Contract Assumptions vs. Reality

- Request/response shapes: matched. Headers (`x-api-key`,
  `anthropic-version: 2023-06-01`), body shape, `usage`, `stop_reason`, and
  message ID all conformed to the M1 wire implementation on the first attempt.
- Budgets: honored. 5 output tokens against a 64-token cap; no retry needed.
- One deviation: response casing (section 4).

## 6. Honest Findings

1. **Ledger ID collisions (pre-existing defect, surfaced by this pass):** the
   ledger entry factory uses a per-process counter, so `ledger_000001` and
   `ledger_000002` in this run collide with IDs from earlier CLI processes.
   The live ledger currently holds 295 entries with only 255 unique IDs
   (2 duplicated values). Same defect class as the runner ID counter fixed in
   Pass H3. `parent_refs` within a single run are unambiguous, but cross-run
   referential integrity is not. Recommended: a small ledger-ID integrity pass
   (protected-file exception for `src/ledger/ledgerEntryFactory.ts`) before M3
   builds anything on cross-run ledger references.
2. The live ledger entry is now version-controlled: `.caleb/ledger/ledger.jsonl`
   is tracked in git as of M1, so this first invocation is a permanent,
   committed artifact.

## 7. Catalog Invariants

V1 Hollow catalog remains 12. Hollowcut catalog remains 9. No dependencies
added. No protected files touched.

## 8. Acceptance Verdict

First Live Call: **Accepted.**
Models think. Hollows work. Caleb orchestrates — and as of
2026-07-04T23:17:47Z, all three clauses are running code.
Next phase: M3 — Single-Pass Route MVP (requires the raw-output handling
boundary contract, plus the recommended ledger-ID integrity fix).
