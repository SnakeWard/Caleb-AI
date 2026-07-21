import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  evaluateSnapshotClaimIntegrity,
  runSnapshotClaimIntegrityGate
} from "../../src/changeGuard/snapshotClaimIntegrityValidator.js";

describe("DEBT-1 migration reconciliation and byte-integrity", () => {
  it("T1: hash-locked paths resolve -text under .gitattributes; attributes source locked", () => {
    const paths = [
      "docs/01_CODEX_OPERATING_CONTRACT.md",
      "src/changeGuard/snapshotClaimIntegrityValidator.ts",
      "examples/live-rotation/prompts/planner.prompt.txt",
      "examples/live-rotation/event-e2.cross-family.fixture.json"
    ];
    for (const path of paths) {
      const out = execFileSync("git", ["check-attr", "text", "--", path], {
        cwd: process.cwd(),
        encoding: "utf8"
      });
      expect(out, path).toMatch(/: text: unset/);
    }
    const attrs = readFileSync(".gitattributes", "utf8");
    expect(attrs).toContain(".caleb/ledger/** -text");
    expect(attrs).toContain("docs/** -text");
    expect(attrs).toContain("src/** -text");
    expect(attrs).toContain("examples/** -text");
    expect(attrs).toContain("* text=auto eol=lf");
    // Control: package.json is not under docs/src/examples/tests or *.md/*.ts/*.txt,
    // so it remains conversion-capable (* text=auto) rather than forced -text.
    const control = execFileSync("git", ["check-attr", "text", "--", "package.json"], {
      cwd: process.cwd(),
      encoding: "utf8"
    });
    expect(control).toMatch(/package\.json: text: auto/);
  });

  it("T2/T3: real gate passes; synthetically missing snapshot still fails (gate not loosened)", () => {
    const report = runSnapshotClaimIntegrityGate();
    expect(report.passed).toBe(true);
    expect(report.missing_snapshot_ids).toEqual([]);
    expect(report.invalid_snapshot_claims).toEqual([]);

    const failed = evaluateSnapshotClaimIntegrity({
      plans_md_content: "prechange snap_20990101T000000000Z_999999_milestone claimed",
      existing_snapshot_ids: report.existing_snapshot_ids
    });
    expect(failed.passed).toBe(false);
    expect(failed.missing_snapshot_ids).toContain("snap_20990101T000000000Z_999999_milestone");
  });

  it("PLANS migration annotation present and active snap claims absent", () => {
    const plans = readFileSync("PLANS.md", "utf8");
    expect(plans).toContain("## DEBT-1 migration note");
    expect(plans).toContain("pre_migration_D_cold_backup_snap_");
    expect(plans).toMatch(/gate is \*\*not\*\*|gate is not/i);
    const active = plans.match(/\bsnap_[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*_milestone\b/g) ?? [];
    expect(active).toEqual([]);
  });
});
