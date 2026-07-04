# Identity, Tension, Release

## Purpose
This document expands the primary P.I.M.P equation:

Music = Identity + Tension + Release

It exists to help implementation systems distinguish core song logic from surface wording.

## Identity
Identity is the stable center of the song.

It includes:
- voice
- point of view
- emotional posture
- moral stance
- artistic attitude
- narrative role

Identity is not just genre.
Identity is the song’s inner character.

Examples:
- a grieving sister speaking softly to a lost brother
- an outlaw narrator recounting revenge with cold calm
- a weary worker holding quiet dignity
- a broken soul confessing what still remains

## Tension
Tension is the unresolved pressure inside the song.

It may come from:
- loss
- guilt
- revenge
- injustice
- longing
- temptation
- memory
- shame
- social fracture
- spiritual conflict

Tension should create forward motion.

Questions:
- What hurts?
- What is unresolved?
- What pulls against itself?
- What refuses to stay quiet?

Strong songs usually contain dominant tension and sometimes secondary tension.

## Release
Release is the form of payoff.

Release does not always mean happy resolution.
It may mean:
- acceptance
- explosion
- collapse
- confession
- surrender
- revelation
- vindication
- haunting continuation

Release gives shape to the emotional destination.

## Core Rule
If identity is unclear, the song becomes generic.
If tension is weak, the song becomes lifeless.
If release is absent, the song becomes forgettable.

## Implementation Guidance
A P.I.M.P engine should attempt to identify or infer:

- primary identity
- dominant tension
- likely release mode

These should be represented either explicitly in output metadata or implicitly in the generation logic.

## Recommended Output Fields
Suggested structured fields:
- identity_profile
- dominant_tension
- secondary_tensions
- release_mode

## Warning
Surface details like genre, era, instrumentation, or artist references must not replace identity, tension, or release.
They support the song.
They do not define its core emotional logic.