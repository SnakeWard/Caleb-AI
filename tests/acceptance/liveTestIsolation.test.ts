import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

// Correction (d) from the M1 approval: the vitest exclusion of live tests is a
// load-bearing boundary. These assertions fail if a future config edit would
// silently allow live provider tests into default runs.
describe("live test isolation boundary", () => {
  it("vitest config excludes *.live.test.ts from default runs", async () => {
    const config = await readFile("vitest.config.ts", "utf8");
    expect(config).toContain('"**/*.live.test.ts"');
    expect(config).toMatch(/exclude:\s*\[\.\.\.configDefaults\.exclude/);
  });

  it("the live test scaffolds use the excluded naming convention", async () => {
    for (const path of [
      "tests/providers/anthropicLiveAdapter.live.test.ts",
      "tests/providers/grokLiveAdapter.live.test.ts"
    ]) {
      const scaffold = await readFile(path, "utf8");
      expect(scaffold.length).toBeGreaterThan(0);
      expect(scaffold).toContain("CALEB_LIVE_TEST");
    }
  });
});
