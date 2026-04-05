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

interface OpenRouterModelsApiResponse {
  data?: OpenRouterModelRecord[];
}

interface OpenRouterModelRecord {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  context_length?: unknown;
  architecture?: {
    input_modalities?: unknown;
  };
  top_provider?: {
    max_completion_tokens?: unknown;
  };
  supported_parameters?: unknown;
}

interface StoredOpenRouterCatalog {
  fetchedAt: number;
  models: AIModelOption[];
  source: Extract<ModelCatalogSource, 'OPENROUTER_CACHE' | 'OPENROUTER_LIVE'>;
}

const OPENROUTER_CATALOG_STORAGE_KEY = 'sherlock_openrouter_model_catalog_v1';
const RECENT_MODELS_STORAGE_KEY = 'sherlock_recent_model_ids_v1';
const OPENROUTER_CATALOG_TTL_MS = 1000 * 60 * 60 * 12;
const OPENROUTER_MODELS_API_URL = 'https://openrouter.ai/api/v1/models';

export const DEFAULT_PROVIDER: AIProvider = 'GEMINI';
export const DEFAULT_MODEL_ID = 'gemini-3-flash-preview';

const DEFAULT_MODELS_BY_PROVIDER: Record<AIProvider, string> = {
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

const STATIC_MODELS: AIModelOption[] = [
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Most capable Gemini model in Sherlock',
    provider: 'GEMINI',
    source: 'STATIC',
    recommendedRole: 'DEEP_RESEARCH',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsWebSearch: true,
      supportsToolUse: true,
      supportsVision: true,
      runtimeStatus: 'ACTIVE',
    },
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Fast and balanced Gemini default',
    provider: 'GEMINI',
    source: 'STATIC',
    recommendedRole: 'GENERAL',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsWebSearch: true,
      supportsToolUse: true,
      supportsVision: true,
      runtimeStatus: 'ACTIVE',
    },
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Advanced reasoning profile',
    provider: 'GEMINI',
    source: 'STATIC',
    recommendedRole: 'DEEP_RESEARCH',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: false,
      supportsWebSearch: true,
      supportsToolUse: true,
      supportsVision: true,
      runtimeStatus: 'ACTIVE',
    },
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Cost-effective Gemini option',
    provider: 'GEMINI',
    source: 'STATIC',
    recommendedRole: 'FAST',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: false,
      supportsWebSearch: true,
      supportsToolUse: true,
      supportsVision: true,
      runtimeStatus: 'ACTIVE',
    },
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    description: 'High-throughput Gemini option',
    provider: 'GEMINI',
    source: 'STATIC',
    recommendedRole: 'LOW_COST',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: false,
      supportsWebSearch: true,
      supportsToolUse: true,
      supportsVision: true,
      runtimeStatus: 'ACTIVE',
    },
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'OpenAI fast general model',
    provider: 'OPENAI',
    source: 'STATIC',
    recommendedRole: 'FAST',
    capabilities: {
      supportsThinkingBudget: false,
      supportsStructuredOutput: true,
      supportsWebSearch: false,
      supportsToolUse: false,
      runtimeStatus: 'ACTIVE',
    },
  },
  {
    id: 'claude-3-5-haiku-latest',
    name: 'Claude 3.5 Haiku',
    description: 'Anthropic fast general model',
    provider: 'ANTHROPIC',
    source: 'STATIC',
    recommendedRole: 'FAST',
    capabilities: {
      supportsThinkingBudget: false,
      supportsStructuredOutput: true,
      supportsWebSearch: false,
      supportsToolUse: false,
      runtimeStatus: 'ACTIVE',
    },
  },
];

