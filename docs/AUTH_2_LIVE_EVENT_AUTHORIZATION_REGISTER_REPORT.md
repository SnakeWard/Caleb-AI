# AUTH-2 Live-Event Authorization Register Report

**Pass:** AUTH-2

**Date:** 2026-07-20

**Result:** Accepted offline

## Extraction result

Attempt seven extraction result: **not present in any committed file**.

Attempt eight extraction result: **not present in any committed file**.

The search covered the committed tree and historical content search for both
sentences. Neither result was reconstructed from session memory. AUTH-2 therefore
keeps A7 and A8 explicitly labeled `post-run retroactive` rather than upgrading
either to pre-run provenance.

## Full register as committed

```text
# Live-Event Authorization Register

This register is append-only. Each live event records Pat's exact authorization
words, their honest timing and first-record provenance, the evidence commit, and
the terminal outcome. Future entries are appended before execution under the
live-event runbook.

## LIVE-R2-E1-A1
- Authorization: "I authorize LIVE-R2 Event E1: single-cycle planner_critic, both roles on claude-haiku-4-5, budgets per the LIVE-R1 envelope. Proceed with the live rotation"
- Stated by: Pat (T4)
- Stated when: pre-run, 2026-07-19
- Recorded where first: conversation record with reviewer
- Register entry created: 2026-07-20, AUTH-2 (for backfill)
- Evidence commit: 3df86b3fe2d8cd954510c470c2ac36b99505697e
- Outcome: "live_provider_invocation_failed"

## LIVE-R2-E1-A2
- Authorization: "I authorize the LIVE-R2 Event E1 retry: single-cycle planner_critic, both roles claude-haiku-4-5, budgets per the LIVE-R1 envelope, under the LIVE-F1 credential and taxonomy corrections. Proceed."
- Stated by: Pat (T4)
- Stated when: pre-run, 2026-07-19
- Recorded where first: conversation record with reviewer
- Register entry created: 2026-07-20, AUTH-2 (for backfill)
- Evidence commit: e3217d8739657d6c8a8d30da52bf7f85a8bc6136
- Outcome: "live_provider_invocation_failed"

## LIVE-R2-E1-A3
- Authorization: "I authorize the LIVE-R2 E1 retry under LIVE-F1/F2 corrections, executed by me from my host shell per the standing doctrine."
- Stated by: Pat (T4)
- Stated when: pre-run, 2026-07-19
- Recorded where first: conversation record with reviewer
- Register entry created: 2026-07-20, AUTH-2 (for backfill)
- Evidence commit: 41580613ef5f79efd4a5e26d7fce7ead449da8fd
- Outcome: "live_observer_artifact_invalid"

## LIVE-R2-E1-A4
- Authorization: "I authorize the LIVE-R2 E1 retry (attempt four) under LIVE-F1 through F4 corrections, executed by me from my host shell per standing doctrine."
- Stated by: Pat (T4)
- Stated when: pre-run, 2026-07-19
- Recorded where first: conversation record with reviewer
- Register entry created: 2026-07-20, AUTH-2 (for backfill)
- Evidence commit: c2bc73d4a41270206820b3be95c7e6c75ac340ff
- Outcome: "live_observer_artifact_invalid"

## LIVE-R2-E1-A5
- Authorization: "I authorize the LIVE-R2 E1 retry (attempt five) under LIVE-F1 through F5 corrections, executed by me from my host shell per standing doctrine."
- Stated by: Pat (T4)
- Stated when: pre-run, 2026-07-19
- Recorded where first: conversation record with reviewer
- Register entry created: 2026-07-20, AUTH-2 (for backfill)
- Evidence commit: a7f330b8d4dc71d65458b9a0f9d7f78a9ccc82a2
- Outcome: "live_observer_artifact_invalid"

## LIVE-R2-E1-A6
- Authorization: "I authorize the LIVE-R2 E1 retry (attempt six) under LIVE-F1 through F6 corrections, executed by me from my host shell per standing doctrine."
- Stated by: Pat (T4)
- Stated when: pre-run, 2026-07-19
- Recorded where first: conversation record with reviewer
- Register entry created: 2026-07-20, AUTH-2 (for backfill)
- Evidence commit: a17e1344eecfad167b46b677c49fe63408f78c35
- Outcome: "handoff_gate_blocked (two execution attempts)"

## LIVE-R2-E1-A7
- Authorization: "I authorized attempt Seven."
- Stated by: Pat (T4)
- Stated when: post-run retroactive, 2026-07-19
- Recorded where first: implementer session context only
- Register entry created: 2026-07-20, AUTH-2 (for backfill)
- Evidence commit: 9c1bcccd42c55a781a0f1a65a07792c1ce902d8b
- Outcome: "live_observer_output_truncated"

## LIVE-R2-E1-A8
- Authorization: "Pat, authorized and ran test for attempt eight, LIVE-R2-E1, single-cycle planner_critic"
- Stated by: Pat (T4)
- Stated when: post-run retroactive, 2026-07-20
- Recorded where first: conversation record with reviewer
- Register entry created: 2026-07-20, AUTH-2 (for backfill)
- Evidence commit: e30e4200fbc8eac19e9f7ec8f3255de072f70694
- Outcome: "completed"
```

