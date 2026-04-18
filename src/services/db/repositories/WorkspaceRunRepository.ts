import { eq } from 'drizzle-orm';
import { getDB, type SherlockWriteExecutor } from '../client';
import { workspaceRuns } from '../schema';
import type { ArtifactType, WorkspaceRun } from '@/types';
import { mapRowsSafely, parseStoredJson, serializeStoredJsonOrNull } from './json';

const mapRunRow = (row: typeof workspaceRuns.$inferSelect): WorkspaceRun => {
  const fallbackConfig: WorkspaceRun['config'] = {
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
    workspaceId: row.workspaceId || undefined,
    error: row.error || undefined,
    config: row.configJson
      ? parseStoredJson<WorkspaceRun['config']>(
          row.configJson,
          fallbackConfig,
          `workspace run config ${row.id}`
        )
      : fallbackConfig,
  };
};

const toRunInsertRow = (run: WorkspaceRun): typeof workspaceRuns.$inferInsert => ({
  id: run.id,
  workspaceId: run.workspaceId || run.artifact?.workspaceId || null,
  topic: run.topic,
  status: run.status,
  packId: run.config?.packId,
  purposeId: run.config?.purposeId,
  artifactType: run.config?.artifactType,
  labelProfileId: run.config?.labelProfileId,
  startTime: run.startTime,
  endTime: run.endTime,
  error: run.error,
  configJson: serializeStoredJsonOrNull(run.config),
});

export class WorkspaceRunRepository {
  static async getAll(): Promise<WorkspaceRun[]> {
    const db = getDB();
    const rows = await db.select().from(workspaceRuns);

    return mapRowsSafely(rows, {
      label: 'workspace run row',
      getRowId: (row) => row.id,
      mapRow: mapRunRow,
    });
  }

  static async create(run: WorkspaceRun, db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.insert(workspaceRuns).values(toRunInsertRow(run));
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

    await db.update(workspaceRuns).set(updateData).where(eq(workspaceRuns.id, id));
  }

  static async updateWorkspace(id: string, workspaceId: string | null): Promise<void> {
    const db = getDB();
    await db.update(workspaceRuns).set({ workspaceId: workspaceId }).where(eq(workspaceRuns.id, id));
  }

  static async updateConfig(id: string, config: WorkspaceRun['config']): Promise<void> {
    const db = getDB();
    await db
      .update(workspaceRuns)
      .set({ configJson: serializeStoredJsonOrNull(config) })
      .where(eq(workspaceRuns.id, id));
  }

  static async clearWorkspace(
    workspaceId: string,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.update(workspaceRuns).set({ workspaceId: null }).where(eq(workspaceRuns.workspaceId, workspaceId));
  }

  static async deleteByWorkspace(
    workspaceId: string,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.delete(workspaceRuns).where(eq(workspaceRuns.workspaceId, workspaceId));
  }

  static async clearAll(db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.delete(workspaceRuns);
  }

  static async delete(id: string): Promise<void> {
    const db = getDB();
    await db.delete(workspaceRuns).where(eq(workspaceRuns.id, id));
  }
}
