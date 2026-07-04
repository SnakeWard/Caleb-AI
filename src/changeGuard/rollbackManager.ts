import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import type { JsonlLedger } from "../ledger/ledger.js";
import type { LedgerEntry } from "../types/ledger.js";
import type { SnapshotManifest } from "../types/snapshot.js";
import { PathSafetyError, RollbackRestoreError } from "./changeGuardErrors.js";
import type { RollbackPreview, RollbackResult, RestoreSnapshotRequest } from "./changeGuardTypes.js";
import { hashFileSha256 } from "./fileHash.js";
import { assertValidSnapshotManifest } from "./snapshotManifest.js";

const DEFAULT_SNAPSHOT_ROOT = ".caleb/snapshots";
const BLOCKED_SEGMENTS = new Set(["node_modules", "dist", ".git", ".caleb"]);

export class RollbackManager {
  private readonly projectRoot: string;
  private readonly snapshotRoot: string;
  private readonly ledger: JsonlLedger | undefined;
  private readonly now: () => Date;

  constructor(options: {
    readonly projectRoot: string;
    readonly snapshotRoot?: string;
    readonly ledger?: JsonlLedger;
    readonly now?: () => Date;
  }) {
    this.projectRoot = resolve(options.projectRoot);
    this.snapshotRoot = resolve(this.projectRoot, options.snapshotRoot ?? DEFAULT_SNAPSHOT_ROOT);
    this.ledger = options.ledger;
    this.now = options.now ?? (() => new Date());
  }

  async previewRestore(snapshot_id: string): Promise<RollbackPreview> {
    const manifest = await this.readManifest(snapshot_id);
    const files = manifest.files_captured.map((file) => {
      const source = resolve(this.snapshotRoot, snapshot_id, "files", file.path);
      const target = resolve(this.projectRoot, file.path);
      this.ensureRestoreTarget(target);
      return { relative_path: file.path, source_path: source, target_path: target };
    });
    return { snapshot_id, files };
  }

  async restoreSnapshot(request: RestoreSnapshotRequest): Promise<RollbackResult> {
    const preview = await this.previewRestore(request.snapshot_id);
    const manifest = await this.readManifest(request.snapshot_id);
    const restored_files = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const file of preview.files) {
      try {
        await mkdir(dirname(file.target_path), { recursive: true });
        await copyFile(file.source_path, file.target_path);
        restored_files.push({
          relative_path: file.relative_path,
          target_path: file.target_path,
          hash: await hashFileSha256(file.target_path)
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Restore failed.";
        if (request.strict) throw new RollbackRestoreError(message);
        errors.push(message);
      }
    }

    let ledger_entry: LedgerEntry | undefined;
    if (this.ledger !== undefined) {
      const entry: LedgerEntry = {
        ledger_id: `ledger_rollback_${request.snapshot_id}`,
        schema_version: "1.0.0",
        timestamp: this.now().toISOString(),
        task_id: request.snapshot_id,
        run_id: manifest.run_id,
        trace_id: manifest.trace_id,
        actor_type: "change_guard",
        actor_id: "rollback_manager",
        actor_version: "1.0.0",
        activity: errors.length > 0 ? "rollback_attempted" : "rollback_completed",
        status: errors.length > 0 ? "failed" : "completed",
        result: { snapshot_id: request.snapshot_id, restored_count: restored_files.length },
        warnings: [],
        errors: errors.map((message, index) => ({
          error_id: `rollback_error_${index + 1}`,
          message,
          severity: "error",
          retryable: false
        })),
        artifact_hashes: restored_files.map((file) => ({
          path: file.relative_path,
          hash: file.hash,
          algorithm: "sha256"
        })),
        provenance: { snapshot_id: request.snapshot_id, requested_by: request.requested_by ?? "Caleb AI" },
        retryable: false,
        verification_status: "verified",
        trust_tier: "T2",
        parent_refs: manifest.ledger_refs,
        artifact_refs: restored_files.map((file) => file.relative_path)
      };
      try {
        ledger_entry = await this.ledger.append(entry);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ledger append failed.";
        if (request.strict) throw new RollbackRestoreError(message);
        errors.push(message);
      }
    }

    const result: RollbackResult = { snapshot_id: request.snapshot_id, restored_files, warnings, errors };
    return ledger_entry === undefined ? result : { ...result, ledger_entry };
  }

  private async readManifest(snapshot_id: string): Promise<SnapshotManifest> {
    const raw = await readFile(resolve(this.snapshotRoot, snapshot_id, "manifest.json"), "utf8");
    return assertValidSnapshotManifest(JSON.parse(raw));
  }

  private ensureRestoreTarget(target: string): void {
    const relativePath = relative(this.projectRoot, target).replaceAll("\\", "/");
    if (relativePath.startsWith("../") || relativePath === "..") {
      throw new PathSafetyError(`Refusing to restore outside project root: ${target}`);
    }
    const firstSegment = relativePath.split("/")[0];
    if (firstSegment !== undefined && BLOCKED_SEGMENTS.has(firstSegment)) {
      throw new PathSafetyError(`Refusing to restore blocked path: ${relativePath}`);
    }
  }
}

export function createRollbackManager(options: ConstructorParameters<typeof RollbackManager>[0]): RollbackManager {
  return new RollbackManager(options);
}
