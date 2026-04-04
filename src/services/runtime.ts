import type {
    DateRangeConfig,
    FeedItem,
    InvestigationRunConfig,
    InvestigationScope,
    MonitorEvent,
    SystemConfig,
    Artifact,
} from '../types';
import type { AIProvider } from '../config/aiModels';
import { loadSystemConfig } from '../config/systemConfig';
import {
    clearApiKey as clearProviderApiKey,
    hasApiKey as hasStoredApiKey,
    setApiKey as setProviderApiKey,
} from './providers/keys';
import { resetGeminiProviderClient } from './providers/geminiClientState';
import {
    generateAudioBriefingWithProviderRouter,
    getLiveIntelWithProviderRouter,
    investigateWithProviderRouter,
    scanAnomaliesWithProviderRouter,
} from './providers';
import type { LiveIntelConfig, ScanAnomaliesOptions } from './providers/types';

export type DiscoveryConfig = ScanAnomaliesOptions;
export type MonitorConfig = LiveIntelConfig;

const getActiveProvider = (): AIProvider => loadSystemConfig().provider;

export const hasApiKey = (provider?: AIProvider): boolean => {
    return hasStoredApiKey(provider || getActiveProvider());
};

export const setApiKey = (key: string, provider?: AIProvider): void => {
    const normalized = key.trim();
    if (!normalized) return;

    const resolvedProvider = provider || getActiveProvider();
    const result = setProviderApiKey(resolvedProvider, normalized);
    if (!result.isValid) {
        throw new Error(result.message || 'INVALID_API_KEY');
    }

    resetGeminiProviderClient();
};

export const clearApiKey = (provider?: AIProvider): void => {
    clearProviderApiKey(provider);
    if (!provider || provider === 'GEMINI') {
        resetGeminiProviderClient();
    }
};

export const generateAudioBriefing = async (text: string): Promise<string> => {
    return generateAudioBriefingWithProviderRouter({ text });
};

export const scanForDiscoveries = async (
    region = '',
    category = 'All',
    dateRange?: { start?: string; end?: string },
    configOverride?: DiscoveryConfig,
    scope?: InvestigationScope,
    runConfig?: Pick<InvestigationRunConfig, 'packId' | 'purposeId'>
): Promise<FeedItem[]> => {
    return scanAnomaliesWithProviderRouter({
        region,
        category,
        dateRange,
        options: configOverride,
        scope,
        packId: runConfig?.packId,
        purposeId: runConfig?.purposeId,
    });
};

export const getLiveWorkspaceIntel = async (
    topic: string,
    monitorConfig: MonitorConfig = {
        socialCount: 2,
        newsCount: 2,
        officialCount: 2,
        prioritySources: '',
    },
    existingContent: string[] = [],
    scope?: InvestigationScope,
    runConfig?: Pick<InvestigationRunConfig, 'packId' | 'purposeId'>
): Promise<MonitorEvent[]> => {
    return getLiveIntelWithProviderRouter({
        topic,
        monitorConfig,
        existingContent,
        scope,
        packId: runConfig?.packId,
        purposeId: runConfig?.purposeId,
    });
};

export const runWorkspaceInvestigation = async (
    topic: string,
    parentContext?: { topic: string; summary: string },
    configOverride?: Partial<SystemConfig>,
    scope?: InvestigationScope,
    dateOverride?: { start?: string; end?: string },
    runConfig?: Pick<InvestigationRunConfig, 'packId' | 'purposeId' | 'artifactType' | 'labelProfileId'>
): Promise<Artifact> => {
    return investigateWithProviderRouter({
        topic,
        parentContext,
        configOverride,
        scope,
        packId: runConfig?.packId,
        purposeId: runConfig?.purposeId,
        artifactType: runConfig?.artifactType,
        labelProfileId: runConfig?.labelProfileId,
        dateOverride,
    });
};

export type { DateRangeConfig };
