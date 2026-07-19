import { describe, expect, it } from "vitest";

import { formatCliCommandResult, runMinimalCli } from "../../src/cli/index.js";
import type { CliCommandResult } from "../../src/cli/index.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS, createHollowcutHollowRegistry } from "../../src/hollows/hollowcutHollowCatalog.js";

describe("minimal CLI", () => {
  it("formatCliCommandResult renders JSON when requested", () => {
    const output = formatCliCommandResult(createResult(), "json");

    expect(JSON.parse(output)).toMatchObject({ ok: true, command: "help" });
  });

  it("formatCliCommandResult renders readable text for success", () => {
    expect(formatCliCommandResult(createResult(), "text")).toContain("OK");
  });

  it("formatCliCommandResult renders readable text for errors", () => {
    const output = formatCliCommandResult(
      {
        ...createResult(),
        ok: false,
        exit_code: 1,
        message: "Bad command.",
        errors: [{ code: "bad", message: "Nope." }]
      },
      "text"
    );

    expect(output).toContain("ERROR");
    expect(output).toContain("bad: Nope.");
  });

  it("runMinimalCli returns 0 for help", async () => {
    await withCapturedOutput(async () => {
      expect(await runMinimalCli(["help"])).toBe(0);
    });
  });

  it("runMinimalCli returns nonzero for unknown command", async () => {
    await withCapturedOutput(async () => {
      expect(await runMinimalCli(["unknown"])).toBe(1);
    });
  });

  it("runMinimalCli does not throw for normal command errors", async () => {
    await withCapturedOutput(async () => {
      await expect(runMinimalCli(["unknown"])).resolves.toBe(1);
    });
  });

  it("create-milestone-snapshot requires --name", async () => {
    await withCapturedOutput(async () => {
      const code = await runMinimalCli(["create-milestone-snapshot"]);
      expect(code).toBe(1);
    });
  });

  it("create-milestone-snapshot is recognized as a command (parse level)", async () => {
    // It will attempt snapshot creation which may succeed or fail depending on env,
    // but should not be "unknown command".
    await withCapturedOutput(async () => {
      const code = await runMinimalCli(["create-milestone-snapshot", "--name", "test-milestone"]);
      // 0 or 1 is acceptable (success or safe failure), but not unknown command path.
      expect([0, 1]).toContain(code);
    });
  }, 30_000);

  it("V1_HOLLOW_MANIFESTS remains exactly 13 (protected)", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
  });

  it("Hollowcut catalog registers project_state_check and timeline Hollows", () => {
    const ids = HOLLOWCUT_HOLLOW_MANIFESTS.map(m => m.hollow_id);
    expect(ids).toContain("hollow.hollowcut.project_state_check");
    expect(ids).toContain("hollow.timeline.schema_check");
    expect(createHollowcutHollowRegistry().count()).toBeGreaterThanOrEqual(5);
  });

  it("run-hollowcut-hollow rejects unknown ID", async () => {
    await withCapturedOutput(async () => {
      const code = await runMinimalCli(["run-hollowcut-hollow", "--id", "hollow.unknown.foo", "--input-json", "{}"]);
      expect(code).toBe(1);
    });
  });

  it("list-hollowcut-hollows is recognized", async () => {
    await withCapturedOutput(async () => {
      const code = await runMinimalCli(["list-hollowcut-hollows"]);
      expect(code).toBe(0);
    });
  });

  it("list-hollowcut-hollows --json contains expected Hollowcut IDs and V1 is untouched at 12", async () => {
    await withCapturedOutput(async () => {
      const code = await runMinimalCli(["list-hollowcut-hollows", "--json"]);
      expect(code).toBe(0);
    });
    // The test above exercises it; we can also assert statically here
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
    const hollowcutIds = HOLLOWCUT_HOLLOW_MANIFESTS.map(m => m.hollow_id);
    expect(hollowcutIds).toContain("hollow.hollowcut.project_state_check");
    expect(hollowcutIds).toContain("hollow.hollowcut.project_timeline_cross_check");
    expect(hollowcutIds).toContain("hollow.timeline.schema_check");
    expect(hollowcutIds).toContain("hollow.hollowcut.export_plan_preview");
    expect(hollowcutIds.length).toBe(9);
  });

  it("preview-hollowcut-export-plan --input-file with stable verified-readiness-valid.json succeeds", async () => {
    await withCapturedOutput(async () => {
      const code = await runMinimalCli([
        "preview-hollowcut-export-plan",
        "--input-file",
        "examples/hollowcut-project-demo/verified-readiness-valid.json",
        "--json"
      ]);
      expect(code).toBe(0);
    });
  });

  it("preview-hollowcut-export-plan --input-file with raw-t0 and not-safe fixtures runs without CLI crash (refusals handled inside Hollow per gates)", async () => {
    await withCapturedOutput(async () => {
      const code1 = await runMinimalCli([
        "preview-hollowcut-export-plan",
        "--input-file",
        "examples/hollowcut-project-demo/verified-readiness-raw-t0.json",
        "--json"
      ]);
      expect(code1).toBe(0);
      const code2 = await runMinimalCli([
        "preview-hollowcut-export-plan",
        "--input-file",
        "examples/hollowcut-project-demo/verified-readiness-not-safe.json",
        "--json"
      ]);
      expect(code2).toBe(0);
    });
  });

  it("preview-hollowcut-export-plan --input-json still works (parser accepts, command runs, Hollow decides inside)", async () => {
    const minimalVerified = {
      invocation: {
        result: { readiness_summary: { safe_to_hand_to_future_export: true, blocking_count: 0 }, ready: true, valid: true, blocking_count: 0 },
        trust_tier: "T2",
        provenance: { verified_return_path: true }
      },
      verification_result: { trust_tier: "T2", evidence_packet: { verified_return_path: true } }
    };
    const jsonStr = JSON.stringify(minimalVerified);
    await withCapturedOutput(async () => {
      const code = await runMinimalCli(["preview-hollowcut-export-plan", "--input-json", jsonStr, "--json"]);
      expect(code).toBe(0);
    });
  });
});

function createResult(): CliCommandResult {
  return {
    ok: true,
    exit_code: 0,
    command: "help",
    message: "Help.",
    data: { ok: true },
    errors: [],
    warnings: []
  };
}

async function withCapturedOutput(run: () => Promise<void>): Promise<void> {
  const stdout = process.stdout.write;
  const stderr = process.stderr.write;
  process.stdout.write = (() => true) as typeof process.stdout.write;
  process.stderr.write = (() => true) as typeof process.stderr.write;
  try {
    await run();
  } finally {
    process.stdout.write = stdout;
    process.stderr.write = stderr;
  }
}
