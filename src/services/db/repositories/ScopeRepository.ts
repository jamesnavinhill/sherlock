import { eq } from 'drizzle-orm';
import { getDB, type SherlockWriteExecutor } from '../client';
import { scopes } from '../schema';
import type { InvestigationScope } from '@/types';
import { BUILTIN_SCOPES } from '@/data/presets';
import { mapRowsSafely, parseStoredJson, serializeStoredJson } from './json';

type StoredScopeConfig = Omit<InvestigationScope, 'id' | 'name' | 'description' | 'isBuiltIn'>;

const emptyScopeConfig: StoredScopeConfig = {
  domainContext: '',
  investigationObjective: '',
  suggestedSources: [],
  categories: [],
  personas: [],
};

const toStoredScopeRecord = (scope: InvestigationScope) => {
  const { id, name, description, isBuiltIn, ...config } = scope;

  return {
    id,
    name,
    description,
    type: isBuiltIn ? 'built-in' : 'custom',
    configJson: serializeStoredJson(config),
  };
};

export class ScopeRepository {
  static async getAll(): Promise<InvestigationScope[]> {
    const db = getDB();
    const rows = await db.select().from(scopes);

    return mapRowsSafely(rows, {
      label: 'scope row',
      getRowId: (row) => row.id,
      mapRow: (row) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        ...parseStoredJson<StoredScopeConfig>(
          row.configJson,
          emptyScopeConfig,
          `scope config ${row.id}`
        ),
        isBuiltIn: row.type === 'built-in',
      }),
    });
  }

  static async getById(id: string): Promise<InvestigationScope | null> {
    const db = getDB();
    const result = await db.select().from(scopes).where(eq(scopes.id, id));

    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      ...parseStoredJson<StoredScopeConfig>(
        row.configJson,
        emptyScopeConfig,
        `scope config ${row.id}`
      ),
      isBuiltIn: row.type === 'built-in',
    };
  }

  static async create(scope: InvestigationScope): Promise<void> {
    const db = getDB();
    const record = toStoredScopeRecord(scope);

    await db.insert(scopes).values({
      ...record,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  static async update(scope: InvestigationScope): Promise<void> {
    const db = getDB();
    const record = toStoredScopeRecord(scope);

    await db
      .update(scopes)
      .set({
        name: record.name,
        description: record.description,
        type: record.type,
        configJson: record.configJson,
        updatedAt: Date.now(),
      })
      .where(eq(scopes.id, record.id));
  }

  static async ensureBuiltinScopes(
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    for (const scope of BUILTIN_SCOPES) {
      const record = toStoredScopeRecord(scope);
      const now = Date.now();

      await db
        .insert(scopes)
        .values({
          ...record,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: scopes.id,
          set: {
            name: record.name,
            description: record.description,
            type: record.type,
            configJson: record.configJson,
            updatedAt: now,
          },
        });
    }
  }

  static async delete(id: string): Promise<void> {
    const db = getDB();
    await db.delete(scopes).where(eq(scopes.id, id));
  }
}
