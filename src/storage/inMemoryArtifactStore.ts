import {
  validateRuntimeStorageRecord
} from "./runtimeStorageContractValidator.js";
import type {
  EvidencePacketStorageRecord,
  RuntimeStorageRecord,
  RuntimeStorageRecordKind,
  RuntimeStorageSourceKind,
  RuntimeStorageTrustState,
  RuntimeStorageValidationIssue,
  RuntimeStorageValidationStatus
} from "./types/runtimeStorageTypes.js";

export interface InMemoryArtifactStoreQuery {
  readonly task_id?: string;
  readonly run_id?: string;
  readonly record_kind?: RuntimeStorageRecordKind | readonly RuntimeStorageRecordKind[];
  readonly source_kind?: RuntimeStorageSourceKind | readonly RuntimeStorageSourceKind[];
  readonly trust_tier?: RuntimeStorageTrustState | readonly RuntimeStorageTrustState[];
  readonly validation_status?: RuntimeStorageValidationStatus | readonly RuntimeStorageValidationStatus[];
  readonly created_after?: string;
  readonly created_before?: string;
  readonly ledger_ref?: string;
  readonly artifact_ref?: string;
}

export interface InMemoryArtifactStoreIssue extends RuntimeStorageValidationIssue {
  readonly severity: "error";
}

export interface InMemoryArtifactStoreInsertResult {
  readonly ok: boolean;
  readonly storage_record_id: string | null;
  readonly record_kind: RuntimeStorageRecordKind | null;
  readonly trust_tier: RuntimeStorageTrustState | null;
  readonly validation_status: RuntimeStorageValidationStatus | null;
  readonly issues: readonly InMemoryArtifactStoreIssue[];
}

export type InMemoryArtifactStoreReplaceResult = InMemoryArtifactStoreInsertResult;

export interface InMemoryArtifactStoreDeleteResult {
  readonly ok: boolean;
  readonly storage_record_id: string | null;
  readonly deleted: boolean;
  readonly issues: readonly InMemoryArtifactStoreIssue[];
}

export interface InMemoryArtifactStoreStats {
  readonly total_records: number;
  readonly by_record_kind: Readonly<Record<string, number>>;
  readonly by_trust_tier: Readonly<Record<string, number>>;
  readonly by_validation_status: Readonly<Record<string, number>>;
  readonly by_source_kind: Readonly<Record<string, number>>;
}

export interface InMemoryArtifactStoreSnapshot {
  readonly snapshot_kind: "in_memory_artifact_store_snapshot";
  readonly records: readonly RuntimeStorageRecord[];
  readonly stats: InMemoryArtifactStoreStats;
}

function cloneRecord<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toStoreIssues(issues: readonly RuntimeStorageValidationIssue[]): readonly InMemoryArtifactStoreIssue[] {
  return issues.map((issue) => ({ ...issue, severity: "error" as const }));
}

function issue(code: string, path: string, message: string): InMemoryArtifactStoreIssue {
  return { code, path, message, severity: "error" };
}

function failure(
  issues: readonly InMemoryArtifactStoreIssue[],
  record?: RuntimeStorageRecord
): InMemoryArtifactStoreInsertResult {
  return {
    ok: false,
    storage_record_id: record?.storage_record_id ?? null,
    record_kind: record?.record_kind ?? null,
    trust_tier: record?.trust_tier ?? null,
    validation_status: record?.validation_status ?? null,
    issues
  };
}

function success(record: RuntimeStorageRecord): InMemoryArtifactStoreInsertResult {
  return {
    ok: true,
    storage_record_id: record.storage_record_id,
    record_kind: record.record_kind,
    trust_tier: record.trust_tier,
    validation_status: record.validation_status,
    issues: []
  };
}

function asArray<T>(value: T | readonly T[] | undefined): readonly T[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return Array.isArray(value) ? value as readonly T[] : [value as T];
}

