import type {
  MockSinglePassModelAdapter,
  MockSinglePassModelAdapterConfig,
  SinglePassModelRequest,
  SinglePassModelResponse
} from "./types/singlePassModelBoundaryTypes.js";

export function createMockSinglePassModelAdapter(
  config: MockSinglePassModelAdapterConfig = {}
): MockSinglePassModelAdapter {
  const adapter_id = config.adapter_id ?? "mock.single_pass.boundary";

  return {
    adapter_id,
    adapter_kind: "mock",
    generate(request: SinglePassModelRequest): SinglePassModelResponse {
      const outputText =
        config.fixed_output_text ??
        `Mock single_pass response for goal "${request.user_goal}" using prompt "${request.prompt}".`;

      return {
        schema_version: request.schema_version,
        task_id: request.task_id,
        run_id: request.run_id,
        request_id: request.request_id,
        response_id: config.response_id ?? `${request.request_id}.mock_response`,
        adapter_id,
        adapter_kind: "mock",
        output_text: outputText,
        output_claims: [
          "This is deterministic mocked model-shaped output.",
          "This output is not verified deterministic Hollow evidence."
        ],
        used_evidence_refs: request.evidence_refs,
        warnings: request.evidence_refs.length === 0 ? ["No evidence refs were supplied to the mock adapter."] : [],
        created_at: config.created_at ?? request.created_at,
        raw_trust_tier: "T0",
        validation_status: "raw"
      };
    }
  };
}
