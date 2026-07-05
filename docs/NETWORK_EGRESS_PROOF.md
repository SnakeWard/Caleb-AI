# Network Egress Proof (Pass H5)

Status: Accepted — default suite is behaviorally offline
Date: 2026-07-05
Pre-change snapshot: `snap_20260705T042116614Z_000317_milestone` (verified on disk)
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
   `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `AWS_SECRET_ACCESS_KEY`); all other env
   access passes through untouched.

Stand-down rule: the setup file reads `CALEB_LIVE_TEST` once at load time,
before installing anything. Traps arm in every default run and stand down only
under the same explicit opt-in that already gates `*.live.test.ts` execution —
so live tests needed no changes.

## 3. Known Limits (honest scope)

This is **in-process interception, not OS-level enforcement**. It does not
constrain child processes — currently a theoretical limit, since V1 forbids
`shell_command` and the runner blocks it as a permission class. It also cannot
constrain native addons; the project has zero dependencies, making that limit
equally theoretical today. The dependency lock below keeps both limits visible:
if either precondition changes, this document and the trap design must be
revisited in the authorizing pass.

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
- **Inventory lock:** acceptance assertions pin `src/` to zero `node:http(s)`
  imports and enumerate every file referencing `fetch` — the two adapters,
  their types, and one documented exemption: the code-safety Hollow's
  `network_call` detection rule contains the literal pattern `"fetch("` in
  order to flag fetch in scanned code (a detector, not an egress path).

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
