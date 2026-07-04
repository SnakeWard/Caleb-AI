import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPORT_PATH = join(process.cwd(), "docs", "LOGIC_ENGINE_V0_FUNCTIONAL_CORE_ACCEPTANCE_REPORT.md");

describe("Logic Engine V0 functional core acceptance report", () => {
  it("exists and contains the exact acceptance verdict", async () => {
    const report = await readFile(REPORT_PATH, "utf8");

    expect(report).toContain("Logic Engine V0 Functional Core: Accepted");
    expect(report).toContain("Status: Deterministic orchestration foundation complete");
    expect(report).toContain("Next phase: Role Artifact Contract Layer");
  });

  it("locks explicit exclusions", async () => {
    const report = await readFile(REPORT_PATH, "utf8");

    expect(report).toContain("- role execution");
    expect(report).toContain("- model calls");
    expect(report).toContain("- enterprise readiness");
    expect(report).toContain("- production readiness");
  });
});
