import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  createInMemoryArtifactStore,
  createMockSinglePassModelAdapter,
  runSinglePassRouteMvp,
  validateSinglePassRouteMvpRequest,
  validateModelInvocationRecord
} from "../../src/index.js";
import type { MockSinglePassModelAdapter } from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: "0.1.0",
    task_id: "task_single_pass_route_001",
    run_id: "run_single_pass_route_001",
    route_mode: "single_pass",
    request_id: "request_single_pass_route_001",
    user_goal: "Run the mocked single_pass route MVP.",
    prompt: "Produce a mocked route result without live providers.",
    evidence_refs: [{ ref_id: "evidence_route_001", description: "Evidence ref." }],
    context_refs: [{ ref_id: "context_route_001", ref_kind: "execution_context", description: "Context ref." }],
    constraints: { no_live_provider: true },
    created_at: "2026-07-02T19:20:00.000Z",
    ...overrides
  };
}

describe("single_pass Route MVP", () => {
  it("valid route request passes validator", () => {
    expect(validateSinglePassRouteMvpRequest(validRequest()).ok).toBe(true);
  });

  it("invalid request fails validator", () => {
    expect(validateSinglePassRouteMvpRequest({}).ok).toBe(false);
  });

  it("route_mode other than single_pass fails", () => {
    expect(validateSinglePassRouteMvpRequest(validRequest({ route_mode: "hollow_only" })).ok).toBe(false);
  });

  it("route runner completes with valid request", () => {
    expect(runSinglePassRouteMvp(validRequest()).status).toBe("completed_t1");
  });

  it("route runner uses mocked boundary", () => {
    const result = runSinglePassRouteMvp(validRequest());
    expect(result.boundary_result?.status).toBe("accepted_t1");
  });

  it("route runner stores raw model output as T0/raw", () => {
    const store = createInMemoryArtifactStore();
    const result = runSinglePassRouteMvp(validRequest(), { store });
    const record = store.get(result.storage_summary.raw_response_record_id ?? "");
    expect(record?.trust_tier).toBe("T0");
    expect(record?.validation_status).toBe("raw");
  });

  it("route runner stores schema-valid model output as T1/schema_valid", () => {
    const store = createInMemoryArtifactStore();
    const result = runSinglePassRouteMvp(validRequest(), { store });
    const record = store.get(result.storage_summary.validated_response_record_id ?? "");
    expect(record?.trust_tier).toBe("T1");
    expect(record?.validation_status).toBe("schema_valid");
  });

  it("route runner builds valid model invocation record", () => {
    const result = runSinglePassRouteMvp(validRequest());
    expect(validateModelInvocationRecord(result.model_invocation_record).ok).toBe(true);
  });

  it("model invocation record adapter_kind is mock", () => {
    expect(runSinglePassRouteMvp(validRequest()).model_invocation_record?.adapter_kind).toBe("mock");
  });

  it("model invocation record route_mode is single_pass", () => {
    expect(runSinglePassRouteMvp(validRequest()).model_invocation_record?.route_mode).toBe("single_pass");
  });

  it("raw model output never reaches T2", () => {
    const store = createInMemoryArtifactStore();
    runSinglePassRouteMvp(validRequest(), { store });
    expect(store.list().some((record) => record.source_kind === "model" && record.trust_tier === "T2")).toBe(false);
  });

  it("raw model output never reaches T3", () => {
    const store = createInMemoryArtifactStore();
    runSinglePassRouteMvp(validRequest(), { store });
    expect(store.list().some((record) => record.source_kind === "model" && record.trust_tier === "T3")).toBe(false);
  });

  it("raw model output never reaches T4", () => {
    const store = createInMemoryArtifactStore();
    runSinglePassRouteMvp(validRequest(), { store });
    expect(store.list().some((record) => record.source_kind === "model" && record.trust_tier === "T4")).toBe(false);
  });

  it("schema-valid model output never exceeds T1", () => {
    const result = runSinglePassRouteMvp(validRequest());
    expect(result.trust_summary.schema_valid_model_output_trust_tier).toBe("T1");
    expect(result.trust_summary.max_model_output_trust_tier).toBe("T1");
  });

  it("route completion does not promote trust", () => {
    expect(runSinglePassRouteMvp(validRequest()).trust_summary.route_completion_promotes_trust).toBe(false);
  });

  it("storage does not promote trust", () => {
    expect(runSinglePassRouteMvp(validRequest()).trust_summary.storage_promotes_trust).toBe(false);
  });

  it("retrieval does not promote trust", () => {
    const store = createInMemoryArtifactStore();
    const result = runSinglePassRouteMvp(validRequest(), { store });
    store.get(result.storage_summary.raw_response_record_id ?? "");
    expect(store.get(result.storage_summary.raw_response_record_id ?? "")?.trust_tier).toBe("T0");
  });

  it("model output is not deterministic Hollow evidence", () => {
    expect(runSinglePassRouteMvp(validRequest()).trust_summary.model_output_is_deterministic_evidence).toBe(false);
  });

  it("usable final evidence count does not treat T1 model output as verified Hollow evidence", () => {
    expect(runSinglePassRouteMvp(validRequest()).storage_summary.usable_final_evidence_count).toBe(0);
  });

  it("route rejects invalid request before boundary call", () => {
    let called = false;
    const adapter: MockSinglePassModelAdapter = {
      adapter_id: "mock.test",
      adapter_kind: "mock",
      generate: (request) => {
        called = true;
        return createMockSinglePassModelAdapter().generate(request);
      }
    };
    const result = runSinglePassRouteMvp({}, { adapter });
    expect(result.status).toBe("rejected");
    expect(called).toBe(false);
  });

  it("route reports boundary failure", () => {
    const adapter: MockSinglePassModelAdapter = {
      adapter_id: "mock.bad",
      adapter_kind: "mock",
      generate: (request) => ({
        ...createMockSinglePassModelAdapter().generate(request),
        raw_trust_tier: "T1" as any
      })
    };
    expect(runSinglePassRouteMvp(validRequest(), { adapter }).status).toBe("boundary_failed");
  });

  it("route is deterministic with fixed now", () => {
    const now = "2026-07-02T19:20:00.000Z";
    expect(runSinglePassRouteMvp(validRequest(), { now })).toEqual(runSinglePassRouteMvp(validRequest(), { now }));
  });

  it("route does not write files", async () => {
    const source = await readFile("src/logicEngine/singlePassRouteMvp.ts", "utf8");
    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });

  it("route does not write Ledger", async () => {
    const source = await readFile("src/logicEngine/singlePassRouteMvp.ts", "utf8");
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry/);
  });

  it("examples validate", async () => {
    expect(validateSinglePassRouteMvpRequest(await readJson("examples/logicEngine/single-pass-route-request.valid.json")).ok).toBe(true);
    const result = await readJson("examples/logicEngine/single-pass-route-result.valid.json");
    expect(result.ok).toBe(true);
    expect(result.trust_summary.max_model_output_trust_tier).toBe("T1");
  });
});
