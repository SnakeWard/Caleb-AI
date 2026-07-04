import type { LedgerEntry } from "../types/ledger.js";
import type { JsonValue } from "../types/common.js";
import type { HollowInvocationRecord } from "../types/invocation.js";
import { isAbsolute } from "node:path";
import { listV1HollowIds, createV1HollowRunner } from "../hollows/v1HollowCatalog.js";
import { listHollowcutHollowIds } from "../hollows/hollowcutHollowCatalog.js";
import { VerifiedReturnPath } from "../verification/verifiedReturnPath.js";
import type { VerificationResult } from "../verification/verificationTypes.js";
import { createLedgerEntryFromInvocation, createLedgerEntryFromEvidence, JsonlLedger } from "../ledger/index.js";
import { createLedgerEntryFromRouteDecision } from "./ledgerEmitter.js";
import { createSnapshotManager } from "../changeGuard/snapshotManager.js";
import type { SnapshotResult } from "../changeGuard/changeGuardTypes.js";
import type { TaskFrame } from "./types/taskFrame.js";
import type { SignalFrame } from "./types/signalFrame.js";
import type { RouteDecision } from "./types/routeDecision.js";
import type { WorkGraph } from "./types/workGraph.js";
import type {
  HollowDispatchRequest,
  HollowDispatchValidationError,
  HollowDispatchValidationResult
} from "./types/hollowDispatchRequest.js";
import type {
  LogicEngineDispatchError,
  LogicEngineExecutionResult
} from "./types/logicEngineResult.js";

export interface DispatchHollowOptions {
  readonly writeLedger?: boolean;
  readonly ledgerPath?: string;
  readonly approved_by?: string;
  readonly projectRoot?: string;
  readonly snapshotRoot?: string;
  readonly filesToCapture?: readonly string[];
  // Injectables for testing — production callers must not set these
  readonly _overrideSnapshotManager?: {
    readonly createPreChangeSnapshot: (request: {
      readonly reason: string;
      readonly requested_change?: string;
      readonly files_to_capture: readonly string[];
      readonly run_id?: string;
      readonly trace_id?: string;
      readonly requested_by?: string;
      readonly approved_by?: string | null;
      readonly notes?: string;
      readonly strict?: boolean;
    }) => Promise<SnapshotResult>;
  };
  readonly _overrideLedger?: {
    readonly appendMany: (entries: readonly LedgerEntry[]) => Promise<LedgerEntry[]>;
  };
  readonly _overrideVRP?: {
    readonly verifyInvocation: (invocation: HollowInvocationRecord) => VerificationResult;
  };
}

