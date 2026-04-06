import { eq } from 'drizzle-orm';
import { getDB, type SherlockWriteExecutor } from '../client';
import { tasks } from '../schema';
import type { ArtifactType, WorkspaceRun } from '@/types';
import { mapRowsSafely, parseStoredJson, serializeStoredJsonOrNull } from './json';

const mapTaskRow = (row: typeof tasks.$inferSelect): WorkspaceRun => {
  const legacyConfig: WorkspaceRun['config'] = {
    packId: row.packId || undefined,
    purposeId: row.purposeId || undefined,
    artifactType: (row.artifactType as ArtifactType | null) || undefined,
    labelProfileId: row.labelProfileId || undefined,
  };

  return {
    id: row.id,
    topic: row.topic,
    status: row.status as WorkspaceRun['status'],
    startTime: row.startTime || 0,
    endTime: row.endTime || undefined,
    workspaceId: row.caseId || undefined,
    error: row.error || undefined,
    config: row.configJson
      ? parseStoredJson<WorkspaceRun['config']>(row.configJson, legacyConfig, `task config ${row.id}`)
      : legacyConfig,
  };
};

const toTaskInsertRow = (task: WorkspaceRun): typeof tasks.$inferInsert => ({
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
  configJson: serializeStoredJsonOrNull(task.config),
});

export class TaskRepository {
  static async getAll(): Promise<WorkspaceRun[]> {
    const db = getDB();
    const rows = await db.select().from(tasks);

    return mapRowsSafely(rows, {
      label: 'task row',
      getRowId: (row) => row.id,
      mapRow: mapTaskRow,
    });
  }

  static async create(task: WorkspaceRun, db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.insert(tasks).values(toTaskInsertRow(task));
  }

  static async updateStatus(
    id: string,
    status: WorkspaceRun['status'],
    error?: string
  ): Promise<void> {
    const db = getDB();
    const updateData: { status: WorkspaceRun['status']; error?: string; endTime?: number } = {
      status,
    };
    if (error) updateData.error = error;
    if (status === 'COMPLETED' || status === 'FAILED') updateData.endTime = Date.now();

    await db.update(tasks).set(updateData).where(eq(tasks.id, id));
  }

  static async updateWorkspace(id: string, workspaceId: string | null): Promise<void> {
    const db = getDB();
    await db.update(tasks).set({ caseId: workspaceId }).where(eq(tasks.id, id));
  }

  static async updateConfig(id: string, config: WorkspaceRun['config']): Promise<void> {
    const db = getDB();
    await db
      .update(tasks)
      .set({ configJson: serializeStoredJsonOrNull(config) })
      .where(eq(tasks.id, id));
  }

  static async clearWorkspace(
    workspaceId: string,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.update(tasks).set({ caseId: null }).where(eq(tasks.caseId, workspaceId));
  }

  static async deleteByWorkspace(
    workspaceId: string,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.delete(tasks).where(eq(tasks.caseId, workspaceId));
  }

  static async clearAll(db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.delete(tasks);
  }

  static async delete(id: string): Promise<void> {
    const db = getDB();
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}
