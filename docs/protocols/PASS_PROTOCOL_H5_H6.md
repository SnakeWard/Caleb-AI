# Caleb AI — Pass Protocols H5 (Amended) and H6

**Prepared by:** Claude Fable 5 (external reviewer), for execution by the implementing agent in VS Code
**Supersedes:** the H5 section of CALEB_AI_PASS_PROTOCOLS_H4_H5_M3C.md. The original H5 protocol was written when one fetch call site existed; G1/G2 added a second. This amendment incorporates the two-adapter reality and the conventions adopted after the Grok handoff. The M3-C protocol in the earlier document remains in force, unchanged, and follows H6.
**Sequencing:** H5 → H6 → M3-C → M3. No new provider adapters (GPT, Gemini, or otherwise) may be implemented until H5's call-site pin is green — thereafter, each new adapter requires its own protocol and an explicit allowlist amendment, which is the point.

**Convention now in force (first instance is this document):** every pass protocol is committed to `docs/protocols/` before or with the work it authorizes, so the authorization chain is a repo query, not oral history. The implementing agent's first action in H5 is to commit this file to `docs/protocols/PASS_PROTOCOL_H5_H6.md` (this commit may precede the pre-change snapshot, as it authorizes rather than implements).

---

## Pass H5 — Network Egress Proof (Behavior-Level) — AMENDED

### 1. Pass name
H5 — Network Egress Proof

### 2. Purpose
Convert "offline by default" from reported fields into a behaviorally enforced, standing invariant — now proven against a surface of exactly TWO gated egress call sites (Anthropic adapter, xAI adapter). Additionally, pin the egress surface itself: the set of egress-capable files becomes an enumerated allowlist enforced by test, so a third adapter cannot arrive silently the way the second one did. Closes the outstanding M2 artifact (socket-block suite result) and structurally encodes the lesson of the G1/G2 handoff.

### 3. Accepted prior pass summary
H4 accepted: ledger IDs cross-run unique forward-only; third-instance audit named reportBuilder (deferred to H6). G1/G2 accepted: second live adapter (xAI), second live call, shared digest/trust-summary extraction into liveAdapterShared.ts, CLI multi-adapter support with single env-read site preserved, terminals/ deleted and gitignored, handoff recorded.

### 4. Core rules
- No protected files. Test environment, tests, and docs only. If a stray egress path is discovered outside the two known call sites, STOP, report, await direction — do not fix silently.
- **Trap mechanism:** a vitest setup file, registered for the default suite, replacing `globalThis.fetch` and low-level socket connection (`net.Socket.prototype.connect`, `tls.connect`) with stubs that throw `NETWORK_EGRESS_BLOCKED_BY_H5` on invocation. Both adapters accept injected fetch, so all existing offline tests pass unchanged; the traps catch only un-injected, real egress attempts.
- **Call-site pin (new since original protocol):** an acceptance test enumerating the complete allowlist of egress-capable source files — currently exactly `src/providers/anthropicLiveAdapter.ts` and `src/providers/xaiLiveAdapter.ts` — and scanning `src/` for fetch/http/net/tls usage outside that allowlist. The test fails if egress-capable code appears anywhere else, or if an allowlisted file no longer contains its call site (stale allowlist detection, both directions). Any future adapter pass must amend this allowlist explicitly in its own diff — that visibility is the mechanism.
- **Environment-read trap:** proxy `process.env` in the setup file to fail the default suite on any read of a credential-shaped denylist — at minimum `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY` (future-proofing the two providers already under discussion costs nothing now). This must coexist with the existing acceptance pin of exactly one env-read site in commandHandlers: that site is only exercised when the live flag path runs, which the default suite never does. If the diagnostic finds any default-path env read of a denylisted name, that is a finding — report it.
- **Canary rule (detector proof):** fixtures that deliberately attempt (a) a global fetch, (b) a raw socket connect, and (c) a denylisted env read must exist and must assert each trap fires. Traps that have never caught anything are unproven.
- **Config-lock rule:** acceptance assertions that vitest config (a) loads the H5 setup file, (b) still excludes `*.live.test.ts`. A future config edit cannot silently disarm either boundary.
- **Dependency-lock rule:** acceptance assertion pinning the `package.json` runtime-dependency block (currently expected: none beyond existing), so SDK creep is structurally visible.
- The full suite MUST pass under active traps. Record the counts; this number is the pass's headline evidence and the closure of M2's outstanding artifact.

### 5. Files to create
- `tests/setup/networkEgressBlock.ts`
- `tests/acceptance/networkEgressProofAcceptance.test.ts` — canaries, call-site pin, config-lock, dependency-lock.
- `docs/NETWORK_EGRESS_PROOF.md`

### 6. Files to modify
- `vitest.config.ts` — register setup file; confirm live exclusion.
- `docs/STATUS_LOG.md` — H5 entry.
- `docs/01_CODEX_OPERATING_CONTRACT.md` (or AGENTS.md, whichever the diagnostic identifies as the operative contract file) — append the two conventions adopted after G1/G2, verbatim intent: (i) every pass protocol is committed to `docs/protocols/` before or with its work; (ii) a handoff is complete only when the working tree is clean — an incoming agent verifies `git status` clean before touching anything, and stops and reports if it is not and the work is not its own.

