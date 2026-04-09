import type { AIProvider } from '../../config/aiModels';
import { loadSystemConfig } from '../../config/systemConfig';
import { resetGeminiProviderClient } from '../providers/geminiClientState';
import {
  clearApiKey as clearStoredApiKey,
  hasApiKey as hasStoredApiKey,
  setApiKey as setStoredApiKey,
  type ApiKeyValidationResult,
} from '../providers/keys';

export const getActiveRuntimeProvider = (): AIProvider => loadSystemConfig().provider;

const resetProviderRuntimeState = (provider?: AIProvider): void => {
  if (!provider || provider === 'GEMINI') {
    resetGeminiProviderClient();
  }
};

export const hasRuntimeApiKey = (provider?: AIProvider): boolean => {
  return hasStoredApiKey(provider || getActiveRuntimeProvider());
};

export const setRuntimeApiKey = (
  rawKey: string,
  provider?: AIProvider
): ApiKeyValidationResult => {
  const normalized = rawKey.trim();
  if (!normalized) {
    return {
      isValid: false,
      message: 'API key is required.',
    };
  }

  const resolvedProvider = provider || getActiveRuntimeProvider();
  const result = setStoredApiKey(resolvedProvider, normalized);
  if (!result.isValid) {
    return result;
  }

  resetProviderRuntimeState(resolvedProvider);
  return result;
};

export const setRuntimeApiKeyOrThrow = (rawKey: string, provider?: AIProvider): void => {
  const result = setRuntimeApiKey(rawKey, provider);
  if (!result.isValid) {
    throw new Error(result.message || 'INVALID_API_KEY');
  }
};

export const clearRuntimeApiKey = (provider?: AIProvider): void => {
  clearStoredApiKey(provider);
  resetProviderRuntimeState(provider);
};
