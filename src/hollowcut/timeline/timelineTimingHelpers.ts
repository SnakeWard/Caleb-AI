import type { TimelineItemTiming, TimelineItemType } from "./timelineValidationTypes.js";

const TIMELINE_ITEM_TYPES = new Set<TimelineItemType>(["visual", "audio", "caption", "narration", "effect", "unknown"]);

export function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function calculateExpectedEndMs(startMs: number, durationMs: number): number | null {
  if (!isFiniteNonNegativeNumber(startMs) || !isFinitePositiveNumber(durationMs)) return null;
  return startMs + durationMs;
}

export function timelineEndMatchesDuration(
  startMs: number,
  durationMs: number,
  endMs: number,
  toleranceMs = 0
): boolean {
  const expectedEndMs = calculateExpectedEndMs(startMs, durationMs);
  if (expectedEndMs === null || !isFiniteNonNegativeNumber(endMs) || !isFiniteNonNegativeNumber(toleranceMs)) {
    return false;
  }
  return Math.abs(expectedEndMs - endMs) <= toleranceMs;
}

export function getMaxTimelineItemEndMs(items: readonly TimelineItemTiming[]): number | null {
  const validEnds = items.filter(isTimelineItemTimingValid).map((item) => item.end_ms);
  return validEnds.length === 0 ? null : Math.max(...validEnds);
}

export function getTimelineDurationMismatch(timelineDurationMs: number, maxItemEndMs: number | null): number | null {
  if (!isFiniteNonNegativeNumber(timelineDurationMs) || maxItemEndMs === null || !isFiniteNonNegativeNumber(maxItemEndMs)) {
    return null;
  }
  return timelineDurationMs - maxItemEndMs;
}

export function isTimelineItemTimingValid(item: TimelineItemTiming): boolean {
  return (
    isNonEmptyString(item.item_id) &&
    isNonEmptyString(item.track_id) &&
    TIMELINE_ITEM_TYPES.has(item.item_type) &&
    isFiniteNonNegativeNumber(item.start_ms) &&
    isFinitePositiveNumber(item.duration_ms) &&
    isFiniteNonNegativeNumber(item.end_ms) &&
    timelineEndMatchesDuration(item.start_ms, item.duration_ms, item.end_ms) &&
    typeof item.enabled === "boolean" &&
    Number.isInteger(item.layer) &&
    item.layer >= 0
  );
}

export function normalizeTimelineItemTiming(candidate: unknown): TimelineItemTiming | null {
  if (!isRecord(candidate)) return null;

  const item = {
    item_id: candidate.item_id,
    track_id: candidate.track_id,
    item_type: candidate.item_type,
    start_ms: candidate.start_ms,
    duration_ms: candidate.duration_ms,
    end_ms: candidate.end_ms,
    enabled: candidate.enabled,
    layer: candidate.layer
  };

  if (
    !isNonEmptyString(item.item_id) ||
    !isNonEmptyString(item.track_id) ||
    !isTimelineItemType(item.item_type) ||
    !isFiniteNonNegativeNumber(item.start_ms) ||
    !isFinitePositiveNumber(item.duration_ms) ||
    !isFiniteNonNegativeNumber(item.end_ms) ||
    typeof item.enabled !== "boolean" ||
    typeof item.layer !== "number" ||
    !Number.isInteger(item.layer)
  ) {
    return null;
  }

  const normalized: TimelineItemTiming = {
    item_id: item.item_id,
    track_id: item.track_id,
    item_type: item.item_type,
    start_ms: item.start_ms,
    duration_ms: item.duration_ms,
    end_ms: item.end_ms,
    enabled: item.enabled,
    layer: item.layer
  };

  return isTimelineItemTimingValid(normalized) ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTimelineItemType(value: unknown): value is TimelineItemType {
  return typeof value === "string" && TIMELINE_ITEM_TYPES.has(value as TimelineItemType);
}
