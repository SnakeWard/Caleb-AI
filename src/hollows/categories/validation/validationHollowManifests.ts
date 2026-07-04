import type { HollowManifest } from "../../../types/hollow.js";

export const jsonSchemaValidatorManifest = {
  hollow_id: "hollow.validation.json_schema_validator",
  hollow_name: "JSON Schema Validator Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "validation",
  description: "Validates a candidate value against the Caleb AI V1 JSON Schema subset.",
  input_type: "json_schema_validation_request",
  input_schema_ref: "schemas/hollows/validation/json-schema-validator.input.json",
  output_schema_ref: "schemas/hollows/validation/json-schema-validator.output.json",
  permissions: ["none"],
  permissions_required: [],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_deterministic",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "validation_result",
  checks: ["schema_present", "candidate_present", "schema_subset_validation_completed"],
  max_input_size: 500000,
  max_runtime_ms: 2000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "draft",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const placeholderDetectorManifest = {
  hollow_id: "hollow.validation.placeholder_detector",
  hollow_name: "Placeholder Detector Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "validation",
  description: "Detects placeholder, stub, and fake-completion signals in text.",
  input_type: "placeholder_detector_input",
  input_schema_ref: "schemas/hollows/validation/placeholder-detector.input.json",
  output_schema_ref: "schemas/hollows/validation/placeholder-detector.output.json",
  permissions: ["none"],
  permissions_required: [],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_deterministic",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "findings",
  checks: ["input_text_present", "placeholder_scan_completed"],
  max_input_size: 500000,
  max_runtime_ms: 2000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const validationHollowManifests = [
  jsonSchemaValidatorManifest,
  placeholderDetectorManifest
] as const satisfies readonly HollowManifest[];
