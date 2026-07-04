import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import type { JsonlLedger } from "../ledger/ledger.js";
import type { LedgerEntry } from "../types/ledger.js";
import type { SnapshotManifest, SnapshotType } from "../types/snapshot.js";
import { PathSafetyError, SnapshotReadError, SnapshotWriteError } from "./changeGuardErrors.js";
import type { CapturedFileRecord, CreateSnapshotRequest, SnapshotResult } from "./changeGuardTypes.js";
import { hashFileSha256 } from "./fileHash.js";
import { assertValidSnapshotManifest, createSnapshotId } from "./snapshotManifest.js";

const DEFAULT_SNAPSHOT_ROOT = ".caleb/snapshots";
const BLOCKED_SEGMENTS = new Set(["node_modules", "dist", ".git", ".caleb"]);

export class SnapshotManager {
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

  async createPreChangeSnapshot(request: Omit<CreateSnapshotRequest, "snapshot_type">): Promise<SnapshotResult> {
    return this.createSnapshot({ ...request, snapshot_type: "pre_change" });
  }

  async createPostChangeSnapshot(request: Omit<CreateSnapshotRequest, "snapshot_type">): Promise<SnapshotResult> {
    return this.createSnapshot({ ...request, snapshot_type: "post_change" });
  }

  async createEmergencySnapshot(request: Omit<CreateSnapshotRequest, "snapshot_type">): Promise<SnapshotResult> {
    return this.createSnapshot({ ...request, snapshot_type: "emergency" });
  }

  async createMilestoneSnapshot(request: Omit<CreateSnapshotRequest, "snapshot_type">): Promise<SnapshotResult> {
    return this.createSnapshot({ ...request, snapshot_type: "milestone" });
  }

