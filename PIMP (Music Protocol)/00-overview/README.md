# P.I.M.P Module

## Name
P.I.M.P = Psycho-Intelligence Musical Protocol

## Purpose
This module exists to convert the P.I.M.P framework from a conversational method into a structured, executable protocol system.

The goal is to make P.I.M.P readable by code agents and eventually executable as a local engine inside Caleb AI.

## Core Belief
Protocols outperform vague prompting when the goal is reliable, high-quality, intent-aligned creative generation.

P.I.M.P is not a random prompt library.
It is a structured music-generation protocol.

## Primary Equation
Music = Identity + Tension + Release

## What This Module Should Eventually Do
Given a song idea, this module should:

1. parse the creative idea into structured musical intent
2. apply the P.I.M.P signal stack
3. enforce formatting and anti-trope rules
4. generate structured lyrics
5. generate a style prompt optimized for systems like Suno and Udio
6. keep outputs aligned with the creator’s intended emotional and stylistic direction

## V1 Scope
Version 1 should focus on:

- structured input parsing
- signal stack interpretation
- anti-trope enforcement
- section-based lyric formatting
- style prompt generation under character limits
- output packaging in markdown and JSON

## Out of Scope for V1
The following are not required for the first build:

- full UI
- model routing
- audio rendering
- DAW integration
- voice cloning
- autonomous publishing
- advanced memory persistence across sessions

## Design Principle
Deterministic core, adaptive layer.

This means the foundational rules of P.I.M.P should remain stable, while implementation details may evolve over time.

## Folder Intent
This P.I.M.P folder is organized into:

- overview = orientation and purpose
- core protocol = non-negotiable logic
- rules = constraints and anti-trope enforcement
- schemas = machine-readable structure
- examples = pattern teaching material
- engine = code that implements the protocol
- runtime = logs, exports, and configuration
- future = notes for later expansion

## Build Instruction for Codex
Codex should treat this folder as the source of truth for implementing the P.I.M.P protocol engine.

Codex should not invent core protocol rules that are not present in this folder.
Codex may improve implementation, modularity, validation, and formatting as long as the underlying evidentiary meaning remains intact.