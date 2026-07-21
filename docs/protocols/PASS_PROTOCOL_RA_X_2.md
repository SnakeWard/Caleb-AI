# RA-X-2 — Analyst Consumption-Matrix Transitions (Wiring Pass)

**Pass ID:** RA-X-2  
**Seat:** Implementer (Grok, Grok Build TUI), `F:\Caleb AI`.  
**Authorized by:** Pat (T4).  
**Reviewer/planner:** Claude Fable 5.

## Objective

Extend the consumption matrix from 33 to **39** with exactly six Analyst transitions.
`hollow_evidence_request` is **not** a matrix row. LE-2 legality honors the six
via registry `allowed_next_roles` only — no dynamic route selection.

## Six transitions

1. planner→analyst `{accepted, needs_revision}`
2. analyst→critic `{accepted}`
3. analyst→synthesizer `{accepted}`
4. analyst→planner `{accepted, needs_revision}`
5. analyst→human_operator `{accepted, needs_revision}`
6. analyst→recovery `{accepted, needs_revision}`

## Isolation retained

Undeclared Analyst transitions default-deny. No hollow/orchestrator matrix row.