export function validateHollowDispatchRequest(
  raw: unknown,
  v1HollowIds: ReadonlySet<string>,
  hollowcutHollowIds: ReadonlySet<string>
): HollowDispatchValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      valid: false,
      errors: [
        {
          field: "(root)",
          code: "invalid_type",
          message: "HollowDispatchRequest must be a JSON object."
        }
      ]
    };
  }

  const obj = raw as Record<string, unknown>;
  const errors: HollowDispatchValidationError[] = [];

  if (obj.hollow_id === undefined || obj.hollow_id === null) {
    errors.push({
      field: "hollow_id",
      code: "missing_hollow_id",
      message: "hollow_id is required."
    });
  } else if (typeof obj.hollow_id !== "string") {
    errors.push({
      field: "hollow_id",
      code: "invalid_hollow_id_type",
      message: "hollow_id must be a string."
    });
  } else if (obj.hollow_id.trim().length === 0) {
    errors.push({
      field: "hollow_id",
      code: "empty_hollow_id",
      message: "hollow_id must not be empty."
    });
  } else {
    const hollow_id = obj.hollow_id;
    if (hollowcutHollowIds.has(hollow_id)) {
      errors.push({
        field: "hollow_id",
        code: "hollowcut_hollow_not_allowed",
        message: `Hollow '${hollow_id}' is a Hollowcut Hollow and cannot be dispatched through the V1 Logic Engine.`
      });
    } else if (!v1HollowIds.has(hollow_id)) {
      errors.push({
        field: "hollow_id",
        code: "unknown_hollow_id",
        message: `Hollow '${hollow_id}' is not in the protected V1 catalog.`
      });
    }
  }

  if (!Object.prototype.hasOwnProperty.call(obj, "hollow_input")) {
    errors.push({
      field: "hollow_input",
      code: "missing_hollow_input",
      message: "hollow_input is required."
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    request: {
      hollow_id: obj.hollow_id as string,
      hollow_input: obj.hollow_input as JsonValue
    }
  };
}

function validateFilesToCapture(
  paths: readonly string[]
): { valid: true } | { valid: false; code: string; message: string } {
  // Runtime guard: non-array values are rejected even though the type system prevents them in normal use
  if (!Array.isArray(paths)) {
    return { valid: false, code: "invalid_files_to_capture", message: "files_to_capture must be a JSON array." };
  }
  for (const p of paths) {
    if (typeof p !== "string") {
      return {
        valid: false,
        code: "invalid_files_to_capture",
        message: "Each entry in files_to_capture must be a string."
      };
    }
    const trimmed = p.trim();
    if (trimmed.length === 0) {
      return {
        valid: false,
        code: "invalid_files_to_capture",
        message: "files_to_capture entries must not be empty or whitespace-only."
      };
    }
    if (isAbsolute(trimmed)) {
      return {
        valid: false,
        code: "invalid_files_to_capture",
        message: `Absolute paths are not allowed in files_to_capture: '${trimmed}'. Use paths relative to the project root.`
      };
    }
  }
  return { valid: true };
}

function refusedResult(
  frame: TaskFrame,
  signals: SignalFrame,
  decision: RouteDecision,
  graph: WorkGraph,
  errors: readonly LogicEngineDispatchError[]
): LogicEngineExecutionResult {
  return {
    status: "refused",
    frame,
    signals,
    decision,
    graph,
    executed_hollow_id: null,
    invocation: null,
    verification: null,
    evidence_packet: null,
    snapshot_id: null,
    approved_by: null,
    snapshot_capture_mode: null,
    snapshot_files_captured: null,
    ledger_write_status: "skipped",
    ledger_entries: [],
    warnings: [],
    errors
  };
}

export async function dispatchHollow(
  frame: TaskFrame,
  signals: SignalFrame,
  decision: RouteDecision,
  graph: WorkGraph,
  rawDispatchRequest: unknown,
  options: DispatchHollowOptions = {}
): Promise<LogicEngineExecutionResult> {
  // Gate 1: Route mode — hollow dispatch only valid for hollow_only routes
  if (decision.route_mode !== "hollow_only") {
    return refusedResult(frame, signals, decision, graph, [
      {
        code: "route_not_hollow_only",
        message: `Hollow dispatch is only allowed for route_mode 'hollow_only'. Got '${decision.route_mode}'.`
      }
    ]);
  }

  // Gate 2: Approval preflight — checked before any disk I/O
  const trimmedApprovedBy = (options.approved_by ?? "").trim();
  if (decision.requires_approval_gate && trimmedApprovedBy.length === 0) {
    return refusedResult(frame, signals, decision, graph, [
      {
        code: "missing_approved_by",
        message:
          "This task requires human approval before Hollow dispatch. Provide a non-empty --approved-by value."
      }
    ]);
  }

  // Gate 3: Snapshot gate — runs only after approval is verified (or not required)
  let snapshotId: string | null = null;
  let snapshotLedgerEntry: LedgerEntry | null = null;
  let snapshotCaptureMode: "audit_marker" | "file_capture" | null = null;
  let snapshotFilesCaptured: number | null = null;

  if (decision.requires_snapshot_gate) {
    const rawPathsOpt = options.filesToCapture;
    const hasCaptureList = rawPathsOpt !== undefined;

    // Gate 3a: requires_code_mutation demands an explicit, non-empty file capture list
    if (frame.requires_code_mutation) {
      const hasValidList = hasCaptureList && Array.isArray(rawPathsOpt) && rawPathsOpt.length > 0;
      if (!hasValidList) {
        return refusedResult(frame, signals, decision, graph, [
          {
            code: "files_to_capture_required",
            message:
              "This task declares requires_code_mutation. Provide --files-to-capture-json or --files-to-capture-file listing the files that will be modified before Hollow dispatch."
          }
        ]);
      }
    }

    // Gate 3b: validate individual path entries if a capture list is present
    let effectivePaths: string[] = [];
    if (hasCaptureList) {
      const pathValidation = validateFilesToCapture(rawPathsOpt);
      if (!pathValidation.valid) {
        return refusedResult(frame, signals, decision, graph, [
          { code: pathValidation.code, message: pathValidation.message }
        ]);
      }
      effectivePaths = rawPathsOpt.map((p) => p.trim());
    }

    // Gate 3c: snapshot creation
    const sharedLedger =
      options.writeLedger === true && options.ledgerPath !== undefined
        ? new JsonlLedger(options.ledgerPath)
        : undefined;

    const sm =
      options._overrideSnapshotManager ??
      createSnapshotManager({
        projectRoot: options.projectRoot ?? process.cwd(),
        ...(options.snapshotRoot !== undefined ? { snapshotRoot: options.snapshotRoot } : {}),
        ...(sharedLedger !== undefined ? { ledger: sharedLedger } : {})
      });

    let snapshotResult: SnapshotResult;
    try {
      snapshotResult = await sm.createPreChangeSnapshot({
        reason: "logic-execute pre-dispatch gate snapshot",
        requested_change: frame.description,
        files_to_capture: effectivePaths,
        strict: effectivePaths.length > 0,
        run_id: frame.run_id,
        trace_id: frame.trace_id,
        requested_by: frame.requested_by,
        approved_by: trimmedApprovedBy.length > 0 ? trimmedApprovedBy : null
      });
    } catch (err) {
      return refusedResult(frame, signals, decision, graph, [
        {
          code: "snapshot_creation_failed",
          message: `Snapshot creation threw an exception: ${err instanceof Error ? err.message : String(err)}`
        }
      ]);
    }

    if (snapshotResult.errors.length > 0) {
      return refusedResult(frame, signals, decision, graph, [
        {
          code: "snapshot_creation_failed",
          message: `Snapshot creation failed: ${snapshotResult.errors.join("; ")}`
        }
      ]);
    }

    snapshotId = snapshotResult.snapshot_id;
    snapshotLedgerEntry = snapshotResult.ledger_entry ?? null;
    snapshotCaptureMode = effectivePaths.length > 0 ? "file_capture" : "audit_marker";
    snapshotFilesCaptured = snapshotResult.captured_files.length;
  }

  // Gate 4: Validate HollowDispatchRequest
  const v1HollowIds = new Set(listV1HollowIds());
  const hollowcutHollowIds = new Set(listHollowcutHollowIds());

  const dispatchValidation = validateHollowDispatchRequest(rawDispatchRequest, v1HollowIds, hollowcutHollowIds);
  if (!dispatchValidation.valid) {
    return refusedResult(
      frame,
      signals,
      decision,
      graph,
      dispatchValidation.errors.map((e) => ({ code: e.code, message: e.message }))
    );
  }

  const dispatchRequest: HollowDispatchRequest = dispatchValidation.request;

  // Run HollowRunner — only reached after all gates pass
  const runner = createV1HollowRunner({
    default_caller: "logic_engine_v0",
    default_requested_by: frame.requested_by
  });

  const invocation = await runner.run({
    hollow_id: dispatchRequest.hollow_id,
    input_payload: dispatchRequest.hollow_input,
    task_id: frame.task_id,
    run_id: frame.run_id,
    trace_id: frame.trace_id,
    requested_by: frame.requested_by
  });

  // VRP — explicit call; HollowRunner does not promote trust tier
  // VRP runs regardless of invocation status to maintain a complete audit trail
  const vrpInstance = options._overrideVRP ?? new VerifiedReturnPath();
  const verification = vrpInstance.verifyInvocation(invocation);
  const evidencePacket = verification.evidence_packet ?? null;

  // Determine execution status and structured failure errors (priority: hollow_runner_failed > vrp_rejected)
  const executionStatus =
    invocation.status === "completed" && verification.decision === "accepted" ? "executed" : "failed";

  const executionErrors: LogicEngineDispatchError[] = [];
  if (executionStatus === "failed") {
    if (invocation.status !== "completed") {
      // Primary cause: HollowRunner itself failed — VRP rejection is a consequence, not the cause
      executionErrors.push({
        code: "hollow_runner_failed",
        message: `Hollow invocation did not complete. Status: ${invocation.status}.`
      });
    } else {
      // HollowRunner completed but VRP did not accept the result
      executionErrors.push({
        code: "vrp_rejected",
        message: `VRP did not accept the invocation result. Decision: ${verification.decision}.`
      });
    }
  }

  // Optional ledger write — caught so ledger failure cannot destroy evidence
  let ledgerWriteStatus: "ok" | "failed" | "skipped" = "skipped";
  const executionWarnings: string[] = [];
  const ledgerEntries: LedgerEntry[] = [];

  if (options.writeLedger === true && options.ledgerPath !== undefined) {
    const routeEntry = createLedgerEntryFromRouteDecision(decision, graph);
    const invocationEntry = createLedgerEntryFromInvocation(invocation);

    const entriesToWrite: LedgerEntry[] =
      evidencePacket !== null
        ? [
            routeEntry,
            invocationEntry,
            createLedgerEntryFromEvidence(evidencePacket, {
              parent_refs: [routeEntry.ledger_id, invocationEntry.ledger_id]
            })
          ]
        : [routeEntry, invocationEntry];

    try {
      const ledger = options._overrideLedger ?? new JsonlLedger(options.ledgerPath);
      await ledger.appendMany(entriesToWrite);
      ledgerEntries.push(...entriesToWrite);
      ledgerWriteStatus = "ok";
    } catch (err) {
      ledgerWriteStatus = "failed";
      executionWarnings.push("Ledger write failed — execution evidence was not persisted.");
      executionErrors.push({
        code: "ledger_write_failed",
        message: `Ledger write failed: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }

  // Snapshot entry (if snapshot gate ran with writeLedger) goes first in the chain
  if (snapshotLedgerEntry !== null) {
    ledgerEntries.unshift(snapshotLedgerEntry);
  }

  const approvedBy = decision.requires_approval_gate ? trimmedApprovedBy : null;

  return {
    status: executionStatus,
    frame,
    signals,
    decision,
    graph,
    executed_hollow_id: dispatchRequest.hollow_id,
    invocation,
    verification,
    evidence_packet: evidencePacket,
    snapshot_id: snapshotId,
    approved_by: approvedBy,
    snapshot_capture_mode: snapshotCaptureMode,
    snapshot_files_captured: snapshotFilesCaptured,
    ledger_write_status: ledgerWriteStatus,
    ledger_entries: ledgerEntries,
    warnings: executionWarnings,
    errors: executionErrors
  };
}
