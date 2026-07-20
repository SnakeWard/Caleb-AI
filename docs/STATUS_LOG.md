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

### 2026-07-05 — L1 Diagnostic

`docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_DIAGNOSTIC.md` created as a
diagnostic only. It confirms the canonical L1 protocol is allowlist-based,
identifies the current route-input surfaces, names the existing implicit trust
risk around `TaskFrame.signal_hints`, `SignalFrame`, and `selectRoute`, and
recommends a fail-closed discriminated-union route-input gate for a future L1
implementation pass. It keeps M3 connected through lineage-resolved
decision-facing records exposing `effective_tier` only, with
`measurement_tier` and `subject_tier` remaining provenance-only. No L1
implementation, no `src/`, no `tests/`, no `types/`, no M3 runtime, no
provider, no egress, no package, no catalog, no UI, and no historical Ledger
changes. Pre-change snapshot: `snap_20260705T185401847Z_000336_milestone`
(verified on disk before recording). The required snapshot command appended its
normal snapshot-created Ledger entry. Validation: typecheck passed; build
passed; full suite passed 164 files / 2,905 tests; V1 catalog 12; Hollowcut
catalog 9. Full suite created validation snapshot
`snap_20260705T185849865Z_000337_milestone` (verified on disk before recording).

### 2026-07-05 — L1 Logic Engine Route-Input Hardening Implementation

L1 implementation added a closed allowlist route-input boundary:
`src/logicEngine/types/routeInput.ts` and `src/logicEngine/routeInputGate.ts`.
The hardened entrypoint is `selectRouteFromRouteInputs`; it validates approved
route-input records before calling the deterministic inner `selectRoute`.
Approved route-input kinds cover contract-validated TaskFrames, verified
SignalFrames, engine-internal state, deterministic Hollow signals, accepted
gate/policy results, human/Pat approval records, snapshot/change-guard states,
and lineage-resolved decision-facing records exposing `effective_tier` only.
Required detectors reject synthetic T1 provider/model route input, raw model
output, `measurement_tier`, `subject_tier`, display/report text, unknown record
types, digest/storage/provider identity authority, model confidence, and role
artifact prose. No role rotation, UI/display, provider, egress, package,
catalog, M3 runtime, or historical Ledger behavior changed. Pre-change snapshot:
`snap_20260705T211607042Z_000338_milestone` (verified on disk before recording).
The required snapshot command appended its normal snapshot-created Ledger entry.
Focused validation: typecheck passed; L1 focused tests passed 2 files / 23 tests.
Full validation: build passed; full suite passed 166 files / 2,928 tests; V1
catalog 12; Hollowcut catalog 9. Full suite created validation snapshot
`snap_20260705T212456285Z_000339_milestone` (verified on disk before recording).

### 2026-07-05 — L1-A Route-Input Boundary Acceptance Lock

`docs/L1_ROUTE_INPUT_BOUNDARY_ACCEPTANCE_REPORT.md` and
`tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts` created to lock
the accepted L1 steering boundary. The lock pins the exact route-input allowlist,
fail-closed unknown record rejection, required L1 detector behavior through the
public gate surface, and `selectRouteFromRouteInputs` as the sole hardened
entrypoint. Lock-fires evidence uses synthetic weakening fixtures:
`future_unprotocolled_route_input` and `selectRouteFromRawModelOutput`. No L1
runtime behavior, role rotation, routing behavior, UI/display, provider, egress,
package, catalog, M3 runtime, trust-promotion, side-effect, or historical Ledger
behavior changed. Pre-change snapshot:
`snap_20260705T214419613Z_000340_milestone` (verified on disk before recording).
The required snapshot command appended its normal snapshot-created Ledger entry.
Validation: typecheck passed; focused L1-A lock test passed 1 file / 7 tests;
build passed; full suite passed 167 files / 2,935 tests; V1 catalog 12;
Hollowcut catalog 9. Full suite created validation snapshot
`snap_20260705T214857931Z_000341_milestone` (verified on disk before recording).

### 2026-07-05 — RA-C Role Artifact Consumption Boundary Contract

`docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md` created as a design-only
contract. It states that role artifacts are model outputs: raw artifacts enter
at T0, schema-valid role artifacts may reach T1 only, and role identity
promotes nothing. It reconciles the accepted R1-R6 role artifact contract layer
with M3 content-addressed storage and L1/L1-A route-input rejection rules,
defines allowed and forbidden consumption flows, names the future deterministic
extraction home pass `RA-X-DETERMINISTIC-EXTRACTION`, and records
`RA-REGISTRY-ANALYST` because the current static registry has no `analyst`
role. No `src`, `tests`, `types`, runtime behavior, role rotation, Role Router,
routing changes, UI/display, provider, egress, package, catalog, L1 allowlist,
storage implementation, validator implementation, trust promotion, or historical
Ledger behavior changed. Pre-change snapshot:
`snap_20260705T215233125Z_000342_milestone` (verified on disk before recording).
The required snapshot command appended its normal snapshot-created Ledger entry.
Validation: typecheck passed; build passed; full suite passed 167 files / 2,935
tests; V1 catalog 12; Hollowcut catalog 9. Full suite created validation
snapshot `snap_20260705T215701269Z_000343_milestone` (verified on disk before
recording).

### 2026-07-05 — L1-B Route-Input Allowlist Correction

Post-L1-A review identified that `lineage_resolved_decision_facing_record` had
been admitted before its lineage verifier existed. Blocking producer/consumer
grep found zero real producers or consumers beyond gate/type definitions and
L1/L1-A test fixtures, so the kind was withdrawn. The L1 route-input allowlist
is now seven entries: `contract_validated_task_frame`,
`verified_signal_frame`, `engine_internal_state`, `deterministic_hollow_signal`,
`accepted_gate_policy_result`, `human_pat_approval_record`, and
`snapshot_change_guard_state`. The L1-A report was amended, the lock pin was
shrunk, and `tests/acceptance/l1bAllowlistCorrection.test.ts` adds the standing
masquerade detector: `l1b masquerade fixture: decision record with unverified
role-artifact lineage is rejected`. No RA-X verifier, role rotation, provider,
egress, UI, package, catalog, historical Ledger, or other allowlist change was
made. Pre-change snapshot: `snap_20260705T222323485Z_000344_milestone`
(verified on disk before recording). Validation passed: typecheck; focused
L1/L1-A/L1-B tests 4 files / 32 tests; build; full suite 168 files / 2,937
tests; V1 catalog 12; Hollowcut catalog 9. Full suite created validation
snapshot `snap_20260705T222857309Z_000345_milestone` (verified on disk before
recording).

