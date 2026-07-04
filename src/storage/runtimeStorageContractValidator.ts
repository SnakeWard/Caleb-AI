import type {
  RuntimeStorageRecord,
  RuntimeStorageRecordKind,
  RuntimeStorageRef,
  RuntimeStorageSourceKind,
  RuntimeStorageTrustState,
  RuntimeStorageValidationIssue,
  RuntimeStorageValidationResult,
  RuntimeStorageValidationStatus
} from "./types/runtimeStorageTypes.js";

const RECORD_KINDS = [
  "task_frame_ref",
  "signal_frame_ref",
  "route_decision_ref",
  "work_graph_ref",
  "role_artifact",
  "role_handoff",
  "artifact_bundle",
  "evidence_packet",
  "execution_context",
  "telemetry_trace",
  "ledger_ref",
  "snapshot_ref",
  "final_output"
] as const satisfies readonly RuntimeStorageRecordKind[];

const TRUST_STATES = ["T0", "T1", "T2", "T3", "T4"] as const satisfies readonly RuntimeStorageTrustState[];

const VALIDATION_STATUSES = [
  "raw",
  "schema_valid",
  "verified",
  "rejected",
  "quarantined",
  "superseded"
] as const satisfies readonly RuntimeStorageValidationStatus[];

const SOURCE_KINDS = [
  "user",
  "model",
  "role",
  "hollow",
  "logic_engine",
  "verified_return_path",
  "ledger",
  "snapshot_guard",
  "hollowcut",
  "system"
] as const satisfies readonly RuntimeStorageSourceKind[];

const BASE_STRING_FIELDS = [
  "storage_record_id",
  "record_kind",
  "schema_version",
  "task_id",
  "run_id",
  "created_at",
  "source_kind",
  "trust_tier",
  "validation_status"
] as const;

