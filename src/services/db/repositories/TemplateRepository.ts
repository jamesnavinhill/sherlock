import { eq, desc } from 'drizzle-orm';
import { getDB, type SherlockWriteExecutor } from '../client';
import { templates } from '../schema';
import type { CaseTemplate } from '@/types';
import { mapRowsSafely, parseStoredJson, serializeStoredJson } from './json';

const EMPTY_TEMPLATE_CONFIG: CaseTemplate['config'] = {};

const mapTemplateRow = (row: typeof templates.$inferSelect): CaseTemplate => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  topic: row.topic,
  config: parseStoredJson<CaseTemplate['config']>(
    row.configJson,
    EMPTY_TEMPLATE_CONFIG,
    `template config ${row.id}`
  ),
  createdAt: row.createdAt,
  scopeId: row.scopeId || undefined,
});

const toTemplateInsertRow = (template: CaseTemplate): typeof templates.$inferInsert => ({
  id: template.id,
  name: template.name,
  description: template.description,
  topic: template.topic,
  configJson: serializeStoredJson(template.config),
  createdAt: template.createdAt,
  scopeId: template.scopeId,
});

export class TemplateRepository {
  static async getAll(): Promise<CaseTemplate[]> {
    const db = getDB();
    const rows = await db.select().from(templates).orderBy(desc(templates.createdAt));

    return mapRowsSafely(rows, {
      label: 'template row',
      getRowId: (row) => row.id,
      mapRow: mapTemplateRow,
    });
  }

  static async create(
    template: CaseTemplate,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.insert(templates).values(toTemplateInsertRow(template));
  }

  static async delete(id: string): Promise<void> {
    const db = getDB();
    await db.delete(templates).where(eq(templates.id, id));
  }

  static async clearAll(db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.delete(templates);
  }
}
