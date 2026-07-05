# Caleb AI — Status Log

One entry per completed pass. Oldest first; newest at the bottom. This file is the
single home for pass-by-pass status. README stays stable and links here — status
prose is never appended to README again.

Entries before 2026-07-04 are reconstructed from PLANS.md, acceptance reports, and
the README's former status narrative. Dates were not recorded for those passes and
the ordering across parallel tracks is approximate.

---

## Foundation era (Passes 00–27, undated)

- **Passes 00–15 — V1 MVP foundation.** Hollow manifests, Hollow Registry, Hollow
  Runner, Verified Return Path, JSONL Ledger, Auto Snapshot + Change Guard,
  production text/validation/provenance/code Hollows (protected V1 catalog: exactly
  12), Basic Report Builder, explicit-command CLI. Accepted in
  `V1_MVP_ACCEPTANCE_REPORT.md`; preserved in `V1_MILESTONE_SNAPSHOT.md`.
- **Pass 16** — shared media metadata TypeScript types + path-safety/type/math helpers.
- **Pass 17** — `hollow.media.image_dimensions`.
- **Pass 18** — `hollow.media.aspect_ratio`.
- **Pass 19** — `hollow.media.audio_duration` + `hollow.media.video_duration`
  (provided-metadata-only, read-only normalization).
- **Pass 20** — separate media Hollow catalog + explicit media CLI commands.
- **Pass 21** — media CLI demo + Hollowcut project contract planning fixtures.
- **Pass 22** — Hollowcut project TypeScript types + pure local validator.
- **Pass 23** — `inspect-hollowcut-project` CLI command.
- **Pass 24** — timeline schema contracts.
- **Pass 25** — timeline validation types + shared pure helper functions.
- **Pass 26** — `hollow.timeline.schema_check`.
- **Pass 27** — `hollow.timeline.duration_consistency`, `asset_reference_check`,
  `track_reference_check`, `temporal_integrity_check`.

## ExecPlan era (undated; from PLANS.md, oldest first)

- **GROK — Logic Engine doctrine + contract source integration** —
  `CALEB_LOGIC_ENGINE_CONTRACT.md` (documentation/contract only, no runtime).
- **GROK — Hollowcut export series** — export readiness artifact contract snapshot,
  export runtime boundary plan, export plan preview, readiness rollup report shape.
  Hollowcut catalog reaches 9 Hollows (separate from protected V1 catalog of 12),
  including `export_readiness_check` and `export_plan_preview`.
- **Logic Engine V0.1** — TaskFrame, SignalFrame, RouteDecision, WorkGraph,
  `dispatchHollow` skeleton.
- **Logic Engine V0.2 / V0.2.1** — approval gate, snapshot gate, gate ordering;
  explicit file capture (`filesToCapture`, file_capture vs audit_marker).
- **Logic Engine V0.3** — execution hardening: `ledger_write_status`, warnings,
  `hollow_runner_failed` vs `vrp_rejected` priority, ledger try/catch, CLI exit codes.
- **Logic Engine V0.4** — WorkGraph Executor Lite (`executeWorkGraphLite`).
- **Logic Engine V0.5** — execution context summary (`executionContextBuilder`).
- **Logic Engine V0.6–V0.9** — context surfacing + telemetry hook stub, telemetry
  trace contract, telemetry trace CLI surfacing, functional core acceptance lock
  (`LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md`).
- **Role Artifact Contract Layer R1–R7** — types + validation; contract registry +
  artifact fixture lock; handoff gate contract lock; artifact reference bundle;
  bundle consistency report; fixture matrix; contract surface acceptance lock.
- **Runtime/Storage track** — planning boundary lock, runtime storage type
  contracts, in-memory artifact store prototype.
- **Model boundary track** — mocked single_pass model boundary, ledgered model
  invocation record, single_pass route MVP, final assembly boundary, ledgered route
  event write, final output ledger record.
- **Live adapter track (planning + no-network scaffolding)** — boundary planning,
  type contracts, redaction contract, mock-compatible interface, no-network stub,
  explicit opt-in planning, type extension, config contract, no-network
  implementation stub, opt-in harness contract + implementation, live test plan,
  live test harness contract, implementation skeleton behind opt-in,
  disabled-by-default live harness scaffold, dry-run report contract, dry-run CLI
  surface, live prerequisites contract + evaluator. No live network call exists.
