# Grok (xAI) Live Adapter Implementation (Pass G1)

Status: Live adapter implemented; disabled by default; no live call made in this pass
Prior pass: M2 — First Live Call Acceptance (Anthropic); G1-prechange `snap_20260705T011849270Z_000307_milestone`
Authorization: Owner-approved G1 ExecPlan in `PLANS.md` (2026-07-05)

## 1. Purpose

G1 adds a second live provider adapter for xAI Grok at `src/providers/grokLiveAdapter.ts`,
implemented against the same R18–R36 contracts as the M1 Anthropic adapter. The existing CLI
surface `run-one-provider-adapter-live` now accepts `--adapter-id grok_live_adapter` (default
remains `anthropic_live_adapter`).

This pass performs **no live provider call**. The adapter is inert unless every gate in the
chain passes, and the default test suite remains fully offline.

## 2. What Is Implemented

- `src/providers/xaiLiveAdapterTypes.ts` — live-enabled xAI/Grok adapter types and defaults.
- `src/providers/xaiLiveAdapter.ts` — fetch-based adapter to `POST https://api.x.ai/v1/chat/completions`.
- `src/providers/liveAdapterShared.ts` — shared digest/trust helpers (zero SDK imports).
- `ALLOWLISTED_LIVE_ADAPTER_IDS` extended with `grok_live_adapter`.
- CLI `--adapter-id` routing for `anthropic_live_adapter | grok_live_adapter`.
- Offline tests (`tests/providers/grokLiveAdapter.test.ts`,
  `tests/cli/runOneProviderAdapterLiveCommand.test.ts`).
- Live test scaffold `tests/providers/grokLiveAdapter.live.test.ts` — excluded from default runs;
  gated on `CALEB_LIVE_TEST=1` plus `XAI_API_KEY`.
- Example prompt fixture `examples/g1-demo/grok-first-call-prompt.txt` (for G2).

## 3. Gate Chain (unchanged ordering)

Same membrane as M1: R36 prerequisites → kill switch → network permission → human approval →
adapter allowlist → request contract validation → prompt digest integrity → credential closure.

## 4. xAI Wire Protocol (G1 locks)

- Endpoint: `https://api.x.ai/v1/chat/completions`
- Auth: `Authorization: Bearer <key>` via caller-declared credential closure only
- Body: `{ model, messages, max_tokens, stream: false }` — **no `search_parameters`** (G2: field triggers HTTP 410)
- Output digest: `choices[0].message.content` only — `reasoning_content` is never digested or stored
- Default model: `grok-3-mini` (override via `--model`)

## 5. Credential Rules (locked)

- `credential_auto_read` remains `false`. The adapter never reads `process.env`.
- The CLI performs exactly one environment read when the caller passes `--credential-env-var`.
- G2 convention: `--credential-env-var XAI_API_KEY` (not hardcoded in the adapter).

## 6. Trust Lock (unchanged)

Raw provider output = T0. Schema-valid provider output = T1 maximum. Provider identity, network
success, opt-in, approval, and ledger presence promote nothing. T2 requires VRP-verified
deterministic Hollow evidence.

## 7. Catalog Invariants

V1 Hollow catalog remains 12. Hollowcut catalog remains 9.

## 8. Acceptance Verdict

Grok Live Adapter Implementation (G1): Accepted
Status: Live adapter implemented behind the full gate chain; no live call made
Validation snapshot: `snap_20260705T014356336Z_000311_milestone`
Suite at pass close: 156 test files / 2859 tests green; typecheck and build clean
Next phase: G2 — First Grok Live Call Acceptance