import { eq } from 'drizzle-orm';
import { getDB } from '../client';
import { tasks } from '../schema';
import type { InvestigationTask } from '@/types';

export class TaskRepository {
    static async getAll(): Promise<InvestigationTask[]> {
        const db = getDB();
        const rows = await db.select().from(tasks);

        return rows.map(row => ({
            id: row.id,
            topic: row.topic,
            status: row.status as InvestigationTask['status'],
            startTime: row.startTime || 0,
            endTime: row.endTime || undefined,
            error: row.error || undefined,
            config: row.configJson ? JSON.parse(row.configJson) : undefined,
            // Note: report usually attached in memory or fetched separately via ReportRepository if needed
            // For tasks list we might not need full report body
        }));
    }

    static async create(task: InvestigationTask): Promise<void> {
        const db = getDB();
        await db.insert(tasks).values({
            id: task.id,
            caseId: null, // Optional in task interface but required in schema? Let's check schema. Schema allowed null? 
            // Checking schema.ts: caseId references cases.id. If task doesn't have caseId yet... 
            // We might need to handle standalone tasks.
            topic: task.topic,
            status: task.status,
            startTime: task.startTime,
            endTime: task.endTime,
            error: task.error,
            configJson: task.config ? JSON.stringify(task.config) : null
        });
    }

    static async updateStatus(id: string, status: InvestigationTask['status'], error?: string): Promise<void> {
        const db = getDB();
        const updateData: { status: InvestigationTask['status']; error?: string; endTime?: number } = { status };
        if (error) updateData.error = error;
        if (status === 'COMPLETED' || status === 'FAILED') updateData.endTime = Date.now();

        await db.update(tasks)
            .set(updateData)
            .where(eq(tasks.id, id));
    }

    static async delete(id: string): Promise<void> {
        const db = getDB();
        await db.delete(tasks).where(eq(tasks.id, id));
    }
}
