import type { JsonObject, JsonValue } from "../../types/common.js";
import type { TrustTier } from "../../types/trust.js";
import type { SignalFrame } from "./signalFrame.js";
import type { TaskFrame } from "./taskFrame.js";
import type { RouteDecision } from "./routeDecision.js";

export type RouteInputRecordKind =
  | "contract_validated_task_frame"
  | "verified_signal_frame"
  | "engine_internal_state"
  | "deterministic_hollow_signal"
  | "accepted_gate_policy_result"
  | "human_pat_approval_record"
  | "snapshot_change_guard_state";

export type RouteInputSource = "logic_engine" | "hollow" | "gate" | "human_pat" | "change_guard";

export interface RouteInputBase {
  readonly record_kind: RouteInputRecordKind;
  readonly record_id: string;
  readonly source: RouteInputSource;
  readonly validated_at: string;
  readonly lineage_refs: readonly string[];
}

export interface ContractValidatedTaskFrameRouteInput extends RouteInputBase {
  readonly record_kind: "contract_validated_task_frame";
  readonly source: "logic_engine";
  readonly task_frame: TaskFrame;
  readonly validation: {
    readonly validator: "validateTaskFrameInput";
    readonly valid: true;
  };
}

export interface VerifiedSignalFrameRouteInput extends RouteInputBase {
  readonly record_kind: "verified_signal_frame";
  readonly source: "logic_engine";
  readonly signal_frame: SignalFrame;
  readonly derived_from_task_frame_record_id: string;
}

export interface EngineInternalStateRouteInput extends RouteInputBase {
  readonly record_kind: "engine_internal_state";
  readonly source: "logic_engine";
  readonly state_name: string;
  readonly state_value: JsonObject;
}

export interface DeterministicHollowSignalRouteInput extends RouteInputBase {
  readonly record_kind: "deterministic_hollow_signal";
  readonly source: "hollow";
  readonly hollow_id: string;
  readonly signal_name: string;
  readonly signal_value: JsonValue;
  readonly effective_tier: TrustTier;
}

export interface AcceptedGatePolicyResultRouteInput extends RouteInputBase {
  readonly record_kind: "accepted_gate_policy_result";
  readonly source: "gate";
  readonly gate_id: string;
  readonly accepted: true;
  readonly scope: string;
}

export interface HumanPatApprovalRouteInput extends RouteInputBase {
  readonly record_kind: "human_pat_approval_record";
  readonly source: "human_pat";
  readonly approved_by: string;
  readonly approval_scope: string;
  readonly accepted: true;
}

export interface SnapshotChangeGuardStateRouteInput extends RouteInputBase {
  readonly record_kind: "snapshot_change_guard_state";
  readonly source: "change_guard";
  readonly snapshot_id: string;
  readonly status: "completed" | "verified";
  readonly gate_satisfied: true;
}

export type LogicEngineRouteInput =
  | ContractValidatedTaskFrameRouteInput
  | VerifiedSignalFrameRouteInput
  | EngineInternalStateRouteInput
  | DeterministicHollowSignalRouteInput
  | AcceptedGatePolicyResultRouteInput
  | HumanPatApprovalRouteInput
  | SnapshotChangeGuardStateRouteInput;

export interface RouteInputIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export type RouteInputValidationResult =
  | { readonly ok: true; readonly input: LogicEngineRouteInput; readonly issues: readonly RouteInputIssue[] }
  | { readonly ok: false; readonly input: null; readonly issues: readonly RouteInputIssue[] };

export type RouteSelectionFromInputsResult =
  | {
      readonly ok: true;
      readonly decision: RouteDecision;
      readonly accepted_inputs: readonly LogicEngineRouteInput[];
      readonly issues: readonly RouteInputIssue[];
    }
  | {
      readonly ok: false;
      readonly decision: null;
      readonly accepted_inputs: readonly LogicEngineRouteInput[];
      readonly issues: readonly RouteInputIssue[];
    };
