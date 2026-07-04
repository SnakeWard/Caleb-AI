import { describe, expect, it } from "vitest";

import {
  characterCountManifest,
  isV1SafeHollowManifest,
  validateHollowManifest
} from "../../src/hollows/index.js";
import type { HollowManifest } from "../../src/types/index.js";

describe("validateHollowManifest", () => {
  it("accepts a valid characterCountManifest", () => {
    const result = validateHollowManifest(characterCountManifest);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.manifest?.hollow_id).toBe("hollow.text.character_count");
  });

  it("rejects missing hollow_id", () => {
    const { hollow_id: _hollow_id, ...manifestWithoutId } = characterCountManifest;
    const result = validateHollowManifest(manifestWithoutId);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "hollow_id")).toBe(true);
  });

  it("rejects bare hollow_id values", () => {
    const result = validateHollowManifest({
      ...characterCountManifest,
      hollow_id: "character_count"
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "hollow_id")).toBe(true);
  });

  it("rejects invalid permission values", () => {
    const result = validateHollowManifest({
      ...characterCountManifest,
      permissions: ["telepathy"]
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "permissions")).toBe(true);
  });

  it("rejects network_access that is not boolean", () => {
    const result = validateHollowManifest({
      ...characterCountManifest,
      network_access: "false"
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "network_access")).toBe(true);
  });

  it("rejects non-SemVer hollow_version", () => {
    const result = validateHollowManifest({
      ...characterCountManifest,
      hollow_version: "one"
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "hollow_version")).toBe(true);
  });
});

describe("isV1SafeHollowManifest", () => {
  it("returns true for characterCountManifest", () => {
    expect(isV1SafeHollowManifest(characterCountManifest)).toBe(true);
  });

  it("returns false for a manifest with network permission", () => {
    const manifest = {
      ...characterCountManifest,
      permissions: ["network"],
      permissions_required: ["network"]
    } as unknown as HollowManifest;

    expect(isV1SafeHollowManifest(manifest)).toBe(false);
  });

  it("returns false for a manifest with shell_command permission", () => {
    const manifest = {
      ...characterCountManifest,
      permissions: ["shell_command"],
      permissions_required: ["shell_command"]
    } as unknown as HollowManifest;

    expect(isV1SafeHollowManifest(manifest)).toBe(false);
  });

  it("returns false for status quarantined", () => {
    const manifest = {
      ...characterCountManifest,
      status: "quarantined"
    } as HollowManifest;

    expect(isV1SafeHollowManifest(manifest)).toBe(false);
  });
});