- **Snapshot Claim Integrity Gate** — most recent ExecPlan before the dated era.

## Dated era

### 2026-07-04 — Pass H1 — Version Control Baseline

Git 2.55 installed (winget). Repository initialized on branch `main`; `.gitignore`
extended with `.tmp-*.json`; 683 files committed as `49f7776`, tagged
`v1-foundation`; private remote `github.com/SnakeWard/Caleb-AI` created and pushed.
Pre-change snapshot: `snap_20260704T150319692Z_000293_milestone`. Suite at pass
close: 149 test files / 2,787 tests green; typecheck clean. Roadmap created:
`CALEB_AI_ROADMAP_TO_LIVE_BOUNDARY.md`.

### 2026-07-04 — Pass H2 — README and Status Consolidation

This file created as the single status home, seeded from PLANS.md and acceptance
reports. README rewritten to a stable short form (doctrine, quickstart, CLI, doc
index); accreted/duplicated status prose removed. Docs only — no source changes.
Pre-change snapshot: `snap_20260704T153744476Z_000294_milestone`.

### 2026-07-04 — Pass H3 — Runner Integrity

Owner-authorized protected-file exception for `src/hollows/runner.ts` and
`src/hollows/runnerTypes.ts`. Four changes: (1) real SHA-256 input digests
computed via `node:crypto` when the caller provides none (`sha256:unserializable`
sentinel for unserializable payloads, which are then rejected before execution —
no completed record can carry it); (2) generated IDs moved from a module-level
counter to `crypto.randomUUID()` with an injectable `id_generator` runner option;
(3) dead severity ternary removed; (4) `abort_signal` added to
`HollowExecutionContext`, aborted when the invocation timeout fires (V1 timeout is
rejection plus signal, not guaranteed cancellation). Zero dependencies added; VRP,
trust policy, catalogs, and gate ordering untouched. New test file
`tests/hollows/runnerIntegrity.test.ts` (+9 tests). Pre-change snapshot:
`snap_20260704T160701614Z_000296_milestone`. Suite at pass close: 150 test files /
2,796 tests green; typecheck and build clean.

**H3 addendum (provenance):** snapshot ID sequence gap 000294 → 000296 explained:
`snap_20260704T154028197Z_000295_milestone` was an incidental "test-milestone"
snapshot created by a CLI test during H2's validation suite run (15:40:28Z).

### 2026-07-04 — Pass M1 — Live Adapter Implementation

The live boundary pass R17–R36 prepared. New: `src/providers/anthropicLiveAdapter.ts`
and `anthropicLiveAdapterTypes.ts` — a fetch-based (zero-dependency) Anthropic
Messages API adapter implementing the R18 provider-neutral contracts, plus the
explicit CLI surface `run-one-provider-adapter-live`. Gate chain before any
network: R36 prerequisites (incl. in-process dry-run evidence, ledgered before
the live call proceeds), kill switch, caller-granted network permission, human
approval, allowlist, request contract validation, prompt digest integrity,
caller-declared credential closure (`credential_auto_read` stays false — the
adapter never reads the environment). Digest-only records; expected-output
digest comparison is informational only, never a failure. Budgets: 64 output
tokens, 30s timeout, 1 bounded retry, 1 MiB response guard; default model
`claude-haiku-4-5`. Live test scaffold `*.live.test.ts` excluded from default
runs (vitest config + acceptance guard). Boundary tests deliberately updated:
provider allowlist +2 files; commandHandlers pinned to exactly one env read.
`.caleb/ledger/ledger.jsonl` now tracked in git (snapshots stay ignored).
**No live call was made in this pass.** Pre-change snapshot:
`snap_20260704T162413397Z_000298_milestone`. Suite at pass close: 153 test
files / 2,833 tests green; typecheck and build clean. V1 catalog 12; Hollowcut 9.

### 2026-07-04 — Pass M2 — First Live Call Acceptance

