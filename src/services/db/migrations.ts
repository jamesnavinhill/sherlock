import { SCHEMA_SQL } from './migrations_sql';

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
