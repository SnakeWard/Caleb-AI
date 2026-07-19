import { validateRoleArtifact } from "../roles/roleArtifactValidator.js";
import {
  validateRoleHandoffGate,
  type RoleHandoffGateError
} from "../roles/roleHandoffGate.js";
import type { RoleHandoffEnvelope } from "../roles/types/roleHandoff.js";
import { ROLE_ARTIFACT_SCHEMA_VERSION } from "../roles/types/roleArtifact.js";
import { resolveRawOutputDigestReferences } from "../rawOutput/lineageResolutionGate.js";
import { assembleInertContextText, buildContextRefsFromRecords } from "./contextAssembly.js";
import { validateStaticRotationPlan } from "./rotationPlanValidator.js";
import type { RoleRuntimeAdapter } from "./types/roleRuntimeAdapter.js";
import type {
  RoleRuntimeExecutionResult,
  RoleRuntimeExecutorInput,
  RoleRuntimeFailureCode,
  RoleRuntimeGateEvaluationRefusedRecord,
  RoleRuntimeGateRefusalIssue,
  RoleRuntimeInvocationRecord
} from "./types/roleRuntimeTypes.js";
import type { StaticRotationPlan } from "./types/staticRotationPlan.js";

export async function executeStaticRotation(input: RoleRuntimeExecutorInput): Promise<RoleRuntimeExecutionResult> {
  const now = input.now ?? (() => new Date().toISOString());
  const appendRecord = input.appendRecord ?? (() => true);

  const planValidation = validateStaticRotationPlan(input.plan);
  if (!planValidation.ok || planValidation.plan === null) {
    const modelRejected = planValidation.errors.some((entry) => entry.code === "model_authored_plan_rejected");
    return haltedResult({
      planId: readPlanId(input.plan),
      failureCode: modelRejected ? "model_authored_plan_rejected" : "invalid_rotation_plan",
      records: []
    });
  }

  const plan = planValidation.plan;
  return runDeclaredSequence(plan, input.adapters, input.store, appendRecord, now);
}

