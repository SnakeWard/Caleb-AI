import { describe, expect, it } from "vitest";

import {
  createV1HollowRegistry,
  createV1HollowRunner,
  isV1SafeHollowManifest,
  listV1HollowIds,
  V1_HOLLOW_IMPLEMENTATIONS,
  V1_HOLLOW_MANIFESTS
} from "../../src/hollows/index.js";

const EXPECTED_IDS = [
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
  "hollow.code.safety_scan",
  "hollow.audit.pass_compliance_check"
].sort();

describe("V1 Hollow catalog", () => {
  it("V1_HOLLOW_MANIFESTS includes all production Hollows from Pass 06, Pass 07, and Pass 08", () => {
    expect(V1_HOLLOW_MANIFESTS.map((manifest) => manifest.hollow_id).sort()).toEqual(EXPECTED_IDS);
  });

  it("V1_HOLLOW_IMPLEMENTATIONS has implementation for every manifest", () => {
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(typeof V1_HOLLOW_IMPLEMENTATIONS[manifest.hollow_id]).toBe("function");
    }
  });

  it("createV1HollowRegistry registers all manifests", () => {
    expect(createV1HollowRegistry().count()).toBe(EXPECTED_IDS.length);
  });

  it("createV1HollowRunner can run character count", async () => {
    const record = await createV1HollowRunner().run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.status).toBe("completed");
    expect(record.result).toMatchObject({ character_count: 5 });
  });

  it("all V1 catalog manifests are V1-safe", () => {
    expect(V1_HOLLOW_MANIFESTS.every((manifest) => isV1SafeHollowManifest(manifest))).toBe(true);
  });

  it("catalog does not include media, shell_command, network, or future-phase Hollows", () => {
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(manifest.category).not.toBe("media");
      expect(manifest.permissions).not.toContain("shell_command");
      expect(manifest.permissions).not.toContain("network");
      expect(manifest.network_access).toBe(false);
    }
  });

  it("listV1HollowIds returns stable sorted IDs", () => {
    expect(listV1HollowIds()).toEqual(EXPECTED_IDS);
  });
});
