import { desc, eq } from 'drizzle-orm';
import type { WorkspaceItem } from '@/types';
import { getDB, type SherlockWriteExecutor } from '../client';
import { workspaceItems } from '../schema';
import { parseStoredJsonOrUndefined } from './json';

const mapWorkspaceItem = (row: typeof workspaceItems.$inferSelect): WorkspaceItem => ({
  id: row.id,
  workspaceId: row.workspaceId,
  kind: row.kind as WorkspaceItem['kind'],
  title: row.title,
  description: row.description || undefined,
  textContent: row.textContent || undefined,
  url: row.url || undefined,
  mimeType: row.mimeType || undefined,
  fileName: row.fileName || undefined,
  sizeBytes: row.sizeBytes ?? undefined,
  previewUrl: row.previewUrl || undefined,
  tags: parseStoredJsonOrUndefined<string[]>(row.tagsJson, `workspace item tags ${row.id}`),
  provenance: parseStoredJsonOrUndefined<WorkspaceItem['provenance']>(
    row.provenanceJson,
    `workspace item provenance ${row.id}`
  ),
  metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
    row.metadataJson,
    `workspace item metadata ${row.id}`
  ),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class WorkspaceItemRepository {
  static async getAll(): Promise<WorkspaceItem[]> {
    const db = getDB();
    const rows = await db.select().from(workspaceItems).orderBy(desc(workspaceItems.updatedAt));
    return rows.map(mapWorkspaceItem);
  }

  static async create(
    item: WorkspaceItem,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.insert(workspaceItems).values({
      id: item.id,
      workspaceId: item.workspaceId,
      kind: item.kind,
      title: item.title,
      description: item.description,
      textContent: item.textContent,
      url: item.url,
      mimeType: item.mimeType,
      fileName: item.fileName,
      sizeBytes: item.sizeBytes,
      previewUrl: item.previewUrl,
      tagsJson: item.tags ? JSON.stringify(item.tags) : null,
      provenanceJson: item.provenance ? JSON.stringify(item.provenance) : null,
      metadataJson: item.metadata ? JSON.stringify(item.metadata) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }

  static async update(id: string, patch: Partial<WorkspaceItem>): Promise<void> {
    const db = getDB();
    await db
      .update(workspaceItems)
      .set({
        workspaceId: patch.workspaceId,
        kind: patch.kind,
        title: patch.title,
        description: patch.description,
        textContent: patch.textContent,
        url: patch.url,
        mimeType: patch.mimeType,
        fileName: patch.fileName,
        sizeBytes: patch.sizeBytes,
        previewUrl: patch.previewUrl,
        tagsJson: patch.tags ? JSON.stringify(patch.tags) : undefined,
        provenanceJson: patch.provenance ? JSON.stringify(patch.provenance) : undefined,
        metadataJson: patch.metadata ? JSON.stringify(patch.metadata) : undefined,
        updatedAt: patch.updatedAt ?? Date.now(),
      })
      .where(eq(workspaceItems.id, id));
  }

  static async upsert(item: WorkspaceItem): Promise<void> {
    const db = getDB();
    await db
      .insert(workspaceItems)
      .values({
        id: item.id,
        workspaceId: item.workspaceId,
        kind: item.kind,
        title: item.title,
        description: item.description,
        textContent: item.textContent,
        url: item.url,
        mimeType: item.mimeType,
        fileName: item.fileName,
        sizeBytes: item.sizeBytes,
        previewUrl: item.previewUrl,
        tagsJson: item.tags ? JSON.stringify(item.tags) : null,
        provenanceJson: item.provenance ? JSON.stringify(item.provenance) : null,
        metadataJson: item.metadata ? JSON.stringify(item.metadata) : null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })
      .onConflictDoUpdate({
        target: workspaceItems.id,
        set: {
          workspaceId: item.workspaceId,
          kind: item.kind,
          title: item.title,
          description: item.description,
          textContent: item.textContent,
          url: item.url,
          mimeType: item.mimeType,
          fileName: item.fileName,
          sizeBytes: item.sizeBytes,
          previewUrl: item.previewUrl,
          tagsJson: item.tags ? JSON.stringify(item.tags) : null,
          provenanceJson: item.provenance ? JSON.stringify(item.provenance) : null,
          metadataJson: item.metadata ? JSON.stringify(item.metadata) : null,
          updatedAt: item.updatedAt,
        },
      });
  }

  static async delete(id: string): Promise<void> {
    const db = getDB();
    await db.delete(workspaceItems).where(eq(workspaceItems.id, id));
  }

  static async deleteByWorkspace(
    workspaceId: string,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.delete(workspaceItems).where(eq(workspaceItems.workspaceId, workspaceId));
  }

  static async clearAll(db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.delete(workspaceItems);
  }
}
