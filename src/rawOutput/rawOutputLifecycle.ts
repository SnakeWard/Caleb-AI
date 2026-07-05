import type { Sha256Digest } from "../types/common.js";
import type {
  LiveCallShapedRawOutput,
  RawOutputArtifactRecord,
  RawOutputIssue,
  RawOutputStore
} from "./rawOutputArtifactTypes.js";

export interface RawOutputLifecycleResult {
  readonly ok: boolean;
  readonly raw_output_trust_tier: "T0";
  readonly schema_valid_output_trust_tier: "T1" | "T0";
  readonly max_allowed_trust_tier: "T1";
  readonly digest: Sha256Digest | null;
  readonly artifact_ref: string | null;
  readonly record?: RawOutputArtifactRecord;
  readonly issues: readonly RawOutputIssue[];
}

export async function ingestLiveCallShapedRawOutput(
  input: LiveCallShapedRawOutput,
  store: RawOutputStore,
  options: { readonly created_at: string }
): Promise<RawOutputLifecycleResult> {
  const issues = validateLiveCallShapedRawOutput(input);
  if (issues.length > 0) {
    return {
      ok: false,
      raw_output_trust_tier: "T0",
      schema_valid_output_trust_tier: "T0",
      max_allowed_trust_tier: "T1",
      digest: null,
      artifact_ref: null,
      issues
    };
  }

  const stored = await store.store({ ...input, created_at: options.created_at });
  if (!stored.ok || stored.record === undefined) {
    return {
      ok: false,
      raw_output_trust_tier: "T0",
      schema_valid_output_trust_tier: "T0",
      max_allowed_trust_tier: "T1",
      digest: null,
      artifact_ref: null,
      issues: stored.issues
    };
  }

  return {
    ok: true,
    raw_output_trust_tier: "T0",
    schema_valid_output_trust_tier: "T1",
    max_allowed_trust_tier: "T1",
    digest: stored.record.digest,
    artifact_ref: stored.record.artifact_ref,
    record: stored.record,
    issues: []
  };
}

function validateLiveCallShapedRawOutput(input: LiveCallShapedRawOutput): readonly RawOutputIssue[] {
  const issues: RawOutputIssue[] = [];
  if (typeof input.output_text !== "string") {
    issues.push({ code: "invalid_output_text", path: "output_text", message: "output_text must be a string." });
  }
  if (input.output_text.length === 0) {
    issues.push({ code: "empty_output_text", path: "output_text", message: "output_text must not be empty." });
  }
  if (input.provider_id.trim().length === 0) {
    issues.push({ code: "empty_provider_id", path: "provider_id", message: "provider_id must not be empty." });
  }
  if (input.model_id.trim().length === 0) {
    issues.push({ code: "empty_model_id", path: "model_id", message: "model_id must not be empty." });
  }
  return issues;
}
