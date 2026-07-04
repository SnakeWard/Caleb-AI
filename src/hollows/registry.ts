import type { HollowCategory, HollowManifest, HollowStatus } from "../types/hollow.js";
import type { SideEffectClass } from "../types/permissions.js";
import { assertValidHollowManifest, isV1SafeHollowManifest } from "./manifestValidation.js";
import {
  DuplicateHollowIdError,
  HollowManifestValidationError,
  HollowNotFoundError
} from "./registryErrors.js";

export interface HollowRegistryStats {
  readonly count: number;
  readonly v1_safe_count: number;
}

export interface HollowRegistrySnapshot {
  readonly manifests: readonly HollowManifest[];
  readonly stats: HollowRegistryStats;
}

export class HollowRegistry {
  private readonly manifests = new Map<string, HollowManifest>();

  constructor(initialManifests: readonly HollowManifest[] = []) {
    this.registerMany(initialManifests);
  }

  register(manifest: HollowManifest): HollowManifest {
    let validManifest: HollowManifest;

    try {
      validManifest = assertValidHollowManifest(manifest);
    } catch (error) {
      if (error instanceof HollowManifestValidationError) {
        throw error;
      }

      throw error;
    }

    if (this.manifests.has(validManifest.hollow_id)) {
      throw new DuplicateHollowIdError(validManifest.hollow_id);
    }

    const storedManifest = copyManifest(validManifest);
    this.manifests.set(storedManifest.hollow_id, storedManifest);
    return copyManifest(storedManifest);
  }

  registerMany(manifests: readonly HollowManifest[]): HollowManifest[] {
    return manifests.map((manifest) => this.register(manifest));
  }

  has(hollow_id: string): boolean {
    return this.manifests.has(hollow_id);
  }

  get(hollow_id: string): HollowManifest {
    const manifest = this.find(hollow_id);
    if (manifest === undefined) {
      throw new HollowNotFoundError(hollow_id);
    }

    return manifest;
  }

  find(hollow_id: string): HollowManifest | undefined {
    const manifest = this.manifests.get(hollow_id);
    return manifest === undefined ? undefined : copyManifest(manifest);
  }

  list(): HollowManifest[] {
    return Array.from(this.manifests.values(), copyManifest);
  }

  listByCategory(category: HollowCategory): HollowManifest[] {
    return this.list().filter((manifest) => manifest.category === category);
  }

  listByStatus(status: HollowStatus): HollowManifest[] {
    return this.list().filter((manifest) => manifest.status === status);
  }

  listByPermission(permission: SideEffectClass): HollowManifest[] {
    return this.list().filter((manifest) => manifest.permissions.includes(permission));
  }

  listV1Safe(): HollowManifest[] {
    return this.list().filter(isV1SafeHollowManifest);
  }

  count(): number {
    return this.manifests.size;
  }

  clear(): void {
    this.manifests.clear();
  }

  snapshot(): HollowRegistrySnapshot {
    const manifests = this.list();
    return {
      manifests,
      stats: {
        count: manifests.length,
        v1_safe_count: manifests.filter(isV1SafeHollowManifest).length
      }
    };
  }

  toJSON(): HollowRegistrySnapshot {
    return this.snapshot();
  }
}

export function createHollowRegistry(initialManifests: readonly HollowManifest[] = []): HollowRegistry {
  return new HollowRegistry(initialManifests);
}

function copyManifest(manifest: HollowManifest): HollowManifest {
  return {
    ...manifest,
    permissions: [...manifest.permissions],
    permissions_required: [...manifest.permissions_required],
    checks: [...manifest.checks]
  };
}
