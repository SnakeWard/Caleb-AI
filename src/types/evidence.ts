import type {
  ArtifactHash,
  JsonObject,
  JsonValue,
  SemVerString
} from "./common.js";
import type { CalebCheck, CalebError, CalebWarning } from "./invocation.js";
import type { TrustTier, VerificationStatus } from "./trust.js";

export interface EvidencePacket {
  readonly invocation_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly hollow_id: string;
  readonly hollow_version: SemVerString;
  readonly result: JsonValue;
  readonly result_units: string | null;
  readonly checks: readonly CalebCheck[];
  readonly warnings: readonly CalebWarning[];
  readonly errors: readonly CalebError[];
  readonly artifact_hashes: readonly ArtifactHash[];
  readonly provenance: JsonObject;
  readonly ledger_refs: readonly string[];
  readonly confidence_level: string;
  readonly verification_status: VerificationStatus;
  readonly trust_tier: TrustTier;
  readonly can_model_consume: boolean;
  readonly can_persist_as_truth: boolean;
  readonly can_trigger_side_effect: boolean;
}
