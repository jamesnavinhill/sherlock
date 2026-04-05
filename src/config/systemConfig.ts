import type { SystemConfig } from '../types';
import type { AIProvider } from './aiModels';
import {
  AI_PROVIDERS,
  DEFAULT_MODEL_ID,
  DEFAULT_PROVIDER,
  getDefaultModelForProvider,
  getModelProvider,
  resolveModelSelection,
} from './aiModels';
import {
  getStoredSystemConfigRecord,
  setStoredSystemConfigRecord,
} from '../utils/localStorage';

const LEGACY_MODEL_IDS: Record<string, string> = {
  'gemini-2.5-flash-latest': 'gemini-2.5-flash',
  'gemini-3-flash': 'gemini-3-flash-preview',
  'gemini-3-pro': 'gemini-3-pro-preview',
};

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  provider: DEFAULT_PROVIDER,
  modelId: DEFAULT_MODEL_ID,
  thinkingBudget: 0,
  persona: 'general-investigator',
  searchDepth: 'STANDARD',
  generationMode: 'STAGED',
  openRouter: {
    webSearchEnabled: true,
    engine: 'auto',
    maxResults: 5,
    maxTotalResults: 15,
    searchContextSize: 'medium',
    allowedDomains: [],
    excludedDomains: [],
  },
  autoNormalizeEntities: true,
  quietMode: false,
};

const readStoredConfigObject = (): Record<string, unknown> => getStoredSystemConfigRecord();

const normalizeModelId = (modelId: unknown): string | undefined => {
  if (typeof modelId !== 'string' || modelId.trim().length === 0) return undefined;
  return LEGACY_MODEL_IDS[modelId] || modelId;
};

const isAIProvider = (value: unknown): value is AIProvider => {
  return typeof value === 'string' && AI_PROVIDERS.some((provider) => provider.id === value);
};

export const migrateSystemConfig = (value?: Partial<SystemConfig> | null): SystemConfig => {
  const raw = (value || {}) as Partial<SystemConfig> & { provider?: unknown; modelId?: unknown };

  const fromModel = normalizeModelId(raw.modelId);
  const provider = isAIProvider(raw.provider)
    ? raw.provider
    : getModelProvider(fromModel || DEFAULT_MODEL_ID);
  let modelId = fromModel || getDefaultModelForProvider(provider);

  // Keep provider/model pair aligned after legacy migrations or manual edits.
  const modelProvider = getModelProvider(modelId);
  if (modelProvider !== provider) {
    modelId = resolveModelSelection(provider, getDefaultModelForProvider(provider));
  }

  return {
    ...DEFAULT_SYSTEM_CONFIG,
    ...raw,
    provider,
    modelId: resolveModelSelection(provider, modelId),
    persona:
      typeof raw.persona === 'string' && raw.persona.trim().length > 0
        ? raw.persona
        : DEFAULT_SYSTEM_CONFIG.persona,
    searchDepth: raw.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD',
    generationMode: raw.generationMode === 'SINGLE_PASS' ? 'SINGLE_PASS' : 'STAGED',
    thinkingBudget:
      typeof raw.thinkingBudget === 'number'
        ? raw.thinkingBudget
        : DEFAULT_SYSTEM_CONFIG.thinkingBudget,
    openRouter: {
      ...DEFAULT_SYSTEM_CONFIG.openRouter,
      ...(raw.openRouter || {}),
      webSearchEnabled: raw.openRouter?.webSearchEnabled !== false,
      engine:
        raw.openRouter?.engine === 'native' ||
        raw.openRouter?.engine === 'exa' ||
        raw.openRouter?.engine === 'firecrawl' ||
        raw.openRouter?.engine === 'parallel'
          ? raw.openRouter.engine
          : 'auto',
      maxResults:
        typeof raw.openRouter?.maxResults === 'number' && raw.openRouter.maxResults > 0
          ? Math.min(25, Math.max(1, Math.round(raw.openRouter.maxResults)))
          : (DEFAULT_SYSTEM_CONFIG.openRouter?.maxResults ?? 5),
      maxTotalResults:
        typeof raw.openRouter?.maxTotalResults === 'number' && raw.openRouter.maxTotalResults > 0
          ? Math.min(50, Math.max(1, Math.round(raw.openRouter.maxTotalResults)))
          : (DEFAULT_SYSTEM_CONFIG.openRouter?.maxTotalResults ?? 15),
      searchContextSize:
        raw.openRouter?.searchContextSize === 'low' || raw.openRouter?.searchContextSize === 'high'
          ? raw.openRouter.searchContextSize
          : 'medium',
      allowedDomains: Array.isArray(raw.openRouter?.allowedDomains)
        ? raw.openRouter.allowedDomains.filter(
            (entry): entry is string => typeof entry === 'string'
          )
        : [],
      excludedDomains: Array.isArray(raw.openRouter?.excludedDomains)
        ? raw.openRouter.excludedDomains.filter(
            (entry): entry is string => typeof entry === 'string'
          )
        : [],
    },
  };
};

export const loadSystemConfig = (): SystemConfig => {
  const stored = readStoredConfigObject();
  return migrateSystemConfig(stored as Partial<SystemConfig>);
};

export const saveSystemConfig = (
  partialConfig: Partial<SystemConfig>,
  extraValues?: Record<string, unknown>
): SystemConfig => {
  const existingRaw = readStoredConfigObject();
  const nextConfig = migrateSystemConfig({
    ...(existingRaw as Partial<SystemConfig>),
    ...partialConfig,
  });

  setStoredSystemConfigRecord({
    ...existingRaw,
    ...nextConfig,
    ...(extraValues || {}),
  });

  return nextConfig;
};