## Runbook amendment as committed

> **Authorization record (mandatory, before execution):** Pat states the event-specific authorization in his own words — format: `Pat, authorized and ran test for <event label>, <event description>` or equivalent naming the event. The implementer seat appends the entry to `docs/LIVE_EVENT_AUTHORIZATIONS.md` immediately, before the command runs. The entry commits either standalone pre-run or, at latest, within the event's evidence commit. The CLI's `human_confirmed` boolean does not satisfy this step; a flag proves a confirmation occurred, only recorded words prove who authorized what.

This paragraph is inserted immediately before the existing host-shell execution
doctrine. No other runbook step was altered, reordered, or paraphrased.

## Detector

The permanent AUTH-2 acceptance test parses each event block as exactly seven
ordered fields, validates timing/provenance/commit shapes, reads labeled Ledger
evidence commits from Git history, and verifies the registered commit hash for
each label. The live history currently supplies A8, A7, and A6 in descending
commit order. Removing A8 from an in-memory copy produces the known violation
`missing_history_entry:LIVE-R2-E1-A8`.

## Validation

| Check | Result |
| --- | --- |
| Starting canonical suite | 204 files / 3,230 tests; exit 0 |
| Focused AUTH-2 detector | 1 file / 1 test; exit 0 |
| Post-change canonical `npm test` | 205 files / 3,231 tests; exit 0 |
| `node ./node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| V1 catalog | 13; exit 0 |
| Hollowcut catalog | 9; exit 0 |
| AUD-2 self-smoke | compliant / T2; 8 paths; 0 violations; exit 0 |

Catalogs verbatim: **V1 = 13, Hollowcut = 9.**

Prompt digests unchanged:

- Planner: `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`.
- Critic: `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f`.

L1: **not touched**. The seven-entry route-input allowlist is unchanged.

## Scope and evidence

No source, runtime, CLI, fixture, prompt, provider, transport, gate, validator,
normalizer, L1, package, or configuration file changed. No live call or
credential use occurred. Historical Ledger bytes are unchanged; the final
working change is one append-only canonical-test snapshot record,
`snap_20260720T150350612Z_000457_milestone`. Prechange snapshot
`snap_20260720T145701939Z_000455_milestone` was verified before implementation.

Honest deviations: **none**.

## Verdict and roadmap

AUTH-2 Live-Event Authorization Register: Accepted — event authorization now
records Pat's words, not merely a CLI boolean, and history coverage is
detector-locked.

E2 remains unauthorized pending Pat's separate event-specific words. Its entry
will be the first created under the mandatory pre-execution register step.