const BASE_ARRAY_FIELDS = ["ledger_refs", "input_refs", "output_refs", "artifact_refs", "notes"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addIssue(errors: RuntimeStorageValidationIssue[], code: string, path: string, message: string): void {
  errors.push({ code, path, message });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRef(value: unknown): value is RuntimeStorageRef {
  return (
    isObject(value) &&
    isNonEmptyString(value["ref_id"]) &&
    isNonEmptyString(value["ref_kind"]) &&
    (RECORD_KINDS.includes(value["ref_kind"] as RuntimeStorageRecordKind) || value["ref_kind"] === "external") &&
    (value["description"] === undefined || typeof value["description"] === "string")
  );
}

function isRefArray(value: unknown): value is readonly RuntimeStorageRef[] {
  return Array.isArray(value) && value.every(isRef);
}

function validateStringField(record: Record<string, unknown>, errors: RuntimeStorageValidationIssue[], field: string): void {
  if (!isNonEmptyString(record[field])) {
    addIssue(errors, "invalid_required_string", `$.${field}`, `${field} must be a non-empty string.`);
  }
}

function validateStringArrayField(record: Record<string, unknown>, errors: RuntimeStorageValidationIssue[], field: string): void {
  if (!isStringArray(record[field])) {
    addIssue(errors, "invalid_string_array", `$.${field}`, `${field} must be an array of strings.`);
  }
}

function validateRefArrayField(record: Record<string, unknown>, errors: RuntimeStorageValidationIssue[], field: string): void {
  if (!isRefArray(record[field])) {
    addIssue(errors, "invalid_ref_array", `$.${field}`, `${field} must be an array of storage refs.`);
  }
}

function validateBooleanField(record: Record<string, unknown>, errors: RuntimeStorageValidationIssue[], field: string): void {
  if (typeof record[field] !== "boolean") {
    addIssue(errors, "invalid_boolean", `$.${field}`, `${field} must be a boolean.`);
  }
}

function validateNumberField(record: Record<string, unknown>, errors: RuntimeStorageValidationIssue[], field: string): void {
  if (typeof record[field] !== "number" || !Number.isFinite(record[field])) {
    addIssue(errors, "invalid_number", `$.${field}`, `${field} must be a finite number.`);
  }
}

function validateNullableRefField(record: Record<string, unknown>, errors: RuntimeStorageValidationIssue[], field: string): void {
  const value = record[field];
  if (value !== null && !isRef(value)) {
    addIssue(errors, "invalid_ref", `$.${field}`, `${field} must be a storage ref or null.`);
  }
}

function validateBaseFields(record: Record<string, unknown>, errors: RuntimeStorageValidationIssue[]): void {
  for (const field of BASE_STRING_FIELDS) {
    validateStringField(record, errors, field);
  }

  for (const field of BASE_ARRAY_FIELDS) {
    if (field === "ledger_refs" || field === "notes") {
      validateStringArrayField(record, errors, field);
    } else {
      validateRefArrayField(record, errors, field);
    }
  }

  if (isNonEmptyString(record["record_kind"]) && !RECORD_KINDS.includes(record["record_kind"] as RuntimeStorageRecordKind)) {
    addIssue(errors, "invalid_record_kind", "$.record_kind", "record_kind must be a defined runtime storage record kind.");
  }

  if (isNonEmptyString(record["trust_tier"]) && !TRUST_STATES.includes(record["trust_tier"] as RuntimeStorageTrustState)) {
    addIssue(errors, "invalid_trust_tier", "$.trust_tier", "trust_tier must be T0/T1/T2/T3/T4.");
  }

  if (
    isNonEmptyString(record["validation_status"]) &&
    !VALIDATION_STATUSES.includes(record["validation_status"] as RuntimeStorageValidationStatus)
  ) {
    addIssue(
      errors,
      "invalid_validation_status",
      "$.validation_status",
      "validation_status must be a defined runtime storage validation status."
    );
  }

  if (isNonEmptyString(record["source_kind"]) && !SOURCE_KINDS.includes(record["source_kind"] as RuntimeStorageSourceKind)) {
    addIssue(errors, "invalid_source_kind", "$.source_kind", "source_kind must be a defined runtime storage source kind.");
  }
}

function validateKindFields(record: Record<string, unknown>, errors: RuntimeStorageValidationIssue[]): void {
  switch (record["record_kind"]) {
    case "role_artifact":
      for (const field of ["role_id", "role_version", "artifact_id", "artifact_type"]) validateStringField(record, errors, field);
      validateRefArrayField(record, errors, "evidence_refs");
      for (const field of ["assumptions", "contradictions", "defects", "open_questions"]) validateStringArrayField(record, errors, field);
      return;
    case "role_handoff":
      for (const field of ["from_role", "to_role", "handoff_id", "handoff_status"]) validateStringField(record, errors, field);
      validateBooleanField(record, errors, "allowed_to_consume");
      validateStringArrayField(record, errors, "blocking_reasons");
      return;
    case "artifact_bundle":
      for (const field of ["bundle_id", "bundle_type", "consistency_status"]) validateStringField(record, errors, field);
      validateRefArrayField(record, errors, "member_artifact_refs");
      validateRefArrayField(record, errors, "report_refs");
      return;
    case "evidence_packet":
      for (const field of ["evidence_id", "evidence_source", "units"]) validateStringField(record, errors, field);
      validateStringArrayField(record, errors, "claim_keys");
      validateRefArrayField(record, errors, "verification_refs");
      validateBooleanField(record, errors, "can_be_used_for_final");
      return;
    case "execution_context":
      for (const field of ["route_mode", "active_pass", "active_role", "status"]) validateStringField(record, errors, field);
      if (!isRef(record["work_graph_ref"])) addIssue(errors, "invalid_ref", "$.work_graph_ref", "work_graph_ref must be a storage ref.");
      validateRefArrayField(record, errors, "accepted_evidence_refs");
      validateRefArrayField(record, errors, "rejected_artifact_refs");
      validateNullableRefField(record, errors, "contradiction_register_ref");
      validateNullableRefField(record, errors, "defect_register_ref");
      validateRefArrayField(record, errors, "snapshot_refs");
      validateNullableRefField(record, errors, "final_output_ref");
      return;
    case "telemetry_trace":
      for (const field of ["trace_id", "started_at", "status"]) validateStringField(record, errors, field);
      validateNumberField(record, errors, "event_count");
      validateRefArrayField(record, errors, "event_refs");
      if (record["completed_at"] !== null && record["completed_at"] !== undefined && !isNonEmptyString(record["completed_at"])) {
        addIssue(errors, "invalid_required_string", "$.completed_at", "completed_at must be a non-empty string or null.");
      }
      return;
    case "ledger_ref":
      for (const field of ["ledger_entry_id", "ledger_path", "activity", "actor_type", "actor_id"]) {
        validateStringField(record, errors, field);
      }
      return;
    case "snapshot_ref":
      for (const field of ["snapshot_id", "snapshot_type", "snapshot_path"]) validateStringField(record, errors, field);
      validateBooleanField(record, errors, "rollback_available");
      return;
    case "final_output":
      for (const field of ["final_output_id", "output_type", "final_verification_status", "release_status"]) {
        validateStringField(record, errors, field);
      }
      validateRefArrayField(record, errors, "assembled_from_refs");
      return;
    case "task_frame_ref":
    case "signal_frame_ref":
    case "route_decision_ref":
    case "work_graph_ref":
      return;
    default:
      return;
  }
}

function hasVerificationRef(record: Record<string, unknown>): boolean {
  return isRefArray(record["verification_refs"]) && record["verification_refs"].length > 0;
}

function hasLedgerRef(record: Record<string, unknown>): boolean {
  return isStringArray(record["ledger_refs"]) && record["ledger_refs"].length > 0;
}

function hasT4AuthorityMarker(record: Record<string, unknown>): boolean {
  const notes = isStringArray(record["notes"]) ? record["notes"] : [];
  const artifactRefs = isRefArray(record["artifact_refs"]) ? record["artifact_refs"] : [];
  const text = [
    ...notes,
    ...artifactRefs.map((ref) => `${ref.ref_id} ${ref.description ?? ""}`)
  ].join(" ").toLowerCase();

  return text.includes("human approval") || text.includes("external authority");
}

function validateTrustInvariants(record: Record<string, unknown>, errors: RuntimeStorageValidationIssue[]): void {
  const trustTier = record["trust_tier"];
  const validationStatus = record["validation_status"];
  const sourceKind = record["source_kind"];

  if (validationStatus === "raw" && trustTier !== "T0") {
    addIssue(errors, "raw_above_t0_forbidden", "$.trust_tier", "A raw storage record cannot have trust_tier above T0.");
  }

  if ((sourceKind === "model" || sourceKind === "role") && trustTier !== "T0") {
    if (validationStatus !== "schema_valid" && validationStatus !== "verified") {
      addIssue(
        errors,
        "source_above_t0_requires_validation",
        "$.validation_status",
        "Model or role sourced records above T0 require schema_valid or verified status."
      );
    }
  }

  if (trustTier === "T2" && !hasVerificationRef(record) && !hasLedgerRef(record)) {
    addIssue(errors, "t2_requires_verification_or_ledger_ref", "$.trust_tier", "T2 records require at least one verification_ref or ledger_ref.");
  }

  if (trustTier === "T3" && (!hasLedgerRef(record) || validationStatus !== "verified")) {
    addIssue(errors, "t3_requires_verified_ledger", "$.trust_tier", "T3 records require ledger_refs and verified validation_status.");
  }

  if (trustTier === "T4" && !hasT4AuthorityMarker(record)) {
    addIssue(
      errors,
      "t4_requires_human_or_external_authority",
      "$.trust_tier",
      "T4 records require notes or artifact_refs indicating human approval or external authority."
    );
  }

  if ((validationStatus === "rejected" || validationStatus === "quarantined") && record["can_be_used_for_final"] === true) {
    addIssue(
      errors,
      "rejected_or_quarantined_final_use_forbidden",
      "$.can_be_used_for_final",
      "Rejected or quarantined records cannot be used for final output."
    );
  }

  if (record["record_kind"] === "final_output" && record["release_status"] === "released" && record["final_verification_status"] !== "verified") {
    addIssue(
      errors,
      "released_final_output_requires_verified",
      "$.final_verification_status",
      "Final output records cannot be released unless final_verification_status is verified."
    );
  }

  if (record["record_kind"] === "evidence_packet" && record["can_be_used_for_final"] === true && trustTier === "T0") {
    addIssue(
      errors,
      "t0_evidence_final_use_forbidden",
      "$.can_be_used_for_final",
      "Evidence packets marked can_be_used_for_final must not be T0."
    );
  }
}

export function validateRuntimeStorageRecord(record: unknown): RuntimeStorageValidationResult {
  const errors: RuntimeStorageValidationIssue[] = [];

  if (!isObject(record)) {
    return {
      ok: false,
      errors: [{ code: "invalid_root", path: "$", message: "Runtime storage record must be an object." }]
    };
  }

  validateBaseFields(record, errors);
  validateKindFields(record, errors);
  validateTrustInvariants(record, errors);

  return { ok: errors.length === 0, errors };
}

export function isRuntimeStorageRecord(record: unknown): record is RuntimeStorageRecord {
  return validateRuntimeStorageRecord(record).ok;
}

export function assertRuntimeStorageRecord(record: unknown): RuntimeStorageRecord {
  const result = validateRuntimeStorageRecord(record);
  if (!result.ok) {
    throw new Error(`Invalid runtime storage record: ${result.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  }

  return record as RuntimeStorageRecord;
}