### 2026-07-05 — M3-T Acceptance Test Honesty Strengthening

Pat's witnessed spot-check saw the M3 acceptance surface pass; follow-up
full-text review found two vacuous assertions in
`tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts`. M3-T
replaced the unused non-promoter loop with named real-attempt or
unrepresentability tests for storage, digest presence, API success, network
success, provider identity, model agreement, report inclusion, Ledger reference,
and opt-in flags. Display deferral now checks real M3 documentation plus absence
of display/render/preview exports from `src/rawOutput/index.ts`. The golden path
remains intact and now also threads a factory-produced Ledger entry through
`resolveLineageReferences`. No `src/`, runtime, provider, egress, role rotation,
UI, package, catalog, allowlist, record-type, or historical Ledger behavior
changed. Pre-change snapshot: `snap_20260705T231325269Z_000346_milestone`
(verified on disk before recording). The M3-A lock required no source
reconciliation. Validation passed: typecheck; focused M3/M3-A tests 2 files /
21 tests; build; full suite 168 files / 2,945 tests; V1 catalog 12; Hollowcut
catalog 9. Full suite created validation snapshot
`snap_20260705T232219310Z_000347_milestone` (verified on disk before recording).

### 2026-07-05 — RA-R1 Static Rotation Runtime Protocol

RA-R1 protocol-draft pass created
`docs/protocols/PASS_PROTOCOL_RA_R1.md` and recorded the next staged path:
protocol -> diagnostic -> implementation, each gated by Pat approval. This pass
does not begin the diagnostic and does not implement role runtime or role
rotation. The protocol preserves RA-C as higher authority, keeps role artifacts
T1/advisory, requires static human-authored or fixture-authored rotation plans,
requires inert context transport with digest-only Ledger provenance, requires
handoff-gate classification during the future diagnostic, and forbids any L1
allowlist change in this stage. No `src`, `tests`, `types`, providers, egress,
package files, catalogs, UI, L1 allowlist, M3 boundary module, role runtime, role
rotation, or historical Ledger behavior changed. Pre-change snapshot:
`snap_20260705T235443061Z_000348_milestone` (verified on disk before recording).
Typecheck passed; build passed; V1 catalog 12; Hollowcut catalog 9. Standard
full-suite validation is blocked: two `npx vitest run` attempts failed on
timeout-only failures in unrelated tests under full-suite load. First attempt
timed out in `tests/acceptance/networkEgressProofAcceptance.test.ts` and
`tests/hollows/media/imageDimensionsHollow.test.ts`; focused rerun passed those
two files, 33 tests. Second attempt timed out in `tests/cli/minimalCli.test.ts`
and `tests/acceptance/networkEgressProofAcceptance.test.ts`; focused rerun
passed those two files, 29 tests. First full-suite attempt created validation
snapshot `snap_20260706T000428986Z_000349_milestone` (verified on disk before
recording). RA-R1 protocol stage remains uncommitted until full-suite validation
is resolved or Pat authorizes a different disposition.

### 2026-07-06 — Pass H7 — Implementer Environment Reverification (BLOCKED)

Grok inherited a dirty tree from Codex's unfinished RA-R1 protocol-draft pass:
`M .caleb/ledger/ledger.jsonl`, `M PLANS.md`, `M docs/STATUS_LOG.md`,
`?? docs/protocols/PASS_PROTOCOL_RA_R1.md`. Step 1 STOP branch taken for
another implementer's uncommitted work; Pat's H7 authorization received; RA-R1
commit deferred because standard full-suite validation did not pass.

**Position from the record (authoritative):** latest committed pass is M3-T at
`d281302` ("Pass M3-T acceptance test honesty strengthening"). Last accepted pass
per STATUS_LOG is M3-T (2026-07-05). RA-R1 protocol exists on disk but is NOT
committed. Codex's RA-R1 ExecPlan final report: blocked before commit (full-suite
timeouts 166/168 files, 2,943/2,945 tests on two attempts; focused reruns passed).
Roadmap documents (e.g. H3-as-upcoming) are stale relative to STATUS_LOG — H3
(H1 version-control baseline) completed 2026-07-04.

**Vitest diagnosis:** `npm ci` from lockfile (51 packages) did not repair the
failure. `node --version`: v24.11.1 (`C:\Users\Snake\Downloads\node.exe`; no
`package.json` engines field; project docs cite Node 18+). Standard command
`npx vitest run` (Vitest 4.1.8 default `forks` pool): **168/168 files failed at
collection** with `TypeError: Cannot read properties of undefined (reading
'config')` at `describe()` — `@vitest/runner` global runner never initialized in
fork-worker module context. Not a test assertion failure; runner runtime error.
`--pool=threads`: same error. `--pool=vmThreads` / `--pool=vmForks`: single-file
runs pass; full parallel vmThreads trips `ERR_INVALID_OBJECT_DEFINE_PROPERTY` on
`process.env` when H5 proxy conflicts with Vitest worker redefinition.
`--pool=vmForks --maxWorkers=1` (non-standard; diagnostic only): 165/168 files
passed, 2893/2919 tests passed, 26 failed — `guardRunner` (6) and `cliSmoke` (20)
tripped `CREDENTIAL_ENV_READ_BLOCKED_BY_H5` because `ANTHROPIC_API_KEY` is present
in the implementer shell environment and child-process env enumeration hits the
H5 credential-read trap. Locked files (`vitest.config.ts`, H5 traps, lockfile,
`package.json`) were not modified per H7 bounds.

**Step 6 sweep:** typecheck passed; build passed; V1 catalog 12; Hollowcut
catalog 9.

**RA-R1 resolution:** STOP — protocol file left uncommitted with Codex's other
draft edits; Pat must decide disposition after environment repair.

**Verdict:** H7 Implementer Environment Reverification: **BLOCKED** — standard
`npx vitest run` cannot complete in this implementer environment without locked
boundary changes; implementer is not qualified for governed passes until Pat
repairs the environment or authorizes an exception. RA-R1 diagnostic not started.
No pre-change snapshot (blocked pass; only H7 protocol + this STATUS_LOG entry
committed). `docs/protocols/PASS_PROTOCOL_H7_RAR1_DIAG.md` committed with this entry.

