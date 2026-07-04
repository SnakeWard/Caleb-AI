import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  HollowRegistry,
  HollowRunner,
  isV1SafeHollowManifest,
  validateHollowManifest
} from "../../../src/hollows/index.js";
import {
  fileHashImplementation,
  fileHashManifest,
  ledgerProvenanceImplementation,
  ledgerProvenanceManifest,
  provenanceHollowManifests
} from "../../../src/hollows/categories/provenance/index.js";
import { createLedgerEntryFromEvidence } from "../../../src/ledger/index.js";
import { VerifiedReturnPath } from "../../../src/verification/index.js";

describe("Provenance Hollow integration", () => {
  it("all provenance manifests validate", () => {
    expect(provenanceHollowManifests.every((manifest) => validateHollowManifest(manifest).valid)).toBe(true);
  });

  it("all provenance manifests are V1-safe", () => {
    expect(provenanceHollowManifests.every((manifest) => isV1SafeHollowManifest(manifest))).toBe(true);
  });

  it("HollowRegistry can register all provenance manifests", () => {
    expect(new HollowRegistry(provenanceHollowManifests).count()).toBe(2);
  });

  it("HollowRunner can run file hash implementation", async () => {
    const root = await createTempProject("hash me");
    const record = await createProvenanceRunner().run({
      hollow_id: fileHashManifest.hollow_id,
      input_payload: { project_root: root, relative_path: "src/file.txt" },
      permissions: ["read_only"]
    });

    expect(record.status).toBe("completed");
  });

  it("file hash runner output starts as T0/unverified", async () => {
    const root = await createTempProject("hash me");
    const record = await createProvenanceRunner().run({
      hollow_id: fileHashManifest.hollow_id,
      input_payload: { project_root: root, relative_path: "src/file.txt" },
      permissions: ["read_only"]
    });

    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });

  it("VerifiedReturnPath promotes completed deterministic file hash output to T2", async () => {
    const root = await createTempProject("hash me");
    const record = await createProvenanceRunner().run({
      hollow_id: fileHashManifest.hollow_id,
      input_payload: { project_root: root, relative_path: "src/file.txt" },
      permissions: ["read_only"]
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("EvidencePacket can become LedgerEntry", async () => {
    const root = await createTempProject("hash me");
    const record = await createProvenanceRunner().run({
      hollow_id: fileHashManifest.hollow_id,
      input_payload: { project_root: root, relative_path: "src/file.txt" },
      permissions: ["read_only"]
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);
    const entry = createLedgerEntryFromEvidence(result.evidence_packet!);

    expect(entry.trust_tier).toBe("T2");
    expect(entry.hollow_id).toBe(fileHashManifest.hollow_id);
  });

  it("Ledger provenance Hollow can inspect a LedgerEntry made from EvidencePacket", async () => {
    const root = await createTempProject("hash me");
    const fileHashRecord = await createProvenanceRunner().run({
      hollow_id: fileHashManifest.hollow_id,
      input_payload: { project_root: root, relative_path: "src/file.txt" },
      permissions: ["read_only"]
    });
    const evidence = new VerifiedReturnPath().verifyInvocation(fileHashRecord).evidence_packet!;
    const entry = createLedgerEntryFromEvidence(evidence);
    const ledgerRecord = await createProvenanceRunner().run({
      hollow_id: ledgerProvenanceManifest.hollow_id,
      input_payload: { entries: [entry] } as never
    });

    expect(ledgerRecord.status).toBe("completed");
    expect(ledgerRecord.result).toMatchObject({ entry_count: 1, valid_entry_count: 1 });
  });

  it("No provenance Hollow requests network, shell_command, workspace_write, or external_side_effect permissions", () => {
    for (const manifest of provenanceHollowManifests) {
      expect(manifest.network_access).toBe(false);
      expect(manifest.permissions).not.toContain("network");
      expect(manifest.permissions).not.toContain("shell_command");
      expect(manifest.permissions).not.toContain("workspace_write");
      expect(manifest.permissions).not.toContain("external_side_effect");
    }
  });

  it("file hash Hollow uses read_only permission only", () => {
    expect(fileHashManifest.permissions).toEqual(["read_only"]);
    expect(fileHashManifest.permissions_required).toEqual(["read_only"]);
  });
});

function createProvenanceRunner(): HollowRunner {
  return new HollowRunner(new HollowRegistry(provenanceHollowManifests), {
    [fileHashManifest.hollow_id]: fileHashImplementation,
    [ledgerProvenanceManifest.hollow_id]: ledgerProvenanceImplementation
  });
}

async function createTempProject(content: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "caleb-provenance-integration-"));
  const target = path.join(root, "src", "file.txt");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
  return root;
}
