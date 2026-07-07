import {
  characterCountImplementation,
  characterCountManifest,
  promptLimitImplementation,
  promptLimitManifest,
  repetitionScanImplementation,
  repetitionScanManifest,
  sectionBalanceImplementation,
  sectionBalanceManifest
} from "./categories/text/index.js";
import {
  jsonSchemaValidatorImplementation,
  jsonSchemaValidatorManifest,
  placeholderDetectorImplementation,
  placeholderDetectorManifest
} from "./categories/validation/index.js";
import {
  fileHashImplementation,
  fileHashManifest,
  ledgerProvenanceImplementation,
  ledgerProvenanceManifest
} from "./categories/provenance/index.js";
import {
  codeSafetyScanImplementation,
  codeSafetyScanManifest,
  exportSurfaceImplementation,
  exportSurfaceManifest,
  importSurfaceImplementation,
  importSurfaceManifest,
  lineCountImplementation,
  lineCountManifest
} from "./categories/code/index.js";
import {
  passComplianceCheckImplementation,
  passComplianceCheckManifest
} from "./audit/passComplianceCheck.js";
import { HollowRegistry } from "./registry.js";
import { HollowRunner } from "./runner.js";
import type { HollowImplementation, HollowRunnerOptions } from "./runnerTypes.js";
import type { HollowManifest } from "../types/index.js";

export const V1_HOLLOW_MANIFESTS = [
  characterCountManifest,
  promptLimitManifest,
  sectionBalanceManifest,
  repetitionScanManifest,
  jsonSchemaValidatorManifest,
  placeholderDetectorManifest,
  fileHashManifest,
  ledgerProvenanceManifest,
  lineCountManifest,
  importSurfaceManifest,
  exportSurfaceManifest,
  codeSafetyScanManifest,
  passComplianceCheckManifest
] as const satisfies readonly HollowManifest[];

export const V1_HOLLOW_IMPLEMENTATIONS: Readonly<Record<string, HollowImplementation>> = {
  [characterCountManifest.hollow_id]: characterCountImplementation,
  [promptLimitManifest.hollow_id]: promptLimitImplementation,
  [sectionBalanceManifest.hollow_id]: sectionBalanceImplementation,
  [repetitionScanManifest.hollow_id]: repetitionScanImplementation,
  [jsonSchemaValidatorManifest.hollow_id]: jsonSchemaValidatorImplementation,
  [placeholderDetectorManifest.hollow_id]: placeholderDetectorImplementation,
  [fileHashManifest.hollow_id]: fileHashImplementation,
  [ledgerProvenanceManifest.hollow_id]: ledgerProvenanceImplementation,
  [lineCountManifest.hollow_id]: lineCountImplementation,
  [importSurfaceManifest.hollow_id]: importSurfaceImplementation,
  [exportSurfaceManifest.hollow_id]: exportSurfaceImplementation,
  [codeSafetyScanManifest.hollow_id]: codeSafetyScanImplementation,
  [passComplianceCheckManifest.hollow_id]: passComplianceCheckImplementation
};

export function createV1HollowRegistry(): HollowRegistry {
  return new HollowRegistry([...V1_HOLLOW_MANIFESTS]);
}

export function createV1HollowRunner(options?: HollowRunnerOptions): HollowRunner {
  return new HollowRunner(createV1HollowRegistry(), V1_HOLLOW_IMPLEMENTATIONS, options);
}

export function listV1HollowIds(): string[] {
  return V1_HOLLOW_MANIFESTS.map((manifest) => manifest.hollow_id).sort();
}

export function getV1HollowManifest(hollow_id: string): HollowManifest {
  return createV1HollowRegistry().get(hollow_id);
}
