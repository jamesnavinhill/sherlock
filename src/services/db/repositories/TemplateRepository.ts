import { eq, desc } from 'drizzle-orm';
import { getDB, type SherlockWriteExecutor } from '../client';
import { templates } from '../schema';
import type { CaseTemplate } from '@/types';
import { parseStoredJson } from './json';

export class TemplateRepository {
  static async getAll(): Promise<CaseTemplate[]> {
    const db = getDB();
    const rows = await db.select().from(templates).orderBy(desc(templates.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      topic: row.topic,
      config: parseStoredJson<CaseTemplate['config']>(row.configJson, {} as CaseTemplate['config'], `template config ${row.id}`),
      createdAt: row.createdAt,
      scopeId: row.scopeId || undefined,
    }));
  }

  static async create(
    template: CaseTemplate,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.insert(templates).values({
      id: template.id,
      name: template.name,
      description: template.description,
      topic: template.topic,
      configJson: JSON.stringify(template.config),
      createdAt: template.createdAt,
      scopeId: template.scopeId,
    });
  }

  static async delete(id: string): Promise<void> {
    const db = getDB();
    await db.delete(templates).where(eq(templates.id, id));
  }

  static async clearAll(db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.delete(templates);
  }
}
