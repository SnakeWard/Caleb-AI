export type TrustTier = "T0" | "T1" | "T2" | "T3" | "T4";

export const TRUST_TIER_MEANINGS = {
  T0: "Raw untrusted output",
  T1: "Schema-valid but not fully verified",
  T2: "Verified deterministic Hollow output",
  T3: "Verified output with provenance and policy clearance",
  T4: "Human-approved or externally authoritative result with full provenance"
} as const satisfies Record<TrustTier, string>;

export type VerificationStatus =
  | "unverified"
  | "schema_valid"
  | "verified"
  | "rejected"
  | "blocked";
