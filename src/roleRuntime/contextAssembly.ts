import type { ContentAddressedRawOutputStore } from "../rawOutput/contentAddressedRawOutputStore.js";
import type { Sha256Digest } from "../types/common.js";
import type { RoleRuntimeContextRef } from "./types/roleRuntimeAdapter.js";
import type { RoleRuntimeInvocationRecord } from "./types/roleRuntimeTypes.js";

const CONTEXT_SECTION_DELIMITER = "\n---ROLE_RUNTIME_CONTEXT_SECTION---\n";

export function buildContextRefsFromRecords(
  records: readonly RoleRuntimeInvocationRecord[]
): readonly RoleRuntimeContextRef[] {
  return [...records]
    .sort((left, right) => left.step_index - right.step_index)
    .map((record) => ({
      digest: record.artifact_digest,
      step_index: record.step_index
    }));
}

export async function assembleInertContextText(
  store: ContentAddressedRawOutputStore,
  contextRefs: readonly RoleRuntimeContextRef[]
): Promise<{ ok: true; context_text: string } | { ok: false; failure_code: "context_assembly_failed" }> {
  const ordered = [...contextRefs].sort((left, right) => left.step_index - right.step_index);

  if (ordered.length === 0) {
    return { ok: true, context_text: "" };
  }

  const sections: string[] = [];
  for (const ref of ordered) {
    const readResult = await store.read(ref.digest);
    if (!readResult.ok || readResult.content === undefined) {
      return { ok: false, failure_code: "context_assembly_failed" };
    }
    sections.push(formatContextSection(ref.step_index, ref.digest, readResult.content));
  }

  return { ok: true, context_text: sections.join(CONTEXT_SECTION_DELIMITER) };
}

function formatContextSection(stepIndex: number, digest: Sha256Digest, content: string): string {
  return `step_index=${stepIndex};digest=${digest};content=${content}`;
}

export function reconstructChainFromRecords(
  records: readonly RoleRuntimeInvocationRecord[]
): {
  readonly plan_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly steps: readonly {
    readonly step_index: number;
    readonly role_id: RoleRuntimeInvocationRecord["role_id"];
    readonly adapter_id: string;
    readonly artifact_digest: Sha256Digest;
    readonly context_refs: readonly RoleRuntimeContextRef[];
  }[];
} | null {
  if (records.length === 0) {
    return null;
  }
  const first = records[0];
  if (first === undefined) {
    return null;
  }

  const sorted = [...records].sort((left, right) => left.step_index - right.step_index);
  return {
    plan_id: first.plan_id,
    task_id: first.task_id,
    run_id: first.run_id,
    trace_id: first.trace_id,
    context_id: first.context_id,
    steps: sorted.map((record) => ({
      step_index: record.step_index,
      role_id: record.role_id,
      adapter_id: record.adapter_id,
      artifact_digest: record.artifact_digest,
      context_refs: record.context_refs
    }))
  };
}