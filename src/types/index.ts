import type { AIProvider } from '../config/aiModels';

export interface Source {
  title: string;
  url: string;
}

export type WorkspaceMode =
  | 'INVESTIGATION'
  | 'RESEARCH'
  | 'MONITORING'
  | 'BRIEFING'
  | 'DUE_DILIGENCE';

export type ArtifactType =
  | 'REPORT'
  | 'SYNTHESIS'
  | 'BRIEF'
  | 'DIGEST'
  | 'COMPARISON'
  | 'TIMELINE'
  | 'MONITOR_SNAPSHOT'
  | 'NOTE';

export type ArtifactSectionKind =
  | 'EXECUTIVE_SUMMARY'
  | 'KEY_FINDINGS'
  | 'ANOMALIES'
  | 'LEADS'
  | 'EVIDENCE'
  | 'TIMELINE'
  | 'METHODOLOGY'
  | 'LITERATURE_REVIEW'
  | 'IMPLICATIONS'
  | 'NEXT_STEPS'
  | 'CUSTOM';

export interface ArtifactSection {
  id: string;
  kind: ArtifactSectionKind;
  title: string;
  content?: string;
  items?: string[];
  order?: number;
}

export interface LabelProfile {
  id: string;
  workspaceLabel: string;
  workspaceLabelPlural: string;
  artifactLabel: string;
  artifactLabelPlural: string;
  detailViewLabel: string;
  followUpLabel: string;
  anomalyLabel: string;
  signalLabel: string;
  archiveLabel: string;
}

export interface PurposeProfile {
  id: string;
  name: string;
  description: string;
  promptDirective: string;
  recommendedArtifactType: ArtifactType;
  defaultSectionKinds: ArtifactSectionKind[];
}

// --- LEAD & HEADLINE TYPES ---

export type LeadStatus = 'PENDING' | 'INVESTIGATED' | 'FLAGGED';

export interface Headline {
  id: string;
  caseId: string;
  content: string;
  source: string;
  url?: string;
  timestamp: string;
  type: 'SOCIAL' | 'NEWS' | 'OFFICIAL';
  status: LeadStatus;
  threatLevel: 'INFO' | 'CAUTION' | 'CRITICAL';
  linkedReportId?: string;
}

export interface Case {
  id: string;
  scopeId?: string;
  title: string;
  status: 'ACTIVE' | 'CLOSED';
  dateOpened: string;
  createdAt?: number;
  updatedAt?: number;
  description?: string;
  headlines?: string[];
  mode?: WorkspaceMode;
  packId?: string;
  purposeId?: string;
  labelProfileId?: string;
  metadata?: Record<string, unknown>;
}

export type EntityType = 'PERSON' | 'ORGANIZATION' | 'UNKNOWN';

