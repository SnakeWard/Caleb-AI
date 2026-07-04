# Anti-Trope Tier 1

## Purpose
This document defines hard-warning or hard-ban phrases and patterns that commonly signal weak, generic, or obviously AI-generated lyric writing.

Tier 1 is the strongest level of anti-trope enforcement.

## Rule Type
Tier 1 phrases should be:
- blocked
- flagged
- or rewritten by default

unless the user explicitly requests them for stylistic reasons.

## Why Tier 1 Exists
Some phrases are overused to the point that they reduce originality, emotional credibility, and stylistic specificity.

P.I.M.P should actively resist these defaults.

## Common Tier 1 AI-Tell Phrases
The following phrases and close variants should be flagged:

- rise above
- whispers in the wind
- echoes of
- shadows of yesterday
- shattered dreams
- broken chains
- fire in my veins
- darkness inside
- light the way
- finding my way
- through the pain
- running through the night
- lost in the silence
- drowning in memories
- haunted by the past
- voice inside my head
- ashes to ashes
- falling into place
- scars that remain
- dancing with demons
- fight through the storm
- out of the darkness
- into the light
- the battle within
- chasing the truth
- buried deep inside

## Pattern Warnings
The engine should also flag patterns such as:
- abstract cliché pairing with no concrete image
- vague emotional declarations with no lived detail
- generic empowerment phrasing
- filler lines that sound emotionally intense but say little
- repeated metaphor families without specificity

## Rewrite Principle
When a Tier 1 issue is detected, rewriting should aim to:
- increase concreteness
- increase specificity
- preserve tone
- avoid flattening the emotional charge
- replace prefab phrasing with lived imagery or stronger voice

## Example Rewrite Direction
Weak:
"I’m haunted by the past"

Stronger direction:
Replace with a concrete image, memory, habit, sound, object, or consequence tied to the past.

## Validation Recommendation
The engine should return:
- flagged_phrases
- flagged_patterns
- rewrite_recommendations
- anti_trope_status

## Important Note
Tier 1 is not about banning poetic language.
It is about resisting stale, prefab, low-signal defaults that degrade originality.