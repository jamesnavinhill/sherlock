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

export type ArtifactEvidenceKind =
  | 'SOURCE'
  | 'QUOTE'
  | 'FINDING'
  | 'DATA_POINT'
  | 'TIMELINE_EVENT'
  | 'METHOD';

export interface ArtifactEvidence {
  id: string;
  kind: ArtifactEvidenceKind;
  title: string;
  summary: string;
  quote?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  sectionId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  order?: number;
}

export interface ProvenanceCitation {
  url: string;
  title?: string;
  content?: string;
  startIndex?: number;
  endIndex?: number;
}

export interface ArtifactProvenance {
  provider: AIProvider;
  modelId: string;
  generatedAt: string;
  requestId?: string;
  warnings?: string[];
  citations?: ProvenanceCitation[];
  usage?: Record<string, unknown>;
  search?: {
    enabled: boolean;
    provider?: 'GOOGLE' | 'OPENROUTER';
    engine?: string;
    webSearchRequests?: number;
    searchContextSize?: string;
    allowedDomains?: string[];
    excludedDomains?: string[];
  };
  metadata?: Record<string, unknown>;
}

export type ArtifactGenerationMode = 'SINGLE_PASS' | 'STAGED';

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

// --- SIGNAL & FOLLOW-UP TYPES ---

export type SignalStatus = 'PENDING' | 'INVESTIGATED' | 'FLAGGED';
export type FollowUpKind = 'QUESTION' | 'TASK' | 'HYPOTHESIS' | 'GAP' | 'NEXT_STEP';
export type FollowUpStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export interface Signal {
  id: string;
  caseId: string;
  content: string;
  source: string;
  url?: string;
  timestamp: string;
  type: 'SOCIAL' | 'NEWS' | 'OFFICIAL';
  status: SignalStatus;
  threatLevel: 'INFO' | 'CAUTION' | 'CRITICAL';
  linkedReportId?: string;
}

export interface FollowUp {
  id: string;
  workspaceId?: string;
  originArtifactId?: string;
  originSectionId?: string;
  sourceSignalId?: string;
  kind: FollowUpKind;
  title: string;
  actionText: string;
  status: FollowUpStatus;
  entityRefs?: string[];
  sourceRefs?: string[];
  resolvedByArtifactId?: string;
  createdAt?: number;
  updatedAt?: number;
  metadata?: Record<string, unknown>;
}

export type Headline = Signal;
export type LeadStatus = SignalStatus;

