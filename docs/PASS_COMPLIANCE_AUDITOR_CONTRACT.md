# Pass Compliance Auditor Contract

## Contract Status

Canonical contract for `hollow.audit.pass_compliance_check` v1.0.0 (`src/hollows/audit/passComplianceCheck.ts`).

The Hollow is **report-only** and **non-enforcing**. It evaluates a caller-supplied Pass Manifest against a caller-supplied Changeset and returns a deterministic compliance verdict. It does not read git, the filesystem, shell state, network, or environment.

AUD-1 registered this Hollow in the V1 catalog (12 → 13 Hollows). Under **Amendment A1**, AUD-1 re-keyed the authorized catalog count/roster acceptance locks from 12 → 13 in:

- `tests/hollows/v1HollowCatalog.test.ts`
- `tests/acceptance/logicEngineBoundaryLock.test.ts`
- `tests/cli/commandHandlers.test.ts`
- `tests/cli/mediaCommandHandlers.test.ts`
- `tests/cli/minimalCli.test.ts`

## Purpose

Provide a pure, deterministic protocol-compliance auditor that Codex passes can use to verify whether a declared changeset stays within an authorized Pass Manifest — without mutating the repo or enforcing outcomes.

Future work (**AUD-2**) may add git-backed changeset collection. AUD-1 supplies only the evaluation contract.

## Input Contract

Top-level object with exactly these fields:

```json
{
  "pass_manifest": { ... },
  "changeset": { "entries": [ ... ] }
}
```

Unknown top-level fields are rejected (`AUD_UNKNOWN_FIELD`).

### Pass Manifest

| Field | Type | Rules |
| --- | --- | --- |
| `pass_id` | string | Non-empty trimmed string |
| `schema_version` | string | Must equal `"1.0.0"` |
| `allowed_create` | string[] | Non-empty array of non-empty path rules |
| `allowed_modify` | string[] | Non-empty array of non-empty path rules |
| `allowed_delete` | string[] | Array of non-empty path rules (may be empty) |
| `forbidden` | string[] | Non-empty array of non-empty path rules |

Unknown manifest fields are rejected. Missing required fields yield `AUD_MISSING_FIELD`.

### Changeset

| Field | Type | Rules |
| --- | --- | --- |
| `entries` | array | Each entry has `path` (forward-slash POSIX string) and `change_kind` (`created` \| `modified` \| `deleted`) |

Validation rules:

- Backslash in `path` → `AUD_BACKSLASH_PATH`
- Duplicate `path` values across entries → `AUD_DUPLICATE_CHANGESET_PATH`
- Unknown `change_kind` → `AUD_UNKNOWN_CHANGE_KIND`
- Unknown entry fields → `AUD_UNKNOWN_FIELD`
- Malformed structure → `AUD_INVALID_CHANGESET`

## Path Rule Semantics

Rules use forward-slash POSIX paths.

1. **Exact match** — rule `PLANS.md` matches only `PLANS.md`.
2. **Prefix glob** — rule ending in `/**` matches paths strictly inside that directory:
   - `src/roles/**` matches `src/roles/types/deep/x.ts`
   - `src/roles/**` does **not** match `src/roles` (the directory path itself)
   - `src/roles/**` does **not** match `src/roles2/x.ts`

Matching is case-sensitive. No `..` normalization is performed; paths are compared as supplied.

## Evaluation Semantics

When input is valid:

1. Each changeset entry is evaluated in order.
2. **Forbidden precedence** — if a path matches any `forbidden` rule, emit `AUD_FORBIDDEN_PATH_TOUCHED` and skip further checks for that entry (even if the path also matches an allowed rule).
3. Otherwise by `change_kind`:
   - `created` — must match `allowed_create` or `AUD_UNLISTED_FILE_CREATED`
   - `modified` — must match `allowed_modify` or `AUD_UNLISTED_FILE_MODIFIED`
   - `deleted` — must match `allowed_delete` or `AUD_UNEXPECTED_DELETION`

All violations are accumulated (multi-violation inputs return every hit). Violations are sorted by `path` ascending, then `code` ascending.

## Output Contract

```json
{
  "valid": boolean,
  "compliant": boolean | null,
  "status": "compliant" | "violations" | "invalid_input",
  "checks": [ ... ],
  "violations": [
    {
      "code": string,
      "path": string,
      "matched_rule": string | null,
      "change_kind": "created" | "modified" | "deleted" | null
    }
  ],
  "summary": {
    "pass_id": string,
    "entry_count": number,
    "created_count": number,
    "modified_count": number,
    "deleted_count": number,
    "violation_count": number,
    "forbidden_hits": number,
    "unlisted_creates": number,
    "unlisted_modifies": number,
    "unexpected_deletions": number
  }
}
```

Status mapping:

| Condition | `valid` | `compliant` | `status` |
| --- | --- | --- | --- |
| Input/schema invalid | `false` | `null` | `invalid_input` |
| Valid input, zero violations | `true` | `true` | `compliant` |
| Valid input, one or more violations | `true` | `false` | `violations` |

Runner checks always include `supplied_state_only_confirmed`.

## Violation Codes

| Code | Meaning |
| --- | --- |
| `AUD_INVALID_MANIFEST` | Manifest structure or field value invalid |
| `AUD_INVALID_CHANGESET` | Changeset structure invalid |
| `AUD_INVALID_SCHEMA_VERSION` | `schema_version` ≠ `1.0.0` |
| `AUD_INVALID_ROOT` | Root input not a plain object |
| `AUD_MISSING_FIELD` | Required field absent |
| `AUD_UNKNOWN_FIELD` | Unexpected field at any validated level |
| `AUD_BACKSLASH_PATH` | Backslash in changeset path |
| `AUD_DUPLICATE_CHANGESET_PATH` | Duplicate path in changeset |
| `AUD_UNKNOWN_CHANGE_KIND` | `change_kind` not in allowed set |
| `AUD_FORBIDDEN_PATH_TOUCHED` | Path matched a forbidden rule (precedence) |
| `AUD_UNLISTED_FILE_CREATED` | Created path not covered by `allowed_create` |
| `AUD_UNLISTED_FILE_MODIFIED` | Modified path not covered by `allowed_modify` |
| `AUD_UNEXPECTED_DELETION` | Deleted path not covered by `allowed_delete` |

## Purity Guarantees

- No `fs`, `child_process`, `fetch`, `Math.random`, or `randomUUID` usage.
- `permissions: ["none"]`, `file_access_scope: "none"`, `network_access: false`.
- `deterministic: true`, `execution_mode: "local_deterministic"`.
- Identical input always yields deep-equal output.

## Trust and Enforcement Boundary

- Raw runner output is T0/unverified.
- Verified Return Path may promote clean deterministic completions to T2 evidence.
- The Hollow **reports** compliance; it does **not** block commits, snapshots, or mutations.
- Enforcement remains with Change Guard, human review, and future AUD-2 git collection — out of AUD-1 scope.

## Fixtures

Under `examples/hollows/`:

- `pass-compliance.compliant.json`
- `pass-compliance.forbidden-touched.json`
- `pass-compliance.unlisted-modified.json`
- `pass-compliance.unexpected-deletion.json`
- `pass-compliance.invalid-manifest.json`
- `pass-compliance.aud1-self-smoke.json` — self-referential AUD-1 pass scope including Amendment A1 lock re-keys