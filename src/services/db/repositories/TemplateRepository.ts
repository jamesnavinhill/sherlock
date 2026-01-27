import { eq, desc } from 'drizzle-orm';
import { getDB } from '../client';
import { templates } from '../schema';
import type { CaseTemplate } from '@/types';

export class TemplateRepository {
    static async getAll(): Promise<CaseTemplate[]> {
        const db = getDB();
        const rows = await db.select().from(templates).orderBy(desc(templates.createdAt));

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description || undefined,
            topic: row.topic,
            config: JSON.parse(row.configJson),
            createdAt: row.createdAt,
            scopeId: row.scopeId || undefined
        }));
    }

    static async create(template: CaseTemplate): Promise<void> {
        const db = getDB();
        await db.insert(templates).values({
            id: template.id,
            name: template.name,
            description: template.description,
            topic: template.topic,
            configJson: JSON.stringify(template.config),
            createdAt: template.createdAt,
            scopeId: template.scopeId
        });
    }

    static async delete(id: string): Promise<void> {
        const db = getDB();
        await db.delete(templates).where(eq(templates.id, id));
    }
}
