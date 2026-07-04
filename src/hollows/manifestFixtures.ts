import type { HollowManifest } from "../types/hollow.js";
export {
  characterCountManifest,
  promptLimitManifest,
  sectionBalanceManifest,
  repetitionScanManifest,
  textHollowManifests
} from "./categories/text/index.js";
export {
  placeholderDetectorManifest,
  validationHollowManifests
} from "./categories/validation/index.js";
export {
  ledgerProvenanceManifest,
  provenanceHollowManifests
} from "./categories/provenance/index.js";
export {
  lineCountManifest,
  importSurfaceManifest,
  exportSurfaceManifest,
  codeSafetyScanManifest,
  codeHollowManifests
} from "./categories/code/index.js";
import { characterCountManifest, promptLimitManifest } from "./categories/text/textHollowManifests.js";

export const jsonSchemaValidatorManifest = {
  hollow_id: "hollow.validation.json_schema_validator",
  hollow_name: "JSON Schema Validator Hollow",
  hollow_version: "0.1.0",
  schema_version: "1.0.0",
  category: "validation",
  description: "Validates JSON payloads against provided local schema references.",
  input_type: "json_schema_validation_request",
  input_schema_ref: "schemas/hollows/validation/json-schema-validator.input.json",
  output_schema_ref: "schemas/hollows/validation/json-schema-validator.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "provided_handles_only",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "validation_result",
  checks: ["schema_valid", "payload_validated"],
  max_input_size: 100000,
  max_runtime_ms: 2000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "draft",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const fileHashManifest = {
  hollow_id: "hollow.provenance.file_hash",
  hollow_name: "File Hash Hollow",
  hollow_version: "0.1.0",
  schema_version: "1.0.0",
  category: "provenance",
  description: "Computes SHA-256 hashes for scoped file handles.",
  input_type: "file_handle",
  input_schema_ref: "schemas/hollows/provenance/file-hash.input.json",
  output_schema_ref: "schemas/hollows/provenance/file-hash.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "provided_handles_only",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "sha256",
  checks: ["schema_valid", "hash_computed"],
  max_input_size: 100000000,
  max_runtime_ms: 5000,
  supports_batching: true,
  supports_streaming: false,
  cache_policy: "artifact_digest",
  status: "draft",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const v1ManifestFixtures = [
  characterCountManifest,
  promptLimitManifest,
  jsonSchemaValidatorManifest,
  fileHashManifest
] as const satisfies readonly HollowManifest[];
