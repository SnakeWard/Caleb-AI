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

---

**Convention:** every future pass appends one dated entry here as part of its
completion report, including pre-change snapshot ID and suite counts at pass close.
