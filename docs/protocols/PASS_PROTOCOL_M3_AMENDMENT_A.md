# CALEB AI — M3 PROTOCOL AMENDMENT A

Subject:
Mandatory tier provenance fields, golden-path worked-example test, NEVER-flow absence assertions, and display/consumption no-silence clarification.

Status:
Binding amendment to the M3 Raw Output Consumption Boundary Implementation Protocol.

This amendment supersedes any conflicting wording in the prior M3 protocol text.

============================================================
AMENDMENT 1 — TIER SPLIT FIELDS ARE MANDATORY
============================================================

Replace any wording that says:

"The two explanatory tier fields may exist"

with:

"The two explanatory tier fields must exist on every derived-evidence record."

Corrected rule:

Every derived-evidence record MUST contain all three fields:

- measurement_tier
- subject_tier
- effective_tier

measurement_tier and subject_tier are mandatory provenance fields.

effective_tier is mandatory and must be computed as:

effective_tier = min(measurement_tier, subject_tier)

Only effective_tier may be consumed by downstream decision logic.

measurement_tier and subject_tier are explanatory provenance only. They must exist so the record explains why effective_tier has the value it has, but they must not be used directly for routing, allow/block decisions, trust promotion, persistence-as-truth decisions, release decisions, side-effect decisions, or Logic Engine transitions.

Acceptance impact:
M3 tests must fail any derived-evidence record missing measurement_tier, subject_tier, or effective_tier.

============================================================
AMENDMENT 2 — WORKED EXAMPLE MUST BE EXECUTABLE ACCEPTANCE TEST
============================================================

Add this as Acceptance Requirement 19:

19. Golden-path worked-example acceptance

M3 must include one executable end-to-end acceptance test for the contract's worked example:

1. A live-call-shaped provider/model output enters Caleb as T0 raw output.
2. The output becomes schema-valid T1 only.
3. The raw content is stored by sha256 digest/ref, not written raw into the ledger.
4. A Character Count Hollow consumes the stored/ref-addressed content through the approved boundary.
5. The derived-evidence record carries:
   - measurement_tier = T2
   - subject_tier = T1
   - effective_tier = T1
6. effective_tier is computed as min(measurement_tier, subject_tier).
7. Downstream consumption honors effective_tier only.
8. The downstream consumer is not allowed to treat the Character Count measurement as promoting the subject/model content above T1.
9. Ledger refs remain digest/ref-only.
10. The test proves the complete taint doctrine in one path, not merely through isolated unit fragments.

This test is required even if the individual rules are also tested separately.

============================================================
AMENDMENT 3 — NEVER-FLOW ALLOWLIST ABSENCE ASSERTIONS
============================================================

The M3-C contract's NEVER-flow list must receive explicit acceptance coverage.

M3 must include absence assertions proving model/provider output never flows into these decision surfaces:

1. Persistence as truth
2. Side-effect triggers
3. Trust-promotion inputs
4. Logic Engine routing decisions

Required tests:

A. Persistence-as-truth absence test
- Given T1 model/provider output,
- When a persistence-as-truth path attempts to store or mark the content as truth,
- Then the attempt is rejected or caught.
- Digest storage is allowed only as content-addressed raw/artifact storage, not truth persistence.

B. Side-effect trigger absence test
- Given T1 model/provider output,
- When the output attempts to trigger a file mutation, command execution, provider call, deletion, approval, dispatch, or other side effect,
- Then the attempt is rejected or caught.
- Model/provider output may not be an actuator.

C. Trust-promotion input absence test
- Given T1 model/provider output,
- When trust promotion logic attempts to use the output, provider identity, digest, storage status, or live-call success as an input to promote beyond T1,
- Then the attempt is rejected or caught.

D. Logic Engine routing absence test
- Given T1 model/provider output,
- When route selection, role selection, Hollow dispatch selection, escalation/de-escalation, recovery routing, or Logic Engine transition logic attempts to use that output as a routing input,
- Then the attempt is rejected or caught.
- Model/provider output may be displayed or summarized as advisory text where allowed, but it must not decide Caleb's route.

This routing prohibition must be asserted even if today's implementation makes it structurally impossible.

House rule:
Test what does not happen.

============================================================
AMENDMENT 4 — DISPLAY VS CONSUMPTION NO-SILENCE RULE
============================================================

The M3 protocol must explicitly address display flow and consumption flow.

Corrected M3 scope statement:

M3 implements the consumption boundary for raw/model provider output.

M3 does not implement a user-facing display surface unless explicitly approved in the M3 diagnostic.

If M3 remains CLI/test-only, display flow is a named deferral, not silence.

Required wording:

"The M3-C contract defines display flow and consumption flow as separate flows. M3 implements the consumption flow only. Display flow implementation is deferred to a future named pass: M4-DISPLAY-BOUNDARY or another Pat-approved display-boundary pass. Until that pass exists, M3 may expose only test/report-safe summaries and digest/ref metadata needed for acceptance reporting. No display text may become a consumption input, routing input, trust-promotion input, persistence-as-truth input, or side-effect trigger."

Acceptance impact:
M3 tests must prove display/report-safe summaries do not influence effective_tier, lineage resolution, trust promotion, routing, persistence-as-truth, or side-effect decisions.

============================================================
AMENDMENT 5 — TYPE-LEVEL FIELD CONSUMPTION RECOMMENDATION
============================================================

This is a diagnostic recommendation, not a mandatory implementation shape unless Pat approves it during M3 diagnostic.

M3 diagnostic should consider enforcing the effective_tier rule structurally:

- Provenance-facing derived-evidence records contain:
  - measurement_tier
  - subject_tier
  - effective_tier

- Decision-facing interfaces expose:
  - effective_tier only

Under this design, downstream decision code cannot accidentally consume measurement_tier or subject_tier because those fields are not present on the decision-facing type.

Even if this structural split is implemented, behavioral detectors are still required:
- synthetic measurement_tier misuse detector
- synthetic subject_tier misuse detector
- synthetic laundering detector
- NEVER-flow absence assertions

============================================================
AMENDMENT 6 — ACCEPTANCE LIST UPDATE
============================================================

The M3 acceptance list must now include at least these 23 required categories:

1. Raw output lifecycle acceptance
2. Trust ceiling acceptance
3. Non-promoter acceptance
4. Mandatory tier split field acceptance
5. effective_tier computation acceptance
6. measurement_tier misuse detector acceptance
7. subject_tier misuse detector acceptance
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

============================================================
IMPLEMENTER WARNING
============================================================

Do not weaken the tier split into optional metadata.

Do not implement effective_tier as an unexplained number.

Do not treat the worked example as documentation only.

Do not skip NEVER-flow tests because a path seems impossible today.

Do not stay silent on display flow.

M3 succeeds only if Caleb can consume model/provider output while proving that output cannot become:

- truth,
- an actuator,
- a trust promoter,
- or a Logic Engine routing authority.

Model output may enter Caleb.

It may not govern Caleb.
