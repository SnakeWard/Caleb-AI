import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  createInMemoryArtifactStore,
  validateRuntimeStorageRecord
} from "../../src/storage/index.js";
import type {
  InMemoryArtifactStoreSnapshot,
  RuntimeStorageRecord
} from "../../src/storage/index.js";

function ref(ref_id: string, ref_kind: RuntimeStorageRecord["record_kind"] | "external" = "external") {
  return { ref_id, ref_kind, description: `${ref_id} description` };
}

function validEvidence(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    storage_record_id: "record_evidence_001",
    record_kind: "evidence_packet",
    schema_version: "0.1.0",
    task_id: "task_001",
    run_id: "run_001",
    created_at: "2026-07-02T18:40:00.000Z",
    source_kind: "verified_return_path",
    trust_tier: "T2",
    validation_status: "verified",
    ledger_refs: ["ledger_001"],
    input_refs: [],
    output_refs: [],
    artifact_refs: [ref("artifact_ref_001", "role_artifact")],
    notes: ["Verified deterministic Hollow evidence may reach T2 through VRP."],
    evidence_id: "evidence_001",
    evidence_source: "hollow.text.character_count",
    claim_keys: ["character_count"],
    units: "characters",
    verification_refs: [ref("verification_001")],
    can_be_used_for_final: true,
    ...overrides
  };
}

function validRoleArtifact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    storage_record_id: "record_role_artifact_001",
    record_kind: "role_artifact",
    schema_version: "0.1.0",
    task_id: "task_001",
    run_id: "run_002",
    created_at: "2026-07-02T18:41:00.000Z",
    source_kind: "role",
    trust_tier: "T1",
    validation_status: "schema_valid",
    ledger_refs: [],
    input_refs: [],
    output_refs: [],
    artifact_refs: [ref("artifact_ref_002", "role_artifact")],
    notes: ["Schema-valid role artifact may be T1 only."],
    role_id: "planner",
    role_version: "0.1.0",
    artifact_id: "artifact_ref_002",
    artifact_type: "plan",
    evidence_refs: [ref("record_evidence_001", "evidence_packet")],
    assumptions: ["Process-memory only."],
    contradictions: [],
    defects: [],
    open_questions: [],
    ...overrides
  };
}

function validExecutionContext(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    storage_record_id: "record_execution_context_001",
    record_kind: "execution_context",
    schema_version: "0.1.0",
    task_id: "task_002",
    run_id: "run_001",
    created_at: "2026-07-02T18:42:00.000Z",
    source_kind: "logic_engine",
    trust_tier: "T1",
    validation_status: "schema_valid",
    ledger_refs: [],
    input_refs: [],
    output_refs: [],
    artifact_refs: [],
    notes: ["Execution context record."],
    route_mode: "hollow_only",
    active_pass: "R10",
    active_role: "none",
    work_graph_ref: ref("work_graph_001", "work_graph_ref"),
    accepted_evidence_refs: [ref("record_evidence_001", "evidence_packet")],
    rejected_artifact_refs: [],
    contradiction_register_ref: null,
    defect_register_ref: null,
    snapshot_refs: [],
    final_output_ref: null,
    status: "open",
    ...overrides
  };
}

