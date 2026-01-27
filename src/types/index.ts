

export interface Source {
  title: string;
  url: string;
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
  headlines?: string[]; // IDs of associated headlines
}

export type EntityType = 'PERSON' | 'ORGANIZATION' | 'UNKNOWN';

export interface Entity {
  name: string;
  type: EntityType;
  role?: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface InvestigationReport {
  id?: string;
  caseId?: string; // Link to parent Case
  topic: string;
  dateStr?: string;
  summary: string;
  agendas: string[];
  leads: string[];
  entities: Entity[]; // Updated from string[]
  sources: Source[];
  rawText: string;
  parentTopic?: string;
  config?: Partial<SystemConfig>;
}

export interface ManualConnection {
  source: string;
  target: string;
  timestamp: number;
}

export interface ManualNode {
  id: string;
  label: string;
  type: 'CASE' | 'ENTITY';
  subtype?: 'PERSON' | 'ORGANIZATION'; // Entity subtype for manual nodes
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

export type InvestigatorPersona = 'FORENSIC_ACCOUNTANT' | 'JOURNALIST' | 'INTELLIGENCE_OFFICER' | 'CONSPIRACY_ANALYST';

export interface SystemConfig {
  modelId: string;
  thinkingBudget: number; // 0 to max
  persona: string; // Now references PersonaDefinition.id from scope
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
}

export interface CaseTemplate {
  id: string;
  name: string;
  description?: string;
  topic: string;
  config: Partial<SystemConfig>;
  createdAt: number;
  scopeId?: string; // Reference to InvestigationScope
}

// Key is the "Variation" (e.g. "Google Inc"), Value is the "Canonical" (e.g. "Google")
export type EntityAliasMap = Record<string, string>;

// --- NEW TASK SYSTEM ---

export type InvestigationStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface InvestigationTask {
  id: string;
  topic: string;
  status: InvestigationStatus;
  startTime: number;
  endTime?: number;
  report?: InvestigationReport;
  parentContext?: { topic: string, summary: string };
  config?: Partial<SystemConfig>;
  error?: string;
}