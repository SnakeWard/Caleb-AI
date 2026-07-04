import type { TimelineReferenceSets } from "./timelineValidationTypes.js";

export interface MissingTimelineAssetRef {
  readonly item_id: string;
  readonly missing_asset_id: string;
}

export interface MissingTimelineTrackRef {
  readonly item_id: string;
  readonly missing_track_id: string;
}

export interface TrackItemReferenceMismatch {
  readonly track_id: string;
  readonly missing_item_id: string;
}

export function createTimelineReferenceSets(input: {
  readonly assets?: readonly unknown[];
  readonly tracks?: readonly unknown[];
  readonly items?: readonly unknown[];
}): TimelineReferenceSets {
  return {
    asset_ids: new Set(collectAssetIds(input.assets ?? [])),
    track_ids: new Set(collectTrackIds(input.tracks ?? [])),
    item_ids: new Set(collectTimelineItemIds(input.items ?? []))
  };
}

export function findDuplicateIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates];
}

export function findMissingTimelineAssetRefs(
  items: readonly unknown[],
  assetIds: ReadonlySet<string> | readonly string[]
): MissingTimelineAssetRef[] {
  const knownAssetIds = toSet(assetIds);
  return items.flatMap((item) => {
    if (!isRecord(item) || !isNonEmptyString(item.item_id) || !isNonEmptyString(item.asset_id)) return [];
    return knownAssetIds.has(item.asset_id) ? [] : [{ item_id: item.item_id, missing_asset_id: item.asset_id }];
  });
}

export function findMissingTimelineTrackRefs(
  items: readonly unknown[],
  trackIds: ReadonlySet<string> | readonly string[]
): MissingTimelineTrackRef[] {
  const knownTrackIds = toSet(trackIds);
  return items.flatMap((item) => {
    if (!isRecord(item) || !isNonEmptyString(item.item_id) || !isNonEmptyString(item.track_id)) return [];
    return knownTrackIds.has(item.track_id) ? [] : [{ item_id: item.item_id, missing_track_id: item.track_id }];
  });
}

export function findTrackItemReferenceMismatches(
  tracks: readonly unknown[],
  itemIds: ReadonlySet<string> | readonly string[]
): TrackItemReferenceMismatch[] {
  const knownItemIds = toSet(itemIds);
  return tracks.flatMap((track) => {
    if (!isRecord(track) || !isNonEmptyString(track.track_id) || !Array.isArray(track.items)) return [];
    const trackId = track.track_id;
    return track.items.flatMap((itemId) => {
      if (!isNonEmptyString(itemId)) return [];
      return knownItemIds.has(itemId) ? [] : [{ track_id: trackId, missing_item_id: itemId }];
    });
  });
}

export function collectTimelineItemIds(items: readonly unknown[]): string[] {
  return collectIds(items, "item_id");
}

export function collectTrackIds(tracks: readonly unknown[]): string[] {
  return collectIds(tracks, "track_id");
}

export function collectAssetIds(assets: readonly unknown[]): string[] {
  return collectIds(assets, "asset_id");
}

function collectIds(values: readonly unknown[], field: string): string[] {
  return values.flatMap((value) => {
    if (!isRecord(value)) return [];
    const id = value[field];
    return isNonEmptyString(id) ? [id] : [];
  });
}

function toSet(ids: ReadonlySet<string> | readonly string[]): ReadonlySet<string> {
  return ids instanceof Set ? ids : new Set(ids);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
