import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { validateRoleArtifactReferenceBundle } from "../../src/roles/index.js";

function validBundle(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    bundle_id: "bundle_001",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    context_id: "context_001",
    artifact_refs: [
      {
        artifact_id: "artifact_planner_001",
        role_id: "planner",
        artifact_type: "plan",
        acceptance_status: "accepted"
      },
      {
        artifact_id: "artifact_implementer_001",
        role_id: "implementer",
        artifact_type: "implementation_notes",
        acceptance_status: "accepted"
      }
    ],
    handoff_gate_refs: [
      {
        source_role: "planner",
        target_role: "implementer",
        source_artifact_id: "artifact_planner_001",
        allowed: true,
        status: "allowed",
        error_codes: []
      }
    ],
    bundle_status: "complete",
    created_at: "2026-06-13T00:00:00.000Z",
    warnings: [],
    ...overrides
  };
}

function expectInvalid(code: string, bundle: unknown): void {
  const result = validateRoleArtifactReferenceBundle(bundle);

  expect(result.ok).toBe(false);
  expect(result.errors.some((error) => error.code === code)).toBe(true);
}

describe("validateRoleArtifactReferenceBundle", () => {
  it("accepts a minimal valid artifact reference bundle", () => {
    expect(validateRoleArtifactReferenceBundle(validBundle())).toEqual({ ok: true, errors: [] });
  });

  it("rejects null/array/non-object root", () => {
    expectInvalid("invalid_root", null);
    expectInvalid("invalid_root", []);
    expectInvalid("invalid_root", "nope");
  });

  it("rejects invalid schema_version", () => {
    expectInvalid("invalid_schema_version", validBundle({ schema_version: "9.9.9" }));
  });

  it("rejects missing bundle_id", () => {
    const bundle = validBundle();
    delete bundle["bundle_id"];
    expectInvalid("missing_required_field", bundle);
  });

  it("rejects missing task_id/run_id/trace_id/context_id", () => {
    for (const field of ["task_id", "run_id", "trace_id", "context_id"]) {
      const bundle = validBundle();
      delete bundle[field];
      expectInvalid("missing_required_field", bundle);
    }
  });

  it("rejects empty artifact_refs", () => {
    expectInvalid("empty_artifact_refs", validBundle({ artifact_refs: [] }));
  });

  it("rejects artifact_refs with unknown role_id", () => {
    expectInvalid(
      "unknown_role_id",
      validBundle({
        artifact_refs: [
          {
            artifact_id: "artifact_oracle_001",
            role_id: "oracle",
            artifact_type: "plan",
            acceptance_status: "accepted"
          }
        ],
        handoff_gate_refs: []
      })
    );
  });

  it("rejects artifact_refs with invalid artifact_type", () => {
    expectInvalid(
      "invalid_artifact_type",
      validBundle({
        artifact_refs: [
          {
            artifact_id: "artifact_planner_001",
            role_id: "planner",
            artifact_type: "dream",
            acceptance_status: "accepted"
          }
        ],
        handoff_gate_refs: []
      })
    );
  });

  it("rejects artifact_refs with invalid acceptance_status", () => {
    expectInvalid(
      "invalid_acceptance_status",
      validBundle({
        artifact_refs: [
          {
            artifact_id: "artifact_planner_001",
            role_id: "planner",
            artifact_type: "plan",
            acceptance_status: "maybe"
          }
        ],
        handoff_gate_refs: []
      })
    );
  });

  it("rejects duplicate artifact_id refs", () => {
    expectInvalid(
      "duplicate_artifact_id",
      validBundle({
        artifact_refs: [
          {
            artifact_id: "artifact_planner_001",
            role_id: "planner",
            artifact_type: "plan",
            acceptance_status: "accepted"
          },
          {
            artifact_id: "artifact_planner_001",
            role_id: "planner",
            artifact_type: "plan",
            acceptance_status: "accepted"
          }
        ]
      })
    );
  });

  it("rejects handoff_gate_refs whose source_artifact_id is not in artifact_refs", () => {
    expectInvalid(
      "unknown_source_artifact_id",
      validBundle({
        handoff_gate_refs: [
          {
            source_role: "planner",
            target_role: "implementer",
            source_artifact_id: "missing_artifact",
            allowed: true,
            status: "allowed",
            error_codes: []
          }
        ]
      })
    );
  });

  it("rejects handoff_gate_refs with unknown source_role", () => {
    expectInvalid(
      "unknown_role_id",
      validBundle({
        handoff_gate_refs: [
          {
            source_role: "oracle",
            target_role: "implementer",
            source_artifact_id: "artifact_planner_001",
            allowed: true,
            status: "allowed",
            error_codes: []
          }
        ]
      })
    );
  });

  it("rejects handoff_gate_refs with unknown target_role", () => {
    expectInvalid(
      "unknown_role_id",
      validBundle({
        handoff_gate_refs: [
          {
            source_role: "planner",
            target_role: "oracle",
            source_artifact_id: "artifact_planner_001",
            allowed: true,
            status: "allowed",
            error_codes: []
          }
        ]
      })
    );
  });

  it("rejects allowed true with non-allowed status", () => {
    expectInvalid(
      "allowed_status_mismatch",
      validBundle({
        handoff_gate_refs: [
          {
            source_role: "planner",
            target_role: "implementer",
            source_artifact_id: "artifact_planner_001",
            allowed: true,
            status: "blocked",
            error_codes: ["disallowed_target_role"]
          }
        ]
      })
    );
  });

  it("rejects status allowed with allowed false", () => {
    expectInvalid(
      "allowed_status_mismatch",
      validBundle({
        handoff_gate_refs: [
          {
            source_role: "planner",
            target_role: "implementer",
            source_artifact_id: "artifact_planner_001",
            allowed: false,
            status: "allowed",
            error_codes: []
          }
        ]
      })
    );
  });

  it("accepts blocked handoff gate ref with error_codes", () => {
    const result = validateRoleArtifactReferenceBundle(
      validBundle({
        bundle_status: "blocked",
        handoff_gate_refs: [
          {
            source_role: "planner",
            target_role: "implementer",
            source_artifact_id: "artifact_planner_001",
            allowed: false,
            status: "blocked",
            error_codes: ["handoff_status_blocks_handoff"]
          }
        ]
      })
    );

    expect(result).toEqual({ ok: true, errors: [] });
  });

  it("rejects embedded full RoleArtifact object", () => {
    expectInvalid(
      "forbidden_key",
      validBundle({
        source_artifact: {
          artifact_id: "artifact_planner_001",
          role_id: "planner",
          summary: "Full artifact content is forbidden.",
          claims: []
        }
      })
    );
  });

  it("rejects embedded RoleHandoffEnvelope object if included", () => {
    expectInvalid(
      "forbidden_key",
      validBundle({
        handoff: {
          source_role: "planner",
          target_role: "implementer",
          handoff_status: "ready"
        }
      })
    );
  });

  it("rejects telemetry_trace", () => {
    expectInvalid("forbidden_key", validBundle({ telemetry_trace: { trace_id: "trace_001" } }));
  });

  it("rejects telemetry_trace.events", () => {
    expectInvalid("forbidden_key", validBundle({ telemetry_trace: { events: [] } }));
  });

  it("rejects execution_context", () => {
    expectInvalid("forbidden_key", validBundle({ execution_context: { context_id: "context_001" } }));
  });

  it("rejects hollow_input", () => {
    expectInvalid("forbidden_key", validBundle({ hollow_input: { text: "raw" } }));
  });

  it("rejects input_payload", () => {
    expectInvalid("forbidden_key", validBundle({ input_payload: { text: "raw" } }));
  });

  it("rejects chain_of_thought", () => {
    expectInvalid("forbidden_key", validBundle({ chain_of_thought: "private" }));
  });

  it("rejects chainOfThought", () => {
    expectInvalid("forbidden_key", validBundle({ chainOfThought: "private" }));
  });

  it("rejects scratchpad", () => {
    expectInvalid("forbidden_key", validBundle({ scratchpad: "private" }));
  });

  it("rejects privateReasoning", () => {
    expectInvalid("forbidden_key", validBundle({ privateReasoning: "private" }));
  });

  it("validates valid bundle fixture", async () => {
    const fixture = JSON.parse(
      await readFile("examples/roles/bundles/role-artifact-bundle.valid.json", "utf8")
    );

    expect(validateRoleArtifactReferenceBundle(fixture)).toEqual({ ok: true, errors: [] });
  });

  it("rejects duplicate handoff_gate_refs for same source_role, target_role, and source_artifact_id", () => {
    const ref = {
      source_role: "planner",
      target_role: "implementer",
      source_artifact_id: "artifact_planner_001",
      allowed: true,
      status: "allowed",
      error_codes: []
    };
    expectInvalid("duplicate_handoff_gate_ref", validBundle({ handoff_gate_refs: [ref, ref] }));
  });

  it("validates that the fixture contains references only, not full artifact summaries or claims", async () => {
    const fixture = JSON.parse(
      await readFile("examples/roles/bundles/role-artifact-bundle.valid.json", "utf8")
    );

    expect(hasKey(fixture, "summary")).toBe(false);
    expect(hasKey(fixture, "claims")).toBe(false);
    expect(hasKey(fixture, "evidence_refs")).toBe(false);
    expect(hasKey(fixture, "artifact")).toBe(false);
    expect(hasKey(fixture, "source_artifact")).toBe(false);
    expect(hasKey(fixture, "handoff")).toBe(false);
  });
});

