# GVS — Gemini Voice Studio Subsystem Plan

**Status:** Parked / registered only (GVS-0). Not integrated. Not executable within Caleb.
**Pass authority:** `docs/protocols/PASS_PROTOCOL_GVS0.md`
**Reference artifacts:** `docs/reference/gvs/` (unmodified; see `PROVENANCE.md` there)

---

## Origin (one paragraph)

Pat built Gemini Voice Studio (Multi-Engine Edition, correction protocol GVS-ME-CORR-01) as a standalone browser TTS studio with tri-engine dispatch (Gemini cloud API, Kokoro-82M local WebGPU, native browser speech), capability-gated directives, unified 44.1 kHz PCM normalization, RIFF/WAV encoding, and a provenance trace schema. Eight declared invariants (including No Simulated Audio, No Silent Degradation, No Fake Completion, and Explicit Permission Boundaries) independently mirror Caleb doctrine. Fable's review verdict: strong candidate subsystem for the V2 studio layer; must not jump the queue; integration is gated behind machinery that does not yet exist. GVS-0 records that parking decision as a repository fact.

---

## Slot (verbatim)

GVS integration is assigned to the **V2 studio layer**, sequenced AFTER: (1) completion of the LIVE-R2 campaign (E1 + E2), (2) the near-term hardening phase, and (3) the side-effect gate machinery pass — the approval/snapshot gate infrastructure that LE-2 rejection code `bridge_rejected_ungated_capability` already anticipates. GVS produces persistent audio files, making it a side-effect-producing workload by definition; it is therefore a natural first tenant of the side-effect gates, and MUST NOT precede them.

**Future pass name:** GVS-1 (integration era opener, protocol TBD).  
**Protocolization gate:** GVS-1 may not be protocolized until preconditions 1–3 are accepted.

---

## Precondition ladder

1. **Side-effect gate machinery** (approval + snapshot gates for capability-bearing plans) — the named gap behind LE-2 rule 5.
2. **M4 display boundary** — the audio player dock is a display-adjacent surface; audio playback to a human follows the display contract when it exists.
3. **Credential doctrine rebuild** — GVS's current empty-literal / `?key=` URL key shaping (and any ambient-key patterns in the standalone app) are BELOW house standard; integration rebuilds the key flow to closure-based, in-the-moment injection per the operating contract. The existing GVS handling is a known pre-integration deficiency, not inherited.
4. **Provider adapter work, two distinct classes:**
   - **(a) Gemini cloud adapter** — would be a **third** egress call site, requiring the H5 call-site pin's visible allowlist amendment per standing mechanism.
   - **(b) Kokoro-82M** — a **zero-egress local-inference provider**, a new adapter class with no existing doctrine.
5. **Hollow candidates from the GVS normalization chain** — resample-to-44.1 kHz, peak-normalize (0.97 ceiling), RIFF/WAV encode, sentence-windowing — each deterministic, hash-verifiable, VRP-eligible. Any catalog additions occur via visible pin re-key per the AUD-1 precedent, in their own future pass.
6. **GVS invariants INV-01 through INV-08** mapped to detector-backed tests at integration time — declared invariants become proven invariants, per house standard.

---

## Open design questions

### Zero-egress provider class

What gate evidence does a provider require when no network exists?

Fable's design note (non-binding until an authorized design pass): local inference removes the network gate but **not** the trust ceiling — Kokoro output is T0/T1 like any model output; egress absence promotes nothing.

### Display-adjacency of audio playback

Is human-facing audio playback governed solely by the future M4 display boundary, or does persistent audio-file production additionally require a distinct side-effect class even when no UI dock is mounted? (GVS produces files; playback is a separate surface.)

---

## Invariant-mapping obligation

At GVS-1 (or an immediately preceding integration prep pass), INV-01 through INV-08 from the GVS reference material MUST be mapped one-to-one onto detector-backed tests. Declared-but-unproven invariants are not house standard. This plan does not invent the invariant text; it obligates the mapping when integration is authorized.

---

## Explicit non-authorization

Nothing in this plan authorizes: GVS runtime integration, provider adapters, catalog changes, side-effect machinery, UI, credential wiring, or network calls. GVS-0 is registration only.
