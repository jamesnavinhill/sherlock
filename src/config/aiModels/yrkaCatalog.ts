import {
  getStoredYrkaModelCatalog,
  setStoredYrkaModelCatalog,
} from '../../utils/localStorage';
import type { AIModelOption, ModelCapabilities, ModelCatalogSource } from './types';

interface YrkaModelsApiResponse {
  data?: YrkaModelRecord[];
}

interface YrkaModelRecord {
  id?: unknown;
  name?: unknown;
  description?: unknown;
}

export interface StoredYrkaCatalog {
  fetchedAt: number;
  models: AIModelOption[];
  source: Extract<ModelCatalogSource, 'YRKA_CACHE' | 'YRKA_LIVE'>;
}

const YRKA_CATALOG_TTL_MS = 1000 * 60 * 60 * 12;
const YRKA_MODELS_API_URL = 'https://gateway.yrka.io/v1/models';

/**
 * Free lanes on the Yrka gateway. `ne-*` (Neon) and `cf-*` (Cloudflare
 * Workers AI) are paid and deliberately excluded here.
 */
const isFreeLaneModelId = (id: string): boolean => {
  if (id.startsWith('ne-') || id.startsWith('cf-')) return false;
  return (
    id === 'or-free' ||
    id.startsWith('or-') ||
    id.startsWith('nv-') ||
    id.startsWith('in-')
  );
};

const deriveYrkaCapabilities = (id: string): ModelCapabilities => ({
  supportsThinkingBudget: false,
  supportsStructuredOutput: true,
  supportsWebSearch: true,
  supportsToolUse: false,
  supportsVision: id.includes('vision'),
  runtimeStatus: 'ACTIVE',
});

const deriveRecommendedRole = (id: string): AIModelOption['recommendedRole'] => {
  if (id === 'or-free') return 'LOW_COST';
  if (id.includes('reasoning') || id.includes('70b') || id.includes('ultra') || id.includes('super')) {
    return 'DEEP_RESEARCH';
  }
  if (id.includes('nano') || id.includes('mini') || id.includes('flash') || id.includes('8b')) {
    return 'FAST';
  }
  return 'GENERAL';
};

