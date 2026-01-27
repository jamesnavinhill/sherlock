import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { OriginPrivateFileSystemVFS } from 'wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js';
import { SCHEMA_SQL } from './migrations_sql';

// Singleton instance
let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqlite3: SQLiteAPI | null = null;
let db: number | null = null;

const DATABASE_NAME = 'sherlock-v1.sqlite';

export const initDB = async () => {
    if (dbInstance) return dbInstance;

    try {
        // Initialize wa-sqlite
        const module = await SQLiteAsyncESMFactory();
        sqlite3 = SQLite.Factory(module);

        // Use OPFS VFS
        // Note: This requires COOP/COEP headers to be set in vite.config.ts
        // If not available, it might fallback or fail.
        // For now, we assume we are in a context where OPFS is supported (modern browsers)

        // Create/Open database
        // We use the IDB-backed VFS for broader compatibility if OPFS headers are tricky in dev
        // But implementation_plan.md specified OPFS. 
        // Let's use the standard "AccessHandle" VFS if available, or "minimal" VFS.

        // Actually, for @rhashimoto/wa-sqlite, we generally use:
        // sqlite3.vfs_register(new SQLite.OriginPrivateFileSystemVFS(), true);

        // Wait, we need to import the VFS explicitly if it's not default.
        // Checking standard usage...

        // Simplified setup for the proxy driver:
        // We'll use a basic memory VFS or IDB VFS if OPFS fails, but let's try OPFS.

        // Note: Imports for VFS might differ based on build. 
        // We'll stick to a basic memory/IDB approach first for safety if types are missing, 
        // BUT the plan asked for OPFS.

        // Let's rely on the proxy driver pattern for Drizzle.

        // 1. Setup SQLite
        const sq = sqlite3;
        const vfs = new OriginPrivateFileSystemVFS();
        await sq.vfs_register(vfs, true); // Use OPFS VFS

        db = await sq.open_v2(
            DATABASE_NAME,
            SQLite.SQLITE_OPEN_READWRITE | SQLite.SQLITE_OPEN_CREATE,
            'opfs'
        );

        // 1b. Initialize Schema
        const statements = SCHEMA_SQL.split('--> statement-breakpoint');
        for (const statement of statements) {
            const sql = statement.trim();
            if (sql) {
                try {
                    await sq.exec(db, sql);
                } catch (e) {
                    // Since we use IF NOT EXISTS, errors here might be real issues like syntax errors
                    // However, duplicate table errors shouldn't happen.
                    console.error('Error executing schema migration:', e);
                    // Check if it's "table already exists" just in case IF NOT EXISTS fails or isn't used everywhere
                    if (String(e).includes('already exists')) {
                        continue;
                    }
                    throw e;
                }
            }
        }
        // 2. Setup Drizzle Proxy
        // Drizzle doesn't have a native wa-sqlite driver yet, so we use the proxy driver
        // where we implement the execution logic.

        const dbProxy = drizzle(async (sql, params, _method) => {
            // Execute query
            const rows: unknown[] = [];

            // We need to use sqlite3.exec with a callback to capture rows
            // OR prepare/step/finalize

            // Let's us exec for simplicity if params are handled, 
            // but sq.exec doesn't handle params natively same way.
            // We usually use statements.

            // Basic statement handling:
            if (db === null) {
                throw new Error('Database not initialized');
            }

            let stmt: number | null = null;
            try {
                stmt = await sq.prepare_v2(db, sql);

                // Bind params
                if (params && params.length > 0) {
                    for (let i = 0; i < params.length; i++) {
                        // SQLite params are 1-based
                        const p = params[i];
                        if (typeof p === 'number') await sq.bind_double(stmt, i + 1, p);
                        else if (typeof p === 'string') await sq.bind_text(stmt, i + 1, p);
                        else if (p === null) await sq.bind_null(stmt, i + 1);
                        else if (p instanceof Uint8Array) await sq.bind_blob(stmt, i + 1, p);
                        else await sq.bind_text(stmt, i + 1, JSON.stringify(p)); // Fallback
                    }
                }

                // Step
                while ((await sq.step(stmt)) === SQLite.SQLITE_ROW) {
                    const row = await sq.row(stmt);
                    rows.push(row);
                }

                // Get columns for mapping (if "all" or "get")
                // const cols = sq.column_names(stmt);
                // We'll rely on Drizzle to map array results if we return array of arrays?
                // SQLite proxy expects: { rows: any[][] } or { rows: any[] } depending on config?
                // Re-reading drizzle sqlite-proxy docs...
                // callback returns: { rows: any[][] }

                // Wait, Drizzle proxy usually expects array of objects if we don't define otherwise?
                // Actually, for sqlite-proxy, the return type is Promise<{ rows: any[][] }>.
                // So we return raw arrays.

            } catch (e) {
                console.error('SQL Error:', e);
                throw e;
            } finally {
                if (stmt !== null) {
                    await sq.finalize(stmt);
                }
            }

            return { rows };
        }, { schema });

        dbInstance = dbProxy;

        // Simple test
        // await sq.exec(db, "SELECT 1"); 

        return dbInstance;

    } catch (err) {
        console.error("Failed to initialize database:", err);
        throw err;
    }
};

export const getDB = () => {
    if (!dbInstance) throw new Error("Database not initialized. Call initDB() first.");
    return dbInstance;
};

// Types for wa-sqlite
// (Minimal definition to satisfy TS if @types are missing)
interface SQLiteAPI {
    OPEN_READWRITE: number;
    OPEN_CREATE: number;
    vfs_register(vfs: unknown, makeDefault: boolean): Promise<void>;
    open_v2(filename: string, flags: number, vfs?: string): Promise<number>;
    prepare_v2(db: number, sql: string): Promise<number>;
    bind_text(stmt: number, idx: number, val: string): Promise<void>;
    bind_double(stmt: number, idx: number, val: number): Promise<void>;
    bind_null(stmt: number, idx: number): Promise<void>;
    bind_blob(stmt: number, idx: number, val: Uint8Array): Promise<void>;
    step(stmt: number): Promise<number>;
    row(stmt: number): Promise<unknown[]>;
    finalize(stmt: number): Promise<void>;
    exec(db: number, sql: string, callback?: (row: unknown[], cols: string[]) => void): Promise<void>;
}
