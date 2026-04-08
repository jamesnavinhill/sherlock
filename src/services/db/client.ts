import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';
import { applyPendingDbMigrations } from './migrations';

type SQLiteApi = ReturnType<typeof SQLite.Factory>;

// Singleton state
let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqlite3: SQLiteApi | null = null;
let dbHandle: number | null = null;
let initPromise: Promise<ReturnType<typeof drizzle>> | null = null;

// Simple mutex to prevent concurrent database operations
let queryLock: Promise<void> = Promise.resolve();

const DATABASE_NAME = 'sherlock-v1.sqlite';

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

    await applyPendingDbMigrations(sqlite3, openedDbHandle);

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

export const getDB = (): NonNullable<typeof dbInstance> => {
  if (!dbInstance) throw new Error('Database not initialized. Call initDB() first.');
  return dbInstance;
};

export type SherlockDb = ReturnType<typeof getDB>;
export type SherlockTx = Parameters<SherlockDb['transaction']>[0] extends (
  tx: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;
export type SherlockWriteExecutor = SherlockDb | SherlockTx;

export const runWriteTransaction = async <T>(
  operation: (tx: SherlockTx) => Promise<T>,
  executor: SherlockWriteExecutor = getDB()
): Promise<T> => {
  const db = getDB();
  if (executor !== db) {
    return operation(executor as SherlockTx);
  }
  return db.transaction(async (tx) => operation(tx));
};

export const getRawDB = () => {
  if (!sqlite3 || dbHandle === null) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return { sqlite3, db: dbHandle };
};
