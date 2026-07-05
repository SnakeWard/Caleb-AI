# First Grok Live Call Acceptance Report (Pass G2)

Status: Accepted — first Grok/xAI live invocation completed, membrane intact
Date: 2026-07-05
Pre-change snapshot: `snap_20260705T015648621Z_000313_milestone`
Approved by: plittle78
Prior boundary pass: G1 — docs/GROK_LIVE_ADAPTER_IMPLEMENTATION.md

## 1. What Happened

Caleb AI made its first live Grok/xAI API call: one bounded, gated, fully ledgered
invocation of `grok-3-mini` through `run-one-provider-adapter-live` with
`--adapter-id grok_live_adapter`, via the G1 adapter (`grok_live_adapter` v0.1.0).

Every gate in the chain was exercised for real on the successful attempt: in-process
dry-run evidence (ledgered before the call), R36 prerequisites, kill switch,
caller-granted network permission, human approval, allowlist, request contract
validation, prompt digest integrity, and the caller-declared credential closure.

## 2. Reality Contact Sequence

### Attempt 1 — HTTP 410 (contract assumption broken)

The first live attempt (ledger `ledger_ebd464a0-aac3-41c0-9590-6abd8e8d83ab`)
failed with `provider_http_410` while sending `search_parameters: { mode: "off" }`
per the G1 wire lock. xAI responded:

> Live search is deprecated. Please switch to the Agent Tools API.

The membrane held: structured failure, digest-only, no key leakage, ledger chain
intact. This is a documented finding, not a gate failure.

### Contract correction (authorized within G2)

`search_parameters` was removed from the xAI wire body in
`src/providers/xaiLiveAdapter.ts`. Offline test updated. Probe confirmed
`grok-3-mini` succeeds without that field.

### Attempt 2 — Success

The second live attempt completed with `response_schema_valid`.

## 3. The Invocation Record (digest-only, as ledgered — successful attempt)

| Field | Value |
| --- | --- |
| Provider response ID | `91bc2421-b27f-9247-8009-5cda43341a53` |
| Model | `grok-3-mini` |
| Result status | `response_schema_valid` |
| Finish reason | `stop` |
| Token usage | 137 input / 2 output / 139 total |
| Latency | 1,265 ms, attempt 1 of max 2, no timeout |
| Output digest | `sha256:3ef25c849197ef76226ed8bb9b8aa4dc0212702980f2eb38b1ab98ee0c9a9647` |
| Trust tier | Output capped at T1; `requires_hollow_verification_for_t2: true` |
| Ledger chain | `one_provider_adapter_live_dry_run_evidence` → `one_provider_adapter_live_invocation` (parent-linked), write status ok |
| Dry-run ledger ID | `ledger_86b0919a-02fa-4b91-906b-b5e548cebecb` |
| Invocation ledger ID | `ledger_27b9e9b8-d23c-41c0-9590-6abd8e8d83ab` |

## 4. Digest Verification

Offline digest of the literal reply **`acknowledged`** matches the ledgered output
digest exactly (`digest_match: true` if `--expected-output-sha256` is supplied).

Unlike M2 (Anthropic capital-A mismatch), Grok returned lowercase `acknowledged`
for this prompt on the successful attempt.

## 5. Redaction Verification (on real output)

- API key material does not appear in the CLI JSON result or ledger scan (no `xai-`
  prefix matches in `.caleb/ledger/ledger.jsonl`).
- Raw prompt text does not appear in the ledger (no prompt phrase matches).
- Raw model output was never stored, displayed, or persisted anywhere.
- Credential bridge file `.caleb/tmp/xai_api_key` was deleted after the pass.

## 6. Warnings and Findings

1. **`provider_reasoning_content_excluded_from_digest`** — xAI returned
   `reasoning_content` in the wire payload; digest uses `message.content` only
   (by design).
2. **`search_parameters` causes HTTP 410** — G1 assumption that `mode: "off"` is
   safe was wrong. Field must be omitted entirely for chat completions today.
3. **Failed first attempt is ledgered** — honest record of reality-before-fix;
   both attempts are parent-linked to their respective dry-run evidence entries.

## 7. Catalog Invariants

V1 Hollow catalog remains 12. Hollowcut catalog remains 9. No new dependencies.

## 8. Acceptance Verdict

First Grok Live Call: **Accepted.**

Caleb AI now has two live provider membranes (Anthropic M2, xAI G2), both
digest-only, both gated, both ledgered. Next phase: owner-directed (M3
single-pass route MVP or model default review for `grok-4.3` per xAI docs).