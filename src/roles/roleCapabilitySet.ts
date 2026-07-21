/**
 * Single-source role capability catalog (RA-X-3).
 *
 * Derived only from the role contract registry. The lineage decision-facing
 * verifier and the future RA-X-4 classifier MUST both read this module — never
 * hand-code a second capability list.
 */

import { listRoleContracts, type RegisteredRoleContract } from "./roleContractRegistry.js";
import type { RoleId } from "./types/roleArtifact.js";
import type { RoleClass, RoleExecutionAuthority } from "./types/roleClass.js";

/** Capability tokens roles may provide; decision records may require a subset. */
export type RoleCapability =
  | RoleClass
  | "hollow_request_only"
  | `artifact:${string}`;

export interface RoleCapabilityEntry {
  readonly role_id: RoleId;
  readonly role_class: RoleClass;
  readonly execution_authority: RoleExecutionAuthority;
  readonly capabilities: readonly RoleCapability[];
}

export interface RoleCapabilityCatalog {
  readonly by_role: ReadonlyMap<RoleId, RoleCapabilityEntry>;
  /** Union of all capabilities provided by at least one registered role. */
  readonly all_capabilities: ReadonlySet<RoleCapability>;
  readonly entries: readonly RoleCapabilityEntry[];
}

/**
 * Derive the capability catalog from the registry (or an injected snapshot for tests).
 * This is the sole authority for satisfiability and future classifier capability reads.
 */
export function getRoleCapabilityCatalog(
  contracts: readonly RegisteredRoleContract[] = listRoleContracts()
): RoleCapabilityCatalog {
  const byRole = new Map<RoleId, RoleCapabilityEntry>();
  const all = new Set<RoleCapability>();

  for (const entry of contracts) {
    const capabilities: RoleCapability[] = [
      entry.role_class,
      ...entry.contract.allowed_artifact_types.map(
        (artifactType) => `artifact:${artifactType}` as RoleCapability
      )
    ];
    if (entry.execution_authority === "request_only") {
      capabilities.push("hollow_request_only");
    }
    const unique = [...new Set(capabilities)];
    for (const capability of unique) {
      all.add(capability);
    }
    byRole.set(entry.contract.role_id, {
      role_id: entry.contract.role_id,
      role_class: entry.role_class,
      execution_authority: entry.execution_authority,
      capabilities: unique
    });
  }

  return {
    by_role: byRole,
    all_capabilities: all,
    entries: [...byRole.values()]
  };
}

export function catalogProvidesCapability(
  catalog: RoleCapabilityCatalog,
  capability: string
): boolean {
  return catalog.all_capabilities.has(capability as RoleCapability);
}
