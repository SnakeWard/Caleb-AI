import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  assembleSinglePassRouteResult,
  runFinalAssemblyBoundary,
  validateFinalAssemblyPacket,
  validateFinalAssemblyRequest
} from "../../src/index.js";
import type { FinalAssemblyPacket, FinalAssemblyRequest } from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

function routeResult(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    status: "completed_t1",
    task_id: "task_final_assembly_001",
    run_id: "run_final_assembly_001",
    route_mode: "single_pass",
    request_id: "request_final_assembly_001",
    response_id: "request_final_assembly_001.mock_response",
    boundary_result: {
      ok: true,
      status: "accepted_t1",
      request_id: "request_final_assembly_001",
      response_id: "request_final_assembly_001.mock_response",
      raw_response_record_id: "model_boundary.request_final_assembly_001.mock_response.raw",
      validated_response_record_id: "model_boundary.request_final_assembly_001.mock_response.schema_valid"
    },
    model_invocation_record: {
      record_id: "model_invocation.request_final_assembly_001",
      record_kind: "mocked_single_pass_invocation",
      route_mode: "single_pass",
      adapter_kind: "mock"
    },
    storage_summary: {
      raw_response_record_id: "model_boundary.request_final_assembly_001.mock_response.raw",
      validated_response_record_id: "model_boundary.request_final_assembly_001.mock_response.schema_valid",
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

function validRequest(overrides: Record<string, unknown> = {}): FinalAssemblyRequest {
  return {
    schema_version: "0.1.0",
    task_id: "task_final_assembly_001",
    run_id: "run_final_assembly_001",
    assembly_id: "assembly_final_001",
    route_mode: "single_pass",
    route_result_ref: "route_result.single_pass.001",
    route_result: routeResult(),
    requested_output_type: "mock_user_response",
    created_at: "2026-07-02T19:35:00.000Z",
    ...overrides
  } as FinalAssemblyRequest;
}

function validPacket(overrides: Record<string, unknown> = {}): FinalAssemblyPacket {
  return {
    ...assembleSinglePassRouteResult(validRequest()),
    ...overrides
  } as FinalAssemblyPacket;
}

function withTrust(overrides: Record<string, unknown>) {
  const packet = validPacket();
  return {
    ...packet,
    trust_summary: {
      ...packet.trust_summary,
      ...overrides
    }
  };
}

function withLimitations(overrides: Record<string, unknown>) {
  const packet = validPacket();
  return {
    ...packet,
    limitations: {
      ...packet.limitations,
      ...overrides
    }
  };
}

describe("Final Assembly Boundary", () => {
  it("valid assembly request passes validator", () => {
    expect(validateFinalAssemblyRequest(validRequest()).ok).toBe(true);
  });

  it("invalid assembly request fails validator", () => {
    expect(validateFinalAssemblyRequest({}).ok).toBe(false);
  });

  it("route_mode other than single_pass fails", () => {
    expect(validateFinalAssemblyRequest(validRequest({ route_mode: "hollow_only" })).ok).toBe(false);
  });

  it("valid packet passes validator", () => {
    expect(validateFinalAssemblyPacket(validPacket()).ok).toBe(true);
  });

  it("invalid trust promotion packet fails", async () => {
    expect(validateFinalAssemblyPacket(await readJson("examples/finalAssembly/final-assembly-packet.invalid.trust-promotion.json")).ok).toBe(false);
  });

  it("packet claiming verified final truth fails", () => {
    expect(validateFinalAssemblyPacket(withTrust({ final_answer_claims_verified: true })).ok).toBe(false);
  });

  it("packet with final_packet_trust_tier above T1 fails", () => {
    expect(validateFinalAssemblyPacket(withTrust({ final_packet_trust_tier: "T2" })).ok).toBe(false);
  });

  it("packet with highest_model_output_trust_tier above T1 fails", () => {
    expect(validateFinalAssemblyPacket(withTrust({ highest_model_output_trust_tier: "T2" })).ok).toBe(false);
  });

  it("packet with route_completion_promotes_trust true fails", () => {
    expect(validateFinalAssemblyPacket(withTrust({ route_completion_promotes_trust: true })).ok).toBe(false);
  });

  it("packet with final_assembly_promotes_trust true fails", () => {
    expect(validateFinalAssemblyPacket(withTrust({ final_assembly_promotes_trust: true })).ok).toBe(false);
  });

  it("packet with storage_promotes_trust true fails", () => {
    expect(validateFinalAssemblyPacket(withTrust({ storage_promotes_trust: true })).ok).toBe(false);
  });

  it("packet with retrieval_promotes_trust true fails", () => {
    expect(validateFinalAssemblyPacket(withTrust({ retrieval_promotes_trust: true })).ok).toBe(false);
  });

  it("packet with model_output_is_deterministic_evidence true fails", () => {
    expect(validateFinalAssemblyPacket(withTrust({ model_output_is_deterministic_evidence: true })).ok).toBe(false);
  });

  it("packet with requires_hollow_verification_for_t2 false fails", () => {
    expect(validateFinalAssemblyPacket(withTrust({ requires_hollow_verification_for_t2: false })).ok).toBe(false);
  });

  it("packet with has_live_model_provider true fails", () => {
    expect(validateFinalAssemblyPacket(withLimitations({ has_live_model_provider: true })).ok).toBe(false);
  });

  it("packet with has_real_ledger_write true fails", () => {
    expect(validateFinalAssemblyPacket(withLimitations({ has_real_ledger_write: true })).ok).toBe(false);
  });

  it("packet with has_persistent_storage true fails", () => {
    expect(validateFinalAssemblyPacket(withLimitations({ has_persistent_storage: true })).ok).toBe(false);
  });

  it("packet with has_role_rotation true fails", () => {
    expect(validateFinalAssemblyPacket(withLimitations({ has_role_rotation: true })).ok).toBe(false);
  });

  it("packet without disclaimer fails", () => {
    const packet = validPacket();
    expect(validateFinalAssemblyPacket({
      ...packet,
      release_eligibility: {
        ...packet.release_eligibility,
        required_disclaimer: ""
      }
    }).ok).toBe(false);
  });

  it("assembler creates assembled_unverified packet from valid route result", () => {
    expect(runFinalAssemblyBoundary(validRequest()).packet?.status).toBe("assembled_unverified");
  });

  it("assembler preserves source refs", () => {
    const packet = assembleSinglePassRouteResult(validRequest());
    expect(packet.source_refs.route_result_ref).toBe("route_result.single_pass.001");
    expect(packet.source_refs.request_id).toBe("request_final_assembly_001");
    expect(packet.source_refs.response_id).toBe("request_final_assembly_001.mock_response");
    expect(packet.source_refs.raw_response_record_id).toContain(".raw");
    expect(packet.source_refs.validated_response_record_id).toContain(".schema_valid");
    expect(packet.source_refs.model_invocation_record_id).toBe("model_invocation.request_final_assembly_001");
  });

  it("assembler preserves trust limits", () => {
    const packet = assembleSinglePassRouteResult(validRequest());
    expect(packet.trust_summary.highest_model_output_trust_tier).toBe("T1");
    expect(packet.trust_summary.final_packet_trust_tier).toBe("T1");
  });

  it("assembler does not promote route trust", () => {
    const packet = assembleSinglePassRouteResult(validRequest());
    expect(packet.trust_summary.route_completion_promotes_trust).toBe(false);
    expect(packet.trust_summary.final_assembly_promotes_trust).toBe(false);
    expect(packet.trust_summary.final_answer_claims_verified).toBe(false);
  });

  it("assembler is deterministic with fixed input", () => {
    expect(assembleSinglePassRouteResult(validRequest())).toEqual(assembleSinglePassRouteResult(validRequest()));
  });

  it("assembler does not write files", async () => {
    const source = await readFile("src/finalAssembly/finalAssemblyBoundary.ts", "utf8");
    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });

  it("assembler does not write Ledger", async () => {
    const source = await readFile("src/finalAssembly/finalAssemblyBoundary.ts", "utf8");
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry/);
  });

  it("examples validate", async () => {
    expect(validateFinalAssemblyRequest(await readJson("examples/finalAssembly/final-assembly-request.valid.json")).ok).toBe(true);
    expect(validateFinalAssemblyPacket(await readJson("examples/finalAssembly/final-assembly-packet.valid.json")).ok).toBe(true);
    expect(validateFinalAssemblyPacket(await readJson("examples/finalAssembly/final-assembly-packet.invalid.trust-promotion.json")).ok).toBe(false);
  });
});
