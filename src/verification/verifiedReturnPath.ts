import type { EvidencePacket } from "../types/evidence.js";
import type { CalebError, HollowInvocationRecord } from "../types/invocation.js";
import type { TrustTier, VerificationStatus } from "../types/trust.js";
import {
  assignV1TrustTier,
  evaluateInvocationStructure,
  evaluateV1SafetyForInvocation,
  hasCriticalWarning
} from "./trustPolicy.js";
import type {
  VerificationDecision,
  VerificationIssue,
  VerificationResult,
  VerifiedReturnPathOptions
} from "./verificationTypes.js";

export class VerifiedReturnPath {
  private readonly allow_t1_model_consume: boolean;
  private readonly allow_t2_persist_without_ledger: boolean;
  private readonly max_allowed_trust_tier: TrustTier;
  private readonly include_failure_packet: boolean;
  private readonly now: () => Date;

  constructor(options: VerifiedReturnPathOptions = {}) {
    this.allow_t1_model_consume = options.allow_t1_model_consume ?? true;
    this.allow_t2_persist_without_ledger = options.allow_t2_persist_without_ledger ?? false;
    this.max_allowed_trust_tier = options.max_allowed_trust_tier ?? "T2";
    this.include_failure_packet = options.include_failure_packet ?? true;
    this.now = options.now ?? (() => new Date());
  }

  verifyInvocation(record: HollowInvocationRecord): VerificationResult {
    const structure = evaluateInvocationStructure(record);
    if (!structure.valid) {
      return this.rejectedResult("rejected", "rejected", structure.errors, getWarnings(record));
    }

    const safety = evaluateV1SafetyForInvocation(record);
    if (!safety.safe) {
      return this.rejectedResult("blocked", "blocked", safety.errors, record.warnings);
    }

    if (record.status === "blocked") {
      return this.rejectedResult(
        "blocked",
        "blocked",
        [
          {
            code: "blocked_invocation",
            field: "status",
            message: "Blocked HollowInvocationRecord cannot be accepted as evidence."
          }
        ],
        record.warnings,
        record
      );
    }

    if (record.status === "failed" || record.status === "rejected") {
      return this.rejectedResult(
        "rejected",
        "rejected",
        [
          {
            code: "failed_invocation",
            field: "status",
            message: `HollowInvocationRecord with status "${record.status}" cannot be accepted as evidence.`
          }
        ],
        record.warnings,
        record
      );
    }

    if (record.errors.length > 0) {
      return this.rejectedResult(
        "rejected",
        "rejected",
        [
          {
            code: "fatal_error_present",
            field: "errors",
            message: "HollowInvocationRecord contains errors and cannot be accepted as evidence."
          }
        ],
        record.warnings,
        record
      );
    }

    if (hasCriticalWarning(record.warnings)) {
      return this.rejectedResult(
        "rejected",
        "rejected",
        [
          {
            code: "fatal_error_present",
            field: "warnings",
            message: "Critical warnings block evidence acceptance in V1."
          }
        ],
        record.warnings,
        record
      );
    }

    const trustTier = capTrustTier(assignV1TrustTier(record), this.max_allowed_trust_tier);

    if (trustTier === "T2") {
      const canPersist = this.allow_t2_persist_without_ledger;
      const evidence = this.createEvidencePacket(record, "T2", "verified", true, canPersist);
      return {
        decision: "accepted",
        trust_tier: "T2",
        verification_status: "verified",
        evidence_packet: evidence,
        errors: [],
        warnings: record.warnings,
        can_model_consume: true,
        can_persist_as_truth: canPersist,
        can_trigger_side_effect: false
      };
    }

    if (trustTier === "T1") {
      const canModelConsume = this.allow_t1_model_consume;
      const evidence = this.createEvidencePacket(record, "T1", "schema_valid", canModelConsume, false);
      return {
        decision: "accepted",
        trust_tier: "T1",
        verification_status: "schema_valid",
        evidence_packet: evidence,
        errors: [],
        warnings: record.warnings,
        can_model_consume: canModelConsume,
        can_persist_as_truth: false,
        can_trigger_side_effect: false
      };
    }

    return this.rejectedResult(
      "rejected",
      "rejected",
      [
        {
          code: "unknown",
          message: "HollowInvocationRecord was structurally valid but not eligible for V1 evidence."
        }
      ],
      record.warnings,
      record
    );
  }

