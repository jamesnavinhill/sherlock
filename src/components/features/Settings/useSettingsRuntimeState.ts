import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { AIProvider } from '@/config/aiModels';
import { loadSystemConfig } from '@/config/systemConfig';
import {
  clearApiKey as clearProviderApiKey,
  getStoredApiKey,
  hasApiKey as hasProviderApiKey,
  setApiKey as setProviderApiKey,
  validateApiKey,
} from '@/services/providers/keys';
import { useRuntimeConfigForm } from '@/components/features/Runs/useRuntimeConfigForm';

export interface SettingsRuntimeState {
  anthropicKey: string;
  form: ReturnType<typeof useRuntimeConfigForm>;
  geminiKey: string;
  handleClearProviderKey: (provider: AIProvider) => void;
  openAIKey: string;
  openRouterAllowedDomains: string;
  openRouterEngine: 'auto' | 'native' | 'exa' | 'firecrawl' | 'parallel';
  openRouterExcludedDomains: string;
  openRouterKey: string;
  openRouterMaxResults: number;
  openRouterMaxTotalResults: number;
  openRouterSearchContextSize: 'low' | 'medium' | 'high';
  openRouterWebSearchEnabled: boolean;
  persistProviderKeys: (requiredProvider: AIProvider) => string | null;
  setAnthropicKey: Dispatch<SetStateAction<string>>;
  setGeminiKey: Dispatch<SetStateAction<string>>;
  setOpenAIKey: Dispatch<SetStateAction<string>>;
  setOpenRouterAllowedDomains: Dispatch<SetStateAction<string>>;
  setOpenRouterEngine: Dispatch<
    SetStateAction<'auto' | 'native' | 'exa' | 'firecrawl' | 'parallel'>
  >;
  setOpenRouterExcludedDomains: Dispatch<SetStateAction<string>>;
  setOpenRouterKey: Dispatch<SetStateAction<string>>;
  setOpenRouterMaxResults: Dispatch<SetStateAction<number>>;
  setOpenRouterMaxTotalResults: Dispatch<SetStateAction<number>>;
  setOpenRouterSearchContextSize: Dispatch<SetStateAction<'low' | 'medium' | 'high'>>;
  setOpenRouterWebSearchEnabled: Dispatch<SetStateAction<boolean>>;
  setShowAnthropicKey: Dispatch<SetStateAction<boolean>>;
  setShowGeminiKey: Dispatch<SetStateAction<boolean>>;
  setShowOpenAIKey: Dispatch<SetStateAction<boolean>>;
  setShowOpenRouterKey: Dispatch<SetStateAction<boolean>>;
  showAnthropicKey: boolean;
  showGeminiKey: boolean;
  showOpenAIKey: boolean;
  showOpenRouterKey: boolean;
}

export const useSettingsRuntimeState = (): SettingsRuntimeState => {
  const initialConfig = loadSystemConfig();
  const form = useRuntimeConfigForm({
    initialValue: {
      provider: initialConfig.provider,
      modelId: initialConfig.modelId,
      searchDepth: initialConfig.searchDepth,
      generationMode: initialConfig.generationMode,
      thinkingBudget: initialConfig.thinkingBudget,
    },
  });

  const [geminiKey, setGeminiKey] = useState(() => getStoredApiKey('GEMINI') ?? '');
  const [openRouterKey, setOpenRouterKey] = useState(() => getStoredApiKey('OPENROUTER') ?? '');
  const [openAIKey, setOpenAIKey] = useState(() => getStoredApiKey('OPENAI') ?? '');
  const [anthropicKey, setAnthropicKey] = useState(() => getStoredApiKey('ANTHROPIC') ?? '');

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  const [openRouterWebSearchEnabled, setOpenRouterWebSearchEnabled] = useState(
    initialConfig.openRouter?.webSearchEnabled !== false
  );
  const [openRouterEngine, setOpenRouterEngine] = useState<
    'auto' | 'native' | 'exa' | 'firecrawl' | 'parallel'
  >(initialConfig.openRouter?.engine || 'auto');
  const [openRouterMaxResults, setOpenRouterMaxResults] = useState(
    initialConfig.openRouter?.maxResults || 5
  );
  const [openRouterMaxTotalResults, setOpenRouterMaxTotalResults] = useState(
    initialConfig.openRouter?.maxTotalResults || 15
  );
  const [openRouterSearchContextSize, setOpenRouterSearchContextSize] = useState<
    'low' | 'medium' | 'high'
  >(initialConfig.openRouter?.searchContextSize || 'medium');
  const [openRouterAllowedDomains, setOpenRouterAllowedDomains] = useState(
    (initialConfig.openRouter?.allowedDomains || []).join(', ')
  );
  const [openRouterExcludedDomains, setOpenRouterExcludedDomains] = useState(
    (initialConfig.openRouter?.excludedDomains || []).join(', ')
  );

  const handleClearProviderKey = (provider: AIProvider) => {
    clearProviderApiKey(provider);

    if (provider === 'GEMINI') setGeminiKey('');
    if (provider === 'OPENROUTER') setOpenRouterKey('');
    if (provider === 'OPENAI') setOpenAIKey('');
    if (provider === 'ANTHROPIC') setAnthropicKey('');
  };

  const persistProviderKeys = (requiredProvider: AIProvider) => {
    const candidateKeys: Array<{ key: string; provider: AIProvider }> = [
      { provider: 'GEMINI', key: geminiKey.trim() },
      { provider: 'OPENROUTER', key: openRouterKey.trim() },
      { provider: 'OPENAI', key: openAIKey.trim() },
      { provider: 'ANTHROPIC', key: anthropicKey.trim() },
    ];

    for (const candidate of candidateKeys) {
      if (!candidate.key) continue;
      const validation = validateApiKey(candidate.provider, candidate.key);
      if (!validation.isValid) {
        return validation.message || `Invalid ${candidate.provider} API key.`;
      }
    }

    for (const candidate of candidateKeys) {
      clearProviderApiKey(candidate.provider);

      if (!candidate.key) continue;

      const saveResult = setProviderApiKey(candidate.provider, candidate.key);
      if (!saveResult.isValid) {
        return saveResult.message || `Failed to store ${candidate.provider} API key.`;
      }

      const persistedKey = getStoredApiKey(candidate.provider);
      if (persistedKey !== candidate.key) {
        return `Failed to persist ${candidate.provider} API key. Please try again.`;
      }
    }

    if (!hasProviderApiKey(requiredProvider)) {
      return `Missing ${requiredProvider} API key. Add one or switch active provider.`;
    }

    return null;
  };

  return {
    anthropicKey,
    form,
    geminiKey,
    handleClearProviderKey,
    openAIKey,
    openRouterAllowedDomains,
    openRouterEngine,
    openRouterExcludedDomains,
    openRouterKey,
    openRouterMaxResults,
    openRouterMaxTotalResults,
    openRouterSearchContextSize,
    openRouterWebSearchEnabled,
    persistProviderKeys,
    setAnthropicKey,
    setGeminiKey,
    setOpenAIKey,
    setOpenRouterAllowedDomains,
    setOpenRouterEngine,
    setOpenRouterExcludedDomains,
    setOpenRouterKey,
    setOpenRouterMaxResults,
    setOpenRouterMaxTotalResults,
    setOpenRouterSearchContextSize,
    setOpenRouterWebSearchEnabled,
    setShowAnthropicKey,
    setShowGeminiKey,
    setShowOpenAIKey,
    setShowOpenRouterKey,
    showAnthropicKey,
    showGeminiKey,
    showOpenAIKey,
    showOpenRouterKey,
  };
};