---

### 2026-07-06 — Pass H8 — Network Egress Proof Documentation Amendment

H8 amended `docs/NETWORK_EGRESS_PROOF.md` with a dated field-catch record from
the H7 episode: the H5 credential-read trap fired on child-process env
enumeration in guardRunner and cliSmoke paths when a real ambient
`ANTHROPIC_API_KEY` was present; remediation and empty-key verification are
cited from Pass H7 and commit `82df49c` without re-narration. Subprocess
coverage is stated precisely — proven for env-enumeration paths exercised by
those tests, not for all conceivable child-process behavior. Added the standing
no-ambient-credentials rule to `docs/01_CODEX_OPERATING_CONTRACT.md`. Protocol
file `docs/protocols/PASS_PROTOCOL_H8_RAR1D.md` committed with this pass. No
`src/`, tests, traps, config, or package changes. Pre-change snapshot:
`snap_20260706T024327264Z_000358_milestone` (verified on disk before recording).

### 2026-07-06 — Pass RA-R1 — Static Role Rotation Runtime Implementation

RA-R1 implemented `src/roleRuntime/` static rotation runtime: plan validator
(rejects `authored_by: model`), mock adapter boundary, M3
`ContentAddressedRawOutputStore` composition (no M3 edits), artifact schema
validation, executor-local `validateRoleHandoffGate`, inert digest-ordered
`context_refs`, 18-branch decision inventory, and mandatory detector suite in
`tests/acceptance/raR1StaticRotationAcceptance.test.ts`. L1 allowlist unchanged
at seven entries; `RoleHandoffGateResult` not added; no live provider path.
Pre-change snapshot: `snap_20260706T154747284Z_000362_milestone` (verified on
disk before recording). Suite at pass close: 170 files / 2,966 tests green. V1
catalog 12; Hollowcut catalog 9. Sequenced after RA-R1-D (`b627ed3`).

### 2026-07-06 — Pass RA-R1-D — Role Artifact Runtime Diagnostic

RA-R1-D created `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md` with all five
deliverables: roleHandoffGate classification (clean — structure-only, no
judgment-shaped checks; non-routing relative to L1 seven-entry allowlist),
R1–R6 contract layer survey (M3 store composes without modification: yes; T1
terms match: yes), rotation-plan schema proposal with fixture example, 18-branch
decision inventory (all structurally annotated), and open-items table. No `src/`,
`tests/`, or `types/` changes. Pre-change snapshot:
`snap_20260706T032542674Z_000360_milestone` (verified on disk before recording).
Sequenced after H8 (`5128079`).

### 2026-07-07 — Pass LE-1-D — Rotation Plan Consumption Seam Diagnostic

LE-1 diagnostic stage: committed `docs/protocols/PASS_PROTOCOL_LE1.md` and
`docs/LE1_ROTATION_PLAN_CONSUMPTION_SEAM_DIAGNOSTIC.md`. Restored mandatory
precondition record lines omitted from TRUE-2 report: **P1** V1 catalog **13** /
Hollowcut **9**; AUD-1 Auditor `hollow.audit.pass_compliance_check` in V1 via
AUD-1 Amendment A1/A2 (12→13 visible re-key). **P2** RA-R1-D handoff-gate
classification re-confirmed clean (structure-only). **P3** RA-R1 static rotation
runtime implemented at `src/roleRuntime/`; RA-R2 contract defined, not yet consumed
at Logic Engine boundary. Proposed carrier: `contract_validated_task_frame` with
plan sibling payload + `lineage_refs` linkage; seven-entry L1 allowlist unchanged.
No `src/` implementation. Pre-change snapshot:
`snap_20260707T193901342Z_000378_milestone` (verified on disk before recording).
Suite at diagnostic close: 180 files / 3,055 tests green. **STOP — Pat approval
required before LE-1 implementation.**

### 2026-07-07 — Pass LE-1 — Rotation Plan Consumption Seam (Implementation)

LE-1 implementation stage: read-only Logic Engine seam
`classifyRotationPlanAtSeam()` in `src/logicEngine/rotationPlanSeam.ts` consumes
RA-R2 `RuntimeRotationPlan` at route-selection boundary via allowlisted carrier
`contract_validated_task_frame` (`task_type: "planning"`, plan as sibling payload,
`lineage_refs` linkage). Classification enum:
`valid_rotation_plan | invalid_schema | rejected_authorship |
rejected_reference_format | unknown`. Emits deterministic
`RotationPlanRouteDecisionArtifact` (T2 verified, digests/refs only). 12-branch
decision inventory, all structurally annotated. **P1** V1 catalog **13** /
Hollowcut **9**; AUD-1 Auditor in V1 via Amendment A1/A2. **P2** RA-R1-D
handoff-gate classification **clean**. **P3** RA-R1 static rotation runtime
**implemented** at `src/roleRuntime/`; LE-1 adds read-only consumption only. L1
seven-entry allowlist unchanged. Seam not wired into routing. Pre-change snapshot:
`snap_20260707T195956421Z_000380_milestone` (verified on disk before recording).
Suite at implementation close: 182 files / 3,069 tests green. `npx tsc --noEmit`
and `npm run build`: pass. **STOP — next pass is Pat's call.**

### 2026-07-18 — Pass GOV-1 — Governance and Handoff Reconciliation

GOV-1 reconciled the inherited LE-1 validation Ledger append in standalone commit
`3261ac4`, pushed the nine previously local commits plus housekeeping, and verified
local/remote synchronization before mutation. Current authority/status documents
now record V1 catalog 13, the accepted Anthropic/xAI calls, RA-R1 implementation,
RA-R2's contract, and LE-1 read-only consumption. Historical pass reports retain
their then-current facts. The canonical typecheck is now
`node ./node_modules/typescript/bin/tsc --noEmit`, which completed with exit 0.

Post-protocol provenance debt is recorded, not backfilled: LG-1 (`4ab5b4e`), RA-R2
(`53f7e37`), AUD-1 (`97b3b8c`), AUD-1 Amendment A2 (`cea7daf`), AUD-2 (`ec8309c`),
and TRUE-2 (`3711cea`) were executed under chat-issued instruction; protocol not
committed at the time. The GOV-1 report reproduces the RA-R1-D 15-check Deliverable
1 table verbatim with file:line citations. Pre-change snapshot:
`snap_20260718T194507575Z_000386_milestone` (verified on disk). Validation: 182
files / 3,069 tests green; canonical typecheck exit 0; build exit 0; V1 catalog 13;
Hollowcut 9. The suite created validation snapshot
`snap_20260718T195549192Z_000387_milestone` (verified on disk). Final AUD-2 result
is recorded in `docs/GOV1_GOVERNANCE_RECONCILIATION.md`; commit/push/clean-tree
verification follows in the completion handoff.

