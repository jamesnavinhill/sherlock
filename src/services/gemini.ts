import type {
    DateRangeConfig,
    FeedItem,
    InvestigationReport,
    InvestigationScope,
    MonitorEvent,
    SystemConfig,
} from '../types';
import type { AIProvider } from '../config/aiModels';
import { loadSystemConfig } from '../config/systemConfig';
import {
    clearApiKey as clearProviderApiKey,
    hasApiKey as hasStoredApiKey,
    setApiKey as setProviderApiKey,
} from './providers/keys';
import { resetGeminiProviderClient } from './providers/geminiProvider';
import {
    generateAudioBriefingWithProviderRouter,
    getLiveIntelWithProviderRouter,
    investigateWithProviderRouter,
    scanAnomaliesWithProviderRouter,
} from './providers';
import type { LiveIntelConfig, ScanAnomaliesOptions } from './providers/types';

export interface AnomaliesConfig extends ScanAnomaliesOptions {}

export interface MonitorConfig extends LiveIntelConfig {}

const getActiveProvider = (): AIProvider => {
    return loadSystemConfig().provider;
};

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

    // Clear cached Gemini client whenever keys change.
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

export const scanForAnomalies = async (
    region = '',
    category = 'All',
    dateRange?: { start?: string; end?: string },
    configOverride?: AnomaliesConfig,
    scope?: InvestigationScope
): Promise<FeedItem[]> => {
    return scanAnomaliesWithProviderRouter({
        region,
        category,
        dateRange,
        options: configOverride,
        scope,
    });
};

export const getLiveIntel = async (
    topic: string,
    monitorConfig: MonitorConfig = {
        socialCount: 2,
        newsCount: 2,
        officialCount: 2,
        prioritySources: '',
    },
    existingContent: string[] = [],
    scope?: InvestigationScope
): Promise<MonitorEvent[]> => {
    return getLiveIntelWithProviderRouter({
        topic,
        monitorConfig,
        existingContent,
        scope,
    });
};

export const investigateTopic = async (
    topic: string,
    parentContext?: { topic: string; summary: string },
    configOverride?: Partial<SystemConfig>,
    scope?: InvestigationScope,
    dateOverride?: { start?: string; end?: string }
): Promise<InvestigationReport> => {
    return investigateWithProviderRouter({
        topic,
        parentContext,
        configOverride,
        scope,
        dateOverride,
    });
};

export type { DateRangeConfig };
