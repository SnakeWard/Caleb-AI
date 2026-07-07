import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const HOLLOW_SOURCE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../src/hollows/audit/passComplianceCheck.ts"
);

describe("pass compliance Hollow purity regression (AUD-2)", () => {
  const source = readFileSync(HOLLOW_SOURCE, "utf8");

  it("does not import child_process", () => {
    expect(source).not.toMatch(/from\s+["']node:child_process["']/);
    expect(source).not.toMatch(/require\(["']child_process["']\)/);
  });

  it("does not import node:fs", () => {
    expect(source).not.toMatch(/from\s+["']node:fs/);
  });

  it("does not reference git execution", () => {
    expect(source.toLowerCase()).not.toContain("execsync");
    expect(source.toLowerCase()).not.toContain("spawn");
    expect(source.toLowerCase()).not.toContain("git ");
  });

  it("does not use Math.random or randomUUID", () => {
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("randomUUID");
  });
});