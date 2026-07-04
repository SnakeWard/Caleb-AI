import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  inspectSectionBalance,
  sectionBalanceImplementation,
  sectionBalanceManifest,
} from "../../../src/hollows/categories/text/index.js";
import type { JsonObject } from "../../../src/types/index.js";

describe("Section Balance Hollow", () => {
  it("detects bracketed sections", () => {
    const result = inspectSectionBalance({ text: "[Intro]\nWelcome here.\n[Chorus]\nLift it up." });

    expect(result.sections.map((section) => section.name)).toEqual(["Intro", "Chorus"]);
  });

  it("preserves section order", () => {
    const result = inspectSectionBalance({ text: "[Verse]\nWords\n[Bridge]\nMore\n[Chorus]\nHook" });

    expect(result.sections.map((section) => section.name)).toEqual(["Verse", "Bridge", "Chorus"]);
  });

  it("reports section_count", () => {
    expect(inspectSectionBalance({ text: "[A]\nalpha\n[B]\nbeta" }).section_count).toBe(2);
  });

  it("reports missing expected sections", () => {
    const result = inspectSectionBalance({
      text: "[Intro]\nWelcome",
      section_markers: ["Intro", "Chorus"],
    });

    expect(result.missing_expected_sections).toEqual(["Chorus"]);
  });

  it("reports repeated sections", () => {
    const result = inspectSectionBalance({ text: "[Chorus]\nOne\n[Chorus]\nTwo" });

    expect(result.repeated_sections).toEqual(["Chorus"]);
  });

  it("warns when no sections detected", async () => {
    const record = await runSectionBalance({ text: "plain text only" });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("no_sections_detected");
  });

  it("warns for very short section", async () => {
    const record = await runSectionBalance({ text: "[Intro]\nTiny" });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("section_very_short");
  });

  it("returns result_units sections", async () => {
    const record = await runSectionBalance({ text: "[Intro]\nA longer opening section for Caleb." });

    expect(record.result_units).toBe("sections");
  });
});

async function runSectionBalance(input_payload: JsonObject) {
  const registry = new HollowRegistry([sectionBalanceManifest]);
  const runner = new HollowRunner(registry, {
    [sectionBalanceManifest.hollow_id]: sectionBalanceImplementation,
  });

  return await runner.run({
    hollow_id: sectionBalanceManifest.hollow_id,
    input_payload,
    task_id: "task_text_section_balance",
    run_id: "run_text_section_balance",
    trace_id: "trace_text_section_balance",
    invocation_id: "invocation_text_section_balance",
  });
}
