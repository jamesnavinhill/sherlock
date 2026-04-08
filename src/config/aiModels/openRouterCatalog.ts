import {
  getStoredOpenRouterModelCatalog,
  setStoredOpenRouterModelCatalog,
} from '../../utils/localStorage';
import { OPENROUTER_QUICK_PICK_IDS, OPENROUTER_SNAPSHOT_MODELS } from './staticCatalog';
import type { AIModelOption, ModelCapabilities, ModelCatalogSource } from './types';

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

export interface StoredOpenRouterCatalog {
  fetchedAt: number;
  models: AIModelOption[];
  source: Extract<ModelCatalogSource, 'OPENROUTER_CACHE' | 'OPENROUTER_LIVE'>;
}

const OPENROUTER_CATALOG_TTL_MS = 1000 * 60 * 60 * 12;
const OPENROUTER_MODELS_API_URL = 'https://openrouter.ai/api/v1/models';

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

export const dedupeModels = (models: AIModelOption[]): AIModelOption[] => {
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
  const parsed = getStoredOpenRouterModelCatalog<unknown>();
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
  setStoredOpenRouterModelCatalog(catalog);
};

const isCatalogFresh = (catalog: StoredOpenRouterCatalog | null): boolean => {
  if (!catalog) return false;
  return Date.now() - catalog.fetchedAt < OPENROUTER_CATALOG_TTL_MS;
};

const getOpenRouterSnapshotCatalog = (): StoredOpenRouterCatalog => ({
  fetchedAt: 0,
  source: 'OPENROUTER_CACHE',
  models: dedupeModels(OPENROUTER_SNAPSHOT_MODELS),
});

export const getOpenRouterCatalogModels = (): AIModelOption[] => {
  const cached = readCachedOpenRouterCatalog();
  if (cached?.models.length) return cached.models;
  return getOpenRouterSnapshotCatalog().models;
};

export const getOpenRouterQuickPicks = (): AIModelOption[] => {
  const catalog = getOpenRouterCatalogModels();
  const quickPicks = OPENROUTER_QUICK_PICK_IDS.map((id) =>
    catalog.find((model) => model.id === id)
  ).filter((model): model is AIModelOption => !!model);

  return dedupeModels([
    ...quickPicks,
    ...OPENROUTER_SNAPSHOT_MODELS.slice(0, Math.max(0, 4 - quickPicks.length)),
  ]);
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
