# Caleb AI — Roadmap to the Live Boundary and Beyond

Status: PROPOSED (not yet authorized). Each pass below follows existing convention:
diagnostic-first, `<pass_name>_prechange` milestone snapshot before implementation,
completion report with snapshot addendum, CODEX.md "Current Authorized Phase" updated
per pass. No pass begins without explicit owner authorization.

Ordering principle: safety net → cheap integrity fixes → highest-information step
(first live model call) → second reality contact (real file reads) → hardening →
consolidation refactors last (contracts should be corrected by reality before being
consolidated).

---

## Phase H — Hygiene and Safety Net

### Pass H1 — Version Control Baseline

**Goal:** The project's full history survives a disk failure or a bad pass.

- `git init` at repo root.
- Extend `.gitignore`: add `.tmp-*.json` (the root `.tmp-verified.json` /
  `.tmp-verified-readiness.json` files are not matched by the existing `*.tmp` rule).
  Decide whether the large PDFs / media at root are committed (all are under GitHub's
  100MB per-file limit; committing them is acceptable) or moved to `docs/source/`.
- Initial commit: `V1 foundation baseline — Pass 27, suite green (149 files / 2787 tests)`.
- Tag: `v1-foundation`.
- Strongly recommended: create a private GitHub remote and push, for offsite backup
  and to enable CI in Pass Q2.

**Boundaries:** No source, test, or doc content changes beyond `.gitignore`.
**Validation:** `git status` clean after commit; `npm test` untouched and green.
**Done when:** `git log` shows the baseline commit and tag; remote (if created) is pushed.

### Pass H2 — README and Status Consolidation

**Goal:** README stops accreting; status gets one home.

- Create `docs/STATUS_LOG.md`: one dated entry per pass (seeded from PLANS.md headings
  and existing acceptance reports). New passes append here, never to README.
- Rewrite `README.md` to a stable ~80 lines: doctrine, one-paragraph current-phase
  pointer (linking to STATUS_LOG), quickstart, CLI examples, doc index. Remove the
  duplicated/truncated readiness_summary paragraphs.

**Boundaries:** Docs only. No source changes.
**Validation:** README renders clean; no status prose duplicated between README and STATUS_LOG.

### Pass H3 — Runner Integrity Pass

**Goal:** Close the small integrity gaps in the invocation spine.

⚠️ `src/hollows/runner.ts` is a PROTECTED file. This pass requires an explicit
owner-authorized exception, a prechange snapshot capturing `src/hollows/runner.ts`,
and a diff review confined to the four items below.

1. **Real input digests:** when `input_digest` is not provided, compute
   `sha256:` + SHA-256 of `JSON.stringify(input_payload)` via `node:crypto`
   (zero new dependencies). Document that digest is over the serialized form.
   Remove the `"sha256:unprovided"` placeholder path.
2. **Collision-safe IDs:** replace the module-level counter in `createLocalId`
   with `crypto.randomUUID()` (prefixed, e.g. `invocation_<uuid>`).
3. **Dead ternary:** fix `severity: error instanceof HollowRunnerTimeoutError ? "error" : "error"`.
4. **Timeout honesty:** add an `AbortSignal` to `HollowExecutionContext`, aborted on
   timeout. Pure V1 hollows may ignore it; the contract exists before any
   side-effectful hollow does. Document that V1 timeout is rejection, not cancellation.

**Boundaries:** No VRP, trust policy, catalog, or gate-ordering changes. No new dependencies.
**Validation:** Full suite + typecheck + build green; new tests for digest computation,
ID uniqueness, and abort-signal presence. Expect existing tests asserting
`sha256:unprovided` or counter-style IDs to need updating — enumerate them in the diagnostic.
**Done when:** No invocation record can exist with a placeholder digest.

---

## Phase M — Crossing the Model Boundary (the milestone that matters)

### Pass M1 — Live Provider Adapter Implementation (Anthropic, one provider)

**Goal:** A real adapter exists, conforming to the already-built contracts, still
incapable of running by accident.

- Implement the live adapter against `LIVE_ADAPTER_MOCK_COMPATIBLE_INTERFACE.md`,
  satisfying `liveAdapterInterfaceValidator`, `liveAdapterContractValidator`, and
  the redaction contract validator that already exist.
- Transport: built-in `fetch` to `https://api.anthropic.com/v1/messages`
  (Node 18+; zero new dependencies, consistent with doctrine).
- Triple opt-in to execute live: (1) config file passing the existing config contract
  validator, (2) env var `ANTHROPIC_API_KEY` present (key read from env only), and
  (3) explicit CLI flag on an explicit command. Absent any one → dry-run/refusal.
- Redaction: API key and raw auth headers never appear in any invocation record,
  ledger entry, report, error message, or thrown exception. The existing redaction
  contract validator must pass against real adapter output.
- Trust semantics: model output enters as a ModelInvocationRecord at **T0**.
  Because model output is nondeterministic, VRP promotion is capped at **T1**
  (`can_model_consume`, never `can_persist_as_truth`). Confirm `trustPolicy`
  already enforces the `deterministic: false` ceiling; add a test asserting a live
  model record can never reach T2.
- Tests: unit tests with a mocked transport (request shaping, error mapping,
  redaction, refusal paths). Live tests exist but are skipped unless the opt-in
  triple is present.

**Boundaries:** No changes to VRP, hollows, catalogs, Logic Engine routing. The
adapter cannot be reached from `dispatchHollow` or any hollow path.
**Model choice:** default the config to `claude-haiku-4-5-20251001` (cheapest;
a first call costs a fraction of a cent). Config may name any model.

