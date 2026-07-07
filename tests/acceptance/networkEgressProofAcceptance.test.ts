import net from "node:net";
import tls from "node:tls";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { CREDENTIAL_ENV_DENYLIST } from "../setup/networkEgressBlock.js";

// H5-amended call-site pin: the complete allowlist of egress-capable source
// files. Any future adapter pass must amend this list in its own diff — that
// visibility is the mechanism (docs/protocols/PASS_PROTOCOL_H5_H6.md).
const EGRESS_CALL_SITE_ALLOWLIST: readonly string[] = [
  "src/providers/anthropicLiveAdapter.ts",
  "src/providers/xaiLiveAdapter.ts"
];

// Detector, not an egress path: the code-safety Hollow's network_call rule
// contains the literal pattern "fetch(" so it can FLAG fetch in scanned code.
const EXEMPT_DETECTOR_FILES: readonly string[] = [
  "src/hollows/categories/code/codeSafetyScanHollow.ts"
];

const EGRESS_IMPORT_PATTERN = /from\s+"node:(https?|net|tls)"|require\(\s*"node:(https?|net|tls)"\s*\)/;
const FETCH_USAGE_PATTERN = /\bfetch\s*\(|\?\?\s*fetch\b|=\s*fetch\b/;

interface EgressPinResult {
  readonly ok: boolean;
  readonly unexpected_call_sites: readonly string[];
  readonly stale_allowlist_entries: readonly string[];
}

function evaluateEgressCallSitePin(
  files: Readonly<Record<string, string>>,
  allowlist: readonly string[],
  exempt: readonly string[]
): EgressPinResult {
  const unexpected: string[] = [];
  for (const [path, source] of Object.entries(files)) {
    const capable = EGRESS_IMPORT_PATTERN.test(source) || FETCH_USAGE_PATTERN.test(source);
    if (capable && !allowlist.includes(path) && !exempt.includes(path)) {
      unexpected.push(path);
    }
  }
  const stale: string[] = [];
  for (const entry of allowlist) {
    const source = files[entry];
    if (source === undefined || !FETCH_USAGE_PATTERN.test(source)) {
      stale.push(entry);
    }
  }
  return {
    ok: unexpected.length === 0 && stale.length === 0,
    unexpected_call_sites: unexpected,
    stale_allowlist_entries: stale
  };
}

async function readSourceTree(): Promise<Record<string, string>> {
  const files = await listSourceFiles("src");
  const tree: Record<string, string> = {};
  for (const file of files) {
    if (!file.endsWith(".ts")) continue;
    tree[file.replaceAll("\\", "/")] = await readFile(file, "utf8");
  }
  return tree;
}

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

  it("denylist covers the protocol minimum, including future-proofed provider names", () => {
    for (const name of ["ANTHROPIC_API_KEY", "XAI_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"]) {
      expect(CREDENTIAL_ENV_DENYLIST).toContain(name);
    }
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

  it("CALL-SITE PIN: the real tree contains egress-capable code only in the allowlisted adapters", async () => {
    const tree = await readSourceTree();

    const pin = evaluateEgressCallSitePin(tree, EGRESS_CALL_SITE_ALLOWLIST, EXEMPT_DETECTOR_FILES);

    expect(pin.unexpected_call_sites).toEqual([]);
    expect(pin.stale_allowlist_entries).toEqual([]);
    expect(pin.ok).toBe(true);
  });

  it("DETECTOR: the pin fails when a synthetic third call site is present", async () => {
    const tree = await readSourceTree();
    const poisoned = {
      ...tree,
      "src/hollows/categories/text/sneakyEgressHollow.ts":
        'export async function leak(): Promise<void> { await fetch("https://example.com"); }'
    };

    const pin = evaluateEgressCallSitePin(poisoned, EGRESS_CALL_SITE_ALLOWLIST, EXEMPT_DETECTOR_FILES);

    expect(pin.ok).toBe(false);
    expect(pin.unexpected_call_sites).toEqual([
      "src/hollows/categories/text/sneakyEgressHollow.ts"
    ]);
  });

  it("DETECTOR: the pin fails when an allowlisted file no longer contains its call site (stale allowlist)", async () => {
    const tree = await readSourceTree();
    const gutted = {
      ...tree,
      "src/providers/anthropicLiveAdapter.ts": "export const adapterRemoved = true;"
    };

    const pin = evaluateEgressCallSitePin(gutted, EGRESS_CALL_SITE_ALLOWLIST, EXEMPT_DETECTOR_FILES);

    expect(pin.ok).toBe(false);
    expect(pin.stale_allowlist_entries).toEqual(["src/providers/anthropicLiveAdapter.ts"]);
  });

  it("keeps catalog invariants: V1 = 13, Hollowcut = 9", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
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
