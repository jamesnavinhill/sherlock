import type { SystemConfig } from '../types';
import { DEFAULT_MODEL_ID, DEFAULT_PROVIDER, getDefaultModelForProvider, getModelProvider } from './aiModels';

const STORAGE_KEY = 'sherlock_config';

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
    autoNormalizeEntities: true,
    quietMode: false,
};

const readStoredConfigObject = (): Record<string, unknown> => {
    if (typeof localStorage === 'undefined') return {};
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return {};
        const parsed = JSON.parse(stored) as unknown;
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
        return {};
    }
};

const normalizeModelId = (modelId: unknown): string | undefined => {
    if (typeof modelId !== 'string' || modelId.trim().length === 0) return undefined;
    return LEGACY_MODEL_IDS[modelId] || modelId;
};

export const migrateSystemConfig = (value?: Partial<SystemConfig> | null): SystemConfig => {
    const raw = value || {};

    const fromModel = normalizeModelId(raw.modelId);
    const provider = raw.provider || getModelProvider(fromModel || DEFAULT_MODEL_ID);
    let modelId = fromModel || getDefaultModelForProvider(provider);

    // Keep provider/model pair aligned after legacy migrations or manual edits.
    const modelProvider = getModelProvider(modelId);
    if (modelProvider !== provider) {
        const providerDefault = getDefaultModelForProvider(provider);
        if (getModelProvider(providerDefault) === provider) {
            modelId = providerDefault;
        }
    }

    return {
        ...DEFAULT_SYSTEM_CONFIG,
        ...raw,
        provider,
        modelId,
        persona: typeof raw.persona === 'string' && raw.persona.trim().length > 0 ? raw.persona : DEFAULT_SYSTEM_CONFIG.persona,
        searchDepth: raw.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD',
        thinkingBudget: typeof raw.thinkingBudget === 'number' ? raw.thinkingBudget : DEFAULT_SYSTEM_CONFIG.thinkingBudget,
    };
};

export const loadSystemConfig = (): SystemConfig => {
    const stored = readStoredConfigObject();
    return migrateSystemConfig(stored as Partial<SystemConfig>);
};

export const saveSystemConfig = (partialConfig: Partial<SystemConfig>, extraValues?: Record<string, unknown>): SystemConfig => {
    const existingRaw = readStoredConfigObject();
    const nextConfig = migrateSystemConfig({
        ...(existingRaw as Partial<SystemConfig>),
        ...partialConfig,
    });

    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...existingRaw,
            ...nextConfig,
            ...(extraValues || {}),
        }));
    }

    return nextConfig;
};