async function runDeclaredSequence(
  plan: StaticRotationPlan,
  adapters: ReadonlyMap<string, RoleRuntimeAdapter>,
  store: RoleRuntimeExecutorInput["store"],
  appendRecord: NonNullable<RoleRuntimeExecutorInput["appendRecord"]>,
  now: () => string
): Promise<RoleRuntimeExecutionResult> {
  const records: RoleRuntimeInvocationRecord[] = [];
  let invocationCount = 0;

  for (let currentStepIndex = 0; currentStepIndex < plan.sequence.length; currentStepIndex += 1) {
    if (invocationCount >= plan.stop_conditions.max_invocations) {
      return haltedResult({
        planId: plan.plan_id,
        failureCode: "max_invocations_reached",
        records,
        completedSteps: records.length,
        status: "halted"
      });
    }

    const step = plan.sequence[currentStepIndex];
    if (step === undefined) {
      return haltedResult({
        planId: plan.plan_id,
        failureCode: "invalid_rotation_plan",
        records,
        completedSteps: records.length
      });
    }

    const adapter = adapters.get(step.adapter_id);
    if (adapter === undefined) {
      return haltedResult({
        planId: plan.plan_id,
        failureCode: "adapter_not_found",
        records,
        completedSteps: records.length,
        failedStepIndex: step.step_index
      });
    }

    const contextRefs = buildContextRefsFromRecords(records);
    const contextAssembly = await assembleInertContextText(store, contextRefs);
    if (!contextAssembly.ok) {
      return haltedResult({
        planId: plan.plan_id,
        failureCode: contextAssembly.failure_code,
        records,
        completedSteps: records.length,
        failedStepIndex: step.step_index
      });
    }

    const adapterResult = await adapter.invoke({
      plan_id: plan.plan_id,
      task_id: plan.task_id,
      run_id: plan.run_id,
      trace_id: plan.trace_id,
      context_id: plan.context_id,
      step_index: step.step_index,
      role_id: step.role_id,
      adapter_id: step.adapter_id,
      adapter_kind: step.adapter_kind,
      context_text: contextAssembly.context_text,
      context_refs: contextRefs
    });

    if (!adapterResult.ok) {
      return haltedResult({
        planId: plan.plan_id,
        failureCode: "adapter_invocation_failed",
        records,
        completedSteps: records.length,
        failedStepIndex: step.step_index
      });
    }

    const derivedFrom = adapterResult.artifact_provenance?.derived_from ?? [];
    if (derivedFrom.length > 0) {
      const lineage = await resolveRawOutputDigestReferences(derivedFrom, store);
      if (!lineage.ok) {
        return haltedResult({
          planId: plan.plan_id,
          failureCode: "artifact_lineage_invalid",
          records,
          completedSteps: records.length,
          failedStepIndex: step.step_index
        });
      }
    }

    const artifactJson = JSON.stringify(adapterResult.artifact);
    const storeResult = await store.store({
      output_text: artifactJson,
      provider_id: `role_runtime.${step.role_id}`,
      model_id: adapter.adapter_id,
      created_at: now()
    });

    if (!storeResult.ok || storeResult.record === undefined) {
      return haltedResult({
        planId: plan.plan_id,
        failureCode: "raw_storage_failed",
        records,
        completedSteps: records.length,
        failedStepIndex: step.step_index
      });
    }

    const artifactValidation = validateRoleArtifact(adapterResult.artifact);
    if (!artifactValidation.ok) {
      return haltedResult({
        planId: plan.plan_id,
        failureCode: "artifact_validation_failed",
        records,
        completedSteps: records.length,
        failedStepIndex: step.step_index
      });
    }

    const artifactObject = adapterResult.artifact as Record<string, unknown>;
    const artifactId = typeof artifactObject["artifact_id"] === "string" ? artifactObject["artifact_id"] : `unknown_${step.step_index}`;

    let handoffGateStatus: RoleRuntimeInvocationRecord["handoff_gate_status"] = null;
    const nextStep = plan.sequence[currentStepIndex + 1];
    if (nextStep !== undefined) {
      const handoffEnvelope: RoleHandoffEnvelope = {
        schema_version: ROLE_ARTIFACT_SCHEMA_VERSION,
        source_role: step.role_id,
        target_role: nextStep.role_id,
        task_id: plan.task_id,
        run_id: plan.run_id,
        trace_id: plan.trace_id,
        context_id: plan.context_id,
        handoff_status: "ready",
        artifact_id: artifactId,
        created_at: now()
      };
      const gateResult = validateRoleHandoffGate({
        handoff: handoffEnvelope,
        source_artifact: adapterResult.artifact
      });
      handoffGateStatus = gateResult.status;
      if (!gateResult.allowed) {
        const failureCode = gateResult.status === "invalid"
          ? "handoff_gate_invalid"
          : "handoff_gate_blocked";
        const refusedRecord: RoleRuntimeGateEvaluationRefusedRecord = {
          record_type: "gate_evaluation_refused",
          record_id: `${plan.plan_id}.step_${step.step_index}.gate_refusal`,
          plan_id: plan.plan_id,
          task_id: plan.task_id,
          run_id: plan.run_id,
          trace_id: plan.trace_id,
          context_id: plan.context_id,
          step_index: step.step_index,
          source_role: step.role_id,
          target_role: nextStep.role_id,
          adapter_id: step.adapter_id,
          adapter_kind: step.adapter_kind,
          stage: "handoff_gate",
          terminal_status: failureCode,
          artifact_digest: storeResult.record.digest,
          artifact_id: artifactId,
          ...(derivedFrom.length === 0 ? {} : { derived_from: [...derivedFrom] }),
          validation_status: "schema_valid",
          trust_tier: "T1",
          issues: gateResult.errors.map((error) =>
            toSafeGateRefusalIssue(error, step.role_id, nextStep.role_id)
          ),
          created_at: now()
        };
        const appendOk = await appendRecord(refusedRecord);
        if (!appendOk) {
          return haltedResult({
            planId: plan.plan_id,
            failureCode: "ledger_record_write_failed",
            records,
            completedSteps: records.length,
            failedStepIndex: step.step_index
          });
        }
        return haltedResult({
          planId: plan.plan_id,
          failureCode,
          records,
          completedSteps: records.length,
          failedStepIndex: step.step_index,
          failedStepRecord: refusedRecord
        });
      }
    }

    const record: RoleRuntimeInvocationRecord = {
      record_id: `${plan.plan_id}.step_${step.step_index}`,
      plan_id: plan.plan_id,
      task_id: plan.task_id,
      run_id: plan.run_id,
      trace_id: plan.trace_id,
      context_id: plan.context_id,
      step_index: step.step_index,
      role_id: step.role_id,
      adapter_id: step.adapter_id,
      adapter_kind: step.adapter_kind,
      artifact_digest: storeResult.record.digest,
      artifact_id: artifactId,
      ...(derivedFrom.length === 0 ? {} : { derived_from: [...derivedFrom] }),
      context_refs: contextRefs,
      validation_status: "schema_valid",
      trust_tier: "T1",
      handoff_gate_status: handoffGateStatus,
      failure_code: null,
      created_at: now()
    };

    const appendOk = await appendRecord(record);
    if (!appendOk) {
      return haltedResult({
        planId: plan.plan_id,
        failureCode: "ledger_record_write_failed",
        records,
        completedSteps: records.length,
        failedStepIndex: step.step_index
      });
    }

    records.push(record);
    invocationCount += 1;
  }

  return {
    ok: true,
    status: "completed",
    plan_id: plan.plan_id,
    completed_steps: records.length,
    failed_step_index: null,
    failure_code: null,
    records,
    failed_step_record: null
  };
}

