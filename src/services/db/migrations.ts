import { SCHEMA_SQL } from './migrations_sql';
import { buildArtifactKeyFindings } from '../../domain';
import type { ArtifactSection } from '../../types';

type SQLiteExecCallback = (row: unknown[], columns?: string[]) => void;

export interface SQLiteMigrationApi {
  exec: (db: number, sql: string, callback?: SQLiteExecCallback) => Promise<unknown> | unknown;
}

interface DbMigration {
  id: number;
  name: string;
  apply: (api: SQLiteMigrationApi, db: number) => Promise<void>;
}

const MIGRATION_TABLE_NAME = '__sherlock_schema_migrations';

export const ARTIFACT_SECTIONS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS "artifact_sections" (
    "id" text NOT NULL,
    "artifact_id" text NOT NULL,
    "kind" text NOT NULL,
    "title" text NOT NULL,
    "content" text,
    "items_json" text,
    "sort_order" integer NOT NULL,
    PRIMARY KEY ("artifact_id", "id"),
    FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON UPDATE no action ON DELETE no action
);`;

export const KEY_FINDINGS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS "key_findings" (
    "id" text PRIMARY KEY NOT NULL,
    "workspace_id" text,
    "artifact_id" text NOT NULL,
    "section_id" text,
    "title" text NOT NULL,
    "summary" text NOT NULL,
    "support_refs_json" text,
    "metadata_json" text,
    "sort_order" integer NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL,
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON UPDATE no action ON DELETE no action,
    FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON UPDATE no action ON DELETE no action
);`;

const safeParseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeMigrationText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeMigrationText(entry)).filter(Boolean).join(' ').trim();
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return normalizeMigrationText(
      record.text ?? record.content ?? record.summary ?? record.title ?? record.label
    );
  }
  return '';
};

const toMigrationStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => normalizeMigrationText(entry)).filter((entry) => entry.length > 0);
};

