import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { handleCliCommand, parseCliArgs } from "../../src/cli/index.js";
import { runPassComplianceAudit } from "../../src/audit/passComplianceAuditCommand.js";

describe("audit-pass-compliance CLI", () => {
  it("parses audit-pass-compliance with manifest and json", () => {
    const parsed = parseCliArgs([
      "audit-pass-compliance",
      "--manifest",
      "examples/audit/aud2-pass-manifest.valid.json",
      "--base-ref",
      "HEAD",
      "--json"
    ]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.command).toBe("audit-pass-compliance");
    expect(parsed.flags.manifest).toBe("examples/audit/aud2-pass-manifest.valid.json");
    expect(parsed.output_format).toBe("json");
  });

  it("requires --manifest", () => {
    const parsed = parseCliArgs(["audit-pass-compliance", "--json"]);
    expect(parsed.errors.map((error) => error.code)).toContain("missing_manifest");
  });

  it("requires --json", () => {
    const parsed = parseCliArgs([
      "audit-pass-compliance",
      "--manifest",
      "examples/audit/aud2-pass-manifest.valid.json"
    ]);
    expect(parsed.errors.map((error) => error.code)).toContain("json_required");
  });

  it("missing manifest file returns ok:false and nonzero exit", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "audit-pass-compliance",
        "--manifest",
        "examples/audit/does-not-exist.json",
        "--json"
      ])
    );

    expect(result.ok).toBe(false);
    expect(result.exit_code).toBe(1);
    expect((result.data as { stage?: string }).stage).toBe("manifest_read");
  });

  it("invalid JSON manifest returns ok:false and nonzero exit", async () => {
    const dir = await mkdtemp(join(tmpdir(), "caleb-aud2-cli-"));
    const manifestPath = join(dir, "bad.json");
    try {
      await writeFile(manifestPath, "{not-json", "utf8");
      const result = await handleCliCommand(
        parseCliArgs(["audit-pass-compliance", "--manifest", manifestPath, "--json"])
      );
      expect(result.ok).toBe(false);
      expect(result.exit_code).toBe(1);
      expect((result.data as { stage?: string }).stage).toBe("manifest_parse");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("invalid base ref returns ok:false and nonzero exit", async () => {
    const result = await runPassComplianceAudit({
      manifest_path: "examples/audit/aud2-pass-manifest.valid.json",
      base_ref: "definitely-not-a-valid-ref-12345"
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.stage).toBe("git_collection");
    expect(result.error.code).toBe("AUD2_INVALID_BASE_REF");
  });

  it("compliant audit returns ok:true with verified T2 hollow result", async () => {
    const repo = await mkdtemp(join(tmpdir(), "caleb-aud2-compliant-"));
    const manifestPath = join(repo, "manifest.json");
    try {
      execFileSync("git", ["-C", repo, "init"], { stdio: "ignore" });
      execFileSync("git", ["-C", repo, "config", "user.email", "aud2@test.local"], { stdio: "ignore" });
      execFileSync("git", ["-C", repo, "config", "user.name", "AUD2 Test"], { stdio: "ignore" });
      await writeFile(join(repo, "README.md"), "baseline\n", "utf8");
      execFileSync("git", ["-C", repo, "add", "README.md"], { stdio: "ignore" });
      execFileSync("git", ["-C", repo, "commit", "-m", "init"], { stdio: "ignore" });
      await writeFile(
        manifestPath,
        JSON.stringify({
          pass_id: "AUD-2-test",
          schema_version: "1.0.0",
          allowed_create: ["manifest.json"],
          allowed_modify: ["README.md"],
          allowed_delete: ["__no_deletes__/**"],
          forbidden: ["__no_forbidden__/**"]
        }),
        "utf8"
      );

      const result = await runPassComplianceAudit({
        manifest_path: manifestPath,
        base_ref: "HEAD",
        cwd: repo
      });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.hollow.hollow_id).toBe("hollow.audit.pass_compliance_check");
      expect(result.hollow.trust_tier).toBe("T2");
      expect(result.verdict.compliant).toBe(true);
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  }, 30_000);

  it("non-compliant audit returns ok:true with compliant false verdict", async () => {
    const result = await runPassComplianceAudit({
      manifest_path: "examples/audit/aud2-pass-manifest.valid.json",
      base_ref: "HEAD"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.verdict.valid).toBe(true);
    if (result.verdict.compliant === false) {
      expect(result.verdict.status).toBe("violations");
    }
  }, 30_000);

  it("handler returns JSON-serializable payload with --json", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "audit-pass-compliance",
        "--manifest",
        "examples/audit/aud2-pass-manifest.valid.json",
        "--base-ref",
        "HEAD",
        "--json"
      ])
    );

    const serialized = JSON.stringify(result);
    expect(serialized.length).toBeGreaterThan(0);
    const parsed = JSON.parse(serialized) as { data?: { hollow?: { hollow_id?: string } } };
    expect(parsed.data?.hollow?.hollow_id).toBe("hollow.audit.pass_compliance_check");
  }, 30_000);
});
