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
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  scopeId: text('scope_id').references(() => scopes.id),
  title: text('title').notNull(),
  displayTitle: text('display_title'),
  launchTopic: text('launch_topic'),
  launchAngle: text('launch_angle'),
  prioritySourcesSummary: text('priority_sources_summary'),
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
export const artifacts = sqliteTable('artifacts', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
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

export const followUps = sqliteTable('follow_ups', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
  artifactId: text('artifact_id')
    .notNull()
    .references(() => artifacts.id),
  sectionId: text('section_id'),
  sourceSignalId: text('source_signal_id'),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  actionText: text('action_text').notNull(),
  status: text('status').notNull(),
  entityRefsJson: text('entity_refs_json'),
  sourceRefsJson: text('source_refs_json'),
  resolvedByArtifactId: text('resolved_by_artifact_id'),
  metadataJson: text('metadata_json'),
  sortOrder: integer('sort_order').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const artifactSections = sqliteTable(
  'artifact_sections',
  {
    id: text('id').notNull(),
    reportId: text('artifact_id')
      .notNull()
      .references(() => artifacts.id),
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
    reportId: text('artifact_id')
      .notNull()
      .references(() => artifacts.id),
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
  reportId: text('artifact_id').references(() => artifacts.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'PERSON' | 'ORGANIZATION' | 'UNKNOWN'
  role: text('role'),
  sentiment: text('sentiment'),
});

// --- SOURCES ---
export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  reportId: text('artifact_id').references(() => artifacts.id),
  title: text('title').notNull(),
  url: text('url').notNull(),
});

// --- LEADS ---
export const signals = sqliteTable('signals', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
  content: text('content').notNull(),
  source: text('source'),
  type: text('type'),
  url: text('url'),
  status: text('status').notNull(), // 'PENDING' | 'INVESTIGATED' | 'FLAGGED'
  threatLevel: text('threat_level'),
  linkedArtifactId: text('linked_artifact_id'),
  timestamp: text('timestamp'),
});

// --- TASKS (Async Queue) ---
export const workspaceRuns = sqliteTable('workspace_runs', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
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
    .references(() => workspaces.id),
  title: text('title').notNull(),
  status: text('status').notNull(),
  sourceArtifactId: text('source_artifact_id').references(() => artifacts.id),
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

// --- WORKSPACE SURFACE ---
export const workspaceItems = sqliteTable('workspace_items', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  textContent: text('text_content'),
  url: text('url'),
  mimeType: text('mime_type'),
  fileName: text('file_name'),
  sizeBytes: integer('size_bytes'),
  previewUrl: text('preview_url'),
  tagsJson: text('tags_json'),
  provenanceJson: text('provenance_json'),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const workspaceBoards = sqliteTable('workspace_boards', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull(),
  presentationMode: integer('presentation_mode').notNull().default(0),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const workspaceBoardDocuments = sqliteTable('workspace_board_documents', {
  boardId: text('board_id')
    .primaryKey()
    .references(() => workspaceBoards.id),
  snapshotJson: text('snapshot_json'),
  updatedAt: integer('updated_at').notNull(),
});

export const boardAgentSessions = sqliteTable('board_agent_sessions', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  boardId: text('board_id')
    .notNull()
    .references(() => workspaceBoards.id),
  title: text('title').notNull(),
  status: text('status').notNull(),
  request: text('request').notNull(),
  requestState: text('request_state').notNull(),
  provider: text('provider'),
  modelId: text('model_id'),
  contextSnapshotId: text('context_snapshot_id'),
  lastError: text('last_error'),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  startedAt: integer('started_at'),
  completedAt: integer('completed_at'),
});

export const boardAgentActions = sqliteTable('board_agent_actions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => boardAgentSessions.id),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  boardId: text('board_id')
    .notNull()
    .references(() => workspaceBoards.id),
  type: text('type').notNull(),
  status: text('status').notNull(),
  inputJson: text('input_json'),
  normalizedInputJson: text('normalized_input_json'),
  resultJson: text('result_json'),
  affectedCanonicalIdsJson: text('affected_canonical_ids_json'),
  affectedBoardShapeIdsJson: text('affected_board_shape_ids_json'),
  error: text('error'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
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
