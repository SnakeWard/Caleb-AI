import type { HollowManifest } from "../../../types/hollow.js";

export const fileHashManifest = {
  hollow_id: "hollow.provenance.file_hash",
  hollow_name: "File Hash Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "provenance",
  description: "Computes a SHA-256 digest for an explicit file path inside a provided project root.",
  input_type: "file_hash_input",
  input_schema_ref: "schemas/hollows/provenance/file-hash.input.json",
  output_schema_ref: "schemas/hollows/provenance/file-hash.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "workspace_read",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "sha256",
  checks: [
    "project_root_present",
    "relative_path_present",
    "path_safety_passed",
    "file_exists",
    "file_hash_completed"
  ],
  max_input_size: 100000,
  max_runtime_ms: 5000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "artifact_digest",
  status: "draft",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const ledgerProvenanceManifest = {
  hollow_id: "hollow.provenance.ledger_provenance",
  hollow_name: "Ledger Provenance Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "provenance",
  description: "Inspects provided LedgerEntry-like records for provenance and reference consistency.",
  input_type: "ledger_provenance_input",
  input_schema_ref: "schemas/hollows/provenance/ledger-provenance.input.json",
  output_schema_ref: "schemas/hollows/provenance/ledger-provenance.output.json",
  permissions: ["none"],
  permissions_required: [],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_deterministic",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "ledger_entries",
  checks: ["entries_present", "ledger_provenance_scan_completed"],
  max_input_size: 1000000,
  max_runtime_ms: 2000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const provenanceHollowManifests = [
  fileHashManifest,
  ledgerProvenanceManifest
] as const satisfies readonly HollowManifest[];
