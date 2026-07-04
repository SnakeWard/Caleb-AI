# One Provider Adapter Live Implementation (Pass M1)

Status: Live adapter implemented; disabled by default; no live call made in this pass
Prior pass: R37 — Snapshot Claim Integrity Gate (see docs/STATUS_LOG.md for the dated chain)
Authorization: Owner-approved M1 diagnostic (2026-07-04), corrections (a)–(d) incorporated

## 1. Purpose

M1 crosses the live boundary that R17–R36 prepared: a real, fetch-based Anthropic
Messages API adapter now exists at `src/providers/anthropicLiveAdapter.ts`,
implemented against the R18 provider-neutral types, the R19 redaction contract,
the R24 config rules, the R35 prerequisites contract, and the R36 evaluator.

This pass performs **no live provider call**. The adapter is inert unless every
gate in the chain passes, and the default test suite remains fully offline.

## 2. What Is Implemented

- `src/providers/anthropicLiveAdapterTypes.ts` — live-enabled adapter types.
  The R20 mock-compatible interface remains untouched; its literal
  `performs_network_call: false` capability stays true for mock flows.
- `src/providers/anthropicLiveAdapter.ts` — the adapter. Zero new dependencies:
  built-in `fetch` (Node 18+), `node:crypto` digests, `AbortController` timeouts.
- CLI surface `run-one-provider-adapter-live` — explicit command, inert without
  the full flag set; runs the R34 dry-run in-process and ledgers it as evidence
  before any live call proceeds.
- Offline tests (`tests/providers/anthropicLiveAdapter.test.ts`,
  `tests/cli/runOneProviderAdapterLiveCommand.test.ts`) with injected mock fetch.
- Live test scaffold `tests/providers/anthropicLiveAdapter.live.test.ts` —
  excluded from default runs by vitest config and additionally gated on
  `CALEB_LIVE_TEST=1` plus `ANTHROPIC_API_KEY`; guarded by
  `tests/acceptance/liveTestIsolation.test.ts`.

## 3. Gate Chain (all before any network; every miss is a structured failure)

1. R36 prerequisites evaluation with `prerequisites_met: true` — includes
   `dry_run_report_completed`, allowlist membership, and caller-declared
   credential source.
2. Kill switch open (explicit CLI flag).
3. Network permission granted by the caller (explicit CLI flag).
4. Human approval present (`--approved-by`).
5. Adapter ID allowlisted (`anthropic_live_adapter` only).
6. Request passes the R18 contract validator.
7. Prompt digest integrity: `sha256(prompt_text)` must equal the request's
   declared `prompt_digest`.
8. Credential provider returns a non-empty value.

## 4. Credential Rules (locked)

- `credential_auto_read` remains `false`. The adapter never reads `process.env`.
- The CLI performs exactly one environment read, only when the caller passes
  `--credential-env-var <NAME>`, and hands the adapter a closure. The key exists
  only as a function return value inside the call stack — never a field on any
  serializable object.
- Defense in depth: every outbound message string is scrubbed of the key value
  before inclusion in any failure record.

## 5. Redaction Rules (locked)

- Digest-only records: no raw prompt text and no raw model output text appear in
  any returned record, ledger entry, report, or fixture. Output is verified by
  digest comparison (`--expected-output-sha256`), which is **informational
  only** — a mismatch still proves the loop worked and is never a failure.
- Raw-output consumption is deliberately deferred to the M3 boundary contract
  (the `future_approved_storage` slot in the R18 types).

## 6. Budgets (locked for M2)

- `max_output_tokens` 64 by default (`--max-output-tokens` to override).
- `timeout_ms` 30000 by default, enforced via AbortController.
- `retry_count` 1; retries only on 408/429/5xx/network failures, honoring
  `retry-after` capped at 5 seconds.
- `max_response_bytes` 1 MiB guard before JSON parsing.
- Default first-call model: `claude-haiku-4-5`.

## 7. Ledger Rules

- `--write-ledger` is mandatory on the live surface: live invocations must be
  ledgered or refused.
- Entry order: dry-run evidence first, then refusal or invocation entry with
  `parent_refs` linking back to the evidence entry.
- Ledger entries carry digests, token usage, timing, statuses, and trust
  summaries only.

## 8. Trust Lock (unchanged)

Raw provider output = T0. Schema-valid provider output = T1 maximum, asserted by
tests on every outcome. Provider identity, network success, opt-in, approval,
ledger presence, and storage promote nothing. T2 requires VRP-verified
deterministic Hollow evidence.

## 9. Boundary Test Updates (deliberate, not loosened)

- `tests/acceptance/v1PhaseBoundary.test.ts`: the two new adapter files are
  added to the provider allowlist under this pass's authorization.
- `tests/acceptance/oneProviderAdapterDryRunCliSurfaceAcceptance.test.ts`: the
  dry-run module still reads no environment; `commandHandlers.ts` is now pinned
  to **exactly one** environment read, which must be the caller-declared
  credential closure.

## 10. Catalog Invariants

V1 Hollow catalog remains 12. Hollowcut catalog remains 9.

## 11. Acceptance Verdict

One Provider Adapter Live Implementation: Accepted
Status: Live adapter implemented behind the full gate chain; no live call made
Next phase: M2 — First Live Call Acceptance