### 2026-07-18 — LE-2 Pre-Stage Finding — STOP

No LE-2 snapshot or implementation was created. Under the combined protocol's
locked rejection rules, every valid RA-R2 route is unbridgeable: the
`planner_synthesizer` transition is forbidden by the current handoff registry, and
the other two route modes require unregistered Analyst. Because LE-2 also requires
a successful derived-plan determinism path, an all-rejection bridge would violate
acceptance. Resolution requires a separately authorized RA-R2 or registry amendment,
or a corrected decision envelope. Per protocol: STOP after GOV-1.

**Amendment disposition (2026-07-18):** Amendments A–C at protocol commit
`960ade1` resolved this STOP by authorizing `planner_critic` and
`planner_critic_synthesizer` success routes after Codex directly verified the
required registry transitions. The original finding remains in the record; LE-2
resumed under the amended authority.

### 2026-07-18 — Pass LE-2 — Runtime Rotation Plan Bridge

LE-2 is accepted. The new Logic
Engine bridge derives a deterministic RA-R1 plan from an authorized, human/fixture
RA-R2 plan or refuses with a structured code. Both success and rejection are
Ledger-mandatory; suppressed writes fail closed. The bridge is mock-only and has
no route-selection or execution consumer. Eight named acceptance detectors pin the
decision envelope, all rejection codes, exact mapping, determinism, prose immunity,
Ledger completeness, L1 seven, registries, and catalogs. Pre-change snapshot:
`snap_20260718T201841128Z_000388_milestone` (verified on disk).

Named deferrals: `LE1-LEDGER-1` covers LE-1's still-unwritten classification
artifact. Analyst registration and Planner→Synthesizer remain open registry design
questions; affected plans remain unbridgeable. The RA-R2/RA-R1 authorship mismatch,
live-adapter chain, capability gates, and multi-cycle
Planner→Critic→Synthesizer boundary also pass forward explicitly. `GIT-HYG-1` is
parked to investigate recurring Windows `.git` repack/multi-pack-index lock or
permission warnings. GOV-1's remote was synchronized at `93316eb`, provenance gaps
were recorded rather than backfilled, AUD-2 was clean across 19 paths, and
`git fsck --full` was run after the first repack warning.

Validation passed: focused bridge/RA-R2/LE-1 suite 5 files / 57 tests; canonical
suite 184 files / 3,094 tests; canonical typecheck exit 0; build exit 0; V1 catalog
13; Hollowcut catalog 9. Full suite created validation snapshot
`snap_20260718T203939996Z_000389_milestone` (verified on disk). AUD-2 self-smoke
against base `960ade1` was compliant/T2 across 16 paths with zero violations.
Credential variables and `VITEST_DEBUG_DUMP` were unset/empty before validation.
Final record cross-check corrected Amendment A's success-fixture wording from
human-only to the user-authorized human-or-fixture authorship; the implementation
already matched the user's authority.

`LE-2 Rotation Plan Bridge: Accepted — RA-R2 plans derive deterministically or refuse loudly; every incompatibility is now a rule; nothing runs yet.`

**Convention:** every future pass appends one dated entry here as part of its
completion report, including pre-change snapshot ID and suite counts at pass close.

### 2026-07-18 — Pass LE-3 — Guarded Execution Seam (accepted)

Protocol `fd3663c` is committed and pushed. Pre-change snapshot
`snap_20260718T205307165Z_000390_milestone` was Ledgered and verified on disk
before implementation. The new seam accepts only exact LE-2-bridged plans with a
matching successful bridge Ledger record, explicit human CLI `--confirm`,
human/fixture authorship, mock adapters, structural revalidation, and a mandatory
Ledger start write. It then composes the unchanged RA-R1 executor and M3 store.

The golden two-cycle Planner→Critic→Planner→Critic path, JSONL-only chain
reconstruction, all refusal codes, the four named detectors, and failing-Critic
halt are implemented. Initial focused validation passed 3 files / 26 tests.
`LE1-LEDGER-1` remains named-deferred because adding async write/failure semantics
to LE-1's synchronous pure classifier is not a cheap reuse. The widened matrix
passed 8 files / 100 tests; canonical typecheck and build exited 0; AUD-2
self-smoke was compliant/T2 across 14 paths.

LE-3 did not clear the required canonical-suite gate. Three completed unmodified
runs passed 3,116/3,120, 3,119/3,120, and 3,112/3,120 tests respectively; all
failures were 5-second timeouts in unchanged tests and no LE-3 assertion failed.
A serial five-file diagnostic passed 47/48 and reproduced only the AUD-2 CLI
timeout. The protocol does not authorize widening Vitest/config or those existing
tests. LE-3 is implemented but not accepted. Its verified implementation is
committed for repository safety with acceptance explicitly pending the separately
authorized TIME-1 micro-pass. LE-3-A has not started (no snapshot, report, lock
test, or verdict).

TIME-1 subsequently cleared the canonical gate without changing any LE-3
assertion or the global Vitest config. The clean rerun passed 187/187 files and
3,120/3,120 tests, exit 0, in 317.41 seconds. LE-3 Guarded Execution Seam:
Accepted — Caleb rotates: bridged plans only, human-initiated, every step ledgered,
the chain reconstructs from the record alone. LE-3-A remains not yet started at
this record point.

### 2026-07-18 — Pass TIME-1 — Process-Spawn Timeout Budgets (accepted)

LE-3 implementation commit `56544f4` is pushed and synchronized. TIME-1 snapshot
`snap_20260718T220634787Z_000396_milestone` is Ledgered and verified. Six candidate
tests passed serially with unchanged assertions under a command-line-only
diagnostic ceiling. Five are eligible process-spawning tests; their measured
durations were 10,974 ms, 8,225 ms, 727 ms, 1,093 ms, and 6,092 ms. The measured
4,276 ms snapshot CLI test was excluded because it is in-process.

