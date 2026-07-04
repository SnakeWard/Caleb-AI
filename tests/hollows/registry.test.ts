import { describe, expect, it } from "vitest";

import {
  DuplicateHollowIdError,
  HollowManifestValidationError,
  HollowNotFoundError,
  HollowRegistry,
  characterCountManifest,
  fileHashManifest,
  jsonSchemaValidatorManifest,
  promptLimitManifest,
  v1ManifestFixtures
} from "../../src/hollows/index.js";
import type { HollowManifest } from "../../src/types/index.js";

describe("HollowRegistry", () => {
  it("starts empty", () => {
    const registry = new HollowRegistry();

    expect(registry.count()).toBe(0);
    expect(registry.list()).toEqual([]);
  });

  it("register stores a valid manifest", () => {
    const registry = new HollowRegistry();
    const registered = registry.register(characterCountManifest);

    expect(registered.hollow_id).toBe("hollow.text.character_count");
    expect(registry.count()).toBe(1);
  });

  it("has returns true for registered Hollow", () => {
    const registry = new HollowRegistry([characterCountManifest]);

    expect(registry.has("hollow.text.character_count")).toBe(true);
  });

  it("get returns registered manifest", () => {
    const registry = new HollowRegistry([characterCountManifest]);

    expect(registry.get("hollow.text.character_count").hollow_name).toBe(
      "Character Count Hollow"
    );
  });

  it("find returns undefined for missing Hollow", () => {
    const registry = new HollowRegistry();

    expect(registry.find("hollow.text.missing")).toBeUndefined();
  });

  it("get throws HollowNotFoundError for missing Hollow", () => {
    const registry = new HollowRegistry();

    expect(() => registry.get("hollow.text.missing")).toThrow(HollowNotFoundError);
  });

  it("register rejects duplicate hollow_id", () => {
    const registry = new HollowRegistry([characterCountManifest]);

    expect(() => registry.register(characterCountManifest)).toThrow(DuplicateHollowIdError);
  });

  it("register rejects invalid manifests", () => {
    const registry = new HollowRegistry();
    const invalidManifest = {
      ...characterCountManifest,
      hollow_id: "character_count"
    } as HollowManifest;

    expect(() => registry.register(invalidManifest)).toThrow(HollowManifestValidationError);
  });

  it("registerMany registers multiple valid manifests", () => {
    const registry = new HollowRegistry();
    const registered = registry.registerMany([
      characterCountManifest,
      promptLimitManifest,
      jsonSchemaValidatorManifest
    ]);

    expect(registered).toHaveLength(3);
    expect(registry.count()).toBe(3);
  });

  it("list returns all manifests", () => {
    const registry = new HollowRegistry(v1ManifestFixtures);

    expect(registry.list().map((manifest) => manifest.hollow_id)).toEqual([
      "hollow.text.character_count",
      "hollow.text.prompt_limit",
      "hollow.validation.json_schema_validator",
      "hollow.provenance.file_hash"
    ]);
  });

  it("listByCategory filters text Hollows", () => {
    const registry = new HollowRegistry(v1ManifestFixtures);

    expect(registry.listByCategory("text").map((manifest) => manifest.hollow_id)).toEqual([
      "hollow.text.character_count",
      "hollow.text.prompt_limit"
    ]);
  });

  it("listByStatus filters trusted and draft Hollows", () => {
    const registry = new HollowRegistry(v1ManifestFixtures);

    expect(registry.listByStatus("trusted").map((manifest) => manifest.hollow_id)).toEqual([
      "hollow.text.character_count"
    ]);
    expect(registry.listByStatus("draft")).toHaveLength(3);
  });

  it("listByPermission filters permissions", () => {
    const registry = new HollowRegistry(v1ManifestFixtures);

    expect(registry.listByPermission("read_only").map((manifest) => manifest.hollow_id)).toEqual([
      "hollow.validation.json_schema_validator",
      "hollow.provenance.file_hash"
    ]);
  });

  it("listV1Safe returns only V1-safe manifests", () => {
    const networkManifest = {
      ...fileHashManifest,
      hollow_id: "hollow.provenance.network_file_hash",
      permissions: ["network"],
      permissions_required: ["network"],
      network_access: false
    } as unknown as HollowManifest;
    const registry = new HollowRegistry(v1ManifestFixtures);
    registry.register(networkManifest);

    expect(registry.listV1Safe().map((manifest) => manifest.hollow_id)).toEqual([
      "hollow.text.character_count",
      "hollow.text.prompt_limit",
      "hollow.validation.json_schema_validator",
      "hollow.provenance.file_hash"
    ]);
  });

  it("clear empties registry", () => {
    const registry = new HollowRegistry(v1ManifestFixtures);

    registry.clear();

    expect(registry.count()).toBe(0);
    expect(registry.list()).toEqual([]);
  });

  it("list result cannot mutate internal registry state", () => {
    const registry = new HollowRegistry([characterCountManifest]);
    const listedForArrayMutation = registry.list();
    listedForArrayMutation.pop();

    const listedForObjectMutation = registry.list();
    Object.assign(listedForObjectMutation[0] as { hollow_name: string }, {
      hollow_name: "Mutated Hollow"
    });

    expect(registry.count()).toBe(1);
    expect(registry.get("hollow.text.character_count").hollow_name).toBe(
      "Character Count Hollow"
    );
  });

  it("snapshot returns copied manifests and stats", () => {
    const registry = new HollowRegistry(v1ManifestFixtures);
    const snapshot = registry.snapshot();

    expect(snapshot.stats.count).toBe(4);
    expect(snapshot.stats.v1_safe_count).toBe(4);
    expect(snapshot.manifests).toHaveLength(4);
  });
});
