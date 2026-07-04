import type { MediaAspectRatioLabel, MediaOrientation } from "./mediaMetadataTypes.js";

const COMMON_RATIOS: Array<{ label: Exclude<MediaAspectRatioLabel, "custom" | "unknown">; value: number }> = [
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "21:9", value: 21 / 9 }
];

const RATIO_TOLERANCE = 0.015;

function isPositiveFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }

  return x;
}

export function calculateAspectRatioDecimal(width: number, height: number): number | null {
  if (!isPositiveFiniteNumber(width) || !isPositiveFiniteNumber(height)) {
    return null;
  }

  return width / height;
}

export function classifyOrientation(width: number, height: number): MediaOrientation {
  if (!isPositiveFiniteNumber(width) || !isPositiveFiniteNumber(height)) {
    return "unknown";
  }

  if (width === height) {
    return "square";
  }

  return width > height ? "landscape" : "portrait";
}

export function reduceAspectRatio(width: number, height: number): string | null {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    !isPositiveFiniteNumber(width) ||
    !isPositiveFiniteNumber(height)
  ) {
    return null;
  }

  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

export function classifyAspectRatio(width: number, height: number): MediaAspectRatioLabel {
  const ratio = calculateAspectRatioDecimal(width, height);
  if (ratio === null) {
    return "unknown";
  }

  for (const commonRatio of COMMON_RATIOS) {
    if (Math.abs(ratio - commonRatio.value) <= RATIO_TOLERANCE) {
      return commonRatio.label;
    }
  }

  return "custom";
}

export function calculateMegapixels(width: number, height: number): number | null {
  if (!isPositiveFiniteNumber(width) || !isPositiveFiniteNumber(height)) {
    return null;
  }

  return (width * height) / 1_000_000;
}