TIME-1 initially added a 30-second per-test argument to those five eligible tests.
A complete affected-file run exposed one additional process-spawning AUD-2 test;
it passed unchanged at 3,388 ms under the diagnostic ceiling after a 5,735 ms
contended timeout, so it receives the same measured budget. A
measurement record plus normalization-hash verifier pins zero assertion changes,
the unchanged global Vitest config, passing pre-adjustment status, measured
durations, and process-spawn call-chain evidence. Canonical validation is pending.

The first canonical rerun passed 3,119/3,120. Its sole failure was the in-process
snapshot CLI test at 5,078 ms. Pat authorized it as the seventh TIME-1 test,
identified post-pass by canonical re-run. Its unchanged assertion passed alone at
1,435 ms before adjustment; it receives the same explicit 30-second class and is
covered by the timeout-only hash guard. `vitest.config.ts` remains untouched.

TIME-1 accepted. The integrity guard reports seven adjusted tests, global config
unchanged, and assertion changes zero. Typecheck/build exited 0; catalogs are
13/9; AUD-2 is compliant/T2 across 12 paths with zero violations. A subsequent
pathological canonical attempt produced 15 timeout-only failures across six files
in 731.53 seconds; because it included existing 20–30 second budgets and unrelated
in-process tests, no scope was widened from that sample. A clean unmodified rerun
then passed 187/187 files and 3,120/3,120 tests in 317.41 seconds, exit 0.

### 2026-07-19 — Pass LE-3-A — Execution Boundary Acceptance Lock (accepted)

Pre-change snapshot `snap_20260719T000403360Z_000404_milestone` is Ledgered and
verified on disk. LE-3-A is docs/test-only: the combined report carries the exact
LE-3/LE-3-A verdicts, four detector names, absence clause, validation evidence,
and the RA-R1-D 15-row Deliverable 1 table verbatim. The lock pins bridged-only,
human-CLI-only, mandatory-Ledger, mock-only execution and demonstrates an in-memory
synthetic weakening fires without writing it.

The focused lock passed 1 file / 7 tests. Canonical typecheck and build exited 0;
catalogs remain 13/9; AUD-2 self-smoke was compliant/T2 across 6 paths with zero
violations. Two aggregate diagnostics exposed host-contention failures at
3,124/3,127 and 3,125/3,127; every affected file passed serially and no scope was
widened. The clean canonical run passed 188/188 files and 3,127/3,127 tests, exit
0, in 125.69 seconds. The aggregate runs created verified, Ledgered validation
snapshots `snap_20260719T001810822Z_000405_milestone`,
`snap_20260719T002757874Z_000406_milestone`, and
`snap_20260719T003746643Z_000407_milestone`; the last belongs to the accepted
canonical run.

LE-3-A Execution Boundary Lock: Accepted — the first rotation's guardrails are now
a protected surface. The combined report carries the required 15-row table, so
the oldest open report debt is discharged.

### 2026-07-19 — Pass LIVE-R1 — Live Rotation Gate Chain (accepted)

Protocol `b090c26` and Amendment A `98521ec` are pushed. Pre-change snapshot
`snap_20260719T023049028Z_000408_milestone` is Ledgered and verified. LIVE-R1
visibly amends LE-2 Envelope 8: live bindings derive only with closed evidence;
the evidence-free `bridge_rejected_live_adapter_unavailable` wall remains.

Optional normalized-output observers now bind adapter digests independently to
M3 content addresses. Observer, digest, response-size, timeout, token,
invocation, and spend failures halt fail-closed. Results, failures, CLI output,
and Ledger records contain digests/telemetry but not output prose. Grok
`reasoning_content` remains excluded. Existing Anthropic/Grok adapter test files
were unchanged; extracted transport request diffs were empty; egress remains two
sites. No live call occurred.

Focused LIVE-R1 validation passed 4 files / 16 tests. Canonical typecheck and
build exited 0. The offline canonical suite passed 191/191 files and
3,135/3,135 tests, exit 0. Catalogs remain 13/9. AUD-2 self-smoke was
compliant/T2 across 28 changed paths with zero violations. L1 remains the exact
seven-entry allowlist.

LIVE-R1 Live Rotation Gate Chain: Accepted — live bindings are bridgeable with
evidence and refused without it; budgets bind; nothing is ambient. LIVE-R2 waits
on Pat's fresh explicit words.

### 2026-07-19 — LIVE-R2 Event E1 — stopped at Planner provider failure

Pat freshly authorized E1 only. Clean/synced preflight at `e1c64ac`; snapshot
`snap_20260719T041007671Z_000414_milestone` Ledgered and verified. The committed
E1 fixture bridged with complete live evidence. The Planner provider invocation
returned no valid response; the seam halted at step 0 with
`live_provider_invocation_failed`. Critic was not called. Tokens and spend were
zero. No prompt, model, budget, or code changed and no retry occurred.

Ledger-only reconstruction succeeded for the failed chain using bridge
`bridge_99b4eefc-c6b4-4742-a1a8-8cd0a05e857c`, start
`rotation_3dc74e51-7035-4904-bb21-3ab9a7f5c8dc`, and terminal
`rotation_0617e657-1fb3-40e1-b5f2-33285f461534`. The record cannot diagnose the
adapter's safe provider failure subclass because the runtime collapses it. The
generic `API_KEY` also pre-existed in the inherited environment; the invocation
shell verified it unset afterward, but new subprocesses inherit it again from the
desktop parent. Both are recorded as findings.

Post-event offline canonical validation passed 191/191 files and 3,135/3,135
tests; typecheck and build exited 0. AUD-2 self-smoke was compliant/T2 across 5
changed paths with zero violations. LIVE-R2 is not completed. E2 and any retry
remain unauthorized pending Pat's next decision.

### 2026-07-19 — LIVE-F1 — failure taxonomy and credential-tree repair

Protocol `fb367b7` is committed/pushed. Snapshot
`snap_20260719T042829716Z_000416_milestone` is Ledgered and verified. LIVE-F1
preserves the adapter's structured `failure_kind`, result status, and retryability
in the seam's terminal live-invocation telemetry while retaining the generic
`live_provider_invocation_failed` halt. Synthetic auth, network, and rate-limit
failures preserve exact taxonomy, halt before Critic, and serialize no injected
provider prose. Thrown invokers leave taxonomy null.

