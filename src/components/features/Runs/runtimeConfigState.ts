import { DEFAULT_SYSTEM_CONFIG } from '@/config/systemConfig';
import type { InvestigationRunConfig, SystemConfig } from '@/types';

import type { RuntimeConfigFormValue } from './useRuntimeConfigForm';

type RuntimeConfigSource = Partial<SystemConfig> | Partial<InvestigationRunConfig>;

type OpenRouterConfig = NonNullable<SystemConfig['openRouter']>;

export interface OpenRouterSettingsDraft {
  allowedDomains: string;
  engine: OpenRouterConfig['engine'];
  excludedDomains: string;
  maxResults: number;
  maxTotalResults: number;
  searchContextSize: OpenRouterConfig['searchContextSize'];
  webSearchEnabled: boolean;
}

const DEFAULT_OPENROUTER_SETTINGS = DEFAULT_SYSTEM_CONFIG.openRouter as OpenRouterConfig;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

const normalizeDomainList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export const createRuntimeConfigFormInput = (
  config: RuntimeConfigSource = {}
): Partial<RuntimeConfigFormValue> => ({
  provider: config.provider,
  modelId: config.modelId,
  searchDepth: config.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD',
  generationMode: config.generationMode === 'SINGLE_PASS' ? 'SINGLE_PASS' : 'STAGED',
  thinkingBudget: typeof config.thinkingBudget === 'number' ? config.thinkingBudget : 0,
});

export const createOpenRouterSettingsDraft = (
  config: Partial<SystemConfig> = {}
): OpenRouterSettingsDraft => {
  const openRouter = config.openRouter;

  return {
    webSearchEnabled: openRouter?.webSearchEnabled !== false,
    engine: openRouter?.engine || DEFAULT_OPENROUTER_SETTINGS.engine,
    maxResults: openRouter?.maxResults || DEFAULT_OPENROUTER_SETTINGS.maxResults,
    maxTotalResults: openRouter?.maxTotalResults || DEFAULT_OPENROUTER_SETTINGS.maxTotalResults,
    searchContextSize:
      openRouter?.searchContextSize || DEFAULT_OPENROUTER_SETTINGS.searchContextSize,
    allowedDomains: (openRouter?.allowedDomains || []).join(', '),
    excludedDomains: (openRouter?.excludedDomains || []).join(', '),
  };
};

export const serializeOpenRouterSettingsDraft = (
  draft: OpenRouterSettingsDraft
): OpenRouterConfig => ({
  webSearchEnabled: draft.webSearchEnabled,
  engine: draft.engine,
  maxResults: clampNumber(draft.maxResults, 1, 25),
  maxTotalResults: clampNumber(draft.maxTotalResults, 1, 50),
  searchContextSize: draft.searchContextSize,
  allowedDomains: normalizeDomainList(draft.allowedDomains),
  excludedDomains: normalizeDomainList(draft.excludedDomains),
});
