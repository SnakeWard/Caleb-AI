# AUTH-2 — Live-Event Authorization Register + Runbook Authorization Step

**Pass ID:** AUTH-2
**Seat:** Implementer (Codex), sandboxed. Docs and tests only. No source mutation, no live calls, no credentials.
**Authorized by:** Pat (T4) — his relay of this protocol constitutes authorization.
**Reviewer/planner:** Claude Fable 5.
**Origin:** Attempts seven and eight carry `human_confirmed: true` (the CLI boolean) but Pat's authorization sentences — which he states he gave to Codex pre-run — are not confirmed present in any committed file. The boolean proves a confirmation occurred; only Pat's recorded words prove who authorized what. This pass makes the words durable, for the past honestly and for the future by construction.
**Protocol commit:** this file commits to `docs/protocols/` before or with the work.

---

## Section 1 — Objective

Three deliverables:

**(1) Extraction (do this FIRST):** search all committed files (status logs, plans, session records, reports) for Pat's pre-run authorization statements for attempts seven and eight. Report verbatim quotes with file and line if found; report "not present in any committed file" if not. The result determines the provenance labels in deliverable 2. Do not guess; do not treat your own session memory as a committed record.

**(2) Authorization register:** create `docs/LIVE_EVENT_AUTHORIZATIONS.md`, append-only, one entry per live event. Backfill entries for attempts one through eight where authorization evidence exists in the record; attempts seven and eight get entries regardless, labeled per the extraction result.

**(3) Runbook amendment:** the committed live-event runbook (`docs/01_CODEX_OPERATING_CONTRACT.md`, live-event section) gains the authorization step as mandatory doctrine.

## Section 2 — Register format (pre-answered)

Each entry, exactly these fields:

```
## <EVENT LABEL>  (e.g. LIVE-R2-E1-A8)
- Authorization: "<Pat's exact words, verbatim>"
- Stated by: Pat (T4)
- Stated when: <pre-run | post-run retroactive>, <date>
- Recorded where first: <file/line if extraction found it | "implementer session context only" | "conversation record with reviewer">
- Register entry created: <date>, AUTH-2 (for backfill) or <event pass> (for future entries)
- Evidence commit: <hash>
- Outcome: <terminal status, e.g. "completed" / "live_observer_output_truncated">
```

For attempts seven and eight, the authorization lines use Pat's format and his actual words as available in the record:
- A7: Pat's recorded sentence "I authorized attempt Seven." (already in the conversation record, recorded post-run) — plus, if extraction finds his pre-run statement to Codex in a committed file, that verbatim quote supersedes as the primary line with the post-run sentence noted as corroboration.
- A8: "Pat, authorized and ran test for attempt eight, LIVE-R2-E1, single-cycle planner_critic" — recorded via reviewer conversation, honestly labeled with its actual timing per the extraction result. **STOP note:** if Pat wants different wording for the A8 entry, he amends at relay time; his words are his.

Provenance labels are never beautified: if the words were only in session context, the register says so. An honest "retroactive" label is doctrine-compliant; a fabricated "pre-run" label is a violation of the first standing rule.

## Section 3 — Runbook amendment text (normative, pre-answered)

Inserted into the live-event runbook immediately before the execution step:

> **Authorization record (mandatory, before execution):** Pat states the event-specific authorization in his own words — format: `Pat, authorized and ran test for <event label>, <event description>` or equivalent naming the event. The implementer seat appends the entry to `docs/LIVE_EVENT_AUTHORIZATIONS.md` immediately, before the command runs. The entry commits either standalone pre-run or, at latest, within the event's evidence commit. The CLI's `human_confirmed` boolean does not satisfy this step; a flag proves a confirmation occurred, only recorded words prove who authorized what.

No other runbook step altered.

## Section 4 — Detector

One permanent test: the register file exists, is parseable per the Section 2 field shape, and contains entries for every event label found in ledger evidence commits matching `LIVE-R2-E1-A*` (grep-style over commit messages or a committed event index). Proven against a known violation: assertion fails when an event label present in history lacks a register entry.

## Section 5 — Forbidden actions

No ledger backfill or retro-editing; no source mutation; no beautified provenance; no invented wording for Pat's entries beyond what he has actually said or relays; no live calls or credentials.

## Section 6 — Mandatory report lines

Extraction result verbatim (found-with-citation or not-present, per attempt); the full register as committed; the runbook amendment as committed, verbatim; catalogs verbatim (13/9 expected); suite counts with exit codes (one test added expected); prompt digests unchanged (Planner `f3267585…9003`, Critic `8074e98c…8e8f`); L1 not touched; AUD-2 result; honest deviations (or "none").

## Section 7 — Commit, STOP, roadmap

`AUTH-2` in commit messages; clean tree + synchronized remote; report rides the handoff. STOP if the extraction surfaces authorization records that contradict this protocol's assumptions (report before writing the register), or if any register entry would require inventing words Pat has not said. On acceptance: E2 remains on Pat's separate word, and its authorization will be the first entry written under the new runbook step by construction.