const prettifyModelName = (id: string): string =>
  id
    .replace(/^(or|nv|in)-/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeYrkaModel = (record: YrkaModelRecord): AIModelOption | null => {
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  if (!id || !isFreeLaneModelId(id)) return null;

  return {
    id,
    name:
      typeof record.name === 'string' && record.name.trim().length > 0
        ? record.name.trim()
        : prettifyModelName(id),
    description:
      typeof record.description === 'string' && record.description.trim().length > 0
        ? record.description.trim()
        : 'Yrka gateway free-tier model',
    provider: 'YRKA',
    source: 'YRKA_LIVE',
    capabilities: deriveYrkaCapabilities(id),
    recommendedRole: deriveRecommendedRole(id),
  };
};

const toSnapshotModel = (
  id: string,
  name: string,
  description: string,
  recommendedRole: AIModelOption['recommendedRole']
): AIModelOption => ({
  id,
  name,
  description,
  provider: 'YRKA',
  source: 'YRKA_SNAPSHOT',
  capabilities: deriveYrkaCapabilities(id),
  recommendedRole,
});

/**
 * Bundled snapshot of free ids verified live against the gateway. Used until
 * the first successful live refresh; the live list is authoritative after that.
 */
export const YRKA_SNAPSHOT_MODELS: AIModelOption[] = [
  toSnapshotModel(
    'in-mercury-2',
    'Mercury 2 (Inception)',
    'Inception Labs Mercury free tier — verified working default.',
    'GENERAL'
  ),
  toSnapshotModel(
    'in-mercury-2-5',
    'Mercury 2.5 (Inception)',
    'Inception Labs Mercury 2.5 free tier.',
    'DEEP_RESEARCH'
  ),
  toSnapshotModel(
    'nv-nvidia-nemotron-3-nano-omni-30b-a3b-reasoning',
    'Nemotron 3 Nano Omni (NVIDIA)',
    'NVIDIA Nemotron reasoning model, free tier — verified working.',
    'DEEP_RESEARCH'
  ),
  toSnapshotModel(
    'nv-nvidia-nemotron-3-super-120b-a12b',
    'Nemotron 3 Super 120B (NVIDIA)',
    'NVIDIA Nemotron large model, free tier.',
    'DEEP_RESEARCH'
  ),
  toSnapshotModel(
    'nv-nvidia-nemotron-3-ultra-550b-a55b',
    'Nemotron 3 Ultra 550B (NVIDIA)',
    'NVIDIA Nemotron flagship model, free tier.',
    'DEEP_RESEARCH'
  ),
  toSnapshotModel(
    'or-google-gemma-4-31b-it',
    'Gemma 4 31B (OpenRouter free)',
    'Google Gemma via OpenRouter free tier. Upstream rate limits apply — retries with backoff.',
    'FAST'
  ),
  toSnapshotModel(
    'or-free',
    'OpenRouter auto free router',
    'Gateway free-model auto router. Availability varies.',
    'LOW_COST'
  ),
];

export const YRKA_QUICK_PICK_IDS = [
  'in-mercury-2',
  'nv-nvidia-nemotron-3-nano-omni-30b-a3b-reasoning',
  'or-google-gemma-4-31b-it',
  'or-free',
];

export const dedupeYrkaModels = (models: AIModelOption[]): AIModelOption[] => {
  const seen = new Map<string, AIModelOption>();
  for (const model of models) {
    const existing = seen.get(model.id);
    if (!existing || existing.source === 'YRKA_SNAPSHOT') {
      seen.set(model.id, model);
    }
  }

  return [...seen.values()].sort((left, right) => left.name.localeCompare(right.name));
};

const isStoredCatalog = (value: unknown): value is StoredYrkaCatalog => {
  if (!value || typeof value !== 'object') return false;
  const record = value as StoredYrkaCatalog;
  return typeof record.fetchedAt === 'number' && Array.isArray(record.models);
};

const readCachedYrkaCatalog = (): StoredYrkaCatalog | null => {
  const parsed = getStoredYrkaModelCatalog<unknown>();
  if (!isStoredCatalog(parsed)) return null;

  return {
    ...parsed,
    models: dedupeYrkaModels(
      parsed.models.filter(
        (model): model is AIModelOption =>
          !!model &&
          typeof model.id === 'string' &&
          model.provider === 'YRKA' &&
          model.capabilities?.runtimeStatus === 'ACTIVE'
      )
    ),
  };
};

const writeCachedYrkaCatalog = (catalog: StoredYrkaCatalog): void => {
  setStoredYrkaModelCatalog(catalog);
};

const isCatalogFresh = (catalog: StoredYrkaCatalog | null): boolean => {
  if (!catalog) return false;
  return Date.now() - catalog.fetchedAt < YRKA_CATALOG_TTL_MS;
};

const getYrkaSnapshotCatalog = (): StoredYrkaCatalog => ({
  fetchedAt: 0,
  source: 'YRKA_CACHE',
  models: dedupeYrkaModels(YRKA_SNAPSHOT_MODELS),
});

export const getYrkaCatalogModels = (): AIModelOption[] => {
  const cached = readCachedYrkaCatalog();
  if (cached?.models.length) return cached.models;
  return getYrkaSnapshotCatalog().models;
};

export const getYrkaCatalogModelIds = (): Set<string> =>
  new Set(getYrkaCatalogModels().map((model) => model.id));

export const getYrkaQuickPicks = (): AIModelOption[] => {
  const catalog = getYrkaCatalogModels();
  const quickPicks = YRKA_QUICK_PICK_IDS.map((id) =>
    catalog.find((model) => model.id === id)
  ).filter((model): model is AIModelOption => !!model);

  return dedupeYrkaModels([
    ...quickPicks,
    ...YRKA_SNAPSHOT_MODELS.slice(0, Math.max(0, 4 - quickPicks.length)),
  ]);
};

export const refreshYrkaModelCatalog = async (options?: {
  force?: boolean;
  token?: string;
}): Promise<StoredYrkaCatalog> => {
  const cached = readCachedYrkaCatalog();
  if (!options?.force && isCatalogFresh(cached)) {
    return cached as StoredYrkaCatalog;
  }

  // Token is passed in (not imported from keys.ts) to avoid a module cycle:
  // keys.ts -> config/aiModels barrel -> yrkaCatalog.
  const token = options?.token?.trim();
  if (!token) {
    throw new Error('Cannot refresh Yrka catalog: no Yrka gateway token provided.');
  }

  const response = await fetch(YRKA_MODELS_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to refresh Yrka catalog (${response.status}).`);
  }

  const payload = (await response.json()) as YrkaModelsApiResponse;
  const models = dedupeYrkaModels(
    (payload.data || [])
      .map(normalizeYrkaModel)
      .filter((model): model is AIModelOption => !!model)
  );
  const catalog: StoredYrkaCatalog = {
    fetchedAt: Date.now(),
    models,
    source: 'YRKA_LIVE',
  };
  writeCachedYrkaCatalog(catalog);
  return catalog;
};

export const getYrkaCatalogSnapshot = (): {
  fetchedAt: number;
  isFresh: boolean;
  models: AIModelOption[];
  source: ModelCatalogSource;
} => {
  const cached = readCachedYrkaCatalog();
  if (cached) {
    return {
      fetchedAt: cached.fetchedAt,
      isFresh: isCatalogFresh(cached),
      models: cached.models,
      source: cached.source,
    };
  }

  const snapshot = getYrkaSnapshotCatalog();
  return {
    fetchedAt: snapshot.fetchedAt,
    isFresh: false,
    models: snapshot.models,
    source: 'YRKA_SNAPSHOT',
  };
};
