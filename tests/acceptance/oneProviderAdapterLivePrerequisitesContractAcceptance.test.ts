import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { handleCliCommand, parseCliArgs } from "../../src/cli/index.js";

const root = new URL("../../", import.meta.url);

function file(path: string): string {
  return fileURLToPath(new URL(path, root));
}

function read(path: string): string {
  return readFileSync(new URL(path, root), "utf8");
}

const DOC = "docs/ONE_PROVIDER_ADAPTER_LIVE_PREREQUISITES_CONTRACT.md";

describe("one provider adapter live prerequisites contract acceptance", () => {
  it("creates required R35 files", () => {
    const required = [DOC, "tests/acceptance/oneProviderAdapterLivePrerequisitesContractAcceptance.test.ts"];
    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents exact title and contract-only status", () => {
    const doc = read(DOC);
    expect(doc).toContain("# One Provider Adapter Live Prerequisites Contract");
    expect(doc).toContain("Status: Contract-only boundary");
    expect(doc).toContain("Prior pass: R34 — One Provider Adapter Dry-Run CLI Surface Behind Explicit Opt-In");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read(DOC);
    const phrases = [
      "No live provider adapter is added.",
      "No provider SDK/package changes are added.",
      "No API-key or process.env reads are added.",
      "No network calls or live execution are added.",
      "No fake provider success, provider response simulation, provider output, or provider content is added."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents all required future prerequisite fields", () => {
    const doc = read(DOC);
    const fields = [
      "repo_root_confirmed",
      "explicit_opt_in",
      "explicit_live_request",
      "provider_adapter_allowlisted",
      "live_harness_allowlisted",
      "credential_source_declared_by_caller",
      "credential_auto_read",
      "network_permission_granted_by_caller",
      "explicit_live_command_or_flag",
      "dry_run_report_completed",
      "default_tests_non_live",
      "default_acceptance_non_live",
      "default_ci_non_live",
      "provider_output_trust_ceiling",
      "vrp_evidence_required_for_T2",
      "created_at"
    ];
    for (const fieldName of fields) expect(doc).toContain(fieldName);
  });

  it("locks required prerequisite values", () => {
    const doc = read(DOC);
    expect(doc).toContain("`credential_auto_read` must be `false`.");
    expect(doc).toContain("`default_tests_non_live` must be `true`.");
    expect(doc).toContain("`default_acceptance_non_live` must be `true`.");
    expect(doc).toContain("`default_ci_non_live` must be `true`.");
    expect(doc).toContain("`provider_output_trust_ceiling` must be `T1`.");
    expect(doc).toContain("`vrp_evidence_required_for_T2` must be `true`.");
  });

  it("locks trust boundaries", () => {
    const doc = read(DOC);
    const phrases = [
      "Raw provider output = T0.",
      "Schema-valid provider output = T1 maximum.",
      "Explicit opt-in does not promote trust.",
      "Explicit live request does not promote trust.",
      "Provider identity does not promote trust.",
      "Network success does not promote trust.",
      "Provider response does not promote trust.",
      "Ledger presence does not promote trust.",
      "Storage does not increase trust.",
      "T2 requires VRP-verified deterministic Hollow evidence."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("contains exact final verdict", () => {
    const doc = read(DOC);
    expect(doc).toContain("One Provider Adapter Live Prerequisites Contract: Accepted");
    expect(doc).toContain("Status: Live prerequisites contract locked; no live provider behavior added");
    expect(doc).toContain("Next phase: One provider adapter live prerequisites evaluator");
  });

  it("updates PLANS.md with R35", () => {
    expect(read("PLANS.md")).toContain("R35");
  });

  it("keeps production catalog counts unchanged", async () => {
    const v1 = await handleCliCommand(parseCliArgs(["list-hollows", "--json"]));
    const hollowcut = await handleCliCommand(parseCliArgs(["list-hollowcut-hollows", "--json"]));
    const v1Data = v1.data as { hollows: unknown[] };
    const hollowcutData = hollowcut.data as { hollows: unknown[] };
    expect(v1.ok).toBe(true);
    expect(v1Data.hollows).toHaveLength(12);
    expect(hollowcut.ok).toBe(true);
    expect(hollowcutData.hollows).toHaveLength(9);
  });
});