const OPENROUTER_SNAPSHOT_MODELS: AIModelOption[] = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Router',
    description: 'Routes to current free models and filters for supported features.',
    provider: 'OPENROUTER',
    source: 'OPENROUTER_SNAPSHOT',
    recommendedRole: 'LOW_COST',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsWebSearch: true,
      supportsToolUse: true,
      runtimeStatus: 'ACTIVE',
    },
    contextLength: 200000,
    supportedParameters: ['reasoning', 'response_format', 'structured_outputs', 'tools'],
  },
  {
    id: 'openrouter/auto',
    name: 'OpenRouter Auto',
    description: 'Lets OpenRouter route across the best available supported models.',
    provider: 'OPENROUTER',
    source: 'OPENROUTER_SNAPSHOT',
    recommendedRole: 'GENERAL',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsWebSearch: true,
      supportsToolUse: true,
      runtimeStatus: 'ACTIVE',
    },
    supportedParameters: ['reasoning', 'response_format', 'structured_outputs', 'tools'],
  },
  {
    id: 'openai/gpt-5.4-mini',
    name: 'OpenAI: GPT-5.4 Mini',
    description: 'Balanced frontier-grade OpenRouter option for research and chat.',
    provider: 'OPENROUTER',
    source: 'OPENROUTER_SNAPSHOT',
    recommendedRole: 'GENERAL',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsWebSearch: true,
      supportsToolUse: true,
      supportsVision: true,
      runtimeStatus: 'ACTIVE',
    },
    contextLength: 400000,
    maxCompletionTokens: 128000,
    supportedParameters: [
      'include_reasoning',
      'max_tokens',
      'reasoning',
      'response_format',
      'seed',
      'structured_outputs',
      'tool_choice',
      'tools',
    ],
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Anthropic: Claude Sonnet 4',
    description: 'Strong all-around OpenRouter model for investigation and synthesis.',
    provider: 'OPENROUTER',
    source: 'OPENROUTER_SNAPSHOT',
    recommendedRole: 'DEEP_RESEARCH',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsWebSearch: true,
      supportsToolUse: true,
      runtimeStatus: 'ACTIVE',
    },
    contextLength: 200000,
    supportedParameters: ['reasoning', 'response_format', 'structured_outputs', 'tools'],
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Google: Gemini 2.5 Flash',
    description: 'Fast multimodal OpenRouter option with configurable reasoning.',
    provider: 'OPENROUTER',
    source: 'OPENROUTER_SNAPSHOT',
    recommendedRole: 'FAST',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsWebSearch: true,
      supportsToolUse: true,
      runtimeStatus: 'ACTIVE',
    },
    contextLength: 1048576,
    supportedParameters: ['reasoning', 'response_format', 'structured_outputs', 'tools'],
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Google: Gemini 2.5 Flash Lite',
    description: 'Low-latency OpenRouter workhorse with optional reasoning.',
    provider: 'OPENROUTER',
    source: 'OPENROUTER_SNAPSHOT',
    recommendedRole: 'LOW_COST',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsWebSearch: true,
      supportsToolUse: true,
      runtimeStatus: 'ACTIVE',
    },
    contextLength: 1048576,
    supportedParameters: ['reasoning', 'response_format', 'structured_outputs', 'tools'],
  },
  {
    id: 'qwen/qwen3.6-plus:free',
    name: 'Qwen: Qwen3.6 Plus (free)',
    description: 'High-context free OpenRouter model with reasoning and tool support.',
    provider: 'OPENROUTER',
    source: 'OPENROUTER_SNAPSHOT',
    recommendedRole: 'LOW_COST',
    capabilities: {
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsWebSearch: true,
      supportsToolUse: true,
      supportsVision: true,
      runtimeStatus: 'ACTIVE',
    },
    contextLength: 1000000,
    maxCompletionTokens: 65536,
    supportedParameters: [
      'include_reasoning',
      'max_tokens',
      'presence_penalty',
      'reasoning',
      'response_format',
      'seed',
      'structured_outputs',
      'temperature',
      'tool_choice',
      'tools',
      'top_p',
    ],
  },
];

const OPENROUTER_QUICK_PICK_IDS = [
  'openrouter/free',
  'openrouter/auto',
  'openai/gpt-5.4-mini',
  'anthropic/claude-sonnet-4',
  'google/gemini-2.5-flash',
  'qwen/qwen3.6-plus:free',
];

export const AI_MODELS: AIModelOption[] = [...STATIC_MODELS, ...OPENROUTER_SNAPSHOT_MODELS];

const toInteger = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
  );
};

const hasSupportedParameter = (parameters: string[], value: string): boolean => {
  return parameters.some((parameter) => parameter.toLowerCase() === value.toLowerCase());
};

