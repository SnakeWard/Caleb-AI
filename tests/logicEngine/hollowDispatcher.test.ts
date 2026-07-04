import { describe, it, expect, afterEach } from "vitest";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { rm } from "node:fs/promises";

import { dispatchHollow, validateHollowDispatchRequest } from "../../src/logicEngine/hollowDispatcher.js";
import { validateTaskFrameInput } from "../../src/logicEngine/taskFrameValidator.js";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import { selectRoute } from "../../src/logicEngine/routeSelector.js";
import { buildWorkGraph } from "../../src/logicEngine/workGraphBuilder.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";
import type { SignalFrame } from "../../src/logicEngine/types/signalFrame.js";
import type { RouteDecision } from "../../src/logicEngine/types/routeDecision.js";
import type { WorkGraph } from "../../src/logicEngine/types/workGraph.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePipeline(
  overrides: Partial<Record<string, unknown>> = {}
): { frame: TaskFrame; signals: SignalFrame; decision: RouteDecision; graph: WorkGraph } {
  const raw = {
    task_id: "test_task_001",
    run_id: "test_run_001",
    trace_id: "test_trace_001",
    task_type: "hollow_execution",
    description: "Test hollow execution task",
    input_summary: "Character count deterministic test",
    requested_by: "test_runner",
    requires_code_mutation: false,
    signal_hints: { deterministic_only: 2, requires_judgment: 0 },
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
  const validation = validateTaskFrameInput(raw);
  if (!validation.valid) {
    throw new Error(`Test setup: invalid TaskFrame — ${validation.errors[0]?.message ?? "unknown"}`);
  }
  const frame = validation.frame;
  const signals = classifySignals(frame);
  const decision = selectRoute(frame, signals);
  const graph = buildWorkGraph(frame, decision);
  return { frame, signals, decision, graph };
}

function makeNonHollowOnlyPipeline(): { frame: TaskFrame; signals: SignalFrame; decision: RouteDecision; graph: WorkGraph } {
  return makePipeline({
    task_type: "text_analysis",
    signal_hints: {},
    task_id: "test_task_002",
    run_id: "test_run_002",
    trace_id: "test_trace_002"
  });
}

const V1_HOLLOW_ID_SET = new Set(V1_HOLLOW_MANIFESTS.map((m) => m.hollow_id));
const HOLLOWCUT_HOLLOW_ID_SET = new Set(HOLLOWCUT_HOLLOW_MANIFESTS.map((m) => m.hollow_id));

const CHAR_COUNT_HOLLOW_ID = "hollow.text.character_count";
const VALID_DISPATCH_REQUEST = {
  hollow_id: CHAR_COUNT_HOLLOW_ID,
  hollow_input: { text: "Caleb orchestrates." }
};

let tempLedgerPath: string | undefined;
let tempSnapshotRoot: string | undefined;

afterEach(async () => {
  if (tempLedgerPath !== undefined) {
    await rm(tempLedgerPath, { force: true });
    tempLedgerPath = undefined;
  }
  if (tempSnapshotRoot !== undefined) {
    await rm(tempSnapshotRoot, { recursive: true, force: true });
    tempSnapshotRoot = undefined;
  }
});

// ─── validateHollowDispatchRequest — unit tests ───────────────────────────────

describe("validateHollowDispatchRequest — root type", () => {
  it("rejects null", () => {
    const result = validateHollowDispatchRequest(null, V1_HOLLOW_ID_SET, HOLLOWCUT_HOLLOW_ID_SET);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0]?.code).toBe("invalid_type");
    }
  });

  it("rejects a string", () => {
    const result = validateHollowDispatchRequest("hollow.text.character_count", V1_HOLLOW_ID_SET, HOLLOWCUT_HOLLOW_ID_SET);
    expect(result.valid).toBe(false);
  });

  it("rejects an array", () => {
    const result = validateHollowDispatchRequest([], V1_HOLLOW_ID_SET, HOLLOWCUT_HOLLOW_ID_SET);
    expect(result.valid).toBe(false);
  });
});

describe("validateHollowDispatchRequest — hollow_id", () => {
  it("rejects missing hollow_id", () => {
    const result = validateHollowDispatchRequest(
      { hollow_input: { text: "hello" } },
      V1_HOLLOW_ID_SET,
      HOLLOWCUT_HOLLOW_ID_SET
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.code === "missing_hollow_id")).toBe(true);
    }
  });

  it("rejects empty string hollow_id", () => {
    const result = validateHollowDispatchRequest(
      { hollow_id: "", hollow_input: { text: "hello" } },
      V1_HOLLOW_ID_SET,
      HOLLOWCUT_HOLLOW_ID_SET
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.code === "empty_hollow_id")).toBe(true);
    }
  });

  it("rejects unknown hollow_id with 'unknown_hollow_id'", () => {
    const result = validateHollowDispatchRequest(
      { hollow_id: "hollow.unknown.nonexistent", hollow_input: {} },
      V1_HOLLOW_ID_SET,
      HOLLOWCUT_HOLLOW_ID_SET
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.code === "unknown_hollow_id")).toBe(true);
    }
  });

  it("rejects a Hollowcut hollow_id with 'hollowcut_hollow_not_allowed'", () => {
    const hollowcutId = HOLLOWCUT_HOLLOW_MANIFESTS[0]?.hollow_id;
    expect(hollowcutId).toBeDefined();
    const result = validateHollowDispatchRequest(
      { hollow_id: hollowcutId, hollow_input: {} },
      V1_HOLLOW_ID_SET,
      HOLLOWCUT_HOLLOW_ID_SET
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.code === "hollowcut_hollow_not_allowed")).toBe(true);
    }
  });
});

