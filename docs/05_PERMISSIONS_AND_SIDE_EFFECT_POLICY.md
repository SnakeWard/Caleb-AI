# Permissions and Side-Effect Policy

This file defines safety boundaries for Caleb AI.

## Side-Effect Classes

| Class | Meaning |
| --- | --- |
| `none` | No side effects and no external access. |
| `read_only` | Scoped local read access only. |
| `ledger_write` | Append-only Ledger writes. |
| `workspace_write` | Scoped workspace mutation. |
| `network` | Network access. |
| `shell_command` | Shell command execution. |
| `external_side_effect` | Any action affecting an external system, account, service, or device. |

## V1 Rule

V1 starts with pure or read-only Hollows only, plus Ledger writing.

## Permission Rules

- There MUST be no arbitrary filesystem access.
- There MUST be no hidden network calls.
- There MUST be no unrestricted shell execution.
- There MUST be no model-driven local code execution without approval.
- Hollows MUST declare permissions in their manifest.
- File access MUST be scoped.
- Inputs MUST be size-limited.
- Outputs MUST be schema-validated.
- Side effects MUST be blocked by default.
- Sensitive operations MUST require explicit approval.

## Higher-Risk Notes

- Shell command Hollows are future and higher-risk.
- Media transforms MAY be future and higher-risk.
- Network access MUST be denied by default.
- The model MAY request actions, but Orchestration approves them.

## Trust Boundary

Models think. Hollows work. Caleb orchestrates.

The Orchestration Core MUST decide whether a requested action is allowed. The Model API Layer MUST NOT directly perform local side effects. The Hollow Server Layer MUST execute only declared, approved, bounded work.
