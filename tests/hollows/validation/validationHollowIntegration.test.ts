import { describe, expect, it } from "vitest";
import {
  HollowRegistry,
  HollowRunner,
  isV1SafeHollowManifest,
  validateHollowManifest
} from "../../../src/hollows/index.js";
import {
  jsonSchemaValidatorImplementation,
  jsonSchemaValidatorManifest,
  placeholderDetectorImplementation,
  placeholderDetectorManifest,
  validationHollowManifests
} from "../../../src/hollows/categories/validation/index.js";
import { createLedgerEntryFromEvidence } from "../../../src/ledger/index.js";
import { VerifiedReturnPath } from "../../../src/verification/index.js";

describe("Validation Hollow integration", () => {
  it("all validation manifests validate", () => {
    expect(validationHollowManifests.every((manifest) => validateHollowManifest(manifest).valid)).toBe(true);
  });

  it("all validation manifests are V1-safe", () => {
    expect(validationHollowManifests.every((manifest) => isV1SafeHollowManifest(manifest))).toBe(true);
  });

  it("HollowRegistry can register all validation manifests", () => {
    expect(new HollowRegistry(validationHollowManifests).count()).toBe(2);
  });

  it("HollowRunner can run JSON schema validator implementation", async () => {
    const record = await createValidationRunner().run({
      hollow_id: jsonSchemaValidatorManifest.hollow_id,
      input_payload: { candidate: "Caleb", schema: { type: "string" } }
    });

    expect(record.status).toBe("completed");
  });

  it("runner output starts as T0/unverified", async () => {
    const record = await createValidationRunner().run({
      hollow_id: jsonSchemaValidatorManifest.hollow_id,
      input_payload: { candidate: "Caleb", schema: { type: "string" } }
    });

    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });

  it("VerifiedReturnPath promotes completed deterministic validation output to T2", async () => {
    const record = await createValidationRunner().run({
      hollow_id: jsonSchemaValidatorManifest.hollow_id,
      input_payload: { candidate: "Caleb", schema: { type: "string" } }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("EvidencePacket can become LedgerEntry", async () => {
    const record = await createValidationRunner().run({
      hollow_id: jsonSchemaValidatorManifest.hollow_id,
      input_payload: { candidate: "Caleb", schema: { type: "string" } }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    const entry = createLedgerEntryFromEvidence(result.evidence_packet!);
    expect(entry.actor_type).toBe("verified_return_path");
    expect(entry.trust_tier).toBe("T2");
  });

  it("placeholder detector warnings survive runner output", async () => {
    const record = await createValidationRunner().run({
      hollow_id: placeholderDetectorManifest.hollow_id,
      input_payload: { text: "TODO finish" }
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("placeholder_detected");
  });

  it("VerifiedReturnPath preserves placeholder warnings", async () => {
    const record = await createValidationRunner().run({
      hollow_id: placeholderDetectorManifest.hollow_id,
      input_payload: { text: "TODO finish" }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.warnings.map((warning) => warning.warning_id)).toContain(
      "placeholder_detected"
    );
  });

  it("validation Hollows request no network, shell_command, workspace_write, or external_side_effect permissions", () => {
    for (const manifest of validationHollowManifests) {
      expect(manifest.network_access).toBe(false);
      expect(manifest.permissions).not.toContain("network");
      expect(manifest.permissions).not.toContain("shell_command");
      expect(manifest.permissions).not.toContain("workspace_write");
      expect(manifest.permissions).not.toContain("external_side_effect");
    }
  });
});

function createValidationRunner(): HollowRunner {
  return new HollowRunner(new HollowRegistry(validationHollowManifests), {
    [jsonSchemaValidatorManifest.hollow_id]: jsonSchemaValidatorImplementation,
    [placeholderDetectorManifest.hollow_id]: placeholderDetectorImplementation
  });
}
