import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { handleCliCommand, parseCliArgs } from "../../src/cli/index.js";
import { runSnapshotClaimIntegrityGate } from "../../src/index.js";

const root = new URL("../../", import.meta.url);

function file(path: string): string {
  return fileURLToPath(new URL(path, root));
}

function read(path: string): string {
  return readFileSync(new URL(path, root), "utf8");
}

const DOC = "docs/SNAPSHOT_CLAIM_INTEGRITY_GATE.md";

describe("snapshot claim integrity gate acceptance", () => {
  it("creates required R37 files", () => {
    const required = [
      "src/changeGuard/snapshotClaimIntegrityTypes.ts",
      "src/changeGuard/snapshotClaimIntegrityValidator.ts",
      "tests/changeGuard/snapshotClaimIntegrityValidator.test.ts",
      "tests/acceptance/snapshotClaimIntegrityGateAcceptance.test.ts",
      DOC
    ];
    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents exact title and deterministic gate status", () => {
    const doc = read(DOC);
    expect(doc).toContain("# Snapshot Claim Integrity Gate");
    expect(doc).toContain("Status: Deterministic integrity gate");
  });

  it("names R36 fabricated snapshot claim as the prior incident", () => {
    const doc = read(DOC);
    expect(doc).toContain("Prior incident: R36 fabricated snapshot claim caught and corrected");
  });

  it("states manual validation is converted into deterministic acceptance", () => {
    const doc = read(DOC);
    expect(doc).toContain("This converts manual validation into deterministic acceptance.");
  });

  it("states no provider behavior, SDK/package, credential, network, live execution, or UI is added", () => {
    const doc = read(DOC);
    expect(doc).toContain("This is not a provider feature.");
    expect(doc).toContain(
      "R37 does not add live execution, network calls, API-key reads, `process.env` reads, a provider SDK, a package dependency change, or a UI."
    );
  });

  it("states catalog invariants", () => {
    const doc = read(DOC);
    expect(doc).toContain("V1 Hollow catalog remains 12.");
    expect(doc).toContain("Hollowcut catalog remains 9.");
  });

  it("contains exact final verdict", () => {
    const doc = read(DOC);
    expect(doc).toContain("Snapshot Claim Integrity Gate: Accepted");
    expect(doc).toContain(
      "Status: Snapshot reference integrity locked; fabricated snapshot claims are structurally detectable"
    );
    expect(doc).toContain("Next phase: One provider adapter live prerequisites CLI surface");
  });

  it("updates PLANS.md with R37", () => {
    expect(read("PLANS.md")).toContain("R37");
  });

  it("the actual validator passes against the real repo PLANS.md and snapshot directory", () => {
    const report = runSnapshotClaimIntegrityGate();
    expect(report.passed).toBe(true);
    expect(report.missing_snapshot_ids).toEqual([]);
    expect(report.invalid_snapshot_claims).toEqual([]);
  });

  it("keeps production catalog counts unchanged", async () => {
    const v1 = await handleCliCommand(parseCliArgs(["list-hollows", "--json"]));
    const hollowcut = await handleCliCommand(parseCliArgs(["list-hollowcut-hollows", "--json"]));
    const v1Data = v1.data as { hollows: unknown[] };
    const hollowcutData = hollowcut.data as { hollows: unknown[] };
    expect(v1.ok).toBe(true);
    expect(v1Data.hollows).toHaveLength(14);
    expect(hollowcut.ok).toBe(true);
    expect(hollowcutData.hollows).toHaveLength(9);
  });
});
