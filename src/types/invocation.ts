import type {
  ArtifactHash,
  CalebSeverity,
  CalebStatus,
  ISODateTimeString,
  JsonObject,
  JsonValue,
  SemVerString,
  Sha256Digest
} from "./common.js";
import type { HollowExecutionMode } from "./hollow.js";
import type { SideEffectClass } from "./permissions.js";
import type { TrustTier, VerificationStatus } from "./trust.js";

export interface CalebCheck {
  readonly check_id: string;
  readonly label: string;
  readonly status: CalebStatus;
  readonly severity: CalebSeverity;
  readonly details?: JsonObject;
}

export interface CalebWarning {
  readonly warning_id: string;
  readonly message: string;
  readonly severity: CalebSeverity;
}

export interface CalebError {
  readonly error_id: string;
  readonly message: string;
  readonly severity: CalebSeverity;
  readonly retryable: boolean;
}

export interface HollowInvocationRecord {
  readonly hollow_id: string;
  readonly hollow_name: string;
  readonly hollow_version: SemVerString;
  readonly schema_version: SemVerString;
  readonly invocation_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly caller: string;
  readonly requested_by: string;
  readonly approved_by: string | null;
  readonly input_type: string;
  readonly input_digest: Sha256Digest;
  readonly input_payload: JsonValue;
  readonly permissions: readonly SideEffectClass[];
  readonly execution_mode: HollowExecutionMode;
  readonly deterministic: boolean;
  readonly started_at: ISODateTimeString;
  readonly completed_at: ISODateTimeString | null;
  readonly status: CalebStatus;
  readonly result: JsonValue;
  readonly result_units: string | null;
  readonly checks: readonly CalebCheck[];
  readonly warnings: readonly CalebWarning[];
  readonly errors: readonly CalebError[];
  readonly artifact_hashes: readonly ArtifactHash[];
  readonly provenance: JsonObject;
  readonly ledger_refs: readonly string[];
  readonly retryable: boolean;
  readonly confidence_level: string;
  readonly verification_status: VerificationStatus;
  readonly trust_tier: TrustTier;
}