export interface Workspace {
  id: string;
  scopeId?: string;
  title: string;
  displayTitle?: string;
  launchTopic?: string;
  launchAngle?: string;
  prioritySourcesSummary?: string;
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

export type GraphNodeSubtype = 'PERSON' | 'ORGANIZATION' | 'UNKNOWN' | 'CONCEPT' | 'SOURCE';

export interface ManualNode {
  id: string;
  label: string;
  type: 'CASE' | 'ENTITY';
  subtype?: GraphNodeSubtype;
  timestamp: number;
}

export type WorkspaceCanonicalRefKind =
  | 'ARTIFACT'
  | 'ENTITY'
  | 'SOURCE'
  | 'SIGNAL'
  | 'HEADLINE'
  | 'WORKSPACE_ITEM';

export type WorkspaceItemKind = 'NOTE' | 'LINK' | 'FILE' | 'MEDIA' | 'EXCERPT';

export interface WorkspaceItemProvenance {
  source: 'USER' | 'CHAT' | 'REPORT' | 'TIMELINE' | 'NETWORK' | 'INGESTION' | 'BOARD_AGENT';
  sourceMessageId?: string;
  sourceSessionId?: string;
  sourceReportId?: string;
  sourceSignalId?: string;
  sourceHeadlineId?: string;
  sourceBoardId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceItem {
  id: string;
  workspaceId: string;
  kind: WorkspaceItemKind;
  title: string;
  description?: string;
  textContent?: string;
  url?: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
  previewUrl?: string;
  tags?: string[];
  provenance?: WorkspaceItemProvenance;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceBoard {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  sortOrder: number;
  presentationMode?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceBoardDocument {
  boardId: string;
  snapshot: unknown | null;
  updatedAt: number;
}

export interface WorkspaceBoardItemReference {
  workspaceId: string;
  refKind: WorkspaceCanonicalRefKind;
  refId: string;
  title: string;
  workspaceItemKind?: WorkspaceItemKind;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceBoardPlacementRequest {
  workspaceId: string;
  boardId?: string;
  item: WorkspaceBoardItemReference;
  openInBoard?: boolean;
}

export type BoardAgentSessionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type BoardAgentRequestState =
  | 'QUEUED'
  | 'ASSEMBLING_CONTEXT'
  | 'STREAMING'
  | 'EXECUTING_ACTIONS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type BoardAgentActionType =
  | 'MESSAGE'
  | 'THINK'
  | 'UPDATE_TODO'
  | 'SET_VIEWPORT'
  | 'PLACE_LINKED_CARD'
  | 'MOVE_SHAPES'
  | 'ALIGN_SHAPES'
  | 'DISTRIBUTE_SHAPES'
  | 'GROUP_SELECTION'
  | 'CREATE_CONNECTOR'
  | 'CREATE_BOARD_NOTE'
  | 'CREATE_WORKSPACE_NOTE'
  | 'PROMOTE_EXCERPT'
  | 'ATTACH_ARTIFACT_SUMMARY'
  | 'CREATE_ARTIFACT_DRAFT'
  | 'APPEND_NOTE_TO_ARTIFACT'
  | 'CREATE_FOLLOW_UP_RUN'
  | 'SCHEDULE_FOLLOW_UP'
  | 'REVIEW_REGION';

export type BoardAgentActionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED';

export type BoardAgentContextPartKind =
  | 'USER_REQUEST'
  | 'VIEWPORT_BOUNDS'
  | 'SELECTION_SUMMARY'
  | 'VISIBLE_SHAPE_SUMMARY'
  | 'PERIPHERAL_CLUSTER_SUMMARY'
  | 'LINKED_RECORD_SUMMARY'
  | 'RECENT_AGENT_HISTORY'
  | 'RECENT_USER_BOARD_ACTIONS'
  | 'TODO'
  | 'SYSTEM_METADATA';

export interface BoardAgentContextPart {
  id: string;
  kind: BoardAgentContextPartKind;
  title: string;
  content: string;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface BoardAgentContextSnapshot {
  id: string;
  workspaceId: string;
  boardId: string;
  sessionId?: string;
  request: string;
  selectedShapeIds: string[];
  visibleShapeIds: string[];
  parts: BoardAgentContextPart[];
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface BoardAgentRequest {
  id: string;
  workspaceId: string;
  boardId: string;
  sessionId?: string;
  prompt: string;
  state: BoardAgentRequestState;
  selectedShapeIds?: string[];
  viewportBounds?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface BoardAgentSession {
  id: string;
  workspaceId: string;
  boardId: string;
  title: string;
  status: BoardAgentSessionStatus;
  request: string;
  requestState: BoardAgentRequestState;
  provider?: AIProvider;
  modelId?: string;
  contextSnapshotId?: string;
  lastError?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface BoardAgentAction {
  id: string;
  sessionId: string;
  workspaceId: string;
  boardId: string;
  type: BoardAgentActionType;
  status: BoardAgentActionStatus;
  input?: Record<string, unknown>;
  normalizedInput?: Record<string, unknown>;
  result?: Record<string, unknown>;
  affectedCanonicalIds?: string[];
  affectedBoardShapeIds?: string[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BoardAgentResultEnvelope {
  session: BoardAgentSession;
  contextSnapshot?: BoardAgentContextSnapshot;
  actions: BoardAgentAction[];
  message?: string;
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
  | 'SIGNAL'
  | 'HEADLINE'
  | 'SOURCE'
  | 'NOTE'
  | 'LINK'
  | 'FILE'
  | 'MEDIA'
  | 'EXCERPT'
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
  signalId?: string;
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
  workspace: Workspace;
  summary: string;
  recentArtifacts: Artifact[];
  recentSignals: Signal[];
  snippets: WorkspaceContextSnippet[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVESTIGATION = 'INVESTIGATION',
  WORKSPACE = 'WORKSPACE',
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
  generationMode?: ArtifactGenerationMode;
  openRouter?: {
    webSearchEnabled: boolean;
    engine: 'auto' | 'native' | 'exa' | 'firecrawl' | 'parallel';
    maxResults: number;
    maxTotalResults: number;
    searchContextSize: 'low' | 'medium' | 'high';
    allowedDomains: string[];
    excludedDomains: string[];
  };
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
  generationMode?: ArtifactGenerationMode;
  outputProfileId?: string;
  dateRangeOverride?: DateRangeOverride;
  preseededEntities?: ManualNode[];
  launchSource?: string;
  sourceSignalId?: string;
  sourceFollowUpId?: string;
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
  sourceFollowUpId?: string;
  parentArtifactId?: string;
  parentRunId?: string;
}

export interface Artifact {
  id?: string;
  caseId?: string;
  topic: string;
  dateStr?: string;
  createdAt?: number;
  summary: string;
  agendas: string[];
  leads: string[];
  sections?: ArtifactSection[];
  followUps?: FollowUp[];
  artifactType?: ArtifactType;
  entities: Entity[];
  sources: Source[];
  evidence?: ArtifactEvidence[];
  provenance?: ArtifactProvenance;
  rawText: string;
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

export interface WorkspaceRun {
  id: string;
  topic: string;
  status: InvestigationStatus;
  startTime: number;
  endTime?: number;
  workspaceId?: string;
  report?: Artifact;
  parentContext?: InvestigationContext;
  config?: InvestigationRunConfig;
  launchRequest?: InvestigationLaunchRequest;
  error?: string;
}

export interface TimelineSnapshotMetadata {
  generatedAt: string;
  range: TimelineRange;
  tracks: TimelineTrack[];
  search: string;
  focusedTrack?: TimelineTrack | 'ALL';
  focusedRefId?: string;
}

export interface TimelineSnapshot {
  workspace: Workspace;
  events: TimelineEvent[];
  metadata: TimelineSnapshotMetadata;
}

export type TimelineTrack = 'SIGNAL' | 'RUN' | 'ARTIFACT' | 'CHAT' | 'ENTITY' | 'ITEM';

export type TimelineEventType =
  | 'SIGNAL_SAVED'
  | 'RUN_STARTED'
  | 'RUN_COMPLETED'
  | 'RUN_FAILED'
  | 'ARTIFACT_CREATED'
  | 'ITEM_CREATED'
  | 'ITEM_PROMOTED'
  | 'ITEM_UPDATED'
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
  refKind?:
    | 'SIGNAL'
    | 'HEADLINE'
    | 'RUN'
    | 'ARTIFACT'
    | 'WORKSPACE_ITEM'
    | 'CHAT_SESSION'
    | 'CHAT_ACTION'
    | 'ENTITY';
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

export interface WorkspaceDataChatSnapshot {
  sessions: ChatSession[];
  messages: ChatMessage[];
  actions: AgentAction[];
}

export interface WorkspaceDataSignalSnapshot {
  signals: Signal[];
  headlines?: Signal[];
}

export interface WorkspaceDataBoardAgentSnapshot {
  sessions: BoardAgentSession[];
  actions: BoardAgentAction[];
}

export interface WorkspaceDataGraphSnapshot {
  manualNodes: ManualNode[];
  manualLinks: ManualConnection[];
}

export interface WorkspaceDataWorkspaceSurfaceSnapshot {
  items: WorkspaceItem[];
  boards: WorkspaceBoard[];
  boardDocuments: WorkspaceBoardDocument[];
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
  boardAgent: WorkspaceDataBoardAgentSnapshot;
  signals: WorkspaceDataSignalSnapshot;
  graph: WorkspaceDataGraphSnapshot;
  workspaceSurface: WorkspaceDataWorkspaceSurfaceSnapshot;
  templates: CaseTemplate[];
  metadata: WorkspaceDataBackupMetadata;
}