describe("InMemoryArtifactStore", () => {
  it("creates empty store", () => {
    const store = createInMemoryArtifactStore();

    expect(store.list()).toHaveLength(0);
    expect(store.stats().total_records).toBe(0);
  });

  it("inserts valid record", () => {
    const store = createInMemoryArtifactStore();
    const result = store.insert(validEvidence());

    expect(result.ok).toBe(true);
    expect(store.has("record_evidence_001")).toBe(true);
  });

  it("rejects invalid record", () => {
    const store = createInMemoryArtifactStore();
    const result = store.insert(validEvidence({ validation_status: "raw" }));

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "raw_above_t0_forbidden")).toBe(true);
  });

  it("rejects duplicate storage_record_id", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());

    const result = store.insert(validEvidence());

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("duplicate_storage_record_id");
  });

  it("get returns defensive copy", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());

    const first = store.get("record_evidence_001") as any;
    first.trust_tier = "T4";

    expect(store.get("record_evidence_001")?.trust_tier).toBe("T2");
  });

  it("list returns defensive copies", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());

    const listed = store.list() as any[];
    listed[0].validation_status = "raw";

    expect(store.list()[0]?.validation_status).toBe("verified");
  });

  it("query by task_id", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validExecutionContext());

    expect(store.query({ task_id: "task_001" })).toHaveLength(1);
  });

  it("query by run_id", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validRoleArtifact());

    expect(store.query({ run_id: "run_002" })).toHaveLength(1);
  });

  it("query by record_kind", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validRoleArtifact());

    expect(store.query({ record_kind: "role_artifact" })).toHaveLength(1);
  });

  it("query by source_kind", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validExecutionContext());

    expect(store.query({ source_kind: "logic_engine" })).toHaveLength(1);
  });

  it("query by trust_tier", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validRoleArtifact());

    expect(store.query({ trust_tier: "T2" })).toHaveLength(1);
  });

  it("query by validation_status", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validRoleArtifact());

    expect(store.query({ validation_status: "schema_valid" })).toHaveLength(1);
  });

  it("query by ledger_ref", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validRoleArtifact());

    expect(store.query({ ledger_ref: "ledger_001" })).toHaveLength(1);
  });

  it("query by artifact_ref", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validRoleArtifact());

    expect(store.query({ artifact_ref: "artifact_ref_002" })).toHaveLength(1);
  });

  it("replace validates replacement", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());

    const result = store.replace("record_evidence_001", validEvidence({ validation_status: "raw" }));

    expect(result.ok).toBe(false);
    expect(store.get("record_evidence_001")?.validation_status).toBe("verified");
  });

  it("replace rejects mismatched storage_record_id", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());

    const result = store.replace("record_evidence_001", validEvidence({ storage_record_id: "other_id" }));

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("mismatched_storage_record_id");
  });

  it("replace does not auto-promote trust", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validRoleArtifact());

    const result = store.replace("record_role_artifact_001", validRoleArtifact({ notes: ["updated"] }));

    expect(result.ok).toBe(true);
    expect(store.get("record_role_artifact_001")?.trust_tier).toBe("T1");
  });

  it("delete removes only memory record", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());

    expect(store.delete("record_evidence_001")).toMatchObject({ ok: true, deleted: true });
    expect(store.has("record_evidence_001")).toBe(false);
  });

  it("clear removes all memory records", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validRoleArtifact());

    store.clear();

    expect(store.list()).toHaveLength(0);
  });

  it("snapshot returns in-memory snapshot only", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());

    const snapshot = store.snapshot();

    expect(snapshot.snapshot_kind).toBe("in_memory_artifact_store_snapshot");
    expect(snapshot.records).toHaveLength(1);
  });

  it("restoreFromSnapshot restores valid records", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    const snapshot = store.snapshot();
    store.clear();

    const result = store.restoreFromSnapshot(snapshot);

    expect(result.ok).toBe(true);
    expect(store.has("record_evidence_001")).toBe(true);
  });

  it("restoreFromSnapshot rejects invalid records", () => {
    const store = createInMemoryArtifactStore();
    const snapshot: InMemoryArtifactStoreSnapshot = {
      snapshot_kind: "in_memory_artifact_store_snapshot",
      records: [validEvidence({ validation_status: "raw" }) as any],
      stats: store.stats()
    };

    const result = store.restoreFromSnapshot(snapshot);

    expect(result.ok).toBe(false);
    expect(store.list()).toHaveLength(0);
  });

  it("stats returns correct totals", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validRoleArtifact());

    const stats = store.stats();

    expect(stats.total_records).toBe(2);
    expect(stats.by_record_kind["evidence_packet"]).toBe(1);
    expect(stats.by_trust_tier["T1"]).toBe(1);
  });

  it("getByTask returns expected records", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validExecutionContext());

    expect(store.getByTask("task_001")).toHaveLength(1);
  });

  it("getByRun returns expected records", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence());
    store.insert(validRoleArtifact());

    expect(store.getByRun("run_001")).toHaveLength(1);
  });

  it("getEvidenceUsableForFinal excludes T0", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence({ trust_tier: "T0", validation_status: "verified", can_be_used_for_final: false }));
    store.insert(validEvidence({ storage_record_id: "record_evidence_002" }));

    expect(store.getEvidenceUsableForFinal("task_001", "run_001")).toHaveLength(1);
  });

  it("getEvidenceUsableForFinal excludes rejected/quarantined", () => {
    const store = createInMemoryArtifactStore();
    store.insert(validEvidence({ validation_status: "rejected", trust_tier: "T1", can_be_used_for_final: false }));
    store.insert(validEvidence({ storage_record_id: "record_evidence_002" }));

    expect(store.getEvidenceUsableForFinal("task_001", "run_001")).toHaveLength(1);
  });

  it("seed example inserts successfully", async () => {
    const seed = JSON.parse(await readFile("examples/storage/in-memory-artifact-store-seed.valid.json", "utf8")) as unknown[];
    const store = createInMemoryArtifactStore();

    for (const record of seed) {
      expect(validateRuntimeStorageRecord(record).ok).toBe(true);
      expect(store.insert(record).ok).toBe(true);
    }

    expect(store.stats().total_records).toBe(seed.length);
  });

  it("no filesystem write is performed by store API", async () => {
    const source = await readFile("src/storage/inMemoryArtifactStore.ts", "utf8");

    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });

  it("no ledger write is performed by store API", async () => {
    const source = await readFile("src/storage/inMemoryArtifactStore.ts", "utf8");

    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry/);
  });
});
