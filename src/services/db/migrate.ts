import { CaseRepository } from './repositories/CaseRepository';
import { ScopeRepository } from './repositories/ScopeRepository';
import { getDB } from './client';
import { settings } from './schema';
import { eq } from 'drizzle-orm';

const MIGRATION_KEY = 'migration_v1_complete';

export const migrateLocalStorageToSqlite = async () => {
    const db = getDB();

    // Check if already migrated
    const result = await db.select().from(settings).where(eq(settings.key, MIGRATION_KEY));
    if (result.length > 0 && result[0].value === 'true') {
        return; // Already migrated
    }

    console.warn('Starting migration from localStorage to SQLite...');

    try {
        const storageRaw = localStorage.getItem('sherlock-storage');
        if (!storageRaw) {
            console.warn('No local storage data found.');
            await markMigrated();
            return;
        }

        const { state } = JSON.parse(storageRaw);
        if (!state) return;

        // 1. Migrate Scopes
        if (state.customScopes && Array.isArray(state.customScopes)) {
            for (const scope of state.customScopes) {
                await ScopeRepository.create(scope);
            }
        }

        // 2. Migrate Cases
        if (state.cases && Array.isArray(state.cases)) {
            for (const c of state.cases) {
                await CaseRepository.createCase(c);
            }
        }

        // 3. Migrate Reports (Archives)
        if (state.archives && Array.isArray(state.archives)) {
            for (const report of state.archives) {
                await CaseRepository.createReport(report);
            }
        }

        await markMigrated();
        console.warn('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
        // Do not mark migrated so we try again next time? 
        // Or warn user.
    }
};

const markMigrated = async () => {
    const db = getDB();
    await db.insert(settings).values({
        key: MIGRATION_KEY,
        value: 'true'
    });
};