describe("validateHollowDispatchRequest — hollow_input", () => {
  it("rejects when hollow_input key is absent", () => {
    const result = validateHollowDispatchRequest(
      { hollow_id: CHAR_COUNT_HOLLOW_ID },
      V1_HOLLOW_ID_SET,
      HOLLOWCUT_HOLLOW_ID_SET
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.code === "missing_hollow_input")).toBe(true);
    }
  });

  it("accepts hollow_input: null (null is a valid JsonValue)", () => {
    const result = validateHollowDispatchRequest(
      { hollow_id: CHAR_COUNT_HOLLOW_ID, hollow_input: null },
      V1_HOLLOW_ID_SET,
      HOLLOWCUT_HOLLOW_ID_SET
    );
    expect(result.valid).toBe(true);
  });

  it("accepts a valid HollowDispatchRequest and returns the typed request", () => {
    const result = validateHollowDispatchRequest(VALID_DISPATCH_REQUEST, V1_HOLLOW_ID_SET, HOLLOWCUT_HOLLOW_ID_SET);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.request.hollow_id).toBe(CHAR_COUNT_HOLLOW_ID);
      expect(result.request.hollow_input).toEqual({ text: "Caleb orchestrates." });
    }
  });
});

// ─── dispatchHollow — route gate ──────────────────────────────────────────────

describe("dispatchHollow — non-hollow_only routes are refused (test 6)", () => {
  const NON_HOLLOW_ONLY_CASES: Array<{ label: string; overrides: Record<string, unknown> }> = [
    { label: "single_pass", overrides: { task_type: "text_analysis", signal_hints: {} } },
    { label: "recovery_guardrail", overrides: { task_type: "recovery", signal_hints: {} } },
    { label: "full_rotation_stub (HIGH_STAKES_HIGH_EVIDENCE)", overrides: { task_type: "synthesis", signal_hints: { stakes: 2, evidence_complexity: 2 } } }
  ];

  for (const { label, overrides } of NON_HOLLOW_ONLY_CASES) {
    it(`refuses dispatch when route_mode is '${label}'`, async () => {
      const { frame, signals, decision, graph } = makePipeline({
        task_id: `test_refused_${label}`,
        run_id: `run_refused_${label}`,
        trace_id: `trace_refused_${label}`,
        ...overrides
      });
      expect(decision.route_mode).not.toBe("hollow_only");

      const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
      expect(result.status).toBe("refused");
      expect(result.errors.some((e) => e.code === "route_not_hollow_only")).toBe(true);
      expect(result.invocation).toBeNull();
      expect(result.evidence_packet).toBeNull();
      expect(result.executed_hollow_id).toBeNull();
    });
  }
});

// ─── dispatchHollow — dispatch validation passthrough ─────────────────────────

describe("dispatchHollow — missing/invalid HollowDispatchRequest is refused", () => {
  it("refuses null dispatch request (test 9)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, null);
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "invalid_type")).toBe(true);
  });

  it("refuses undefined dispatch request (test 9)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, undefined);
    expect(result.status).toBe("refused");
  });

  it("refuses unknown hollow_id (test 7)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, {
      hollow_id: "hollow.unknown.does_not_exist",
      hollow_input: { text: "hello" }
    });
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "unknown_hollow_id")).toBe(true);
  });

  it("refuses Hollowcut hollow_id (test 8)", async () => {
    const hollowcutId = HOLLOWCUT_HOLLOW_MANIFESTS[0]?.hollow_id;
    expect(hollowcutId).toBeDefined();
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, {
      hollow_id: hollowcutId,
      hollow_input: {}
    });
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "hollowcut_hollow_not_allowed")).toBe(true);
  });
});

// ─── dispatchHollow — successful execution ────────────────────────────────────

