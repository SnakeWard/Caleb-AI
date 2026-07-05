import { createHash } from "node:crypto";

import type { LiveAdapterTrustSummary } from "../modelBoundary/types/liveAdapterTypes.js";

export function computeSha256Digest(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

export function buildLiveAdapterTrustSummary(schemaValid: boolean): LiveAdapterTrustSummary {
  return {
    raw_provider_output_trust_tier: "T0",
    schema_valid_provider_output_trust_tier: schemaValid ? "T1" : "T0",
    max_allowed_trust_tier: "T1",
    provider_identity_promotes_trust: false,
    successful_response_promotes_trust: false,
    provider_output_is_deterministic_evidence: false,
    storage_promotes_trust: false,
    retrieval_promotes_trust: false,
    ledger_presence_promotes_trust: false,
    verified_final_truth_claimed: false,
    requires_hollow_verification_for_t2: true,
    notes: ["Provider output requires VRP-verified deterministic Hollow evidence for T2."]
  };
}