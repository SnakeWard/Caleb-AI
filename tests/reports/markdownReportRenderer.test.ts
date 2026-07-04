import { describe, expect, it } from "vitest";

import { buildCalebReport, renderCalebReportMarkdown } from "../../src/reports/index.js";
import { createEvidence, createInvocation, createLedgerEntry } from "./reportBuilder.test.js";

describe("markdown report renderer", () => {
  it("renderCalebReportMarkdown includes H1 title", () => {
    expect(renderFixture()).toContain("# Caleb Test Report");
  });

  it("includes report metadata", () => {
    const markdown = renderFixture();

    expect(markdown).toContain("| report_id | report_fixed |");
    expect(markdown).toContain("| generated_at | 2026-06-06T00:00:00.000Z |");
  });

  it("includes summary", () => {
    expect(renderFixture()).toContain("highest trust tier seen");
  });

  it("includes stats table", () => {
    expect(renderFixture()).toContain("| Metric | Value |");
    expect(renderFixture()).toContain("| evidence_packet_count | 1 |");
  });

  it("includes warnings when present", () => {
    expect(renderFixture()).toContain("Warnings");
    expect(renderFixture()).toContain("warning_001");
  });

  it("includes errors when present", () => {
    expect(renderFixture()).toContain("Errors");
    expect(renderFixture()).toContain("error_001");
  });

  it("includes Hollow invocation section when present", () => {
    expect(renderFixture()).toContain("## Hollow Invocations");
    expect(renderFixture()).toContain("invocation_001");
  });

  it("includes Evidence packet section when present", () => {
    expect(renderFixture()).toContain("## Evidence Packets");
    expect(renderFixture()).toContain("can_model_consume");
  });

  it("includes Ledger entry section when present", () => {
    expect(renderFixture()).toContain("## Ledger Entries");
    expect(renderFixture()).toContain("ledger_001");
  });

  it("includes provenance section", () => {
    expect(renderFixture()).toContain("## Provenance");
    expect(renderFixture()).toContain("CalebReportBuilder");
  });

  it("bounds very long text output", () => {
    const longMessage = "x".repeat(600);
    const report = buildCalebReport({
      report_id: "report_fixed",
      generated_at: "2026-06-06T00:00:00.000Z",
      title: "Caleb Test Report",
      invocations: [
        createInvocation({
          warnings: [{ warning_id: "warning_long", message: longMessage, severity: "warning" }]
        })
      ]
    });

    const markdown = renderCalebReportMarkdown(report);

    expect(markdown).not.toContain(longMessage);
    expect(markdown).toContain("...");
  });

  it("output is stable for the same report input", () => {
    const report = createReport();

    expect(renderCalebReportMarkdown(report)).toBe(renderCalebReportMarkdown(report));
  });
});

function renderFixture(): string {
  return renderCalebReportMarkdown(createReport());
}

function createReport() {
  return buildCalebReport({
    report_id: "report_fixed",
    generated_at: "2026-06-06T00:00:00.000Z",
    title: "Caleb Test Report",
    invocations: [
      createInvocation({
        warnings: [{ warning_id: "warning_001", message: "Careful.", severity: "warning" }],
        errors: [{ error_id: "error_001", message: "Nope.", severity: "error", retryable: false }]
      })
    ],
    evidence_packets: [createEvidence({ ledger_refs: ["ledger_001"] })],
    ledger_entries: [createLedgerEntry()]
  });
}