The operating contract now requires provider credentials to exist only in a
one-command leaf shell. An independent sibling from the same parent must prove
credential-name absence before injection; a sibling-visible credential is a STOP
even when declared. Leaf cleanup is separately verified after the call.

Focused LIVE-F1 validation passed 2/2 files and 7/7 tests. The canonical offline
suite passed 193/193 files and 3,142/3,142 tests; canonical typecheck and build
exited 0. Provider/CLI and prompt/fixture diffs are empty. No live call or retry
occurred. AUD-2 self-smoke was compliant/T2 across 10 changed paths with zero
violations.

### 2026-07-19 — LIVE-R2 E1 retry — network failure, no continuation

Pat freshly authorized one E1 retry under LIVE-F1. The independent sibling gate
proved zero credential-shaped variables before injection. A separate leaf shell
introduced the Anthropic credential only for the command and reported
`LEAF_CREDENTIAL_UNSET_AFTER=True`; a post-event sibling again reported zero.
Snapshot `snap_20260719T053346308Z_000418_milestone` is Ledgered and verified.

Bridge `bridge_ca29eb4b-0b00-475c-a971-04dcf9e0c2f3` completed. Planner halted at
step 0 with orchestration code `live_provider_invocation_failed` and LIVE-F1
taxonomy `network_failure` / `failed` / `retryable:true`. Tokens and spend were
zero; Critic was not invoked; no prompt, transport, or code changed; no further
network call occurred.

Raw parent references reconstruct the retry chain, but the public reconstruction
helper mixed the first attempt's start with the retry terminal because both share
the deterministic plan ID. It returned a false-positive `ok:true`; attempt-safe
reconstruction is a named repair candidate and was not fixed here. Post-event
offline suite passed 193 files / 3,142 tests; typecheck and build exited 0. E2 and
all further retries remain unauthorized. AUD-2 self-smoke was compliant/T2
across 5 changed paths with zero violations.

### 2026-07-19 — LIVE-F2 — execution-instance Ledger identity repair

Protocol `6a61d90` is committed/pushed. Pre-change snapshot
`snap_20260719T062326038Z_000420_milestone` is Ledgered and verified. Every
guarded rotation attempt now mints one central post-H4 `execution_<uuid>` at seam
entry and carries it in the result and provenance of every attempt Ledger record.
`plan_id` identifies what; `execution_id` identifies which attempt.

Reconstruction selects identity before record type. Explicit lookup cannot span
identities; plan-only lookup with multiple attempts returns the distinct
`reconstruction_ambiguous` refusal. A permanent E1-shaped fixture proves the old
first-start/last-terminal false-ok and the new refusal. The original E1 Ledger
records now also return ambiguous. One complete legacy chain remains readable;
mixed legacy/identified records fail closed.

LE-3-A remains accepted with explicit execution-keyed reconstruction. The
operating contract now requires the human to execute live events from a host
shell while agents build and validate offline, citing the E1 credential-tree and
sandbox/network findings. Focused validation passed 6 files / 59 tests; the
widened LIVE-R1/F1 matrix passed 9 / 69; canonical offline validation passed
195 files / 3,157 tests in 92.77 seconds. Typecheck/build exited 0; catalogs are
13/9. AUD-2 was compliant/T2 across 19 paths with zero violations. No live call
or provider/CLI/transport/prompt/config change occurred.

### 2026-07-19 — LIVE-F4 — runtime artifact authority repair

Protocol and the preserved third E1 attempt records are committed/pushed at
`4158061`. Pre-change snapshot
`snap_20260719T140753751Z_000424_milestone` is Ledgered and verified. LIVE-F4
makes the model/provider boundary accept only a closed, recursively bounded
semantic payload. Caleb now constructs schema/version, UUID artifact identity,
role/type, task/run/trace/context identity, route-derived next role, time, and
trace/context references, then passes the unchanged strict RoleArtifact validator
and an exact invocation-identity gate.

Normalized semantic bytes remain T0 M3 evidence. The canonical runtime-built
artifact has its own digest, and its invocation Ledger provenance records
`derived_from` with the raw digest. JSONL reconstruction preserves the link and a
separate M3 digest-lineage gate walks it without weakening the existing ledger-ID
lineage resolver.

`LiveAdapterFailure` now has a closed additive response-telemetry block. An
HTTP-success observer rejection retains provider response ID, digest, token usage,
timing, and estimated spend; zero fallback telemetry is reserved for calls with
no response metadata. Four code/path-only diagnostic stages are locked:
`json_parse`, `payload_validation`, `envelope_validation`, and
`identity_mismatch`. A permanent attempt-three envelope-shaped fixture is refused
at the payload gate without inventing the unrecoverable historical prose.

Focused validation passed 8 files / 88 tests; widened regressions passed 14 / 134;
canonical offline validation passed 197 files / 3,173 tests in 110.72 seconds.
Typecheck/build exited 0; catalogs remain 13/9; AUD-2 is compliant/T2. Anthropic
and xAI transport-function hashes are byte-identical to `4158061`, egress remains
two sites, and protected diffs are empty. Validation snapshot
`snap_20260719T142922696Z_000426_milestone` is Ledgered and verified. No live call
or E1 retry occurred.

LIVE-F4 Runtime Artifact Authority: Accepted — models supply bounded semantic
content; Caleb owns identity, route, time, and reconstructable provenance; a
billable observer failure can no longer masquerade as zero telemetry. STOP.

### 2026-07-19 — LIVE-F5 — truncation evidence preservation

Attempt four reached Anthropic, used 291 input and exactly 512 output tokens,
spent USD 0.002851, and halted before Critic as `json_parse`. Its Ledger output
digest survived, but `observed_store_digest` is null and metadata-only checks
confirmed the T0 content/record objects are absent. The unrecoverable bytes were
not read, printed, invented, or backfilled. Protocol/evidence commit `c2bc73d` is
pushed. Pre-change snapshot
`snap_20260719T150613825Z_000429_milestone` is Ledgered and verified.

LIVE-F5 passes adapter-computed digest, finish reason, and output-token count as
safe observer metadata. Bounded normalized bytes now enter M3 as T0 before
content validation; store and adapter digests must match. `max_tokens` reason or
token-count equality produces `live_observer_output_truncated` with stage
`output_truncated` before JSON parse. Failure telemetry and the terminal Ledger
retain the observed digest/raw-output reference while output prose stays absent.

