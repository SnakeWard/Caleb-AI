import type { CalebWarning } from "../types/invocation.js";
import type { EvidencePacket } from "../types/evidence.js";
import type { TrustTier, VerificationStatus } from "../types/trust.js";

export type VerificationDecision = "accepted" | "rejected" | "blocked";

export type VerificationFailureCode =
  | "missing_required_field"
  | "failed_invocation"
  | "blocked_invocation"
  | "unsafe_permission"
  | "unsafe_execution_mode"
  | "unsafe_network_access"
  | "malformed_result"
  | "fatal_error_present"
  | "not_deterministic"
  | "unknown";

export interface VerificationIssue {
  readonly code: VerificationFailureCode;
  readonly message: string;
  readonly field?: string;
}

export interface VerificationResult {
  readonly decision: VerificationDecision;
  readonly trust_tier: TrustTier;
  readonly verification_status: VerificationStatus;
  readonly evidence_packet?: EvidencePacket;
  readonly errors: readonly VerificationIssue[];
  readonly warnings: readonly CalebWarning[];
  readonly can_model_consume: boolean;
  readonly can_persist_as_truth: boolean;
  readonly can_trigger_side_effect: boolean;
}

export interface VerifiedReturnPathOptions {
  readonly allow_t1_model_consume?: boolean;
  readonly allow_t2_persist_without_ledger?: boolean;
  readonly max_allowed_trust_tier?: TrustTier;
  readonly include_failure_packet?: boolean;
  readonly now?: () => Date;
}
