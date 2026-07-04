import type {
  ArtifactHash,
  ISODateTimeString,
  JsonValue,
  Sha256Digest
} from "../types/common.js";
import type { HollowExecutionMode } from "../types/hollow.js";
import type { CalebCheck, CalebWarning } from "../types/invocation.js";
import type { SideEffectClass } from "../types/permissions.js";

export interface HollowExecutionContext {
  readonly invocation_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly hollow_id: string;
  readonly hollow_version: string;
  readonly started_at: ISODateTimeString;
  readonly deadline_at?: ISODateTimeString;
  readonly caller: string;
  readonly requested_by: string;
  readonly approved_by: string | null;
  readonly permissions: readonly SideEffectClass[];
  readonly execution_mode: HollowExecutionMode;
  // Aborted when the invocation timeout fires. V1 timeout is rejection plus this
  // signal, not guaranteed cancellation: pure Hollows may ignore it, but any
  // future side-effect-capable Hollow MUST observe it.
  readonly abort_signal?: AbortSignal;
}

export interface HollowImplementationInput {
  readonly input_payload: JsonValue;
  readonly input_digest: Sha256Digest;
  readonly context: HollowExecutionContext;
}

export interface HollowImplementationResult {
  readonly result: JsonValue;
  readonly result_units?: string | null;
  readonly checks?: readonly CalebCheck[];
  readonly warnings?: readonly CalebWarning[];
  readonly artifact_hashes?: readonly ArtifactHash[];
  readonly confidence_level?: string;
}

export type HollowImplementation = (
  input: HollowImplementationInput
) => Promise<HollowImplementationResult> | HollowImplementationResult;

export interface HollowRunnerOptions {
  readonly default_caller?: string;
  readonly default_requested_by?: string;
  readonly default_timeout_ms?: number;
  readonly now?: () => Date;
  readonly id_generator?: (prefix: "invocation" | "task" | "run" | "trace") => string;
}

export interface RunHollowRequest {
  readonly hollow_id: string;
  readonly input_payload: JsonValue;
  readonly input_digest?: Sha256Digest;
  readonly task_id?: string;
  readonly run_id?: string;
  readonly trace_id?: string;
  readonly invocation_id?: string;
  readonly caller?: string;
  readonly requested_by?: string;
  readonly approved_by?: string | null;
  readonly permissions?: readonly SideEffectClass[];
}
