import { mkdtemp, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { handleCliCommand, parseCliArgs } from "../../src/cli/index.js";
import { SnapshotManager } from "../../src/changeGuard/index.js";
import {
  createV1HollowRunner,
  isV1SafeHollowManifest,
  validateHollowManifest,
  V1_HOLLOW_IMPLEMENTATIONS,
  V1_HOLLOW_MANIFESTS
} from "../../src/hollows/index.js";
import { createLedgerEntryFromEvidence } from "../../src/ledger/index.js";
import { buildCalebReport } from "../../src/reports/index.js";
import { VerifiedReturnPath } from "../../src/verification/index.js";

const EXPECTED_V1_HOLLOW_IDS = [
  "hollow.audit.pass_compliance_check",
  "hollow.code.export_surface",
  "hollow.code.import_surface",
  "hollow.code.line_count",
  "hollow.code.safety_scan",
  "hollow.provenance.file_hash",
  "hollow.provenance.ledger_provenance",
  "hollow.text.character_count",
  "hollow.text.prompt_limit",
  "hollow.text.repetition_scan",
  "hollow.text.section_balance",
  "hollow.validation.json_schema_validator",
  "hollow.validation.placeholder_detector"
];

describe("V1 MVP acceptance", () => {
  it("contains exactly the 13 expected production Hollows", () => {
    const ids = V1_HOLLOW_MANIFESTS.map((manifest) => manifest.hollow_id).sort();

    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
    expect(ids).toEqual(EXPECTED_V1_HOLLOW_IDS);
  });

  it("validates every manifest and confirms each is V1-safe", () => {
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(validateHollowManifest(manifest).valid).toBe(true);
      expect(isV1SafeHollowManifest(manifest)).toBe(true);
    }
  });

  it("has an implementation for every V1 Hollow manifest", () => {
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(typeof V1_HOLLOW_IMPLEMENTATIONS[manifest.hollow_id]).toBe("function");
    }
  });

  it("does not include forbidden side-effect permissions in V1 Hollows", () => {
    const forbidden = new Set(["network", "shell_command", "external_side_effect", "workspace_write"]);

    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(manifest.permissions.some((permission) => forbidden.has(permission))).toBe(false);
    }
  });

  it("runs character count through Runner, Verified Return Path, Ledger factory, and Report Builder", async () => {
    const runner = createV1HollowRunner();
    const invocation = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb AI" }
    });

    expect(invocation.status).toBe("completed");
    expect(invocation.trust_tier).toBe("T0");
    expect(invocation.verification_status).toBe("unverified");

    const verification = new VerifiedReturnPath().verifyInvocation(invocation);
    expect(verification.decision).toBe("accepted");
    expect(verification.evidence_packet?.trust_tier).toBe("T2");

    const evidence = verification.evidence_packet;
    expect(evidence).toBeDefined();
    const ledgerEntry = createLedgerEntryFromEvidence(evidence!);
    expect(ledgerEntry.trust_tier).toBe("T2");

    const report = buildCalebReport({
      title: "Acceptance Character Count",
      invocations: [invocation],
      verification_results: [verification],
      evidence_packets: [evidence!],
      ledger_entries: [ledgerEntry]
    });
    expect(report.stats.invocation_count).toBe(1);
    expect(report.stats.evidence_packet_count).toBe(1);
    expect(report.stats.ledger_entry_count).toBe(1);
  });

  it("lists all 13 Hollows through the CLI handler", async () => {
    const result = await handleCliCommand(parseCliArgs(["list-hollows", "--json"]));
    const data = result.data as { hollows: Array<{ hollow_id: string }> };

    expect(result.ok).toBe(true);
    expect(data.hollows.map((hollow) => hollow.hollow_id).sort()).toEqual(EXPECTED_V1_HOLLOW_IDS);
  });

  it("runs character count through the CLI handler from JSON input", async () => {
    const result = await handleCliCommand(
      parseCliArgs(["run-hollow", "--id", "hollow.text.character_count", "--input-json", "{\"text\":\"hello\"}", "--json"])
    );
    const data = result.data as {
      invocation: { status: string; trust_tier: string; verification_status: string };
      verification_result: { decision: string };
      evidence_packet: { trust_tier: string };
    };

    expect(result.ok).toBe(true);
    expect(data.invocation.status).toBe("completed");
    expect(data.invocation.trust_tier).toBe("T0");
    expect(data.invocation.verification_status).toBe("unverified");
    expect(data.verification_result.decision).toBe("accepted");
    expect(data.evidence_packet.trust_tier).toBe("T2");
  });

  it("writes Ledger and report artifacts only when explicitly requested", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "caleb-v1-acceptance-"));
    const ledgerPath = join(tempRoot, "ledger.jsonl");
    const reportDir = join(tempRoot, "reports");

    const writeResult = await handleCliCommand(
      parseCliArgs([
        "run-hollow",
        "--id",
        "hollow.text.character_count",
        "--input-json",
        "{\"text\":\"hello\"}",
        "--write-ledger",
        "--ledger-path",
        ledgerPath,
        "--write-report",
        "--report-dir",
        reportDir,
        "--json"
      ])
    );
    const writeData = writeResult.data as {
      ledger_entries: unknown[];
      report_paths: { markdown_path: string | null; json_path: string | null };
    };

    expect(writeResult.ok).toBe(true);
    expect(writeData.ledger_entries).toHaveLength(2);
    expect((await readFile(ledgerPath, "utf8")).trim().split("\n")).toHaveLength(2);
    expect(writeData.report_paths.markdown_path).toBeTruthy();
    expect(writeData.report_paths.json_path).toBeTruthy();
    expect(await stat(writeData.report_paths.markdown_path!)).toBeTruthy();
    expect(await stat(writeData.report_paths.json_path!)).toBeTruthy();

    const noWriteRoot = await mkdtemp(join(tmpdir(), "caleb-v1-no-write-"));
    const noWriteLedgerPath = join(noWriteRoot, "ledger.jsonl");
    const noWriteReportDir = join(noWriteRoot, "reports");
    const noWriteResult = await handleCliCommand(
      parseCliArgs([
        "run-hollow",
        "--id",
        "hollow.text.character_count",
        "--input-json",
        "{\"text\":\"hello\"}",
        "--ledger-path",
        noWriteLedgerPath,
        "--report-dir",
        noWriteReportDir,
        "--json"
      ])
    );

    expect(noWriteResult.ok).toBe(true);
    await expect(stat(noWriteLedgerPath)).rejects.toThrow();
    await expect(readdir(noWriteReportDir)).rejects.toThrow();
    expect(resolve(noWriteLedgerPath).startsWith(resolve(".caleb"))).toBe(false);
    expect(resolve(noWriteReportDir).startsWith(resolve(".caleb"))).toBe(false);
  });

  it("creates a temp pre-change snapshot without writing to project .caleb", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "caleb-v1-snapshot-"));
    await writeFile(join(tempRoot, "sample.txt"), "snapshot me", "utf8");
    const snapshotRoot = join(tempRoot, "snapshots");
    const manager = new SnapshotManager({ projectRoot: tempRoot, snapshotRoot });

    const result = await manager.createPreChangeSnapshot({
      reason: "Acceptance temp snapshot",
      requested_change: "Pass 12 acceptance test",
      files_to_capture: ["sample.txt"],
      run_id: "run_acceptance",
      trace_id: "trace_acceptance",
      requested_by: "acceptance-test"
    });

    expect(result.snapshot_id).toContain("pre_change");
    expect(result.captured_files.map((file) => file.relative_path)).toEqual(["sample.txt"]);
    expect(resolve(result.snapshot_path).startsWith(resolve(".caleb"))).toBe(false);
  });
});
