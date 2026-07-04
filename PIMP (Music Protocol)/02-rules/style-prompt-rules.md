# Style Prompt Rules

## Purpose
This document defines how P.I.M.P style prompts should be written and validated.

The style prompt is not a dumping ground for every idea.
It is a compact signal package.

## Core Rule
The style prompt should communicate maximum useful signal with minimum noise.

## Primary Goals
A valid style prompt should:
- establish genre framework
- indicate vocal direction
- imply instrumentation
- communicate production character
- preserve emotional tone
- remain compact and readable

## Character Limit Rule
Default style prompt maximum length: 1000 characters.

If a target system has a lower limit, the engine should compress accordingly.

## Preferred Content Types
The style prompt may include:
- genre and subgenre language
- mood or emotional tone
- vocal character
- instrumentation
- arrangement cues
- mix or production cues
- dynamic shape

## Avoid
The style prompt should avoid:
- bloated adjective chains
- repeated genre labels
- conflicting instructions
- full lyrical explanation
- excessive story detail
- unnecessary technical micromanagement
- random artist stuffing without purpose

## Compression Guidance
When a style prompt exceeds the character limit, compress in this order:

1. remove redundant adjectives
2. remove duplicated genre language
3. shorten production phrases
4. remove non-essential secondary details
5. preserve identity, genre, vocal, and core production signal

## Priority Retention Order
When compressing, preserve these first:
1. identity signal
2. genre framework
3. vocal direction
4. core instrumentation
5. production cues
6. secondary atmosphere language

## Quality Rule
A shorter high-signal prompt is better than a longer noisy one.

## Validation Checks
The engine should validate:
- character count
- duplicate phrase density
- contradictory descriptors
- presence of core signal categories

## Output Recommendation
The engine should return:
- style_prompt
- style_prompt_char_count
- style_prompt_validation_status