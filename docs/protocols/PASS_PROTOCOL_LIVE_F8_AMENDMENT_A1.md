# LIVE-F8 AMENDMENT A1 (authorized by Pat, binding on his word)

D6 — Executor exception boundary. adapter.invoke() (roleRuntimeExecutor.ts:94
region) gains an exception boundary. A rejected/thrown invocation converts to
the same role_invocation_failed emission path as D1, with:
  stage: "invocation_exception", taxonomy: null (LIVE-F1 doctrine — never
  fabricate attribution), error constructor name only (identifier, e.g.
  "TypeError") — NO message text, NO stack trace in any ledger record.
The executor then returns a structured failure; the seam's await at
rotationExecutionSeam.ts:423 must receive a return, never a rejection, from
adapter-originated throws. Live-state capture and terminal construction MUST
still occur: the evidence chain for a thrown invocation is complete —
role_invocation_failed + terminal record + reconstructable failed step.

D7 — No seam-level catch-all this pass. The seam's own exception exposure to
non-adapter executor faults is out of scope; if implementation surfaces a
concrete instance, Section 9 applies — STOP, report, candidate citation seven.

Detectors added:
  T7 — Throwing adapter at step 0: full evidence chain present, taxonomy null,
       error name recorded, reconstruction returns the failed step.
  T8 — Throwing adapter at step 1 (Planner succeeds, Critic adapter throws):
       same proofs; Planner's successful step reconstructs alongside.
  T9 — Seam-boundary proof: the seam observably receives a structured failure
       (terminal record constructed), proven against the pre-fix known
       violation where the attempt boundary vaporized.
  T10 — Leak: error message containing a sentinel string appears nowhere in
       ledger or reconstruction output.

Report lines added: "citations five AND six closed" with T-references;
the amendment text committed verbatim into docs/protocols/ alongside
PASS_PROTOCOL_LIVE_F8.
