export type SideEffectClass =
  | "none"
  | "read_only"
  | "ledger_write"
  | "workspace_write"
  | "network"
  | "shell_command"
  | "external_side_effect";

export type PermissionSet = readonly SideEffectClass[];
export type HollowPermissions = PermissionSet;

// V1 starts with pure/read-only Hollows plus Ledger writing.
export const V1_ALLOWED_SIDE_EFFECT_CLASSES = [
  "none",
  "read_only",
  "ledger_write"
] as const satisfies readonly SideEffectClass[];
