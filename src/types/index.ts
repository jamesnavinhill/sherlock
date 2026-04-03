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
  title: string;
  status: 'ACTIVE' | 'CLOSED';
  dateOpened: string;
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

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVESTIGATION = 'INVESTIGATION',
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
}

export interface InvestigationReport {
  id?: string;
  caseId?: string;
  topic: string;
  dateStr?: string;
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
  report?: InvestigationReport;
  parentContext?: InvestigationContext;
  config?: InvestigationRunConfig;
  launchRequest?: InvestigationLaunchRequest;
  error?: string;
}

export type Workspace = Case;
export type Artifact = InvestigationReport;
export type WorkspaceRun = InvestigationTask;

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
