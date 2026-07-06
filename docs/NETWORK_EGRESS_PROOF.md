# Network Egress Proof (Pass H5, amended)

Status: Accepted — default suite is behaviorally offline; egress surface pinned
Date: 2026-07-05 (original), amended same day to conform to
`docs/protocols/PASS_PROTOCOL_H5_H6.md` (call-site pin, GEMINI_API_KEY denylist
addition, operating-contract conventions)
Pre-change snapshots: `snap_20260705T042116614Z_000317_milestone` (original),
`snap_20260705T145141971Z_000319_milestone` (amendment) — both verified on disk
No protected files. No src/ changes. Test environment, tests, and docs only.

## 1. Threat Model

Before M1, "no network in the default path" was true because no network
capability existed. After M1 (Anthropic adapter) and G1 (Grok/xAI adapter),
fetch capability legitimately exists in **exactly two gated call sites** —
`src/providers/anthropicLiveAdapter.ts` and `src/providers/xaiLiveAdapter.ts`
(amended from one during the G-pass review; both sit behind identical gate
chains and accept injected fetch). The claim this pass proves is therefore:
**egress exists in exactly two places, behind gates, manual-only — and nowhere
in any default test run.** A reported field cannot prove that; a hostile
environment can.

## 2. Mechanism

`tests/setup/networkEgressBlock.ts`, registered as a vitest setup file for the
default suite, installs four traps before any test module loads:

