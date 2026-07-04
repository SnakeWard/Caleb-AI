import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const reportPath = "docs/ROLE_ARTIFACT_CONTRACT_LAYER_ACCEPTANCE_REPORT.md";
const exactVerdict = `Role Artifact Contract Layer R1-R6: Accepted
Status: Static role artifact contract foundation complete
Next phase: Runtime/Storage Planning Boundary`;

describe("Role Artifact Contract Layer acceptance report", () => {
  it("exists and contains the exact acceptance verdict", async () => {
    const report = await readFile(reportPath, "utf8");

    expect(report).toContain(exactVerdict);
  });

  it("contains required explicit exclusions", async () => {
    const report = await readFile(reportPath, "utf8");

    for (const exclusion of [
      "role execution",
      "model calls",
      "artifact storage",
      "Ledger integration",
      "enterprise readiness",
      "production readiness"
    ]) {
      expect(report).toContain(exclusion);
    }
  });
});