describe("dispatchHollow — successful hollow_only execution", () => {
  it("returns LogicEngineExecutionResult for a valid hollow_only dispatch (test 2)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);

    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("frame");
    expect(result).toHaveProperty("signals");
    expect(result).toHaveProperty("decision");
    expect(result).toHaveProperty("graph");
    expect(result).toHaveProperty("executed_hollow_id");
    expect(result).toHaveProperty("invocation");
    expect(result).toHaveProperty("verification");
    expect(result).toHaveProperty("evidence_packet");
    expect(result).toHaveProperty("ledger_entries");
    expect(result).toHaveProperty("errors");
  });

  it("executes a V1 Hollow and returns status 'executed' (test 1)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);

    expect(result.status).toBe("executed");
    expect(result.executed_hollow_id).toBe(CHAR_COUNT_HOLLOW_ID);
    expect(result.errors).toHaveLength(0);
  });

  it("raw invocation starts as T0/unverified before VRP processes it (test 3)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);

    expect(result.invocation).not.toBeNull();
    expect(result.invocation?.trust_tier).toBe("T0");
    expect(result.invocation?.verification_status).toBe("unverified");
  });

  it("VRP produces verified evidence for deterministic V1 Hollow (test 4)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);

    expect(result.verification).not.toBeNull();
    expect(result.verification?.decision).toBe("accepted");
    expect(result.evidence_packet).not.toBeNull();
    expect(result.evidence_packet?.verification_status).toBe("verified");
  });

  it("evidence packet trust tier is T2 — reached only through VRP (test 5)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);

    // Raw invocation is T0
    expect(result.invocation?.trust_tier).toBe("T0");
    // VRP evidence is T2
    expect(result.evidence_packet?.trust_tier).toBe("T2");
    // VRP signature is present in evidence provenance
    expect(result.evidence_packet?.provenance["verified_return_path"]).toBe(true);
  });

  it("propagates task_id and run_id through the full pipeline", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);

    expect(result.invocation?.task_id).toBe(frame.task_id);
    expect(result.invocation?.run_id).toBe(frame.run_id);
  });
});

// ─── dispatchHollow — failure handling ───────────────────────────────────────

describe("dispatchHollow — invalid hollow_input fails safely (test 10)", () => {
  it("does not throw when hollow input is structurally wrong for the Hollow", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, {
      hollow_id: CHAR_COUNT_HOLLOW_ID,
      hollow_input: { wrong_field: "no text here" }
    });

    expect(() => result).not.toThrow();
    expect(result.status).toBe("failed");
    expect(result.executed_hollow_id).toBe(CHAR_COUNT_HOLLOW_ID);
  });

  it("returns a structured failure result when Hollow invocation fails (test 11)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, {
      hollow_id: CHAR_COUNT_HOLLOW_ID,
      hollow_input: { wrong_field: "no text here" }
    });

    expect(result.status).toBe("failed");
    expect(result.invocation).not.toBeNull();
    expect(result.invocation?.status).toBe("failed");
    expect(result.verification).not.toBeNull();
    expect(result.verification?.decision).toBe("rejected");
    expect(result.errors.some((e) => e.code === "hollow_runner_failed")).toBe(true);
    expect(result.errors.every((e) => e.code !== "vrp_rejected")).toBe(true);
  });
});

// ─── dispatchHollow — ledger writing ─────────────────────────────────────────

