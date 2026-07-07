import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  evaluatePassCompliance,
  pathMatchesRule,
  passComplianceCheckImplementation,
  passComplianceCheckManifest
} from "../../src/hollows/index.js";

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../examples/hollows");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), "utf8"));
}

function baseManifest() {
  return {
    pass_id: "AUD-1-test",
    schema_version: "1.0.0",
    allowed_create: ["src/hollows/audit/**"],
    allowed_modify: ["PLANS.md"],
    allowed_delete: ["docs/obsolete.md"],
    forbidden: ["src/ledger/**"]
  };
}

describe("passComplianceCheck Hollow", () => {
  it("manifest is V1-safe policy hollow", () => {
    expect(passComplianceCheckManifest.hollow_id).toBe("hollow.audit.pass_compliance_check");
    expect(passComplianceCheckManifest.category).toBe("policy");
    expect(passComplianceCheckManifest.deterministic).toBe(true);
    expect(passComplianceCheckManifest.network_access).toBe(false);
    expect(passComplianceCheckManifest.file_access_scope).toBe("none");
  });

  it("implementation returns supplied_state_only_confirmed check", () => {
    const raw = passComplianceCheckImplementation({
      input_payload: loadFixture("pass-compliance.compliant.json") as import("../../src/types/common.js").JsonValue,
      input_digest: "digest",
      context: {
        invocation_id: "invocation_test",
        task_id: "task_test",
        run_id: "run_test",
        trace_id: "trace_test",
        hollow_id: passComplianceCheckManifest.hollow_id,
        hollow_version: passComplianceCheckManifest.hollow_version,
        started_at: "2026-07-07T00:00:00.000Z",
        caller: "test",
        requested_by: "test",
        approved_by: null,
        permissions: [],
        execution_mode: "local_deterministic"
      }
    });
    expect(raw).not.toBeInstanceOf(Promise);
    const output = raw as Exclude<typeof raw, Promise<unknown>>;

    expect(output.checks?.map((check) => check.check_id)).toContain("supplied_state_only_confirmed");
  });

  it("compliant fixture passes with zero violations", () => {
    const result = evaluatePassCompliance(loadFixture("pass-compliance.compliant.json"));

    expect(result.valid).toBe(true);
    expect(result.compliant).toBe(true);
    expect(result.status).toBe("compliant");
    expect(result.violations).toHaveLength(0);
    expect(result.summary.violation_count).toBe(0);
  });

  it("forbidden precedence: path matching both allowed and forbidden yields AUD_FORBIDDEN_PATH_TOUCHED", () => {
    const result = evaluatePassCompliance(loadFixture("pass-compliance.forbidden-touched.json"));

    expect(result.valid).toBe(true);
    expect(result.compliant).toBe(false);
    expect(result.status).toBe("violations");
    expect(result.violations).toEqual([
      {
        code: "AUD_FORBIDDEN_PATH_TOUCHED",
        path: "src/hollows/runner.ts",
        matched_rule: "src/hollows/runner.ts",
        change_kind: "modified"
      },
      {
        code: "AUD_FORBIDDEN_PATH_TOUCHED",
        path: "src/ledger/idFactory.ts",
        matched_rule: "src/ledger/**",
        change_kind: "created"
      }
    ]);
  });

  it("unlisted create yields AUD_UNLISTED_FILE_CREATED", () => {
    const result = evaluatePassCompliance({
      pass_manifest: {
        ...baseManifest(),
        allowed_create: ["src/hollows/audit/**"]
      },
      changeset: {
        entries: [{ path: "src/cli/commandHandlers.ts", change_kind: "created" }]
      }
    });

    expect(result.violations).toEqual([
      {
        code: "AUD_UNLISTED_FILE_CREATED",
        path: "src/cli/commandHandlers.ts",
        matched_rule: null,
        change_kind: "created"
      }
    ]);
  });

  it("unlisted modify yields AUD_UNLISTED_FILE_MODIFIED", () => {
    const result = evaluatePassCompliance(loadFixture("pass-compliance.unlisted-modified.json"));

    expect(result.violations).toEqual([
      {
        code: "AUD_UNLISTED_FILE_MODIFIED",
        path: "src/hollows/v1HollowCatalog.ts",
        matched_rule: null,
        change_kind: "modified"
      }
    ]);
  });

  it("unexpected deletion yields AUD_UNEXPECTED_DELETION", () => {
    const result = evaluatePassCompliance(loadFixture("pass-compliance.unexpected-deletion.json"));

    expect(result.violations).toEqual([
      {
        code: "AUD_UNEXPECTED_DELETION",
        path: "src/hollows/runner.ts",
        matched_rule: null,
        change_kind: "deleted"
      }
    ]);
  });

  it("path boundary: src/roles/** matches nested path inside directory", () => {
    expect(pathMatchesRule("src/roles/types/deep/x.ts", "src/roles/**")).toBe(true);
  });

  it("path boundary: src/roles/** does not match src/roles2/x.ts", () => {
    expect(pathMatchesRule("src/roles2/x.ts", "src/roles/**")).toBe(false);
  });

  it("path boundary: src/roles/** does not match src/roles itself", () => {
    expect(pathMatchesRule("src/roles", "src/roles/**")).toBe(false);
  });

  it("path boundary: exact rule PLANS.md matches only PLANS.md", () => {
    expect(pathMatchesRule("PLANS.md", "PLANS.md")).toBe(true);
    expect(pathMatchesRule("PLANS.md.backup", "PLANS.md")).toBe(false);
    expect(pathMatchesRule("docs/PLANS.md", "PLANS.md")).toBe(false);
  });

  it("invalid manifest yields valid:false, compliant:null, status invalid_input", () => {
    const result = evaluatePassCompliance(loadFixture("pass-compliance.invalid-manifest.json"));

    expect(result.valid).toBe(false);
    expect(result.compliant).toBeNull();
    expect(result.status).toBe("invalid_input");
    expect(result.violations.some((violation) => violation.code === "AUD_INVALID_SCHEMA_VERSION")).toBe(
      true
    );
    expect(result.violations.some((violation) => violation.code === "AUD_MISSING_FIELD")).toBe(true);
  });

  it("rejects backslash paths with AUD_BACKSLASH_PATH", () => {
    const result = evaluatePassCompliance({
      pass_manifest: baseManifest(),
      changeset: {
        entries: [{ path: "src\\hollows\\audit\\x.ts", change_kind: "created" }]
      }
    });

    expect(result.valid).toBe(false);
    expect(result.compliant).toBeNull();
    expect(result.status).toBe("invalid_input");
    expect(result.violations).toContainEqual({
      code: "AUD_BACKSLASH_PATH",
      path: "$.changeset.entries[0].path",
      matched_rule: null,
      change_kind: null
    });
  });

  it("rejects duplicate changeset paths with AUD_DUPLICATE_CHANGESET_PATH", () => {
    const result = evaluatePassCompliance({
      pass_manifest: baseManifest(),
      changeset: {
        entries: [
          { path: "src/hollows/audit/x.ts", change_kind: "created" },
          { path: "src/hollows/audit/x.ts", change_kind: "modified" }
        ]
      }
    });

    expect(result.valid).toBe(false);
    expect(result.violations).toContainEqual({
      code: "AUD_DUPLICATE_CHANGESET_PATH",
      path: "$.changeset.entries[1].path",
      matched_rule: null,
      change_kind: "modified"
    });
  });

  it("rejects unknown change_kind with AUD_UNKNOWN_CHANGE_KIND", () => {
    const result = evaluatePassCompliance({
      pass_manifest: baseManifest(),
      changeset: {
        entries: [{ path: "src/hollows/audit/x.ts", change_kind: "renamed" }]
      }
    });

    expect(result.valid).toBe(false);
    expect(result.violations).toContainEqual({
      code: "AUD_UNKNOWN_CHANGE_KIND",
      path: "$.changeset.entries[0].change_kind",
      matched_rule: null,
      change_kind: null
    });
  });

  it("rejects unknown extra fields with AUD_UNKNOWN_FIELD", () => {
    const result = evaluatePassCompliance({
      pass_manifest: baseManifest(),
      changeset: { entries: [] },
      unexpected_root: true
    } as unknown);

    expect(result.valid).toBe(false);
    expect(result.violations).toContainEqual({
      code: "AUD_UNKNOWN_FIELD",
      path: "$.unexpected_root",
      matched_rule: null,
      change_kind: null
    });
  });

  it("accumulates all violations sorted by path then code", () => {
    const result = evaluatePassCompliance({
      pass_manifest: {
        ...baseManifest(),
        allowed_create: ["src/hollows/audit/**"],
        allowed_modify: ["PLANS.md"],
        allowed_delete: ["docs/obsolete.md"],
        forbidden: ["__no_forbidden__/**"]
      },
      changeset: {
        entries: [
          { path: "z/unlisted.ts", change_kind: "created" },
          { path: "a/unlisted.ts", change_kind: "modified" },
          { path: "m/orphan.ts", change_kind: "deleted" }
        ]
      }
    });

    expect(result.violations.map((violation) => violation.code)).toEqual([
      "AUD_UNLISTED_FILE_MODIFIED",
      "AUD_UNEXPECTED_DELETION",
      "AUD_UNLISTED_FILE_CREATED"
    ]);
    expect(result.violations.map((violation) => violation.path)).toEqual([
      "a/unlisted.ts",
      "m/orphan.ts",
      "z/unlisted.ts"
    ]);
  });

  it("two identical runs produce deep-equal results (determinism)", () => {
    const input = loadFixture("pass-compliance.compliant.json");
    const first = evaluatePassCompliance(input);
    const second = evaluatePassCompliance(input);

    expect(second).toEqual(first);
  });

  it("empty changeset with valid manifest is compliant with zero counts", () => {
    const result = evaluatePassCompliance({
      pass_manifest: baseManifest(),
      changeset: { entries: [] }
    });

    expect(result.valid).toBe(true);
    expect(result.compliant).toBe(true);
    expect(result.status).toBe("compliant");
    expect(result.violations).toHaveLength(0);
    expect(result.summary.entry_count).toBe(0);
    expect(result.summary.created_count).toBe(0);
    expect(result.summary.modified_count).toBe(0);
    expect(result.summary.deleted_count).toBe(0);
    expect(result.summary.violation_count).toBe(0);
  });
});