const escapeSqlString = (value: string) => value.replace(/'/g, "''");

const toSqlText = (value: string | null | undefined) =>
  value === null || value === undefined ? 'NULL' : `'${escapeSqlString(value)}'`;

const toSqlInteger = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? String(Math.trunc(value)) : 'NULL';

const toSqlJson = (value: unknown) => {
  if (value === null || value === undefined) return 'NULL';
  return toSqlText(JSON.stringify(value));
};

const runKeyFindingsCutover = async (api: SQLiteMigrationApi, db: number): Promise<void> => {
  await api.exec(db, KEY_FINDINGS_TABLE_SQL);

  const artifactRows: Array<{
    id: string;
    workspaceId: string | null;
    rawText: string | null;
    createdAt: number | null;
  }> = [];
  const sectionsByArtifactId = new Map<string, ArtifactSection[]>();
  const existingArtifactIds = new Set<string>();

  await api.exec(
    db,
    `SELECT "id", "workspace_id", "raw_text", "created_at" FROM "artifacts";`,
    (row: unknown[]) => {
      const id = typeof row[0] === 'string' ? row[0] : '';
      if (!id) return;
      artifactRows.push({
        id,
        workspaceId: typeof row[1] === 'string' ? row[1] : null,
        rawText: typeof row[2] === 'string' ? row[2] : null,
        createdAt: typeof row[3] === 'number' ? row[3] : null,
      });
    }
  );

  await api.exec(
    db,
    `SELECT "artifact_id", "id", "kind", "title", "content", "items_json", "sort_order"
     FROM "artifact_sections"
     WHERE "kind" = 'KEY_FINDINGS';`,
    (row: unknown[]) => {
      const artifactId = typeof row[0] === 'string' ? row[0] : '';
      if (!artifactId) return;
      const current = sectionsByArtifactId.get(artifactId) || [];
      current.push({
        id: typeof row[1] === 'string' ? row[1] : `section-key_findings-${current.length}`,
        kind: 'KEY_FINDINGS',
        title: typeof row[3] === 'string' ? row[3] : 'Key Findings',
        content: typeof row[4] === 'string' ? row[4] : undefined,
        items: safeParseJson<string[]>(typeof row[5] === 'string' ? row[5] : null, []),
        order: typeof row[6] === 'number' ? row[6] : current.length,
      });
      sectionsByArtifactId.set(artifactId, current);
    }
  );

  await api.exec(
    db,
    `SELECT DISTINCT "artifact_id" FROM "key_findings";`,
    (row: unknown[]) => {
      const artifactId = typeof row[0] === 'string' ? row[0] : '';
      if (artifactId) {
        existingArtifactIds.add(artifactId);
      }
    }
  );

  for (const artifact of artifactRows) {
    if (existingArtifactIds.has(artifact.id)) {
      continue;
    }

    const rawPayload = safeParseJson<Record<string, unknown>>(artifact.rawText, {});
    const keyFindings = buildArtifactKeyFindings({
      keyFindings: rawPayload.keyFindings,
      sections: sectionsByArtifactId.get(artifact.id) || [],
      legacyAgendas: toMigrationStringList(rawPayload.agendas),
      artifactId: artifact.id,
      workspaceId: artifact.workspaceId || undefined,
      createdAt: artifact.createdAt ?? Date.now(),
    });

    for (const [index, finding] of keyFindings.entries()) {
      await api.exec(
        db,
        `INSERT OR IGNORE INTO "key_findings" (
          "id",
          "workspace_id",
          "artifact_id",
          "section_id",
          "title",
          "summary",
          "support_refs_json",
          "metadata_json",
          "sort_order",
          "created_at",
          "updated_at"
        ) VALUES (
          ${toSqlText(finding.id)},
          ${toSqlText(finding.workspaceId)},
          ${toSqlText(finding.originArtifactId || artifact.id)},
          ${toSqlText(finding.originSectionId)},
          ${toSqlText(finding.title)},
          ${toSqlText(finding.summary)},
          ${toSqlJson(finding.supportRefs)},
          ${toSqlJson(finding.metadata)},
          ${toSqlInteger(finding.order ?? index)},
          ${toSqlInteger(finding.createdAt ?? artifact.createdAt ?? Date.now())},
          ${toSqlInteger(finding.updatedAt ?? artifact.createdAt ?? Date.now())}
        );`
      );
    }
  }
};

export const artifactSectionsTableRequiresUpgrade = (
  tableSql: string | null | undefined
): boolean => {
  if (!tableSql) return false;

  const normalizedSql = tableSql.replace(/\s+/g, ' ').trim().toLowerCase();
  return (
    normalizedSql.includes('create table') &&
    normalizedSql.includes('artifact_sections') &&
    normalizedSql.includes('"id" text primary key')
  );
};

export const ensureArtifactSectionsCompositeKey = async (
  api: SQLiteMigrationApi,
  db: number
): Promise<void> => {
  let tableSql: string | null = null;

  await api.exec(
    db,
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'artifact_sections';`,
    (row: unknown[]) => {
      tableSql = typeof row[0] === 'string' ? row[0] : null;
    }
  );

  if (!tableSql) {
    await api.exec(db, ARTIFACT_SECTIONS_TABLE_SQL);
    return;
  }

  if (!artifactSectionsTableRequiresUpgrade(tableSql)) {
    return;
  }

  await api.exec(db, 'PRAGMA foreign_keys = OFF;');

  try {
    await api.exec(db, 'ALTER TABLE "artifact_sections" RENAME TO "artifact_sections_legacy";');
    await api.exec(db, ARTIFACT_SECTIONS_TABLE_SQL.replace(' IF NOT EXISTS', ''));
    await api.exec(
      db,
      `INSERT INTO "artifact_sections" ("id", "artifact_id", "kind", "title", "content", "items_json", "sort_order")
             SELECT "id", "artifact_id", "kind", "title", "content", "items_json", "sort_order"
             FROM "artifact_sections_legacy";`
    );
    await api.exec(db, 'DROP TABLE "artifact_sections_legacy";');
  } finally {
    await api.exec(db, 'PRAGMA foreign_keys = ON;');
  }
};

const runSchemaBootstrap = async (api: SQLiteMigrationApi, db: number): Promise<void> => {
  const statements = SCHEMA_SQL.split('--> statement-breakpoint');
  for (const statement of statements) {
    const sql = statement.trim();
    if (!sql) continue;

    try {
      await api.exec(db, sql);
    } catch (error) {
      const message = String(error);
      if (!message.includes('already exists') && !message.includes('not an error')) {
        console.error('Schema bootstrap error:', error);
        throw error;
      }
    }
  }
};

const runCanonicalStorageCutover = async (api: SQLiteMigrationApi, db: number): Promise<void> => {
  const renameStatements = [
    'ALTER TABLE "cases" RENAME TO "workspaces";',
    'ALTER TABLE "reports" RENAME TO "artifacts";',
    'ALTER TABLE "leads" RENAME TO "signals";',
    'ALTER TABLE "tasks" RENAME TO "workspace_runs";',
    'ALTER TABLE "artifacts" RENAME COLUMN "case_id" TO "workspace_id";',
    'ALTER TABLE "signals" RENAME COLUMN "case_id" TO "workspace_id";',
    'ALTER TABLE "signals" RENAME COLUMN "linked_report_id" TO "linked_artifact_id";',
    'ALTER TABLE "workspace_runs" RENAME COLUMN "case_id" TO "workspace_id";',
    'ALTER TABLE "chat_sessions" RENAME COLUMN "source_report_id" TO "source_artifact_id";',
    'ALTER TABLE "artifact_sections" RENAME COLUMN "report_id" TO "artifact_id";',
    'ALTER TABLE "artifact_evidence" RENAME COLUMN "report_id" TO "artifact_id";',
    'ALTER TABLE "entities" RENAME COLUMN "report_id" TO "artifact_id";',
    'ALTER TABLE "sources" RENAME COLUMN "report_id" TO "artifact_id";',
  ];

  for (const sql of renameStatements) {
    try {
      await api.exec(db, sql);
    } catch (error) {
      const message = String(error);
      if (
        !message.includes('no such table') &&
        !message.includes('duplicate column name') &&
        !message.includes('no such column') &&
        !message.includes('already exists')
      ) {
        console.error('Canonical storage cutover error:', error);
        throw error;
      }
    }
  }
};

const runAdditiveSchemaRepairs = async (api: SQLiteMigrationApi, db: number): Promise<void> => {
  const alterStatements = [
    'ALTER TABLE signals ADD COLUMN type text;',
    'ALTER TABLE signals ADD COLUMN url text;',
    'ALTER TABLE workspaces ADD COLUMN mode text;',
    'ALTER TABLE workspaces ADD COLUMN pack_id text;',
    'ALTER TABLE workspaces ADD COLUMN purpose_id text;',
    'ALTER TABLE workspaces ADD COLUMN label_profile_id text;',
    'ALTER TABLE workspaces ADD COLUMN metadata_json text;',
    'ALTER TABLE workspaces ADD COLUMN display_title text;',
    'ALTER TABLE workspaces ADD COLUMN launch_topic text;',
    'ALTER TABLE workspaces ADD COLUMN launch_angle text;',
    'ALTER TABLE workspaces ADD COLUMN priority_sources_summary text;',
    'ALTER TABLE artifacts ADD COLUMN artifact_type text;',
    'ALTER TABLE artifacts ADD COLUMN pack_id text;',
    'ALTER TABLE artifacts ADD COLUMN purpose_id text;',
    'ALTER TABLE artifacts ADD COLUMN label_profile_id text;',
    'ALTER TABLE artifacts ADD COLUMN metadata_json text;',
    'ALTER TABLE workspace_runs ADD COLUMN pack_id text;',
    'ALTER TABLE workspace_runs ADD COLUMN purpose_id text;',
    'ALTER TABLE workspace_runs ADD COLUMN artifact_type text;',
    'ALTER TABLE workspace_runs ADD COLUMN label_profile_id text;',
  ];

  for (const sql of alterStatements) {
    try {
      await api.exec(db, sql);
    } catch (error) {
      const message = String(error);
      if (
        !message.includes('duplicate column name') &&
        !message.includes('already exists') &&
        !message.includes('no such table')
      ) {
        console.error('Schema repair error:', error);
        throw error;
      }
    }
  }

  await ensureArtifactSectionsCompositeKey(api, db);
};

const DB_MIGRATIONS: readonly DbMigration[] = [
  {
    id: 1,
    name: 'canonical-storage-cutover',
    apply: runCanonicalStorageCutover,
  },
  {
    id: 2,
    name: 'schema-bootstrap',
    apply: runSchemaBootstrap,
  },
  {
    id: 3,
    name: 'additive-schema-repairs',
    apply: runAdditiveSchemaRepairs,
  },
  {
    id: 4,
    name: 'key-findings-cutover',
    apply: runKeyFindingsCutover,
  },
];

const ensureMigrationTable = async (api: SQLiteMigrationApi, db: number): Promise<void> => {
  await api.exec(
    db,
    `CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE_NAME}" (
      "id" integer PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "applied_at" integer NOT NULL
    );`
  );
};

const getAppliedMigrationIds = async (
  api: SQLiteMigrationApi,
  db: number
): Promise<Set<number>> => {
  const ids = new Set<number>();

  await api.exec(db, `SELECT "id" FROM "${MIGRATION_TABLE_NAME}" ORDER BY "id" ASC;`, (row) => {
    const id = Number(row[0]);
    if (Number.isInteger(id)) {
      ids.add(id);
    }
  });

  return ids;
};

const recordAppliedMigration = async (
  api: SQLiteMigrationApi,
  db: number,
  migration: DbMigration
): Promise<void> => {
  await api.exec(
    db,
    `INSERT INTO "${MIGRATION_TABLE_NAME}" ("id", "name", "applied_at")
     VALUES (${migration.id}, '${migration.name}', ${Date.now()});`
  );
};

export const applyPendingDbMigrations = async (
  api: SQLiteMigrationApi,
  db: number
): Promise<void> => {
  await ensureMigrationTable(api, db);
  const appliedIds = await getAppliedMigrationIds(api, db);

  for (const migration of DB_MIGRATIONS) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    await migration.apply(api, db);
    await recordAppliedMigration(api, db, migration);
  }
};
