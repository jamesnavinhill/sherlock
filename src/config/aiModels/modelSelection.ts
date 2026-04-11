import { getStoredRecentModelIds, setStoredRecentModelIds } from '../../utils/localStorage';
import {
  dedupeModels,
  getOpenRouterCatalogModels,
  getOpenRouterQuickPicks,
} from './openRouterCatalog';
import {
  AI_PROVIDERS,
  DEFAULT_MODEL_ID,
  DEFAULT_MODELS_BY_PROVIDER,
  DEFAULT_PROVIDER,
} from './providerCatalog';
import { STATIC_MODELS } from './staticCatalog';
import type { AIModelOption, AIProvider, AIProviderOption, ModelCapabilities } from './types';

const getRecentModelIds = (): string[] => getStoredRecentModelIds();

const writeRecentModelIds = (modelIds: string[]): void => {
  setStoredRecentModelIds(modelIds);
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
  if (provider === 'OPENROUTER') return getOpenRouterCatalogModels();
  return STATIC_MODELS.filter((model) => model.provider === provider);
};

export const getRuntimeReadyModelsForProvider = (provider: AIProvider): AIModelOption[] => {
  return getModelsForProvider(provider).filter(
    (model) => model.capabilities.runtimeStatus === 'ACTIVE'
  );
};

export const getRecentModelSelections = (provider?: AIProvider): AIModelOption[] => {
  const catalog = provider
    ? getRuntimeReadyModelsForProvider(provider)
    : [...STATIC_MODELS, ...getOpenRouterCatalogModels()];
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
  const knownModel = [...STATIC_MODELS, ...getOpenRouterCatalogModels()].find(
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
  return dedupeModels([...directProviderModels, ...openRouterCompact, ...(selected ? [selected] : [])]);
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

  const defaultModelId = getDefaultModelForProvider(provider);
  if (availableModels.some((model) => model.id === defaultModelId)) {
    return defaultModelId;
  }

  return availableModels[0]?.id || defaultModelId;
};

export const isGeminiModel = (modelId: string): boolean => getModelProvider(modelId) === 'GEMINI';

export const isOpenRouterModel = (modelId: string): boolean =>
  getModelProvider(modelId) === 'OPENROUTER';

export const getModelDisplayName = (modelId: string): string => {
  return getModelOptionById(modelId)?.name || modelId;
};
