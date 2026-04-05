import type { AIProvider } from '../../config/aiModels';
import type {
  ArtifactEvidence,
  ArtifactProvenance,
  BoardAgentActionType,
  BoardAgentContextSnapshot,
  Workspace,
  ChatAttachmentKind,
  DateRangeConfig,
  DomainPack,
  FeedItem,
  Artifact,
  InvestigationScope,
  MonitorEvent,
  PurposeProfile,
  WorkspaceBoard,
  WorkspaceContextSnippet,
  SystemConfig,
} from '../../types';

export type ProviderOperation =
  | 'INVESTIGATE'
  | 'SCAN_ANOMALIES'
  | 'LIVE_INTEL'
  | 'TTS'
  | 'CHAT'
  | 'BOARD_AGENT';

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
  artifactType: NonNullable<Artifact['artifactType']>;
  labelProfileId: string;
  dateOverride?: { start?: string; end?: string };
  generationMode?: 'SINGLE_PASS' | 'STAGED';
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
  workspace: Workspace;
  config: SystemConfig;
  pack: DomainPack;
  purpose: PurposeProfile;
  messages: ChatTurn[];
  workspaceSummary: string;
  recentArtifacts: Array<Pick<Artifact, 'id' | 'topic' | 'summary' | 'dateStr'>>;
  recentSignals: Array<Pick<MonitorEvent, 'content' | 'sourceName' | 'timestamp' | 'type'>>;
  retrievedContext: WorkspaceContextSnippet[];
}

export interface BoardAgentStructuredAction {
  type: BoardAgentActionType;
  input?: Record<string, unknown>;
  rationale?: string;
}

export interface BoardAgentProviderRequest {
  workspace: Workspace;
  board: Pick<WorkspaceBoard, 'id' | 'workspaceId' | 'name' | 'presentationMode'>;
  config: SystemConfig;
  pack: DomainPack;
  purpose: PurposeProfile;
  userRequest: string;
  contextSnapshot: BoardAgentContextSnapshot;
}

export interface ChatResponse {
  content: string;
  citations: string[];
  sourceCitations?: ArtifactProvenance['citations'];
  warnings?: string[];
  provenance?: ArtifactProvenance;
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

export interface BoardAgentResponse {
  message: string;
  actions: BoardAgentStructuredAction[];
  suggestedTitle?: string;
  rawText: string;
  provider: AIProvider;
  modelId: string;
  warnings?: string[];
}

export type ChatStreamEvent =
  | { type: 'START' }
  | { type: 'DELTA'; delta: string; snapshot: string }
  | { type: 'COMPLETE'; snapshot: string };

export interface ChatStreamOptions {
  signal?: AbortSignal;
  onEvent?: (event: ChatStreamEvent) => void;
}

export type BoardAgentStreamEvent =
  | { type: 'START' }
  | { type: 'RAW_DELTA'; delta: string; snapshot: string }
  | { type: 'MESSAGE_DELTA'; delta: string; snapshot: string }
  | { type: 'ACTION'; action: BoardAgentStructuredAction; index: number; snapshot: string }
  | { type: 'COMPLETE'; snapshot: string; response: BoardAgentResponse };

export interface BoardAgentStreamOptions {
  signal?: AbortSignal;
  onEvent?: (event: BoardAgentStreamEvent) => void;
}

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface StructuredArtifactPayload {
  summary?: unknown;
  entities?: unknown;
  agendas?: unknown;
  leads?: unknown;
  followUps?: unknown;
  sources?: Array<{ title?: unknown; url?: unknown; uri?: unknown }>;
  sections?: unknown;
  evidence?: unknown;
  methodology?: unknown;
}

export interface ArtifactNormalizationOptions {
  provider: AIProvider;
  modelId: string;
  topic: string;
  scopeId: string;
  scopeName: string;
  pack: DomainPack;
  purpose: PurposeProfile;
  artifactType: NonNullable<Artifact['artifactType']>;
  labelProfileId: string;
  searchMetadata?: ArtifactProvenance['search'];
  citations?: ArtifactProvenance['citations'];
  warnings?: string[];
  usage?: Record<string, unknown>;
  requestId?: string;
  extraMetadata?: Record<string, unknown>;
  extraEvidence?: ArtifactEvidence[];
  extraSources?: Artifact['sources'];
  generationMode?: 'SINGLE_PASS' | 'STAGED';
}

export interface ProviderAdapter {
  provider: AIProvider;
  investigate: (request: InvestigationRequest) => Promise<Artifact>;
  chat: (request: ChatRequest) => Promise<ChatResponse>;
  streamChat: (request: ChatRequest, options?: ChatStreamOptions) => Promise<ChatResponse>;
  boardAgent: (request: BoardAgentProviderRequest) => Promise<BoardAgentResponse>;
  streamBoardAgent: (
    request: BoardAgentProviderRequest,
    options?: BoardAgentStreamOptions
  ) => Promise<BoardAgentResponse>;
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
  artifactType?: NonNullable<Artifact['artifactType']>;
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
  workspace: Workspace;
  configOverride?: Partial<SystemConfig>;
  packId?: string;
  purposeId?: string;
  messages: ChatTurn[];
  workspaceSummary: string;
  recentArtifacts: Array<Pick<Artifact, 'id' | 'topic' | 'summary' | 'dateStr'>>;
  recentSignals: Array<Pick<MonitorEvent, 'content' | 'sourceName' | 'timestamp' | 'type'>>;
  retrievedContext: WorkspaceContextSnippet[];
}

export interface RouterBoardAgentRequest {
  workspace: Workspace;
  board: Pick<WorkspaceBoard, 'id' | 'workspaceId' | 'name' | 'presentationMode'>;
  configOverride?: Partial<SystemConfig>;
  packId?: string;
  purposeId?: string;
  userRequest: string;
  contextSnapshot: BoardAgentContextSnapshot;
}

export type NormalizedDateRangeConfig = DateRangeConfig | undefined;
