import { eq } from 'drizzle-orm';
import { getDB } from '../client';
import { tasks } from '../schema';
import type { WorkspaceRun } from '@/types';

export class TaskRepository {
    static async getAll(): Promise<WorkspaceRun[]> {
        const db = getDB();
        const rows = await db.select().from(tasks);

        return rows.map(row => ({
            id: row.id,
            topic: row.topic,
            status: row.status as WorkspaceRun['status'],
            startTime: row.startTime || 0,
            endTime: row.endTime || undefined,
            workspaceId: row.caseId || undefined,
            error: row.error || undefined,
            config: row.configJson
                ? JSON.parse(row.configJson)
                : {
                    packId: row.packId || undefined,
                    purposeId: row.purposeId || undefined,
                    artifactType: row.artifactType || undefined,
                    labelProfileId: row.labelProfileId || undefined,
                },
        }));
    }

    static async create(task: WorkspaceRun): Promise<void> {
        const db = getDB();
        await db.insert(tasks).values({
            id: task.id,
            caseId: task.workspaceId || task.report?.caseId || null,
            topic: task.topic,
            status: task.status,
            packId: task.config?.packId,
            purposeId: task.config?.purposeId,
            artifactType: task.config?.artifactType,
            labelProfileId: task.config?.labelProfileId,
            startTime: task.startTime,
            endTime: task.endTime,
            error: task.error,
            configJson: task.config ? JSON.stringify(task.config) : null
        });
    }

    static async updateStatus(id: string, status: WorkspaceRun['status'], error?: string): Promise<void> {
        const db = getDB();
        const updateData: { status: WorkspaceRun['status']; error?: string; endTime?: number } = { status };
        if (error) updateData.error = error;
        if (status === 'COMPLETED' || status === 'FAILED') updateData.endTime = Date.now();

        await db.update(tasks)
            .set(updateData)
            .where(eq(tasks.id, id));
    }

    static async updateWorkspace(id: string, workspaceId: string | null): Promise<void> {
        const db = getDB();
        await db.update(tasks)
            .set({ caseId: workspaceId })
            .where(eq(tasks.id, id));
    }

    static async updateConfig(id: string, config: WorkspaceRun['config']): Promise<void> {
        const db = getDB();
        await db.update(tasks)
            .set({ configJson: config ? JSON.stringify(config) : null })
            .where(eq(tasks.id, id));
    }

    static async clearWorkspace(workspaceId: string): Promise<void> {
        const db = getDB();
        await db.update(tasks)
            .set({ caseId: null })
            .where(eq(tasks.caseId, workspaceId));
    }

    static async deleteByWorkspace(workspaceId: string): Promise<void> {
        const db = getDB();
        await db.delete(tasks).where(eq(tasks.caseId, workspaceId));
    }

    static async clearAll(): Promise<void> {
        const db = getDB();
        await db.delete(tasks);
    }

    static async delete(id: string): Promise<void> {
        const db = getDB();
        await db.delete(tasks).where(eq(tasks.id, id));
    }
}
