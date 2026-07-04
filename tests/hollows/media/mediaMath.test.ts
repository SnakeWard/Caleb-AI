import { describe, expect, it } from "vitest";

import {
  calculateAspectRatioDecimal,
  calculateMegapixels,
  classifyAspectRatio,
  classifyOrientation,
  reduceAspectRatio
} from "../../../src/hollows/categories/media/index.js";

describe("media math", () => {
  it("calculates aspect ratio decimal", () => {
    expect(calculateAspectRatioDecimal(1920, 1080)).toBeCloseTo(16 / 9);
  });

  it("returns null for invalid dimensions", () => {
    expect(calculateAspectRatioDecimal(0, 1080)).toBeNull();
    expect(calculateAspectRatioDecimal(1920, Number.NaN)).toBeNull();
  });

  it("classifies landscape", () => {
    expect(classifyOrientation(1920, 1080)).toBe("landscape");
  });

  it("classifies portrait", () => {
    expect(classifyOrientation(1080, 1920)).toBe("portrait");
  });

  it("classifies square", () => {
    expect(classifyOrientation(1000, 1000)).toBe("square");
  });

  it("reduces 1920x1080 to 16:9", () => {
    expect(reduceAspectRatio(1920, 1080)).toBe("16:9");
  });

  it("classifies 16:9", () => {
    expect(classifyAspectRatio(1920, 1080)).toBe("16:9");
  });

  it("classifies 9:16", () => {
    expect(classifyAspectRatio(1080, 1920)).toBe("9:16");
  });

  it("classifies 1:1", () => {
    expect(classifyAspectRatio(1000, 1000)).toBe("1:1");
  });

  it("classifies 4:5", () => {
    expect(classifyAspectRatio(1080, 1350)).toBe("4:5");
  });

  it("classifies 21:9", () => {
    expect(classifyAspectRatio(2100, 900)).toBe("21:9");
  });

  it("classifies uncommon valid ratio as custom", () => {
    expect(classifyAspectRatio(1234, 777)).toBe("custom");
  });

  it("calculates megapixels", () => {
    expect(calculateMegapixels(1920, 1080)).toBeCloseTo(2.0736);
  });

  it("returns null megapixels for invalid dimensions", () => {
    expect(calculateMegapixels(-1, 1080)).toBeNull();
  });
});