const deriveOpenRouterCapabilities = (record: OpenRouterModelRecord): ModelCapabilities => {
  const parameters = normalizeStringArray(record.supported_parameters);
  const inputModalities = normalizeStringArray(record.architecture?.input_modalities);

  return {
    supportsThinkingBudget:
      hasSupportedParameter(parameters, 'reasoning') ||
      hasSupportedParameter(parameters, 'include_reasoning'),
    supportsStructuredOutput:
      hasSupportedParameter(parameters, 'response_format') ||
      hasSupportedParameter(parameters, 'structured_outputs'),
    supportsWebSearch: true,
    supportsToolUse: hasSupportedParameter(parameters, 'tools'),
    supportsVision: inputModalities.includes('image') || inputModalities.includes('video'),
    runtimeStatus: 'ACTIVE',
  };
};

const normalizeOpenRouterModel = (record: OpenRouterModelRecord): AIModelOption | null => {
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  if (!id) return null;

  const supportedParameters = normalizeStringArray(record.supported_parameters);
  return {
    id,
    name:
      typeof record.name === 'string' && record.name.trim().length > 0 ? record.name.trim() : id,
    description:
      typeof record.description === 'string' && record.description.trim().length > 0
        ? record.description.trim()
        : 'OpenRouter model',
    provider: 'OPENROUTER',
    source: 'OPENROUTER_LIVE',
    capabilities: deriveOpenRouterCapabilities(record),
    contextLength: toInteger(record.context_length),
    maxCompletionTokens: toInteger(record.top_provider?.max_completion_tokens),
    supportedParameters,
    recommendedRole: id.includes(':free') ? 'LOW_COST' : 'GENERAL',
  };
};

const safeParseJson = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const dedupeModels = (models: AIModelOption[]): AIModelOption[] => {
  const seen = new Map<string, AIModelOption>();
  for (const model of models) {
    const existing = seen.get(model.id);
    if (!existing || existing.source === 'OPENROUTER_SNAPSHOT') {
      seen.set(model.id, model);
    }
  }

  return [...seen.values()].sort((left, right) => left.name.localeCompare(right.name));
};

const isStoredCatalog = (value: unknown): value is StoredOpenRouterCatalog => {
  if (!value || typeof value !== 'object') return false;
  const record = value as StoredOpenRouterCatalog;
  return typeof record.fetchedAt === 'number' && Array.isArray(record.models);
};

const readCachedOpenRouterCatalog = (): StoredOpenRouterCatalog | null => {
  if (typeof localStorage === 'undefined') return null;
  const parsed = safeParseJson<unknown>(localStorage.getItem(OPENROUTER_CATALOG_STORAGE_KEY));
  if (!isStoredCatalog(parsed)) return null;

  return {
    ...parsed,
    models: dedupeModels(
      parsed.models.filter(
        (model): model is AIModelOption =>
          !!model &&
          typeof model.id === 'string' &&
          model.provider === 'OPENROUTER' &&
          model.capabilities?.runtimeStatus === 'ACTIVE'
      )
    ),
  };
};

const writeCachedOpenRouterCatalog = (catalog: StoredOpenRouterCatalog): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(OPENROUTER_CATALOG_STORAGE_KEY, JSON.stringify(catalog));
};

const isCatalogFresh = (catalog: StoredOpenRouterCatalog | null): boolean => {
  if (!catalog) return false;
  return Date.now() - catalog.fetchedAt < OPENROUTER_CATALOG_TTL_MS;
};

const getRecentModelIds = (): string[] => {
  if (typeof localStorage === 'undefined') return [];
  const parsed = safeParseJson<unknown>(localStorage.getItem(RECENT_MODELS_STORAGE_KEY));
  return Array.isArray(parsed)
    ? parsed.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
      )
    : [];
};

