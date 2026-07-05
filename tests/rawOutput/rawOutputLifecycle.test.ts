import { describe, expect, it } from "vitest";

import {
  createInMemoryRawOutputStore,
  ingestLiveCallShapedRawOutput
} from "../../src/rawOutput/index.js";

describe("raw output lifecycle", () => {
  it("moves live-call-shaped output from T0 raw to schema-valid T1 only", async () => {
    const store = createInMemoryRawOutputStore();
    const result = await ingestLiveCallShapedRawOutput(
      {
        output_text: "Acknowledged",
        provider_id: "anthropic_live_adapter",
        model_id: "claude-haiku-4-5"
      },
      store,
      { created_at: "2026-07-05T00:00:00.000Z" }
    );

    expect(result.ok).toBe(true);
    expect(result.raw_output_trust_tier).toBe("T0");
    expect(result.schema_valid_output_trust_tier).toBe("T1");
    expect(result.max_allowed_trust_tier).toBe("T1");
    expect(result.record?.max_allowed_trust_tier).toBe("T1");
  });

  it("rejects empty raw output without promotion", async () => {
    const store = createInMemoryRawOutputStore();
    const result = await ingestLiveCallShapedRawOutput(
      {
        output_text: "",
        provider_id: "provider",
        model_id: "model"
      },
      store,
      { created_at: "2026-07-05T00:00:00.000Z" }
    );

    expect(result.ok).toBe(false);
    expect(result.schema_valid_output_trust_tier).toBe("T0");
    expect(result.issues[0]?.code).toBe("empty_output_text");
  });
});
