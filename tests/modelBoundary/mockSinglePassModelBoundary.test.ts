import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  createInMemoryArtifactStore,
  createMockSinglePassModelAdapter,
  runMockSinglePassModelBoundary,
  validateRuntimeStorageRecord,
  validateSinglePassModelRequest,
  validateSinglePassModelResponse
} from "../../src/index.js";
import type { MockSinglePassModelAdapter, SinglePassModelRequest } from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

function validRequest(overrides: Record<string, unknown> = {}): SinglePassModelRequest {
  return {
    schema_version: "0.1.0",
    task_id: "task_mock_single_pass_001",
    run_id: "run_mock_single_pass_001",
    route_mode: "single_pass",
    request_id: "request_mock_single_pass_001",
    user_goal: "Produce a bounded mocked response.",
    prompt: "Summarize the safe mocked step.",
    evidence_refs: [{ ref_id: "evidence_mock_001", description: "Evidence ref." }],
    context_refs: [{ ref_id: "context_mock_001", ref_kind: "execution_context", description: "Context ref." }],
    constraints: { no_live_provider: true },
    created_at: "2026-07-02T19:00:00.000Z",
    ...overrides
  } as SinglePassModelRequest;
}

describe("Mocked single_pass model boundary", () => {
  it("valid request passes validator", () => {
    expect(validateSinglePassModelRequest(validRequest()).ok).toBe(true);
  });

  it("invalid request fails validator", () => {
    expect(validateSinglePassModelRequest({}).ok).toBe(false);
  });

  it("request with route_mode not single_pass fails", () => {
    expect(validateSinglePassModelRequest(validRequest({ route_mode: "hollow_only" })).ok).toBe(false);
  });

  it("valid mock response passes validator", async () => {
    expect(validateSinglePassModelResponse(await readJson("examples/modelBoundary/mock-single-pass-response.valid.json")).ok).toBe(true);
  });

  it("response adapter_kind not mock fails", async () => {
    const response = await readJson("examples/modelBoundary/mock-single-pass-response.valid.json");
    response.adapter_kind = "live";
    expect(validateSinglePassModelResponse(response).ok).toBe(false);
  });

  it("response raw_trust_tier above T0 fails", async () => {
    const response = await readJson("examples/modelBoundary/mock-single-pass-response.valid.json");
    response.raw_trust_tier = "T1";
    expect(validateSinglePassModelResponse(response).ok).toBe(false);
  });

  it("response validation_status other than raw fails", async () => {
    const response = await readJson("examples/modelBoundary/mock-single-pass-response.valid.json");
    response.validation_status = "schema_valid";
    expect(validateSinglePassModelResponse(response).ok).toBe(false);
  });

  it("mock adapter is deterministic", () => {
    const adapter = createMockSinglePassModelAdapter();
    expect(adapter.generate(validRequest())).toEqual(adapter.generate(validRequest()));
  });

  it("mock adapter does not require evidence refs", () => {
    const adapter = createMockSinglePassModelAdapter();
    const response = adapter.generate(validRequest({ evidence_refs: [] }));
    expect(response.used_evidence_refs).toHaveLength(0);
  });

  it("mock adapter warns when evidence refs are empty", () => {
    const adapter = createMockSinglePassModelAdapter();
    expect(adapter.generate(validRequest({ evidence_refs: [] })).warnings).toHaveLength(1);
  });

  it("boundary rejects invalid request before adapter call", () => {
    let called = false;
    const adapter: MockSinglePassModelAdapter = {
      adapter_id: "mock.test",
      adapter_kind: "mock",
      generate: () => {
        called = true;
        return createMockSinglePassModelAdapter().generate(validRequest());
      }
    };
    const result = runMockSinglePassModelBoundary({}, { store: createInMemoryArtifactStore(), adapter });
    expect(result.ok).toBe(false);
    expect(called).toBe(false);
  });

  it("boundary stores raw model response as T0/raw", () => {
    const store = createInMemoryArtifactStore();
    const result = runMockSinglePassModelBoundary(validRequest(), { store });
    const record = store.get(result.raw_response_record_id ?? "");
    expect(record?.trust_tier).toBe("T0");
    expect(record?.validation_status).toBe("raw");
  });

  it("boundary stores validated model response as T1/schema_valid", () => {
    const store = createInMemoryArtifactStore();
    const result = runMockSinglePassModelBoundary(validRequest(), { store });
    const record = store.get(result.validated_response_record_id ?? "");
    expect(record?.trust_tier).toBe("T1");
    expect(record?.validation_status).toBe("schema_valid");
  });

  it("boundary never stores model output as T2", () => {
    const store = createInMemoryArtifactStore();
    runMockSinglePassModelBoundary(validRequest(), { store });
    expect(store.list().some((record) => record.source_kind === "model" && record.trust_tier === "T2")).toBe(false);
  });

  it("boundary never stores model output as T3", () => {
    const store = createInMemoryArtifactStore();
    runMockSinglePassModelBoundary(validRequest(), { store });
    expect(store.list().some((record) => record.source_kind === "model" && record.trust_tier === "T3")).toBe(false);
  });

  it("boundary never stores model output as T4", () => {
    const store = createInMemoryArtifactStore();
    runMockSinglePassModelBoundary(validRequest(), { store });
    expect(store.list().some((record) => record.source_kind === "model" && record.trust_tier === "T4")).toBe(false);
  });

  it("boundary returns storage record refs", () => {
    const result = runMockSinglePassModelBoundary(validRequest(), { store: createInMemoryArtifactStore() });
    expect(result.storage_refs.raw_response_record_id).toContain(".raw");
    expect(result.storage_refs.validated_response_record_id).toContain(".schema_valid");
  });

  it("boundary uses defensive in-memory store behavior", () => {
    const store = createInMemoryArtifactStore();
    const result = runMockSinglePassModelBoundary(validRequest(), { store });
    const record = store.get(result.validated_response_record_id ?? "") as any;
    record.trust_tier = "T4";
    expect(store.get(result.validated_response_record_id ?? "")?.trust_tier).toBe("T1");
  });

  it("retrieved records retain original trust tiers", () => {
    const store = createInMemoryArtifactStore();
    const result = runMockSinglePassModelBoundary(validRequest(), { store });
    expect(store.get(result.raw_response_record_id ?? "")?.trust_tier).toBe("T0");
    expect(store.get(result.validated_response_record_id ?? "")?.trust_tier).toBe("T1");
  });

  it("storage retrieval does not promote trust", () => {
    const store = createInMemoryArtifactStore();
    const result = runMockSinglePassModelBoundary(validRequest(), { store });
    store.get(result.raw_response_record_id ?? "");
    expect(store.get(result.raw_response_record_id ?? "")?.trust_tier).toBe("T0");
  });

  it("output claims remain unverified", () => {
    const adapter = createMockSinglePassModelAdapter();
    const response = adapter.generate(validRequest());
    expect(response.output_claims.join(" ")).toContain("not verified");
    expect(response.raw_trust_tier).toBe("T0");
  });

  it("boundary does not write files", async () => {
    const source = await readFile("src/modelBoundary/mockSinglePassModelBoundary.ts", "utf8");
    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });

  it("boundary does not write ledger", async () => {
    const source = await readFile("src/modelBoundary/mockSinglePassModelBoundary.ts", "utf8");
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry/);
  });

  it("boundary does not import provider SDKs", async () => {
    const source = await readFile("src/modelBoundary/mockSinglePassModelBoundary.ts", "utf8");
    expect(source).not.toMatch(/openai|anthropic|gemini|grok|provider|langchain|autogen|crewai/i);
  });

  it("examples pass validators", async () => {
    expect(validateSinglePassModelRequest(await readJson("examples/modelBoundary/mock-single-pass-request.valid.json")).ok).toBe(true);
    expect(validateSinglePassModelResponse(await readJson("examples/modelBoundary/mock-single-pass-response.valid.json")).ok).toBe(true);
    const records = await readJson("examples/modelBoundary/mock-single-pass-storage-records.valid.json");
    for (const record of records) {
      expect(validateRuntimeStorageRecord(record).ok).toBe(true);
    }
  });
});