1. `globalThis.fetch` → throws `NETWORK_EGRESS_BLOCKED_BY_H5`.
2. `net.Socket.prototype.connect` → throws (closes the node:net/http path).
3. `tls.connect` → throws.
4. `process.env` replaced with a Proxy that throws
   `CREDENTIAL_ENV_READ_BLOCKED_BY_H5` on value reads of an exact-name
   denylist (`ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `XAI_API_KEY`,
   `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`,
   `AWS_SECRET_ACCESS_KEY` — the GPT/Gemini names future-proof providers under
   discussion); all other env access passes through untouched. This coexists
   with the acceptance pin of exactly one env-read site in commandHandlers:
   that site is exercised only on the live flag path, which the default suite
   never runs — confirmed by the full suite passing under the trap.

Stand-down rule: the setup file reads `CALEB_LIVE_TEST` once at load time,
before installing anything. Traps arm in every default run and stand down only
under the same explicit opt-in that already gates `*.live.test.ts` execution —
so live tests needed no changes.

## 3. Known Limits (honest scope)

This is **in-process interception, not OS-level enforcement**. It does not
constrain child processes — currently a theoretical limit, since V1 forbids
`shell_command` and the runner blocks it as a permission class; **revisit at
the ffprobe boundary**, the first pass that would legitimize an external
binary. It also cannot constrain native addons; the project has zero
dependencies, making that limit equally theoretical today. The dependency lock
below keeps both limits visible: if either precondition changes, this document
and the trap design must be revisited in the authorizing pass.

## 4. Canary Evidence (detector proof)

`tests/acceptance/networkEgressProofAcceptance.test.ts` deliberately attempts
each violation and asserts the trap fires: a fetch call, a raw
`net.Socket.connect`, a `tls.connect`, and reads of `ANTHROPIC_API_KEY` and
`XAI_API_KEY`. It also proves non-denylisted env reads pass through. A trap
that has never caught anything is unproven; these have.

## 5. Locks

- **Config lock:** an acceptance assertion pins vitest config to (a) loading
  the H5 setup file and (b) excluding `*.live.test.ts` — a future config edit
  cannot silently disarm either boundary.
- **Dependency lock:** an acceptance assertion pins `package.json` to zero
  runtime dependencies and exactly `@types/node`, `tsx`, `typescript`,
  `vitest` as devDependencies — SDK creep becomes structurally visible.
- **Call-site pin (amended):** the egress surface is an enumerated allowlist —
  verbatim as of acceptance:
  `src/providers/anthropicLiveAdapter.ts`, `src/providers/xaiLiveAdapter.ts` —
  enforced by a gate that scans all of `src/` for fetch usage and
  `node:http(s)/net/tls` imports. It fails in **both directions**: egress-capable
  code outside the allowlist (a third adapter cannot arrive silently, the
  G1/G2 lesson), and an allowlisted file that no longer contains its call site
  (stale allowlist). Both failure directions are detector-proven against
  synthetic fixtures. One documented exemption: the code-safety Hollow's
  `network_call` detection rule contains the literal pattern `"fetch("` in
  order to flag fetch in scanned code (a detector, not an egress path).
  **Any future adapter pass must amend the allowlist explicitly in its own
  diff — that visibility is the mechanism.**

## 6. Headline Result — M2 Outstanding-Artifact Closure

**Full suite under active traps: 157 test files / 2,870 tests, all green.**
Zero egress attempts and zero credential reads occurred anywhere in the
default suite. This closes the socket-block suite artifact outstanding since
M2 and converts "offline by default" from a reported field into a behaviorally
enforced invariant.

## 7. Standing Rule

The traps are part of the default suite **forever** — not a one-time audit.
Removing or weakening the setup file, the config registration, or the canaries
requires an explicitly authorized pass, and the config-lock assertion exists to
make silent removal fail loudly.

## 8. Catalog Invariants

V1 Hollow catalog remains 12. Hollowcut catalog remains 9 (asserted in the
acceptance file).

## 9. Acceptance Verdict

Network Egress Proof: Accepted — default suite is behaviorally offline; egress
and credential reads are trapped, canaries proven.
Next phase: M3-C — Raw Output Boundary Contract (design only)

## 10. Amendment — Field Catch and Subprocess Env-Enumeration Coverage (Pass H8, 2026-07-06)

**Protocol:** `docs/protocols/PASS_PROTOCOL_H8_RAR1D.md`
**Pre-change snapshot:** `snap_20260706T024327264Z_000358_milestone` (verified on disk before recording)
**Evidence citations:** Pass H7 STATUS_LOG entry (2026-07-06, BLOCKED then environment repaired); RA-R1 protocol commit `82df49c` (2026-07-06, witnessed green suite before commit)

### Original known-limits claim (Section 3, unchanged above)

Section 3 stated that H5 traps are in-process interception and **do not constrain child processes** — a theoretical limit at the time of H5 acceptance.

### Observed field behavior (H7 episode)

During Pass H7 environment reverification, the credential-read trap (`CREDENTIAL_ENV_READ_BLOCKED_BY_H5`) fired in **child-process paths** exercised by the default suite:

- `tests/hollows/runner.test.ts` (`guardRunner` paths) — 6 failures
- `tests/cli/cliSmoke.test.ts` (`cliSmoke` paths) — 20 failures

Cause: a real ambient `ANTHROPIC_API_KEY` was present in the implementer shell. Child processes spawned by those tests inherited the proxied `process.env`; enumeration of denylisted credential names in the child tripped the trap. This is **broader than Section 3 claimed** for the specific behavior of env-name enumeration in subprocesses that load the H5 setup file — not a claim of OS-level subprocess network blocking.

Precise scope statement: subprocess coverage was proven for **credential env-enumeration paths exercised by guardRunner and cliSmoke**, not for all conceivable child-process network or env behavior. Section 3's network/subprocess limit for fetch/socket/TLS remains accurate; only the credential-read trap's subprocess reach was under-documented.

### Remediation (H7 resolution, witnessed before `82df49c`)

Pat unset provider credentials from the persistent implementer environment. Post-remediation verification (witnessed in the RA-R1 commit session): `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `GROK_API_KEY`, and `OPENAI_API_KEY` all **empty**. Canonical validation `npx vitest run` then completed green at **168 test files / 2,945 tests**.

### Standing operational rule (binds all implementers)

**Credentials are never ambient in implementer shells.** They are set only in the moment of an explicitly authorized live call and unset immediately after. This rule is also recorded in `docs/01_CODEX_OPERATING_CONTRACT.md` (H8 amendment). The trap that produced the first field catch remains armed in every default suite run.
