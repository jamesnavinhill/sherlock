import type { AIProvider, AIProviderOption } from './types';

export const DEFAULT_PROVIDER: AIProvider = 'GEMINI';
export const DEFAULT_MODEL_ID = 'gemini-3-flash-preview';

export const DEFAULT_MODELS_BY_PROVIDER: Record<AIProvider, string> = {
  GEMINI: DEFAULT_MODEL_ID,
  OPENROUTER: 'openrouter/free',
  OPENAI: 'gpt-4.1-mini',
  ANTHROPIC: 'claude-3-5-haiku-latest',
};

export const AI_PROVIDERS: AIProviderOption[] = [
  {
    id: 'GEMINI',
    label: 'Google Gemini',
    description: 'Primary default provider',
    defaultModelId: DEFAULT_MODELS_BY_PROVIDER.GEMINI,
    capabilities: {
      supportsThinkingBudget: true,
      supportsTts: true,
      supportsWebSearch: true,
      runtimeStatus: 'ACTIVE',
    },
  },
  {
    id: 'OPENROUTER',
    label: 'OpenRouter',
    description: 'Dynamic model catalog with server-side web search support',
    defaultModelId: DEFAULT_MODELS_BY_PROVIDER.OPENROUTER,
    capabilities: {
      supportsThinkingBudget: true,
      supportsTts: false,
      supportsWebSearch: true,
      supportsDynamicCatalog: true,
      runtimeStatus: 'ACTIVE',
    },
  },
  {
    id: 'OPENAI',
    label: 'OpenAI',
    description: 'Direct provider adapter',
    defaultModelId: DEFAULT_MODELS_BY_PROVIDER.OPENAI,
    capabilities: {
      supportsThinkingBudget: false,
      supportsTts: false,
      supportsWebSearch: false,
      runtimeStatus: 'ACTIVE',
    },
  },
  {
    id: 'ANTHROPIC',
    label: 'Anthropic',
    description: 'Direct provider adapter',
    defaultModelId: DEFAULT_MODELS_BY_PROVIDER.ANTHROPIC,
    capabilities: {
      supportsThinkingBudget: false,
      supportsTts: false,
      supportsWebSearch: false,
      runtimeStatus: 'ACTIVE',
    },
  },
];
