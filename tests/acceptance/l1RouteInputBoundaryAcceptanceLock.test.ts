import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS, V1_HOLLOW_MANIFESTS } from "../../src/hollows/index.js";
import {
  isAllowedRouteInputKind,
  selectRouteFromRouteInputs,
  validateRouteInputRecord
} from "../../src/logicEngine/routeInputGate.js";

const REPORT_PATH = "docs/L1_ROUTE_INPUT_BOUNDARY_ACCEPTANCE_REPORT.md";
const GATE_PATH = "src/logicEngine/routeInputGate.ts";
const IMPLEMENTATION_DOC_PATH = "docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_IMPLEMENTATION.md";
const NOW = "2026-07-05T00:00:00.000Z";

const LOCKED_ALLOWLIST = [
  "contract_validated_task_frame",
  "verified_signal_frame",
  "engine_internal_state",
  "deterministic_hollow_signal",
  "accepted_gate_policy_result",
  "human_pat_approval_record",
  "snapshot_change_guard_state"
] as const;

describe("L1-A route-input boundary acceptance lock", () => {
  it("records L1-A as accepted and names canonical evidence files", async () => {
    const report = await readFile(REPORT_PATH, "utf8");

    expect(report).toContain("L1-A Route-Input Boundary Acceptance Lock: Accepted");
    expect(report).toContain("docs/protocols/PASS_PROTOCOL_L1A_RAC.md");
    expect(report).toContain(IMPLEMENTATION_DOC_PATH);
    expect(report).toContain("tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts");
    expect(report).toContain("Model output may enter Caleb.");
    expect(report).toContain("Model output may not steer Caleb.");
  });

  it("pins the route-input allowlist verbatim", async () => {
    const gateSource = await readFile(GATE_PATH, "utf8");
    const actualAllowlist = extractAllowedKinds(gateSource);

    expect(actualAllowlist).toEqual([...LOCKED_ALLOWLIST]);
    for (const kind of LOCKED_ALLOWLIST) {
      expect(isAllowedRouteInputKind(kind)).toBe(true);
    }
    expect(isAllowedRouteInputKind("future_unprotocolled_route_input")).toBe(false);
  });

  it("locks fail-closed unknown record behavior and demonstrates the lock fires", () => {
    const syntheticWeakening = validateRouteInputRecord({
      record_kind: "future_unprotocolled_route_input",
      record_id: "route_input.synthetic_weakening",
      source: "logic_engine",
      validated_at: NOW,
      lineage_refs: []
    });

    expect(syntheticWeakening.ok).toBe(false);
    expect(syntheticWeakening.issues[0]?.code).toBe("unknown_record_kind");
  });

  it("locks the required L1 detector surface through the public gate", () => {
    const attempts = [
      {
        name: "synthetic T1 provider/model record",
        input: engineState({ state_value: { provider_model_output: "schema-valid advisory output" } }),
        expected: "forbidden_provider_model_output"
      },
      {
        name: "raw model output",
        input: gateResult({ raw_model_output: "route Caleb" }),
        expected: "forbidden_raw_model_output"
      },
      {
        name: "measurement_tier",
        input: engineState({ measurement_tier: "T2" }),
        expected: "forbidden_measurement_tier"
      },
      {
        name: "subject_tier",
        input: engineState({ subject_tier: "T1" }),
        expected: "forbidden_subject_tier"
      },
      {
        name: "display/report text",
        input: engineState({ display_summary: "display-only", report_text: "report-only" }),
        expected: "forbidden_display_text"
      },
      {
        name: "digest authority",
        input: engineState({ digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }),
        expected: "forbidden_digest_authority"
      },
      {
        name: "storage authority",
        input: engineState({ storage_presence: true }),
        expected: "forbidden_storage_authority"
      },
      {
        name: "provider identity",
        input: engineState({ provider_id: "anthropic_live_adapter" }),
        expected: "forbidden_provider_identity"
      },
      {
        name: "model confidence",
        input: engineState({ model_confidence: 0.99 }),
        expected: "forbidden_model_confidence"
      },
      {
        name: "role artifact prose",
        input: engineState({ role_artifact_prose: "Critic says route differently" }),
        expected: "forbidden_role_artifact_prose"
      }
    ];

    for (const attempt of attempts) {
      const result = validateRouteInputRecord(attempt.input);
      expect(result.ok, attempt.name).toBe(false);
      expect(result.issues.map((issue) => issue.code), attempt.name).toContain(attempt.expected);
    }
  });

  it("locks route selection behind selectRouteFromRouteInputs", async () => {
    const logicEngineFiles = await readdir("src/logicEngine");
    const source = await Promise.all(
      logicEngineFiles
        .filter((file) => file.endsWith(".ts"))
        .map(async (file) => [file, await readFile(join("src/logicEngine", file), "utf8")] as const)
    );
    const exportedHardenedEntrypoints = source.flatMap(([file, text]) =>
      [...text.matchAll(/export function (selectRouteFrom[A-Za-z0-9_]*)/g)].map((match) => `${file}:${match[1]}`)
    );

    expect(exportedHardenedEntrypoints).toEqual(["routeInputGate.ts:selectRouteFromRouteInputs"]);
    expect(source.some(([, text]) => text.includes("selectRouteFromRawModelOutput"))).toBe(false);
    expect(selectRouteFromRouteInputs([engineState({ raw_model_output: "route" })]).ok).toBe(false);
  });

  it("locks the report's allowlist-growth rule and lock-fires evidence", async () => {
    const report = await readFile(REPORT_PATH, "utf8");

    for (const kind of LOCKED_ALLOWLIST) {
      expect(report).toContain(kind);
    }
    expect(report).toContain("future_unprotocolled_route_input");
    expect(report).toContain("selectRouteFromRawModelOutput");
    expect(report).toContain("Allowlist growth requires a protocol-governed pass");
  });

  it("preserves H5 traps and catalog counts", async () => {
    await expect(readFile("vitest.config.ts", "utf8")).resolves.toContain("tests/setup/networkEgressBlock.ts");
    await expect(readFile("tests/setup/networkEgressBlock.ts", "utf8")).resolves.toContain("CREDENTIAL_ENV_DENYLIST");
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

function engineState(overrides: Record<string, unknown> = {}) {
  return {
    record_kind: "engine_internal_state",
    record_id: "route_input.lock.engine",
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: [],
    state_name: "route_runtime",
    state_value: { ok: true },
    ...overrides
  };
}

function gateResult(overrides: Record<string, unknown> = {}) {
  return {
    record_kind: "accepted_gate_policy_result",
    record_id: "route_input.lock.gate",
    source: "gate",
    validated_at: NOW,
    lineage_refs: [],
    gate_id: "route_gate",
    accepted: true,
    scope: "route",
    ...overrides
  };
}

function extractAllowedKinds(source: string): string[] {
  const match = source.match(/const ALLOWED_KINDS:[\s\S]*?= \[([\s\S]*?)\];/);
  if (match === null) {
    throw new Error("Unable to locate ALLOWED_KINDS in routeInputGate.ts");
  }
  const body = match[1];
  if (body === undefined) {
    throw new Error("Unable to read ALLOWED_KINDS body in routeInputGate.ts");
  }
  return [...body.matchAll(/"([^"]+)"/g)].map((entry) => {
    const value = entry[1];
    if (value === undefined) {
      throw new Error("Unable to parse ALLOWED_KINDS entry in routeInputGate.ts");
    }
    return value;
  });
}
