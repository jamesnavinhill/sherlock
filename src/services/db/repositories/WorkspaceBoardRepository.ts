import { asc, eq } from 'drizzle-orm';
import type { WorkspaceBoard, WorkspaceBoardDocument } from '@/types';
import { getDB, runWriteTransaction, type SherlockWriteExecutor } from '../client';
import { workspaceBoardDocuments, workspaceBoards } from '../schema';
import { BoardAgentRepository } from './BoardAgentRepository';
import {
  mapRowsSafely,
  parseStoredJson,
  parseStoredJsonOrUndefined,
  serializeStoredJsonOrNull,
  serializeStoredJsonOrUndefined,
} from './json';

const mapBoard = (row: typeof workspaceBoards.$inferSelect): WorkspaceBoard => ({
  id: row.id,
  workspaceId: row.workspaceId,
  name: row.name,
  description: row.description || undefined,
  sortOrder: row.sortOrder,
  presentationMode: !!row.presentationMode,
  metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
    row.metadataJson,
    `workspace board metadata ${row.id}`
  ),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const mapBoardDocument = (
  row: typeof workspaceBoardDocuments.$inferSelect
): WorkspaceBoardDocument => ({
  boardId: row.boardId,
  snapshot: parseStoredJson<WorkspaceBoardDocument['snapshot']>(
    row.snapshotJson,
    null,
    `workspace board snapshot ${row.boardId}`
  ),
  updatedAt: row.updatedAt,
});

export class WorkspaceBoardRepository {
  static async getAllBoards(): Promise<WorkspaceBoard[]> {
    const db = getDB();
    const rows = await db.select().from(workspaceBoards).orderBy(asc(workspaceBoards.sortOrder));
    return mapRowsSafely(rows, {
      label: 'workspace board',
      getRowId: (row) => row.id,
      mapRow: mapBoard,
    });
  }

  static async getAllDocuments(): Promise<WorkspaceBoardDocument[]> {
    const db = getDB();
    const rows = await db.select().from(workspaceBoardDocuments);
    return mapRowsSafely(rows, {
      label: 'workspace board document',
      getRowId: (row) => row.boardId,
      mapRow: mapBoardDocument,
    });
  }

  static async createBoard(
    board: WorkspaceBoard,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.insert(workspaceBoards).values({
      id: board.id,
      workspaceId: board.workspaceId,
      name: board.name,
      description: board.description,
      sortOrder: board.sortOrder,
      presentationMode: board.presentationMode ? 1 : 0,
      metadataJson: serializeStoredJsonOrNull(board.metadata),
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    });
  }

  static async upsertBoard(board: WorkspaceBoard): Promise<void> {
    const db = getDB();
    await db
      .insert(workspaceBoards)
      .values({
        id: board.id,
        workspaceId: board.workspaceId,
        name: board.name,
        description: board.description,
        sortOrder: board.sortOrder,
        presentationMode: board.presentationMode ? 1 : 0,
        metadataJson: serializeStoredJsonOrNull(board.metadata),
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      })
      .onConflictDoUpdate({
        target: workspaceBoards.id,
        set: {
          workspaceId: board.workspaceId,
          name: board.name,
          description: board.description,
          sortOrder: board.sortOrder,
          presentationMode: board.presentationMode ? 1 : 0,
          metadataJson: serializeStoredJsonOrNull(board.metadata),
          updatedAt: board.updatedAt,
        },
      });
  }

  static async updateBoard(id: string, patch: Partial<WorkspaceBoard>): Promise<void> {
    const db = getDB();
    await db
      .update(workspaceBoards)
      .set({
        workspaceId: patch.workspaceId,
        name: patch.name,
        description: patch.description,
        sortOrder: patch.sortOrder,
        presentationMode:
          typeof patch.presentationMode === 'boolean' ? (patch.presentationMode ? 1 : 0) : undefined,
        metadataJson: serializeStoredJsonOrUndefined(patch.metadata),
        updatedAt: patch.updatedAt ?? Date.now(),
      })
      .where(eq(workspaceBoards.id, id));
  }

  static async upsertDocument(
    document: WorkspaceBoardDocument,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db
      .insert(workspaceBoardDocuments)
      .values({
        boardId: document.boardId,
        snapshotJson: serializeStoredJsonOrNull(document.snapshot),
        updatedAt: document.updatedAt,
      })
      .onConflictDoUpdate({
        target: workspaceBoardDocuments.boardId,
        set: {
          snapshotJson: serializeStoredJsonOrNull(document.snapshot),
          updatedAt: document.updatedAt,
        },
      });
  }

  static async deleteBoard(boardId: string, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      await BoardAgentRepository.deleteSessionsForBoard(boardId, executor);
      await executor.delete(workspaceBoardDocuments).where(eq(workspaceBoardDocuments.boardId, boardId));
      await executor.delete(workspaceBoards).where(eq(workspaceBoards.id, boardId));
    }, db);
  }

  static async deleteByWorkspace(
    workspaceId: string,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    const boardRows = await db
      .select({ id: workspaceBoards.id })
      .from(workspaceBoards)
      .where(eq(workspaceBoards.workspaceId, workspaceId));

    for (const board of boardRows) {
      await this.deleteBoard(board.id, db);
    }
  }

  static async clearAll(db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.delete(workspaceBoardDocuments);
    await db.delete(workspaceBoards);
  }
}
