import type { CalebStatus, SemVerString } from "./common.js";
import type { SideEffectClass } from "./permissions.js";

export type HollowCategory =
  | "calculator"
  | "text"
  | "code"
  | "media"
  | "timeline"
  | "validation"
  | "provenance"
  | "project"
  | "policy"
  | "recovery";

export type DeterministicLevel =
  | "strict"
  | "bounded_external_state"
  | "heuristic"
  | "none";

export type FileAccessScope =
  | "none"
  | "provided_handles_only"
  | "workspace_read"
  | "workspace_write";

export type HollowExecutionMode =
  | "local_deterministic"
  | "local_inspection"
  | "local_transform"
  | "approved_side_effect";

export type HollowStatus = "draft" | "trusted" | "deprecated" | "quarantined";

export type HollowCachePolicy = "none" | "input_digest" | "artifact_digest";

export interface HollowManifest {
  readonly hollow_id: string;
  readonly hollow_name: string;
  readonly hollow_version: SemVerString;
  readonly schema_version: SemVerString;
  readonly category: HollowCategory;
  readonly description: string;
  readonly input_type: string;
  readonly input_schema_ref: string;
  readonly output_schema_ref: string;
  readonly permissions: readonly SideEffectClass[];
  readonly permissions_required: readonly SideEffectClass[];
  readonly file_access_scope: FileAccessScope;
  readonly network_access: boolean;
  readonly execution_mode: HollowExecutionMode;
  readonly deterministic: boolean;
  readonly deterministic_level: DeterministicLevel;
  readonly result_units: string | null;
  readonly checks: readonly string[];
  readonly max_input_size: number;
  readonly max_runtime_ms: number;
  readonly supports_batching: boolean;
  readonly supports_streaming: boolean;
  readonly cache_policy: HollowCachePolicy;
  readonly status: HollowStatus;
  readonly owner: string;
}

export type HollowManifestStatus = CalebStatus | HollowStatus;
