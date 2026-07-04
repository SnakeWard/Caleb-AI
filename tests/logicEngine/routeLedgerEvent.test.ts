import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assembleSinglePassRouteResult,
  assertRouteLedgerEvent,
  buildRouteLedgerEvent,
  createRouteLedgerEventLedgerEntry,
  isRouteLedgerEvent,
  validateRouteLedgerEvent,
  writeRouteLedgerEvent
} from "../../src/index.js";
import type { FinalAssemblyRequest, RouteLedgerEvent } from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

function routeResult(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    status: "completed_t1",
    task_id: "task_route_ledger_001",
    run_id: "run_route_ledger_001",
    route_mode: "single_pass",
    request_id: "request_route_ledger_001",
    response_id: "request_route_ledger_001.mock_response",
    boundary_result: {
      ok: true,
      status: "accepted_t1",
      request_id: "request_route_ledger_001",
      response_id: "request_route_ledger_001.mock_response",
      raw_response_record_id: "model_boundary.request_route_ledger_001.mock_response.raw",
      validated_response_record_id: "model_boundary.request_route_ledger_001.mock_response.schema_valid"
    },
    model_invocation_record: {
      record_id: "model_invocation.request_route_ledger_001",
      record_kind: "mocked_single_pass_invocation",
      route_mode: "single_pass",
      adapter_kind: "mock"
    },
    storage_summary: {
      raw_response_record_id: "model_boundary.request_route_ledger_001.mock_response.raw",
      validated_response_record_id: "model_boundary.request_route_ledger_001.mock_response.schema_valid",
      total_records_after_route: 2,
      usable_final_evidence_count: 0,
      store_kind: "in_memory"
    },
    trust_summary: {
      raw_model_output_trust_tier: "T0",
      schema_valid_model_output_trust_tier: "T1",
      max_model_output_trust_tier: "T1",
      model_output_is_deterministic_evidence: false,
      route_completion_promotes_trust: false,
      storage_promotes_trust: false,
      retrieval_promotes_trust: false,
      notes: ["single_pass route MVP is orchestration proof, not verified final truth."]
    },
    issues: [],
    ...overrides
  };
}

function finalPacket() {
  const request: FinalAssemblyRequest = {
    schema_version: "0.1.0",
    task_id: "task_route_ledger_001",
    run_id: "run_route_ledger_001",
    assembly_id: "assembly_route_ledger_001",
    route_mode: "single_pass",
    route_result_ref: "route_result.single_pass.ledger.001",
    route_result: routeResult(),
    requested_output_type: "mock_user_response",
    created_at: "2026-07-02T19:50:00.000Z"
  };
  return assembleSinglePassRouteResult(request);
}

function builtEvent(): RouteLedgerEvent {
  const result = buildRouteLedgerEvent({
    route_result: routeResult(),
    final_assembly_packet: finalPacket(),
    route_result_ref: "route_result.single_pass.ledger.001",
    final_assembly_packet_ref: "final_assembly.packet.ledger.001",
    event_id: "route_event.task_route_ledger_001.run_route_ledger_001.request_route_ledger_001",
    created_at: "2026-07-02T19:50:00.000Z"
  });
  if (result.event === null) {
    throw new Error(result.errors.map((error) => error.message).join("; "));
  }
  return result.event;
}

function withTrust(overrides: Record<string, unknown>) {
  const event = builtEvent();
  return {
    ...event,
    trust_summary: {
      ...event.trust_summary,
      ...overrides
    }
  };
}

