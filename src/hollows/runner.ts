import { createHash } from "node:crypto";

import {
  createInvocationId,
  createRunId,
  createTaskId,
  createTraceId
} from "../ledger/idFactory.js";
import type { JsonObject, JsonValue, Sha256Digest } from "../types/common.js";
import type { HollowManifest } from "../types/hollow.js";
import type { CalebError, HollowInvocationRecord } from "../types/invocation.js";
import type { SideEffectClass } from "../types/permissions.js";
import { isV1SafeHollowManifest } from "./manifestValidation.js";
import type { HollowRegistry } from "./registry.js";
import {
  HollowImplementationNotFoundError,
  HollowRunnerInputError,
  HollowRunnerTimeoutError
} from "./runnerErrors.js";
import type {
  HollowExecutionContext,
  HollowImplementation,
  HollowImplementationResult,
  HollowRunnerOptions,
  RunHollowRequest
} from "./runnerTypes.js";

type ImplementationMap = Map<string, HollowImplementation> | Record<string, HollowImplementation>;

interface InvocationBase {
  readonly manifest: HollowManifest;
  readonly invocation_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly caller: string;
  readonly requested_by: string;
  readonly approved_by: string | null;
  readonly input_digest: Sha256Digest;
  readonly permissions: readonly SideEffectClass[];
  readonly started_at: string;
  readonly completed_at: string;
}

export class HollowRunner {
  private readonly implementations = new Map<string, HollowImplementation>();
  private readonly default_caller: string;
  private readonly default_requested_by: string;
  private readonly default_timeout_ms: number | undefined;
  private readonly now: () => Date;
  private readonly id_generator: (prefix: "invocation" | "task" | "run" | "trace") => string;

  constructor(
    private readonly registry: HollowRegistry,
    implementations: ImplementationMap = new Map(),
    options: HollowRunnerOptions = {}
  ) {
    this.default_caller = options.default_caller ?? "HollowRunner";
    this.default_requested_by = options.default_requested_by ?? "Caleb AI";
    this.default_timeout_ms = options.default_timeout_ms;
    this.now = options.now ?? (() => new Date());
    this.id_generator =
      options.id_generator ??
      ((prefix) => {
        switch (prefix) {
          case "invocation":
            return createInvocationId();
          case "task":
            return createTaskId();
          case "run":
            return createRunId();
          case "trace":
            return createTraceId();
        }
      });

    if (implementations instanceof Map) {
      for (const [hollow_id, implementation] of implementations.entries()) {
        this.registerImplementation(hollow_id, implementation);
      }
    } else {
      for (const [hollow_id, implementation] of Object.entries(implementations)) {
        this.registerImplementation(hollow_id, implementation);
      }
    }
  }

  registerImplementation(hollow_id: string, implementation: HollowImplementation): void {
    this.implementations.set(hollow_id, implementation);
  }

  hasImplementation(hollow_id: string): boolean {
    return this.implementations.has(hollow_id);
  }

  async run(request: RunHollowRequest): Promise<HollowInvocationRecord> {
    const manifest = this.registry.get(request.hollow_id);
    const implementation = this.implementations.get(request.hollow_id);

    if (implementation === undefined) {
      throw new HollowImplementationNotFoundError(request.hollow_id);
    }

    const startedAt = this.timestamp();
    const base = this.createInvocationBase(request, manifest, startedAt);

    const safetyError = this.checkV1Safety(manifest);
    if (safetyError !== undefined) {
      return this.createRejectedRecord(base, request.input_payload, safetyError, "blocked", "blocked");
    }

    const permissionError = this.checkRequestedPermissions(manifest, base.permissions);
    if (permissionError !== undefined) {
      return this.createRejectedRecord(base, request.input_payload, permissionError, "rejected", "rejected");
    }

    const inputSizeError = this.checkInputSize(manifest, request.input_payload);
    if (inputSizeError !== undefined) {
      return this.createRejectedRecord(base, request.input_payload, inputSizeError, "rejected", "rejected");
    }

    const timeoutMs = this.resolveTimeoutMs(manifest);
    const abortController = new AbortController();
    const context = this.createExecutionContext(base, timeoutMs, abortController.signal);

    try {
      const result = await this.runWithOptionalTimeout(
        implementation({
          input_payload: request.input_payload,
          input_digest: base.input_digest,
          context
        }),
        manifest.hollow_id,
        timeoutMs,
        abortController
      );

      return this.createSuccessRecord(base, request.input_payload, result);
    } catch (error) {
      const runnerError =
        error instanceof HollowRunnerTimeoutError
          ? error
          : new HollowRunnerInputError(
              manifest.hollow_id,
              error instanceof Error ? error.message : "Hollow implementation failed."
            );

      return this.createFailedRecord(base, request.input_payload, runnerError);
    }
  }

