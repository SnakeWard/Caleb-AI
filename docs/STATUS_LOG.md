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

### 2026-07-18 — Pass LE-3 — Guarded Execution Seam (acceptance pending TIME-1)

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

### 2026-07-18 — Pass TIME-1 — Process-Spawn Timeout Budgets (in progress)

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
