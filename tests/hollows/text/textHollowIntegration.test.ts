import { describe, expect, it } from "vitest";
import {
  HollowRegistry,
  HollowRunner,
  isV1SafeHollowManifest,
  validateHollowManifest,
} from "../../../src/hollows/index.js";
import {
  characterCountImplementation,
  characterCountManifest,
  promptLimitImplementation,
  promptLimitManifest,
  repetitionScanImplementation,
  sectionBalanceImplementation,
  textHollowManifests,
} from "../../../src/hollows/categories/text/index.js";
import { createLedgerEntryFromEvidence } from "../../../src/ledger/index.js";
import { VerifiedReturnPath } from "../../../src/verification/index.js";

const textImplementations = {
  [characterCountManifest.hollow_id]: characterCountImplementation,
  [promptLimitManifest.hollow_id]: promptLimitImplementation,
  "hollow.text.section_balance": sectionBalanceImplementation,
  "hollow.text.repetition_scan": repetitionScanImplementation,
};

describe("Text Hollow integration", () => {
  it("all text manifests validate", () => {
    for (const manifest of textHollowManifests) {
      expect(validateHollowManifest(manifest).valid).toBe(true);
    }
  });

  it("all text manifests are V1 safe", () => {
    for (const manifest of textHollowManifests) {
      expect(isV1SafeHollowManifest(manifest)).toBe(true);
    }
  });

  it("HollowRegistry can register all text manifests", () => {
    const registry = new HollowRegistry(textHollowManifests);

    expect(registry.count()).toBe(textHollowManifests.length);
  });

  it("HollowRunner can run character count implementation", async () => {
    const record = await createTextRunner().run({
      hollow_id: characterCountManifest.hollow_id,
      input_payload: { text: "Caleb AI" },
    });

    expect(record.status).toBe("completed");
    expect(record.hollow_id).toBe(characterCountManifest.hollow_id);
  });

  it("HollowRunner character count output starts as T0/unverified", async () => {
    const record = await createTextRunner().run({
      hollow_id: characterCountManifest.hollow_id,
      input_payload: { text: "Caleb AI" },
    });

    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });

  it("VerifiedReturnPath promotes completed deterministic character count to T2", async () => {
    const record = await createTextRunner().run({
      hollow_id: characterCountManifest.hollow_id,
      input_payload: { text: "Caleb AI" },
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.decision).toBe("accepted");
    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("EvidencePacket can become LedgerEntry through createLedgerEntryFromEvidence", async () => {
    const record = await createTextRunner().run({
      hollow_id: characterCountManifest.hollow_id,
      input_payload: { text: "Caleb AI" },
      task_id: "task_text_integration",
      run_id: "run_text_integration",
      trace_id: "trace_text_integration",
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet).toBeDefined();
    const entry = createLedgerEntryFromEvidence(result.evidence_packet!);

    expect(entry.actor_type).toBe("verified_return_path");
    expect(entry.trust_tier).toBe("T2");
    expect(entry.hollow_id).toBe(characterCountManifest.hollow_id);
  });

  it("Prompt limit Hollow over-limit warning survives runner output", async () => {
    const record = await createTextRunner().run({
      hollow_id: promptLimitManifest.hollow_id,
      input_payload: { text: "123456", limit: 5 },
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("prompt_limit_exceeded");
  });

  it("VerifiedReturnPath preserves prompt limit warning", async () => {
    const record = await createTextRunner().run({
      hollow_id: promptLimitManifest.hollow_id,
      input_payload: { text: "123456", limit: 5 },
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.warnings.map((warning) => warning.warning_id)).toContain(
      "prompt_limit_exceeded",
    );
  });

  it("No text Hollow requests network, shell_command, workspace_write, or external_side_effect permissions", () => {
    for (const manifest of textHollowManifests) {
      expect(manifest.network_access).toBe(false);
      expect(manifest.permissions).not.toContain("network");
      expect(manifest.permissions).not.toContain("shell_command");
      expect(manifest.permissions).not.toContain("workspace_write");
      expect(manifest.permissions).not.toContain("external_side_effect");
    }
  });
});

function createTextRunner(): HollowRunner {
  return new HollowRunner(new HollowRegistry(textHollowManifests), textImplementations);
}
