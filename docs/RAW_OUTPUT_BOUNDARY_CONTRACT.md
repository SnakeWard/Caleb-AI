# Raw Output Boundary Contract (Pass M3-C)

Status: Accepted — design only; M3 implementation is bound to this contract
Date: 2026-07-05
Pre-change snapshot: `snap_20260705T153926420Z_000323_milestone` (verified on disk)
Authorization: `docs/protocols/PASS_PROTOCOL_H5_H6.md` sequencing → M3-C under
the original protocol in CALEB_AI_PASS_PROTOCOLS_H4_H5_M3C (unamended), with
owner-approved diagnostic additions (a) effective-tier-consumption rule and
(b) deletion/dangling-reference clause incorporated here, not deferred.

This pass creates this document and nothing else. No src/, no tests/, no types.

## 1. Purpose

M2 proved the membrane: model output entered Caleb AI as a digest, never as
text. M3 requires the text itself to be consumable. This contract defines —
before any implementation exists — what a T1 advisory artifact may flow into,
how input lineage caps downstream trust (the taint rule), how lineage is
recorded, where raw output lives, and how display differs from consumption.
This is the M1-deferred taint question, answered on its M3 deadline.

## 2. Definitions

- **Raw output artifact:** the verbatim text a provider returned, stored
  content-addressed (§6), identified everywhere else by its sha256 digest.
- **Derived artifact:** any artifact produced from one or more source
  artifacts (e.g. Hollow evidence over model output; a model reply consuming
  prior model output as context).
- **Measurement integrity tier:** the trust tier earned by the *process* that
  produced a claim (a deterministic Hollow through VRP may earn T2).
- **Subject trust tier:** the trust tier of the *content the claim is about*,
  inherited through lineage (provider output: T1 maximum, per the standing
  ceiling).
- **Effective tier:** `min(measurement integrity tier, subject trust tier)` —
  the only tier downstream decisions may consume (§4).

## 3. Advisory Flow Allowlist (mandatory question 1 — answered)

A T1 model-output artifact **MAY** flow into exactly:

1. **Model-consumption context** for a subsequent reasoning step (e.g. a
   critique pass reads a draft pass's output). The consuming invocation's
   record carries `derived_from` lineage; its own output remains T1-capped.
2. **Human display surfaces** (§7), always provenance-labeled.
3. **Hollow input payloads**, under the taint rule (§4). Example: the
   Character Count Hollow may count a model reply; the evidence it produces is
   measurement-T2 / subject-T1.

A T1 model-output artifact may **NEVER** flow into:

1. **Persistence as truth** — nothing model-derived is written anywhere as a
   verified fact. Example of the violation: writing a model's summary into a
   project file as authoritative documentation.
2. **Side-effect triggers** — no file write, export, network action, or any
   `can_trigger_side_effect` path keys off model output. (No such path exists
   in V1; this line binds M4+.)
3. **Trust-promotion inputs** — model output can never be evidence in a VRP
   promotion decision about itself or anything else.
4. **Logic Engine routing decisions** — TaskFrame classification, route
   selection, and gate evaluation never read model-derived content. The
   deterministic control plane stays model-blind. Example of the violation:
   routing to `hollow_only` because a model suggested it.

## 4. The Taint Rule (mandatory question 2 — answered; split kept first-class)

Every derived artifact carries **two distinguishable properties**:

- `measurement_tier` — what the producing process earned (a deterministic
  Hollow through VRP: up to T2).
- `subject_tier` — `min(source tiers)` inherited through `derived_from`
  lineage (any model-output source caps this at T1; unverified sources at T0).

Both are first-class, recorded fields. The collapse to a single tier was
considered and rejected in the M3-C diagnostic: it destroys the information
that a measurement is reproducible (forcing pointless re-measurement), and it
contradicts observed reality (two providers returned different bytes for one
maximally constrained prompt — subject trust varies independently of
measurement trust). "A verified count of unverified content" is representable,
and must never masquerade as verified content:

> `effective_tier = min(measurement_tier, subject_tier)`

**Effective-tier-consumption rule (owner-approved addition, contract
requirement):** any component making a decision based on a derived artifact
MUST consume `effective_tier` and MUST NOT read `measurement_tier` alone for
any authorization, persistence, display-labeling, or flow-control purpose.
`measurement_tier` exists for provenance and re-use economics (knowing the
measurement need not be re-run), never for permissioning. **This is an M3
detector obligation** (§10, D2): a consumer keying off `measurement_tier`
while `subject_tier` is lower must be constructible in a fixture and must be
caught.

The laundering scenario is unrepresentable under this rule: T0 content →
deterministic Hollow → measurement-T2 evidence still carries
`subject_tier: T0`, so its effective tier is T0, and no unqualified T2 claim
can be derived from it by any composition of steps — `min()` is monotonic and
non-increasing along every lineage chain.

## 5. Lineage Recording (mandatory question 3 — answered)

The ledger entry for every derived artifact contains:

- `derived_from`: an array of ledger entry references — **post-H4 UUID-format
  IDs only**. References to pre-H4 counter-era IDs are barred (H4 ruled them
  cross-run ambiguous). An empty array is only valid for artifacts with no
  sources (e.g. a fresh live invocation's own output).
- `source_tiers`: the subject-relevant tier of each referenced source, as of
  reference time.
- `measurement_tier`, `subject_tier`, and `effective_tier`, with the
  computation reproducible from the recorded inputs.
- The artifact digest(s) involved — never raw content (§6).

**Lineage-resolution gate (named future integrity gate, M3 obligation):**
every `derived_from` reference must resolve to an existing ledger entry at
write time. R37 discipline applies — the gate must be detector-proven against
a fixture containing a fabricated reference (§10, D3).

## 6. Storage Semantics for Raw Output (mandatory question 4 — answered)

- **Where:** a **content-addressed artifact store** keyed by sha256 digest.
  The ledger references digests only; **raw model text never enters the
  ledger** — the M2 redaction guarantee survives M3 unchanged. The store
  substrate (extension of the R10 in-memory artifact store vs. an on-disk
  `.caleb/artifacts/` area) is M3 implementation's choice **within** these
  semantics; the choice changes nothing in this contract.
- **Integrity:** content is retrievable only by digest, and retrieval MUST
  re-verify the digest before returning content (a corrupted store returns a
  structured integrity failure, never wrong bytes).
- **Retention:** artifacts are retained until an **explicitly authorized
  deletion pass**. No auto-expiry exists in M3.
- **Deletion / dangling-reference clause (owner-approved addition):** deletion
  removes **content, never provenance**. The ledger is append-only: entries
  referencing a deleted artifact's digest remain valid and resolvable as
  records. A deletion is itself a ledgered event referencing the digest.
  After deletion, any attempt to dereference *content* MUST return a
  structured `content_deleted` absence (carrying the digest and the deletion
  event reference) — never an error masquerading as corruption, never a silent
  empty result, and never a dangling lineage chain. Lineage chains therefore
  never dangle: the store may lose content; the provenance record never loses
  structure.
- **Doctrine line:** storage location never affects trust tier. Storage does
  not increase trust; retrieval is not trust promotion; a digest match proves
  identity, not truth.

## 7. Display vs. Consumption (mandatory question 5 — answered)

These are different flows with different rules:

- **Display** (human-facing rendering of artifact content): always permitted
  for T1 artifacts, with mandatory provenance labeling — at minimum the
  provider, model, effective tier, and digest. Display is not consumption: it
  feeds no component, triggers nothing, and promotes nothing. (The M2-era
  "never displayed" posture was a property of digest-only M2, not a standing
  rule; this contract supersedes it for stored artifacts.)
- **Consumption** (artifact content fed to any component): follows the §3
  allowlist and §4 taint rule without exception. A display surface that also
  feeds content onward (e.g. copy-into-next-prompt) is consumption at the
  moment it feeds, and takes lineage accordingly.

## 8. What This Contract Does NOT Authorize

- No side effects of any kind, and no side-effect path keyed to model output.
- No persistence of model output as truth, in any store, under any tier.
- No promotion path for model output: the T1 provider ceiling stands;
  VRP-verified deterministic Hollow evidence remains the only road to T2, and
  that road carries subject tier with it (§4).
- No role rotation, no new provider adapters (H5 call-site pin governs), no
  UI, no changes to protected files, catalogs (V1 = 12, Hollowcut = 9), VRP,
  or the Logic Engine's model-blindness.

## 9. Worked Example (end to end — this example IS the taint doctrine)

1. **Live call (M2 pattern):** `claude-haiku-4-5` replies; the adapter
   records digest `sha256:d87c…` (that reply was `Acknowledged`). Ledger
   entry L1 (UUID ID). Artifact stored content-addressed. Tiers: raw T0 →
   schema-valid **T1**. `derived_from: []`.
2. **Storage:** content lives in the artifact store under its digest. The
   ledger holds the digest only. Trust unchanged by storage (§6).
3. **Consumption by a Hollow:** the Character Count Hollow runs over the
   artifact's content. Its invocation record and evidence carry
   `derived_from: [L1]`, `source_tiers: [T1]`.
4. **Evidence:** VRP accepts the deterministic count (value: 12). The
   evidence records `measurement_tier: T2`, `subject_tier: T1`,
   `effective_tier: T1`. The claim reads, in full: *"it is deterministically
   verified (T2-measured) that this T1 model output contains 12 characters —
   an effective-T1 claim."*
5. **What downstream MAY do:** display the count with its provenance label;
   feed it to a model as advisory context (lineage continues); reuse the
   measurement without re-running the Hollow (that is what
   `measurement_tier` is for).
6. **What downstream may NEVER do:** persist "the reply has 12 characters" as
   verified truth; route on it; trigger anything with it; or present it as an
   unqualified T2 claim — the effective-tier-consumption rule (§4) makes the
   attempt itself a detectable violation, and D2 (§10) proves the detector.

## 10. Acceptance-Test Obligations Imposed on M3 Implementation

M3 implementation is not accepted unless it proves, with detector fixtures
where marked (R37 discipline — a gate that has never caught anything is
unproven):

- **D1 — Laundering detector:** a synthetic laundering attempt (T0-derived
  content emerging with an unqualified T2 claim) must be constructible in a
  fixture and must be caught.
- **D2 — Effective-tier-consumption detector:** a synthetic consumer keying a
  decision off `measurement_tier` while `subject_tier` is lower must be
  constructible and must be caught.
- **D3 — Lineage-resolution gate detector:** a fabricated `derived_from`
  reference (non-existent ledger ID) must be constructible and must be caught;
  pre-H4 counter-format references must be rejected.
- **A1:** effective-tier computation (`min`) asserted across the tier matrix,
  including multi-source `min(source tiers)` inheritance.
- **A2:** ledger scans proving raw model text never appears in any ledger
  entry produced by M3 flows (the M2 redaction guarantee, re-proven).
- **A3:** content-addressed retrieval re-verifies digests; corrupted-store and
  `content_deleted` paths return their structured results (deletion event
  ledgered; lineage remains resolvable).
- **A4:** display surfaces carry provenance labels; a display flow feeding
  content onward acquires lineage (display/consumption boundary).
- **A5:** catalog invariants V1 = 12, Hollowcut = 9; default suite remains
  green under the permanent H5 traps.

## 11. Open Items

None. Both diagnostic open items were resolved by owner approval into this
contract (§4 consumption rule; §6 deletion clause). No deferrals — every
mandatory question is answered above.

## 12. Acceptance Verdict

Raw Output Boundary Contract: Accepted — taint doctrine defined; M3
implementation is unblocked and bound to this contract.
Next phase: M3 — first consumption of model output, under §10's obligations.