E1 Planner/Critic budgets are 1,536 each, run tokens are 8,192, and spend stays
USD 0.05. E2, prompts, models, route, transport, credentials, and strict
validators are unchanged. Focused validation passed 5 files / 15 tests; widened
regressions passed 11 / 115; canonical passed 198 files / 3,176 tests in 95.44
seconds. Typecheck/build exited 0; catalogs remain 13/9; AUD-2 is compliant/T2.
Transport hashes are byte-identical to `c2bc73d`, egress remains two sites, and
protected diffs are empty. Validation snapshot
`snap_20260719T151925913Z_000431_milestone` is Ledgered and verified. No live call
occurred.

LIVE-F5 Truncation Evidence Preservation: Accepted — budget truncation is
identified before parsing, diagnosable failures retain their T0 witness, and E1
has enough bounded output room without moving the spend ceiling. STOP.

### 2026-07-19 — LIVE-F6 — exact wrapper normalization

Attempt five stored digest-bound T0 evidence and halted before Critic at
`json_parse`. The authorized structural diagnostic proved the full response was
one strict semantic JSON object inside one exact Markdown `json` fence; no
preamble, trailing prose, truncation, or semantic validation defect existed.

LIVE-F6 adds one pure allowlisted presentation transform after T0 storage,
digest binding, and F5 truncation detection. It unwraps only an exact complete
fence whose entire inner document already parses as one JSON object. Applied
success/later-failure telemetry names `markdown_fence_unwrapped`; raw fenced T0
remains authoritative and canonical artifacts remain linked by `derived_from`.

The Planner template is hardened from
`sha256:8407f826668198c871da24fa9db9323c588aa6805d392d317fef6be090884697`
to `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`
in both E1 and E2. Critic remains
`sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`.
The operating contract records Fable's speculative-normalization forbidden list
verbatim. Four named near-miss fixtures bind every unwrap condition.

Focused validation passed 15 files / 119 tests; canonical offline validation
passed 200 files / 3,199 tests in 100.89 seconds. Governed typecheck/build exited
0 and catalogs remain 13/9. AUD-2 is compliant/T2 across 19 paths with zero
violations. Validation snapshot `snap_20260719T162427243Z_000435_milestone` is
Ledgered and verified. No live call or transport/credential/model/route/budget
change occurred.

LIVE-F6 Exact Wrapper Normalization: Accepted — one exact evidenced presentation
wrapper may pass without speculative recovery; raw T0, strict validation, and
reconstructable applied-stage provenance remain intact. STOP.

### 2026-07-19 — LIVE-F7 — handoff consumption matrix and refusal evidence

Attempt six reached a valid F4 Planner artifact twice and halted before Critic
because legacy check 11 allowed `needs_revision` only toward Recovery or the
Human Operator. LIVE-F7 replaces that branch with a closed 33-transition
consumption matrix. Planner -> Critic now consumes `accepted` or
`needs_revision` strictly as T1 context; all legacy accepted, recovery, and
human allowances remain explicit; `blocked`, `rejected`, undeclared
transitions, and unlisted statuses remain default-deny.

Gate refusal now appends `gate_evaluation_refused` before returning. Its
execution-keyed Ledger shape retains every refused classified check, canonical
artifact digest/ID, and raw T0 `derived_from` lineage without payload prose or
gate free-text. Reconstruction returns the failed step from JSONL alone and
continues to refuse multi-attempt ambiguity. A terminal-write throw detector
proves the gate evidence survives later failure.

Focused validation passed 5 files / 73 tests; canonical validation passed 201
files / 3,210 tests. Governed typecheck/build exited 0; catalogs remain 13/9;
prompt digests and the seven-entry L1 allowlist are unchanged. AUD-2 is
compliant/T2 across 12 paths with zero violations. No live call, credential,
provider, transport, prompt, normalization, or route change occurred.

LIVE-F7 Handoff Gate Modernization and Refusal Evidence: Accepted offline — the
gate now follows RA-C consumption doctrine and cannot lose its refusal witness.
E1 attempt seven remains separately authorized. STOP.

### 2026-07-19 — LIVE-F8 — Section 9 STOP at thrown adapter boundary

LIVE-F8 passed its exact 201-file / 3,210-test baseline, typecheck/build, 13/9
catalog, prompt-hash, credential-absence, Git, and PRE-7 runbook preconditions.
Protocol authority was committed at `90eadb6`; pre-change snapshot
`snap_20260720T001213891Z_000443_milestone` captured 18 files and was Ledgered.

Before source mutation, the complete executor/seam trace found a distinct
evidence-losing path beyond the diagnosed returned adapter failure. A rejected
or thrown `adapter.invoke()` bypasses the `ok: false` branch because the executor
has no catch boundary; the seam likewise never reaches live-state capture or
terminal construction. This loses the attempt boundary, not only the failed-step
record, and is a candidate sixth telemetry-collapse citation.

LIVE-F8 stopped under Section 9 for Pat's disposition. No source, test, prompt,
fixture, gate, matrix, L1, LE-3, provider, transport, or historical Ledger line
changed. PRE-7 and E1 attempt seven remain blocked.

### 2026-07-19 — LIVE-F8 Amendment A1 — adapter failure evidence accepted

Pat authorized the executor exception boundary without a seam catch-all. Every
adapter-returned failure now appends bounded `role_invocation_failed` evidence
before executor exit. Adapter-originated throws enter the same path with fixed
stage `invocation_exception`, null taxonomy, and constructor identifier only;
message, stack, payload, and inferred attribution never enter Ledger shapes.

Execution-keyed reconstruction now reads the sibling record from JSONL alone,
including role/step identity, safe stage/taxonomy/usage/stop/budget fields, T0
digest, normalization stage, and lineage. Historical absent evidence stays
`failed_step: null`; F7 gate evidence is unchanged; successful reconstruction is
byte-identical to the 3,779-byte pre-F8 oracle.

T1-T10 pass. Focused validation passed 5 files / 36 tests; canonical passed 202
files / 3,220 tests; governed typecheck/build exited 0. V1/Hollowcut remain 13/9;
prompt hashes, L1, gate matrix/checks, LE-3 bridge, normalization, providers,
transport, and live fixtures are untouched. AUD-2 is compliant/T2 across 17
paths with zero violations. Validation snapshot
`snap_20260720T003952059Z_000446_milestone` is Ledgered and verified.

