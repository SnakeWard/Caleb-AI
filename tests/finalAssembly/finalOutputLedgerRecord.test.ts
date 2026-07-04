import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assembleSinglePassRouteResult,
  assertFinalOutputLedgerRecord,
  buildFinalOutputLedgerRecord,
  buildRouteLedgerEvent,
  createFinalOutputLedgerEntry,
  isFinalOutputLedgerRecord,
  validateFinalOutputLedgerRecord,
  writeFinalOutputLedgerRecord
} from "../../src/index.js";
import type { FinalAssemblyRequest, FinalOutputLedgerRecord, RouteLedgerEvent } from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

function routeResult() {
  return {
    ok: true,
    status: "completed_t1",
    task_id: "task_final_output_001",
    run_id: "run_final_output_001",
    route_mode: "single_pass",
    request_id: "request_final_output_001",
    response_id: "request_final_output_001.mock_response",
    model_invocation_record: {
      record_id: "model_invocation.request_final_output_001",
      record_kind: "mocked_single_pass_invocation",
      route_mode: "single_pass",
      adapter_kind: "mock"
    },
    storage_summary: {
      raw_response_record_id: "model_boundary.request_final_output_001.mock_response.raw",
      validated_response_record_id: "model_boundary.request_final_output_001.mock_response.schema_valid"
    },
    trust_summary: {
      max_model_output_trust_tier: "T1",
      model_output_is_deterministic_evidence: false,
      route_completion_promotes_trust: false,
      storage_promotes_trust: false,
      retrieval_promotes_trust: false,
      notes: []
    },
    issues: []
  };
}

function packet() {
  const request: FinalAssemblyRequest = {
    schema_version: "0.1.0",
    task_id: "task_final_output_001",
    run_id: "run_final_output_001",
    assembly_id: "assembly_final_output_001",
    route_mode: "single_pass",
    route_result_ref: "route_result.single_pass.final_output.001",
    route_result: routeResult(),
    requested_output_type: "mock_user_response",
    created_at: "2026-07-03T00:18:00.000Z"
  };
  return assembleSinglePassRouteResult(request);
}

function routeEvent(): RouteLedgerEvent {
  const result = buildRouteLedgerEvent({
    route_result: routeResult(),
    final_assembly_packet: packet(),
    route_result_ref: "route_result.single_pass.final_output.001",
    final_assembly_packet_ref: "final_assembly.packet.final_output.001",
    event_id: "route_event.task_final_output_001.run_final_output_001.request_final_output_001",
    created_at: "2026-07-03T00:18:00.000Z"
  });
  if (result.event === null) throw new Error(result.errors.map((error) => error.message).join("; "));
  return result.event;
}

function builtRecord(): FinalOutputLedgerRecord {
  const result = buildFinalOutputLedgerRecord({
    final_assembly_packet: packet(),
    route_ledger_event: routeEvent(),
    route_event_ref: "route_event.task_final_output_001.run_final_output_001.request_final_output_001",
    route_result_ref: "route_result.single_pass.final_output.001",
    final_assembly_packet_ref: "final_assembly.packet.final_output.001",
    record_id: "final_output_record.task_final_output_001.run_final_output_001.assembly_final_output_001",
    created_at: "2026-07-03T00:18:00.000Z"
  });
  if (result.record === null) throw new Error(result.errors.map((error) => error.message).join("; "));
  return result.record;
}

function withTrust(overrides: Record<string, unknown>) {
  const record = builtRecord();
  return { ...record, trust_summary: { ...record.trust_summary, ...overrides } };
}

function withRelease(overrides: Record<string, unknown>) {
  const record = builtRecord();
  return { ...record, release_summary: { ...record.release_summary, ...overrides } };
}

function withLimitations(overrides: Record<string, unknown>) {
  const record = builtRecord();
  return { ...record, limitations: { ...record.limitations, ...overrides } };
}

