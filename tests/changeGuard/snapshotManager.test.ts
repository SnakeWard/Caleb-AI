import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { JsonlLedger } from "../../src/ledger/index.js";
import { SnapshotManager } from "../../src/changeGuard/index.js";

describe("SnapshotManager", () => {
  it("createPreChangeSnapshot captures an explicit file", async () => {
    const { root, manager } = await setup();
    await writeFile(join(root, "src.txt"), "before", "utf8");

    const result = await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["src.txt"] });

    expect(result.captured_files[0]?.relative_path).toBe("src.txt");
  });

  it("snapshot preserves relative path under files/", async () => {
    const { root, manager } = await setup();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "index.ts"), "before", "utf8");

    const result = await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["src/index.ts"] });

    expect(await readFile(join(result.snapshot_path, "files", "src", "index.ts"), "utf8")).toBe("before");
  });

  it("manifest.json is written", async () => {
    const { root, manager } = await setup();
    await writeFile(join(root, "a.txt"), "a", "utf8");

    const result = await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["a.txt"] });

    expect(JSON.parse(await readFile(join(result.snapshot_path, "manifest.json"), "utf8")).snapshot_id).toBe(result.snapshot_id);
  });

  it("notes.md is written when notes provided", async () => {
    const { root, manager } = await setup();
    await writeFile(join(root, "a.txt"), "a", "utf8");

    const result = await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["a.txt"], notes: "note" });

    expect(await readFile(join(result.snapshot_path, "notes.md"), "utf8")).toBe("note");
  });

  it("captured file hash is recorded", async () => {
    const { root, manager } = await setup();
    await writeFile(join(root, "a.txt"), "a", "utf8");

    const result = await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["a.txt"] });

    expect(result.manifest.files_captured[0]?.hash).toMatch(/^sha256:/);
  });

  it("listSnapshots returns created snapshot", async () => {
    const { root, manager } = await setup();
    await writeFile(join(root, "a.txt"), "a", "utf8");
    const result = await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["a.txt"] });

    expect((await manager.listSnapshots()).map((snapshot) => snapshot.snapshot_id)).toContain(result.snapshot_id);
  });

  it("readSnapshotManifest reads manifest", async () => {
    const { root, manager } = await setup();
    await writeFile(join(root, "a.txt"), "a", "utf8");
    const result = await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["a.txt"] });

    expect((await manager.readSnapshotManifest(result.snapshot_id)).snapshot_id).toBe(result.snapshot_id);
  });

  it("snapshot blocks file outside project root", async () => {
    const { manager } = await setup();

    const result = await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["../outside.txt"] });

    expect(result.warnings[0]).toContain("escapes");
  });

  it("snapshot skips or reports missing file according to non-strict mode", async () => {
    const { manager } = await setup();

    const result = await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["missing.txt"] });

    expect(result.warnings[0]).toContain("does not exist");
  });

  it("snapshot writes Ledger entry when JsonlLedger is provided", async () => {
    const { root, snapshotRoot, ledgerPath } = await setupPaths();
    await writeFile(join(root, "a.txt"), "a", "utf8");
    const ledger = new JsonlLedger(ledgerPath);
    const manager = new SnapshotManager({ projectRoot: root, snapshotRoot, ledger });

    await manager.createPreChangeSnapshot({ reason: "test", files_to_capture: ["a.txt"] });

    expect((await ledger.readAll())[0]?.actor_type).toBe("change_guard");
  });

  it("createPreChangeSnapshot creates unique IDs across two snapshots from the same SnapshotManager instance", async () => {
    const { root, manager } = await setup();
    await writeFile(join(root, "a.txt"), "a", "utf8");

    const first = await manager.createPreChangeSnapshot({ reason: "first", files_to_capture: ["a.txt"] });
    const second = await manager.createPreChangeSnapshot({ reason: "second", files_to_capture: ["a.txt"] });

    expect(first.snapshot_id).not.toBe(second.snapshot_id);
  });

  it("createPreChangeSnapshot creates unique IDs across two different SnapshotManager instances using the same snapshotRoot", async () => {
    const { root, snapshotRoot } = await setupPaths();
    await writeFile(join(root, "a.txt"), "a", "utf8");

    const first = await new SnapshotManager({ projectRoot: root, snapshotRoot }).createPreChangeSnapshot({
      reason: "first",
      files_to_capture: ["a.txt"]
    });
    const second = await new SnapshotManager({ projectRoot: root, snapshotRoot }).createPreChangeSnapshot({
      reason: "second",
      files_to_capture: ["a.txt"]
    });

    expect(first.snapshot_id).not.toBe(second.snapshot_id);
  });

  it("createPostChangeSnapshot does not collide with an existing pre_change snapshot", async () => {
    const { root, manager } = await setup();
    await writeFile(join(root, "a.txt"), "a", "utf8");

    const pre = await manager.createPreChangeSnapshot({ reason: "pre", files_to_capture: ["a.txt"] });
    const post = await manager.createPostChangeSnapshot({ reason: "post", files_to_capture: ["a.txt"] });

    expect(pre.snapshot_id).not.toBe(post.snapshot_id);
    expect(post.snapshot_id).toContain("post_change");
  });

  it("SnapshotManager does not overwrite an existing snapshot folder", async () => {
    const { root, snapshotRoot } = await setupPaths();
    await writeFile(join(root, "a.txt"), "a", "utf8");
    await mkdir(join(snapshotRoot, "snap_20260606T214501123Z_000001_pre_change"), { recursive: true });
    await writeFile(join(snapshotRoot, "snap_20260606T214501123Z_000001_pre_change", "sentinel.txt"), "keep", "utf8");

    const result = await new SnapshotManager({
      projectRoot: root,
      snapshotRoot,
      now: () => new Date("2026-06-06T21:45:01.123Z")
    }).createPreChangeSnapshot({ reason: "test", files_to_capture: ["a.txt"] });

    expect(result.snapshot_id).toBe("snap_20260606T214501123Z_000002_pre_change");
    expect(await readFile(join(snapshotRoot, "snap_20260606T214501123Z_000001_pre_change", "sentinel.txt"), "utf8")).toBe("keep");
  });

  it("SnapshotManager skips unrelated folders when allocating IDs", async () => {
    const { root, snapshotRoot } = await setupPaths();
    await writeFile(join(root, "a.txt"), "a", "utf8");
    await mkdir(join(snapshotRoot, "manual_notes"), { recursive: true });

    const result = await new SnapshotManager({
      projectRoot: root,
      snapshotRoot,
      now: () => new Date("2026-06-06T21:45:01.123Z")
    }).createPreChangeSnapshot({ reason: "test", files_to_capture: ["a.txt"] });

    expect(result.snapshot_id).toBe("snap_20260606T214501123Z_000001_pre_change");
  });

  it("Snapshot IDs include the snapshot type", async () => {
    const { root, manager } = await setup();
    await writeFile(join(root, "a.txt"), "a", "utf8");

    const result = await manager.createEmergencySnapshot({ reason: "test", files_to_capture: ["a.txt"] });

    expect(result.snapshot_id).toContain("emergency");
  });

  it("existing old-format snapshot IDs remain readable through readSnapshotManifest", async () => {
    const { snapshotRoot, manager } = await setup();
    const oldId = "snap_000001_pre_change";
    await writeManifest(snapshotRoot, createManifest(oldId, "pre_change"));

    expect((await manager.readSnapshotManifest(oldId)).snapshot_id).toBe(oldId);
  });

  it("listSnapshots returns both old-format and new-format snapshots when both exist", async () => {
    const { root, snapshotRoot, manager } = await setup();
    await writeFile(join(root, "a.txt"), "a", "utf8");
    await writeManifest(snapshotRoot, createManifest("snap_000001_pre_change", "pre_change"));

    const created = await manager.createPostChangeSnapshot({ reason: "test", files_to_capture: ["a.txt"] });
    const ids = (await manager.listSnapshots()).map((snapshot) => snapshot.snapshot_id);

    expect(ids).toContain("snap_000001_pre_change");
    expect(ids).toContain(created.snapshot_id);
  });
});

