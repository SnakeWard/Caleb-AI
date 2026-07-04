import {
  hollowcutProjectStateCheckImplementation,
  hollowcutProjectStateCheckManifest
} from "../hollowcut/projectStateCheckHollow.js";

import {
  hollowcutProjectTimelineCrossCheckImplementation,
  hollowcutProjectTimelineCrossCheckManifest
} from "../hollowcut/projectTimelineCrossCheckHollow.js";

import {
  hollowcutExportReadinessCheckImplementation,
  hollowcutExportReadinessCheckManifest
} from "../hollowcut/exportReadinessCheckHollow.js";

import {
  hollowcutExportPlanPreviewImplementation,
  hollowcutExportPlanPreviewManifest
} from "../hollowcut/exportPlanPreviewHollow.js";

import {
  timelineSchemaCheckImplementation,
  timelineSchemaCheckManifest,
  timelineDurationConsistencyImplementation,
  timelineDurationConsistencyManifest,
  timelineAssetReferenceCheckImplementation,
  timelineAssetReferenceCheckManifest,
  timelineTrackReferenceCheckImplementation,
  timelineTrackReferenceCheckManifest,
  timelineTemporalIntegrityCheckImplementation,
  timelineTemporalIntegrityCheckManifest
} from "./categories/timeline/index.js";

import { HollowRegistry } from "./registry.js";
import { HollowRunner } from "./runner.js";
import type { HollowImplementation, HollowRunnerOptions } from "./runnerTypes.js";
import type { HollowManifest } from "../types/index.js";

export const HOLLOWCUT_HOLLOW_MANIFESTS = [
  hollowcutProjectStateCheckManifest,
  hollowcutProjectTimelineCrossCheckManifest,
  hollowcutExportReadinessCheckManifest,
  hollowcutExportPlanPreviewManifest,
  timelineSchemaCheckManifest,
  timelineDurationConsistencyManifest,
  timelineAssetReferenceCheckManifest,
  timelineTrackReferenceCheckManifest,
  timelineTemporalIntegrityCheckManifest
] as const satisfies readonly HollowManifest[];

export const HOLLOWCUT_HOLLOW_IMPLEMENTATIONS: Readonly<Record<string, HollowImplementation>> = {
  [hollowcutProjectStateCheckManifest.hollow_id]: hollowcutProjectStateCheckImplementation,
  [hollowcutProjectTimelineCrossCheckManifest.hollow_id]: hollowcutProjectTimelineCrossCheckImplementation,
  [hollowcutExportReadinessCheckManifest.hollow_id]: hollowcutExportReadinessCheckImplementation,
  [hollowcutExportPlanPreviewManifest.hollow_id]: hollowcutExportPlanPreviewImplementation,
  [timelineSchemaCheckManifest.hollow_id]: timelineSchemaCheckImplementation,
  [timelineDurationConsistencyManifest.hollow_id]: timelineDurationConsistencyImplementation,
  [timelineAssetReferenceCheckManifest.hollow_id]: timelineAssetReferenceCheckImplementation,
  [timelineTrackReferenceCheckManifest.hollow_id]: timelineTrackReferenceCheckImplementation,
  [timelineTemporalIntegrityCheckManifest.hollow_id]: timelineTemporalIntegrityCheckImplementation
};

export function createHollowcutHollowRegistry(): HollowRegistry {
  return new HollowRegistry([...HOLLOWCUT_HOLLOW_MANIFESTS]);
}

export function createHollowcutHollowRunner(options?: HollowRunnerOptions): HollowRunner {
  return new HollowRunner(createHollowcutHollowRegistry(), HOLLOWCUT_HOLLOW_IMPLEMENTATIONS, options);
}

export function listHollowcutHollowIds(): string[] {
  return HOLLOWCUT_HOLLOW_MANIFESTS.map((manifest) => manifest.hollow_id).sort();
}

export function getHollowcutHollowManifest(hollow_id: string): HollowManifest {
  return createHollowcutHollowRegistry().get(hollow_id);
}
