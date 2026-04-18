import type { AIProvider } from '../config/aiModels';
import type { AppIconId } from '../lib/appIcons';

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

export type SignalStatus = 'PENDING' | 'INVESTIGATED' | 'FLAGGED';
export type FollowUpKind = 'QUESTION' | 'TASK' | 'HYPOTHESIS' | 'GAP' | 'NEXT_STEP';
export type FollowUpStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export interface Signal {
  id: string;
  workspaceId: string;
  content: string;
  source: string;
  url?: string;
  timestamp: string;
  type: 'SOCIAL' | 'NEWS' | 'OFFICIAL';
  status: SignalStatus;
  threatLevel: 'INFO' | 'CAUTION' | 'CRITICAL';
  linkedArtifactId?: string;
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

export interface KeyFinding {
  id: string;
  workspaceId?: string;
  originArtifactId?: string;
  originSectionId?: string;
  title: string;
  summary: string;
  supportRefs?: string[];
  createdAt?: number;
  updatedAt?: number;
  order?: number;
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
  iconId?: AppIconId;
  metadata?: Record<string, unknown>;
}

export type EntityType = 'PERSON' | 'ORGANIZATION' | 'UNKNOWN';

export interface Entity {
  name: string;
  type: EntityType;
  role?: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  iconId?: AppIconId;
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
  iconId?: AppIconId;
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

export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  INVESTIGATION = 'INVESTIGATION',
  WORKSPACE = 'WORKSPACE',
  CHAT = 'CHAT',
  FILES = 'FILES',
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
  workspaceId?: string;
  topic: string;
  dateStr?: string;
  createdAt?: number;
  summary: string;
  agendas: string[];
  leads: string[];
  keyFindings?: KeyFinding[];
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

export interface WorkspaceTemplate {
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

export type EntityAliasMap = Record<string, string>;

export type InvestigationStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface WorkspaceRun {
  id: string;
  topic: string;
  status: InvestigationStatus;
  startTime: number;
  endTime?: number;
  workspaceId?: string;
  artifact?: Artifact;
  parentContext?: InvestigationContext;
  config?: InvestigationRunConfig;
  launchRequest?: InvestigationLaunchRequest;
  error?: string;
}
