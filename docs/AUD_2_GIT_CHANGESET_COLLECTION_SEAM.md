# AUD-2 Git Changeset Collection Seam

## Status

Integration pass wiring `hollow.audit.pass_compliance_check` to real git working-tree state via CLI. Report-only; non-enforcing.

## Command

```bash
npm run --silent cli -- audit-pass-compliance --manifest <path-to-pass-manifest.json> --base-ref <git-ref> --json
```

- `--manifest` (required): path to pass manifest JSON (object or `{ "pass_manifest": ... }`).
- `--base-ref` (optional): git ref for comparison; defaults to `HEAD`.
- `--json` (required): machine-readable JSON output only.

## Trust Boundary

| Layer | Responsibility |
| --- | --- |
| CLI / `src/audit/gitChangesetCollector.ts` | Runs `git`, reads manifest from disk, normalizes paths |
| `hollow.audit.pass_compliance_check` | Evaluates supplied `pass_manifest` + `changeset` only |
| HollowRunner + VerifiedReturnPath | Invokes Hollow, promotes clean deterministic output to T2 |

**Git-in-CLI / no-git-in-Hollow:** The Hollow must never execute git, read the filesystem, spawn shells, or access the network. AUD-2 keeps all environmental access in the CLI integration layer.

## Git Collection

- Compares working tree to `--base-ref` via `git diff --name-status -z --find-renames`.
- Adds untracked files via `git ls-files --others --exclude-standard -z`.
- Maps: `M`/`T` → modify, `A` → create, `D` → delete, `R`/`C` → delete old + create new.
- Paths: repo-relative, forward-slash, sorted by path then operation, deduplicated.

## Output Shape

Success (`ok: true`, exit code `0` even when `verdict.compliant` is false):

- `collection` — git layer metadata (`hollow_gathered_environment: false`)
- `changeset` — normalized git operations
- `hollow` — `hollow_id`, `hollow_version`, `verification_status`, `trust_tier`
- `verdict` — AUD-1 `PassComplianceResult`

Failure (`ok: false`, exit code `1`):

- `stage`: `cli_preflight` | `git_collection` | `manifest_read` | `manifest_parse` | `hollow_invocation` | `verified_return_path`
- `error.code`: `AUD2_*`

## Report-Only Semantics

- Compliance violations are reported in JSON; the command exits `0` when the audit completes.
- Preflight, git, manifest, Hollow, or VRP failures exit non-zero.
- No CI enforcement, commit blocking, or pass-runner integration in AUD-2.

## Example Manifest

`examples/audit/aud2-pass-manifest.valid.json` — scope for AUD-2 self-smoke against the working tree.

## Future Work

- Pass-report auditor v2 (ledger/historical collection)
- Enforcement gates (explicitly out of AUD-2 scope)