  private createInvocationBase(
    request: RunHollowRequest,
    manifest: HollowManifest,
    started_at: string
  ): InvocationBase {
    return {
      manifest,
      invocation_id: request.invocation_id ?? this.id_generator("invocation"),
      task_id: request.task_id ?? this.id_generator("task"),
      run_id: request.run_id ?? this.id_generator("run"),
      trace_id: request.trace_id ?? this.id_generator("trace"),
      caller: request.caller ?? this.default_caller,
      requested_by: request.requested_by ?? this.default_requested_by,
      approved_by: request.approved_by ?? null,
      input_digest: request.input_digest ?? computeInputDigest(request.input_payload),
      permissions: request.permissions ?? manifest.permissions_required,
      started_at,
      completed_at: this.timestamp()
    };
  }

  private createExecutionContext(
    base: InvocationBase,
    timeoutMs: number,
    abortSignal: AbortSignal
  ): HollowExecutionContext {
    const deadline = new Date(Date.parse(base.started_at) + timeoutMs).toISOString();
    return {
      abort_signal: abortSignal,
      invocation_id: base.invocation_id,
      task_id: base.task_id,
      run_id: base.run_id,
      trace_id: base.trace_id,
      hollow_id: base.manifest.hollow_id,
      hollow_version: base.manifest.hollow_version,
      started_at: base.started_at,
      deadline_at: deadline,
      caller: base.caller,
      requested_by: base.requested_by,
      approved_by: base.approved_by,
      permissions: base.permissions,
      execution_mode: base.manifest.execution_mode
    };
  }

  private checkV1Safety(manifest: HollowManifest): HollowRunnerInputError | undefined {
    if (!isV1SafeHollowManifest(manifest)) {
      return new HollowRunnerInputError(
        manifest.hollow_id,
        `Hollow manifest "${manifest.hollow_id}" is not V1-safe and was not executed.`
      );
    }

    const forbiddenPermissions = new Set<SideEffectClass>([
      "network",
      "shell_command",
      "external_side_effect",
      "workspace_write"
    ]);

    if (
      manifest.network_access ||
      manifest.execution_mode === "approved_side_effect" ||
      manifest.permissions.some((permission) => forbiddenPermissions.has(permission)) ||
      manifest.permissions_required.some((permission) => forbiddenPermissions.has(permission))
    ) {
      return new HollowRunnerInputError(
        manifest.hollow_id,
        `Hollow manifest "${manifest.hollow_id}" requests blocked side-effect access.`
      );
    }

    return undefined;
  }

  private checkRequestedPermissions(
    manifest: HollowManifest,
    requestedPermissions: readonly SideEffectClass[]
  ): HollowRunnerInputError | undefined {
    const undeclaredPermission = requestedPermissions.find(
      (permission) => !manifest.permissions.includes(permission)
    );

    if (undeclaredPermission !== undefined) {
      return new HollowRunnerInputError(
        manifest.hollow_id,
        `Requested permission "${undeclaredPermission}" is not declared by Hollow manifest "${manifest.hollow_id}".`
      );
    }

    return undefined;
  }

  private checkInputSize(
    manifest: HollowManifest,
    inputPayload: JsonValue
  ): HollowRunnerInputError | undefined {
    let estimatedSize = 0;

    try {
      estimatedSize = JSON.stringify(inputPayload).length;
    } catch {
      return new HollowRunnerInputError(
        manifest.hollow_id,
        `Input payload for Hollow "${manifest.hollow_id}" could not be size-estimated.`
      );
    }

    if (estimatedSize > manifest.max_input_size) {
      return new HollowRunnerInputError(
        manifest.hollow_id,
        `Input payload for Hollow "${manifest.hollow_id}" exceeds max_input_size ${manifest.max_input_size}.`
      );
    }

    return undefined;
  }

