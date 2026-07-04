import { describe, expect, it } from "vitest";

import {
  collectAssetIds,
  collectTimelineItemIds,
  collectTrackIds,
  createTimelineReferenceSets,
  findDuplicateIds,
  findMissingTimelineAssetRefs,
  findMissingTimelineTrackRefs,
  findTrackItemReferenceMismatches
} from "../../../src/hollowcut/timeline/index.js";

const assets = [{ asset_id: "asset_1" }, { asset_id: "asset_2" }];
const tracks = [{ track_id: "track_1", items: ["item_1", "item_missing"] }];
const items = [{ item_id: "item_1", asset_id: "asset_1", track_id: "track_1" }];

describe("timeline reference helpers", () => {
  it("collects asset IDs", () => {
    expect(collectAssetIds(assets)).toEqual(["asset_1", "asset_2"]);
  });

  it("collects track IDs", () => {
    expect(collectTrackIds(tracks)).toEqual(["track_1"]);
  });

  it("collects item IDs", () => {
    expect(collectTimelineItemIds(items)).toEqual(["item_1"]);
  });

  it("finds duplicate IDs", () => {
    expect(findDuplicateIds(["a", "b", "a", "b", "b"])).toEqual(["a", "b"]);
  });

  it("finds missing asset refs", () => {
    expect(findMissingTimelineAssetRefs([{ item_id: "item_1", asset_id: "missing" }], new Set(["asset_1"]))).toEqual([
      { item_id: "item_1", missing_asset_id: "missing" }
    ]);
  });

  it("finds missing track refs", () => {
    expect(findMissingTimelineTrackRefs([{ item_id: "item_1", track_id: "missing" }], ["track_1"])).toEqual([
      { item_id: "item_1", missing_track_id: "missing" }
    ]);
  });

  it("detects track item reference mismatch", () => {
    expect(findTrackItemReferenceMismatches(tracks, ["item_1"])).toEqual([
      { track_id: "track_1", missing_item_id: "item_missing" }
    ]);
  });

  it("creates reference sets", () => {
    const sets = createTimelineReferenceSets({ assets, tracks, items });

    expect(sets.asset_ids.has("asset_1")).toBe(true);
    expect(sets.track_ids.has("track_1")).toBe(true);
    expect(sets.item_ids.has("item_1")).toBe(true);
  });

  it("handles empty arrays", () => {
    const sets = createTimelineReferenceSets({});

    expect(sets.asset_ids.size).toBe(0);
    expect(findDuplicateIds([])).toEqual([]);
  });

  it("does not mutate inputs", () => {
    const original = JSON.stringify({ assets, tracks, items });

    createTimelineReferenceSets({ assets, tracks, items });
    findMissingTimelineAssetRefs(items, []);
    findTrackItemReferenceMismatches(tracks, []);

    expect(JSON.stringify({ assets, tracks, items })).toBe(original);
  });
});
