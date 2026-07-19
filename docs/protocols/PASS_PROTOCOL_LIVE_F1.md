# Caleb AI — Pass Protocol LIVE-F1

**Authorized by:** Pat, 2026-07-19
**Origin:** LIVE-R2 E1 failed at the Planner provider boundary and exposed two
record-quality gaps. This pass repairs those gaps only. It does not authorize a
retry or another live event.

## Purpose

1. Preserve the provider adapter's safe structured failure taxonomy through the
   live Role Runtime adapter into the LE-3 seam's Ledgered terminal failure
   telemetry. The generic rotation halt code may remain, but the record must
   retain the exact adapter `failure_kind`, result status, and retryability.
2. Amend `docs/01_CODEX_OPERATING_CONTRACT.md` with the credential-tree doctrine:
   credentials exist only in a one-command leaf shell; the parent and sibling
   implementer processes remain credential-free; an independent sibling-process
   pre-run check must prove absence before any live network attempt.

## Binding envelope

- Provider failure prose, raw bodies, credential values, headers, and provider
  error messages remain excluded from runtime results and Ledger records.
- Synthetic offline detectors exercise multiple provider failure classes and
  prove exact taxonomy preservation, fail-closed halt, no later role, and
  serialization redaction.
- A doctrine lock proves leaf-shell scope, sibling-process verification, STOP on
  inherited credentials, no-value logging, and cleanup semantics are stated.
- No retries, prompt changes, model changes, transport edits, endpoint/header/
  credential-closure changes, live calls, budget changes, CLI behavior changes,
  route/registry changes, or E2 work.
- Existing `live_provider_invocation_failed` remains a valid orchestration-level
  failure code. LIVE-F1 adds evidence; it does not reinterpret the event.

## Expected files

- Modify `src/logicEngine/liveRotationRuntimeAdapter.ts` and
  `src/logicEngine/rotationExecutionSeam.ts` only for taxonomy plumbing.
- Modify `docs/01_CODEX_OPERATING_CONTRACT.md` only for credential-tree doctrine.
- Add focused logic/acceptance detectors and a LIVE-F1 report/audit manifest.
- Update `PLANS.md`, `docs/STATUS_LOG.md`, and the append-only snapshot Ledger.

## Validation and stop

Snapshot before implementation. Run focused detectors, canonical offline suite,
canonical typecheck, build, AUD-2, and transport/source absence checks. Commit and
push on a clean synchronized tree, then STOP. No live provider invocation is
authorized by LIVE-F1.
