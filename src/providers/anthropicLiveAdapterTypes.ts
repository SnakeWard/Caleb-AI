import type {
  LiveAdapterProviderNeutralLimits,
  LiveAdapterRequest,
  LiveAdapterResult
} from "../modelBoundary/types/liveAdapterTypes.js";
import type { OneProviderAdapterLivePrerequisitesEvaluation } from "./livePrerequisitesTypes.js";
import { GROK_LIVE_ADAPTER_ID } from "./xaiLiveAdapterTypes.js";

// M1 live-enabled adapter types. The R20 mock-compatible interface hard-codes
// performs_network_call: false by design; this module is the explicitly
// authorized live extension (docs/ONE_PROVIDER_ADAPTER_LIVE_IMPLEMENTATION.md).

export interface AnthropicLiveAdapterConfig {
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly provider_id: "anthropic";
  readonly provider_kind: "anthropic_compatible";
  readonly model: string;
  readonly api_base_url: string;
  readonly anthropic_version: string;
  readonly max_response_bytes: number;
  readonly limits: LiveAdapterProviderNeutralLimits;
}

export const ANTHROPIC_LIVE_ADAPTER_ID = "anthropic_live_adapter";

// Adapter/harness allowlist consumed by the live prerequisites gate. Additions
// require an explicit authorized pass.
export const ALLOWLISTED_LIVE_ADAPTER_IDS: readonly string[] = [
  ANTHROPIC_LIVE_ADAPTER_ID,
  GROK_LIVE_ADAPTER_ID
];
export const ALLOWLISTED_LIVE_HARNESS_IDS: readonly string[] = ["run_one_provider_adapter_live_cli"];

export const DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG: AnthropicLiveAdapterConfig = {
  adapter_id: ANTHROPIC_LIVE_ADAPTER_ID,
  adapter_version: "0.1.0",
  provider_id: "anthropic",
  provider_kind: "anthropic_compatible",
  // First-live-call model per the approved M-series roadmap (cheapest correct
  // choice); later passes may select other models via config, never hardcode.
  model: "claude-haiku-4-5",
  api_base_url: "https://api.anthropic.com",
  anthropic_version: "2023-06-01",
  max_response_bytes: 1024 * 1024,
  limits: {
    timeout_ms: 30_000,
    max_output_tokens: 64,
    retry_count: 1,
    temperature_allowed: false,
    streaming_allowed: false
  }
};

// The API key exists only as the return value of this function inside the
// adapter's call stack. It is never a field on any serializable object.
export type AnthropicCredentialProvider = () => string | undefined;

export interface AnthropicLiveAdapterGateEvidence {
  readonly prerequisites_evaluation: OneProviderAdapterLivePrerequisitesEvaluation;
  readonly kill_switch_open: boolean;
  readonly network_permission_granted_by_caller: boolean;
  readonly approved_by: string | null;
}

export interface AnthropicLiveAdapterDeps {
  readonly credential_provider: AnthropicCredentialProvider | null;
  readonly fetch_impl?: typeof fetch;
  readonly now?: () => Date;
}

export interface AnthropicLiveInvocationArgs {
  readonly request: LiveAdapterRequest;
  // Transient: sent to the provider over the wire, digest-verified against
  // request.prompt_ref.prompt_digest, never included in any returned record.
  readonly prompt_text: string;
}

export interface AnthropicLiveAdapterCapabilities {
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly provider_id: "anthropic";
  readonly provider_kind: "anthropic_compatible";
  readonly supports_live_network: true;
  readonly requires_api_key: true;
  readonly credential_auto_read: false;
  readonly imports_provider_sdk: false;
  readonly stores_raw_prompt: false;
  readonly stores_raw_output: false;
  readonly writes_ledger_directly: false;
  readonly network_gated_behind_prerequisites: true;
  readonly max_output_trust_tier: "T1";
}

export interface AnthropicLiveAdapter {
  readonly capabilities: () => AnthropicLiveAdapterCapabilities;
  readonly invokeLive: (args: AnthropicLiveInvocationArgs) => Promise<LiveAdapterResult>;
}

export interface BuildAnthropicLiveAdapterRequestInput {
  readonly prompt_text: string;
  readonly config: AnthropicLiveAdapterConfig;
  readonly task_id?: string;
  readonly run_id?: string;
  readonly request_id?: string;
  readonly safety_profile_id?: string;
  readonly created_at?: string;
}
