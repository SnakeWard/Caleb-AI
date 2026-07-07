import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { runPassComplianceAudit } from "../../src/audit/passComplianceAuditCommand.js";
import { passComplianceCheckManifest } from "../../src/hollows/index.js";

describe("AUD-2 git changeset collection seam acceptance", () => {
  it("invokes hollow.audit.pass_compliance_check through registry/runner/VRP path", async () => {
    const result = await runPassComplianceAudit({
      manifest_path: "examples/audit/aud2-pass-manifest.valid.json",
      base_ref: "HEAD"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.hollow.hollow_id).toBe(passComplianceCheckManifest.hollow_id);
    expect(result.hollow.hollow_version).toBe(passComplianceCheckManifest.hollow_version);
    expect(result.hollow.trust_tier).toBe("T2");
    expect(result.collection.hollow_gathered_environment).toBe(false);
    expect(result.collection.source).toBe("git_cli_layer");
    expect(result.verdict.checks.map((check) => check.check_id)).toContain(
      "supplied_state_only_confirmed"
    );
  });

  it("keeps git collection outside the Hollow implementation", () => {
    const hollowSource = readFileSync("src/hollows/audit/passComplianceCheck.ts", "utf8");
    const collectorSource = readFileSync("src/audit/gitChangesetCollector.ts", "utf8");

    expect(hollowSource).not.toContain("child_process");
    expect(collectorSource).toContain("child_process");
    expect(collectorSource).toContain("execFileSync");
  });
});