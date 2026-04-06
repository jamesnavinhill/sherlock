import type { AIProvider } from '@/config/aiModels';
import {
  getCompactModelChoicesForProvider,
  getDefaultModelForProvider,
  getEffectiveModelCapabilities,
  getModelProvider,
  getProviderOptionById,
  getRuntimeReadyModelsForProvider,
} from '@/config/aiModels';

export const getSelectableRuntimeModels = (provider: AIProvider, selectedModel?: string) =>
  provider === 'OPENROUTER'
    ? getCompactModelChoicesForProvider(provider, selectedModel)
    : getRuntimeReadyModelsForProvider(provider);

export const getFallbackRuntimeModel = (provider: AIProvider, selectedModel?: string) =>
  getSelectableRuntimeModels(provider, selectedModel)[0]?.id || getDefaultModelForProvider(provider);

export const resolveRuntimeModelId = (provider: AIProvider, selectedModel: string) => {
  const selectableModels = getSelectableRuntimeModels(provider, selectedModel);

  if (provider === 'OPENROUTER') {
    return getModelProvider(selectedModel) === 'OPENROUTER'
      ? selectedModel
      : getFallbackRuntimeModel(provider, selectedModel);
  }

  return selectableModels.some((model) => model.id === selectedModel)
    ? selectedModel
    : getFallbackRuntimeModel(provider, selectedModel);
};

export const getRuntimeConfigModelState = (provider: AIProvider, selectedModel: string) => {
  const selectableModels = getSelectableRuntimeModels(provider, selectedModel);
  const activeModelId = resolveRuntimeModelId(provider, selectedModel);
  const providerMeta = getProviderOptionById(provider);
  const selectedModelCapabilities = getEffectiveModelCapabilities(activeModelId);

  return {
    activeModelId,
    providerMeta,
    selectableModels,
    selectedModelCapabilities,
    supportsThinkingBudget: selectedModelCapabilities.supportsThinkingBudget,
  };
};