  private createEvidencePacket(
    record: HollowInvocationRecord,
    trust_tier: TrustTier,
    verification_status: VerificationStatus,
    can_model_consume: boolean,
    can_persist_as_truth: boolean
  ): EvidencePacket {
    return {
      invocation_id: record.invocation_id,
      task_id: record.task_id,
      run_id: record.run_id,
      trace_id: record.trace_id,
      hollow_id: record.hollow_id,
      hollow_version: record.hollow_version,
      result: cloneJson(record.result),
      result_units: record.result_units,
      checks: [...record.checks],
      warnings: [...record.warnings],
      errors: [...record.errors],
      artifact_hashes: record.artifact_hashes.map((artifact) => ({ ...artifact })),
      provenance: {
        ...record.provenance,
        verified_return_path: true,
        verified_at: this.now().toISOString(),
        source_invocation_id: record.invocation_id
      },
      ledger_refs: [...record.ledger_refs],
      confidence_level: record.confidence_level,
      verification_status,
      trust_tier,
      can_model_consume,
      can_persist_as_truth,
      can_trigger_side_effect: false
    };
  }

  private rejectedResult(
    decision: VerificationDecision,
    verification_status: VerificationStatus,
    errors: readonly VerificationIssue[],
    warnings: HollowInvocationRecord["warnings"],
    record?: HollowInvocationRecord
  ): VerificationResult {
    const evidence =
      this.include_failure_packet && record !== undefined
        ? this.createFailurePacket(record, verification_status)
        : undefined;

    const result: VerificationResult = {
      decision,
      trust_tier: "T0",
      verification_status,
      errors,
      warnings,
      can_model_consume: false,
      can_persist_as_truth: false,
      can_trigger_side_effect: false
    };

    return evidence === undefined ? result : { ...result, evidence_packet: evidence };
  }

  private createFailurePacket(
    record: HollowInvocationRecord,
    verification_status: VerificationStatus
  ): EvidencePacket {
    const errors: readonly CalebError[] =
      record.errors.length > 0
        ? [...record.errors]
        : [
            {
              error_id: "VerifiedReturnPathRejected",
              message: "Invocation was rejected by the Verified Return Path.",
              severity: "error",
              retryable: false
            }
          ];

    return {
      invocation_id: record.invocation_id,
      task_id: record.task_id,
      run_id: record.run_id,
      trace_id: record.trace_id,
      hollow_id: record.hollow_id,
      hollow_version: record.hollow_version,
      result: cloneJson(record.result),
      result_units: record.result_units,
      checks: [...record.checks],
      warnings: [...record.warnings],
      errors,
      artifact_hashes: record.artifact_hashes.map((artifact) => ({ ...artifact })),
      provenance: {
        ...record.provenance,
        verified_return_path: true,
        verified_at: this.now().toISOString(),
        source_invocation_id: record.invocation_id
      },
      ledger_refs: [...record.ledger_refs],
      confidence_level: record.confidence_level,
      verification_status,
      trust_tier: "T0",
      can_model_consume: false,
      can_persist_as_truth: false,
      can_trigger_side_effect: false
    };
  }
}

export function createVerifiedReturnPath(options: VerifiedReturnPathOptions = {}): VerifiedReturnPath {
  return new VerifiedReturnPath(options);
}

export function verifyHollowInvocation(
  record: HollowInvocationRecord,
  options: VerifiedReturnPathOptions = {}
): VerificationResult {
  return new VerifiedReturnPath(options).verifyInvocation(record);
}

function getWarnings(record: unknown): HollowInvocationRecord["warnings"] {
  if (
    typeof record === "object" &&
    record !== null &&
    "warnings" in record &&
    Array.isArray(record.warnings)
  ) {
    return record.warnings as HollowInvocationRecord["warnings"];
  }

  return [];
}

function capTrustTier(trustTier: TrustTier, maxAllowed: TrustTier): TrustTier {
  const order: TrustTier[] = ["T0", "T1", "T2", "T3", "T4"];
  const trustIndex = order.indexOf(trustTier);
  const maxIndex = order.indexOf(maxAllowed);
  return trustIndex <= maxIndex ? trustTier : maxAllowed;
}

function cloneJson(value: HollowInvocationRecord["result"]): HollowInvocationRecord["result"] {
  return JSON.parse(JSON.stringify(value)) as HollowInvocationRecord["result"];
}