  private async runWithOptionalTimeout(
    result: Promise<HollowImplementationResult> | HollowImplementationResult,
    hollow_id: string,
    timeoutMs: number,
    abortController: AbortController
  ): Promise<HollowImplementationResult> {
    const execution = Promise.resolve(result);

    if (timeoutMs <= 0) {
      return execution;
    }

    return await new Promise<HollowImplementationResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        abortController.abort();
        reject(new HollowRunnerTimeoutError(hollow_id, timeoutMs));
      }, timeoutMs);

      execution.then(
        (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timeout);
          reject(error);
        }
      );
    });
  }

  private createSuccessRecord(
    base: InvocationBase,
    input_payload: JsonValue,
    result: HollowImplementationResult
  ): HollowInvocationRecord {
    return {
      ...this.createRecordCommon(base, input_payload),
      completed_at: this.timestamp(),
      status: "completed",
      result: result.result,
      result_units: result.result_units ?? base.manifest.result_units,
      checks: result.checks ?? [],
      warnings: result.warnings ?? [],
      errors: [],
      artifact_hashes: result.artifact_hashes ?? [],
      provenance: this.createProvenance(base),
      ledger_refs: [],
      retryable: false,
      confidence_level: result.confidence_level ?? "unverified_local_execution",
      verification_status: "unverified",
      trust_tier: "T0"
    };
  }

  private createRejectedRecord(
    base: InvocationBase,
    input_payload: JsonValue,
    error: Error,
    status: "blocked" | "rejected",
    verification_status: "blocked" | "rejected"
  ): HollowInvocationRecord {
    return {
      ...this.createRecordCommon(base, input_payload),
      completed_at: this.timestamp(),
      status,
      result: { failure: error.message },
      result_units: base.manifest.result_units,
      checks: [],
      warnings: [],
      errors: [this.createCalebError(error, false)],
      artifact_hashes: [],
      provenance: this.createProvenance(base),
      ledger_refs: [],
      retryable: false,
      confidence_level: "unverified_local_execution",
      verification_status,
      trust_tier: "T0"
    };
  }

  private createFailedRecord(
    base: InvocationBase,
    input_payload: JsonValue,
    error: Error
  ): HollowInvocationRecord {
    return {
      ...this.createRecordCommon(base, input_payload),
      completed_at: this.timestamp(),
      status: "failed",
      result: { failure: error.message },
      result_units: base.manifest.result_units,
      checks: [],
      warnings: [],
      errors: [this.createCalebError(error, error instanceof HollowRunnerTimeoutError)],
      artifact_hashes: [],
      provenance: this.createProvenance(base),
      ledger_refs: [],
      retryable: error instanceof HollowRunnerTimeoutError,
      confidence_level: "unverified_local_execution",
      verification_status: "rejected",
      trust_tier: "T0"
    };
  }

  private createRecordCommon(
    base: InvocationBase,
    input_payload: JsonValue
  ): Omit<
    HollowInvocationRecord,
    | "completed_at"
    | "status"
    | "result"
    | "result_units"
    | "checks"
    | "warnings"
    | "errors"
    | "artifact_hashes"
    | "provenance"
    | "ledger_refs"
    | "retryable"
    | "confidence_level"
    | "verification_status"
    | "trust_tier"
  > {
    return {
      hollow_id: base.manifest.hollow_id,
      hollow_name: base.manifest.hollow_name,
      hollow_version: base.manifest.hollow_version,
      schema_version: base.manifest.schema_version,
      invocation_id: base.invocation_id,
      task_id: base.task_id,
      run_id: base.run_id,
      trace_id: base.trace_id,
      caller: base.caller,
      requested_by: base.requested_by,
      approved_by: base.approved_by,
      input_type: base.manifest.input_type,
      input_digest: base.input_digest,
      input_payload,
      permissions: [...base.permissions],
      execution_mode: base.manifest.execution_mode,
      deterministic: base.manifest.deterministic,
      started_at: base.started_at
    };
  }

  private createProvenance(base: InvocationBase): JsonObject {
    return {
      hollow_id: base.manifest.hollow_id,
      hollow_version: base.manifest.hollow_version,
      runner: "HollowRunner"
    };
  }

  private createCalebError(error: Error, retryable: boolean): CalebError {
    return {
      error_id: error.name,
      message: error.message,
      severity: "error",
      retryable
    };
  }

  private resolveTimeoutMs(manifest: HollowManifest): number {
    return this.default_timeout_ms ?? manifest.max_runtime_ms;
  }

  private timestamp(): string {
    return this.now().toISOString();
  }
}

export function createHollowRunner(
  registry: HollowRegistry,
  implementations: ImplementationMap = new Map(),
  options: HollowRunnerOptions = {}
): HollowRunner {
  return new HollowRunner(registry, implementations, options);
}

// Digest is over the runtime JSON serialization (JS key order), not a canonical
// JSON form. Unserializable payloads get a sentinel digest and are then rejected
// by the input size check, so no completed record can carry the sentinel.
function computeInputDigest(input_payload: JsonValue): Sha256Digest {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(input_payload);
  } catch {
    return "sha256:unserializable";
  }

  if (serialized === undefined) {
    return "sha256:unserializable";
  }

  return `sha256:${createHash("sha256").update(serialized).digest("hex")}`;
}
