import { readFile } from "node:fs/promises";

import { createV1HollowRunner, passComplianceCheckManifest } from "../hollows/index.js";
import type { PassManifestInput } from "../hollows/audit/passComplianceCheck.js";
import type { JsonValue } from "../types/common.js";
import { VerifiedReturnPath } from "../verification/index.js";
import { collectGitChangeset } from "./gitChangesetCollector.js";
import type {
  PassComplianceAuditErrorBody,
  PassComplianceAuditResult,
  PassComplianceAuditStage,
  PassComplianceAuditSuccess
} from "./passComplianceAuditTypes.js";
import { AUD2_SCHEMA_VERSION } from "./passComplianceAuditTypes.js";

export interface RunPassComplianceAuditOptions {
  readonly manifest_path: string;
  readonly base_ref?: string;
  readonly cwd?: string;
}

export async function runPassComplianceAudit(
  options: RunPassComplianceAuditOptions
): Promise<PassComplianceAuditResult> {
  const cwd = options.cwd ?? process.cwd();
  const base_ref = options.base_ref ?? "HEAD";

  const manifestResult = await readPassManifest(options.manifest_path);
  if (!manifestResult.ok) {
    return manifestResult.error;
  }

  const collection = collectGitChangeset({ cwd, base_ref });
  if (!collection.ok) {
    return auditError("git_collection", collection.code, collection.message, collection.path);
  }

  const hollowInput = {
    pass_manifest: manifestResult.pass_manifest,
    changeset: {
      entries: collection.entries.map((entry) => ({
        path: entry.path,
        change_kind:
          entry.operation === "create"
            ? ("created" as const)
            : entry.operation === "modify"
              ? ("modified" as const)
              : ("deleted" as const)
      }))
    }
  };

  try {
    const runner = createV1HollowRunner({
      default_caller: "audit_pass_compliance_cli",
      default_requested_by: "cli_user"
    });
    const invocation = await runner.run({
      hollow_id: passComplianceCheckManifest.hollow_id,
      input_payload: hollowInput as unknown as JsonValue
    });

    if (invocation.status !== "completed") {
      return auditError(
        "hollow_invocation",
        "AUD2_HOLLOW_INVOCATION_FAILED",
        `Hollow invocation status: ${invocation.status}.`
      );
    }

    const verification = new VerifiedReturnPath().verifyInvocation(invocation);
    if (verification.decision !== "accepted" || verification.evidence_packet === undefined) {
      return auditError(
        "verified_return_path",
        "AUD2_VERIFIED_RETURN_PATH_REJECTED",
        "Verified Return Path rejected the Hollow invocation."
      );
    }

    const verdict = invocation.result as unknown as import("../hollows/audit/passComplianceCheck.js").PassComplianceResult;

    return {
      ok: true,
      schema_version: AUD2_SCHEMA_VERSION,
      command: "audit-pass-compliance",
      base_ref: collection.base_ref,
      head_ref: "working_tree",
      collection: {
        source: "git_cli_layer",
        hollow_gathered_environment: false,
        path_format: "repo_relative_forward_slash",
        tracked_changes: collection.tracked_changes,
        untracked_changes: collection.untracked_changes,
        total_changes: collection.entries.length
      },
      hollow: {
        hollow_id: invocation.hollow_id,
        hollow_version: invocation.hollow_version,
        verification_status: verification.verification_status,
        trust_tier: verification.evidence_packet.trust_tier
      },
      changeset: collection.entries,
      verdict,
      ledger_refs: []
    } satisfies PassComplianceAuditSuccess;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Hollow invocation failed.";
    return auditError("hollow_invocation", "AUD2_HOLLOW_INVOCATION_FAILED", message);
  }
}

async function readPassManifest(
  manifestPath: string
): Promise<
  | { readonly ok: true; readonly pass_manifest: PassManifestInput }
  | { readonly ok: false; readonly error: PassComplianceAuditErrorBody }
> {
  let raw: string;
  try {
    raw = await readFile(manifestPath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read manifest file.";
    return {
      ok: false,
      error: auditError("manifest_read", "AUD2_MANIFEST_READ_FAILED", message, manifestPath)
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manifest JSON parse failed.";
    return {
      ok: false,
      error: auditError("manifest_parse", "AUD2_MANIFEST_PARSE_FAILED", message, manifestPath)
    };
  }

  const pass_manifest = extractPassManifest(parsed);
  if (pass_manifest === null) {
    return {
      ok: false,
      error: auditError(
        "manifest_parse",
        "AUD2_INVALID_MANIFEST_SHAPE",
        "Manifest must be a pass_manifest object or wrap pass_manifest.",
        manifestPath
      )
    };
  }

  return { ok: true, pass_manifest };
}

function extractPassManifest(value: unknown): PassManifestInput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record["pass_manifest"] !== undefined) {
    const nested = record["pass_manifest"];
    if (typeof nested !== "object" || nested === null || Array.isArray(nested)) {
      return null;
    }
    return nested as unknown as PassManifestInput;
  }

  if (
    typeof record["pass_id"] === "string" &&
    typeof record["schema_version"] === "string" &&
    Array.isArray(record["allowed_create"]) &&
    Array.isArray(record["allowed_modify"]) &&
    Array.isArray(record["allowed_delete"]) &&
    Array.isArray(record["forbidden"])
  ) {
    return record as unknown as PassManifestInput;
  }

  return null;
}

function auditError(
  stage: PassComplianceAuditStage,
  code: string,
  message: string,
  path?: string
): PassComplianceAuditErrorBody {
  return {
    ok: false,
    schema_version: AUD2_SCHEMA_VERSION,
    command: "audit-pass-compliance",
    stage,
    error: {
      code,
      message,
      ...(path === undefined ? {} : { path })
    }
  };
}