### Pass M2 — First Live Call Acceptance

**Goal:** One real model call, fully ledgered, membrane intact. This is the
vindication milestone.

- Run the dry-run CLI surface; capture output.
- Execute exactly one live call (tiny fixed prompt, e.g. "Reply with the single
  word: acknowledged"), with `--write-ledger`.
- Write `docs/FIRST_LIVE_CALL_ACCEPTANCE_REPORT.md` containing: the ledgered
  ModelInvocationRecord (redacted-by-construction), proof the redaction validator
  passed on real output, the trust tier the record landed at (must be T0/T1),
  token usage and cost, and a statement of any contract assumptions reality broke.
- If reality broke assumptions (streaming, headers, stop reasons, usage shape):
  document them; contract-correction passes get scheduled *after* this report,
  never silently folded in.

**Done when:** The report exists with a real `request_id` and the suite is still green.

### Pass M3 — Single-Pass Route MVP (model in the loop)

**Goal:** First end-to-end "Models think, Hollows work": per `SINGLE_PASS_ROUTE_MVP.md`.

- Logic Engine routes a `model_assisted` TaskFrame: run a hollow → VRP → evidence
  packet (T1/T2) → model consumes the evidence and returns advisory output →
  ModelInvocationRecord ledgered at T0/T1 → final output assembled via the existing
  `finalAssembly` boundary.
- No side effects, no persistence-as-truth of model output, approval gate applies.

**Done when:** One CLI command demonstrates hollow-evidence-to-model-advice with a
complete ledger chain, and a demo doc records it.

---

## Phase R — Second Reality Contact (real files)

### Pass R1 — First File-Reading Hollow (pure TS image header probe)

**Goal:** A hollow touches a real local file for the first time, deterministically.

- New hollow `hollow.media.image_file_dimensions`: reads a local file's bytes and
  parses PNG/JPEG/GIF headers in pure TypeScript (no dependencies, no ffprobe).
- Permission: `workspace_read` only (not in the runner's forbidden set — verify and
  add a test pinning that). Path safety per `MEDIA_METADATA_SAFETY_POLICY.md`:
  relative paths only, no traversal, size cap before read.
- Deterministic (same file bytes → same output) → **T2-eligible**. This makes it the
  first hollow producing verified truth about the real world, not supplied state.
- Catalog: goes in the **media catalog**. V1 catalog stays exactly 12. Boundary tests
  updated deliberately, never loosened.

### Pass R2 — External Probe Boundary Plan (ffprobe) — DESIGN ONLY

Real audio/video duration requires an external binary = `shell_command`, which the
V1 runner forbids. Do not implement. Write the boundary doc (mirroring
`HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md`): `approved_side_effect` execution mode
design, approval gate requirements, output trust ceiling. Implementation is a
future authorized phase.

---

## Phase Q — Hardening and Professionalization

### Pass Q1 — Adversarial and Property Testing

- Fuzz all public validators with malformed/hostile input (wrong types, huge inputs,
  prototype-pollution keys like `__proto__`, unicode edge cases, injection strings).
- Failure injection: ledger disk-full/permission errors, snapshot failures mid-gate,
  concurrent `appendMany` calls against one JSONL ledger (define and test the
  guarantee, even if it is "no interleaved partial lines").
- Property tests for the trust lattice: no input to VRP may ever yield
  `can_trigger_side_effect: true`; no nondeterministic record ever reaches T2.

### Pass Q2 — Continuous Integration

Requires H1 remote. GitHub Actions: `npm ci && npm test && npm run typecheck &&
npm run build` on every push. Branch protection on main once green.

### Pass Q3 — Internal Schema Utility (ongoing, incremental)

Only after M-series (let reality correct the contracts first). Build one small
internal schema-checking helper (zero deps) and migrate validators to it
opportunistically — one validator per pass, alongside other work, never a big-bang
rewrite. Success metric: `commandHandlers.ts` and the 20KB+ validators shrink
without behavior change.

---

## Phase Horizon — after the above (order TBD, not yet specified)

- **Role Rotation MVP:** two model configurations rotating through the existing Role
  Artifact Contract Layer (R1–R6) and handoff gate — Planner/Critic first.
- **WorkGraph full executor:** multi-node graphs beyond executor-lite.
- **Hollowcut export runtime phase 1:** per the existing boundary plan — Export Plan
  Preview execution strictly gated on T2 readiness evidence, zero blockers.
- **Runtime storage** beyond in-memory artifact store.
- **3D UI / Thinking Mode:** last; consumes the ledger and telemetry traces that all
  prior phases produce.

---

## Sequence summary

| # | Pass | One-line outcome |
|---|------|------------------|
| H1 | Version Control Baseline | History survives disaster; enables CI |
| H2 | README/Status Consolidation | README stable; status has one home |
| H3 | Runner Integrity | Real digests, safe IDs, honest timeouts |
| M1 | Live Adapter Implementation | Real adapter, triple opt-in, redaction enforced |
| M2 | First Live Call Acceptance | One ledgered real model call; membrane proven |
| M3 | Single-Pass Route MVP | Hollow evidence → model advice, end to end |
| R1 | Image File Probe Hollow | First verified truth about a real file (T2) |
| R2 | ffprobe Boundary Plan | Side-effect execution designed, not built |
| Q1 | Adversarial Testing | Green against hostile inputs, not just expected ones |
| Q2 | CI | Every push validated automatically |
| Q3 | Schema Utility | Validator sprawl shrinks incrementally |