describe("dispatchHollow — ledger writing", () => {
  it("does not write any ledger entries when writeLedger is absent (test 12)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);

    expect(result.ledger_entries).toHaveLength(0);
  });

  it("does not write any ledger entries when writeLedger is false", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: false
    });

    expect(result.ledger_entries).toHaveLength(0);
  });

  it("creates three linked ledger entries when writeLedger is true (test 13)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_test_ledger_${Date.now()}.jsonl`);

    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath
    });

    expect(result.ledger_entries).toHaveLength(3);

    const [routeEntry, invocationEntry, evidenceEntry] = result.ledger_entries;

    expect(routeEntry?.actor_type).toBe("orchestration_core");
    expect(invocationEntry?.actor_type).toBe("hollow");
    expect(evidenceEntry?.actor_type).toBe("verified_return_path");
  });

  it("evidence ledger entry parent_refs link route and invocation entries (test 13)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_test_ledger_${Date.now()}_refs.jsonl`);

    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath
    });

    const [routeEntry, invocationEntry, evidenceEntry] = result.ledger_entries;

    expect(evidenceEntry?.parent_refs).toContain(routeEntry?.ledger_id);
    expect(evidenceEntry?.parent_refs).toContain(invocationEntry?.ledger_id);
  });

  it("all three ledger entries share the same task_id", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_test_ledger_${Date.now()}_taskid.jsonl`);

    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath
    });

    for (const entry of result.ledger_entries) {
      expect(entry.task_id).toBe(frame.task_id);
    }
  });
});

// ─── dispatchHollow — gate activation (V0.2 tests 1–19) ─────────────────────

function makeGatedDecision(
  frame: TaskFrame,
  requiresSnapshot: boolean,
  requiresApproval: boolean
): { decision: RouteDecision; graph: WorkGraph } {
  const decision: RouteDecision = {
    task_id: frame.task_id,
    run_id: frame.run_id,
    route_mode: "hollow_only" as const,
    route_rationale: "DETERMINISTIC_LOCK (gate test fixture)",
    hard_overrides_applied: [],
    requires_snapshot_gate: requiresSnapshot,
    requires_approval_gate: requiresApproval,
    complexity_band: "low" as const,
    signal_score: 2,
    decided_at: "2026-01-01T00:00:00.000Z"
  };
  const graph = buildWorkGraph(frame, decision);
  return { decision, graph };
}

// Mock snapshot managers for failure-path testing (tests 12, 13)
const mockErrorSnapshotManager = {
  createPreChangeSnapshot: async (_req: unknown): Promise<{
    snapshot_id: string; snapshot_path: string; manifest: Record<string, unknown>;
    captured_files: unknown[]; warnings: string[]; errors: string[];
  }> => ({
    snapshot_id: "snap_mock_error_001",
    snapshot_path: "/tmp/mock_error_snapshot",
    manifest: { status: "failed" },
    captured_files: [],
    warnings: [],
    errors: ["Mock: disk write permission denied for test"]
  })
};

const mockThrowSnapshotManager = {
  createPreChangeSnapshot: async (_req: unknown): Promise<never> => {
    throw new Error("Mock: file system unavailable for test");
  }
};

describe("dispatchHollow — gate activation", () => {
  // ── Test 1: ungated routes still execute ──────────────────────────────────
  it("ungated hollow_only route still executes successfully (test 1)", async () => {
    const { frame, signals, decision, graph } = makePipeline();

    expect(decision.route_mode).toBe("hollow_only");
    expect(decision.requires_snapshot_gate).toBe(false);
    expect(decision.requires_approval_gate).toBe(false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("executed");
  });

  // ── Tests 2–4: approval preflight refuses before any disk I/O ─────────────
  it("approval-gated route refuses without --approved-by (test 2)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, false, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "missing_approved_by")).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.snapshot_id).toBeNull();
    expect(result.invocation).toBeNull();
  });

  it("approval-gated route refuses with empty string --approved-by (test 3)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, false, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      approved_by: ""
    });
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "missing_approved_by")).toBe(true);
    expect(result.snapshot_id).toBeNull();
  });

  it("approval-gated route refuses with whitespace-only --approved-by (test 4)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, false, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      approved_by: "   "
    });
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "missing_approved_by")).toBe(true);
    expect(result.snapshot_id).toBeNull();
  });

  // ── Tests 5–6: approval gate passes with non-empty approved_by ────────────
  it("approval-gated route executes when non-empty --approved-by provided (test 5)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, false, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test"
    });
    expect(result.status).toBe("executed");
    expect(result.invocation).not.toBeNull();
    expect(result.evidence_packet).not.toBeNull();
  });

  it("approval-gated route records approved_by in result (test 6)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, false, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test"
    });
    expect(result.approved_by).toBe("operator.test");
    expect(result.snapshot_id).toBeNull();
  });

  // ── Tests 7–9: snapshot gate ──────────────────────────────────────────────
  it("snapshot-gated route creates snapshot before HollowRunner.run() (test 7)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_test_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot
    });
    // Both snapshot_id and invocation must be present — snapshot ran first, then hollow ran
    expect(result.snapshot_id).not.toBeNull();
    expect(result.invocation).not.toBeNull();
    expect(result.status).toBe("executed");
  });

  it("snapshot-gated route returns snapshot_id in result (test 8)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_test_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot
    });
    expect(typeof result.snapshot_id).toBe("string");
    expect((result.snapshot_id ?? "").length).toBeGreaterThan(0);
  });

  it("snapshot-gated route returns approved_by null when no approval gate required (test 9)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_test_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot
    });
    // Approval gate was not required — approved_by must be null even though snapshot ran
    expect(result.approved_by).toBeNull();
    expect(result.snapshot_id).not.toBeNull();
  });

  // ── Tests 10–11: both gates ───────────────────────────────────────────────
  it("both-gated route refuses without approval and does not create snapshot (test 10)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_test_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot
      // No approved_by — approval preflight must fire before snapshot gate
    });
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "missing_approved_by")).toBe(true);
    // Approval preflight fired before snapshot gate — no snapshot created
    expect(result.snapshot_id).toBeNull();
    expect(result.invocation).toBeNull();
  });

  it("both-gated route executes when approval is supplied and snapshot succeeds (test 11)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_test_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test",
      snapshotRoot: tempSnapshotRoot
    });
    expect(result.status).toBe("executed");
    expect(result.snapshot_id).not.toBeNull();
    expect(result.approved_by).toBe("operator.test");
    expect(result.invocation).not.toBeNull();
  });

  // ── Tests 12–13: snapshot failure handling ────────────────────────────────
  it("snapshot error result refuses before HollowRunner.run() (test 12)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      _overrideSnapshotManager: mockErrorSnapshotManager as any
    });
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "snapshot_creation_failed")).toBe(true);
    expect(result.invocation).toBeNull();
  });

  it("snapshot thrown exception refuses before HollowRunner.run() (test 13)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      _overrideSnapshotManager: mockThrowSnapshotManager as any
    });
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "snapshot_creation_failed")).toBe(true);
    expect(result.invocation).toBeNull();
  });

  // ── Tests 14–16: failed gate produces no side effects ────────────────────
  it("failed gate does not call VRP (test 14)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, false, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("refused");
    expect(result.verification).toBeNull();
    expect(result.evidence_packet).toBeNull();
  });

  it("failed gate does not create Hollow invocation Ledger entry (test 15)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_gate_ledger_${Date.now()}.jsonl`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, false, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath
    });
    expect(result.status).toBe("refused");
    expect(result.ledger_entries).toHaveLength(0);
    expect(result.ledger_entries.some((e) => e.actor_type === "hollow")).toBe(false);
  });

  it("failed gate does not create VRP evidence Ledger entry (test 16)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_gate_ledger2_${Date.now()}.jsonl`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath
      // No approved_by — approval preflight fires, no ledger written
    });
    expect(result.status).toBe("refused");
    expect(result.ledger_entries).toHaveLength(0);
    expect(result.ledger_entries.some((e) => e.actor_type === "verified_return_path")).toBe(false);
  });

  // ── Test 17: snapshot entry prepended in successful ledger chain ──────────
  it("successful snapshot-gated ledger chain prepends snapshot entry when writeLedger true (test 17)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_snap_ledger_${Date.now()}.jsonl`);
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_root_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath,
      snapshotRoot: tempSnapshotRoot
    });

    expect(result.status).toBe("executed");
    // Four entries: snapshot + route + invocation + VRP
    expect(result.ledger_entries).toHaveLength(4);
    expect(result.ledger_entries[0]?.actor_type).toBe("change_guard");
    expect(result.ledger_entries[1]?.actor_type).toBe("orchestration_core");
    expect(result.ledger_entries[2]?.actor_type).toBe("hollow");
    expect(result.ledger_entries[3]?.actor_type).toBe("verified_return_path");
  });

  // ── Tests 18–19: ungated routes return null for gate fields ───────────────
  it("ungated route returns snapshot_id null and approved_by null (test 18)", async () => {
    const { frame, signals, decision, graph } = makePipeline();

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
    expect(result.snapshot_id).toBeNull();
    expect(result.approved_by).toBeNull();
    expect(result.status).toBe("executed");
  });

  it("ungated route accepts --approved-by but approved_by is null in result since gate did not fire (test 19)", async () => {
    const { frame, signals, decision, graph } = makePipeline();

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test"
    });
    // Gate did not fire — approved_by must be null in result
    expect(result.approved_by).toBeNull();
    expect(result.snapshot_id).toBeNull();
    expect(result.status).toBe("executed");
  });
});

