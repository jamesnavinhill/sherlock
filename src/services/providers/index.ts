import {
    AI_PROVIDERS,
    getModelProvider,
    getProviderOptionById,
} from '../../config/aiModels';
import { loadSystemConfig, migrateSystemConfig } from '../../config/systemConfig';
import { BUILTIN_SCOPES, getScopeById } from '../../data/presets';
import type {
    FeedItem,
    InvestigationReport,
    InvestigationScope,
    MonitorEvent,
    SystemConfig,
} from '../../types';
import { anthropicProvider } from './anthropicProvider';
import { geminiProvider } from './geminiProvider';
import { openAIProvider } from './openAIProvider';
import { openRouterProvider } from './openRouterProvider';
import { ProviderError } from './shared/errors';
import { logProviderDebug } from './shared/logging';
import type {
    LiveIntelConfig,
    ProviderAdapter,
    RouterInvestigationRequest,
    RouterLiveIntelRequest,
    RouterScanRequest,
    RouterTtsRequest,
} from './types';

const ADAPTER_REGISTRY: Record<string, ProviderAdapter> = {
    GEMINI: geminiProvider,
    OPENROUTER: openRouterProvider,
    OPENAI: openAIProvider,
    ANTHROPIC: anthropicProvider,
};

const DEFAULT_MONITOR_CONFIG: LiveIntelConfig = {
    socialCount: 2,
    newsCount: 2,
    officialCount: 2,
    prioritySources: '',
};

const resolveScope = (scope?: InvestigationScope): InvestigationScope => {
    return scope || getScopeById('open-investigation') || BUILTIN_SCOPES[BUILTIN_SCOPES.length - 1];
};

const resolveEffectiveConfig = (configOverride?: Partial<SystemConfig>): SystemConfig => {
    const baseConfig = loadSystemConfig();
    return migrateSystemConfig({ ...baseConfig, ...(configOverride || {}) });
};

const resolveAdapter = (config: SystemConfig): ProviderAdapter => {
    const modelProvider = getModelProvider(config.modelId);
    const provider = config.provider === modelProvider ? config.provider : modelProvider;
    const adapter = ADAPTER_REGISTRY[provider];

    if (!adapter) {
        throw new ProviderError({
            code: 'UPSTREAM_ERROR',
            provider,
            operation: 'INVESTIGATE',
            message: `No adapter is registered for provider ${provider}.`,
        });
    }

    return adapter;
};

const assertCapability = (
    adapter: ProviderAdapter,
    operation: 'INVESTIGATE' | 'SCAN_ANOMALIES' | 'LIVE_INTEL' | 'TTS',
    modelId: string
): void => {
    const providerMeta = getProviderOptionById(adapter.provider);

    if (!providerMeta) {
        throw new ProviderError({
            code: 'UPSTREAM_ERROR',
            provider: adapter.provider,
            operation,
            message: `Provider metadata missing for ${adapter.provider}.`,
        });
    }

    if (operation === 'TTS' && !providerMeta.capabilities.supportsTts) {
        throw new ProviderError({
            code: 'UNSUPPORTED_OPERATION',
            provider: adapter.provider,
            operation,
            message: `${providerMeta.label} does not support TTS for model ${modelId}.`,
        });
    }
};

export const investigateWithProviderRouter = async (
    request: RouterInvestigationRequest
): Promise<InvestigationReport> => {
    const config = resolveEffectiveConfig(request.configOverride);
    const adapter = resolveAdapter(config);
    assertCapability(adapter, 'INVESTIGATE', config.modelId);

    logProviderDebug({
        provider: adapter.provider,
        modelId: config.modelId,
        operation: 'INVESTIGATE',
        retryCount: 0,
    });

    return adapter.investigate({
        topic: request.topic,
        parentContext: request.parentContext,
        config,
        scope: resolveScope(request.scope),
        dateOverride: request.dateOverride,
    });
};

export const scanAnomaliesWithProviderRouter = async (
    request: RouterScanRequest
): Promise<FeedItem[]> => {
    const config = resolveEffectiveConfig();
    const adapter = resolveAdapter(config);
    assertCapability(adapter, 'SCAN_ANOMALIES', config.modelId);

    logProviderDebug({
        provider: adapter.provider,
        modelId: config.modelId,
        operation: 'SCAN_ANOMALIES',
        retryCount: 0,
    });

    return adapter.scanAnomalies({
        region: request.region || '',
        category: request.category || 'All',
        dateRange: request.dateRange,
        config,
        scope: resolveScope(request.scope),
        options: request.options,
    });
};

export const getLiveIntelWithProviderRouter = async (
    request: RouterLiveIntelRequest
): Promise<MonitorEvent[]> => {
    const config = resolveEffectiveConfig();
    const adapter = resolveAdapter(config);
    assertCapability(adapter, 'LIVE_INTEL', config.modelId);

    logProviderDebug({
        provider: adapter.provider,
        modelId: config.modelId,
        operation: 'LIVE_INTEL',
        retryCount: 0,
    });

    return adapter.getLiveIntel({
        topic: request.topic,
        config,
        scope: resolveScope(request.scope),
        monitorConfig: request.monitorConfig || DEFAULT_MONITOR_CONFIG,
        existingContent: request.existingContent || [],
    });
};

export const generateAudioBriefingWithProviderRouter = async (
    request: RouterTtsRequest
): Promise<string> => {
    const config = resolveEffectiveConfig();
    const adapter = resolveAdapter(config);
    assertCapability(adapter, 'TTS', config.modelId);

    if (!adapter.generateAudioBriefing) {
        throw new ProviderError({
            code: 'UNSUPPORTED_OPERATION',
            provider: adapter.provider,
            operation: 'TTS',
            message: `${adapter.provider} does not implement TTS yet.`,
        });
    }

    logProviderDebug({
        provider: adapter.provider,
        modelId: config.modelId,
        operation: 'TTS',
        retryCount: 0,
    });

    return adapter.generateAudioBriefing({
        text: request.text,
        config,
    });
};

export const getRegisteredProviders = (): string[] => {
    return AI_PROVIDERS.map((provider) => provider.id).filter(
        (provider) => !!ADAPTER_REGISTRY[provider]
    );
};
