import { describe, expect, it } from "vitest";

import {
  countTimelineIssuesBySeverity,
  createEmptyTimelineValidationSummary,
  createTimelineValidationCheck,
  createTimelineValidationIssue,
  createTimelineValidationResult,
  getTimelineValidationStatus,
  mergeTimelineValidationIssues
} from "../../../src/hollowcut/timeline/index.js";

describe("timeline validation helpers", () => {
  it("creates warning issue", () => {
    const issue = createTimelineValidationIssue("timeline", "warning", "timeline_warning", "Timeline warning.");

    expect(issue.severity).toBe("warning");
  });

  it("creates error issue", () => {
    const issue = createTimelineValidationIssue("timeline", "error", "timeline_error", "Timeline error.", {
      item_ids: ["item_1"]
    });

    expect(issue.item_ids).toEqual(["item_1"]);
  });

  it("counts issues by severity", () => {
    const counts = countTimelineIssuesBySeverity([
      createTimelineValidationIssue("a", "warning", "warn", "Warning."),
      createTimelineValidationIssue("b", "error", "err", "Error.")
    ]);

    expect(counts).toEqual({ warning_count: 1, error_count: 1 });
  });

  it("returns valid status for no issues", () => {
    expect(getTimelineValidationStatus(0, 0)).toBe("valid");
  });

  it("returns warnings status for warnings only", () => {
    expect(getTimelineValidationStatus(2, 0)).toBe("warnings");
  });

  it("returns invalid status for errors", () => {
    expect(getTimelineValidationStatus(0, 1)).toBe("invalid");
  });

  it("creates result with correct valid boolean", () => {
    const result = createTimelineValidationResult({
      checks: [createTimelineValidationCheck("schema", "fail", "Schema failed.", ["bad_schema"])],
      issues: [createTimelineValidationIssue("timeline", "error", "bad_schema", "Bad schema.")]
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("invalid");
  });

  it("merges issues without mutating original arrays", () => {
    const first = [createTimelineValidationIssue("a", "warning", "a", "A.", { item_ids: ["item_a"] })];
    const second = [createTimelineValidationIssue("b", "error", "b", "B.")];
    const merged = mergeTimelineValidationIssues(first, second);

    expect(merged).toHaveLength(2);
    expect(first).toHaveLength(1);
    expect(merged[0]).not.toBe(first[0]);
  });

  it("creates empty summary with nulls/counts", () => {
    const summary = createEmptyTimelineValidationSummary();

    expect(summary.timeline_id).toBeNull();
    expect(summary.item_count).toBe(0);
    expect(summary.warning_count).toBe(0);
  });

  it("helper does not assign trust or Ledger refs", () => {
    const result = createTimelineValidationResult({ issues: [] });
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain("trust_tier");
    expect(serialized).not.toContain("ledger_refs");
  });
});
