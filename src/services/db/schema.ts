import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

// --- SCOPES ---
export const scopes = sqliteTable('scopes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').default('custom'), // 'built-in' | 'custom'
  configJson: text('config_json').notNull(), // Stores JSON string of InvestigationScope
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// --- CASES ---
export const cases = sqliteTable('cases', {
  id: text('id').primaryKey(),
  scopeId: text('scope_id').references(() => scopes.id),
  title: text('title').notNull(),
  status: text('status').notNull(), // 'ACTIVE' | 'CLOSED'
  dateOpened: text('date_opened').notNull(),
  description: text('description'),
  mode: text('mode'),
  packId: text('pack_id'),
  purposeId: text('purpose_id'),
  labelProfileId: text('label_profile_id'),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// --- REPORTS (Investigated Items) ---
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  caseId: text('case_id').references(() => cases.id),
  topic: text('topic').notNull(),
  dateStr: text('date_str'),
  summary: text('summary'),
  rawText: text('raw_text'),
  artifactType: text('artifact_type'),
  packId: text('pack_id'),
  purposeId: text('purpose_id'),
  labelProfileId: text('label_profile_id'),
  metadataJson: text('metadata_json'),
  configJson: text('config_json'), // Stores snapshot of config used
  createdAt: integer('created_at').notNull(),
});

export const artifactSections = sqliteTable(
  'artifact_sections',
  {
    id: text('id').notNull(),
    reportId: text('report_id')
      .notNull()
      .references(() => reports.id),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    itemsJson: text('items_json'),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.reportId, table.id] }),
  })
);

export const artifactEvidence = sqliteTable(
  'artifact_evidence',
  {
    id: text('id').notNull(),
    reportId: text('report_id')
      .notNull()
      .references(() => reports.id),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    quote: text('quote'),
    sourceTitle: text('source_title'),
    sourceUrl: text('source_url'),
    sectionId: text('section_id'),
    tagsJson: text('tags_json'),
    metadataJson: text('metadata_json'),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.reportId, table.id] }),
  })
);

// --- ENTITIES ---
export const entities = sqliteTable('entities', {
  id: text('id').primaryKey(),
  reportId: text('report_id').references(() => reports.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'PERSON' | 'ORGANIZATION' | 'UNKNOWN'
  role: text('role'),
  sentiment: text('sentiment'),
});

// --- SOURCES ---
export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  reportId: text('report_id').references(() => reports.id),
  title: text('title').notNull(),
  url: text('url').notNull(),
});

// --- LEADS ---
export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  caseId: text('case_id').references(() => cases.id),
  content: text('content').notNull(),
  source: text('source'),
  type: text('type'),
  url: text('url'),
  status: text('status').notNull(), // 'PENDING' | 'INVESTIGATED' | 'FLAGGED'
  threatLevel: text('threat_level'),
  linkedReportId: text('linked_report_id'),
  timestamp: text('timestamp'),
});

// --- TASKS (Async Queue) ---
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  caseId: text('case_id').references(() => cases.id),
  topic: text('topic').notNull(),
  status: text('status').notNull(), // 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  error: text('error'),
  packId: text('pack_id'),
  purposeId: text('purpose_id'),
  artifactType: text('artifact_type'),
  labelProfileId: text('label_profile_id'),
  configJson: text('config_json'),
  startTime: integer('start_time'),
  endTime: integer('end_time'),
});

// --- CHAT ---
export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => cases.id),
  title: text('title').notNull(),
  status: text('status').notNull(),
  sourceReportId: text('source_report_id').references(() => reports.id),
  packId: text('pack_id'),
  purposeId: text('purpose_id'),
  provider: text('provider'),
  modelId: text('model_id'),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessions.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  status: text('status').notNull(),
  citationsJson: text('citations_json'),
  metadataJson: text('metadata_json'),
  error: text('error'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const chatMessageAttachments = sqliteTable('chat_message_attachments', {
  id: text('id').primaryKey(),
  messageId: text('message_id')
    .notNull()
    .references(() => chatMessages.id),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  refId: text('ref_id'),
  refKind: text('ref_kind'),
  snippet: text('snippet'),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at').notNull(),
});

export const chatActions = sqliteTable('chat_actions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessions.id),
  messageId: text('message_id').references(() => chatMessages.id),
  type: text('type').notNull(),
  status: text('status').notNull(),
  inputJson: text('input_json'),
  resultJson: text('result_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// --- SETTINGS (Global KV) ---
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// --- TEMPLATES ---
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  topic: text('topic').notNull(),
  configJson: text('config_json').notNull(),
  createdAt: integer('created_at').notNull(),
  scopeId: text('scope_id'),
});

// --- MANUAL DATA (Graph) ---
export const manualNodes = sqliteTable('manual_nodes', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  type: text('type').notNull(), // 'CASE' | 'ENTITY'
  subtype: text('subtype'),
  timestamp: integer('timestamp').notNull(),
});

export const manualLinks = sqliteTable(
  'manual_links',
  {
    source: text('source').notNull(),
    target: text('target').notNull(),
    timestamp: integer('timestamp').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.source, table.target] }),
  })
);
