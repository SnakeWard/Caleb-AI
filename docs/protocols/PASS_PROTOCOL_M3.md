# Caleb AI - Pass Protocol M3

## 1. Pass name

M3 — Raw Output Consumption Boundary Implementation

## 2. Purpose

M3 implements the M3-C Raw Output Boundary Contract. M3 is the first implementation pass where model/provider output may become a Caleb artifact that downstream logic can consume, but only under Caleb's trust rules.

Core doctrine:

Model output may enter Caleb.

Model output may not govern Caleb.

M3 is an implementation pass. M3-C is the design-only contract. This protocol is the canonical base M3 protocol and integrates the mandatory tier provenance, golden-path, NEVER-flow, and display/consumption requirements directly.

## 3. Prior summary

M3-C accepted `docs/RAW_OUTPUT_BOUNDARY_CONTRACT.md` as the design-only raw output boundary contract. M3-C answered the required boundary questions: advisory flow allowlist, taint rule, lineage recording on post-H4 UUID ledger refs, content-addressed raw-output storage, deletion/dangling-reference distinction, display/consumption separation, and the worked example.

H5/H5-A accepted default-suite network egress traps and pinned the egress-capable source surface to the two existing gated provider adapters. H6 accepted report ID integrity. No new provider adapter, provider egress call site, SDK dependency, catalog change, role rotation, UI, or side-effect authority is granted by M3.

The base M3 protocol did not previously exist as a committed `docs/protocols/` file. This protocol replaces no existing base file and does not backfill older H4, H5, or M3-C protocol documents.

## 4. Core rules

- M3-C is the design-only contract.
- M3 is the implementation pass.
- Model/provider output starts as T0 raw.
- Schema-valid model/provider output may become T1.
- Model/provider output caps at T1 forever.
- Model/provider output can never become T2, T3, or T4 by itself.
- Storage does not promote trust.
- Digest presence does not promote trust.
- API success does not promote trust.
- Network success does not promote trust.
- Provider identity does not promote trust.
- Model agreement does not promote trust.
- Report inclusion does not promote trust.
- Ledger reference does not promote trust.
- Opt-in flags do not promote trust.
- Raw output must not be written raw into the Ledger.
- Ledger refs for raw/model/provider content must remain digest/ref-only.
- No new live adapter, provider egress call site, egress allowlist expansion, or SDK dependency is authorized unless Pat explicitly approves it.
- H5 network traps and credential-read traps must remain intact.
- V1 Hollow catalog count must remain exactly 12.
- Hollowcut catalog count must remain exactly 9.

Every derived-evidence record must contain:

- `measurement_tier`
- `subject_tier`
- `effective_tier`

`measurement_tier` and `subject_tier` are mandatory provenance fields.

`effective_tier` must be computed as:

```text
effective_tier = min(measurement_tier, subject_tier)
```

Only `effective_tier` may be consumed by downstream decision logic.

`measurement_tier` and `subject_tier` must not be used directly for:

- routing
- allow/block decisions
- trust promotion
- persistence-as-truth decisions
- release decisions
- side-effect decisions
- Logic Engine transitions

Recommended diagnostic implementation shape:

- provenance-facing records contain `measurement_tier`, `subject_tier`, and `effective_tier`
- decision-facing interfaces expose `effective_tier` only
- behavioral misuse detectors are still required

M3 must not decide the final artifact-store substrate. The M3 diagnostic must evaluate:

- in-memory extension
- `.caleb/artifacts/` content-addressed store

The diagnostic must argue:

- testability
- replay value
- deletion semantics
- ledger compatibility
- risk of accidentally committing raw content
- H5/offline behavior
- simplicity for M3

The M3-C contract defines display flow and consumption flow as separate flows. M3 implements the consumption flow only. Display flow implementation is deferred to a future named pass: M4-DISPLAY-BOUNDARY or another Pat-approved display-boundary pass. Until that pass exists, M3 may expose only test/report-safe summaries and digest/ref metadata needed for acceptance reporting. No display text may become a consumption input, routing input, trust-promotion input, persistence-as-truth input, or side-effect trigger.

