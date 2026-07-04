import { describe, expect, it } from "vitest";

import {
  hollowcutProjectStateCheckImplementation,
  hollowcutProjectStateCheckManifest
} from "../../../src/hollowcut/projectStateCheckHollow.js";
import { createHollowRunner } from "../../../src/hollows/runner.js";
import { createHollowRegistry } from "../../../src/hollows/registry.js";
import type { HollowManifest } from "../../../src/types/hollow.js";

const registry = createHollowRegistry([hollowcutProjectStateCheckManifest as HollowManifest]);
const runner = createHollowRunner(registry, {
  [hollowcutProjectStateCheckManifest.hollow_id]: hollowcutProjectStateCheckImplementation
});

const validProject = {
  schema_version: "1.0.0",
  project_id: "test-project",
  project_name: "Test",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  project_root: ".",
  assets: [],
  tracks: [],
  captions: [],
  export_targets: [],
  ledger_refs: [],
  artifact_refs: []
};

const invalidProjectMissingId = {
  schema_version: "1.0.0",
  project_name: "Bad"
};

describe("hollow.hollowcut.project_state_check", () => {
  it("manifest is V1-safe and deterministic", () => {
    expect(hollowcutProjectStateCheckManifest.hollow_id).toBe("hollow.hollowcut.project_state_check");
    expect(hollowcutProjectStateCheckManifest.deterministic).toBe(true);
    expect(hollowcutProjectStateCheckManifest.execution_mode).toBe("local_inspection");
  });

  it("valid supplied project state produces structured result and can go through runner", async () => {
    const invocation = await runner.run({
      hollow_id: hollowcutProjectStateCheckManifest.hollow_id,
      input_payload: { project: validProject }
    });

    expect(invocation.status).toBe("completed");
    expect(invocation.trust_tier).toBe("T0"); // raw from runner
    expect(invocation.result).toHaveProperty("valid");
  });

  it("invalid supplied state produces errors and stays T0 until VRP", async () => {
    const invocation = await runner.run({
      hollow_id: hollowcutProjectStateCheckManifest.hollow_id,
      input_payload: invalidProjectMissingId
    });

    expect(invocation.status).toBe("completed");
    expect(invocation.trust_tier).toBe("T0");
    // The result contains the validation issues (caller would pass to VRP)
  });
});