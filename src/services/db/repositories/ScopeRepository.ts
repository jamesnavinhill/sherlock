import { eq } from 'drizzle-orm';
import { getDB } from '../client';
import { scopes } from '../schema';
import type { InvestigationScope } from '@/types';

export class ScopeRepository {
  static async getAll(): Promise<InvestigationScope[]> {
    const db = getDB();
    const rows = await db.select().from(scopes);
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      ...JSON.parse(row.configJson),
      isBuiltIn: row.type === 'built-in'
    }));
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
      ...JSON.parse(row.configJson),
      isBuiltIn: row.type === 'built-in'
    };
  }

  static async create(scope: InvestigationScope): Promise<void> {
    const db = getDB();
    const { id, name, description, isBuiltIn, ...config } = scope;
    
    await db.insert(scopes).values({
      id,
      name,
      description,
      type: isBuiltIn ? 'built-in' : 'custom',
      configJson: JSON.stringify(config),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  static async update(scope: InvestigationScope): Promise<void> {
    const db = getDB();
    const { id, name, description, isBuiltIn, ...config } = scope;
    
    await db.update(scopes)
      .set({
        name,
        description,
        type: isBuiltIn ? 'built-in' : 'custom',
        configJson: JSON.stringify(config),
        updatedAt: Date.now()
      })
      .where(eq(scopes.id, id));
  }

  static async delete(id: string): Promise<void> {
    const db = getDB();
    await db.delete(scopes).where(eq(scopes.id, id));
  }
}
