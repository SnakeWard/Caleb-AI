# Caleb AI — Pass Protocol GVS-0 (Voice Studio Subsystem — Roadmap Registration)

**Prepared by:** Claude Fable 5 (reviewer/planner), for execution by Grok (implementer)
**Convention:** commit this file to `docs/protocols/PASS_PROTOCOL_GVS0.md` with the work. Handoff rule: first action `git status --short`; if dirty and not yours, STOP and report to Pat.
**Pass type:** documentation only. No src/, no tests/, no catalog changes, no behavior changes, no integration work of any kind. This pass records WHERE the Gemini Voice Studio (GVS) slots into Caleb's roadmap and WHAT must exist before its integration may begin — so that the parking decision is a fact in the record, not a promise in conversation.
**Origin:** Pat built GVS (Gemini Voice Studio — Multi-Engine Edition, GVS-ME-CORR-01) as a standalone browser TTS studio: tri-engine dispatch (Gemini cloud API, Kokoro-82M local WebGPU, native browser speech), capability-gated directives, unified 44.1kHz PCM normalization, RIFF/WAV encoding, and a provenance trace schema — with eight declared invariants (No Simulated Audio, No Silent Degradation, No Fake Completion, Explicit Permission Boundaries, among them) that independently mirror Caleb doctrine. Fable's review verdict: strong candidate subsystem for the V2 studio layer; must not jump the queue; integration gated behind machinery that does not yet exist.

---

## 1. Pass name
GVS-0 — Voice Studio Subsystem Roadmap Registration

## 2. Purpose
Register GVS as a named future subsystem in the roadmap documentation; record its slot, its precondition ladder, and its reference material provenance — without integrating anything. The value of this pass is the record itself: it demonstrates that new capability enters this project through planning and gates even when (especially when) the capability is exciting and already built.

## 3. Core rules
- Docs only. If any step appears to require touching src/, tests/, catalogs, package files, or configuration, STOP and report — that perception is itself a finding.
- **The slot (record verbatim):** GVS integration is assigned to the **V2 studio layer**, sequenced AFTER: (1) completion of the LIVE-R2 campaign (E1 + E2), (2) the near-term hardening phase, and (3) the side-effect gate machinery pass — the approval/snapshot gate infrastructure that LE-2 rejection code `bridge_rejected_ungated_capability` already anticipates. GVS produces persistent audio files, making it a side-effect-producing workload by definition; it is therefore a natural first tenant of the side-effect gates, and MUST NOT precede them.
- **The precondition ladder (record as a numbered list in the subsystem plan):**
  1. Side-effect gate machinery (approval + snapshot gates for capability-bearing plans) — the named gap behind LE-2 rule 5.
  2. M4 display boundary — the audio player dock is a display-adjacent surface; audio playback to a human follows the display contract when it exists.
  3. Credential doctrine rebuild — GVS's current localStorage key handling and inline `?key=` URL are BELOW house standard; integration rebuilds the key flow to closure-based, in-the-moment injection per the operating contract. The existing GVS handling is recorded as a known pre-integration deficiency, not inherited.
  4. Provider adapter work, two distinct classes: (a) a Gemini cloud adapter would be a THIRD egress call site, requiring the H5 call-site pin's visible allowlist amendment per standing mechanism; (b) Kokoro-82M is a **zero-egress local-inference provider** — a new adapter class with no existing doctrine. The subsystem plan must name the open design question: what gate evidence does a provider require when no network exists? (Fable's note for the eventual design: local inference removes the network gate but not the trust ceiling — Kokoro output is T0/T1 like any model output; egress absence promotes nothing.)
  5. Hollow candidates from the GVS normalization chain — resample-to-44.1kHz, peak-normalize (0.97 ceiling), RIFF/WAV encode, sentence-windowing — each deterministic, hash-verifiable, VRP-eligible. Any catalog additions occur via visible pin re-key per the AUD-1 precedent, in their own future pass.
  6. GVS invariants INV-01 through INV-08 mapped to detector-backed tests at integration time — declared invariants become proven invariants, per house standard.
- **Reference material provenance:** store the GVS manual and the single-file application under `docs/reference/gvs/` as UNMODIFIED reference artifacts with a one-paragraph provenance header (authored by Pat, standalone origin, date received, not integrated, not executable within Caleb, credential handling below house standard — do not model from it). If storing the HTML raises any concern in implementation (size, key-handling exposure in the committed file), STOP and report rather than editing the artifact; an edited reference is not a reference. Verify the HTML contains no live API key before committing (structural scan for key-shaped strings; report the check's result affirmatively).
- **Naming registered for future passes:** GVS-1 (integration era opener, protocol TBD, blocked on the ladder above). The roadmap entry states: "GVS-1 may not be protocolized until preconditions 1–3 are accepted."

## 4. Files to create
- `docs/subsystems/GVS_SUBSYSTEM_PLAN.md` — the slot, the ladder, the open design questions (zero-egress provider class; display-adjacency of audio playback), the invariant-mapping obligation, and the origin story in one paragraph.
- `docs/reference/gvs/` — the two reference artifacts with provenance headers (per rules above).

## 5. Files to modify
- The roadmap section of the standing documentation (wherever the V2 studio layer is enumerated — Grok identifies the operative file and states it in the report): one entry adding GVS with its slot and blocking preconditions.
- `docs/STATUS_LOG.md`, `PLANS.md` — GVS-0 entries per house convention.

## 6. Acceptance requirements
- Subsystem plan complete against every element in §3; the key-absence scan result stated affirmatively.
- Canonical suite green (docs-only — counts should match current baseline exactly; state them verbatim), canonical typecheck exit 0, catalogs 13/9 asserted, AUD-2 self-smoke compliant/T2, tree clean, remote synchronized.

## 7. Validation commands
Pre-change snapshot `gvs0_roadmap_registration_prechange`, verified on disk before recording. Then: canonical typecheck; `npx vitest run` (counts verbatim); both catalog commands; AUD-2 self-smoke. Commit with pass ID `GVS-0`; push; clean tree.

## 8. Report format
House style. Mandatory lines: the roadmap file identified and the entry as written; the key-absence scan result; confirmation the reference artifacts are unmodified (digests of both files as committed); suite counts verbatim; catalogs 13/9. Verdict: `GVS-0 Roadmap Registration: Accepted — the Voice Studio is parked, named, gated, and on the record; integration begins only when its ladder is climbed.`

---

## Standing rules (for Grok, restated)

The record outranks memory. Docs-only means docs-only — any perceived need to touch code is a STOP. No fabricated references; the two reference-file digests in the report must match the committed bytes. Snapshot verified on disk before recording. Canonical commands to completion with exit codes. Credentials never ambient (and verify the reference HTML carries none). Honest deviations mandatory. Catalogs 13/9. Nothing herein authorizes GVS integration, adapter work, catalog changes, side-effect machinery, or UI — this pass writes down that all of that comes later, in order, behind its gates. After GVS-0: STOP and report. The active campaign remains LIVE-F7 (in the parallel Fable session); GVS-0 must not be allowed to delay it.