Caleb AI's first live model invocation: one bounded call to `claude-haiku-4-5`
via `run-one-provider-adapter-live`, all gates exercised for real. Provider
response `msg_0191Nnz9uYGtuT9yYTHWefiB`, `response_schema_valid`, `end_turn`,
14/5/19 tokens, 1,120 ms, ≈$0.000039. Ledger chain intact (dry-run evidence →
invocation, parent-linked); ledger scans confirm no key material and no raw
prompt/output. `digest_match: false` — the model replied `Acknowledged`
(capital A), identified by offline candidate-digest comparison; recorded as a
successful test and the project's first documented reality-corrects-assumption
finding. Honest finding: ledger-ID per-process counter collisions surfaced
(295 entries / 255 unique IDs) — recommended integrity pass before M3. Full
report: `docs/FIRST_LIVE_CALL_ACCEPTANCE_REPORT.md`. Pre-change snapshot:
`snap_20260704T231711622Z_000303_milestone`. No source changes; suite remains
153 files / 2,833 green.

### 2026-07-04 — Pass H4 — Ledger Entry ID Integrity

Owner-authorized protected-file exception for `src/ledger/ledgerEntryFactory.ts`
(ID generation only). Counter replaced with `crypto.randomUUID()` per the H3
pattern; injectable generator in both positions; prefixes preserved. Forward-only
uniqueness gate with detector proof (fails on the M2 duplicate pattern);
historical region frozen (lines 1–296, SHA-256 `b689af12…`) and asserted
untouched. Third-instance audit answered affirmatively: `reportBuilder.ts`
report-ID counter found (same class, timestamp-mitigated) — reported, not
fixed, outside exception scope. Cleared: workGraphBuilder positional node IDs,
snapshotManifest disk-derived sequences. External review relocated to
`docs/reviews/CALEB_AI_SHOWCASE_ASSESSMENT_FABLE5_2026-07-04.md` with
attribution header and its one stale line corrected (M2 completed). Pre-change
snapshot: `snap_20260704T233909537Z_000304_milestone` (verified on disk).
Boundary doc: `docs/LEDGER_ENTRY_ID_INTEGRITY.md`.

### 2026-07-05 — Pass G2 — First Grok Live Call Acceptance

First live Grok/xAI invocation via `grok_live_adapter` / `grok-3-mini`. Attempt 1
failed HTTP 410 because `search_parameters` is rejected by xAI even with
`mode: "off"`; wire body corrected in `xaiLiveAdapter.ts`. Attempt 2 succeeded:
`response_schema_valid`, provider ID `91bc2421-b27f-9247-8009-5cda43341a53`,
137/2/139 tokens, 1,265 ms, digest matches lowercase `acknowledged`. Membrane
and redaction verified; credential bridge file deleted post-pass. Pre-change
snapshot: `snap_20260705T015648621Z_000313_milestone`. Report:
`docs/FIRST_GROK_LIVE_CALL_ACCEPTANCE_REPORT.md`.

### 2026-07-05 — Pass G1 — Grok (xAI) Live Adapter Implementation

Second live provider adapter (`grok_live_adapter`) implemented at
`src/providers/xaiLiveAdapter.ts` behind the full M1 gate chain. CLI
`run-one-provider-adapter-live` generalized with `--adapter-id` (default remains
`anthropic_live_adapter`). Shared helpers in `liveAdapterShared.ts`. Digest-only,
search off, T1 trust ceiling, zero new dependencies. **No live call in G1.**
Pre-change snapshot: `snap_20260705T011849270Z_000307_milestone`. Validation
snapshot: `snap_20260705T014356336Z_000311_milestone`. Suite at pass close:
156 test files / 2859 tests green; typecheck and build clean. V1 catalog 12;
Hollowcut 9. Doc: `docs/GROK_LIVE_ADAPTER_IMPLEMENTATION.md`. Next: G2 first
Grok live call (owner authorization required).

### 2026-07-05 — Pass H5 — Network Egress Proof

