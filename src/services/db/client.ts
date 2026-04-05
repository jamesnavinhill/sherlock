import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';
import { SCHEMA_SQL } from './migrations_sql';

type SQLiteApi = ReturnType<typeof SQLite.Factory>;

// Singleton state
let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqlite3: SQLiteApi | null = null;
let dbHandle: number | null = null;
let initPromise: Promise<ReturnType<typeof drizzle>> | null = null;

// Simple mutex to prevent concurrent database operations
let queryLock: Promise<void> = Promise.resolve();

const DATABASE_NAME = 'sherlock-v1.sqlite';

export const ARTIFACT_SECTIONS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS "artifact_sections" (
    "id" text NOT NULL,
    "report_id" text NOT NULL,
    "kind" text NOT NULL,
    "title" text NOT NULL,
    "content" text,
    "items_json" text,
    "sort_order" integer NOT NULL,
    PRIMARY KEY ("report_id", "id"),
    FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON UPDATE no action ON DELETE no action
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
  api: Pick<SQLiteApi, 'exec'>,
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
      `INSERT INTO "artifact_sections" ("id", "report_id", "kind", "title", "content", "items_json", "sort_order")
             SELECT "id", "report_id", "kind", "title", "content", "items_json", "sort_order"
             FROM "artifact_sections_legacy";`
    );
    await api.exec(db, 'DROP TABLE "artifact_sections_legacy";');
  } finally {
    await api.exec(db, 'PRAGMA foreign_keys = ON;');
  }
};

export const initDB = async (): Promise<ReturnType<typeof drizzle>> => {
  // Return existing instance if already initialized
  if (dbInstance) return dbInstance;

  // If initialization is in progress, wait for it
  if (initPromise) return initPromise;

  // Start initialization
  initPromise = doInitDB();

  try {
    dbInstance = await initPromise;
    return dbInstance;
  } finally {
    initPromise = null;
  }
};