export interface Entity {
  name: string;
  type: EntityType;
  role?: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface ManualConnection {
  source: string;
  target: string;
  timestamp: number;
}

export type GraphNodeSubtype =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'UNKNOWN'
  | 'CONCEPT'
  | 'SOURCE';

export interface ManualNode {
  id: string;
  label: string;
  type: 'CASE' | 'ENTITY';
  subtype?: GraphNodeSubtype;
  timestamp: number;
}

export interface FeedItem {
  id: string;
  title: string;
  category: string;
  timestamp: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MonitorEvent {
  id: string;
  type: 'SOCIAL' | 'NEWS' | 'OFFICIAL';
  sourceName: string;
  content: string;
  timestamp: string;
  sentiment: 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE';
  threatLevel: 'INFO' | 'CAUTION' | 'CRITICAL';
  url?: string;
}

export type ChatSessionStatus = 'ACTIVE' | 'ARCHIVED';
export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type ChatMessageStatus = 'PENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ChatGenerationStatus = 'IDLE' | 'GENERATING' | 'CANCELLING' | 'FAILED';
export type ChatAttachmentKind =
  | 'WORKSPACE'
  | 'REPORT'
  | 'SECTION'
  | 'ENTITY'
  | 'HEADLINE'
  | 'SOURCE'
  | 'CUSTOM';

export type AgentActionType =
  | 'SEARCH_WORKSPACE'
  | 'FETCH_ARTIFACT_SUMMARY'
  | 'FETCH_FULL_ARTIFACT_TEXT'
  | 'FETCH_RECENT_SIGNALS'
  | 'CREATE_ARTIFACT_DRAFT'
  | 'APPEND_NOTE_TO_ARTIFACT'
  | 'CREATE_FOLLOW_UP_RUN';

export type AgentActionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface ChatSession {
  id: string;
  workspaceId: string;
  title: string;
  status: ChatSessionStatus;
  sourceReportId?: string;
  packId?: string;
  purposeId?: string;
  provider?: AIProvider;
  modelId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  kind: ChatAttachmentKind;
  title: string;
  refId?: string;
  refKind?: string;
  snippet?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  status: ChatMessageStatus;
  citations?: string[];
  attachments?: ChatAttachment[];
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AgentAction {
  id: string;
  sessionId: string;
  messageId?: string;
  type: AgentActionType;
  status: AgentActionStatus;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface ChatDraftArtifact {
  id: string;
  workspaceId: string;
  sourceMessageId: string;
  title: string;
  content: string;
  artifactType?: ArtifactType;
  citations?: string[];
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface ChatLaunchContext {
  sourceReportId?: string;
  entityName?: string;
  headlineId?: string;
}

export interface ChatOpenRequest {
  workspaceId: string;
  sessionId?: string;
  launchContext?: ChatLaunchContext;
}

export interface WorkspaceContextSnippet {
  id: string;
  kind: ChatAttachmentKind;
  title: string;
  snippet: string;
  refId?: string;
  refKind?: string;
  score: number;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceContextBundle {
  workspace: Case;
  summary: string;
  recentArtifacts: InvestigationReport[];
  recentHeadlines: Headline[];
  snippets: WorkspaceContextSnippet[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVESTIGATION = 'INVESTIGATION',
  CHAT = 'CHAT',
  ARCHIVES = 'ARCHIVES',
  NETWORK = 'NETWORK',
  LIVE_MONITOR = 'LIVE_MONITOR',
  SETTINGS = 'SETTINGS',
  TIMELINE = 'TIMELINE',
}

export type InvestigatorPersona =
  | 'FORENSIC_ACCOUNTANT'
  | 'JOURNALIST'
  | 'INTELLIGENCE_OFFICER'
  | 'CONSPIRACY_ANALYST';

export interface SystemConfig {
  provider: AIProvider;
  modelId: string;
  thinkingBudget: number;
  persona: string;
  searchDepth: 'STANDARD' | 'DEEP';
  autoNormalizeEntities?: boolean;
  quietMode?: boolean;
}

// --- INVESTIGATION SCOPE SYSTEM ---

export interface DateRangeConfig {
  strategy: 'RELATIVE' | 'ABSOLUTE' | 'NONE';
  relativeYears?: number;
  absoluteStart?: string;
  absoluteEnd?: string;
}

export interface SourceCategory {
  name: string;
  sources: { label: string; url?: string; handle?: string }[];
}

export interface PersonaDefinition {
  id: string;
  label: string;
  instruction: string;
}

export interface InvestigationScope {
  id: string;
  name: string;
  description: string;
  domainContext: string;
  investigationObjective: string;
  defaultDateRange?: DateRangeConfig;
  suggestedSources: SourceCategory[];
  categories: string[];
  personas: PersonaDefinition[];
  defaultPersona?: string;
  accentColor?: string;
  icon?: string;
  isBuiltIn?: boolean;
  workspaceMode?: WorkspaceMode;
  labelProfileId?: string;
  supportedPurposeIds?: string[];
  defaultPurposeId?: string;
  defaultArtifactType?: ArtifactType;
}

export interface DomainPack extends InvestigationScope {
  workspaceMode: WorkspaceMode;
  labelProfileId: string;
  supportedPurposeIds: string[];
  defaultPurposeId: string;
  defaultArtifactType: ArtifactType;
}

export interface DateRangeOverride {
  start?: string;
  end?: string;
}

export interface InvestigationContext {
  topic: string;
  summary: string;
}

export interface InvestigationRunConfig extends Partial<SystemConfig> {
  scopeId?: string;
  scopeName?: string;
  packId?: string;
  packName?: string;
  purposeId?: string;
  purposeName?: string;
  artifactType?: ArtifactType;
  labelProfileId?: string;
  outputProfileId?: string;
  dateRangeOverride?: DateRangeOverride;
  preseededEntities?: ManualNode[];
  launchSource?: string;
  sourceSignalId?: string;
  parentArtifactId?: string;
  parentRunId?: string;
  sourceRunId?: string;
  producedArtifactId?: string;
}

export interface InvestigationLaunchRequest {
  topic: string;
  parentContext?: InvestigationContext;
  configOverride?: Partial<SystemConfig>;
  scope?: InvestigationScope;
  packId?: string;
  purposeId?: string;
  artifactType?: ArtifactType;
  labelProfileId?: string;
  dateRangeOverride?: DateRangeOverride;
  preseededEntities?: ManualNode[];
  switchToView?: boolean;
  launchSource?: string;
  sourceSignalId?: string;
  parentArtifactId?: string;
  parentRunId?: string;
}

export interface InvestigationReport {
  id?: string;
  caseId?: string;
  topic: string;
  dateStr?: string;
  createdAt?: number;
  summary: string;
  agendas: string[];
  leads: string[];
  sections?: ArtifactSection[];
  followUps?: string[];
  artifactType?: ArtifactType;
  entities: Entity[];
  sources: Source[];
  rawText: string;
  parentTopic?: string;
  packId?: string;
  purposeId?: string;
  labelProfileId?: string;
  metadata?: Record<string, unknown>;
  config?: InvestigationRunConfig;
}

export interface CaseTemplate {
  id: string;
  name: string;
  description?: string;
  topic: string;
  config: Partial<SystemConfig> & Partial<InvestigationRunConfig>;
  createdAt: number;
  scopeId?: string;
  packId?: string;
  purposeId?: string;
  artifactType?: ArtifactType;
  labelProfileId?: string;
}

// Key is the variation, value is the canonical entity.
export type EntityAliasMap = Record<string, string>;

// --- TASK SYSTEM ---

export type InvestigationStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface InvestigationTask {
  id: string;
  topic: string;
  status: InvestigationStatus;
  startTime: number;
  endTime?: number;
  workspaceId?: string;
  report?: InvestigationReport;
  parentContext?: InvestigationContext;
  config?: InvestigationRunConfig;
  launchRequest?: InvestigationLaunchRequest;
  error?: string;
}

export type Workspace = Case;
export type Artifact = InvestigationReport;
export type WorkspaceRun = InvestigationTask;

export type TimelineTrack = 'SIGNAL' | 'RUN' | 'ARTIFACT' | 'CHAT' | 'ENTITY';

export type TimelineEventType =
  | 'SIGNAL_SAVED'
  | 'RUN_STARTED'
  | 'RUN_COMPLETED'
  | 'RUN_FAILED'
  | 'ARTIFACT_CREATED'
  | 'ENTITY_FIRST_SEEN'
  | 'ENTITY_MENTION_THRESHOLD'
  | 'ENTITY_REAPPEARED'
  | 'CHAT_SESSION_STARTED'
  | 'CHAT_SEARCHED_WORKSPACE'
  | 'CHAT_ARTIFACT_SAVED'
  | 'CHAT_ARTIFACT_NOTED'
  | 'CHAT_FOLLOW_UP_LAUNCHED';

export interface TimelineEvent {
  id: string;
  occurredAt: number;
  track: TimelineTrack;
  type: TimelineEventType;
  workspaceId: string;
  title: string;
  summary?: string;
  refId?: string;
  refKind?: 'SIGNAL' | 'RUN' | 'ARTIFACT' | 'CHAT_SESSION' | 'CHAT_ACTION' | 'ENTITY';
  parentRefId?: string;
  badges?: string[];
  searchText?: string;
  metadata?: Record<string, unknown>;
}

export type TimelineRange = 'ALL' | '7D' | '30D' | '90D';

export interface TimelineFilters {
  range: TimelineRange;
  tracks: TimelineTrack[];
}

export interface TimelineQueryState {
  workspaceId?: string;
  search: string;
  filters: TimelineFilters;
  focusedTrack?: TimelineTrack | 'ALL';
  focusedRefId?: string;
}

export interface TimelineSelectionState {
  selectedEventId: string | null;
}

export interface Signal {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  category?: string;
  signalType?: string;
  sourceName?: string;
  severity?: string;
  url?: string;
  workspaceId?: string;
  artifactId?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceDataChatSnapshot {
  sessions: ChatSession[];
  messages: ChatMessage[];
  actions: AgentAction[];
}

export interface WorkspaceDataSignalSnapshot {
  headlines: Headline[];
}

export interface WorkspaceDataGraphSnapshot {
  manualNodes: ManualNode[];
  manualLinks: ManualConnection[];
}

export interface WorkspaceDataBackupMetadata {
  kind: 'SHERLOCK_WORKSPACE_DATA';
  formatVersion: 1;
  exportedAt: string;
}

export interface WorkspaceDataBackup {
  workspaces: Workspace[];
  artifacts: Artifact[];
  runs: WorkspaceRun[];
  chat: WorkspaceDataChatSnapshot;
  signals: WorkspaceDataSignalSnapshot;
  graph: WorkspaceDataGraphSnapshot;
  templates: CaseTemplate[];
  metadata: WorkspaceDataBackupMetadata;
}
