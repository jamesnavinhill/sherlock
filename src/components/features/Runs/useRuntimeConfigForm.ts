import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { AIProvider } from '@/config/aiModels';
import { AI_PROVIDERS, getModelProvider, recordRecentModelSelection } from '@/config/aiModels';
import {
  getFallbackRuntimeModel,
  getRuntimeConfigModelState,
  resolveRuntimeModelId,
} from './runtimeConfigOptions';

export interface RuntimeConfigFormValue {
  provider: AIProvider;
  modelId: string;
  searchDepth: 'STANDARD' | 'DEEP';
  generationMode: 'SINGLE_PASS' | 'STAGED';
  thinkingBudget: number;
}

interface UseRuntimeConfigFormInput {
  initialValue?: Partial<RuntimeConfigFormValue>;
  onChange?: (nextValue: RuntimeConfigFormValue) => void;
  value?: RuntimeConfigFormValue;
}

type RuntimeConfigFormUpdater =
  | Partial<RuntimeConfigFormValue>
  | ((current: RuntimeConfigFormValue) => RuntimeConfigFormValue);

const ACTIVE_PROVIDER_OPTIONS = AI_PROVIDERS.filter(
  (provider) => provider.capabilities.runtimeStatus === 'ACTIVE'
);

export const createRuntimeConfigFormValue = (
  input: Partial<RuntimeConfigFormValue> = {}
): RuntimeConfigFormValue => {
  const provider = (input.provider ||
    (input.modelId ? getModelProvider(input.modelId) : 'GEMINI')) as AIProvider;
  const requestedModelId = input.modelId || getFallbackRuntimeModel(provider);

  return {
    provider,
    modelId: resolveRuntimeModelId(provider, requestedModelId),
    searchDepth: input.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD',
    generationMode: input.generationMode === 'SINGLE_PASS' ? 'SINGLE_PASS' : 'STAGED',
    thinkingBudget: typeof input.thinkingBudget === 'number' ? input.thinkingBudget : 0,
  };
};

export interface RuntimeConfigFormController {
  activeModelId: string;
  effectiveValue: RuntimeConfigFormValue;
  providerOptions: typeof ACTIVE_PROVIDER_OPTIONS;
  providerMeta: ReturnType<typeof getRuntimeConfigModelState>['providerMeta'];
  selectableModels: ReturnType<typeof getRuntimeConfigModelState>['selectableModels'];
  selectedModelCapabilities: ReturnType<typeof getRuntimeConfigModelState>['selectedModelCapabilities'];
  setGenerationMode: (generationMode: RuntimeConfigFormValue['generationMode']) => void;
  setModelId: (modelId: string) => void;
  setProvider: (provider: AIProvider) => void;
  setSearchDepth: (searchDepth: RuntimeConfigFormValue['searchDepth']) => void;
  setShowOpenRouterBrowser: Dispatch<SetStateAction<boolean>>;
  setThinkingBudget: (thinkingBudget: number) => void;
  showOpenRouterBrowser: boolean;
  supportsThinkingBudget: boolean;
  update: (updater: RuntimeConfigFormUpdater) => void;
  value: RuntimeConfigFormValue;
  reset: (nextValue?: Partial<RuntimeConfigFormValue>) => void;
}

export const useRuntimeConfigForm = ({
  initialValue,
  onChange,
  value,
}: UseRuntimeConfigFormInput = {}): RuntimeConfigFormController => {
  const [internalValue, setInternalValue] = useState(() => createRuntimeConfigFormValue(initialValue));
  const [showOpenRouterBrowser, setShowOpenRouterBrowser] = useState(false);
  const isControlled = !!value;

  const currentValue = useMemo(
    () => (isControlled ? createRuntimeConfigFormValue(value) : internalValue),
    [internalValue, isControlled, value]
  );

  const applyValue = useCallback(
    (nextValue: RuntimeConfigFormValue) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [isControlled, onChange]
  );

  const update = useCallback(
    (updater: RuntimeConfigFormUpdater) => {
      const nextValue =
        typeof updater === 'function'
          ? updater(currentValue)
          : createRuntimeConfigFormValue({ ...currentValue, ...updater });
      applyValue(nextValue);
    },
    [applyValue, currentValue]
  );

  const setProvider = useCallback(
    (provider: AIProvider) => {
      update((current) => ({
        ...current,
        provider,
        modelId: getFallbackRuntimeModel(provider, current.modelId),
      }));
    },
    [update]
  );

  const setModelId = useCallback(
    (modelId: string) => {
      recordRecentModelSelection(modelId);
      update((current) => ({
        ...current,
        modelId,
      }));
    },
    [update]
  );

  const setSearchDepth = useCallback(
    (searchDepth: RuntimeConfigFormValue['searchDepth']) => {
      update({ searchDepth });
    },
    [update]
  );

  const setGenerationMode = useCallback(
    (generationMode: RuntimeConfigFormValue['generationMode']) => {
      update({ generationMode });
    },
    [update]
  );

  const setThinkingBudget = useCallback(
    (thinkingBudget: number) => {
      update({ thinkingBudget });
    },
    [update]
  );

  const reset = useCallback(
    (nextValue: Partial<RuntimeConfigFormValue> = {}) => {
      applyValue(createRuntimeConfigFormValue(nextValue));
      setShowOpenRouterBrowser(false);
    },
    [applyValue]
  );

  const {
    activeModelId,
    providerMeta,
    selectableModels,
    selectedModelCapabilities,
    supportsThinkingBudget,
  } = useMemo(
    () => getRuntimeConfigModelState(currentValue.provider, currentValue.modelId),
    [currentValue.modelId, currentValue.provider]
  );

  const effectiveValue = useMemo(
    () => ({
      ...currentValue,
      modelId: activeModelId,
      thinkingBudget: supportsThinkingBudget ? currentValue.thinkingBudget : 0,
    }),
    [activeModelId, currentValue, supportsThinkingBudget]
  );

  return {
    activeModelId,
    effectiveValue,
    providerMeta,
    providerOptions: ACTIVE_PROVIDER_OPTIONS,
    reset,
    selectableModels,
    selectedModelCapabilities,
    setGenerationMode,
    setModelId,
    setProvider,
    setSearchDepth,
    setShowOpenRouterBrowser,
    setThinkingBudget,
    showOpenRouterBrowser,
    supportsThinkingBudget,
    update,
    value: currentValue,
  };
};