LIVE-F8 Adapter Failure Evidence: Accepted offline — telemetry-collapse
citations five and six are closed. PRE-7 may restart from Section 2; attempt
seven remains unauthorized pending PRE-7 acceptance and fresh Pat authority.

### 2026-07-19 — PRE-7 restart — full mock rotation accepted

PRE-7 restarted from Section 2 against synchronized post-F8 commit `6ac5bfe`.
The starting suite passed 202 files / 3,220 tests; typecheck/build exited 0;
catalogs were 13/9; prompt hashes, L1, credential absence, and runbook canon all
matched their pins. Restart snapshot
`snap_20260720T032512227Z_000448_milestone` was created before implementation.

The new permanent rehearsal drives the production E1 bridge and execution path
with Anthropic fetch injected offline. Both Planner `needs_revision` and
`accepted` pass the modernized gate and execute Critic at step 1. Both
two-artifact lineages, successful terminals, and unique execution-keyed chains
reconstruct from test-scoped JSONL bytes alone. A step-1 Critic truncation now
retains T0, emits LIVE-F8 failure evidence, and reconstructs with full bounded
detail. Non-vacuous detectors prove no model trust promotion and zero real
egress.

Focused validation passed 1 file / 4 tests; canonical passed 203 files / 3,224
tests; governed typecheck/build exited 0. V1/Hollowcut remain 13/9; prompts, L1,
gate/matrix/checks, bridge, normalization, providers/transport, live fixtures,
and config are untouched. AUD-2 is compliant/T2 across 10 paths with zero
violations. Ledger changes are three append-only snapshot records.

PRE-7 Full-Rotation Rehearsal: Accepted offline — step index 1 executes through
the real path under mock, and a second-step failure is fully reconstructable.
Attempt seven remains unauthorized pending fresh Pat event authority and host-
shell execution under the committed runbook.

### 2026-07-19 — LIVE-F9 — Critic bounds and Ledger byte integrity accepted

LIVE-F9 raises only E1 Critic `max_tokens` from 1,536 to 2,048. Planner remains
at 1,536; run ceilings remain 2 invocations / 8,192 tokens / $0.05. The Critic
prompt now requires exact JSON boundaries, all ten semantic fields, explicit
cardinality limits, and 160/200-character field bounds. Its new digest is
`sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f`;
Planner remains `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`.

The observer was already fixture-driven. The live-evidence ceiling is now role-
specific so Critic accepts 2,048 while Planner still refuses 1,537. PRE-7's
negative rehearsal derives its equality boundary from the resolved budget.
`.gitattributes` resolves `.caleb/ledger/**` as `-text`, closing Git EOL rewrite
exposure without establishing a broader repository policy.

T1-T6 pass; focused validation passed 6 files / 37 tests. Canonical validation
passed 204 files / 3,230 tests after a serial masking guard proved one initial
H5 timeout was contention-only (1/1 in 95 ms); no timeout/assertion changed.
Typecheck/build exited 0; catalogs remain 13/9; AUD-2 is compliant/T2 across 16
paths with zero violations. L1, matrix/checks, bridge, Planner prompt, validator,
normalizer, F8 evidence, transports, and providers are unchanged. Validation
snapshot `snap_20260720T045723805Z_000454_milestone` is Ledgered.

LIVE-F9 is accepted offline. Attempt eight remains unauthorized pending Pat's
fresh event-specific words and host-shell execution under the runbook.

### 2026-07-20 — AUTH-2 — live-event authorization register accepted

AUTH-2 searched committed files and history before mutation. Neither Pat's A7
sentence nor the relayed A8 sentence was present in any committed file, so both
entries are honestly labeled post-run retroactive. A1-A6 preserve Pat's exact
pre-run conversation words. All eight entries carry the prescribed seven fields,
evidence commit, and terminal outcome in the new append-only register.

The operating runbook now requires Pat's event-specific words to be appended to
the register before execution; `human_confirmed` alone is explicitly
insufficient. No other runbook step changed. The permanent detector parses the
field shape, matches labeled Ledger evidence commits A6-A8 to their registered
hashes, and catches an in-memory missing-A8 violation.

Focused validation passed 1 file / 1 test; canonical passed 205 files / 3,231
tests; governed typecheck/build exited 0. Catalogs remain 13/9; prompt digests
are unchanged; L1 is untouched; AUD-2 is compliant/T2 across 8 paths with zero
violations. No source, live call, credential, fixture, or historical Ledger byte
changed. Validation snapshot `snap_20260720T150350612Z_000457_milestone` is an
append-only record.

AUTH-2 is accepted. E2 remains unauthorized pending Pat's separate words and
will be the first event registered under the pre-execution rule.

### 2026-07-20 — SEAT-E2-PREP — seat doctrine + E2 readiness (Grok seat calibration)

First Grok Build TUI implementer-seat pass after SEAT-ONBOARD-1. Codified
implementer seat binding and the honest-deviations rule into the operating
contract; created append-only `docs/IMPLEMENTER_SEAT_RECORD.md` (Codex seat-physics
correction + Grok tenure + doctrine); raised E2 Critic `max_tokens` from residual
512 to 2,048 for Critic parity with E1 (E2 Planner remains 512 per D4); added
two-key cross-family credential lifecycle with quote-free sibling-check form;
locked T1–T5 detectors. Role ceilings already govern by role (Critic 2048 /
Planner 1536) — no runtime plumbing change. Prompts/L1/src runtime untouched.
E2 itself remains unauthorized.

Prechange snapshot `snap_20260720T154224647Z_000459_milestone`. Validation
snapshot `snap_20260720T154832305Z_000461_milestone`. Canonical suite 206 files /
3,236 tests exit 0; typecheck/build 0; catalogs 13/9; AUD-2 compliant/T2 across
11 paths with zero violations. Full report: `docs/SEAT_E2_PREP_REPORT.md`.

### 2026-07-20 — SEAT-E2-PREP-A1 — E2 Planner budget parity

Amendment A1 (Pat-authorized): E2 fixture Planner `max_tokens` 512 → 1,536 only
(matches F5/E1; three live Planner outputs exceeded 512). T2 amended to pin
E2 Planner 1,536 / Critic 2,048 with E1 unchanged; T3 still refuses 1,537/2,049
on the E2 path. Exactly one fixture value changed. Prompts/L1/src untouched.
Prechange `snap_20260720T155219984Z_000462_milestone`. Report amendment in
`docs/SEAT_E2_PREP_REPORT.md`.