M3 must test that model/provider output never flows into:

1. persistence as truth
2. side-effect triggers
3. trust-promotion inputs
4. Logic Engine routing decisions

Lineage requirements:

- Every `derived_from` reference must resolve through a lineage-resolution gate.
- Lineage may use post-H4 UUID-style ledger IDs only.
- Counter-era IDs are barred from new lineage use.
- Authorized-deleted content must be distinguished from unresolved missing content.
- Deletion removes content only, never ledger records.
- Ledger digest references persist forever.

M3 does not authorize:

- role rotation
- routing by model judgment
- side effects
- file mutation by model output
- new live adapters
- new provider egress call sites
- egress allowlist expansion
- weakening H5 traps
- weakening credential-read traps
- modifying historical ledger content
- changing catalog counts
- SDK dependency additions unless Pat explicitly approves
- raw output in ledger
- trust promotion above T1 for model/provider output

## 5. Files to create

The M3 diagnostic must propose the exact implementation file list before implementation. This protocol expects M3 to create only files required for the approved consumption-boundary implementation, tests, and documentation.

At minimum, the M3 diagnostic must decide whether a content-addressed artifact-store implementation is created for M3 or whether an in-memory extension is sufficient for the first implementation pass.

No file creation is authorized until the M3 diagnostic is performed and Pat approves the implementation plan.

## 6. Files to modify

The M3 diagnostic must propose the exact modification list before implementation.

M3 may modify only files needed for the approved consumption-boundary implementation, tests, documentation, and pass ledgers. It must not modify provider adapters, egress allowlists, live-provider gate behavior, historical ledger content, catalog registrations, UI code, role-rotation code, or unrelated runtime surfaces.

## 7. Documentation requirements

M3 implementation documentation must state:

- M3 implements M3-C and does not replace it.
- M3 implements consumption flow only.
- Display flow is deferred to `M4-DISPLAY-BOUNDARY` or another Pat-approved display-boundary pass.
- Model/provider output starts T0 and caps at T1 forever.
- Storage, digest presence, API success, network success, provider identity, model agreement, report inclusion, ledger reference, and opt-in flags are non-promoters.
- `measurement_tier`, `subject_tier`, and `effective_tier` are mandatory on every derived-evidence record.
- Only `effective_tier` may be consumed by decision logic.
- Lineage uses post-H4 UUID-style ledger IDs only and resolves through a lineage-resolution gate.
- Authorized-deleted content is distinct from unresolved missing content.
- Ledger entries remain raw-text-free and digest/ref-only for raw/model/provider content.
- The chosen artifact-store substrate and why it was chosen for M3.
- H5 network and credential-read traps remain preserved.
- V1 Hollow catalog remains exactly 12.
- Hollowcut catalog remains exactly 9.

## 8. Acceptance requirements

M3 must include at least these 23 acceptance categories:

1. Raw output lifecycle acceptance
2. Trust ceiling acceptance
3. Non-promoter acceptance
4. Mandatory tier split field acceptance
5. `effective_tier` computation acceptance
6. `measurement_tier` misuse detector acceptance
7. `subject_tier` misuse detector acceptance
8. Laundering detector acceptance
9. Ledger raw-content absence acceptance
10. Content-addressing acceptance
11. Lineage-resolution gate acceptance
12. Deletion/dangling-reference distinction acceptance
13. Display vs consumption acceptance
14. Persistence-as-truth NEVER-flow absence acceptance
15. Side-effect trigger NEVER-flow absence acceptance
16. Trust-promotion input NEVER-flow absence acceptance
17. Logic Engine routing NEVER-flow absence acceptance
18. H5 network trap preservation acceptance
19. Golden-path worked-example acceptance
20. V1 Hollow catalog count acceptance: exactly 12
21. Hollowcut catalog count acceptance: exactly 9
22. Existing suite acceptance
23. Completion report acceptance

