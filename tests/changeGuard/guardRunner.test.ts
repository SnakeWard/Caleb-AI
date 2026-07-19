import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { GuardRunner } from "../../src/changeGuard/index.js";

describe("GuardRunner", () => {
  it("runCommand executes safe node command with args array", async () => {
    const runner = await createRunner();
    const result = await runner.runCommand({ command: process.execPath, args: ["-e", "console.log('ok')"], timeout_ms: 5000 });

    expect(result.status).toBe("passed");
  });

  it("runCommand captures stdout", async () => {
    const runner = await createRunner();
    const result = await runner.runCommand({ command: process.execPath, args: ["-e", "console.log('out')"], timeout_ms: 5000 });

    expect(result.stdout).toContain("out");
  }, 30_000);

  it("runCommand captures stderr", async () => {
    const runner = await createRunner();
    const result = await runner.runCommand({ command: process.execPath, args: ["-e", "console.error('err')"], timeout_ms: 5000 });

    expect(result.stderr).toContain("err");
  }, 30_000);

  it("runCommand returns failed status for nonzero exit without throwing", async () => {
    const runner = await createRunner();
    const result = await runner.runCommand({ command: process.execPath, args: ["-e", "process.exit(2)"], timeout_ms: 5000 });

    expect(result.status).toBe("failed");
    expect(result.exit_code).toBe(2);
  });

  it("runCommand times out a long command", async () => {
    const runner = await createRunner();
    const result = await runner.runCommand({
      command: process.execPath,
      args: ["-e", "setTimeout(()=>{}, 2000)"],
      timeout_ms: 50
    });

    expect(result.status).toBe("timed_out");
  });

  it("runCommand rejects cwd outside project root", async () => {
    const root = await mkdtemp(join(tmpdir(), "caleb-guard-test-"));
    const runner = new GuardRunner({ projectRoot: root });

    await expect(
      runner.runCommand({ command: process.execPath, args: ["-e", ""], cwd: "..", timeout_ms: 5000 })
    ).rejects.toThrow();
  });

  it("runCommands returns results in order", async () => {
    const runner = await createRunner();
    const results = await runner.runCommands([
      { command: process.execPath, args: ["-e", "console.log('one')"], timeout_ms: 5000 },
      { command: process.execPath, args: ["-e", "console.log('two')"], timeout_ms: 5000 }
    ]);

    expect(results.map((result) => result.stdout.trim())).toEqual(["one", "two"]);
  });

  it("guard runner never uses raw shell string input", async () => {
    const runner = await createRunner();

    await expect(
      runner.runCommand({ command: "", args: ["echo unsafe"], timeout_ms: 5000 })
    ).rejects.toThrow();
  });
});

async function createRunner(): Promise<GuardRunner> {
  return new GuardRunner({ projectRoot: await mkdtemp(join(tmpdir(), "caleb-guard-test-")) });
}