async function setup(): Promise<{ root: string; snapshotRoot: string; manager: SnapshotManager }> {
  const { root, snapshotRoot } = await setupPaths();
  return { root, snapshotRoot, manager: new SnapshotManager({ projectRoot: root, snapshotRoot }) };
}

async function setupPaths(): Promise<{ root: string; snapshotRoot: string; ledgerPath: string }> {
  const root = await mkdtemp(join(tmpdir(), "caleb-snapshot-test-"));
  const snapshotRoot = join(root, "snapshots");
  const ledgerPath = join(root, "ledger", "ledger.jsonl");
  return { root, snapshotRoot, ledgerPath };
}

async function writeManifest(snapshotRoot: string, manifest: ReturnType<typeof createManifest>): Promise<void> {
  const snapshotPath = join(snapshotRoot, manifest.snapshot_id);
  await mkdir(snapshotPath, { recursive: true });
  await writeFile(join(snapshotPath, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function createManifest(snapshot_id: string, snapshot_type: "pre_change" | "post_change" | "emergency" | "milestone") {
  return {
    snapshot_id,
    snapshot_type,
    schema_version: "1.0.0",
    run_id: "run_001",
    trace_id: "trace_001",
    requested_by: "Caleb AI",
    approved_by: null,
    started_at: "2026-06-06T00:00:00.000Z",
    completed_at: "2026-06-06T00:00:01.000Z",
    status: "completed",
    reason: "old snapshot",
    files_captured: [],
    artifact_hashes: [],
    provenance: {},
    ledger_refs: [],
    rollback_method: "restore_captured_files",
    rollback_steps: ["restore"]
  };
}
