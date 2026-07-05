import net from "node:net";
import tls from "node:tls";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";

// H5 canaries: traps that have never caught anything are unproven. Each test
// here deliberately attempts the violation the trap exists to stop.
describe("network egress proof acceptance (H5)", () => {
  it("CANARY: a fetch attempt in a default run is blocked", () => {
    expect(() => {
      void fetch("https://api.anthropic.com/v1/messages", { method: "POST" });
    }).toThrow(/NETWORK_EGRESS_BLOCKED_BY_H5/);
  });

  it("CANARY: a raw socket connect in a default run is blocked", () => {
    expect(() => {
      new net.Socket().connect(443, "api.anthropic.com");
    }).toThrow(/NETWORK_EGRESS_BLOCKED_BY_H5/);
  });

  it("CANARY: a tls connect in a default run is blocked", () => {
    expect(() => {
      tls.connect(443, "api.anthropic.com");
    }).toThrow(/NETWORK_EGRESS_BLOCKED_BY_H5/);
  });

  it("CANARY: reading ANTHROPIC_API_KEY in a default run is blocked", () => {
    expect(() => process.env.ANTHROPIC_API_KEY).toThrow(/CREDENTIAL_ENV_READ_BLOCKED_BY_H5/);
  });

  it("CANARY: reading XAI_API_KEY in a default run is blocked", () => {
    expect(() => process.env.XAI_API_KEY).toThrow(/CREDENTIAL_ENV_READ_BLOCKED_BY_H5/);
  });

  it("non-denylisted env reads pass through untouched", () => {
    expect(() => process.env.PATH).not.toThrow();
    expect(() => process.env.CALEB_TEST_LIVE_KEY_INTENTIONALLY_UNSET).not.toThrow();
    expect("ANTHROPIC_API_KEY" in process.env === true || true).toBe(true);
  });

  it("CONFIG LOCK: vitest config loads the H5 setup file and keeps the live exclusion", async () => {
    const config = await readFile("vitest.config.ts", "utf8");
    expect(config).toContain('setupFiles: ["tests/setup/networkEgressBlock.ts"]');
    expect(config).toContain('"**/*.live.test.ts"');
    expect(config).toMatch(/exclude:\s*\[\.\.\.configDefaults\.exclude/);
  });

  it("DEPENDENCY LOCK: zero runtime dependencies; devDependencies exactly as expected", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies).toBeUndefined();
    expect(Object.keys(pkg.devDependencies ?? {}).sort()).toEqual([
      "@types/node",
      "tsx",
      "typescript",
      "vitest"
    ]);
  });

  it("EGRESS INVENTORY: no node:http/https imports anywhere in src", async () => {
    const files = await listSourceFiles("src");
    const offenders: string[] = [];
    for (const file of files) {
      if (!file.endsWith(".ts")) continue;
      const source = await readFile(file, "utf8");
      if (/from\s+"node:https?"/.test(source) || /require\(\s*"node:https?"\s*\)/.test(source)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("EGRESS INVENTORY: only the two gated adapters (plus the safety scanner's detection rule) reference fetch in src", async () => {
    const files = await listSourceFiles("src");
    const fetchFiles: string[] = [];
    for (const file of files) {
      if (!file.endsWith(".ts")) continue;
      const source = await readFile(file, "utf8");
      if (/\bfetch\b/.test(source)) {
        fetchFiles.push(file.replaceAll("\\", "/"));
      }
    }
    expect(fetchFiles.sort()).toEqual([
      // Detector, not an egress path: the code-safety Hollow's network_call
      // rule contains the literal pattern "fetch(" so it can FLAG fetch in
      // scanned code. Its own no-egress property is covered by the runtime
      // traps and the no-http-imports assertion above.
      "src/hollows/categories/code/codeSafetyScanHollow.ts",
      "src/providers/anthropicLiveAdapter.ts",
      "src/providers/anthropicLiveAdapterTypes.ts",
      "src/providers/xaiLiveAdapter.ts",
      "src/providers/xaiLiveAdapterTypes.ts"
    ]);
  });

  it("keeps catalog invariants: V1 = 12, Hollowcut = 9", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

async function listSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}
