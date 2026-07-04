import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateSnapshotClaimIntegrity,
  runSnapshotClaimIntegrityGate
} from "../../src/index.js";

const createdAt = "2026-07-04T00:00:00.000Z";

describe("snapshot claim integrity validator (pure evaluator)", () => {
  it("passes when all claimed snapshot IDs exist", () => {
    const report = evaluateSnapshotClaimIntegrity({
      plans_md_content: "Pre-change snapshot `snap_20260704T000000000Z_000001_milestone` created.",
      existing_snapshot_ids: ["snap_20260704T000000000Z_000001_milestone"],
      created_at: createdAt
    });
    expect(report.passed).toBe(true);
    expect(report.missing_snapshot_ids).toEqual([]);
    expect(report.claimed_snapshot_ids).toEqual(["snap_20260704T000000000Z_000001_milestone"]);
  });

  it("fails and reports missing claimed snapshot IDs", () => {
    const report = evaluateSnapshotClaimIntegrity({
      plans_md_content: "Pre-change snapshot `snap_20260704T000000000Z_000002_milestone` created.",
      existing_snapshot_ids: ["snap_20260704T000000000Z_000001_milestone"],
      created_at: createdAt
    });
    expect(report.passed).toBe(false);
    expect(report.missing_snapshot_ids).toEqual(["snap_20260704T000000000Z_000002_milestone"]);
    expect(report.errors.some((error) => error.includes("snap_20260704T000000000Z_000002_milestone"))).toBe(true);
  });

  it("reports invalid snapshot ID formats", () => {
    const report = evaluateSnapshotClaimIntegrity({
      plans_md_content: "Bad claim `snap-2026-07-04-milestone` should be flagged.",
      existing_snapshot_ids: [],
      created_at: createdAt
    });
    expect(report.passed).toBe(false);
    expect(report.invalid_snapshot_claims).toEqual(["snap-2026-07-04-milestone"]);
  });

  it("reports duplicate snapshot claims as warnings without failing the gate", () => {
    const report = evaluateSnapshotClaimIntegrity({
      plans_md_content:
        "First reference `snap_20260704T000000000Z_000001_milestone`. Second reference `snap_20260704T000000000Z_000001_milestone`.",
      existing_snapshot_ids: ["snap_20260704T000000000Z_000001_milestone"],
      created_at: createdAt
    });
    expect(report.duplicate_snapshot_claims).toEqual(["snap_20260704T000000000Z_000001_milestone"]);
    expect(report.passed).toBe(true);
  });

  it("allows explicitly documented missing snapshot exceptions", () => {
    const report = evaluateSnapshotClaimIntegrity({
      plans_md_content: "Historical claim `snap_20260610T005359834Z_milestone` predates sequencing.",
      existing_snapshot_ids: [],
      allowed_missing_snapshot_ids: ["snap_20260610T005359834Z_milestone"],
      created_at: createdAt
    });
    expect(report.passed).toBe(true);
    expect(report.missing_snapshot_ids).toEqual([]);
    expect(report.allowed_missing_snapshot_ids).toEqual(["snap_20260610T005359834Z_milestone"]);
  });

  it("does not fail on an allowed-missing ID even though it is absent on disk", () => {
    const report = evaluateSnapshotClaimIntegrity({
      plans_md_content: "`snap_absent_milestone` is a documented historical exception.",
      existing_snapshot_ids: [],
      allowed_missing_snapshot_ids: ["snap_absent_milestone"],
      created_at: createdAt
    });
    expect(report.missing_snapshot_ids).toEqual([]);
  });

  it("report shape contains all required fields", () => {
    const report = evaluateSnapshotClaimIntegrity({
      plans_md_content: "no claims here",
      existing_snapshot_ids: [],
      created_at: createdAt
    });
    const requiredFields = [
      "report_id",
      "validator_id",
      "checked_file",
      "snapshot_root",
      "claimed_snapshot_ids",
      "existing_snapshot_ids",
      "missing_snapshot_ids",
      "invalid_snapshot_claims",
      "duplicate_snapshot_claims",
      "allowed_missing_snapshot_ids",
      "passed",
      "errors",
      "warnings",
      "created_at"
    ];
    for (const field of requiredFields) expect(report).toHaveProperty(field);
  });
});

describe("snapshot claim integrity validator (real repo wrapper)", () => {
  it("does not mutate PLANS.md", () => {
    const before = readFileSync("PLANS.md", "utf8");
    runSnapshotClaimIntegrityGate();
    const after = readFileSync("PLANS.md", "utf8");
    expect(after).toBe(before);
  });

  it("does not create snapshots", () => {
    const before = readdirSync(".caleb/snapshots").length;
    runSnapshotClaimIntegrityGate();
    const after = readdirSync(".caleb/snapshots").length;
    expect(after).toBe(before);
  });

  it("evaluates the real PLANS.md against real .caleb/snapshots without error", () => {
    const report = runSnapshotClaimIntegrityGate();
    expect(report.checked_file).toBe("PLANS.md");
    expect(report.snapshot_root).toBe(".caleb/snapshots");
    expect(Array.isArray(report.claimed_snapshot_ids)).toBe(true);
    expect(report.existing_snapshot_ids.length).toBeGreaterThan(0);
  });

  it("does not read process.env or require network", () => {
    const source = [
      readFileSync("src/changeGuard/snapshotClaimIntegrityValidator.ts", "utf8"),
      readFileSync("src/changeGuard/snapshotClaimIntegrityTypes.ts", "utf8")
    ].join("\n");
    expect(source).not.toMatch(/process\.env/);
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
  });
});