const runSchemaUpgrades = async (api: SQLiteApi, db: number): Promise<void> => {
  const alterStatements = [
    'ALTER TABLE leads ADD COLUMN type text;',
    'ALTER TABLE leads ADD COLUMN url text;',
    'ALTER TABLE cases ADD COLUMN mode text;',
    'ALTER TABLE cases ADD COLUMN pack_id text;',
    'ALTER TABLE cases ADD COLUMN purpose_id text;',
    'ALTER TABLE cases ADD COLUMN label_profile_id text;',
    'ALTER TABLE cases ADD COLUMN metadata_json text;',
    'ALTER TABLE reports ADD COLUMN artifact_type text;',
    'ALTER TABLE reports ADD COLUMN pack_id text;',
    'ALTER TABLE reports ADD COLUMN purpose_id text;',
    'ALTER TABLE reports ADD COLUMN label_profile_id text;',
    'ALTER TABLE reports ADD COLUMN metadata_json text;',
    'ALTER TABLE tasks ADD COLUMN pack_id text;',
    'ALTER TABLE tasks ADD COLUMN purpose_id text;',
    'ALTER TABLE tasks ADD COLUMN artifact_type text;',
    'ALTER TABLE tasks ADD COLUMN label_profile_id text;',
    `CREATE TABLE IF NOT EXISTS "chat_sessions" (
            "id" text PRIMARY KEY NOT NULL,
            "workspace_id" text NOT NULL,
            "title" text NOT NULL,
            "status" text NOT NULL,
            "source_report_id" text,
            "pack_id" text,
            "purpose_id" text,
            "provider" text,
            "model_id" text,
            "metadata_json" text,
            "created_at" integer NOT NULL,
            "updated_at" integer NOT NULL,
            FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action,
            FOREIGN KEY ("source_report_id") REFERENCES "reports"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "chat_messages" (
            "id" text PRIMARY KEY NOT NULL,
            "session_id" text NOT NULL,
            "role" text NOT NULL,
            "content" text NOT NULL,
            "status" text NOT NULL,
            "citations_json" text,
            "metadata_json" text,
            "error" text,
            "created_at" integer NOT NULL,
            "updated_at" integer NOT NULL,
            FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "chat_message_attachments" (
            "id" text PRIMARY KEY NOT NULL,
            "message_id" text NOT NULL,
            "kind" text NOT NULL,
            "title" text NOT NULL,
            "ref_id" text,
            "ref_kind" text,
            "snippet" text,
            "metadata_json" text,
            "created_at" integer NOT NULL,
            FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "chat_actions" (
            "id" text PRIMARY KEY NOT NULL,
            "session_id" text NOT NULL,
            "message_id" text,
            "type" text NOT NULL,
            "status" text NOT NULL,
            "input_json" text,
            "result_json" text,
            "created_at" integer NOT NULL,
            "updated_at" integer NOT NULL,
            FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON UPDATE no action ON DELETE no action,
            FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "artifact_evidence" (
            "id" text NOT NULL,
            "report_id" text NOT NULL,
            "kind" text NOT NULL,
            "title" text NOT NULL,
            "summary" text NOT NULL,
            "quote" text,
            "source_title" text,
            "source_url" text,
            "section_id" text,
            "tags_json" text,
            "metadata_json" text,
            "sort_order" integer NOT NULL,
            PRIMARY KEY ("report_id", "id"),
            FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "follow_ups" (
            "id" text PRIMARY KEY NOT NULL,
            "workspace_id" text,
            "artifact_id" text NOT NULL,
            "section_id" text,
            "source_signal_id" text,
            "kind" text NOT NULL,
            "title" text NOT NULL,
            "action_text" text NOT NULL,
            "status" text NOT NULL,
            "entity_refs_json" text,
            "source_refs_json" text,
            "resolved_by_artifact_id" text,
            "metadata_json" text,
            "sort_order" integer NOT NULL,
            "created_at" integer NOT NULL,
            "updated_at" integer NOT NULL,
            FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action,
            FOREIGN KEY ("artifact_id") REFERENCES "reports"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "workspace_items" (
            "id" text PRIMARY KEY NOT NULL,
            "workspace_id" text NOT NULL,
            "kind" text NOT NULL,
            "title" text NOT NULL,
            "description" text,
            "text_content" text,
            "url" text,
            "mime_type" text,
            "file_name" text,
            "size_bytes" integer,
            "preview_url" text,
            "tags_json" text,
            "provenance_json" text,
            "metadata_json" text,
            "created_at" integer NOT NULL,
            "updated_at" integer NOT NULL,
            FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "workspace_boards" (
            "id" text PRIMARY KEY NOT NULL,
            "workspace_id" text NOT NULL,
            "name" text NOT NULL,
            "description" text,
            "sort_order" integer NOT NULL,
            "presentation_mode" integer DEFAULT 0 NOT NULL,
            "metadata_json" text,
            "created_at" integer NOT NULL,
            "updated_at" integer NOT NULL,
            FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "workspace_board_documents" (
            "board_id" text PRIMARY KEY NOT NULL,
            "snapshot_json" text,
            "updated_at" integer NOT NULL,
            FOREIGN KEY ("board_id") REFERENCES "workspace_boards"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "board_agent_sessions" (
            "id" text PRIMARY KEY NOT NULL,
            "workspace_id" text NOT NULL,
            "board_id" text NOT NULL,
            "title" text NOT NULL,
            "status" text NOT NULL,
            "request" text NOT NULL,
            "request_state" text NOT NULL,
            "provider" text,
            "model_id" text,
            "context_snapshot_id" text,
            "last_error" text,
            "metadata_json" text,
            "created_at" integer NOT NULL,
            "updated_at" integer NOT NULL,
            "started_at" integer,
            "completed_at" integer,
            FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action,
            FOREIGN KEY ("board_id") REFERENCES "workspace_boards"("id") ON UPDATE no action ON DELETE no action
        );`,
    `CREATE TABLE IF NOT EXISTS "board_agent_actions" (
            "id" text PRIMARY KEY NOT NULL,
            "session_id" text NOT NULL,
            "workspace_id" text NOT NULL,
            "board_id" text NOT NULL,
            "type" text NOT NULL,
            "status" text NOT NULL,
            "input_json" text,
            "normalized_input_json" text,
            "result_json" text,
            "affected_canonical_ids_json" text,
            "affected_board_shape_ids_json" text,
            "error" text,
            "created_at" integer NOT NULL,
            "updated_at" integer NOT NULL,
            FOREIGN KEY ("session_id") REFERENCES "board_agent_sessions"("id") ON UPDATE no action ON DELETE no action,
            FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action,
            FOREIGN KEY ("board_id") REFERENCES "workspace_boards"("id") ON UPDATE no action ON DELETE no action
        );`,
  ];

  for (const sql of alterStatements) {
    try {
      await api.exec(db, sql);
    } catch (e) {
      const errStr = String(e);
      if (!errStr.includes('duplicate column name') && !errStr.includes('already exists')) {
        console.error('Schema upgrade error:', e);
        throw e;
      }
    }
  }

  await ensureArtifactSectionsCompositeKey(api, db);
};