function matchesOne<T extends string>(actual: T, expected: T | readonly T[] | undefined): boolean {
  const values = asArray(expected);
  return values === undefined || values.includes(actual);
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

export class InMemoryArtifactStore {
  private readonly records = new Map<string, RuntimeStorageRecord>();

  insert(record: unknown): InMemoryArtifactStoreInsertResult {
    const validation = validateRuntimeStorageRecord(record);
    if (!validation.ok) {
      return failure(toStoreIssues(validation.errors));
    }

    const validRecord = record as RuntimeStorageRecord;
    if (this.records.has(validRecord.storage_record_id)) {
      return failure(
        [
          issue(
            "duplicate_storage_record_id",
            "storage_record_id",
            "Storage record already exists."
          )
        ],
        validRecord
      );
    }

    this.records.set(validRecord.storage_record_id, cloneRecord(validRecord));
    return success(validRecord);
  }

  get(storage_record_id: string): RuntimeStorageRecord | undefined {
    const record = this.records.get(storage_record_id);
    return record === undefined ? undefined : cloneRecord(record);
  }

  has(storage_record_id: string): boolean {
    return this.records.has(storage_record_id);
  }

  query(criteria: InMemoryArtifactStoreQuery = {}): readonly RuntimeStorageRecord[] {
    return this.list().filter((record) => this.matches(record, criteria));
  }

  list(): readonly RuntimeStorageRecord[] {
    return Array.from(this.records.values()).map((record) => cloneRecord(record));
  }

  replace(storage_record_id: string, nextRecord: unknown): InMemoryArtifactStoreReplaceResult {
    if (!this.records.has(storage_record_id)) {
      return failure([issue("storage_record_not_found", "storage_record_id", "Storage record does not exist.")]);
    }

    const validation = validateRuntimeStorageRecord(nextRecord);
    if (!validation.ok) {
      return failure(toStoreIssues(validation.errors));
    }

    const validRecord = nextRecord as RuntimeStorageRecord;
    if (validRecord.storage_record_id !== storage_record_id) {
      return failure(
        [
          issue(
            "mismatched_storage_record_id",
            "storage_record_id",
            "Replacement storage_record_id must match the target ID."
          )
        ],
        validRecord
      );
    }

    this.records.set(storage_record_id, cloneRecord(validRecord));
    return success(validRecord);
  }

  delete(storage_record_id: string): InMemoryArtifactStoreDeleteResult {
    const deleted = this.records.delete(storage_record_id);
    return {
      ok: deleted,
      storage_record_id,
      deleted,
      issues: deleted ? [] : [issue("storage_record_not_found", "storage_record_id", "Storage record does not exist.")]
    };
  }

  clear(): void {
    this.records.clear();
  }

  snapshot(): InMemoryArtifactStoreSnapshot {
    return {
      snapshot_kind: "in_memory_artifact_store_snapshot",
      records: this.list(),
      stats: this.stats()
    };
  }

  restoreFromSnapshot(snapshot: InMemoryArtifactStoreSnapshot): InMemoryArtifactStoreReplaceResult {
    const staged = new Map<string, RuntimeStorageRecord>();

    for (const record of snapshot.records) {
      const validation = validateRuntimeStorageRecord(record);
      if (!validation.ok) {
        return failure(toStoreIssues(validation.errors));
      }

      if (staged.has(record.storage_record_id)) {
        return failure(
          [
            issue(
              "duplicate_storage_record_id",
              "storage_record_id",
              "Snapshot contains duplicate storage_record_id."
            )
          ],
          record
        );
      }

      staged.set(record.storage_record_id, cloneRecord(record));
    }

    this.records.clear();
    for (const [id, record] of staged) {
      this.records.set(id, record);
    }

    return {
      ok: true,
      storage_record_id: null,
      record_kind: null,
      trust_tier: null,
      validation_status: null,
      issues: []
    };
  }

  stats(): InMemoryArtifactStoreStats {
    const by_record_kind: Record<string, number> = {};
    const by_trust_tier: Record<string, number> = {};
    const by_validation_status: Record<string, number> = {};
    const by_source_kind: Record<string, number> = {};

    for (const record of this.records.values()) {
      increment(by_record_kind, record.record_kind);
      increment(by_trust_tier, record.trust_tier);
      increment(by_validation_status, record.validation_status);
      increment(by_source_kind, record.source_kind);
    }

    return {
      total_records: this.records.size,
      by_record_kind,
      by_trust_tier,
      by_validation_status,
      by_source_kind
    };
  }

  getByTask(task_id: string): readonly RuntimeStorageRecord[] {
    return this.query({ task_id });
  }

  getByRun(run_id: string): readonly RuntimeStorageRecord[] {
    return this.query({ run_id });
  }

  getEvidenceUsableForFinal(task_id: string, run_id: string): readonly EvidencePacketStorageRecord[] {
    return this.query({ task_id, run_id, record_kind: "evidence_packet" })
      .filter((record): record is EvidencePacketStorageRecord => {
        return (
          record.record_kind === "evidence_packet" &&
          record.can_be_used_for_final === true &&
          record.trust_tier !== "T0" &&
          record.validation_status !== "rejected" &&
          record.validation_status !== "quarantined"
        );
      });
  }

  private matches(record: RuntimeStorageRecord, criteria: InMemoryArtifactStoreQuery): boolean {
    if (criteria.task_id !== undefined && record.task_id !== criteria.task_id) return false;
    if (criteria.run_id !== undefined && record.run_id !== criteria.run_id) return false;
    if (!matchesOne(record.record_kind, criteria.record_kind)) return false;
    if (!matchesOne(record.source_kind, criteria.source_kind)) return false;
    if (!matchesOne(record.trust_tier, criteria.trust_tier)) return false;
    if (!matchesOne(record.validation_status, criteria.validation_status)) return false;
    if (criteria.created_after !== undefined && record.created_at <= criteria.created_after) return false;
    if (criteria.created_before !== undefined && record.created_at >= criteria.created_before) return false;
    if (criteria.ledger_ref !== undefined && !record.ledger_refs.includes(criteria.ledger_ref)) return false;
    if (
      criteria.artifact_ref !== undefined &&
      !record.artifact_refs.some((ref) => ref.ref_id === criteria.artifact_ref)
    ) {
      return false;
    }

    return true;
  }
}

export function createInMemoryArtifactStore(): InMemoryArtifactStore {
  return new InMemoryArtifactStore();
}
