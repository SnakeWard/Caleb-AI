# P.I.M.P Output Contract

## Purpose
This document defines what a valid P.I.M.P output must contain.

Implementations may vary in architecture, but the final output should preserve these required elements.

## Minimum Required Output

### 1. Title
A song title or working title.

### 2. Concept Summary
A short summary of the song’s identity, tension, and release profile.

### 3. Signal Stack Summary
A structured summary of:
- identity
- emotional arc
- genre framework
- production layer
- structure

### 4. Lyrics
Lyrics should be section-based and readable.

Preferred sections include:
- Intro
- Verse
- Pre-Chorus
- Chorus
- Bridge
- Outro

Not every song requires every section, but structure must be explicit.

### 5. Style Prompt
A compact style prompt intended for generation systems such as Suno or Udio.

Style prompt requirements:
- high signal
- compact wording
- character-limited
- aligned with the signal stack
- low redundancy

### 6. Validation Notes
A brief report describing whether the output meets:
- formatting rules
- style length limits
- anti-trope checks
- structural expectations

## Recommended Optional Output
Optional fields may include:
- production notes
- vocal guidance
- alternative chorus options
- anti-trope warnings
- rewrite suggestions
- character count for style prompt

## Formatting Expectations
Lyrics should use visible section headers.
Performance or production notes may be included in parentheses where helpful.
Output should be immediately usable by a human operator.

## Machine Readability
The engine should ideally return both:
- human-readable markdown
- machine-readable JSON

## Failure Handling
If the engine cannot confidently infer a required field, it should:
- mark the ambiguity
- avoid inventing false certainty
- preserve traceability where possible

## Non-Negotiable Rule
A P.I.M.P output is not complete if it only contains a vague prompt.
The output must package intent in a structured, executable form.