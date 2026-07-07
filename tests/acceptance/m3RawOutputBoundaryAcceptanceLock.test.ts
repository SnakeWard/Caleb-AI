import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS, V1_HOLLOW_MANIFESTS } from "../../src/hollows/index.js";

const REPORT_PATH = "docs/M3_RAW_OUTPUT_BOUNDARY_ACCEPTANCE_REPORT.md";
const IMPLEMENTATION_DOC_PATH = "docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_IMPLEMENTATION.md";
const ACCEPTANCE_TEST_PATH = "tests/acceptance/m3RawOutputConsumptionBoundaryAcceptance.test.ts";

describe("M3-A raw output boundary acceptance lock", () => {
  it("records M3 as accepted and names the canonical evidence files", async () => {
    const report = await readFile(REPORT_PATH, "utf8");

    expect(report).toContain("M3 Raw Output Consumption Boundary: Accepted.");
    expect(report).toContain("docs/protocols/PASS_PROTOCOL_M3.md");
    expect(report).toContain(IMPLEMENTATION_DOC_PATH);
    expect(report).toContain(ACCEPTANCE_TEST_PATH);
    expect(report).toContain("M3 remains CLI/test-only");
    expect(report).toContain("Display flow remains deferred to `M4-DISPLAY-BOUNDARY`");
  });

  it("locks the model-output trust ceiling and non-promoters", async () => {
    const report = await readFile(REPORT_PATH, "utf8");
    const required = [
      "Provider/model output starts as T0 raw.",
      "Schema-valid provider/model output may become T1 only.",
      "Provider/model output is capped at T1 forever.",
      "Provider/model output can never become T2, T3, or T4 by itself.",
      "Storage does not promote trust.",
      "Digest presence does not promote trust.",
      "API success does not promote trust.",
      "Network success does not promote trust.",
      "Provider identity does not promote trust.",
      "Model agreement does not promote trust.",
      "Report inclusion does not promote trust.",
      "Ledger reference does not promote trust.",
      "Opt-in flags do not promote trust."
    ];

    for (const text of required) {
      expect(report).toContain(text);
    }
  });

  it("locks structural split and decision-facing effective_tier-only rule", async () => {
    const report = await readFile(REPORT_PATH, "utf8");
    const implementation = await readFile(IMPLEMENTATION_DOC_PATH, "utf8");
    const acceptance = await readFile(ACCEPTANCE_TEST_PATH, "utf8");

    for (const text of ["measurement_tier", "subject_tier", "effective_tier"]) {
      expect(report).toContain(text);
      expect(implementation).toContain(text);
      expect(acceptance).toContain(text);
    }

    expect(report).toContain("Decision-facing interfaces must expose:");
    expect(report).toContain("effective_tier only");
    expect(acceptance).toContain("\"measurement_tier\" in consumed.decision_record!");
    expect(acceptance).toContain("\"subject_tier\" in consumed.decision_record!");
  });

  it("locks golden-path and NEVER-flow evidence categories", async () => {
    const report = await readFile(REPORT_PATH, "utf8");
    const acceptance = await readFile(ACCEPTANCE_TEST_PATH, "utf8");

    expect(report).toContain("Golden-Path Evidence Lock");
    expect(report).toContain("live-call-shaped provider/model output enters Caleb as T0 raw output");
    expect(report).toContain("Character Count Hollow consumes stored/ref-addressed content through the approved boundary");
    expect(report).toContain("measurement_tier = T2");
    expect(report).toContain("subject_tier = T1");
    expect(report).toContain("effective_tier = T1");

    for (const target of [
      "persistence_as_truth",
      "side_effect_trigger",
      "trust_promotion_input",
      "logic_engine_routing"
    ]) {
      expect(acceptance).toContain(target);
    }
  });

  it("locks all 23 required acceptance categories in the report", async () => {
    const report = await readFile(REPORT_PATH, "utf8");
    const categories = [
      "Raw output lifecycle acceptance",
      "Trust ceiling acceptance",
      "Non-promoter acceptance",
      "Mandatory tier split field acceptance",
      "`effective_tier` computation acceptance",
      "`measurement_tier` misuse detector acceptance",
      "`subject_tier` misuse detector acceptance",
      "Laundering detector acceptance",
      "Ledger raw-content absence acceptance",
      "Content-addressing acceptance",
      "Lineage-resolution gate acceptance",
      "Deletion/dangling-reference distinction acceptance",
      "Display vs consumption acceptance",
      "Persistence-as-truth NEVER-flow absence acceptance",
      "Side-effect trigger NEVER-flow absence acceptance",
      "Trust-promotion input NEVER-flow absence acceptance",
      "Logic Engine routing NEVER-flow absence acceptance",
      "H5 network trap preservation acceptance",
      "Golden-path worked-example acceptance",
      "V1 Hollow catalog count acceptance: exactly 12",
      "Hollowcut catalog count acceptance: exactly 9",
      "Existing suite acceptance",
      "Completion report acceptance"
    ];

    for (const category of categories) {
      expect(report).toContain(category);
    }
  });

  it("preserves catalog counts", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});
