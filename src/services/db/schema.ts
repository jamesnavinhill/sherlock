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
    parentTopic: text('parent_topic'),
    configJson: text('config_json'), // Stores snapshot of config used
    createdAt: integer('created_at').notNull(),
});

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
    configJson: text('config_json'),
    startTime: integer('start_time'),
    endTime: integer('end_time'),
});

// --- FEED ITEMS ---
export const feedItems = sqliteTable('feed_items', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    content: text('content'),
    url: text('url'),
    riskLevel: text('risk_level').default('LOW'),
    timestamp: text('timestamp').notNull(),
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

export const manualLinks = sqliteTable('manual_links', {
    source: text('source').notNull(),
    target: text('target').notNull(),
    timestamp: integer('timestamp').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.source, table.target] }),
}));
