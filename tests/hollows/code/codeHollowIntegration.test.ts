import { describe, expect, it } from "vitest";
import {
  HollowRegistry,
  HollowRunner,
  isV1SafeHollowManifest,
  validateHollowManifest
} from "../../../src/hollows/index.js";
import {
  codeHollowManifests,
  codeSafetyScanImplementation,
  codeSafetyScanManifest,
  exportSurfaceImplementation,
  exportSurfaceManifest,
  importSurfaceImplementation,
  importSurfaceManifest,
  lineCountImplementation,
  lineCountManifest
} from "../../../src/hollows/categories/code/index.js";
import { createLedgerEntryFromEvidence } from "../../../src/ledger/index.js";
import { VerifiedReturnPath } from "../../../src/verification/index.js";

describe("Code Hollow integration", () => {
  it("all code manifests validate", () => {
    expect(codeHollowManifests.every((manifest) => validateHollowManifest(manifest).valid)).toBe(true);
  });

  it("all code manifests are V1-safe", () => {
    expect(codeHollowManifests.every((manifest) => isV1SafeHollowManifest(manifest))).toBe(true);
  });

  it("HollowRegistry can register all code manifests", () => {
    expect(new HollowRegistry(codeHollowManifests).count()).toBe(4);
  });

  it("HollowRunner can run line count implementation", async () => {
    const record = await createCodeRunner().run({
      hollow_id: lineCountManifest.hollow_id,
      input_payload: { text: "one\ntwo" }
    });

    expect(record.status).toBe("completed");
  });

  it("runner output starts as T0/unverified", async () => {
    const record = await createCodeRunner().run({
      hollow_id: lineCountManifest.hollow_id,
      input_payload: { text: "one\ntwo" }
    });

    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });

  it("VerifiedReturnPath promotes completed deterministic line count output to T2", async () => {
    const record = await createCodeRunner().run({
      hollow_id: lineCountManifest.hollow_id,
      input_payload: { text: "one\ntwo" }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("EvidencePacket can become LedgerEntry", async () => {
    const record = await createCodeRunner().run({
      hollow_id: lineCountManifest.hollow_id,
      input_payload: { text: "one\ntwo" }
    });
    const evidence = new VerifiedReturnPath().verifyInvocation(record).evidence_packet!;
    const entry = createLedgerEntryFromEvidence(evidence);

    expect(entry.actor_type).toBe("verified_return_path");
    expect(entry.trust_tier).toBe("T2");
  });

  it("import surface warnings survive runner output", async () => {
    const record = await createCodeRunner().run({
      hollow_id: importSurfaceManifest.hollow_id,
      input_payload: { text: "const x = require('x');" }
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("require_detected");
  });

  it("code safety warnings survive runner output", async () => {
    const record = await createCodeRunner().run({
      hollow_id: codeSafetyScanManifest.hollow_id,
      input_payload: { text: "eval(code)" }
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("code_safety_signal_detected");
  });

  it("VerifiedReturnPath preserves warnings", async () => {
    const record = await createCodeRunner().run({
      hollow_id: codeSafetyScanManifest.hollow_id,
      input_payload: { text: "eval(code)" }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.warnings.map((warning) => warning.warning_id)).toContain(
      "code_safety_signal_detected"
    );
  });

  it("no code Hollow requests network, shell_command, workspace_write, or external_side_effect permissions", () => {
    for (const manifest of codeHollowManifests) {
      expect(manifest.network_access).toBe(false);
      expect(manifest.permissions).not.toContain("network");
      expect(manifest.permissions).not.toContain("shell_command");
      expect(manifest.permissions).not.toContain("workspace_write");
      expect(manifest.permissions).not.toContain("external_side_effect");
    }
  });

  it("code Hollows use permissions [\"none\"] only", () => {
    for (const manifest of codeHollowManifests) {
      expect(manifest.permissions).toEqual(["none"]);
      expect(manifest.permissions_required).toEqual([]);
    }
  });
});

function createCodeRunner(): HollowRunner {
  return new HollowRunner(new HollowRegistry(codeHollowManifests), {
    [lineCountManifest.hollow_id]: lineCountImplementation,
    [importSurfaceManifest.hollow_id]: importSurfaceImplementation,
    [exportSurfaceManifest.hollow_id]: exportSurfaceImplementation,
    [codeSafetyScanManifest.hollow_id]: codeSafetyScanImplementation
  });
}
