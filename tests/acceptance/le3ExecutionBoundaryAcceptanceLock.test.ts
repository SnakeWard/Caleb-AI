import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS, V1_HOLLOW_MANIFESTS } from "../../src/hollows/index.js";
import { isAllowedRouteInputKind } from "../../src/logicEngine/routeInputGate.js";

const REPORT_PATH = "docs/LE3_EXECUTION_BOUNDARY_ACCEPTANCE_REPORT.md";
const DIAGNOSTIC_PATH = "docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md";
const SEAM_PATH = "src/logicEngine/rotationExecutionSeam.ts";
const ACCEPTANCE_PATH = "tests/acceptance/le3GuardedExecutionAcceptance.test.ts";

const ABSENCE_LOCK =
  "Live execution, dynamic sequencing, capability-bearing plans, and route-selection\n" +
  "integration are ABSENT; each may return only via its own named future pass with a\n" +
  "visible amendment to this lock.";

const DETECTORS = [
  "Detector 1 — no L1 widening: derived plans and execution results are rejected as route inputs",
  "Detector 2 — no provider path: seam/executor module graph contains only mock role binding",
  "Detector 3 — no prose-driven branching: prose-only variants preserve execution structure",
  "Detector 4 — no unledgered execution: suppression runs zero roles and completed runs account for every role"
] as const;

const REFUSALS = [
  "seam_rejected_human_confirmation_required",
  "seam_rejected_unbridged_plan",
  "seam_rejected_invalid_plan",
  "seam_rejected_authorship",
  "seam_rejected_non_mock_binding",
  "seam_rejected_mock_adapter_unavailable",
  "seam_rejected_ledger_unavailable"
] as const;

const L1_ALLOWLIST = [
  "contract_validated_task_frame",
  "verified_signal_frame",
  "engine_internal_state",
  "deterministic_hollow_signal",
  "accepted_gate_policy_result",
  "human_pat_approval_record",
  "snapshot_change_guard_state",
  "lineage_resolved_decision_facing_record"
] as const;

describe("LE-3-A execution boundary acceptance lock", () => {
  it("pins both acceptance verdicts and the exact absence statement", async () => {
    const report = await readFile(REPORT_PATH, "utf8");

    assertLockedReport(report);
    expect(report).toContain(
      "LE-3 Guarded Execution Seam: Accepted — Caleb rotates: bridged plans only,\n" +
        "human-initiated, every step ledgered, the chain reconstructs from the record\n" +
        "alone."
    );
    expect(report).toContain(
      "LE-3-A Execution Boundary Lock: Accepted — the first rotation's guardrails are\n" +
        "now a protected surface."
    );
  });

  it("pins bridged-only, human-only, mandatory-Ledger, and mock-only seam checks", async () => {
    const seam = await readFile(SEAM_PATH, "utf8");

    expect(seam).toContain('entry.activity !== "runtime_rotation_plan_bridge"');
    expect(seam).toContain("input.human_confirmed !== true");
    expect(seam).toContain("append_ledger_entry: RotationExecutionLedgerAppender");
    expect(seam).toContain('adapter_kind !== "mock"');
    for (const refusal of REFUSALS) {
      expect(seam).toContain(refusal);
    }
  });

  it("pins the CLI as the only production caller", async () => {
    const sourceFiles = (await readdir("src", { recursive: true }))
      .filter((path) => path.endsWith(".ts"))
      .map((path) => path.replaceAll("\\", "/"));
    const callers: string[] = [];

    for (const relativePath of sourceFiles) {
      const text = await readFile(join("src", relativePath), "utf8");
      if (text.includes("executeBridgedRotationAtSeam(")) {
        callers.push(`src/${relativePath}`);
      }
    }

    expect(callers.sort()).toEqual([
      "src/cli/commandHandlers.ts",
      "src/logicEngine/rotationExecutionSeam.ts"
    ]);
  });

  it("pins all four detectors by exact name", async () => {
    const acceptance = await readFile(ACCEPTANCE_PATH, "utf8");
    const report = await readFile(REPORT_PATH, "utf8");

    for (const detector of DETECTORS) {
      expect(acceptance).toContain(detector);
      expect(report).toContain(detector);
    }
  });

  it("pins reconstructability to one LIVE-F2 execution identity", async () => {
    const acceptance = await readFile(ACCEPTANCE_PATH, "utf8");
    const seam = await readFile(SEAM_PATH, "utf8");
    const report = await readFile(REPORT_PATH, "utf8");

    expect(acceptance).toContain("fixture.plan.plan_id,\n      result.execution_id");
    expect(seam).toContain('refusal_code: "reconstruction_ambiguous"');
    expect(seam).toContain("provenanceExecutionId === selectedExecutionId");
    expect(report).toContain(
      "the LE-3-A reconstructability\npin remains accepted under execution-keyed lookup"
    );
  });

  it("pins the RA-R1-D 15-row table verbatim", async () => {
    const report = await readFile(REPORT_PATH, "utf8");
    const diagnostic = await readFile(DIAGNOSTIC_PATH, "utf8");

    const reportTable = extractClassificationTable(report);
    const diagnosticTable = extractClassificationTable(diagnostic);
    expect(reportTable).toBe(diagnosticTable);
    expect(reportTable.split("\n").filter((line) => /^\| \d+ \|/.test(line))).toHaveLength(15);
  });

  it("pins the L1 allowlist and catalog counts", async () => {
    const report = await readFile(REPORT_PATH, "utf8");
    // Historical LE-3 report documents the pre-RA-X-3 seven; runtime allowlist is eight.
    const historicalSeven = L1_ALLOWLIST.filter(
      (kind) => kind !== "lineage_resolved_decision_facing_record"
    );
    for (const kind of historicalSeven) {
      expect(report).toContain(kind);
    }
    for (const kind of L1_ALLOWLIST) {
      expect(isAllowedRouteInputKind(kind)).toBe(true);
    }
    expect(L1_ALLOWLIST).toHaveLength(8);
    expect(isAllowedRouteInputKind("derived_rotation_plan")).toBe(false);
    expect(isAllowedRouteInputKind("rotation_execution_result")).toBe(false);
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });

  it("demonstrates the lock fires on synthetic weakening and removes it", async () => {
    const canonical = await readFile(REPORT_PATH, "utf8");
    const syntheticWeakening = canonical.replace(
      "Caleb rotates: bridged plans only",
      "Caleb rotates: unverified plans permitted"
    );

    expect(() => assertLockedReport(syntheticWeakening)).toThrow("bridged plans only");
    expect(() => assertLockedReport(canonical)).not.toThrow();
    expect(await readFile(REPORT_PATH, "utf8")).toBe(canonical);
  });
});

function assertLockedReport(report: string): void {
  for (const required of [
    "bridged plans only",
    "Human-initiated only",
    "Mandatory Ledger",
    "Mock-only binding",
    ABSENCE_LOCK,
    ...DETECTORS
  ]) {
    if (!report.includes(required)) {
      throw new Error(`LE-3-A lock missing required text: ${required}`);
    }
  }
}

function extractClassificationTable(source: string): string {
  const start = source.indexOf("| # | Check | Code location | Classification |");
  if (start < 0) {
    throw new Error("RA-R1-D classification table header is absent");
  }
  const after = source.slice(start);
  const end = after.indexOf("\n\n");
  if (end < 0) {
    throw new Error("RA-R1-D classification table terminator is absent");
  }
  return after.slice(0, end);
}