describe("Route Ledger Event", () => {
  it("valid example passes", async () => {
    expect(validateRouteLedgerEvent(await readJson("examples/logicEngine/route-ledger-event.valid.json")).ok).toBe(true);
  });

  it("invalid trust promotion example fails", async () => {
    expect(validateRouteLedgerEvent(await readJson("examples/logicEngine/route-ledger-event.invalid.trust-promotion.json")).ok).toBe(false);
  });

  it("non-object fails", () => {
    expect(validateRouteLedgerEvent(null).ok).toBe(false);
  });

  it("missing required fields fail", () => {
    expect(validateRouteLedgerEvent({}).ok).toBe(false);
  });

  it("route_mode other than single_pass fails", () => {
    expect(validateRouteLedgerEvent({ ...builtEvent(), route_mode: "hollow_only" }).ok).toBe(false);
  });

  it("invalid event_kind fails", () => {
    expect(validateRouteLedgerEvent({ ...builtEvent(), event_kind: "route_completed" }).ok).toBe(false);
  });

  it("raw model trust above T0 fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ raw_model_output_trust_tier: "T1" })).ok).toBe(false);
  });

  it("schema-valid model trust above T1 fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ schema_valid_model_output_trust_tier: "T2" })).ok).toBe(false);
  });

  it("max model output trust above T1 fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ max_model_output_trust_tier: "T2" })).ok).toBe(false);
  });

  it("final packet trust above T1 fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ final_packet_trust_tier: "T2" })).ok).toBe(false);
  });

  it("verified_final_truth_claimed true fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ verified_final_truth_claimed: true })).ok).toBe(false);
  });

  it("model_output_is_deterministic_evidence true fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ model_output_is_deterministic_evidence: true })).ok).toBe(false);
  });

  it("route_completion_promotes_trust true fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ route_completion_promotes_trust: true })).ok).toBe(false);
  });

  it("final_assembly_promotes_trust true fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ final_assembly_promotes_trust: true })).ok).toBe(false);
  });

  it("ledger_write_promotes_trust true fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ ledger_write_promotes_trust: true })).ok).toBe(false);
  });

  it("ledger_presence_promotes_trust true fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ ledger_presence_promotes_trust: true })).ok).toBe(false);
  });

  it("storage_promotes_trust true fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ storage_promotes_trust: true })).ok).toBe(false);
  });

  it("retrieval_promotes_trust true fails", () => {
    expect(validateRouteLedgerEvent(withTrust({ retrieval_promotes_trust: true })).ok).toBe(false);
  });

  it("write_intent.trust_effect other than none fails", () => {
    const event = builtEvent();
    expect(validateRouteLedgerEvent({ ...event, write_intent: { ...event.write_intent, trust_effect: "verified" } }).ok).toBe(false);
  });

  it("write_intent.append_only false fails", () => {
    const event = builtEvent();
    expect(validateRouteLedgerEvent({ ...event, write_intent: { ...event.write_intent, append_only: false } }).ok).toBe(false);
  });

  it("raw prompt text field is rejected if present", () => {
    expect(validateRouteLedgerEvent({ ...builtEvent(), raw_prompt: "do the thing" }).ok).toBe(false);
  });

  it("raw output text field is rejected if present", () => {
    expect(validateRouteLedgerEvent({ ...builtEvent(), raw_output_text: "model words" }).ok).toBe(false);
  });

  it("builder creates valid event from route result + final packet", () => {
    const result = buildRouteLedgerEvent({
      route_result: routeResult(),
      final_assembly_packet: finalPacket(),
      route_result_ref: "route_result.single_pass.ledger.001",
      final_assembly_packet_ref: "final_assembly.packet.ledger.001",
      created_at: "2026-07-02T19:50:00.000Z"
    });
    expect(result.ok).toBe(true);
    expect(result.event?.event_kind).toBe("mocked_single_pass_route_completed");
  });

  it("builder is deterministic with fixed timestamp/event id", () => {
    expect(builtEvent()).toEqual(builtEvent());
  });

  it("writer validates before write", async () => {
    const tempLedger = join(await mkdtemp(join(tmpdir(), "caleb-route-ledger-test-")), "ledger.jsonl");
    const result = await writeRouteLedgerEvent({}, { ledger_path: tempLedger });
    expect(result.status).toBe("validation_failed");
    await expect(readFile(tempLedger, "utf8")).rejects.toThrow();
  });

  it("writer writes to isolated test ledger or mock writer only", async () => {
    const tempLedger = join(await mkdtemp(join(tmpdir(), "caleb-route-ledger-test-")), "ledger.jsonl");
    const result = await writeRouteLedgerEvent(builtEvent(), {
      ledger_path: tempLedger,
      timestamp: "2026-07-02T19:50:00.000Z",
      ledger_id: "ledger_route_event_test_001"
    });
    expect(result.ok).toBe(true);
    expect(result.ledger_path).toBe(tempLedger);
    expect(await readFile(tempLedger, "utf8")).toContain("ledger_route_event_test_001");
  });

  it("writer does not write raw prompt/output text", async () => {
    const entry = createRouteLedgerEventLedgerEntry(builtEvent(), { ledger_id: "ledger_route_event_test_001" });
    expect(JSON.stringify(entry)).not.toMatch(/raw_prompt|prompt_text|raw_output_text|model_output_text/);
  });

  it("writer does not promote trust", () => {
    const entry = createRouteLedgerEventLedgerEntry(builtEvent());
    expect(entry.trust_tier).toBe("T1");
    expect(JSON.stringify(entry.result)).toContain("\"ledger_presence_promotes_trust\":false");
    expect(JSON.stringify(entry.result)).toContain("\"ledger_write_promotes_trust\":false");
  });

  it("isRouteLedgerEvent returns true only for valid events", () => {
    expect(isRouteLedgerEvent(builtEvent())).toBe(true);
    expect(isRouteLedgerEvent(withTrust({ ledger_presence_promotes_trust: true }))).toBe(false);
  });

  it("assertRouteLedgerEvent throws on invalid", () => {
    expect(() => assertRouteLedgerEvent(withTrust({ verified_final_truth_claimed: true }))).toThrow();
  });

  it("source does not import provider SDKs", async () => {
    const source = `${await readFile("src/logicEngine/routeLedgerEventBuilder.ts", "utf8")}\n${await readFile("src/logicEngine/routeLedgerEventValidator.ts", "utf8")}\n${await readFile("src/logicEngine/routeLedgerEventWriter.ts", "utf8")}`;
    expect(source).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });

  it("source does not call network APIs", async () => {
    const source = `${await readFile("src/logicEngine/routeLedgerEventBuilder.ts", "utf8")}\n${await readFile("src/logicEngine/routeLedgerEventValidator.ts", "utf8")}\n${await readFile("src/logicEngine/routeLedgerEventWriter.ts", "utf8")}`;
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/);
  });
});
