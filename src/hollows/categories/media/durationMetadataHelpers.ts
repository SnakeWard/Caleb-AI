const MAX_DURATION_MS = 86_400_000;
const DURATION_TOLERANCE_MS = 1;

export type DurationConsistency = "consistent" | "mismatch" | "single_value" | "unavailable";
export type DurationSourceField = "duration_ms" | "duration_seconds" | "unavailable";

export interface NormalizedDurationMetadata {
  readonly valid: boolean;
  readonly duration_ms: number | null;
  readonly duration_seconds: number | null;
  readonly source_field: DurationSourceField;
  readonly duration_consistency: DurationConsistency;
  readonly warnings: string[];
}

export interface DurationMetadataInput {
  readonly duration_ms?: unknown;
  readonly duration_seconds?: unknown;
}

export function normalizeDurationMetadata(input: DurationMetadataInput | undefined): NormalizedDurationMetadata {
  if (input === undefined) {
    return createUnavailable(["duration_metadata_missing"]);
  }

  const warnings: string[] = [];
  const hasDurationMs = input.duration_ms !== undefined;
  const hasDurationSeconds = input.duration_seconds !== undefined;

  if (!hasDurationMs && !hasDurationSeconds) {
    return createUnavailable(["duration_metadata_missing"]);
  }

  const durationMsValid = !hasDurationMs || isValidDurationMs(input.duration_ms);
  const durationSecondsValid = !hasDurationSeconds || isValidDurationSeconds(input.duration_seconds);

  if (!durationMsValid || !durationSecondsValid) {
    return createUnavailable(["duration_metadata_invalid"]);
  }

  const durationFromMs = hasDurationMs ? (input.duration_ms as number) : null;
  const durationFromSeconds = hasDurationSeconds ? secondsToMilliseconds(input.duration_seconds as number) : null;
  const canonicalDurationMs = durationFromMs ?? durationFromSeconds;

  if (canonicalDurationMs === null) {
    return createUnavailable(["duration_metadata_missing"]);
  }

  if (canonicalDurationMs === 0) {
    warnings.push("zero_duration");
  }

  let durationConsistency: DurationConsistency = "single_value";
  if (durationFromMs !== null && durationFromSeconds !== null) {
    durationConsistency =
      Math.abs(durationFromMs - durationFromSeconds) <= DURATION_TOLERANCE_MS ? "consistent" : "mismatch";
    if (durationConsistency === "mismatch") {
      warnings.push("duration_metadata_mismatch");
    }
  }

  return {
    valid: true,
    duration_ms: canonicalDurationMs,
    duration_seconds: millisecondsToSeconds(canonicalDurationMs),
    source_field: durationFromMs !== null ? "duration_ms" : "duration_seconds",
    duration_consistency: durationConsistency,
    warnings
  };
}

export function millisecondsToSeconds(durationMs: number): number {
  return durationMs / 1000;
}

export function secondsToMilliseconds(durationSeconds: number): number {
  return durationSeconds * 1000;
}

export function isValidDurationMs(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MAX_DURATION_MS;
}

export function isValidDurationSeconds(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    secondsToMilliseconds(value) <= MAX_DURATION_MS
  );
}

function createUnavailable(warnings: string[]): NormalizedDurationMetadata {
  return {
    valid: false,
    duration_ms: null,
    duration_seconds: null,
    source_field: "unavailable",
    duration_consistency: "unavailable",
    warnings
  };
}
