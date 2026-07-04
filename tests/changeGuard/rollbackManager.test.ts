import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { JsonlLedger } from "../../src/ledger/index.js";
import { RollbackManager, SnapshotManager } from "../../src/changeGuard/index.js";

describe("RollbackManager", () => {
  it("previewRestore lists files without writing", async () => {
    const ctx = await createSnapshotContext();
    await writeFile(join(ctx.root, "a.txt"), "changed", "utf8");

    const preview = await ctx.rollback.previewRestore(ctx.snapshot_id);

    expect(preview.files[0]?.relative_path).toBe("a.txt");
    expect(await readFile(join(ctx.root, "a.txt"), "utf8")).toBe("changed");
  });

  it("restoreSnapshot restores a changed file from snapshot", async () => {
    const ctx = await createSnapshotContext();
    await writeFile(join(ctx.root, "a.txt"), "changed", "utf8");

    await ctx.rollback.restoreSnapshot({ snapshot_id: ctx.snapshot_id });

    expect(await readFile(join(ctx.root, "a.txt"), "utf8")).toBe("before");
  });

  it("restored file hash matches captured snapshot hash", async () => {
    const ctx = await createSnapshotContext();
    await writeFile(join(ctx.root, "a.txt"), "changed", "utf8");

    const result = await ctx.rollback.restoreSnapshot({ snapshot_id: ctx.snapshot_id });

    expect(result.restored_files[0]?.hash).toBe(ctx.hash);
  });

  it("restoreSnapshot blocks unsafe restore path", async () => {
    const ctx = await createSnapshotContext();
    const manifestPath = join(ctx.snapshotRoot, ctx.snapshot_id, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.files_captured = [{ path: ".git/config", hash: "sha256:unsafe" }];
    await mkdir(join(ctx.snapshotRoot, ctx.snapshot_id, "files", ".git"), { recursive: true });
    await writeFile(join(ctx.snapshotRoot, ctx.snapshot_id, "files", ".git", "config"), "unsafe", "utf8");
    await writeFile(manifestPath, JSON.stringify(manifest), "utf8");

    await expect(ctx.rollback.previewRestore(ctx.snapshot_id)).rejects.toThrow();
  });

  it("restoreSnapshot writes Ledger entry when JsonlLedger is provided", async () => {
    const ctx = await createSnapshotContext();
    const ledger = new JsonlLedger(join(ctx.root, "ledger", "ledger.jsonl"));
    const rollback = new RollbackManager({ projectRoot: ctx.root, snapshotRoot: ctx.snapshotRoot, ledger });

    await rollback.restoreSnapshot({ snapshot_id: ctx.snapshot_id });

    expect((await ledger.readAll())[0]?.activity).toBe("rollback_completed");
  });

  it("restoreSnapshot does not delete new files created after snapshot", async () => {
    const ctx = await createSnapshotContext();
    await writeFile(join(ctx.root, "new.txt"), "new", "utf8");

    await ctx.rollback.restoreSnapshot({ snapshot_id: ctx.snapshot_id });

    expect(await readFile(join(ctx.root, "new.txt"), "utf8")).toBe("new");
  });
});

async function createSnapshotContext(paths = ["a.txt"]): Promise<{
  root: string;
  snapshotRoot: string;
  rollback: RollbackManager;
  snapshot_id: string;
  hash: string;
}> {
  const root = await mkdtemp(join(tmpdir(), "caleb-rollback-test-"));
  const snapshotRoot = join(root, "snapshots");
  for (const path of paths) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), "before", "utf8");
  }
  const snapshot = await new SnapshotManager({ projectRoot: root, snapshotRoot }).createPreChangeSnapshot({
    reason: "test",
    files_to_capture: paths
  });
  return {
    root,
    snapshotRoot,
    rollback: new RollbackManager({ projectRoot: root, snapshotRoot }),
    snapshot_id: snapshot.snapshot_id,
    hash: snapshot.captured_files[0]?.hash ?? ""
  };
}
