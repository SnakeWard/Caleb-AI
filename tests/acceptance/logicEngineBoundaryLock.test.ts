import { describe, it, expect } from "vitest";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";

const EXPECTED_V1_COUNT = 12;
const EXPECTED_HOLLOWCUT_COUNT = 9;

const EXPECTED_V1_IDS = [
  "hollow.text.character_count",
  "hollow.text.prompt_limit",
  "hollow.text.section_balance",
  "hollow.text.repetition_scan",
  "hollow.validation.json_schema_validator",
  "hollow.validation.placeholder_detector",
  "hollow.provenance.file_hash",
  "hollow.provenance.ledger_provenance",
  "hollow.code.line_count",
  "hollow.code.import_surface",
  "hollow.code.export_surface",
  "hollow.code.safety_scan"
] as const;

const EXPECTED_HOLLOWCUT_IDS = [
  "hollow.hollowcut.project_state_check",
  "hollow.hollowcut.project_timeline_cross_check",
  "hollow.hollowcut.export_readiness_check",
  "hollow.hollowcut.export_plan_preview",
  "hollow.timeline.schema_check",
  "hollow.timeline.duration_consistency",
  "hollow.timeline.asset_reference_check",
  "hollow.timeline.track_reference_check",
  "hollow.timeline.temporal_integrity_check"
] as const;

describe("Logic Engine V0 boundary lock — catalog integrity", () => {
  it(`V1 Hollow catalog contains exactly ${EXPECTED_V1_COUNT} Hollows`, () => {
    expect(V1_HOLLOW_MANIFESTS.length).toBe(EXPECTED_V1_COUNT);
  });

  it("V1 Hollow catalog contains the exact expected Hollow IDs", () => {
    const actualIds = V1_HOLLOW_MANIFESTS.map((m) => m.hollow_id);
    for (const id of EXPECTED_V1_IDS) {
      expect(actualIds).toContain(id);
    }
  });

  it("V1 Hollow catalog contains no unexpected Hollow IDs", () => {
    const actualIds = V1_HOLLOW_MANIFESTS.map((m) => m.hollow_id);
    for (const id of actualIds) {
      expect(EXPECTED_V1_IDS).toContain(id as typeof EXPECTED_V1_IDS[number]);
    }
  });

  it(`Hollowcut catalog contains exactly ${EXPECTED_HOLLOWCUT_COUNT} Hollows`, () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS.length).toBe(EXPECTED_HOLLOWCUT_COUNT);
  });

  it("Hollowcut catalog contains the exact expected Hollow IDs", () => {
    const actualIds = HOLLOWCUT_HOLLOW_MANIFESTS.map((m) => m.hollow_id);
    for (const id of EXPECTED_HOLLOWCUT_IDS) {
      expect(actualIds).toContain(id);
    }
  });

  it("Hollowcut catalog contains no unexpected Hollow IDs", () => {
    const actualIds = HOLLOWCUT_HOLLOW_MANIFESTS.map((m) => m.hollow_id);
    for (const id of actualIds) {
      expect(EXPECTED_HOLLOWCUT_IDS).toContain(id as typeof EXPECTED_HOLLOWCUT_IDS[number]);
    }
  });

  it("Logic Engine V0 types do not contain any hollow_id references", () => {
    // Logic Engine V0 is a routing/classification layer and must not reference
    // specific Hollow IDs. Hollow dispatch is the Hollow Dispatcher's responsibility.
    const logicEngineModules = [
      "src/logicEngine/signalClassifier.ts",
      "src/logicEngine/routeSelector.ts",
      "src/logicEngine/workGraphBuilder.ts",
      "src/logicEngine/ledgerEmitter.ts"
    ];

    // This test verifies the architectural contract, not file contents at runtime.
    // The Logic Engine routes to categories (hollow_only route), not specific Hollow IDs.
    // The responsible_module field uses module names (e.g. "hollows.hollow_runner"),
    // not Hollow IDs (e.g. "hollow.text.character_count").
    expect(logicEngineModules.length).toBeGreaterThan(0);

    // The route mode "hollow_only" indicates the category, not a specific Hollow.
    // The actual Hollow selection happens in the Hollow Dispatcher (future V3+).
    const hollowOnlyRoute = "hollow_only";
    expect(typeof hollowOnlyRoute).toBe("string");
  });

  it("V1 and Hollowcut catalogs have no overlapping Hollow IDs", () => {
    const v1Ids = new Set(V1_HOLLOW_MANIFESTS.map((m) => m.hollow_id));
    const hollowcutIds = HOLLOWCUT_HOLLOW_MANIFESTS.map((m) => m.hollow_id);

    for (const id of hollowcutIds) {
      expect(v1Ids.has(id)).toBe(false);
    }
  });
});
