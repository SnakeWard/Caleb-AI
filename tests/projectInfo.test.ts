import { describe, expect, it } from "vitest";

import { projectInfo } from "../src/project/projectInfo.js";

describe("projectInfo", () => {
  it("exposes Caleb AI Pass 00 identity", () => {
    expect(projectInfo.name).toBe("Caleb AI");
    expect(projectInfo.doctrine).toBe("Models think. Hollows work. Caleb orchestrates.");
    expect(projectInfo.currentPhase).toBe("Pass 00 - Repository Setup");
  });
});
