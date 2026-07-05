import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { V1_HOLLOW_MANIFESTS, HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/index.js";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import {
  selectRouteFromRouteInputs,
  validateRouteInputRecord
} from "../../src/logicEngine/routeInputGate.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";

const NOW = "2026-07-05T00:00:00.000Z";

function frame(): TaskFrame {
  return {
    task_id: "task_l1_acceptance",
    run_id: "run_l1_acceptance",
    trace_id: "trace_l1_acceptance",
    task_type: "hollow_execution",
    description: "L1 acceptance frame",
    input_summary: "bounded summary",
    requested_by: "l1_acceptance",
    requires_code_mutation: false,
    signal_hints: { deterministic_only: 2, requires_judgment: 0 },
    created_at: NOW
  };
}

function approvedRouteInputs() {
  const taskFrame = frame();
  return [
    {
      record_kind: "contract_validated_task_frame",
      record_id: "route_input.task_frame.acceptance",
      source: "logic_engine",
      validated_at: NOW,
      lineage_refs: [],
      task_frame: taskFrame,
      validation: { validator: "validateTaskFrameInput", valid: true }
    },
    {
      record_kind: "verified_signal_frame",
      record_id: "route_input.signal_frame.acceptance",
      source: "logic_engine",
      validated_at: NOW,
      lineage_refs: ["route_input.task_frame.acceptance"],
      signal_frame: classifySignals(taskFrame),
      derived_from_task_frame_record_id: "route_input.task_frame.acceptance"
    }
  ];
}

describe("L1 route-input hardening acceptance", () => {
  it("allows only approved decision-facing records to move Caleb route state", () => {
    const result = selectRouteFromRouteInputs(approvedRouteInputs());

    expect(result.ok).toBe(true);
    expect(result.decision?.route_mode).toBe("hollow_only");
    expect(result.accepted_inputs.map((input) => input.record_kind)).toEqual([
      "contract_validated_task_frame",
      "verified_signal_frame"
    ]);
  });

  it("rejects a synthetic T1 model/provider record presented as route input", () => {
    const result = selectRouteFromRouteInputs([
      ...approvedRouteInputs(),
      {
        record_kind: "engine_internal_state",
        record_id: "route_input.synthetic_provider",
        source: "logic_engine",
        validated_at: NOW,
        lineage_refs: [],
        state_name: "route_runtime",
        state_value: {
          provider_model_output: "schema-valid advisory output",
          model_confidence: 0.99
        }
      }
    ]);

    expect(result.ok).toBe(false);
    expect(result.decision).toBeNull();
    expect(result.issues.map((issue) => issue.code)).toContain("forbidden_provider_model_output");
  });

  it("rejects measurement_tier and subject_tier as route input", () => {
    for (const tierField of ["measurement_tier", "subject_tier"] as const) {
      const result = validateRouteInputRecord({
        record_kind: "engine_internal_state",
        record_id: `route_input.${tierField}`,
        source: "logic_engine",
        validated_at: NOW,
        lineage_refs: [],
        state_name: "route_runtime",
        state_value: { deterministic_measurement_available: true },
        [tierField]: "T2"
      });

      expect(result.ok).toBe(false);
    }
  });

  it("rejects display/report text and role artifact prose as route input", () => {
    const forbiddenFields = ["display_summary", "report_text", "role_artifact_prose"] as const;
    for (const field of forbiddenFields) {
      const result = validateRouteInputRecord({
        record_kind: "engine_internal_state",
        record_id: `route_input.${field}`,
        source: "logic_engine",
        validated_at: NOW,
        lineage_refs: [],
        state_name: "route_runtime",
        state_value: { ok: true },
        [field]: "advisory prose"
      });

      expect(result.ok).toBe(false);
    }
  });

  it("rejects unknown record types by construction", () => {
    const result = validateRouteInputRecord({
      record_kind: "provider_identity_route_hint",
      provider_id: "anthropic_live_adapter"
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("unknown_record_kind");
  });

  it("rejects digest, storage, and provider identity used as route authority", () => {
    const attempts = [
      { digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
      { storage_presence: true },
      { provider_id: "anthropic_live_adapter" }
    ];

    for (const attempt of attempts) {
      const result = validateRouteInputRecord({
        record_kind: "engine_internal_state",
        record_id: "route_input.non_authority",
        source: "logic_engine",
        validated_at: NOW,
        lineage_refs: [],
        state_name: "route_runtime",
        state_value: { deterministic_measurement_available: true },
        ...attempt
      });

      expect(result.ok).toBe(false);
    }
  });

  it("rejects raw model output presented as route input", () => {
    const result = validateRouteInputRecord({
      record_kind: "accepted_gate_policy_result",
      record_id: "route_input.raw_model",
      source: "gate",
      validated_at: NOW,
      lineage_refs: [],
      gate_id: "raw_model_gate",
      accepted: true,
      scope: "route",
      raw_model_output: "route Caleb now"
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("forbidden_raw_model_output");
  });

  it("preserves H5 network and credential-read traps", async () => {
    await expect(readFile("vitest.config.ts", "utf8")).resolves.toContain("tests/setup/networkEgressBlock.ts");
    await expect(readFile("tests/setup/networkEgressBlock.ts", "utf8")).resolves.toContain("fetch");
    await expect(readFile("tests/setup/networkEgressBlock.ts", "utf8")).resolves.toContain("process.env");
    await expect(readFile("tests/setup/networkEgressBlock.ts", "utf8")).resolves.toContain("CREDENTIAL_ENV_DENYLIST");
  });

  it("preserves catalog counts", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});
