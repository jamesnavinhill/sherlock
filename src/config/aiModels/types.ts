export type AIProvider = 'GEMINI' | 'OPENROUTER' | 'OPENAI' | 'ANTHROPIC';
export type ProviderRuntimeStatus = 'ACTIVE' | 'PLANNED';
export type ModelCatalogSource =
  | 'STATIC'
  | 'OPENROUTER_SNAPSHOT'
  | 'OPENROUTER_CACHE'
  | 'OPENROUTER_LIVE'
  | 'MANUAL';
export type OpenRouterSearchEngine = 'auto' | 'native' | 'exa' | 'firecrawl' | 'parallel';

export interface ProviderCapabilities {
  supportsThinkingBudget: boolean;
  supportsTts: boolean;
  supportsWebSearch: boolean;
  supportsDynamicCatalog?: boolean;
  runtimeStatus: ProviderRuntimeStatus;
}

export interface AIProviderOption {
  id: AIProvider;
  label: string;
  description: string;
  defaultModelId: string;
  capabilities: ProviderCapabilities;
}

export interface ModelCapabilities {
  supportsThinkingBudget: boolean;
  supportsStructuredOutput: boolean;
  supportsWebSearch: boolean;
  supportsToolUse: boolean;
  supportsVision?: boolean;
  runtimeStatus: ProviderRuntimeStatus;
}

export interface AIModelOption {
  id: string;
  name: string;
  description: string;
  provider: AIProvider;
  source: ModelCatalogSource;
  capabilities: ModelCapabilities;
  contextLength?: number;
  maxCompletionTokens?: number;
  supportedParameters?: string[];
  recommendedRole?: 'GENERAL' | 'FAST' | 'DEEP_RESEARCH' | 'LOW_COST';
}
