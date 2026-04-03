import type { AIProvider } from '../../config/aiModels';
import type {
    Case,
    ChatAttachmentKind,
    DateRangeConfig,
    DomainPack,
    FeedItem,
    InvestigationReport,
    InvestigationScope,
    MonitorEvent,
    PurposeProfile,
    WorkspaceContextSnippet,
    SystemConfig,
} from '../../types';

export type ProviderOperation = 'INVESTIGATE' | 'SCAN_ANOMALIES' | 'LIVE_INTEL' | 'TTS' | 'CHAT';

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
    pack: DomainPack;
    purpose: PurposeProfile;
    artifactType: NonNullable<InvestigationReport['artifactType']>;
    labelProfileId: string;
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
    pack: DomainPack;
    purpose: PurposeProfile;
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
    pack: DomainPack;
    purpose: PurposeProfile;
    monitorConfig: LiveIntelConfig;
    existingContent: string[];
}

export interface TtsRequest {
    text: string;
    config: SystemConfig;
}

export interface ChatTurn {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
}

export interface ChatRequest {
    workspace: Case;
    config: SystemConfig;
    pack: DomainPack;
    purpose: PurposeProfile;
    messages: ChatTurn[];
    workspaceSummary: string;
    recentArtifacts: Array<Pick<InvestigationReport, 'id' | 'topic' | 'summary' | 'dateStr'>>;
    recentHeadlines: Array<Pick<MonitorEvent, 'content' | 'sourceName' | 'timestamp' | 'type'>>;
    retrievedContext: WorkspaceContextSnippet[];
}

export interface ChatResponse {
    content: string;
    citations: string[];
    suggestedTitle?: string;
    attachments?: Array<{
        citationId: string;
        kind: ChatAttachmentKind;
        title: string;
        snippet?: string;
        refId?: string;
        refKind?: string;
        metadata?: Record<string, unknown>;
    }>;
    rawText: string;
    provider: AIProvider;
    modelId: string;
}

export type ChatStreamEvent =
    | { type: 'START' }
    | { type: 'DELTA'; delta: string; snapshot: string }
    | { type: 'COMPLETE'; snapshot: string };

export interface ChatStreamOptions {
    signal?: AbortSignal;
    onEvent?: (event: ChatStreamEvent) => void;
}

export interface ProviderAdapter {
    provider: AIProvider;
    investigate: (request: InvestigationRequest) => Promise<InvestigationReport>;
    chat: (request: ChatRequest) => Promise<ChatResponse>;
    streamChat: (request: ChatRequest, options?: ChatStreamOptions) => Promise<ChatResponse>;
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
    packId?: string;
    purposeId?: string;
    artifactType?: NonNullable<InvestigationReport['artifactType']>;
    labelProfileId?: string;
    dateOverride?: DateRangeOverride;
}

export interface RouterScanRequest {
    region?: string;
    category?: string;
    dateRange?: DateRangeOverride;
    options?: ScanAnomaliesOptions;
    scope?: InvestigationScope;
    packId?: string;
    purposeId?: string;
}

export interface RouterLiveIntelRequest {
    topic: string;
    monitorConfig?: LiveIntelConfig;
    existingContent?: string[];
    scope?: InvestigationScope;
    packId?: string;
    purposeId?: string;
}

export interface RouterTtsRequest {
    text: string;
}

export interface RouterChatRequest {
    workspace: Case;
    configOverride?: Partial<SystemConfig>;
    packId?: string;
    purposeId?: string;
    messages: ChatTurn[];
    workspaceSummary: string;
    recentArtifacts: Array<Pick<InvestigationReport, 'id' | 'topic' | 'summary' | 'dateStr'>>;
    recentHeadlines: Array<Pick<MonitorEvent, 'content' | 'sourceName' | 'timestamp' | 'type'>>;
    retrievedContext: WorkspaceContextSnippet[];
}

export type NormalizedDateRangeConfig = DateRangeConfig | undefined;
