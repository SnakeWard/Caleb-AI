import { describe, expect, it } from "vitest";

import {
  buildCalebReport,
  parseCalebReportJson,
  renderCalebReportJson,
  ReportParseError
} from "../../src/reports/index.js";
import { createEvidence } from "./reportBuilder.test.js";

describe("JSON report renderer", () => {
  it("renderCalebReportJson returns valid JSON", () => {
    const json = renderCalebReportJson(createReport());

    expect(JSON.parse(json)).toMatchObject({ report_id: "report_fixed" });
  });

  it("JSON output is pretty printed", () => {
    const json = renderCalebReportJson(createReport());

    expect(json).toContain('\n  "report_id": "report_fixed"');
  });

  it("parseCalebReportJson parses a rendered report", () => {
    const parsed = parseCalebReportJson(renderCalebReportJson(createReport()));

    expect(parsed.report_id).toBe("report_fixed");
  });

  it("parseCalebReportJson throws on invalid JSON", () => {
    expect(() => parseCalebReportJson("{")).toThrow(ReportParseError);
  });

  it("roundtrip preserves report_id", () => {
    const parsed = parseCalebReportJson(renderCalebReportJson(createReport()));

    expect(parsed.report_id).toBe("report_fixed");
  });

  it("roundtrip preserves stats", () => {
    const report = createReport();
    const parsed = parseCalebReportJson(renderCalebReportJson(report));

    expect(parsed.stats).toEqual(report.stats);
  });
});

function createReport() {
  return buildCalebReport({
    report_id: "report_fixed",
    generated_at: "2026-06-06T00:00:00.000Z",
    evidence_packets: [createEvidence()]
  });
}
