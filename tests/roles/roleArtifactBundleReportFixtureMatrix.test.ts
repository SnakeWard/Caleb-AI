import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { validateRoleArtifactBundleConsistencyReport } from "../../src/roles/index.js";

const matrixDir = join("examples", "roles", "reports", "matrix");

const fixtureFiles = {
  clean: "role-artifact-bundle-consistency-report.clean.valid.json",
  warning: "role-artifact-bundle-consistency-report.warning.valid.json",
  blocked: "role-artifact-bundle-consistency-report.blocked.valid.json",
  invalidState: "role-artifact-bundle-consistency-report.invalid-state.valid.json"
} as const;

type FixtureKey = keyof typeof fixtureFiles;

describe("role artifact bundle report fixture matrix", () => {
  it("clean fixture parses", async () => {
    await expect(readFixture("clean")).resolves.toBeDefined();
  });

  it("warning fixture parses", async () => {
    await expect(readFixture("warning")).resolves.toBeDefined();
  });

  it("blocked fixture parses", async () => {
    await expect(readFixture("blocked")).resolves.toBeDefined();
  });

  it("invalid-state fixture parses", async () => {
    await expect(readFixture("invalidState")).resolves.toBeDefined();
  });

  it("clean fixture validates", async () => {
    expect(validateRoleArtifactBundleConsistencyReport(await readFixture("clean"))).toEqual({ ok: true, errors: [] });
  });

  it("warning fixture validates", async () => {
    expect(validateRoleArtifactBundleConsistencyReport(await readFixture("warning"))).toEqual({ ok: true, errors: [] });
  });

  it("blocked fixture validates", async () => {
    expect(validateRoleArtifactBundleConsistencyReport(await readFixture("blocked"))).toEqual({ ok: true, errors: [] });
  });

  it("invalid-state fixture validates", async () => {
    expect(validateRoleArtifactBundleConsistencyReport(await readFixture("invalidState"))).toEqual({ ok: true, errors: [] });
  });

  it("clean fixture has report_status clean", async () => {
    expect((await readFixture("clean"))["report_status"]).toBe("clean");
  });

  it("clean fixture has validation_status valid", async () => {
    expect((await readFixture("clean"))["validation_status"]).toBe("valid");
  });

  it("clean fixture has bundle_status complete", async () => {
    expect((await readFixture("clean"))["bundle_status"]).toBe("complete");
  });

  it("clean fixture has all checks pass", async () => {
    expect(getChecks(await readFixture("clean")).every((check) => check["status"] === "pass")).toBe(true);
  });

  it("clean fixture has no warning/error/critical findings", async () => {
    const severities = getFindings(await readFixture("clean")).map((finding) => finding["severity"]);
    expect(severities).not.toContain("warning");
    expect(severities).not.toContain("error");
    expect(severities).not.toContain("critical");
  });

  it("clean fixture has warnings []", async () => {
    expect((await readFixture("clean"))["warnings"]).toEqual([]);
  });

  it("warning fixture has report_status warning", async () => {
    expect((await readFixture("warning"))["report_status"]).toBe("warning");
  });

  it("warning fixture has validation_status valid", async () => {
    expect((await readFixture("warning"))["validation_status"]).toBe("valid");
  });

  it("warning fixture has at least one warn check", async () => {
    expect(getChecks(await readFixture("warning")).some((check) => check["status"] === "warn")).toBe(true);
  });

  it("warning fixture has at least one warning finding", async () => {
    expect(getFindings(await readFixture("warning")).some((finding) => finding["severity"] === "warning")).toBe(true);
  });

  it("warning fixture has warnings length greater than 0", async () => {
    expect(((await readFixture("warning"))["warnings"] as unknown[]).length).toBeGreaterThan(0);
  });

  it("warning fixture has no error/critical findings", async () => {
    const severities = getFindings(await readFixture("warning")).map((finding) => finding["severity"]);
    expect(severities).not.toContain("error");
    expect(severities).not.toContain("critical");
  });

  it("blocked fixture has report_status blocked", async () => {
    expect((await readFixture("blocked"))["report_status"]).toBe("blocked");
  });

  it("blocked fixture has validation_status valid", async () => {
    expect((await readFixture("blocked"))["validation_status"]).toBe("valid");
  });

  it("blocked fixture has bundle_status blocked", async () => {
    expect((await readFixture("blocked"))["bundle_status"]).toBe("blocked");
  });

  it("blocked fixture has handoff_gate_summary.blocked_count greater than 0", async () => {
    expect(getHandoffSummary(await readFixture("blocked"))["blocked_count"]).toBeGreaterThan(0);
  });

  it("blocked fixture has fail or warn check", async () => {
    expect(getChecks(await readFixture("blocked")).some((check) => check["status"] === "fail" || check["status"] === "warn")).toBe(true);
  });

  it("blocked fixture has at least one error finding", async () => {
    expect(getFindings(await readFixture("blocked")).some((finding) => finding["severity"] === "error")).toBe(true);
  });

  it("invalid-state fixture has report_status invalid", async () => {
    expect((await readFixture("invalidState"))["report_status"]).toBe("invalid");
  });

  it("invalid-state fixture has validation_status invalid", async () => {
    expect((await readFixture("invalidState"))["validation_status"]).toBe("invalid");
  });

  it("invalid-state fixture has bundle_status invalid", async () => {
    expect((await readFixture("invalidState"))["bundle_status"]).toBe("invalid");
  });

  it("invalid-state fixture has handoff_gate_summary.invalid_count greater than 0", async () => {
    expect(getHandoffSummary(await readFixture("invalidState"))["invalid_count"]).toBeGreaterThan(0);
  });

  it("invalid-state fixture has at least one fail check", async () => {
    expect(getChecks(await readFixture("invalidState")).some((check) => check["status"] === "fail")).toBe(true);
  });

  it("invalid-state fixture has at least one critical or error finding", async () => {
    expect(
      getFindings(await readFixture("invalidState")).some(
        (finding) => finding["severity"] === "critical" || finding["severity"] === "error"
      )
    ).toBe(true);
  });

  it("every fixture is summary-only", async () => {
    for (const fixture of await readAllFixtures()) {
      expect(validateRoleArtifactBundleConsistencyReport(fixture)).toEqual({ ok: true, errors: [] });
      expect(hasAnyKey(fixture, ["artifact_refs", "handoff_gate_refs", "claims"])).toBe(false);
    }
  });

  it("no fixture contains artifact_refs", async () => {
    await expectNoFixtureKey("artifact_refs");
  });

  it("no fixture contains handoff_gate_refs", async () => {
    await expectNoFixtureKey("handoff_gate_refs");
  });

  it("no fixture contains claims", async () => {
    await expectNoFixtureKey("claims");
  });

  it("no fixture embeds bundle/artifact/handoff/gate result objects", async () => {
    for (const fixture of await readAllFixtures()) {
      expect(hasAnyKey(fixture, ["bundle", "artifact", "source_artifact", "handoff", "handoff_result"])).toBe(false);
    }
  });

  it("no fixture contains telemetry_trace", async () => {
    await expectNoFixtureKey("telemetry_trace");
  });

  it("no fixture contains execution_context", async () => {
    await expectNoFixtureKey("execution_context");
  });

  it("no fixture contains hollow_input", async () => {
    await expectNoFixtureKey("hollow_input");
  });

  it("no fixture contains input_payload", async () => {
    await expectNoFixtureKey("input_payload");
  });

  it("no fixture contains chain_of_thought", async () => {
    await expectNoFixtureKey("chain_of_thought");
  });

  it("no fixture contains chainOfThought", async () => {
    await expectNoFixtureKey("chainOfThought");
  });

  it("no fixture contains private_reasoning", async () => {
    await expectNoFixtureKey("private_reasoning");
  });

  it("no fixture contains scratchpad", async () => {
    await expectNoFixtureKey("scratchpad");
  });
});

