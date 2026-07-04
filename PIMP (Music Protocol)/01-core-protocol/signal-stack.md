# P.I.M.P Signal Stack

## Purpose
The Signal Stack is the ordered structure P.I.M.P uses to organize musical intent before generation.

It exists to reduce ambiguity and improve fidelity.

## Ordered Stack

1. Identity
2. Emotional Arc
3. Genre Framework
4. Production Layer
5. Structure

This order matters.
Later layers should support earlier layers, not override them blindly.

---

## 1. Identity
Identity is the song’s core selfhood.

Questions it answers:
- Who is speaking?
- What kind of emotional and artistic character is present?
- What posture does the vocalist take?
- What is the worldview of the song?

Examples of identity traits:
- wounded but defiant
- exhausted and reflective
- menacing and controlled
- tender and grieving
- swaggering and reckless

Identity should shape lyric voice, vocal delivery, and atmosphere.

---

## 2. Emotional Arc
Emotional Arc defines movement over time.

Questions it answers:
- Where does the emotion begin?
- What intensifies?
- What changes?
- What breaks open or collapses?

Emotional Arc may include:
- slow burn to eruption
- numbness to grief
- restraint to revenge
- confusion to clarity
- swagger to consequence

The emotional arc should influence verse progression, pre-chorus lift, chorus payoff, bridge turn, and ending tone.

---

## 3. Genre Framework
Genre Framework is the musical container.

Questions it answers:
- What family of sound does this belong to?
- What hybrid or fusion rules are active?
- What genre assumptions should be respected or bent?

Genre Framework may include:
- dark americana folk country
- progressive metal
- post-grunge
- soul-infused acoustic rock
- outlaw country with gothic edge

Genre should provide grounding, not cliché imitation.

---

## 4. Production Layer
Production Layer translates concept into sonic execution cues.

Questions it answers:
- What instrumentation is central?
- What mix or texture is implied?
- What vocal placement matters?
- What sonic weight or spaciousness is required?

Production Layer may include:
- acoustic guitar and cello
- distorted drop-D guitars
- close-mic vocal intimacy
- wide stereo field
- punchy rhythmic center
- restrained reverb
- cinematic low-end bloom

Production notes should be compact and high-signal.

---

## 5. Structure
Structure defines the formal shape of the output.

Questions it answers:
- What sections exist?
- How are they labeled?
- Are performance notes included?
- How should the output be formatted for usability?

Typical sections:
- Intro
- Verse
- Pre-Chorus
- Chorus
- Verse 2
- Bridge
- Final Chorus
- Outro

Structure should increase readability and execution readiness.

## Stack Rule
The Signal Stack is not a checklist of random fields.
It is a dependency chain.

Identity influences arc.
Arc influences genre expression.
Genre influences production.
Production supports structure.
Structure delivers the final package.

## Implementation Guidance
Any engine implementing P.I.M.P should parse ideas into this stack explicitly, even when the original user input is messy or incomplete.