const writeRecentModelIds = (modelIds: string[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(RECENT_MODELS_STORAGE_KEY, JSON.stringify(modelIds.slice(0, 8)));
};

const getOpenRouterSnapshotCatalog = (): StoredOpenRouterCatalog => ({
  fetchedAt: 0,
  source: 'OPENROUTER_CACHE',
  models: dedupeModels(OPENROUTER_SNAPSHOT_MODELS),
});

const getOpenRouterModels = (): AIModelOption[] => {
  const cached = readCachedOpenRouterCatalog();
  if (cached?.models.length) return cached.models;
  return getOpenRouterSnapshotCatalog().models;
};

const inferProviderFromModelId = (modelId: string): AIProvider => {
  if (modelId.startsWith('gemini-')) return 'GEMINI';
  if (modelId.startsWith('gpt-') || modelId.startsWith('o1-') || modelId.startsWith('o3-')) {
    return 'OPENAI';
  }
  if (modelId.startsWith('claude-')) return 'ANTHROPIC';
  if (modelId.includes('/')) return 'OPENROUTER';
  return DEFAULT_PROVIDER;
};

const createManualOpenRouterModel = (modelId: string): AIModelOption => ({
  id: modelId,
  name: modelId,
  description: 'Manual OpenRouter slug',
  provider: 'OPENROUTER',
  source: 'MANUAL',
  capabilities: {
    supportsThinkingBudget: false,
    supportsStructuredOutput: false,
    supportsWebSearch: true,
    supportsToolUse: false,
    runtimeStatus: 'ACTIVE',
  },
});

export const getProviderOptionById = (provider: AIProvider): AIProviderOption | undefined => {
  return AI_PROVIDERS.find((option) => option.id === provider);
};

export const getDefaultModelForProvider = (provider: AIProvider): string => {
  return DEFAULT_MODELS_BY_PROVIDER[provider] || DEFAULT_MODEL_ID;
};

export const getModelsForProvider = (provider: AIProvider): AIModelOption[] => {
  if (provider === 'OPENROUTER') return getOpenRouterModels();
  return STATIC_MODELS.filter((model) => model.provider === provider);
};

export const getRuntimeReadyModelsForProvider = (provider: AIProvider): AIModelOption[] => {
  return getModelsForProvider(provider).filter(
    (model) => model.capabilities.runtimeStatus === 'ACTIVE'
  );
};

export const getOpenRouterQuickPicks = (): AIModelOption[] => {
  const catalog = getOpenRouterModels();
  const quickPicks = OPENROUTER_QUICK_PICK_IDS.map((id) =>
    catalog.find((model) => model.id === id)
  ).filter((model): model is AIModelOption => !!model);

  return dedupeModels([
    ...quickPicks,
    ...OPENROUTER_SNAPSHOT_MODELS.slice(0, Math.max(0, 4 - quickPicks.length)),
  ]);
};

export const getRecentModelSelections = (provider?: AIProvider): AIModelOption[] => {
  const catalog = provider
    ? getRuntimeReadyModelsForProvider(provider)
    : [...STATIC_MODELS, ...getOpenRouterModels()];
  const catalogById = new Map(catalog.map((model) => [model.id, model]));
  return getRecentModelIds()
    .map((modelId) => catalogById.get(modelId) || getModelOptionById(modelId))
    .filter((model): model is AIModelOption => !!model);
};

export const recordRecentModelSelection = (modelId: string): void => {
  const next = [modelId, ...getRecentModelIds().filter((entry) => entry !== modelId)];
  writeRecentModelIds(next);
};

export const getModelOptionById = (modelId: string): AIModelOption | undefined => {
  const knownModel = [...STATIC_MODELS, ...getOpenRouterModels()].find(
    (model) => model.id === modelId
  );
  if (knownModel) return knownModel;

  return inferProviderFromModelId(modelId) === 'OPENROUTER'
    ? createManualOpenRouterModel(modelId)
    : undefined;
};

export const getCompactModelChoicesForProvider = (
  provider: AIProvider,
  selectedModelId?: string
): AIModelOption[] => {
  if (provider !== 'OPENROUTER') {
    return getRuntimeReadyModelsForProvider(provider);
  }

  const selectedModel = selectedModelId ? getModelOptionById(selectedModelId) : undefined;
  const recent = getRecentModelSelections('OPENROUTER');

  return dedupeModels(
    [
      ...getOpenRouterQuickPicks(),
      ...recent,
      ...(selectedModel?.provider === 'OPENROUTER' ? [selectedModel] : []),
    ].filter((model) => model.capabilities.runtimeStatus === 'ACTIVE')
  );
};

export const getTemplateSelectableModels = (selectedModelId?: string): AIModelOption[] => {
  const openRouterCompact = getCompactModelChoicesForProvider('OPENROUTER', selectedModelId).slice(
    0,
    4
  );
  const directProviderModels = STATIC_MODELS.filter(
    (model) => model.capabilities.runtimeStatus === 'ACTIVE'
  );
  const selected = selectedModelId ? getModelOptionById(selectedModelId) : undefined;

  return dedupeModels([
    ...directProviderModels,
    ...openRouterCompact,
    ...(selected ? [selected] : []),
  ]);
};

export const isProviderRuntimeReady = (provider: AIProvider): boolean => {
  return getProviderOptionById(provider)?.capabilities.runtimeStatus === 'ACTIVE';
};

export const getModelProvider = (modelId: string): AIProvider => {
  const model = getModelOptionById(modelId);
  if (model) return model.provider;
  return inferProviderFromModelId(modelId);
};

export const getEffectiveModelCapabilities = (modelId: string): ModelCapabilities => {
  const model = getModelOptionById(modelId);
  if (model) return model.capabilities;

  const provider = getModelProvider(modelId);
  if (provider === 'OPENROUTER') {
    return {
      supportsThinkingBudget: false,
      supportsStructuredOutput: false,
      supportsWebSearch: true,
      supportsToolUse: false,
      runtimeStatus: 'ACTIVE',
    };
  }

  const providerMeta = getProviderOptionById(provider);
  return {
    supportsThinkingBudget: providerMeta?.capabilities.supportsThinkingBudget ?? false,
    supportsStructuredOutput: provider === 'OPENAI' || provider === 'ANTHROPIC',
    supportsWebSearch: providerMeta?.capabilities.supportsWebSearch ?? false,
    supportsToolUse: provider === 'GEMINI',
    runtimeStatus: providerMeta?.capabilities.runtimeStatus ?? 'ACTIVE',
  };
};

export const refreshOpenRouterModelCatalog = async (options?: {
  force?: boolean;
}): Promise<StoredOpenRouterCatalog> => {
  const cached = readCachedOpenRouterCatalog();
  if (!options?.force && isCatalogFresh(cached)) {
    return cached as StoredOpenRouterCatalog;
  }

  const response = await fetch(OPENROUTER_MODELS_API_URL, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to refresh OpenRouter catalog (${response.status}).`);
  }

  const payload = (await response.json()) as OpenRouterModelsApiResponse;
  const models = dedupeModels(
    (payload.data || [])
      .map(normalizeOpenRouterModel)
      .filter((model): model is AIModelOption => !!model)
  );
  const catalog: StoredOpenRouterCatalog = {
    fetchedAt: Date.now(),
    models,
    source: 'OPENROUTER_LIVE',
  };
  writeCachedOpenRouterCatalog(catalog);
  return catalog;
};

export const getOpenRouterCatalogSnapshot = (): {
  fetchedAt: number;
  isFresh: boolean;
  models: AIModelOption[];
  source: ModelCatalogSource;
} => {
  const cached = readCachedOpenRouterCatalog();
  if (cached) {
    return {
      fetchedAt: cached.fetchedAt,
      isFresh: isCatalogFresh(cached),
      models: cached.models,
      source: cached.source,
    };
  }

  const snapshot = getOpenRouterSnapshotCatalog();
  return {
    fetchedAt: snapshot.fetchedAt,
    isFresh: false,
    models: snapshot.models,
    source: 'OPENROUTER_SNAPSHOT',
  };
};

export const resolveModelSelection = (provider: AIProvider, requestedModelId?: string): string => {
  if (
    provider === 'OPENROUTER' &&
    requestedModelId &&
    getModelProvider(requestedModelId) === 'OPENROUTER'
  ) {
    return requestedModelId;
  }

  const availableModels = getRuntimeReadyModelsForProvider(provider);
  if (requestedModelId && availableModels.some((model) => model.id === requestedModelId)) {
    return requestedModelId;
  }

  return availableModels[0]?.id || getDefaultModelForProvider(provider);
};

export const isGeminiModel = (modelId: string): boolean => getModelProvider(modelId) === 'GEMINI';
export const isOpenRouterModel = (modelId: string): boolean =>
  getModelProvider(modelId) === 'OPENROUTER';

export const getModelDisplayName = (modelId: string): string => {
  return getModelOptionById(modelId)?.name || modelId;
};
