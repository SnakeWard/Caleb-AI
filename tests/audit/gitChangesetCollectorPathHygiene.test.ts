import { describe, expect, it } from "vitest";

import {
  getRepoPathNormalizationError,
  normalizeRepoPath
} from "../../src/audit/gitChangesetCollector.js";

describe("gitChangesetCollector path hygiene (TRUE-2)", () => {
  it("rejects true /root/vitest-metadata.json", () => {
    expect(getRepoPathNormalizationError("true /root/vitest-metadata.json")).toBe(
      "AUD2_INVALID_PATH_COMPONENT_WHITESPACE"
    );
    expect(normalizeRepoPath("true /root/vitest-metadata.json")).toBeNull();
  });

  it('rejects " docs/file.ts" leading whitespace component', () => {
    expect(getRepoPathNormalizationError(" docs/file.ts")).toBe(
      "AUD2_INVALID_PATH_COMPONENT_WHITESPACE"
    );
    expect(normalizeRepoPath(" docs/file.ts")).toBeNull();
  });

  it('rejects "docs /file.ts" trailing whitespace component', () => {
    expect(getRepoPathNormalizationError("docs /file.ts")).toBe(
      "AUD2_INVALID_PATH_COMPONENT_WHITESPACE"
    );
    expect(normalizeRepoPath("docs /file.ts")).toBeNull();
  });

  it('rejects "docs/file.ts " trailing whitespace on final component', () => {
    expect(getRepoPathNormalizationError("docs/file.ts ")).toBe(
      "AUD2_INVALID_PATH_COMPONENT_WHITESPACE"
    );
    expect(normalizeRepoPath("docs/file.ts ")).toBeNull();
  });

  it('allows "docs/my file.ts" interior spaces', () => {
    expect(getRepoPathNormalizationError("docs/my file.ts")).toBeNull();
    expect(normalizeRepoPath("docs/my file.ts")).toBe("docs/my file.ts");
  });

  it('allows "docs/sub dir/file.ts" interior spaces in components', () => {
    expect(getRepoPathNormalizationError("docs/sub dir/file.ts")).toBeNull();
    expect(normalizeRepoPath("docs/sub dir/file.ts")).toBe("docs/sub dir/file.ts");
  });

  it("preserves existing absolute and traversal rejection", () => {
    expect(getRepoPathNormalizationError("../escape.ts")).toBe("AUD2_INVALID_COLLECTED_PATH");
    expect(getRepoPathNormalizationError("./local.ts")).toBe("AUD2_INVALID_COLLECTED_PATH");
    expect(normalizeRepoPath("src/a.ts")).toBe("src/a.ts");
  });
});