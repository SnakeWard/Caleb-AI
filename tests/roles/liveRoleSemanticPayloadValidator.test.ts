import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  LIVE_ROLE_SEMANTIC_MAX_ARRAY_LENGTH,
  LIVE_ROLE_SEMANTIC_MAX_STRING_LENGTH,
  validateLiveRoleSemanticPayload
} from "../../src/roles/liveRoleSemanticPayloadValidator.js";

function validPayload(): Record<string, unknown> {
  return {
    summary: "A bounded plan.",
    claims: [{ claim_id: "claim_1", text: "Do the bounded work.", evidence_ref_ids: ["evidence_1"] }],
    assumptions: ["Inputs remain inert."],
    constraints: ["No side effects."],
    open_questions: [],
    recommendations: ["Proceed through Caleb."],
    evidence_refs: [{ ref_id: "evidence_1", ref_type: "context", description: "Task context." }],
    confidence: 0.75,
    handoff_notes: ["Critic should verify constraints."],
    acceptance_status: "accepted"
  };
}

describe("LIVE-F4 semantic payload validator", () => {
  it("accepts the exact closed semantic contract", () => {
    expect(validateLiveRoleSemanticPayload(validPayload())).toEqual({ ok: true, issues: [] });
  });

  it("rejects the permanent attempt-three model-manufactured envelope at the payload boundary", async () => {
    const envelope = JSON.parse(await readFile(
      "examples/live-rotation/regressions/live-f4-attempt-three-envelope-shaped-payload.json",
      "utf8"
    ));
    const result = validateLiveRoleSemanticPayload(envelope);
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "unexpected_field",
      path: "$.schema_version"
    }));
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "unexpected_field",
      path: "$.artifact_id"
    }));
    expect(result.issues.map((entry) => entry.path)).toContain("$.required_next_role");
  });

  it("strictly checks required fields, closed shapes, array item types, and enums", () => {
    const payload = validPayload();
    delete payload["summary"];
    payload["unknown"] = true;
    payload["assumptions"] = [1];
    payload["acceptance_status"] = "invented";
    const result = validateLiveRoleSemanticPayload(payload);
    expect(result.issues.map(({ code }) => code)).toEqual(expect.arrayContaining([
      "missing_required_field",
      "unexpected_field",
      "invalid_array_item",
      "invalid_acceptance_status"
    ]));
  });

  it("strictly checks nested claim and evidence-reference shapes", () => {
    const payload = validPayload();
    payload["claims"] = [{ claim_id: "claim", text: "text", evidence_ref_ids: [3], extra: true }];
    payload["evidence_refs"] = [{ ref_id: "ref", ref_type: "wire_body", description: "bad" }];
    const result = validateLiveRoleSemanticPayload(payload);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "unexpected_field", path: "$.claims[0].extra" }),
      expect.objectContaining({ code: "invalid_array_item", path: "$.claims[0].evidence_ref_ids[0]" }),
      expect.objectContaining({ code: "invalid_evidence_ref_type", path: "$.evidence_refs[0].ref_type" })
    ]));
  });

  it("enforces the same recursive string and array bounds as RoleArtifact", () => {
    const payload = validPayload();
    payload["summary"] = "x".repeat(LIVE_ROLE_SEMANTIC_MAX_STRING_LENGTH + 1);
    payload["recommendations"] = Array.from(
      { length: LIVE_ROLE_SEMANTIC_MAX_ARRAY_LENGTH + 1 },
      () => "bounded"
    );
    const result = validateLiveRoleSemanticPayload(payload);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "string_too_long", path: "$.summary" }),
      expect.objectContaining({ code: "array_too_long", path: "$.recommendations" })
    ]));
  });

  it("rejects confidence outside zero through one and forbidden content recursively", () => {
    const payload = validPayload();
    payload["confidence"] = 2;
    payload["claims"] = [{
      claim_id: "claim",
      text: "text",
      evidence_ref_ids: [],
      scratchpad: "must not cross"
    }];
    const result = validateLiveRoleSemanticPayload(payload);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "invalid_confidence", path: "$.confidence" }),
      expect.objectContaining({ code: "forbidden_key", path: "$.claims[0].scratchpad" })
    ]));
  });
});
