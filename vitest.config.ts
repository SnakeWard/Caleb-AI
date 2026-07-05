import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Live provider tests never run in default suites (R28 live test plan).
    // Guarded by tests/acceptance/liveTestIsolation.test.ts.
    exclude: [...configDefaults.exclude, "**/*.live.test.ts"],
    // H5: default runs are behaviorally offline — fetch/socket/credential-read
    // traps. Guarded by tests/acceptance/networkEgressProofAcceptance.test.ts.
    setupFiles: ["tests/setup/networkEgressBlock.ts"]
  }
});
