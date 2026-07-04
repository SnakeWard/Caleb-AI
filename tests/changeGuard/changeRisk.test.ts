import { describe, expect, it } from "vitest";

import { classifyChangeRisk } from "../../src/changeGuard/index.js";

describe("change risk", () => {
  it("simple one-file docs change is low", () => {
    expect(classifyChangeRisk({ files_planned: ["README.md"], has_tests: true }).level).toBe("low");
  });

  it("dependency change is at least medium", () => {
    expect(classifyChangeRisk({ touches_dependencies: true, has_tests: true }).level).toBe("medium");
  });

  it("schema change is high", () => {
    expect(classifyChangeRisk({ touches_schema: true, has_tests: true }).level).toBe("high");
  });

  it("ledger change is high", () => {
    expect(classifyChangeRisk({ touches_ledger: true, has_tests: true }).level).toBe("high");
  });

  it("permission/side-effect change is critical", () => {
    expect(classifyChangeRisk({ touches_permissions: true, includes_side_effect: true, has_tests: true }).level).toBe("critical");
  });

  it("file deletion is critical", () => {
    expect(classifyChangeRisk({ includes_file_delete: true, has_tests: true }).level).toBe("critical");
  });

  it("many-file change is high", () => {
    expect(classifyChangeRisk({ touches_many_files: true, has_tests: true }).level).toBe("high");
  });

  it("missing tests raises risk for behavior change", () => {
    expect(classifyChangeRisk({ touches_ledger: true, has_tests: false }).level).toBe("critical");
  });
});