Default test runs are now behaviorally offline: `tests/setup/networkEgressBlock.ts`
traps `globalThis.fetch`, `net.Socket.prototype.connect`, `tls.connect`, and
credential env reads (exact-name denylist incl. ANTHROPIC_API_KEY and
XAI_API_KEY) in every default run, standing down only under CALEB_LIVE_TEST=1.
Canaries prove each trap fires; config lock pins the setup file + live
exclusion; dependency lock pins zero runtime deps; inventory lock pins the
egress surface to exactly the two gated adapters (one documented exemption:
the code-safety Hollow's fetch *detection rule*). **Headline / M2
outstanding-artifact closure: full suite green under active traps — 157 test
files / 2,870 tests, zero egress attempts, zero credential reads.** Amended
from the pre-G diagnostic: two gated call sites, not one. No protected files;
no src changes. Pre-change snapshot: `snap_20260705T042116614Z_000317_milestone`
(verified on disk). Boundary doc: `docs/NETWORK_EGRESS_PROOF.md`.

### 2026-07-05 — Pass H5-A — Network Egress Proof (amendment to the superseding protocol)

The amended protocol (`docs/protocols/PASS_PROTOCOL_H5_H6.md`, committed before
this work per the new authorization-chain convention) arrived after original
H5 shipped; this amendment reconciles. Added: **call-site pin** — egress
surface is an enumerated allowlist (verbatim:
`src/providers/anthropicLiveAdapter.ts`, `src/providers/xaiLiveAdapter.ts`)
enforced by a two-direction gate, detector-proven against a synthetic third
call site AND a stale allowlist entry; `GEMINI_API_KEY` added to the
credential denylist (future-proofing); denylist-coverage assertion; operating
contract (`docs/01_CODEX_OPERATING_CONTRACT.md`) gains the two post-G1/G2
conventions (protocol provenance in `docs/protocols/`; handoff-complete-only-
when-tree-clean). Pre-change snapshot:
`snap_20260705T145141971Z_000319_milestone` (verified on disk). Deviation
recorded honestly: the operating-contract edit landed seconds before the
snapshot's completion confirmation (command issued first; git provides
rollback; the snapshot's protected-file capture set was unaffected).

### 2026-07-05 — Pass H6 — Report ID Integrity

Third and final resolution of the per-process counter defect class:
`createReportId` → `crypto.randomUUID()` (timestamp component dropped, argued
in `docs/REPORT_ID_INTEGRITY.md`); injectable `id_generator` on the function
and on `ReportInput`; resolution order explicit > generator > UUID, asserted
by test. Detector reproduces the counter-collision pattern and proves the fix
on the same shape. Filename safety verified (UUID hyphens pass the writer's
denylist). Defect class now extinct: runner (H3), ledger (H4), reports (H6);
look-alikes remain cleared. Pre-change snapshot:
`snap_20260705T150745922Z_000321_milestone` (verified on disk).

### 2026-07-05 — Pass M3-C — Raw Output Boundary Contract (design only)

`docs/RAW_OUTPUT_BOUNDARY_CONTRACT.md` created; nothing else. All five
mandatory questions answered, no deferrals: advisory flow allowlist (§3);
taint rule with the measurement/subject split kept first-class and
`effective_tier = min` (§4, including the owner-approved
effective-tier-consumption rule); lineage recording on post-H4 UUID ledger
refs with the named lineage-resolution gate (§5); content-addressed raw-output
storage with retention and the owner-approved deletion/dangling-reference
clause — deletion removes content, never provenance (§6); display vs.
consumption separated (§7). Worked example traces one artifact end to end
(§9). M3 implementation bound to five acceptance obligations incl. three
detectors: laundering, effective-tier consumption, lineage resolution (§10).
Pre-change snapshot: `snap_20260705T153926420Z_000323_milestone` (verified on
disk). Design-only: suite counts unchanged from H6 (158 files / 2,879).

### 2026-07-05 — Path B — M3 Protocol Draft

Base M3 protocol absence handled honestly: `docs/protocols/PASS_PROTOCOL_M3.md`
did not previously exist as a committed protocol file, while
`docs/protocols/PASS_PROTOCOL_M3_AMENDMENT_A.md` did. Path B created the new
canonical base M3 protocol and integrated Amendment A directly into the protocol
text. This is a protocol-draft pass only: no M3 diagnostic, no M3
implementation, and no `src/`, `tests/`, `types/`, provider, egress, catalog, or
historical ledger-content changes. The required snapshot command appended its
normal snapshot-created Ledger entry. Pre-change snapshot:
`snap_20260705T172058443Z_000325_milestone` (verified on disk before recording).
Validation: typecheck passed; full suite passed 158 files / 2,879 tests; V1
catalog 12; Hollowcut catalog 9.

### 2026-07-05 — M3 Diagnostic

`docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_DIAGNOSTIC.md` created as a diagnostic
only. It confirms the canonical M3 protocol represents M3-C obligations,
evaluates in-memory vs `.caleb/artifacts/` content-addressed storage, recommends
the authority path with `.gitignore` guardrails, recommends the structural tier
split, confirms M3 remains CLI/test-only, and defers display flow to
`M4-DISPLAY-BOUNDARY`. No M3 implementation, no `src/`, no `tests/`, no `types/`,
no provider, no egress, no catalog, and no historical Ledger changes.
Pre-change snapshot: `snap_20260705T173738508Z_000327_milestone` (verified on
disk before recording). The required snapshot command appended its normal
snapshot-created Ledger entry. Validation: typecheck passed; build passed; full
suite passed 158 files / 2,879 tests; V1 catalog 12; Hollowcut catalog 9.

### 2026-07-05 — M3 Raw Output Consumption Boundary Implementation

M3 implementation added the raw-output consumption boundary: `.caleb/artifacts/`
gitignore guardrail, content-addressed authority-path raw-output store,
in-memory fast-path store for pure tests, raw-output lifecycle helper,
derived-evidence tier policy, lineage-resolution gate, and Character Count
consumption boundary wrapper. The structural split is enforced: provenance
records carry `measurement_tier`, `subject_tier`, and `effective_tier`, while
decision-facing evidence exposes `effective_tier` only. M3 remains CLI/test-only
and display flow remains deferred to `M4-DISPLAY-BOUNDARY`. No provider, egress,
role rotation, UI, package, catalog, or historical Ledger changes. Pre-change
snapshot: `snap_20260705T174603371Z_000329_milestone` (verified on disk before
recording). The required snapshot command appended its normal snapshot-created
Ledger entry. Validation: typecheck passed; focused M3 tests passed 5 files /
20 tests; build passed; acceptance suite passed 43 files / 398 tests; full suite
passed 163 files / 2,899 tests; V1 catalog 12; Hollowcut catalog 9.

### 2026-07-05 — M3-A Raw Output Boundary Acceptance Lock

`docs/M3_RAW_OUTPUT_BOUNDARY_ACCEPTANCE_REPORT.md` created to lock M3 as
accepted and preserve model-output trust-boundary evidence. Added
`tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts` to pin the report
to the canonical M3 protocol, implementation doc, golden-path acceptance,
NEVER-flow absence checks, structural split, non-promoters, and all 23 required
acceptance categories. No runtime behavior, provider, egress, catalog, package,
UI, role-rotation, or historical Ledger changes. Pre-change snapshot:
`snap_20260705T180028231Z_000331_milestone` (verified on disk before recording).
The required snapshot command appended its normal snapshot-created Ledger entry.
Validation: typecheck passed; focused M3-A/M3 acceptance passed 2 files / 13
tests; build passed; full suite passed 164 files / 2,905 tests; V1 catalog 12;
Hollowcut catalog 9.

### 2026-07-05 — L1 Protocol Draft

`docs/protocols/PASS_PROTOCOL_L1.md` drafted as the canonical protocol for Logic
Engine route-input hardening. Protocol-only: no L1 diagnostic, no L1
implementation, no `src/`, no `tests/`, no `types/`, no provider, no egress, no
package, no catalog, no M3 runtime, and no historical Ledger changes. The
protocol requires allowlist-based route-input authority and detector coverage
for synthetic T1 model/provider route input, tier-field misuse, display/report
text, unknown record types, and digest/storage/provider identity authority
attempts. Pre-change snapshot:
`snap_20260705T183721991Z_000334_milestone` (verified on disk before recording).
The required snapshot command appended its normal snapshot-created Ledger entry.
Validation: typecheck passed; build passed; full suite passed 164 files / 2,905
tests; V1 catalog 12; Hollowcut catalog 9. Full suite created validation
snapshot `snap_20260705T184115662Z_000335_milestone` (verified on disk before
recording).

---

**Convention:** every future pass appends one dated entry here as part of its
completion report, including pre-change snapshot ID and suite counts at pass close.