describe("role artifact bundle report fixture matrix isolation locks", () => {
  it("test file does not import reportBuilder", async () => {
    const source = await readFile("tests/roles/roleArtifactBundleReportFixtureMatrix.test.ts", "utf8");
    expect(importLines(source).some((line) => line.includes("reportBuilder"))).toBe(false);
  });

  it("test file does not import src/reports", async () => {
    const source = await readFile("tests/roles/roleArtifactBundleReportFixtureMatrix.test.ts", "utf8");
    expect(importLines(source).some((line) => /from\s+["'][^"']*reports/i.test(line))).toBe(false);
  });

  it("src/roles production source does not import reportBuilder", async () => {
    const sources = await readRoleProductionSources();
    expect(sources.some((source) => source.includes("reportBuilder"))).toBe(false);
  });

  it("src/roles production source does not import src/reports", async () => {
    const sources = await readRoleProductionSources();
    expect(sources.some((source) => /from\s+["'][^"']*reports/i.test(source))).toBe(false);
  });

  it("no CLI flags added", async () => {
    const source = await readFile("src/cli/commandParser.ts", "utf8");

    expect(source).not.toContain("--role");
    expect(source).not.toContain("--role-artifact");
    expect(source).not.toContain("--role-contract");
    expect(source).not.toContain("--role-handoff");
    expect(source).not.toContain("--role-bundle");
    expect(source).not.toContain("--role-report");
  });

  it("V1 catalog remains exactly 12", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
  });

  it("Hollowcut catalog remains exactly 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

async function readFixture(key: FixtureKey): Promise<Record<string, unknown>> {
  const raw = await readFile(join(matrixDir, fixtureFiles[key]), "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

async function readAllFixtures(): Promise<Record<string, unknown>[]> {
  return Promise.all((Object.keys(fixtureFiles) as FixtureKey[]).map((key) => readFixture(key)));
}

function getChecks(fixture: Record<string, unknown>): Record<string, unknown>[] {
  return fixture["consistency_checks"] as Record<string, unknown>[];
}

function getFindings(fixture: Record<string, unknown>): Record<string, unknown>[] {
  return fixture["findings"] as Record<string, unknown>[];
}

function getHandoffSummary(fixture: Record<string, unknown>): Record<string, number> {
  return fixture["handoff_gate_summary"] as Record<string, number>;
}

async function expectNoFixtureKey(key: string): Promise<void> {
  for (const fixture of await readAllFixtures()) {
    expect(hasKey(fixture, key), key).toBe(false);
  }
}

function hasAnyKey(value: unknown, keys: readonly string[]): boolean {
  return keys.some((key) => hasKey(value, key));
}

function hasKey(value: unknown, key: string): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => hasKey(entry, key));
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(value, key)) {
    return true;
  }
  return Object.values(value as Record<string, unknown>).some((entry) => hasKey(entry, key));
}

function importLines(source: string): string[] {
  return source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
}

async function readRoleProductionSources(): Promise<string[]> {
  const files = await collectFiles("src/roles");
  return Promise.all(files.filter((file) => file.endsWith(".ts")).map((file) => readFile(file, "utf8")));
}

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(path);
      }
      return [path];
    })
  );
  return nested.flat();
}