describe("Final Output Ledger Record", () => {
  it("valid example passes", async () => expect(validateFinalOutputLedgerRecord(await readJson("examples/finalAssembly/final-output-ledger-record.valid.json")).ok).toBe(true));
  it("invalid trust promotion example fails", async () => expect(validateFinalOutputLedgerRecord(await readJson("examples/finalAssembly/final-output-ledger-record.invalid.trust-promotion.json")).ok).toBe(false));
  it("non-object fails", () => expect(validateFinalOutputLedgerRecord(null).ok).toBe(false));
  it("missing required fields fail", () => expect(validateFinalOutputLedgerRecord({}).ok).toBe(false));
  it("route_mode other than single_pass fails", () => expect(validateFinalOutputLedgerRecord({ ...builtRecord(), route_mode: "hollow_only" }).ok).toBe(false));
  it("invalid record_kind fails", () => expect(validateFinalOutputLedgerRecord({ ...builtRecord(), record_kind: "final_output" }).ok).toBe(false));
  it("final_packet_trust_tier above T1 fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ final_packet_trust_tier: "T2" })).ok).toBe(false));
  it("highest_model_output_trust_tier above T1 fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ highest_model_output_trust_tier: "T2" })).ok).toBe(false));
  it("max_allowed_trust_tier above T1 fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ max_allowed_trust_tier: "T2" })).ok).toBe(false));
  it("raw model trust other than T0 fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ raw_model_output_trust_tier: "T1" })).ok).toBe(false));
  it("schema-valid model trust other than T1 fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ schema_valid_model_output_trust_tier: "T2" })).ok).toBe(false));
  it("final_output_record_promotes_trust true fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ final_output_record_promotes_trust: true })).ok).toBe(false));
  it("ledger_write_promotes_trust true fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ ledger_write_promotes_trust: true })).ok).toBe(false));
  it("ledger_presence_promotes_trust true fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ ledger_presence_promotes_trust: true })).ok).toBe(false));
  it("final_assembly_promotes_trust true fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ final_assembly_promotes_trust: true })).ok).toBe(false));
  it("route_completion_promotes_trust true fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ route_completion_promotes_trust: true })).ok).toBe(false));
  it("storage_promotes_trust true fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ storage_promotes_trust: true })).ok).toBe(false));
  it("retrieval_promotes_trust true fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ retrieval_promotes_trust: true })).ok).toBe(false));
  it("model_output_is_deterministic_evidence true fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ model_output_is_deterministic_evidence: true })).ok).toBe(false));
  it("final_output_is_verified_truth true fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ final_output_is_verified_truth: true })).ok).toBe(false));
  it("requires_hollow_verification_for_t2 false fails", () => expect(validateFinalOutputLedgerRecord(withTrust({ requires_hollow_verification_for_t2: false })).ok).toBe(false));
  it("verified_final_truth_claimed true fails", () => expect(validateFinalOutputLedgerRecord(withRelease({ verified_final_truth_claimed: true })).ok).toBe(false));
  it("required_disclaimer_present false fails", () => expect(validateFinalOutputLedgerRecord(withRelease({ required_disclaimer_present: false })).ok).toBe(false));
  it("has_live_model_provider true fails", () => expect(validateFinalOutputLedgerRecord(withLimitations({ has_live_model_provider: true })).ok).toBe(false));
  it("has_real_model_api_layer true fails", () => expect(validateFinalOutputLedgerRecord(withLimitations({ has_real_model_api_layer: true })).ok).toBe(false));
  it("has_persistent_artifact_store true fails", () => expect(validateFinalOutputLedgerRecord(withLimitations({ has_persistent_artifact_store: true })).ok).toBe(false));
  it("has_hollow_execution true fails", () => expect(validateFinalOutputLedgerRecord(withLimitations({ has_hollow_execution: true })).ok).toBe(false));
  it("has_role_rotation true fails", () => expect(validateFinalOutputLedgerRecord(withLimitations({ has_role_rotation: true })).ok).toBe(false));
  it("write_intent.trust_effect other than none fails", () => { const record = builtRecord(); expect(validateFinalOutputLedgerRecord({ ...record, write_intent: { ...record.write_intent, trust_effect: "verified" } }).ok).toBe(false); });
  it("write_intent.append_only false fails", () => { const record = builtRecord(); expect(validateFinalOutputLedgerRecord({ ...record, write_intent: { ...record.write_intent, append_only: false } }).ok).toBe(false); });
  it("raw prompt text field is rejected if present", () => expect(validateFinalOutputLedgerRecord({ ...builtRecord(), raw_prompt_text: "prompt" }).ok).toBe(false));
  it("raw output text field is rejected if present", () => expect(validateFinalOutputLedgerRecord({ ...builtRecord(), raw_output_text: "output" }).ok).toBe(false));
  it("builder creates valid record from final assembly packet + route ledger event", () => expect(validateFinalOutputLedgerRecord(builtRecord()).ok).toBe(true));
  it("builder is deterministic with fixed timestamp/record id", () => expect(builtRecord()).toEqual(builtRecord()));
  it("builder does not include raw prompt/output text", () => expect(JSON.stringify(builtRecord())).not.toMatch(/"raw_prompt_text"|"raw_output_text"|"output_text"|"prompt"/));
  it("writer validates before write", async () => { const tempLedger = join(await mkdtemp(join(tmpdir(), "caleb-final-output-ledger-test-")), "ledger.jsonl"); const result = await writeFinalOutputLedgerRecord({}, { ledger_path: tempLedger }); expect(result.status).toBe("validation_failed"); await expect(readFile(tempLedger, "utf8")).rejects.toThrow(); });
  it("writer writes to isolated test ledger or mock writer only", async () => { const tempLedger = join(await mkdtemp(join(tmpdir(), "caleb-final-output-ledger-test-")), "ledger.jsonl"); const result = await writeFinalOutputLedgerRecord(builtRecord(), { ledger_path: tempLedger, ledger_id: "ledger_final_output_test_001", timestamp: "2026-07-03T00:18:00.000Z" }); expect(result.ok).toBe(true); expect(result.ledger_path).toBe(tempLedger); expect(await readFile(tempLedger, "utf8")).toContain("ledger_final_output_test_001"); });
  it("writer does not write raw prompt/output text", () => expect(JSON.stringify(createFinalOutputLedgerEntry(builtRecord()))).not.toMatch(/"raw_prompt_text"|"raw_output_text"|"output_text"|"prompt"/));
  it("writer does not promote trust", () => { const entry = createFinalOutputLedgerEntry(builtRecord()); expect(entry.trust_tier).toBe("T1"); expect(JSON.stringify(entry.result)).toContain("\"ledger_presence_promotes_trust\":false"); });
  it("isFinalOutputLedgerRecord returns true only for valid records", () => { expect(isFinalOutputLedgerRecord(builtRecord())).toBe(true); expect(isFinalOutputLedgerRecord(withTrust({ ledger_presence_promotes_trust: true }))).toBe(false); });
  it("assertFinalOutputLedgerRecord throws on invalid", () => expect(() => assertFinalOutputLedgerRecord(withTrust({ final_output_is_verified_truth: true }))).toThrow());
  it("source does not import provider SDKs", async () => { const source = `${await readFile("src/finalAssembly/finalOutputLedgerRecordBuilder.ts", "utf8")}\n${await readFile("src/finalAssembly/finalOutputLedgerRecordValidator.ts", "utf8")}\n${await readFile("src/finalAssembly/finalOutputLedgerRecordWriter.ts", "utf8")}`; expect(source).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i); });
  it("source does not call network APIs", async () => { const source = `${await readFile("src/finalAssembly/finalOutputLedgerRecordBuilder.ts", "utf8")}\n${await readFile("src/finalAssembly/finalOutputLedgerRecordValidator.ts", "utf8")}\n${await readFile("src/finalAssembly/finalOutputLedgerRecordWriter.ts", "utf8")}`; expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/); });
});