function haltedResult(args: {
  planId: string;
  failureCode: RoleRuntimeFailureCode;
  records: RoleRuntimeInvocationRecord[];
  completedSteps?: number;
  failedStepIndex?: number;
  failedStepRecord?: RoleRuntimeGateEvaluationRefusedRecord;
  status?: "failed" | "halted";
}): RoleRuntimeExecutionResult {
  return {
    ok: false,
    status: args.status ?? "failed",
    plan_id: args.planId,
    completed_steps: args.completedSteps ?? args.records.length,
    failed_step_index: args.failedStepIndex ?? null,
    failure_code: args.failureCode,
    records: args.records,
    failed_step_record: args.failedStepRecord ?? null
  };
}

function toSafeGateRefusalIssue(
  error: RoleHandoffGateError,
  sourceRole: StaticRotationPlan["sequence"][number]["role_id"],
  targetRole: StaticRotationPlan["sequence"][number]["role_id"]
): RoleRuntimeGateRefusalIssue {
  if (error.code === "acceptance_status_not_consumable") {
    return {
      check_index: error.check_index,
      code: error.code,
      path: error.path,
      expected: [...error.expected],
      actual: error.actual,
      transition: { ...error.transition }
    };
  }
  return {
    check_index: classifiedCheckIndex(error),
    code: error.code,
    path: error.path,
    expected: null,
    actual: null,
    transition: {
      source_role: sourceRole,
      target_role: targetRole
    }
  };
}

function classifiedCheckIndex(error: Exclude<
  RoleHandoffGateError,
  { readonly code: "acceptance_status_not_consumable" }
>): number | null {
  switch (error.code) {
    case "invalid_handoff_envelope":
      return error.path.startsWith("$.registry[") ? 3 : 1;
    case "invalid_source_artifact":
      return 2;
    case "unknown_source_role":
      return 4;
    case "unknown_target_role":
      return 5;
    case "disallowed_target_role":
      return 6;
    case "artifact_role_mismatch":
      return 7;
    case "handoff_artifact_ref_mismatch":
      return 8;
    case "required_next_role_mismatch":
      return 9;
    case "identity_mismatch":
      return 10;
    case "handoff_status_blocks_handoff":
      return 12;
    case "forbidden_content_detected":
      return error.path.startsWith("$.handoff") ? 13 : 14;
    case "embedded_trace_not_allowed":
    case "embedded_context_not_allowed":
      return 15;
  }
}

function readPlanId(plan: unknown): string {
  if (typeof plan === "object" && plan !== null && !Array.isArray(plan)) {
    const value = (plan as Record<string, unknown>)["plan_id"];
    if (typeof value === "string") {
      return value;
    }
  }
  return "unknown_plan";
}
