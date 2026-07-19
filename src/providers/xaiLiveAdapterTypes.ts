import type {
  LiveAdapterProviderNeutralLimits,
  LiveAdapterNormalizedOutputObserver,
  LiveAdapterRequest,
  LiveAdapterResult
} from "../modelBoundary/types/liveAdapterTypes.js";
import type { OneProviderAdapterLivePrerequisitesEvaluation } from "./livePrerequisitesTypes.js";

export interface GrokLiveAdapterConfig {
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly provider_id: "xai";
  readonly provider_kind: "xai_compatible";
  readonly model: string;
  readonly api_base_url: string;
  readonly max_response_bytes: number;
  readonly limits: LiveAdapterProviderNeutralLimits;
}

export const GROK_LIVE_ADAPTER_ID = "grok_live_adapter";

export const DEFAULT_GROK_LIVE_ADAPTER_CONFIG: GrokLiveAdapterConfig = {
  adapter_id: GROK_LIVE_ADAPTER_ID,
  adapter_version: "0.1.0",
  provider_id: "xai",
  provider_kind: "xai_compatible",
  model: "grok-3-mini",
  api_base_url: "https://api.x.ai",
  max_response_bytes: 1024 * 1024,
  limits: {
    timeout_ms: 30_000,
    max_output_tokens: 64,
    retry_count: 1,
    temperature_allowed: false,
    streaming_allowed: false
  }
};

export type GrokCredentialProvider = () => string | undefined;

export interface GrokLiveAdapterGateEvidence {
  readonly prerequisites_evaluation: OneProviderAdapterLivePrerequisitesEvaluation;
  readonly kill_switch_open: boolean;
  readonly network_permission_granted_by_caller: boolean;
  readonly approved_by: string | null;
}

export interface GrokLiveAdapterDeps {
  readonly credential_provider: GrokCredentialProvider | null;
  readonly normalized_output_observer?: LiveAdapterNormalizedOutputObserver;
  readonly fetch_impl?: typeof fetch;
  readonly now?: () => Date;
}

export interface GrokLiveInvocationArgs {
  readonly request: LiveAdapterRequest;
  readonly prompt_text: string;
}

export interface GrokLiveAdapterCapabilities {
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly provider_id: "xai";
  readonly provider_kind: "xai_compatible";
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

export interface GrokLiveAdapter {
  readonly capabilities: () => GrokLiveAdapterCapabilities;
  readonly invokeLive: (args: GrokLiveInvocationArgs) => Promise<LiveAdapterResult>;
}

export interface BuildGrokLiveAdapterRequestInput {
  readonly prompt_text: string;
  readonly config: GrokLiveAdapterConfig;
  readonly task_id?: string;
  readonly run_id?: string;
  readonly request_id?: string;
  readonly safety_profile_id?: string;
  readonly created_at?: string;
}
