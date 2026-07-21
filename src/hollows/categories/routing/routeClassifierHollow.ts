import type { HollowImplementation } from "../../runnerTypes.js";
import type { CalebWarning } from "../../../types/invocation.js";
import type { HollowManifest } from "../../../types/hollow.js";
import {
  ROUTE_CLASSIFICATION_TABLE_VERSION,
  extractClassificationFeaturesFromConstraints,
  lookupRouteClassification,
  proveRoutingTableLegal
} from "../../../logicEngine/routeClassificationTable.js";
import { getRoleCapabilityCatalog } from "../../../roles/roleCapabilitySet.js";
import type { LineageResolvedDecisionFacingRecord } from "../../../logicEngine/types/lineageResolvedDecisionFacingRecord.js";

export const routeClassifierManifest = {
  hollow_id: "hollow.routing.route_classifier",
  hollow_name: "Route Classifier Hollow",
  hollow_version: "0.1.0",
  schema_version: "1.0.0",
  category: "policy",
  description:
    "Pure enumerated lookup of (stakes, ambiguity, evidence_need) → role sequence. " +
    "Reads RA-X-3 single-source capability catalog; emits version-locked table route or refuses.",
  input_type: "lineage_resolved_decision_facing_record",
  input_schema_ref: "caleb.route_classifier.input.v0",
  output_schema_ref: "caleb.route_classifier.output.v0",
  permissions: ["none"],
  permissions_required: [],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_deterministic",
  deterministic: true,
  deterministic_level: "strict",
  result_units: null,
  checks: [
    "table_lookup",
    "table_version_recorded",
    "capability_catalog_readable",
    "fail_closed_off_table"
  ],
  max_input_size: 65536,
  max_runtime_ms: 1000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "none",
  status: "trusted",
  owner: "caleb_logic_engine"
} as const satisfies HollowManifest;

export interface RouteClassifierResult {
  readonly table_version: string;
  readonly role_sequence: readonly string[];
  readonly features: {
    readonly stakes: string;
    readonly ambiguity: string;
    readonly evidence_need: string;
  };
  readonly row_index: number;
  readonly selection_path: "classifier";
  readonly capability_catalog_size: number;
}

/**
 * Pure classification entry (also used by LE-2 without HollowRunner overhead).
 * Capability catalog is read for single-source coupling; table lookup is data-only.
 */
export function classifyDecisionFacingRecord(
  record: LineageResolvedDecisionFacingRecord
):
  | { readonly ok: true; readonly result: RouteClassifierResult }
  | { readonly ok: false; readonly code: string; readonly message: string } {
  const legality = proveRoutingTableLegal();
  if (!legality.ok) {
    return {
      ok: false,
      code: "table_illegal",
      message: `Routing table failed build-time legality: ${legality.issues.join(",")}`
    };
  }

  const catalog = getRoleCapabilityCatalog();
  const features = extractClassificationFeaturesFromConstraints(
    record.task_requirements.constraints
  );
  if (features === null) {
    return {
      ok: false,
      code: "missing_classification_features",
      message:
        "task_requirements.constraints must include feature:stakes=*, feature:ambiguity=*, feature:evidence_need=* tokens."
    };
  }

  // Satisfiability: required capabilities must still be provided (reads single source).
  for (const capability of record.task_requirements.required_capabilities) {
    if (!catalog.all_capabilities.has(capability as never)) {
      return {
        ok: false,
        code: "capability_unsatisfiable",
        message: `No registered role provides capability '${capability}'.`
      };
    }
  }

  const lookup = lookupRouteClassification(features);
  if (!lookup.ok) {
    return { ok: false, code: lookup.code, message: lookup.message };
  }

  return {
    ok: true,
    result: {
      table_version: lookup.table_version,
      role_sequence: [...lookup.route],
      features: { ...lookup.features },
      row_index: lookup.row_index,
      selection_path: "classifier",
      capability_catalog_size: catalog.entries.length
    }
  };
}

export const routeClassifierImplementation: HollowImplementation = ({ input_payload }) => {
  const warnings: CalebWarning[] = [];
  if (
    typeof input_payload !== "object" ||
    input_payload === null ||
    Array.isArray(input_payload)
  ) {
    throw new Error("Route Classifier requires a lineage_resolved_decision_facing_record payload.");
  }
  const record = input_payload as unknown as LineageResolvedDecisionFacingRecord;
  if (record.record_kind !== "lineage_resolved_decision_facing_record") {
    throw new Error("Route Classifier requires a lineage_resolved_decision_facing_record payload.");
  }

  const classified = classifyDecisionFacingRecord(record);
  if (!classified.ok) {
    throw new Error(`Route Classifier refused: ${classified.code} — ${classified.message}`);
  }

  // JsonValue-safe plain object for HollowImplementationResult.
  const result = {
    table_version: classified.result.table_version,
    role_sequence: [...classified.result.role_sequence],
    features: {
      stakes: classified.result.features.stakes,
      ambiguity: classified.result.features.ambiguity,
      evidence_need: classified.result.features.evidence_need
    },
    row_index: classified.result.row_index,
    selection_path: "classifier" as const,
    capability_catalog_size: classified.result.capability_catalog_size
  };

  return {
    result,
    result_units: null,
    checks: [
      {
        check_id: "table_lookup",
        label: "Table Lookup",
        status: "completed",
        severity: "info"
      },
      {
        check_id: "table_version_recorded",
        label: "Table Version Recorded",
        status: "completed",
        severity: "info"
      },
      {
        check_id: "capability_catalog_readable",
        label: "Capability Catalog Readable",
        status: "completed",
        severity: "info"
      }
    ],
    warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_table_lookup"
  };
};