Golden-path worked-example acceptance must include one executable end-to-end acceptance test proving:

1. A live-call-shaped provider/model output enters Caleb as T0 raw output.
2. The output becomes schema-valid T1 only.
3. Raw content is stored by sha256 digest/ref, not written raw into the Ledger.
4. A Character Count Hollow consumes the stored/ref-addressed content through the approved boundary.
5. The derived-evidence record carries:
   - `measurement_tier = T2`
   - `subject_tier = T1`
   - `effective_tier = T1`
6. `effective_tier` is computed as `min(measurement_tier, subject_tier)`.
7. Downstream consumption honors `effective_tier` only.
8. The Character Count measurement does not promote the subject/model content above T1.
9. Ledger refs remain digest/ref-only.
10. The test proves the complete taint doctrine in one path, not merely through isolated fragments.

NEVER-flow absence assertions must prove model/provider output never flows into:

- persistence as truth
- side-effect triggers
- trust-promotion inputs
- Logic Engine routing decisions

Display/report-safe summaries must not influence `effective_tier`, lineage resolution, trust promotion, routing, persistence-as-truth, or side-effect decisions.

## 9. Validation commands

Use the repo's actual scripts from `package.json` and existing docs.

Minimum expected for M3 implementation:

```text
git status --short
npx tsc --noEmit
npx vitest run
npm run --silent cli -- list-hollows --json
npm run --silent cli -- list-hollowcut-hollows --json
```

M3 must also run focused tests for the new raw-output consumption boundary, the golden-path worked example, the misuse detectors, NEVER-flow absence assertions, lineage-resolution gate, artifact-store behavior, and Ledger raw-content absence.

For a docs-only protocol pass, run validation appropriate to the docs-only scope and report exactly what was run. Do not claim unrun validation.

## 10. Report format

Completion report for the M3 implementation must include:

- Pass name and verdict.
- M3-C implemented.
- No M3 diagnostic skipped.
- Artifact-store substrate chosen and rationale.
- Raw output lifecycle result.
- Trust ceiling result.
- Non-promoter result.
- Mandatory tier split result.
- `effective_tier` computation result.
- `measurement_tier` misuse detector result.
- `subject_tier` misuse detector result.
- Laundering detector result.
- Ledger raw-content absence result.
- Content-addressing result.
- Lineage-resolution gate result.
- Deletion/dangling-reference distinction result.
- Display vs consumption result.
- NEVER-flow absence results for persistence-as-truth, side-effect triggers, trust-promotion inputs, and Logic Engine routing decisions.
- Golden-path worked-example result.
- H5 network trap preservation result.
- V1 Hollow catalog count.
- Hollowcut catalog count.
- Existing suite result.
- Files created.
- Files modified.
- Files intentionally not changed.
- Snapshot ID verified on disk before mutation.
- Final clean-tree status.
- Ready for next pass: yes/no.

The M3 protocol-draft pass completion report must include:

- Path B authorized.
- Base M3 protocol did not previously exist as a committed `docs/protocols` file.
- New canonical protocol drafted at `docs/protocols/PASS_PROTOCOL_M3.md`.
- Amendment A integrated directly.
- No M3 diagnostic performed.
- No M3 implementation performed.
- No `src`/`tests`/`types`/provider/egress/ledger-history changes.
- Snapshot verified on disk before recording.
- Files created.
- Files modified.
- Validation results.
- V1 catalog count.
- Hollowcut catalog count.
- Final clean-tree status.
- Ready for Pat approval: Yes/No.

Stop condition: after committing `docs/protocols/PASS_PROTOCOL_M3.md` and reporting clean status, stop. Do not proceed to M3 diagnostic until Pat explicitly approves the protocol.