// ─── dispatchHollow — V0.2.1 explicit file capture ───────────────────────────

describe("dispatchHollow — V0.2.1 explicit file capture", () => {
  // Test 1: file_capture mode activates with non-empty filesToCapture
  it("snapshot gate with filesToCapture executes and returns file_capture mode (test 1)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_v021_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot,
      filesToCapture: ["package.json"]
    });

    expect(result.status).toBe("executed");
    expect(result.snapshot_capture_mode).toBe("file_capture");
    expect(result.snapshot_id).not.toBeNull();
  });

  // Test 2: non-null snapshot_id with file capture
  it("snapshot gate with filesToCapture returns non-null snapshot_id (test 2)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_v021_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot,
      filesToCapture: ["package.json"]
    });

    expect(result.snapshot_id).not.toBeNull();
    expect(typeof result.snapshot_id).toBe("string");
  });

  // Test 3: snapshot_capture_mode is "file_capture"
  it("snapshot gate with filesToCapture returns snapshot_capture_mode 'file_capture' (test 3)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_v021_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot,
      filesToCapture: ["package.json"]
    });

    expect(result.snapshot_capture_mode).toBe("file_capture");
  });

  // Test 4: snapshot_files_captured = 1 for package.json (which exists)
  it("snapshot gate with filesToCapture package.json returns snapshot_files_captured 1 (test 4)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_v021_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot,
      filesToCapture: ["package.json"]
    });

    expect(result.snapshot_files_captured).toBe(1);
  });

  // Test 5: audit_marker mode when filesToCapture not provided
  it("snapshot gate without filesToCapture returns audit_marker mode and snapshot_files_captured 0 (test 5)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_v021_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot
    });

    expect(result.snapshot_capture_mode).toBe("audit_marker");
    expect(result.snapshot_files_captured).toBe(0);
  });

  // Test 6: requires_code_mutation without filesToCapture refuses with files_to_capture_required
  it("requires_code_mutation without filesToCapture refuses with files_to_capture_required (test 6)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_v021_${Date.now()}`);
    // Use makePipeline with requires_code_mutation override + makeGatedDecision (requires_snapshot_gate: true)
    const { frame, signals } = makePipeline({ requires_code_mutation: true });
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot
    });

    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "files_to_capture_required")).toBe(true);
    expect(result.snapshot_id).toBeNull();
    expect(result.invocation).toBeNull();
  });

  // Test 7: requires_code_mutation with filesToCapture executes with file_capture mode
  it("requires_code_mutation with filesToCapture executes and creates file_capture snapshot (test 7)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_v021_${Date.now()}`);
    const { frame, signals } = makePipeline({ requires_code_mutation: true });
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot,
      filesToCapture: ["package.json"]
    });

    expect(result.status).toBe("executed");
    expect(result.snapshot_capture_mode).toBe("file_capture");
    expect(result.snapshot_id).not.toBeNull();
    expect(result.invocation).not.toBeNull();
  });

  // Test 8: non-array value for filesToCapture is rejected (runtime guard)
  it("non-array filesToCapture value is rejected with invalid_files_to_capture (test 8)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      filesToCapture: "package.json" as unknown as readonly string[]
    });

    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "invalid_files_to_capture")).toBe(true);
    expect(result.snapshot_id).toBeNull();
  });

  // Test 9: plain-object filesToCapture is rejected (runtime guard)
  it("object-typed filesToCapture value is rejected with invalid_files_to_capture (test 9)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      filesToCapture: { "0": "package.json" } as unknown as readonly string[]
    });

    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "invalid_files_to_capture")).toBe(true);
  });

  // Test 10: non-string entry in filesToCapture is rejected
  it("non-string file entry is rejected with invalid_files_to_capture (test 10)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      filesToCapture: [123 as unknown as string]
    });

    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "invalid_files_to_capture")).toBe(true);
  });

  // Test 11: empty string file entry is rejected
  it("empty string file entry is rejected with invalid_files_to_capture (test 11)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      filesToCapture: [""]
    });

    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "invalid_files_to_capture")).toBe(true);
    expect(result.snapshot_id).toBeNull();
  });

  // Test 12: whitespace-only file entry is rejected
  it("whitespace-only file entry is rejected with invalid_files_to_capture (test 12)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      filesToCapture: ["   "]
    });

    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "invalid_files_to_capture")).toBe(true);
  });

  // Test 13: absolute path file entry is rejected
  it("absolute path file entry is rejected with invalid_files_to_capture (test 13)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const absolutePath = resolve("src/index.ts"); // absolute on any platform

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      filesToCapture: [absolutePath]
    });

    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "invalid_files_to_capture")).toBe(true);
  });

  // Test 14: missing listed file refuses through SnapshotManager strict mode
  it("missing listed file refuses through SnapshotManager strict mode with snapshot_creation_failed (test 14)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_snap_v021_${Date.now()}`);
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, false);

    const nonExistentFile = `non_existent_file_v021_test_${Date.now()}.ts`;

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      snapshotRoot: tempSnapshotRoot,
      filesToCapture: [nonExistentFile]
    });

    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "snapshot_creation_failed")).toBe(true);
    expect(result.invocation).toBeNull();
  });

  // Test 15: filesToCapture supplied on ungated route is safely ignored
  it("filesToCapture supplied on ungated route is safely ignored — no snapshot created (test 15)", async () => {
    const { frame, signals, decision, graph } = makePipeline();

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      filesToCapture: ["package.json"]
    });

    expect(result.status).toBe("executed");
    expect(result.snapshot_capture_mode).toBeNull();
    expect(result.snapshot_files_captured).toBeNull();
    expect(result.snapshot_id).toBeNull();
  });

  // Test 16: approval gate fires before file-capture check
  it("approval gate missing fires before file-capture check even with valid filesToCapture (test 16)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, true, true);

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      filesToCapture: ["package.json"]
      // No approved_by — approval preflight must fire first
    });

    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "missing_approved_by")).toBe(true);
    expect(result.snapshot_id).toBeNull();
    expect(result.snapshot_capture_mode).toBeNull();
  });

  // Test 17: ungated route returns null for all snapshot capture fields
  it("ungated hollow_only execution returns null for all snapshot capture fields (test 17)", async () => {
    const { frame, signals, decision, graph } = makePipeline();

    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);

    expect(result.status).toBe("executed");
    expect(result.snapshot_capture_mode).toBeNull();
    expect(result.snapshot_files_captured).toBeNull();
    expect(result.snapshot_id).toBeNull();
    expect(result.approved_by).toBeNull();
  });
});

