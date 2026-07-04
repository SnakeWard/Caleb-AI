import type {
  ISODateTimeString,
  JsonValue,
  SemVerString,
  Sha256Digest
} from "./common.js";
import type { SideEffectClass } from "./permissions.js";

export type BusMessageType =
  | "task_received"
  | "hollow_invocation_request"
  | "hollow_invocation_result"
  | "verification_request"
  | "verification_result"
  | "ledger_write_request"
  | "ledger_write_result"
  | "report_request"
  | "report_result"
  | "error";

export interface BusEndpoint {
  readonly actor_type: string;
  readonly actor_id: string;
}

export interface BusMessageEnvelope {
  readonly message_id: string;
  readonly schema_version: SemVerString;
  readonly created_at: ISODateTimeString;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly source: BusEndpoint;
  readonly target: BusEndpoint;
  readonly message_type: BusMessageType;
  readonly caller: string;
  readonly requested_by: string;
  readonly approved_by: string | null;
  readonly hollow_id?: string;
  readonly input_type: string;
  readonly input_digest?: Sha256Digest;
  readonly input_payload: JsonValue;
  readonly permissions: readonly SideEffectClass[];
  readonly policy_tags: readonly string[];
  readonly parent_message_id?: string;
}