const doInitDB = async (): Promise<ReturnType<typeof drizzle>> => {
  try {
    // Initialize wa-sqlite with async WASM module
    const module = await SQLiteAsyncESMFactory({
      locateFile: (_file: string) => '/wa-sqlite-async.wasm',
    });
    sqlite3 = SQLite.Factory(module);

    // Use IndexedDB VFS for persistence
    const vfs = new IDBBatchAtomicVFS(DATABASE_NAME);
    await sqlite3.vfs_register(vfs as unknown as Parameters<SQLiteApi['vfs_register']>[0], true);

    const openedDbHandle = await sqlite3.open_v2(
      DATABASE_NAME,
      SQLite.SQLITE_OPEN_READWRITE | SQLite.SQLITE_OPEN_CREATE,
      vfs.name
    );
    dbHandle = openedDbHandle;

    // Initialize schema - execute each statement separately
    const statements = SCHEMA_SQL.split('--> statement-breakpoint');
    for (const statement of statements) {
      const sql = statement.trim();
      if (sql) {
        try {
          await sqlite3.exec(openedDbHandle, sql);
        } catch (e) {
          // Ignore benign errors
          const errStr = String(e);
          if (!errStr.includes('already exists') && !errStr.includes('not an error')) {
            console.error('Schema exec error:', e);
            throw e;
          }
        }
      }
    }
    await runSchemaUpgrades(sqlite3, openedDbHandle);

    // Create drizzle proxy driver using exec with callback
    const api = sqlite3;
    const db = openedDbHandle;

    const executeQuery = async (sql: string, params: unknown[]): Promise<{ rows: unknown[][] }> => {
      if (db === null || api === null) {
        throw new Error('Database not initialized');
      }

      // Build SQL with bound parameters using sqlite3_str
      const rows: unknown[][] = [];

      // For parameterized queries, we need to use prepare/bind/step
      if (params && params.length > 0) {
        // Use str_new to create SQL string pointer
        const str = api.str_new(db);
        try {
          api.str_appendall(str, sql);
          const sqlPtr = api.str_value(str);

          const prepared = await api.prepare_v2(db, sqlPtr);
          if (!prepared || !prepared.stmt) {
            // No statement - might be empty or comment
            return { rows: [] };
          }

          try {
            // Bind parameters (1-indexed)
            for (let i = 0; i < params.length; i++) {
              const p = params[i];
              if (p === null || p === undefined) {
                api.bind(prepared.stmt, i + 1, null);
              } else if (typeof p === 'number') {
                api.bind(prepared.stmt, i + 1, p);
              } else if (typeof p === 'string') {
                api.bind(prepared.stmt, i + 1, p);
              } else if (p instanceof Uint8Array) {
                api.bind(prepared.stmt, i + 1, p);
              } else {
                api.bind(prepared.stmt, i + 1, JSON.stringify(p));
              }
            }

            // Step through results
            while ((await api.step(prepared.stmt)) === SQLite.SQLITE_ROW) {
              const columnCount = api.column_count(prepared.stmt);
              const row: unknown[] = [];
              for (let i = 0; i < columnCount; i++) {
                row.push(api.column(prepared.stmt, i));
              }
              rows.push(row);
            }
          } finally {
            await api.finalize(prepared.stmt);
          }
        } finally {
          api.str_finish(str);
        }
      } else {
        // No parameters - use exec with callback for efficiency
        await api.exec(db, sql, (row: unknown[], _columns: string[]) => {
          rows.push([...row]);
        });
      }

      return { rows };
    };

    // Serialized query executor - ensures only one query runs at a time
    const serializedQuery = async (
      sql: string,
      params: unknown[]
    ): Promise<{ rows: unknown[][] }> => {
      const previousLock = queryLock;
      let resolveLock!: () => void;
      queryLock = new Promise<void>((resolve) => {
        resolveLock = resolve;
      });

      try {
        await previousLock;
        return await executeQuery(sql, params);
      } catch (e) {
        console.error('SQL Error:', sql, params, e);
        throw e;
      } finally {
        resolveLock();
      }
    };

    const instance = drizzle(
      async (sql, params, _method) => {
        return serializedQuery(sql, params as unknown[]);
      },
      { schema }
    );

    return instance;
  } catch (err) {
    console.error('Failed to initialize database:', err);
    throw err;
  }
};

export const getDB = () => {
  if (!dbInstance) throw new Error('Database not initialized. Call initDB() first.');
  return dbInstance;
};

export const getRawDB = () => {
  if (!sqlite3 || dbHandle === null) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return { sqlite3, db: dbHandle };
};
