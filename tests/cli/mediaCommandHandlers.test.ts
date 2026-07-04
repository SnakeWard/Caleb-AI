import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { handleCliCommand, parseCliArgs } from "../../src/cli/index.js";

describe("CLI media command handlers", () => {
  it("list-media-hollows returns exactly 4 media Hollows", async () => {
    const result = await handleCliCommand(parseCliArgs(["list-media-hollows"]));

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ hollows: expect.any(Array) });
    expect((result.data as { hollows: unknown[] }).hollows).toHaveLength(4);
  });

  it("list-media-hollows does not include hollow.text.character_count", async () => {
    const result = await handleCliCommand(parseCliArgs(["list-media-hollows"]));

    expect(JSON.stringify(result.data)).not.toContain("hollow.text.character_count");
  });

  it("inspect-media-hollow returns manifest for hollow.media.aspect_ratio", async () => {
    const result = await handleCliCommand(
      parseCliArgs(["inspect-media-hollow", "--id", "hollow.media.aspect_ratio"])
    );

    expect(result.data).toMatchObject({ manifest: { hollow_id: "hollow.media.aspect_ratio" } });
  });

  it("inspect-media-hollow returns error for V1-only Hollow ID", async () => {
    const result = await handleCliCommand(
      parseCliArgs(["inspect-media-hollow", "--id", "hollow.text.character_count"])
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("hollow_not_found");
  });

  it("run-media-hollow executes aspect ratio from input-json", async () => {
    const result = await runMediaAspectRatio();

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      invocation: {
        hollow_id: "hollow.media.aspect_ratio",
        result: { aspect_ratio_label: "16:9" }
      }
    });
  });

  it("run-media-hollow output invocation starts T0/unverified", async () => {
    const result = await runMediaAspectRatio();

    expect(result.data).toMatchObject({
      invocation: { trust_tier: "T0", verification_status: "unverified" }
    });
  });

  it("run-media-hollow returns verification result with T2 evidence for valid deterministic media Hollow", async () => {
    const result = await runMediaAspectRatio();

    expect(result.data).toMatchObject({
      verification_result: { trust_tier: "T2" },
      evidence_packet: { trust_tier: "T2" }
    });
  });

  it("run-media-hollow audio duration works with provided metadata", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "run-media-hollow",
        "--id",
        "hollow.media.audio_duration",
        "--input-json",
        "{\"metadata_hint\":{\"duration_ms\":123456}}"
      ])
    );

    expect(result.data).toMatchObject({
      invocation: { result: { duration_ms: 123456, duration_source: "provided_metadata" } }
    });
  });

  it("run-media-hollow video duration works with provided metadata", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "run-media-hollow",
        "--id",
        "hollow.media.video_duration",
        "--input-json",
        "{\"metadata_hint\":{\"duration_ms\":123456,\"frame_rate_hint\":30}}"
      ])
    );

    expect(result.data).toMatchObject({
      invocation: { result: { duration_ms: 123456, frame_rate_valid: true } }
    });
  });

  it("run-media-hollow does not write Ledger when --write-ledger absent", async () => {
    await withTempDir(async (dir) => {
      const ledgerPath = join(dir, "media-ledger.jsonl");
      await runMediaAspectRatio(["--ledger-path", ledgerPath]);

      await expect(stat(ledgerPath)).rejects.toThrow();
    });
  });

  it("run-media-hollow writes Ledger entries to temp ledger path when --write-ledger present", async () => {
    await withTempDir(async (dir) => {
      const ledgerPath = join(dir, "media-ledger.jsonl");
      const result = await runMediaAspectRatio(["--write-ledger", "--ledger-path", ledgerPath]);

      expect(result.ok).toBe(true);
      expect((await readFile(ledgerPath, "utf8")).trim().split(/\r?\n/u)).toHaveLength(2);
    });
  });

  it("run-media-hollow does not write report when --write-report absent", async () => {
    await withTempDir(async (dir) => {
      await runMediaAspectRatio(["--report-dir", dir]);

      expect(await readdir(dir)).toEqual([]);
    });
  });

  it("run-media-hollow writes report files to temp report dir when --write-report present", async () => {
    await withTempDir(async (dir) => {
      const result = await runMediaAspectRatio(["--write-report", "--report-dir", dir]);

      expect(result.ok).toBe(true);
      expect(JSON.stringify(result.data)).toContain(".md");
      expect(JSON.stringify(result.data)).toContain(".json");
    });
  });

  it("run-media-hollow rejects V1-only Hollow ID", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "run-media-hollow",
        "--id",
        "hollow.text.character_count",
        "--input-json",
        "{\"text\":\"Caleb\"}"
      ])
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("hollow_not_found");
  });

  it("run-hollow still rejects media Hollow ID", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "run-hollow",
        "--id",
        "hollow.media.aspect_ratio",
        "--input-json",
        "{\"width\":1920,\"height\":1080}"
      ])
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("hollow_not_found");
  });

  it("list-hollows still returns exactly 12 V1 Hollows", async () => {
    const result = await handleCliCommand(parseCliArgs(["list-hollows"]));

    expect((result.data as { hollows: unknown[] }).hollows).toHaveLength(12);
    expect(JSON.stringify(result.data)).not.toContain("hollow.media.");
  });

  it("malformed JSON input returns structured error", async () => {
    const result = await handleCliCommand(
      parseCliArgs(["run-media-hollow", "--id", "hollow.media.aspect_ratio", "--input-json", "{"])
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("invalid_json");
  });

  it("missing input returns structured error", async () => {
    const result = await handleCliCommand(parseCliArgs(["run-media-hollow", "--id", "hollow.media.aspect_ratio"]));

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("missing_input");
  });
});

async function runMediaAspectRatio(extraArgs: string[] = []) {
  return handleCliCommand(
    parseCliArgs([
      "run-media-hollow",
      "--id",
      "hollow.media.aspect_ratio",
      "--input-json",
      "{\"width\":1920,\"height\":1080,\"expected_ratio\":\"16:9\"}",
      ...extraArgs
    ])
  );
}

async function withTempDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "caleb-media-cli-test-"));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
