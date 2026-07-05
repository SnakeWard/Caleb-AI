import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { handleCliCommand } from "../../src/cli/commandHandlers.js";
import { parseCliArgs } from "../../src/cli/commandParser.js";

const UNSET_ENV_VAR = "CALEB_TEST_LIVE_KEY_INTENTIONALLY_UNSET";

async function makeWorkspace(): Promise<{ promptFile: string; ledgerPath: string }> {
  const dir = await mkdtemp(join(tmpdir(), "caleb-live-cli-"));
  const promptFile = join(dir, "prompt.txt");
  await writeFile(promptFile, "Reply with exactly one word: acknowledged", "utf8");
  return { promptFile, ledgerPath: join(dir, "ledger.jsonl") };
}

async function readLedgerEntries(ledgerPath: string): Promise<Array<Record<string, unknown>>> {
  const raw = await readFile(ledgerPath, "utf8");
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("run-one-provider-adapter-live CLI surface (offline refusal paths)", () => {
  it("rejects usage without --prompt-file", async () => {
    const result = await handleCliCommand(
      parseCliArgs(["run-one-provider-adapter-live", "--write-ledger", "--json"])
    );

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "missing_prompt_file")).toBe(true);
  });

  it("rejects usage without --write-ledger: live invocations must be ledgered", async () => {
    const { promptFile } = await makeWorkspace();
    const result = await handleCliCommand(
      parseCliArgs(["run-one-provider-adapter-live", "--prompt-file", promptFile, "--json"])
    );

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "ledger_write_required")).toBe(true);
  });

  it("refuses with structured prerequisites when opt-in gates are missing, ledgering evidence first", async () => {
    const { promptFile, ledgerPath } = await makeWorkspace();
    const result = await handleCliCommand(
      parseCliArgs([
        "run-one-provider-adapter-live",
        "--prompt-file",
        promptFile,
        "--write-ledger",
        "--ledger-path",
        ledgerPath,
        "--json"
      ])
    );

    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.refused).toBe(true);
    expect(data.network_attempted).toBe(false);
    expect(data.missing_prerequisites).toContain("explicit_opt_in");
    expect(data.missing_prerequisites).toContain("credential_source_declared_by_caller");

    const entries = await readLedgerEntries(ledgerPath);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.activity).toBe("one_provider_adapter_live_dry_run_evidence");
    expect(entries[1]?.activity).toBe("one_provider_adapter_live_refusal");
    expect(entries[1]?.parent_refs).toEqual([entries[0]?.ledger_id]);
  });

  it("returns a structured missing_api_key failure when the declared env var is unset, without network", async () => {
    const { promptFile, ledgerPath } = await makeWorkspace();
    delete process.env[UNSET_ENV_VAR];

    const result = await handleCliCommand(
      parseCliArgs([
        "run-one-provider-adapter-live",
        "--explicit-opt-in",
        "true",
        "--explicit-live-request",
        "true",
        "--network-permission",
        "true",
        "--kill-switch-open",
        "true",
        "--credential-env-var",
        UNSET_ENV_VAR,
        "--approved-by",
        "test_operator",
        "--prompt-file",
        promptFile,
        "--write-ledger",
        "--ledger-path",
        ledgerPath,
        "--json"
      ])
    );

    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.refused).toBe(false);
    const adapterResult = data.adapter_result as { ok: boolean; failure?: { failure_kind: string } };
    expect(adapterResult.ok).toBe(false);
    expect(adapterResult.failure?.failure_kind).toBe("missing_api_key");

    const entries = await readLedgerEntries(ledgerPath);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.activity).toBe("one_provider_adapter_live_dry_run_evidence");
    expect(entries[1]?.activity).toBe("one_provider_adapter_live_invocation");
    expect(entries[1]?.status).toBe("failed");
  });

  it("keeps the ledger free of raw prompt text on the refusal paths", async () => {
    const { promptFile, ledgerPath } = await makeWorkspace();
    await handleCliCommand(
      parseCliArgs([
        "run-one-provider-adapter-live",
        "--prompt-file",
        promptFile,
        "--write-ledger",
        "--ledger-path",
        ledgerPath,
        "--json"
      ])
    );

    const raw = await readFile(ledgerPath, "utf8");
    expect(raw).not.toContain("Reply with exactly one word");
  });

  it("rejects unknown flags at the parser", () => {
    const parsed = parseCliArgs(["run-one-provider-adapter-live", "--surprise-flag", "x"]);
    expect(parsed.errors.some((e) => e.code === "unknown_flag")).toBe(true);
  });

  it("rejects report-write flags: the live surface has no report path", () => {
    const parsed = parseCliArgs(["run-one-provider-adapter-live", "--write-report"]);
    expect(parsed.errors.some((e) => e.code === "unsupported_flag")).toBe(true);
  });

  it("rejects a non-allowlisted --adapter-id before any ledger work", async () => {
    const { promptFile } = await makeWorkspace();
    const result = await handleCliCommand(
      parseCliArgs([
        "run-one-provider-adapter-live",
        "--adapter-id",
        "unknown_live_adapter",
        "--prompt-file",
        promptFile,
        "--write-ledger",
        "--json"
      ])
    );

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "adapter_not_allowlisted")).toBe(true);
  });

  it("routes grok_live_adapter through the shared gate chain without network when prerequisites are missing", async () => {
    const { promptFile, ledgerPath } = await makeWorkspace();
    const result = await handleCliCommand(
      parseCliArgs([
        "run-one-provider-adapter-live",
        "--adapter-id",
        "grok_live_adapter",
        "--prompt-file",
        promptFile,
        "--write-ledger",
        "--ledger-path",
        ledgerPath,
        "--json"
      ])
    );

    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.refused).toBe(true);
    expect(data.network_attempted).toBe(false);

    const entries = await readLedgerEntries(ledgerPath);
    expect(entries[0]?.actor_id).toBe("grok_live_adapter");
  });
});
