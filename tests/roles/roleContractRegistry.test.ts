import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  ROLE_ARTIFACT_SCHEMA_VERSION,
  ROLE_IDS,
  getRoleContract,
  hasRoleContract,
  listRoleContracts,
  validateRoleArtifact,
  validateRoleContract,
  validateRoleContractRegistry,
  type RegisteredRoleContract,
  type RoleArtifact,
  type RoleId
} from "../../src/roles/index.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const fixtureFiles = [
  "planner.valid-artifact.json",
  "implementer.valid-artifact.json",
  "verifier.valid-artifact.json",
  "critic.valid-artifact.json",
  "synthesizer.valid-artifact.json",
  "reporter.valid-artifact.json",
  "recovery.valid-artifact.json",
  "human_operator.valid-artifact.json"
] as const;

const allowedRoleIds = new Set<string>(ROLE_IDS);

describe("role contract registry", () => {
  it("lists every allowed RoleId and no duplicate role IDs", () => {
    const contracts = listRoleContracts();
    const roleIds = contracts.map((entry) => entry.contract.role_id);

    expect([...roleIds].sort()).toEqual([...ROLE_IDS].sort());
    expect(new Set(roleIds).size).toBe(roleIds.length);
  });

  it("retrieves and detects known and unknown role contracts", () => {
    const planner = getRoleContract("planner");

    expect(planner?.contract.role_id).toBe("planner");
    expect(getRoleContract("unknown_role")).toBeUndefined();
    expect(hasRoleContract("planner")).toBe(true);
    expect(hasRoleContract("unknown_role")).toBe(false);
  });

  it("keeps every registered contract validator-compatible", () => {
    const registryResult = validateRoleContractRegistry();

    expect(registryResult).toEqual({ ok: true, errors: [] });
    for (const registered of listRoleContracts()) {
      expect(validateRoleContract(registered.contract)).toEqual({ ok: true, errors: [] });
      expect(registered.contract.schema_version).toBe(ROLE_ARTIFACT_SCHEMA_VERSION);
      expect(allowedRoleIds.has(registered.contract.role_id)).toBe(true);
      expect(registered.allowed_next_roles.every((roleId) => allowedRoleIds.has(roleId))).toBe(true);
    }
  });

  it("returns copy-safe registry data", () => {
    const listed = listRoleContracts();
    const firstRole = listed[0]?.contract.role_id;
    expect(firstRole).toBeDefined();

    const mutableListed = listed as RegisteredRoleContract[];
    mutableListed.push(mutableListed[0] as RegisteredRoleContract);
    (mutableListed[0] as unknown as { display_name: string }).display_name = "Mutated";
    ((mutableListed[0] as unknown as { contract: { allowed_artifact_types: string[] } }).contract.allowed_artifact_types)
      .push("mutated");

    const fresh = listRoleContracts();
    const freshFirst = fresh.find((entry) => entry.contract.role_id === firstRole);

    expect(fresh).toHaveLength(ROLE_IDS.length);
    expect(freshFirst?.display_name).not.toBe("Mutated");
    expect(freshFirst?.contract.allowed_artifact_types).not.toContain("mutated");
  });
});

describe("locked role artifact fixtures", () => {
  it("parses every fixture JSON and validates every RoleArtifact", async () => {
    for (const fixtureFile of fixtureFiles) {
      const fixture = await readFixture(fixtureFile);
      const result = validateRoleArtifact(fixture);

      expect(result, fixtureFile).toEqual({ ok: true, errors: [] });
    }
  });

  it("links every fixture role and artifact type to the matching registered contract", async () => {
    for (const fixtureFile of fixtureFiles) {
      const fixture = await readFixture(fixtureFile);
      const contract = getRoleContract(fixture.role_id);

      expect(contract, fixtureFile).toBeDefined();
      expect(contract?.contract.allowed_artifact_types).toContain(fixture.artifact_type);
    }
  });

  it("uses telemetry and execution context references by ID only", async () => {
    for (const fixtureFile of fixtureFiles) {
      const fixture = await readFixture(fixtureFile);

      expect(fixture.telemetry_trace_ref, fixtureFile).toEqual({
        trace_id: "trace_role_fixture_001",
        context_id: "context_role_fixture_001"
      });
      expect(Object.keys(fixture.telemetry_trace_ref ?? {}), fixtureFile).toEqual(["trace_id", "context_id"]);
      expect(fixture.execution_context_ref, fixtureFile).toEqual({
        context_id: "context_role_fixture_001"
      });
      expect(Object.keys(fixture.execution_context_ref ?? {}), fixtureFile).toEqual(["context_id"]);
      expect(hasKey(fixture, "telemetry_trace")).toBe(false);
      expect(hasKey(fixture, "execution_context")).toBe(false);
    }
  });

  it("does not embed forbidden telemetry, reasoning, Hollow input, or input payload fields", async () => {
    const forbiddenKeys = [
      "chain_of_thought",
      "chainOfThought",
      "scratchpad",
      "hollow_input",
      "input_payload"
    ] as const;

    for (const fixtureFile of fixtureFiles) {
      const fixture = await readFixture(fixtureFile);

      expect(hasTelemetryTraceEvents(fixture), fixtureFile).toBe(false);
      for (const key of forbiddenKeys) {
        expect(hasKey(fixture, key), `${fixtureFile} contains ${key}`).toBe(false);
      }
    }
  });
});

describe("role registry isolation locks", () => {
  it("does not import Logic Engine execution or Hollow runtime primitives", async () => {
    const source = await readFile("src/roles/roleContractRegistry.ts", "utf8");

    expect(source).not.toContain("executeWorkGraphLite");
    expect(source).not.toContain("dispatchHollow");
    expect(source).not.toContain("HollowRunner");
  });

  it("does not import model, API, or provider modules", async () => {
    const source = await readFile("src/roles/roleContractRegistry.ts", "utf8");

    expect(source).not.toMatch(/from\s+["'][^"']*(model|provider|api|openai|anthropic)[^"']*["']/i);
  });

  it("does not add role CLI flags", async () => {
    const source = await readFile("src/cli/commandParser.ts", "utf8");

    expect(source).not.toContain("--role");
    expect(source).not.toContain("--role-artifact");
    expect(source).not.toContain("--role-contract");
    expect(source).not.toContain("--role-fixture");
  });

  it("keeps V1 and Hollowcut catalog counts locked", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

async function readFixture(fixtureFile: string): Promise<RoleArtifact> {
  const raw = await readFile(join("examples", "roles", fixtureFile), "utf8");
  return JSON.parse(raw) as RoleArtifact;
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

function hasTelemetryTraceEvents(value: unknown, parentKey?: string): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => hasTelemetryTraceEvents(entry, parentKey));
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if ((parentKey === "telemetry_trace" || parentKey === "telemetryTrace") && key === "events") {
      return true;
    }
    if (hasTelemetryTraceEvents(child, key)) {
      return true;
    }
  }
  return false;
}
