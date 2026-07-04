# Hollowcut Project Implementation Plan

## Implementation Status

Pass 22 implemented the first narrow runtime layer: Hollowcut project TypeScript types and a pure local validator. Pass 23 adds explicit read-only CLI inspection for project JSON files and additional invalid fixtures. Pass 24 creates timeline schema contracts, a timeline validation Hollow plan, a timeline safety policy, and static timeline example fixtures. Pass 25 creates timeline validation types and pure shared helpers. Pass 26 implements the first timeline Hollow, `hollow.timeline.schema_check`, as supplied-state schema validation only. Pass 27 implements duration consistency, asset reference, and track reference timeline Hollows.

No Hollowcut UI, studio launch page, project or timeline save/repair/mutation, timeline CLI command, timeline/caption/export Hollow runtime, FFmpeg/export, media conversion, shell, network, dependency additions, Orchestration Core, Role Rotation, Model API Layer, or 3D UI runtime exists.

## Recommended Pass Sequence

- Pass 22 — Hollowcut Project Format Types and Validator. Implemented as types plus pure local validation only.
- Pass 23 — Hollowcut Project Fixtures and CLI Inspect Command. Implemented as read-only CLI validation only.
- Pass 24 — Timeline Schema Contracts. Implemented as planning docs and static fixtures only.
- Pass 25 — Timeline Validation Types and Shared Helpers. Implemented as pure helper foundation only.
- Pass 26 — Timeline Schema Check Hollow. Implemented as supplied-state schema validation only.
- Pass 27 — Timeline Duration and Reference Hollows. Implemented as supplied-state validation only.
- Pass 28 — Timeline Overlap Check Hollow.
- Pass 29 — Hollowcut Launch Page / Separate Studio Window.
- Pass 30 — Hollowcut Validation Panel.
- Later — Approval-Gated Export Pipeline.

## First Runtime Strategy

Started with:

- TypeScript project types.
- local validator only.
- static fixtures.
- no UI.
- no export.
- no FFmpeg.
- no media conversion.
- no broad scanning.
- no model calls.

## Future Folder Shape

Planning only:

```text
src/hollowcut/
  project/
    hollowcutProjectTypes.ts
    hollowcutProjectValidation.ts
    hollowcutProjectFixtures.ts
    index.ts

tests/hollowcut/project/
  hollowcutProjectValidation.test.ts
  hollowcutProjectFixtures.test.ts
```

## Contract-to-Code Mapping

| Contract | Future code target |
|---|---|
| project schema | TypeScript types |
| asset contract | asset validator |
| timeline contract | future timeline validators |
| caption contract | future caption validators |
| export target contract | future export readiness validator |

## Required Boundaries For First Runtime Pass

- [ ] no UI.
- [ ] no FFmpeg.
- [ ] no export.
- [ ] no media conversion.
- [ ] no shell.
- [ ] no network.
- [ ] no dependencies.
- [ ] no Orchestration Core.
- [ ] no Role Rotation.
- [ ] no Model API Layer.
- [ ] no 3D runtime.
- [ ] no project mutation.
- [ ] validation only.

## Acceptance Criteria For First Runtime Project Pass

- [x] types compile.
- [x] validator accepts minimal fixture.
- [x] validator rejects malformed project.
- [x] asset paths checked through media path safety.
- [x] `metadata_hint` remains untrusted.
- [x] ledger refs are checked as refs only.
- [x] no trusted evidence invented.
- [x] tests pass.
- [x] acceptance tests confirm Hollowcut runtime remains limited to project types/validator only.

## Next Recommended Pass

Pass 28 — Timeline Overlap Check Hollow.

## Final Implementation Statement

Hollowcut project runtime implementation may begin only after this contract and implementation plan are accepted.
