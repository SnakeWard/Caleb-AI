# P.I.M.P v1 Implementation Notes

## Source of Truth Summary
This implementation is grounded in the protocol documents in:

- `00-overview`
- `01-core-protocol`
- `02-rules`
- `03-schemas`
- `04-examples`

Key non-negotiable protocol points taken directly from the docs:

- P.I.M.P is a structured protocol, not a loose prompt library.
- The primary equation is `Music = Identity + Tension + Release`.
- The signal stack order is:
  1. Identity
  2. Emotional Arc
  3. Genre Framework
  4. Production Layer
  5. Structure
- The output package order must be:
  1. Title
  2. Concept Summary
  3. Signal Stack Summary
  4. Lyrics
  5. Style Prompt
  6. Validation Notes
- Lyrics must use visible section headers in square brackets.
- The style prompt must remain compact and stay under the default 1000 character limit.
- Tier 1 anti-trope validation must flag listed phrases and practical close variants.
- When information is missing, the engine should preserve ambiguity instead of inventing false certainty.

## V1 Implementation Plan
The first local engine will be a modular Node.js CLI under `05-engine` with no remote dependencies.

Planned modules:

- `parser/`
  - Read markdown input files.
  - Extract named sections from the example-style input format.
  - Normalize fields into a structured internal input object aligned with the input schema where practical.

- `generator/`
  - Build the signal stack conservatively from explicit input first.
  - Derive `identity`, `emotional_arc`, `genre_framework`, `production_layer`, and `structure`.
  - Generate scaffolded section-based lyrics for v1 using deterministic templates and source details.
  - Generate a compact style prompt with traceable inputs.

- `validator/`
  - Validate section-header formatting and package expectations.
  - Validate style prompt length against the documented limit.
  - Detect Tier 1 phrases and practical close variants.
  - Return structured validation notes and warnings rather than hiding uncertainty.

- `formatter/`
  - Produce machine-readable JSON.
  - Produce human-readable markdown that follows the required package order.

- `prompts/`
  - Store local prompt fragments / templates used for scaffolded lyric generation.

- `tests/`
  - Cover parsing.
  - Cover Tier 1 detection.
  - Cover style prompt length validation.
  - Cover markdown package formatting presence.

## Architectural Choices
- Use CommonJS for simplicity in a standalone local CLI.
- Keep dependencies minimal; prefer built-in Node modules.
- Keep protocol configuration centralized so future versions can extend rules without rewriting core flow.
- Record evidence and assumptions in output metadata where inference is required.

## Conservative Inference Rules For V1
- Prefer explicit user input over inference.
- If a field is absent, derive only a high-confidence summary from nearby source text.
- If exact lyric content is not available from source material, generate a scaffold that is clearly structured and aligned, but avoid pretending the engine has high-certainty lyrical specificity beyond the provided idea.
- Anti-trope enforcement should report warnings clearly and keep rewrite guidance practical.

## Expected Runtime Behavior
- CLI entry: `node 05-engine/run-pimp.js --input ./04-examples/inputs/input-001-baby-brother.md`
- Exports written to `06-runtime/exports/`
- Runtime should create missing directories and fail with helpful messages.