// ─── route-decision dry-run unchanged (test 14) ───────────────────────────────

describe("route-decision dry-run behavior is unchanged (test 14)", () => {
  it("selectRoute still returns hollow_only for deterministic tasks without dispatching", () => {
    const raw = {
      task_id: "dry_run_task",
      run_id: "dry_run_run",
      trace_id: "dry_run_trace",
      task_type: "hollow_execution",
      description: "Dry run test",
      input_summary: "No dispatch",
      requested_by: "test",
      requires_code_mutation: false,
      signal_hints: { deterministic_only: 2, requires_judgment: 0 },
      created_at: "2026-01-01T00:00:00.000Z"
    };
    const validation = validateTaskFrameInput(raw);
    expect(validation.valid).toBe(true);
    if (!validation.valid) return;

    const signals = classifySignals(validation.frame);
    const decision = selectRoute(validation.frame, signals);

    expect(decision.route_mode).toBe("hollow_only");
    expect(decision.hard_overrides_applied.some((o) => o.override_id === "DETERMINISTIC_LOCK")).toBe(true);
  });

  it("selectRoute still returns recovery_guardrail for recovery tasks without dispatching", () => {
    const raw = {
      task_id: "dry_run_recovery",
      run_id: "dry_run_run_2",
      trace_id: "dry_run_trace_2",
      task_type: "recovery",
      description: "Dry run recovery",
      input_summary: "Recovery test",
      requested_by: "test",
      requires_code_mutation: false,
      signal_hints: {},
      created_at: "2026-01-01T00:00:00.000Z"
    };
    const validation = validateTaskFrameInput(raw);
    expect(validation.valid).toBe(true);
    if (!validation.valid) return;

    const signals = classifySignals(validation.frame);
    const decision = selectRoute(validation.frame, signals);

    expect(decision.route_mode).toBe("recovery_guardrail");
  });
});