### 7. Main doc requirements
`docs/NETWORK_EGRESS_PROOF.md` must state: the threat model (two legitimate, gated, manual-only call sites; the claim proven is "exactly these, nowhere else"); the trap mechanism and its honest limits (in-process interception — does not cover child processes; currently theoretical since V1 forbids shell_command, revisit at the ffprobe boundary); the call-site pin and the rule that adapter additions amend the allowlist in their own diff; canary evidence; and the standing rule that traps are permanent default-suite infrastructure, not a one-time audit.

### 8. Acceptance test requirements
- Full suite green under active traps (counts recorded).
- All three canaries fire.
- Call-site pin: passes on current tree; detector-fixture proof that it fails when a synthetic third call site is present, and when an allowlisted file lacks its call site.
- Config-lock, dependency-lock pass.
- Catalog invariants: V1 = 12, Hollowcut = 9.

### 9. Validation commands
Commit this protocol to `docs/protocols/` first. Pre-change snapshot `h5_network_egress_proof_prechange`, verified on disk before edits. Then: typecheck; targeted new acceptance file; full suite under traps (headline); catalogs. Commit with pass ID; push; clean tree.

### 10. Final report format
House style, plus two mandatory lines: the full-suite-under-traps result stated as the M2 outstanding-artifact closure, and the call-site allowlist stated verbatim as of acceptance. Verdict: `Network Egress Proof: Accepted — default suite is behaviorally offline; egress surface pinned at two gated call sites; canaries proven.`

---

## Pass H6 — Report ID Integrity

### 1. Pass name
H6 — Report ID Integrity

### 2. Purpose
Extinguish the third and final known instance of the per-process counter defect class (H4's audit finding): `reportBuilder.ts` module-state counter. After H6, the defect class identified twice by incident (runner pre-H3, ledger at M2) and once by audit (reports at H4) has zero known instances, closing it before M3-C's lineage work begins referencing report artifacts.

### 3. Accepted prior pass summary
H5 accepted: default suite behaviorally offline, egress surface pinned at two call sites, canaries proven, operating-contract conventions appended.

### 4. Core rules
- `reportBuilder.ts` is NOT a protected file; no exception needed. Scope is ID generation only — report schema, content, and consumers untouched.
- Same pattern, third application: `crypto.randomUUID()` with existing prefix convention preserved; injectable `id_generator` following H4's resolution-order precedent (explicit ID > injected generator > default UUID), with the order stated in a code comment and asserted by one test.
- The existing timestamp component (`Date.now().toString(36)`) may be retained inside the ID or dropped in favor of pure UUID — implementer's choice, argued in the diagnostic. (Reviewer's note: pure UUID is simpler; the timestamp adds no integrity the ledger's own timestamps don't already provide. But sortability arguments are admissible.)
- Test-impact survey required in the diagnostic, H4-style: identify every test touching report IDs and state affirmatively whether any asserts generator format.
- Detector discipline: uniqueness/format assertions proven against a synthetic fixture reproducing the counter-collision pattern.
- Defect-class closure statement: the pass doc must state affirmatively that the H4 audit's full findings are now resolved (runner: H3; ledger: H4; reports: H6) and the two cleared look-alikes (workGraphBuilder positional IDs, snapshotManifest disk-derived sequence) remain cleared with unchanged reasoning.

### 5. Files to create
- `tests/reports/reportIdIntegrity.test.ts` — UUID format, cross-instance and simulated cross-run uniqueness, injection, resolution order, prefix preserved.
- `docs/REPORT_ID_INTEGRITY.md` — brief; may follow H4's doc as template, including the defect-class closure statement.

### 6. Files to modify
- `src/reports/reportBuilder.ts` — the fix.
- `src/reports/index.ts` if barrel exports change.
- `docs/STATUS_LOG.md` — H6 entry.

### 7. Main doc requirements
Per Core rules: the fix, the resolution-order rule, the timestamp-component decision with reasoning, the detector evidence, and the defect-class closure statement naming all three instances and their resolving passes.

### 8. Acceptance test requirements
- New report IDs match the post-H6 format; uniqueness holds across instances and simulated runs.
- Detector fixture proof.
- Existing suite unchanged and green.
- Catalog invariants: V1 = 12, Hollowcut = 9.

### 9. Validation commands
Protocol committed to `docs/protocols/` (already done if H5 committed this file). Pre-change snapshot `h6_report_id_integrity_prechange`, verified on disk. Typecheck; targeted tests; full suite under H5 traps (now the permanent default); catalogs. Commit with pass ID; push; clean tree.

### 10. Final report format
House style. Verdict: `Report ID Integrity: Accepted — per-process counter defect class extinct; all three instances resolved (H3, H4, H6).`

---

## Standing rules (restated for the executing agent)

Snapshot before mutation, verified on disk before recording. Diagnostic before implementation; await approval on open items. No fabricated references. Honest deviation reporting is mandatory and historically rewarded. Absence assertions accompany every boundary. Commit per pass with pass ID; push; verify clean tree. A handoff is complete only when the tree is clean. Catalogs 12/9 asserted every pass. Provider output ceiling remains T1; nothing herein authorizes new adapters, promotion, side effects, role rotation, or UI. After H6, the next pass is M3-C under its existing protocol, unamended.
