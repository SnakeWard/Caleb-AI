import { spawn } from "node:child_process";
import { readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

const TSX_CLI = resolve("node_modules/tsx/dist/cli.mjs");
const CLI_ENTRY = resolve("src/cli/index.ts");
const PROJECT_CALEB_ROOT = resolve(".caleb");

vi.setConfig({ testTimeout: 20000 });

describe("CLI smoke tests", () => {
  it("CLI help exits 0", async () => {
    expect((await runCli(["help"])).exitCode).toBe(0);
  });

  it("CLI info exits 0 and includes Caleb AI doctrine", async () => {
    const result = await runCli(["info"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Models think. Hollows work. Caleb orchestrates.");
  });

  it("CLI list-hollows --json exits 0 and returns parseable JSON", async () => {
    const parsed = parseJsonResult(await runCli(["list-hollows", "--json"]));

    expect(parsed.ok).toBe(true);
    expect(Array.isArray(parsed.data.hollows)).toBe(true);
  });

  it("list-hollows includes hollow.text.character_count", async () => {
    const parsed = parseJsonResult(await runCli(["list-hollows", "--json"]));

    expect(JSON.stringify(parsed.data)).toContain("hollow.text.character_count");
  });

  it("inspect-hollow --id hollow.text.character_count --json exits 0 and returns manifest JSON", async () => {
    const parsed = parseJsonResult(
      await runCli(["inspect-hollow", "--id", "hollow.text.character_count", "--json"])
    );

    expect(parsed.ok).toBe(true);
    expect(parsed.data.manifest.hollow_id).toBe("hollow.text.character_count");
  });

  it("run-hollow character count with --input-json exits 0", async () => {
    expect((await runCharacterCount()).exitCode).toBe(0);
  });

  it("run-hollow character count JSON output includes invocation status completed", async () => {
    const parsed = parseJsonResult(await runCharacterCount());

    expect(parsed.data.invocation.status).toBe("completed");
  });

  it("run-hollow character count JSON output includes verification result accepted", async () => {
    const parsed = parseJsonResult(await runCharacterCount());

    expect(parsed.data.verification_result.decision).toBe("accepted");
  });

  it("run-hollow character count JSON output includes evidence trust_tier T2", async () => {
    const parsed = parseJsonResult(await runCharacterCount());

    expect(parsed.data.evidence_packet.trust_tier).toBe("T2");
  });

  it("run-hollow prompt limit fixture exits 0", async () => {
    const result = await runCli([
      "run-hollow",
      "--id",
      "hollow.text.prompt_limit",
      "--input-file",
      "examples/v1-demo/prompt-limit-input.json",
      "--json"
    ]);

    expect(result.exitCode).toBe(0);
  });

  it("run-hollow placeholder detector fixture preserves warning/finding in output", async () => {
    const parsed = parseJsonResult(
      await runCli([
        "run-hollow",
        "--id",
        "hollow.validation.placeholder_detector",
        "--input-file",
        "examples/v1-demo/placeholder-detector-input.json",
        "--json"
      ])
    );

    expect(JSON.stringify(parsed.data)).toContain("placeholder_detected");
    expect(JSON.stringify(parsed.data)).toContain("TODO");
  });

  it("run-hollow code safety fixture preserves warning/finding in output", async () => {
    const parsed = parseJsonResult(
      await runCli([
        "run-hollow",
        "--id",
        "hollow.code.safety_scan",
        "--input-file",
        "examples/v1-demo/code-safety-input.json",
        "--json"
      ])
    );

    expect(JSON.stringify(parsed.data)).toContain("code_safety_signal_detected");
    expect(JSON.stringify(parsed.data)).toContain("child_process");
  });

  it("run-hollow with --write-ledger writes temp ledger file", async () => {
    await withTempDir(async (dir) => {
      const ledgerPath = join(dir, "ledger.jsonl");
      const result = await runCharacterCount(["--write-ledger", "--ledger-path", ledgerPath]);

      expect(result.exitCode).toBe(0);
      expect((await stat(ledgerPath)).isFile()).toBe(true);
    });
  });

  it("temp ledger file contains invocation and evidence entries when --write-ledger is used", async () => {
    await withTempDir(async (dir) => {
      const ledgerPath = join(dir, "ledger.jsonl");
      await runCharacterCount(["--write-ledger", "--ledger-path", ledgerPath]);
      const lines = (await readFile(ledgerPath, "utf8")).trim().split(/\r?\n/u);

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain("hollow_invocation");
      expect(lines[1]).toContain("evidence_packet_created");
    });
  });

  it("run-hollow with --write-report writes temp report files", async () => {
    await withTempDir(async (dir) => {
      const parsed = parseJsonResult(await runCharacterCount(["--write-report", "--report-dir", dir]));
      const files = await readdir(dir);

      expect(files.some((file) => file.endsWith(".md"))).toBe(true);
      expect(files.some((file) => file.endsWith(".json"))).toBe(true);
      expect(parsed.data.report_paths.markdown_path).toContain(dir);
    });
  });

  it("no ledger file is written when --write-ledger is absent", async () => {
    await withTempDir(async (dir) => {
      const ledgerPath = join(dir, "ledger.jsonl");
      await runCharacterCount(["--ledger-path", ledgerPath]);

      await expect(stat(ledgerPath)).rejects.toThrow();
    });
  });

  it("no report files are written when --write-report is absent", async () => {
    await withTempDir(async (dir) => {
      await runCharacterCount(["--report-dir", dir]);

      expect(await readdir(dir)).toEqual([]);
    });
  });

  it("unknown Hollow ID exits nonzero", async () => {
    const result = await runCli([
      "run-hollow",
      "--id",
      "hollow.future.nope",
      "--input-json",
      "{\"text\":\"hello\"}",
      "--json"
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(JSON.parse(result.stderr).errors[0].code).toBe("hollow_not_found");
  });

  it("malformed input JSON exits nonzero", async () => {
    const result = await runCli([
      "run-hollow",
      "--id",
      "hollow.text.character_count",
      "--input-json",
      "{",
      "--json"
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(JSON.parse(result.stderr).errors[0].code).toBe("invalid_json");
  });

  it("no smoke test writes to real project .caleb", async () => {
    await withTempDir(async (dir) => {
      const ledgerPath = join(dir, "ledger.jsonl");
      const reportDir = join(dir, "reports");
      await runCharacterCount([
        "--write-ledger",
        "--ledger-path",
        ledgerPath,
        "--write-report",
        "--report-dir",
        reportDir
      ]);

      expect(resolve(ledgerPath).startsWith(PROJECT_CALEB_ROOT)).toBe(false);
      expect(resolve(reportDir).startsWith(PROJECT_CALEB_ROOT)).toBe(false);
    });
  });
});

interface CliProcessResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function runCharacterCount(extraArgs: readonly string[] = []): Promise<CliProcessResult> {
  return runCli([
    "run-hollow",
    "--id",
    "hollow.text.character_count",
    "--input-json",
    "{\"text\":\"Caleb\"}",
    "--json",
    ...extraArgs
  ]);
}

function runCli(args: readonly string[]): Promise<CliProcessResult> {
  return new Promise((resolveProcess, reject) => {
    const child = spawn(process.execPath, [TSX_CLI, CLI_ENTRY, ...args], {
      cwd: resolve("."),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolveProcess({ exitCode, stdout, stderr });
    });
  });
}

function parseJsonResult(result: CliProcessResult): any {
  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout);
}

async function withTempDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await import("node:fs/promises").then((fs) =>
    fs.mkdtemp(join(tmpdir(), "caleb-cli-smoke-"))
  );
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
