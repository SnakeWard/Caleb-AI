# Implementer Seat Record

Append-only. One section per seat tenure. Seat environment is disclosed and
recorded per tenure via SEAT-ONBOARD; this file is a standing precondition
reference for future passes.

## Doctrine

Seat environment is disclosed and recorded per tenure via SEAT-ONBOARD. The
implementer seat record is a standing precondition reference for future passes.
Agent/host identity is a non-promoter and confers no trust.

## Correction — Codex seat physics (ENV-1, SEAT-E2-PREP, 2026-07-20)

**Supersedes:** campaign protocol headers and status prose that described the
Codex implementer seat as **sandboxed with no egress** (or equivalent wall
language).

**Pat disclosure:** the locally installed Codex application held the implementer
seat for much of the campaign. That is not a wall. It is an application host.

**What held (behavioral guarantees):**

- Offline suite runs under H5 traps (credential-env denylist, network egress
  traps in the default test path).
- Credential field catches when ambient keys were present (including the H8
  remediation episode).
- Live provider execution from **Pat's host shell only** after LIVE-F2 doctrine
  (agents prepare offline; they do not execute live provider commands from the
  agent process).

**Enforcement class:** configuration-and-discipline, not wall. Label: **not a
sandbox wall**. Guarantees depended on traps, operator discipline, and runbook
custody — not on an OS-level or product-level egress cage that the seat could
prove from inside.

**Attempts one/two network-failure attribution:** early LIVE-R2 E1 failures were
attributed in part to "sandbox egress." That attribution is **superseded by this
correction**. The *finding* those failures produced — human-host live execution
doctrine (LIVE-F2) — stands on its own merits regardless of the incorrect
sandbox-wall framing.

## Tenure — Grok 4.3 / Grok Build TUI (SEAT-ONBOARD-1, 2026-07-20)

| Field | Value |
| --- | --- |
| Seat holder | Grok 4.3 (xAI) |
| Host | Grok Build TUI (interactive CLI agent) |
| Reasoning locus | xAI provider cloud (model inference); tools execute on the local Windows machine |
| Workspace root | `D:\Caleb AI` |
| Outside-root capability | Read of absolute paths outside the root is available via file tools and shell; write outside root is tool-capable and was not exercised in SEAT-ONBOARD-1 |
| Execution | Shell commands via PowerShell (`pwsh` / `powershell`); host may prompt for approval depending on permission mode |
| Approval mode (as disclosed) | User-selected permission mode; some tools may require human approve/deny; SEAT-ONBOARD-1 env checks ran without block |
| Network policy (as disclosed from inside) | **Indeterminate from inside.** Network-capable tools exist in the agent tool list; shell network was not exercised; full egress policy cannot be determined from the seat |
| Pat external verification result | Not yet reported by Pat as of SEAT-E2-PREP commit. Placeholder remains explicit until Pat fills this field (including the allowed value "host exposes no policy setting" if true). |
| First pass in seat | SEAT-E2-PREP |
| Disclosure reference | SEAT-ONBOARD-1 implementer seat disclosure (session record; read-only) |
