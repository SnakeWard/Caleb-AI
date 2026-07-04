import type {
  TimelineItemTiming,
  TimelineOverlap,
  TimelineOverlapPolicy,
  TimelineTrackType
} from "./timelineValidationTypes.js";
import { isTimelineItemTimingValid } from "./timelineTimingHelpers.js";

export interface TimelineOverlapRange {
  readonly overlap_start_ms: number;
  readonly overlap_end_ms: number;
  readonly overlap_duration_ms: number;
}

export interface FindTimelineOverlapsOptions {
  readonly same_track_only?: boolean;
  readonly include_disabled?: boolean;
  readonly track_type_by_id?: Readonly<Record<string, TimelineTrackType>>;
  readonly policy_by_track_id?: Readonly<Record<string, TimelineOverlapPolicy>>;
  readonly default_track_type?: TimelineTrackType;
}

export function intervalsOverlap(firstStart: number, firstEnd: number, secondStart: number, secondEnd: number): boolean {
  return calculateOverlapRange(firstStart, firstEnd, secondStart, secondEnd) !== null;
}

export function calculateOverlapRange(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number
): TimelineOverlapRange | null {
  if (!isValidInterval(firstStart, firstEnd) || !isValidInterval(secondStart, secondEnd)) return null;

  const overlapStart = Math.max(firstStart, secondStart);
  const overlapEnd = Math.min(firstEnd, secondEnd);
  if (overlapStart >= overlapEnd) return null;

  return {
    overlap_start_ms: overlapStart,
    overlap_end_ms: overlapEnd,
    overlap_duration_ms: overlapEnd - overlapStart
  };
}

export function findTimelineOverlaps(
  items: readonly TimelineItemTiming[],
  options: FindTimelineOverlapsOptions = {}
): TimelineOverlap[] {
  const sameTrackOnly = options.same_track_only ?? true;
  const includeDisabled = options.include_disabled ?? false;
  const candidates = includeDisabled ? [...items] : items.filter(shouldCheckOverlapForItem);
  const overlaps: TimelineOverlap[] = [];

  for (let firstIndex = 0; firstIndex < candidates.length; firstIndex += 1) {
    const first = candidates[firstIndex];
    if (first === undefined) continue;

    for (let secondIndex = firstIndex + 1; secondIndex < candidates.length; secondIndex += 1) {
      const second = candidates[secondIndex];
      if (second === undefined) continue;
      if (sameTrackOnly && first.track_id !== second.track_id) continue;

      const overlapRange = calculateOverlapRange(first.start_ms, first.end_ms, second.start_ms, second.end_ms);
      if (overlapRange === null) continue;

      overlaps.push({
        first_item_id: first.item_id,
        second_item_id: second.item_id,
        track_id: first.track_id,
        ...overlapRange,
        policy: getOverlapPolicy(first, options)
      });
    }
  }

  return overlaps;
}

export function getDefaultOverlapPolicyForTrackType(trackType: TimelineTrackType): TimelineOverlapPolicy {
  if (trackType === "visual" || trackType === "caption") return "error";
  if (trackType === "narration" || trackType === "effect") return "warn";
  return "allow";
}

export function shouldCheckOverlapForItem(item: TimelineItemTiming): boolean {
  return item.enabled && isTimelineItemTimingValid(item);
}

function getOverlapPolicy(item: TimelineItemTiming, options: FindTimelineOverlapsOptions): TimelineOverlapPolicy {
  const explicitPolicy = options.policy_by_track_id?.[item.track_id];
  if (explicitPolicy !== undefined) return explicitPolicy;

  const trackType = options.track_type_by_id?.[item.track_id] ?? itemTypeToTrackType(item.item_type) ?? options.default_track_type ?? "visual";
  return getDefaultOverlapPolicyForTrackType(trackType);
}

function itemTypeToTrackType(itemType: TimelineItemTiming["item_type"]): TimelineTrackType | null {
  if (itemType === "unknown") return null;
  return itemType;
}

function isValidInterval(start: number, end: number): boolean {
  return Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start;
}
