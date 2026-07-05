# M3 Raw Output Consumption Boundary Implementation

Status: Implemented - pending validation in this pass
Date: 2026-07-05
Protocol: `docs/protocols/PASS_PROTOCOL_M3.md`
Diagnostic: `docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_DIAGNOSTIC.md`
Pre-change snapshot: `snap_20260705T174603371Z_000329_milestone` (verified on disk before recording)

## Summary

M3 implements the M3-C Raw Output Boundary Contract for consumption flow only.

Model output may enter Caleb.

Model output may not govern Caleb.

M3 remains CLI/test-only. Display flow is deferred to `M4-DISPLAY-BOUNDARY` or another Pat-approved display-boundary pass.

## Implemented Boundary

- Raw provider/model output enters as T0.
- Schema-valid provider/model output may become T1 only.
- Provider/model output remains capped at T1.
- Raw content is stored by sha256 digest/ref in the authority-path artifact store.
- Ledger records stay digest/ref-only for raw/model/provider content.
- Character Count Hollow can consume stored/ref-addressed content through the M3 boundary wrapper.
- Derived evidence carries `measurement_tier`, `subject_tier`, and `effective_tier`.
- Decision-facing evidence exposes `effective_tier` only.

## Artifact Store

Authority path:

- `.caleb/artifacts/` content-addressed store
- `.gitignore` guardrail added before raw-content writes
- retrieval re-verifies sha256 digest
- corrupted content returns structured `integrity_failure`
- authorized deletion returns structured `content_deleted`
- deletion removes content only, never Ledger records

Fast path:

- in-memory raw-output store for unit tests and synthetic fixtures only

## Structural Split

Provenance-facing records carry:

- `measurement_tier`
- `subject_tier`
- `effective_tier`

Decision-facing records expose:

- `effective_tier`

Misuse detectors reject decision attempts that consume `measurement_tier` or `subject_tier`.

## Golden Path

The acceptance test proves:

1. live-call-shaped provider/model output enters as T0
2. schema-valid output becomes T1 only
3. raw content is stored by sha256 digest/ref
4. the Ledger-shaped source record contains digest/ref metadata only
5. Character Count Hollow consumes the stored/ref-addressed content
6. derived evidence carries `measurement_tier = T2`, `subject_tier = T1`, `effective_tier = T1`
7. `effective_tier` is computed as `min(measurement_tier, subject_tier)`
8. downstream consumption uses `effective_tier` only
9. the Character Count measurement does not promote provider/model content above T1

## NEVER-Flow Coverage

M3 includes absence detectors for attempts to route model/provider output into:

- persistence as truth
- side-effect triggers
- trust-promotion inputs
- Logic Engine routing decisions

## Non-Promoters

The implementation keeps these as non-promoters:

- storage
- digest presence
- API success
- network success
- provider identity
- model agreement
- report inclusion
- Ledger reference
- opt-in flags

## Not Implemented

M3 does not implement:

- role rotation
- display UI
- 3D Thinking Mode
- 2D inspector
- new providers or adapters
- egress expansion
- live execution changes
- provider adapter changes
- catalog changes
- package dependencies
- trust promotion above T1 for model/provider output

## Validation Targets

Required pass validation:

- `npx tsc --noEmit`
- `npm run build`
- focused raw-output tests
- M3 acceptance test
- `npx vitest run`
- V1 catalog count exactly 12
- Hollowcut catalog count exactly 9

## Verdict

M3 Raw Output Consumption Boundary Implementation: implemented for validation.