describe("role artifact bundle validator isolation locks", () => {
  it("does not import executeWorkGraphLite", async () => {
    const source = await readFile("src/roles/roleArtifactBundleValidator.ts", "utf8");
    expect(source).not.toContain("executeWorkGraphLite");
  });

  it("does not import dispatchHollow", async () => {
    const source = await readFile("src/roles/roleArtifactBundleValidator.ts", "utf8");
    expect(source).not.toContain("dispatchHollow");
  });

  it("does not import HollowRunner", async () => {
    const source = await readFile("src/roles/roleArtifactBundleValidator.ts", "utf8");
    expect(source).not.toContain("HollowRunner");
  });

  it("does not import model/API/provider modules", async () => {
    const source = await readFile("src/roles/roleArtifactBundleValidator.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'][^"']*(model|provider|api|openai|anthropic)[^"']*["']/i);
  });

  it("does not add role CLI flags", async () => {
    const source = await readFile("src/cli/commandParser.ts", "utf8");

    expect(source).not.toContain("--role");
    expect(source).not.toContain("--role-artifact");
    expect(source).not.toContain("--role-contract");
    expect(source).not.toContain("--role-handoff");
    expect(source).not.toContain("--role-bundle");
  });

  it("keeps V1 catalog count locked", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
  });

  it("keeps Hollowcut catalog count locked", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

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
