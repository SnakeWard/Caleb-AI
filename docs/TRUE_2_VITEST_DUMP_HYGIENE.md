# TRUE-2 Vitest Dump Hygiene

## Status

Guardrail pass removing malformed Vitest debug-dump artifacts and hardening AUD-2 git path collection against whitespace-polluted paths.

## TRUE-1 Root Cause

Vitest 4.1.8 writes `vitest-metadata.json` when `VITEST_DEBUG_DUMP` or `server.debug.dump` is truthy.

Path construction (`node_modules/vitest/dist/chunks/coverage.DM_a_rWm.js`):

```javascript
if (resolved.server.debug?.dump || process.env.VITEST_DEBUG_DUMP) {
  const userFolder = resolved.server.debug?.dump || process.env.VITEST_DEBUG_DUMP;
  resolved.dumpDir = resolve(
    resolved.root,
    typeof userFolder === "string" && userFolder !== "true" ? userFolder : ".vitest-dump",
    resolved.name || "root"
  );
}
```

| `userFolder` value | Directory used | Example dumpDir |
| --- | --- | --- |
| boolean `true` | `.vitest-dump` | `<root>/.vitest-dump/root` |
| string `"true"` | `.vitest-dump` | `<root>/.vitest-dump/root` |
| string `"true "` (trailing space) | literal `true ` | `<root>/true /root` |

The malformed artifact `true /root/vitest-metadata.json` is produced when `VITEST_DEBUG_DUMP` (or `server.debug.dump`) equals **`"true "`** — not exact `"true"`.

Git then reports `warning: could not open directory 'true /'` because the real directory name is `true ` (trailing space), which git misparses on Windows.

## Operator Checks

### PowerShell — read env (do not assume Process scope)

```powershell
[Environment]::GetEnvironmentVariable("VITEST_DEBUG_DUMP", "Process")
[Environment]::GetEnvironmentVariable("VITEST_DEBUG_DUMP", "User")
[Environment]::GetEnvironmentVariable("VITEST_DEBUG_DUMP", "Machine")
```

If set at User or Machine scope, remove it from System Properties → Environment Variables, or:

```powershell
[Environment]::SetEnvironmentVariable("VITEST_DEBUG_DUMP", $null, "User")
```

Inspect for trailing whitespace: `"true "` is harmful; exact `"true"` maps to `.vitest-dump` (still debug noise, but not the malformed `true /` path).

### Safe artifact removal

Confirm directory name length is **5** (`true` + trailing space) and contains `root/vitest-metadata.json`, then:

```powershell
Remove-Item -LiteralPath "D:\Caleb AI\true " -Recurse -Force
```

On Windows, if `Remove-Item` fails, Node literal-path removal works:

```javascript
require("fs").rmSync("D:/Caleb AI/true ", { recursive: true, force: true });
```

## Why `server.debug.dump: false` Is Not Reliable

Vitest checks:

```javascript
if (resolved.server.debug?.dump || process.env.VITEST_DEBUG_DUMP)
```

A truthy `process.env.VITEST_DEBUG_DUMP` enables dumping even when config sets `server.debug.dump: false`. TRUE-2 does **not** rely on Vitest config override for this reason.

Preferred controls:

1. Unset `VITEST_DEBUG_DUMP` at User/Machine scope.
2. Repo `.gitignore` patterns (below).
3. AUD-2 collector rejects paths with leading/trailing whitespace components.

## Guardrails Added (TRUE-2)

### `.gitignore`

- `.vitest-dump/`
- `**/vitest-metadata.json`
- `/true /` — malformed trailing-space dump directory

`git check-ignore` reliably matches `.vitest-dump/root/vitest-metadata.json` and `**/vitest-metadata.json`. Trailing-space directory patterns are brittle on Windows; collector rejection is the backstop.

### AUD-2 collector (`src/audit/gitChangesetCollector.ts`)

- Rejects path components where `component.trim() !== component`
- Error code: `AUD2_INVALID_PATH_COMPONENT_WHITESPACE`
- Allows interior spaces: `docs/my file.ts`, `docs/sub dir/file.ts`

## Self-Smoke

```bash
npm run --silent cli -- audit-pass-compliance --manifest examples/audit/true2-pass-manifest.valid.json --base-ref HEAD --json
```

Expect verified T2 Hollow result; `true /root/vitest-metadata.json` must not appear in changeset or violations.