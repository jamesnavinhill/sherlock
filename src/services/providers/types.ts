import type { AIProvider } from '../../config/aiModels';
import type {
    DateRangeConfig,
    FeedItem,
    InvestigationReport,
    InvestigationScope,
    MonitorEvent,
    SystemConfig,
} from '../../types';

export type ProviderOperation = 'INVESTIGATE' | 'SCAN_ANOMALIES' | 'LIVE_INTEL' | 'TTS';

export interface ProviderRequestContext {
    provider: AIProvider;
    modelId: string;
    operation: ProviderOperation;
}

export interface InvestigationRequest {
    topic: string;
    parentContext?: { topic: string; summary: string };
    config: SystemConfig;
    scope: InvestigationScope;
    dateOverride?: { start?: string; end?: string };
}

export interface ScanAnomaliesOptions {
    limit?: number;
    prioritySources?: string;
}

export interface ScanAnomaliesRequest {
    region: string;
    category: string;
    dateRange?: { start?: string; end?: string };
    config: SystemConfig;
    scope: InvestigationScope;
    options?: ScanAnomaliesOptions;
}

export interface LiveIntelConfig {
    socialCount: number;
    newsCount: number;
    officialCount: number;
    prioritySources: string;
    dateRange?: { start?: string; end?: string };
}

export interface LiveIntelRequest {
    topic: string;
    config: SystemConfig;
    scope: InvestigationScope;
    monitorConfig: LiveIntelConfig;
    existingContent: string[];
}

export interface TtsRequest {
    text: string;
    config: SystemConfig;
}

export interface ProviderAdapter {
    provider: AIProvider;
    investigate: (request: InvestigationRequest) => Promise<InvestigationReport>;
    scanAnomalies: (request: ScanAnomaliesRequest) => Promise<FeedItem[]>;
    getLiveIntel: (request: LiveIntelRequest) => Promise<MonitorEvent[]>;
    generateAudioBriefing?: (request: TtsRequest) => Promise<string>;
}

export interface DateRangeOverride {
    start?: string;
    end?: string;
}

export interface RouterInvestigationRequest {
    topic: string;
    parentContext?: { topic: string; summary: string };
    configOverride?: Partial<SystemConfig>;
    scope?: InvestigationScope;
    dateOverride?: DateRangeOverride;
}

export interface RouterScanRequest {
    region?: string;
    category?: string;
    dateRange?: DateRangeOverride;
    options?: ScanAnomaliesOptions;
    scope?: InvestigationScope;
}

export interface RouterLiveIntelRequest {
    topic: string;
    monitorConfig?: LiveIntelConfig;
    existingContent?: string[];
    scope?: InvestigationScope;
}

export interface RouterTtsRequest {
    text: string;
}

export type NormalizedDateRangeConfig = DateRangeConfig | undefined;
