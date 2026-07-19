# Caleb AI — Pass Protocol LIVE-F6

**Authorized by:** Pat, 2026-07-19
**Origin:** LIVE-R2 E1 attempt five, executed by Pat from a host leaf shell under
LIVE-F1 through LIVE-F5, returned a complete bounded Planner response that was
stored as T0 evidence but failed at `json_parse`.

## Purpose

Admit one evidenced, deterministic presentation wrapper without weakening the
semantic payload gate: an exact whole-document Markdown JSON fence. Harden the
Planner prompt against that wrapper, preserve raw provider bytes as the
authoritative T0 artifact, and make every applied normalization reconstructable
from safe Ledger telemetry.

## Attempt-five evidence lock

- Execution: `execution_0caeae10-2427-46e2-b2b0-6a8d4e1d00d8`.
- Bridge/start/terminal Ledger IDs:
  `bridge_a583fa69-5153-4eaf-9562-86e0afb576c7`,
  `rotation_80800089-79aa-409a-8d9c-18a79e48b140`, and
  `rotation_c4c7bb2c-3c73-4ebc-a661-6f3f469eb47f`.
- Planner usage: 291 input / 1,139 output / 1,430 total tokens; USD 0.005986;
  11,305 ms; Critic not invoked.
- Safe failure record: `live_observer_artifact_invalid`, stage `json_parse`,
  `{code: invalid_json, path: $}`.
- Output and observed-store digest:
  `sha256:679eee9d6bdb9989eb820c155e6dec6ab75b460819794d7fa8c4c6ea34e25b40`.
  The matching T0 content and record exist and the stored bytes hash to that
  address.

The authorized diagnostic inspected only structure. The 4,543-byte response
has no BOM, preamble, trailing prose, or outer whitespace. Its first complete
line is exactly `\`\`\`json`, its last complete line is exactly `\`\`\``, and
those are the only fence lines. Removing exactly those two lines yields one
strictly parseable JSON object whose complete semantic payload passes the
existing strict validator with zero issues. Payload prose was not reported.

## Binding implementation envelope

1. **Order is fixed.** The observer executes: store raw T0; verify adapter/store
   digest equality; apply LIVE-F5 truncation detection; attempt the exact
   wrapper normalization; parse JSON; run strict semantic validation; construct
   and validate the authoritative runtime envelope.
2. **Exact whole-document fence only.** Normalization applies only when the
   first complete non-whitespace line is exactly `\`\`\`json` or `\`\`\``, the
   last complete non-whitespace line is exactly `\`\`\``, no non-whitespace
   content exists outside those two lines, the inner document begins with `{`
   and ends with `}`, and the entire inner document parses as one JSON object.
   If any condition is false, the original bytes continue unchanged to the
   existing parser and fail under the existing taxonomy when invalid.
3. **Evidence remains raw.** The provider's fenced normalized bytes and digest
   remain the authoritative T0 evidence. A successful canonical artifact stays
   linked by `derived_from` to that raw digest. Normalized text is never emitted
   in a result, failure, diagnostic, or Ledger record.
4. **Applied-stage telemetry.** Whenever the exact unwrap is applied, success
   and later failure records carry
   `observer_normalization_stage: markdown_fence_unwrapped`. Unfenced and
   rejected near-miss documents carry no applied stage. Reconstruction preserves
   the field without making historical records ambiguous.
5. **Prompt hardening.** The Planner prompt adds explicit first/last-character,
   no-backtick, and no-preamble/trailing-commentary requirements. Its new digest
   replaces the prior digest in every shared fixture. Critic prompt content and
   digest remain unchanged. The report records before and after Planner and
   Critic prompt digests side by side.

## Standing speculative-normalization prohibition

LIVE-F6 records this rule in the operating contract: model output may receive
only a specifically evidenced, bounded, deterministic presentation
normalization whose exact conditions and telemetry are detector-locked.
Speculative repair or content hunting is forbidden. The forbidden list is:

- Searching for arbitrary brace pairs
- Selecting the first parseable JSON substring
- Removing trailing prose
- Repairing commas, quotes, braces, or escapes
- Validator loosening

No preamble normalization is authorized by this pass.

## Required detector set

1. An exact `json`-tagged fenced valid object unwraps, parses, passes the strict
   semantic validator, retains the raw fenced T0 digest, and records the named
   stage on both success and a later semantic-validation failure.
2. An exact untagged fenced valid object follows the same bounded path.
3. An unfenced valid object is byte-identical to pre-pass behavior and records
   no normalization stage.
4. Leading preamble and prose containing braces are not searched or extracted
   and fail under the existing parse taxonomy.
5. LIVE-F5 truncation wins before normalization even when truncated bytes begin
   with a fence.
6. All four binding near-miss fixtures fail without normalization:
   missing closing fence; wrong language tag; non-whitespace after the closing
   fence; and two JSON objects inside an otherwise exact fence.
7. A malformed inner document is not repaired or substring-selected. The
   strict payload validator and the strict runtime envelope validator remain
   unchanged.
8. Applied-stage telemetry survives seam serialization and execution-instance
   reconstruction; historical records without the optional field remain
   reconstructable under the LIVE-F2 keying rule.
9. LIVE-F4 identity/lineage detectors, LIVE-F5 T0/truncation detectors,
   provider no-observer compatibility, redaction sweeps, two-call-site egress
   pin, and transport-function hashes remain green.

## Compatibility and protected boundaries

- No provider transport file, fetch site, endpoint, header, credential closure,
  request body, retry, timeout, response-size behavior, model, route, registry,
  CLI, dependency, spend cap, or global test timeout may change.
- Provider output normalization, strict semantic validation, strict envelope
  validation, and F5 truncation classification are not loosened.
- No historical Ledger record is rewritten.
- No live provider invocation is authorized by LIVE-F6.

## Validation and stop

Commit this protocol with the append-only attempt-five Ledger evidence, then
create and verify a pre-change snapshot. Run the complete LIVE-F6 detector set,
focused LIVE-F4/LIVE-F5/provider/gate/seam/M3 tests, canonical offline tests,
governed typecheck, build, catalog locks, AUD-2 self-smoke, and prompt/redaction/
egress/transport/protected-diff checks. Commit and push a clean synchronized
tree, report both prompt-digest generations side by side, and STOP. Any further
live E1 attempt requires fresh human authorization.