  async createSnapshot(request: CreateSnapshotRequest): Promise<SnapshotResult> {
    const snapshot_id = await this.allocateSnapshotId(request.snapshot_type);
    const snapshotPath = resolve(this.snapshotRoot, snapshot_id);
    const filesRoot = resolve(snapshotPath, "files");
    const warnings: string[] = [];
    const errors: string[] = [];
    const capturedFiles: CapturedFileRecord[] = [];
    const startedAt = this.now().toISOString();

    await mkdir(filesRoot, { recursive: true });

    for (const path of request.files_to_capture) {
      try {
        const safe = this.resolveProjectFile(path);
        const fileStat = await stat(safe.absolutePath).catch(() => undefined);
        if (fileStat === undefined) {
          const message = `File does not exist: ${safe.relativePath}`;
          if (request.strict) errors.push(message);
          else warnings.push(message);
          continue;
        }
        if (!fileStat.isFile()) {
          const message = `Snapshot capture only supports files: ${safe.relativePath}`;
          if (request.strict) errors.push(message);
          else warnings.push(message);
          continue;
        }

        const destination = resolve(filesRoot, safe.relativePath);
        this.ensureInside(filesRoot, destination);
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(safe.absolutePath, destination);
        const hash = await hashFileSha256(destination);
        capturedFiles.push({
          relative_path: safe.relativePath,
          source_path: safe.absolutePath,
          snapshot_path: destination,
          hash
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Snapshot capture failed.";
        if (request.strict) errors.push(message);
        else warnings.push(message);
      }
    }

    if (request.strict && errors.length > 0) {
      throw new SnapshotWriteError(errors.join("; "));
    }

    const manifest: SnapshotManifest = {
      snapshot_id,
      snapshot_type: request.snapshot_type,
      schema_version: "1.0.0",
      run_id: request.run_id ?? `run_${snapshot_id}`,
      trace_id: request.trace_id ?? `trace_${snapshot_id}`,
      requested_by: request.requested_by ?? "Caleb AI",
      approved_by: request.approved_by ?? null,
      started_at: startedAt,
      completed_at: this.now().toISOString(),
      status: errors.length > 0 ? "failed" : "completed",
      reason: request.reason,
      files_captured: capturedFiles.map((file) => ({ path: file.relative_path, hash: file.hash })),
      artifact_hashes: capturedFiles.map((file) => ({
        path: file.relative_path,
        hash: file.hash,
        algorithm: "sha256"
      })),
      provenance: {
        snapshot_path: snapshotPath,
        requested_change: request.requested_change ?? null
      },
      ledger_refs: [],
      rollback_method: "restore_captured_files",
      rollback_steps: ["Copy captured files from snapshot files/ into project root", "Run validation commands"]
    };
    assertValidSnapshotManifest(manifest);

    await writeFile(resolve(snapshotPath, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    if (request.notes !== undefined) {
      await writeFile(resolve(snapshotPath, "notes.md"), request.notes, "utf8");
    }

    let ledger_entry: LedgerEntry | undefined;
    if (this.ledger !== undefined) {
      const entry = this.createSnapshotLedgerEntry(manifest, `${request.snapshot_type}_snapshot_created`);
      try {
        ledger_entry = await this.ledger.append(entry);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ledger append failed.";
        if (request.strict) throw new SnapshotWriteError(message);
        errors.push(message);
      }
    }

    const result: SnapshotResult = {
      snapshot_id,
      snapshot_path: snapshotPath,
      manifest,
      captured_files: capturedFiles,
      warnings,
      errors
    };
    return ledger_entry === undefined ? result : { ...result, ledger_entry };
  }

  async readSnapshotManifest(snapshot_id: string): Promise<SnapshotManifest> {
    try {
      const raw = await readFile(resolve(this.snapshotRoot, snapshot_id, "manifest.json"), "utf8");
      return assertValidSnapshotManifest(JSON.parse(raw));
    } catch (error) {
      throw new SnapshotReadError(error instanceof Error ? error.message : "Failed to read snapshot manifest.");
    }
  }

  async listSnapshots(): Promise<SnapshotManifest[]> {
    const names = await readdir(this.snapshotRoot).catch(() => []);
    const manifests: SnapshotManifest[] = [];
    for (const name of names) {
      try {
        manifests.push(await this.readSnapshotManifest(name));
      } catch {
        // Ignore malformed folders in listing.
      }
    }
    return manifests.sort((a, b) => a.snapshot_id.localeCompare(b.snapshot_id));
  }

  private createSnapshotLedgerEntry(manifest: SnapshotManifest, activity: string): LedgerEntry {
    return {
      ledger_id: `ledger_${manifest.snapshot_id}`,
      schema_version: "1.0.0",
      timestamp: this.now().toISOString(),
      task_id: manifest.snapshot_id,
      run_id: manifest.run_id,
      trace_id: manifest.trace_id,
      actor_type: "change_guard",
      actor_id: "auto_snapshot_guard",
      actor_version: "1.0.0",
      activity,
      status: manifest.status,
      result: { snapshot_id: manifest.snapshot_id, snapshot_type: manifest.snapshot_type },
      warnings: [],
      errors: [],
      artifact_hashes: manifest.artifact_hashes,
      provenance: { ...manifest.provenance, snapshot_id: manifest.snapshot_id },
      retryable: false,
      verification_status: "verified",
      trust_tier: "T3",
      parent_refs: [],
      artifact_refs: manifest.artifact_hashes.map((artifact) => artifact.path ?? artifact.hash)
    };
  }

  private async allocateSnapshotId(snapshotType: SnapshotType): Promise<string> {
    await mkdir(this.snapshotRoot, { recursive: true });
    const existing = new Set(await readdir(this.snapshotRoot).catch(() => []));
    let sequence = this.nextSnapshotSequence(existing);

    while (true) {
      const snapshotId = createSnapshotId(snapshotType, sequence, this.now());
      if (!existing.has(snapshotId)) {
        try {
          await mkdir(resolve(this.snapshotRoot, snapshotId));
          return snapshotId;
        } catch (error) {
          if (isAlreadyExistsError(error)) {
            existing.add(snapshotId);
            sequence += 1;
            continue;
          }
          throw error;
        }
      }
      sequence += 1;
    }
  }

  private nextSnapshotSequence(existingSnapshotNames: ReadonlySet<string>): number {
    let highest = 0;
    for (const name of existingSnapshotNames) {
      const match = name.match(/^snap_(?:\d{8}T\d{9}Z_)?(\d{6})_(?:pre_change|post_change|emergency|milestone)$/);
      if (match?.[1] !== undefined) {
        highest = Math.max(highest, Number.parseInt(match[1], 10));
      }
    }
    return highest + 1;
  }

  private resolveProjectFile(path: string): { absolutePath: string; relativePath: string } {
    const absolutePath = resolve(this.projectRoot, path);
    this.ensureInside(this.projectRoot, absolutePath);
    const relativePath = relative(this.projectRoot, absolutePath).replaceAll("\\", "/");
    const firstSegment = relativePath.split("/")[0];
    if (firstSegment !== undefined && BLOCKED_SEGMENTS.has(firstSegment)) {
      throw new PathSafetyError(`Refusing to snapshot blocked path: ${relativePath}`);
    }
    return { absolutePath, relativePath };
  }

  private ensureInside(root: string, target: string): void {
    const rel = relative(resolve(root), resolve(target));
    if (rel.startsWith("..") || rel === "" || rel.includes(`..\\`) || rel.includes("../")) {
      if (rel === "") return;
      throw new PathSafetyError(`Path escapes allowed root: ${target}`);
    }
  }
}

function isAlreadyExistsError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
}

export function createSnapshotManager(options: ConstructorParameters<typeof SnapshotManager>[0]): SnapshotManager {
  return new SnapshotManager(options);
}