// ─── catalog integrity (tests 15 & 16) ───────────────────────────────────────

describe("catalog integrity", () => {
  it("V1 Hollow catalog remains exactly 12 (test 15)", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
  });

  it("Hollowcut Hollow catalog remains exactly 9 (test 16)", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });

  it("no V1 hollow ID is also a Hollowcut hollow ID", () => {
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(HOLLOWCUT_HOLLOW_ID_SET.has(manifest.hollow_id)).toBe(false);
    }
  });
});

// ─── dispatchHollow — V0.3 execution hardening ───────────────────────────────

// Shared mock shapes used across V0.3 tests
const mockRejectingVRP = {
  verifyInvocation: (_inv: unknown) => ({
    decision: "rejected" as const,
    trust_tier: "T0" as const,
    verification_status: "unverified" as const,
    errors: [{ code: "failed_invocation" as const, message: "Mock: VRP rejection for test" }],
    warnings: [],
    can_model_consume: false,
    can_persist_as_truth: false,
    can_trigger_side_effect: false
  })
};

const mockThrowLedger = {
  appendMany: async (_entries: unknown): Promise<never> => {
    throw new Error("Mock: ledger write failed for test");
  }
};

describe("dispatchHollow — V0.3 execution hardening", () => {
  // ── V0.3 test 1: ledger_write_status skipped when writeLedger absent ─────────
  it("ledger_write_status is 'skipped' when writeLedger is not set (V0.3 test 1)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
    expect(result.ledger_write_status).toBe("skipped");
  });

  // ── V0.3 test 2: ledger_write_status skipped when writeLedger false ──────────
  it("ledger_write_status is 'skipped' when writeLedger is false (V0.3 test 2)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: false
    });
    expect(result.ledger_write_status).toBe("skipped");
  });

  // ── V0.3 test 3: ledger_write_status ok after successful write ───────────────
  it("ledger_write_status is 'ok' after successful ledger write (V0.3 test 3)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_v03_ledger_${Date.now()}.jsonl`);
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath
    });
    expect(result.ledger_write_status).toBe("ok");
  });

  // ── V0.3 test 4: ledger_write_status failed when ledger throws ───────────────
  it("ledger_write_status is 'failed' when ledger throws (V0.3 test 4)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: "/tmp/test.jsonl",
      _overrideLedger: mockThrowLedger
    });
    expect(result.ledger_write_status).toBe("failed");
  });

  // ── V0.3 test 5: execution result still populated when ledger fails ───────────
  it("invocation and verification are still populated when ledger write fails (V0.3 test 5)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: "/tmp/test.jsonl",
      _overrideLedger: mockThrowLedger
    });
    expect(result.invocation).not.toBeNull();
    expect(result.verification).not.toBeNull();
    expect(result.evidence_packet).not.toBeNull();
  });

  // ── V0.3 test 6: ledger_write_failed error code pushed when ledger throws ─────
  it("errors includes ledger_write_failed when ledger throws (V0.3 test 6)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: "/tmp/test.jsonl",
      _overrideLedger: mockThrowLedger
    });
    expect(result.errors.some((e) => e.code === "ledger_write_failed")).toBe(true);
  });

  // ── V0.3 test 7: warning string pushed when ledger fails ─────────────────────
  it("warnings includes ledger failure message when ledger throws (V0.3 test 7)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: "/tmp/test.jsonl",
      _overrideLedger: mockThrowLedger
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("Ledger write failed"))).toBe(true);
  });

  // ── V0.3 test 8: status is still 'executed' when ledger fails ────────────────
  it("status remains 'executed' when hollow succeeded but ledger write failed (V0.3 test 8)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: "/tmp/test.jsonl",
      _overrideLedger: mockThrowLedger
    });
    expect(result.status).toBe("executed");
  });

  // ── V0.3 test 9: ledger_entries empty when write failed ──────────────────────
  it("ledger_entries is empty when ledger write failed (V0.3 test 9)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: "/tmp/test.jsonl",
      _overrideLedger: mockThrowLedger
    });
    expect(result.ledger_entries).toHaveLength(0);
  });

  // ── V0.3 test 10: VRP injection — rejection produces vrp_rejected error ───────
  it("_overrideVRP rejection sets status 'failed' and vrp_rejected error code (V0.3 test 10)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      _overrideVRP: mockRejectingVRP
    });
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.code === "vrp_rejected")).toBe(true);
  });

  // ── V0.3 test 11: vrp_rejected not added when hollow_runner_failed ────────────
  it("hollow_runner_failed takes priority — vrp_rejected not in errors (V0.3 test 11)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, {
      hollow_id: CHAR_COUNT_HOLLOW_ID,
      hollow_input: { wrong_field: "no text here" }
    });
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.code === "hollow_runner_failed")).toBe(true);
    expect(result.errors.every((e) => e.code !== "vrp_rejected")).toBe(true);
  });

  // ── V0.3 test 12: hollow_runner_failed message includes invocation status ──────
  it("hollow_runner_failed error message includes invocation status (V0.3 test 12)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, {
      hollow_id: CHAR_COUNT_HOLLOW_ID,
      hollow_input: { wrong_field: "no text here" }
    });
    const err = result.errors.find((e) => e.code === "hollow_runner_failed");
    expect(err).toBeDefined();
    expect(err?.message).toMatch(/Status:/);
  });

  // ── V0.3 test 13: vrp_rejected message includes verification decision ─────────
  it("vrp_rejected error message includes verification decision (V0.3 test 13)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      _overrideVRP: mockRejectingVRP
    });
    const err = result.errors.find((e) => e.code === "vrp_rejected");
    expect(err).toBeDefined();
    expect(err?.message).toMatch(/Decision:/);
  });

  // ── V0.3 test 14: warnings is empty array on successful execution ─────────────
  it("warnings is an empty array on successful execution (V0.3 test 14)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
    expect(result.warnings).toEqual([]);
  });

  // ── V0.3 test 15: warnings is empty on refused result ────────────────────────
  it("warnings is an empty array on refused result (V0.3 test 15)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, false, true);
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("refused");
    expect(result.warnings).toEqual([]);
  });

  // ── V0.3 test 16: ledger_write_status skipped on refused result ──────────────
  it("ledger_write_status is 'skipped' on refused result (V0.3 test 16)", async () => {
    const { frame, signals } = makePipeline();
    const { decision, graph } = makeGatedDecision(frame, false, true);
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("refused");
    expect(result.ledger_write_status).toBe("skipped");
  });

  // ── V0.3 test 17: VRP injection invocation still populated ───────────────────
  it("invocation is populated even when _overrideVRP rejects (V0.3 test 17)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      _overrideVRP: mockRejectingVRP
    });
    expect(result.invocation).not.toBeNull();
    expect(result.invocation?.status).toBe("completed");
  });

  // ── V0.3 test 18: VRP injection evidence_packet null when VRP provides none ───
  it("evidence_packet is null when _overrideVRP returns no evidence_packet (V0.3 test 18)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      _overrideVRP: mockRejectingVRP
    });
    expect(result.evidence_packet).toBeNull();
  });

  // ── V0.3 test 19: VRP injection ledger write attempted (no evidence entry) ────
  it("VRP rejection with writeLedger writes route and invocation entries only (V0.3 test 19)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_v03_vrp_ledger_${Date.now()}.jsonl`);
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath,
      _overrideVRP: mockRejectingVRP
    });
    // No evidence_packet → only route + invocation = 2 entries
    expect(result.ledger_entries).toHaveLength(2);
    expect(result.ledger_entries.every((e) => e.actor_type !== "verified_return_path")).toBe(true);
  });

  // ── V0.3 test 20: both VRP rejection and ledger failure accumulate errors ─────
  it("VRP rejection and ledger failure both add error codes (V0.3 test 20)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: "/tmp/test.jsonl",
      _overrideVRP: mockRejectingVRP,
      _overrideLedger: mockThrowLedger
    });
    expect(result.errors.some((e) => e.code === "vrp_rejected")).toBe(true);
    expect(result.errors.some((e) => e.code === "ledger_write_failed")).toBe(true);
  });

  // ── V0.3 test 21: status 'failed' when VRP rejects even if ledger succeeds ────
  it("status is 'failed' when VRP rejects regardless of ledger outcome (V0.3 test 21)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_v03_fail_${Date.now()}.jsonl`);
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath,
      _overrideVRP: mockRejectingVRP
    });
    expect(result.status).toBe("failed");
    expect(result.ledger_write_status).toBe("ok");
  });

  // ── V0.3 test 22: errors is empty on clean executed result ───────────────────
  it("errors is an empty array on clean 'executed' result (V0.3 test 22)", async () => {
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("executed");
    expect(result.errors).toHaveLength(0);
  });

  // ── V0.3 test 23: ledger_write_status 'ok' does not add warnings ─────────────
  it("successful ledger write adds no warnings (V0.3 test 23)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_v03_ok_${Date.now()}.jsonl`);
    const { frame, signals, decision, graph } = makePipeline();
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath
    });
    expect(result.ledger_write_status).toBe("ok");
    expect(result.warnings).toHaveLength(0);
  });
});
