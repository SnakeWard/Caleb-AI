# Codex Operating Contract

## Codex Identity in This Repo

Codex is the implementation pen for Caleb AI. Codex performs careful source-guided implementation work, but it does not redefine the architecture.

## Caleb AI Doctrine

Caleb AI is a Hollow-first orchestration system.

Doctrine: **Models think. Hollows work. Caleb orchestrates.**

Models may reason, plan, critique, and synthesize. Hollows perform bounded deterministic or policy-approved work. Caleb orchestrates requests, permissions, verification, and records.

## Current Build Strategy

Caleb AI MUST be built in controlled passes:

1. Governance and source-of-truth files.
2. Pass 00 repository setup.
3. V1 Hollow Server MVP Foundation.
4. V1.5 Auto Snapshot and Change Guard.
5. Later phases only when explicitly authorized.

## Required Read Order

Before implementation, Codex MUST read:

1. `AGENTS.md`
2. `CODEX.md`
3. `docs/00_SOURCE_INDEX_AND_AUTHORITY.md`
4. `docs/02_V1_PHASE_BOUNDARIES.md`
5. `docs/03_CANONICAL_CONTRACTS.md`
6. `docs/04_STORAGE_AND_LEDGER_DECISIONS.md`
7. `docs/05_PERMISSIONS_AND_SIDE_EFFECT_POLICY.md`
8. `docs/06_V1_TEST_AND_FIXTURE_PLAN.md`
9. `PLANS.md` when an ExecPlan is required

## Pass Discipline

Codex MUST stay inside the authorized pass. Codex MUST NOT use a broad future plan as permission to build future-phase systems.

If a request crosses a phase boundary, Codex MUST stop and report the boundary.

## Change Discipline

Codex SHOULD prefer small targeted patches. Codex MUST preserve existing working logic and avoid broad rewrites unless explicitly authorized.

Codex MUST inspect relevant files before editing them. Codex MUST NOT overwrite user work or unrelated changes.

## Documentation Discipline

Documentation MUST use Caleb AI terminology exactly. Codex MUST NOT replace Caleb AI terms with vague agent-swarm language.

Documentation SHOULD be operational and useful for implementation. It SHOULD avoid whitepaper bloat, generic research citations, and unowned abstractions.

## Implementation Discipline

Codex MUST follow schemas and contracts. Codex MUST NOT skip the Verified Return Path, Ledger, permission declarations, or validation gates.

Raw Hollow output MUST start as untrusted. If a model disagrees with a strict deterministic Hollow on a measurable claim, the Hollow result wins.

## Testing Discipline

Once code exists, Codex MUST run available validation commands before claiming completion:

- `npm test`
- `node ./node_modules/typescript/bin/tsc --noEmit`
- `npm run build`

Tests MUST prove existing behavior remains intact, not only that new behavior exists.

The canonical governed-pass typecheck command is
`node ./node_modules/typescript/bin/tsc --noEmit`. It MUST run to completion and
its exit code MUST be reported. "Did not complete" is not an acceptable
validation result.

## Snapshot Discipline

Before Auto Snapshot and Change Guard exists, Codex MUST use git or manual snapshot discipline. After it exists, Codex MUST snapshot before mutation and record snapshot events in the Ledger.

## Completion Report Format

Codex MUST report:

- Summary
- Files created
- Files changed
- Files intentionally not changed
- Validation run
- Known issues
- Recommended next pass

## Protocol Provenance Discipline (adopted post-G1/G2, first instance H5)

Every pass protocol MUST be committed to `docs/protocols/` before or with the
work it authorizes, so the authorization chain is a repo query, not oral
history. The protocol commit may precede the pass's pre-change snapshot,
because it authorizes rather than implements.

## Handoff Discipline (adopted post-G1/G2)

A handoff between implementing agents is complete only when the working tree
is clean. An incoming agent MUST verify `git status` is clean before touching
anything, and MUST stop and report if it is not clean and the uncommitted work
is not its own.

## Credential Discipline (adopted Pass H8, 2026-07-06)

Provider credentials MUST NOT be ambient in implementer shells. Codex MUST set
credentials only for an explicitly authorized live call and MUST unset them
immediately after. Default validation runs under H5 traps that enforce this.

### Credential-tree doctrine (amended Pass LIVE-F1, 2026-07-19)

Provider credentials may exist only in a **leaf shell** created for one freshly
authorized live command. They MUST NOT exist in the Codex desktop parent,
implementer shell, or any sibling process. Declaring an already inherited
credential name does not make it non-ambient.

Before any live network attempt, Codex MUST start an independent sibling process
from the same parent environment and verify that every credential-shaped provider
variable is absent. The check reports names/presence only and MUST NOT read or
print values. If a sibling sees a credential, STOP before network activity; a
leaf process deleting its own copy cannot prove that its parent or future siblings
are clean.

After the sibling check passes, the authorized credential is introduced directly
into the one-command leaf shell, read only through the sanctioned declared
credential closure, and removed before that leaf exits. The leaf verifies absence
after removal without printing the value. A future live event report must record
both proofs: sibling absence before injection and leaf absence after cleanup.

### Live-event authorization record (amended Pass AUTH-2, 2026-07-20)

**Authorization record (mandatory, before execution):** Pat states the event-specific authorization in his own words — format: `Pat, authorized and ran test for <event label>, <event description>` or equivalent naming the event. The implementer seat appends the entry to `docs/LIVE_EVENT_AUTHORIZATIONS.md` immediately, before the command runs. The entry commits either standalone pre-run or, at latest, within the event's evidence commit. The CLI's `human_confirmed` boolean does not satisfy this step; a flag proves a confirmation occurred, only recorded words prove who authorized what.

### Live-event host-shell doctrine (amended Pass LIVE-F2, 2026-07-19)

Every live provider event MUST be executed by the human operator from a host
shell. Agents build the command path, validate it offline, prepare bounded
fixtures, and inspect the resulting safe Ledger records; agents MUST NOT execute
the live provider command from an agent process or agent sandbox. Fresh human
authorization remains event-specific and does not transfer execution custody to
an agent.

The LIVE-R2 E1 attempts establish the reason for this standing boundary. The
agent process tree exposed an inherited credential-shaped `API_KEY`, so a child
could not prove sibling or parent cleanliness by deleting its own copy. The E1
execution attempts also ended in non-diagnostic provider/network failures; those
failures are not evidence that the provider was unavailable, and they do not
justify retries from the agent sandbox. Human host-shell execution makes
credential custody, sibling preflight, leaf cleanup, and the one authorized
network action directly observable by the operator while agents remain offline.

### Live-event evidence-commit completion rule (amended Pass PRE-7, 2026-07-19)

**Final step (mandatory):** After the unset proof, commit the event's ledger appends as a standalone commit containing only `.caleb/ledger/ledger.jsonl`, with the event label in the commit message (e.g. `LIVE-R2-E1-A7: attempt seven ledger evidence — <n> append-only records, <terminal status summary>`). Verify the diff is pure append before committing. Push and verify synchronization. A live event is not complete until this commit exists on the remote.

### Speculative-normalization prohibition (adopted Pass LIVE-F6, 2026-07-19)

Model output may receive only a specifically evidenced, bounded, deterministic
presentation normalization whose complete predicate, unchanged path, failure
behavior, and safe applied-stage telemetry are detector-locked. Normalization
MUST NOT search for intended content, guess at repairs, or weaken a validator.
The following operations are forbidden:

- Searching for arbitrary brace pairs
- Selecting the first parseable JSON substring
- Removing trailing prose
- Repairing commas, quotes, braces, or escapes
- Validator loosening
