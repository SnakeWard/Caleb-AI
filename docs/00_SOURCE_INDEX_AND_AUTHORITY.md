# Source Index and Authority

This file defines document priority for Caleb AI. It tells Codex which source wins when documents overlap.

## Authority Tiers

| Tier | Source | Authority |
| --- | --- | --- |
| Tier 1 | `CALEB_AI_EXECUTION_BATTLEPLAN.md` | Primary implementation source. |
| Tier 2 | `AUTO_SNAPSHOT_AND_CHANGE_GUARD.md` | Implementation safety source. |
| Tier 3 | `CODEX.md`, `AGENTS.md`, `PLANS.md`, and `docs/01-06` | Operational source for Codex behavior, pass discipline, contracts, storage, permissions, and testing. |
| Tier 4 | `CALEB_AI_3D_UI_THINKING_MODE_PLAN.md` | Future UI planning source, not V1 implementation authority. |
| Tier 5 | Research and technical PDFs | Supporting rationale, not override authority. |

## Conflict Order

If documents conflict, Codex MUST follow this order:

1. Explicit user instruction in the current Codex task
2. `AGENTS.md`
3. `CODEX.md`
4. `docs/00_SOURCE_INDEX_AND_AUTHORITY.md`
5. `docs/02_V1_PHASE_BOUNDARIES.md`
6. `docs/03_CANONICAL_CONTRACTS.md`
7. `CALEB_AI_EXECUTION_BATTLEPLAN.md`
8. `AUTO_SNAPSHOT_AND_CHANGE_GUARD.md`
9. UI and research documents

## Current Source Documents In `docs/`

The following expected source PDFs currently exist under `docs/`:

- `Caleb AI Role Rotation in a Multi-Model Hollow Server Architecture.pdf`
- `Caleb AI Architecture, Diagrams, and Technical Paper Draft.pdf`
- `Caleb AI Multi Model Orchestration with Hollows and Role Rotation.pdf`

The following expected markdown source documents currently exist under `docs/`:

- `CALEB_AI_EXECUTION_BATTLEPLAN.md`
- `AUTO_SNAPSHOT_AND_CHANGE_GUARD.md`
- `CALEB_AI_3D_UI_THINKING_MODE_PLAN.md`
- `CALEB_LOGIC_ENGINE_CONTRACT.md`

## Naming Rules

Codex MUST NOT rename Caleb AI terms into generic agent terms. Hollows MUST remain Hollows. The Hollow Server Layer MUST remain the Hollow Server Layer. The Orchestration Core MUST remain the Orchestration Core.

Future-phase documents MUST NOT be treated as permission to implement future phases early.
