import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  assertModelInvocationRecord,
  buildModelInvocationRecord,
  createInMemoryArtifactStore,
  createMockSinglePassModelAdapter,
  isModelInvocationRecord,
  runMockSinglePassModelBoundary,
  validateModelInvocationRecord
} from "../../src/index.js";
import type { SinglePassModelRequest } from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

function request(): SinglePassModelRequest {
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
    created_at: "2026-07-02T19:00:00.000Z"
  };
}

function builtRecord() {
  const req = request();
  const response = createMockSinglePassModelAdapter({
    response_id: "response_mock_single_pass_001",
    created_at: "2026-07-02T19:00:00.000Z"
  }).generate(req);
  const boundary = runMockSinglePassModelBoundary(req, {
    store: createInMemoryArtifactStore(),
    adapter: createMockSinglePassModelAdapter({
      response_id: "response_mock_single_pass_001",
      created_at: "2026-07-02T19:00:00.000Z"
    }),
    now: "2026-07-02T19:00:00.000Z"
  });

  return buildModelInvocationRecord({
    request: req,
    response,
    boundary_result: boundary,
    created_at: "2026-07-02T19:10:00.000Z",
    completed_at: "2026-07-02T19:10:01.000Z"
  });
}

describe("Model invocation record", () => {
  it("valid example passes", async () => {
    expect(validateModelInvocationRecord(await readJson("examples/modelBoundary/model-invocation-record.valid.json")).ok).toBe(true);
  });

  it("invalid trust promotion example fails", async () => {
    const result = validateModelInvocationRecord(await readJson("examples/modelBoundary/model-invocation-record.invalid.trust-promotion.json"));
    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain("invalid_max_allowed_trust_tier");
  });

  it("non-object fails", () => {
    expect(validateModelInvocationRecord(null).ok).toBe(false);
  });

  it("missing required fields fail", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    delete record.record_id;
    const result = validateModelInvocationRecord(record);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.path === "$.record_id")).toBe(true);
  });

  it("route_mode other than single_pass fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.route_mode = "hollow_only";
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("adapter_kind other than mock fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.adapter_kind = "live";
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("record_kind other than mocked_single_pass_invocation fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.record_kind = "live_invocation";
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("raw output above T0 fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.trust_summary.raw_output_trust_tier = "T1";
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("validated output above T1 fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.trust_summary.validated_output_trust_tier = "T2";
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("max allowed above T1 fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.trust_summary.max_allowed_trust_tier = "T2";
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("model_output_is_deterministic_evidence true fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.trust_summary.model_output_is_deterministic_evidence = true;
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("ledger_presence_promotes_trust true fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.trust_summary.ledger_presence_promotes_trust = true;
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("trust_promotion_blocked false fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.trust_summary.trust_promotion_blocked = false;
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("ledger_intent.trust_effect other than none fails", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.ledger_intent.trust_effect = "verified";
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("writes_in_this_pass true fails unless explicitly supported", async () => {
    const record = await readJson("examples/modelBoundary/model-invocation-record.valid.json");
    record.ledger_intent.writes_in_this_pass = true;
    expect(validateModelInvocationRecord(record).ok).toBe(false);
  });

  it("builder creates valid record from mock boundary-shaped input", () => {
    const result = builtRecord();
    expect(result.ok).toBe(true);
    expect(result.record?.record_kind).toBe("mocked_single_pass_invocation");
  });

  it("builder is deterministic with fixed timestamps", () => {
    expect(builtRecord()).toEqual(builtRecord());
  });

  it("builder includes supplied evidence refs", () => {
    expect(builtRecord().record?.supplied_evidence_refs).toHaveLength(1);
  });

  it("builder includes raw and validated response record IDs", () => {
    const record = builtRecord().record;
    expect(record?.raw_response_record_id).toContain(".raw");
    expect(record?.validated_response_record_id).toContain(".schema_valid");
  });

  it("builder does not promote trust", () => {
    const summary = builtRecord().record?.trust_summary;
    expect(summary?.raw_output_trust_tier).toBe("T0");
    expect(summary?.validated_output_trust_tier).toBe("T1");
    expect(summary?.max_allowed_trust_tier).toBe("T1");
  });

  it("isModelInvocationRecord returns true only for valid records", async () => {
    expect(isModelInvocationRecord(await readJson("examples/modelBoundary/model-invocation-record.valid.json"))).toBe(true);
    expect(isModelInvocationRecord(await readJson("examples/modelBoundary/model-invocation-record.invalid.trust-promotion.json"))).toBe(false);
  });

  it("assertModelInvocationRecord throws on invalid", async () => {
    expect(() => assertModelInvocationRecord({})).toThrow(/Invalid ModelInvocationRecord/);
  });

  it("source does not import provider SDKs", async () => {
    const source = await readFile("src/modelBoundary/modelInvocationRecordBuilder.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'][^"']*(openai|anthropic|gemini|grok|provider|langchain|autogen|crewai)[^"']*["']/i);
    expect(source).not.toMatch(/require\(["'][^"']*(openai|anthropic|gemini|grok|provider|langchain|autogen|crewai)[^"']*["']\)/i);
  });

  it("source does not write files", async () => {
    const source = await readFile("src/modelBoundary/modelInvocationRecordBuilder.ts", "utf8");
    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });

  it("source does not write ledger", async () => {
    const source = await readFile("src/modelBoundary/modelInvocationRecordBuilder.ts", "utf8");
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry/);
  });
});
