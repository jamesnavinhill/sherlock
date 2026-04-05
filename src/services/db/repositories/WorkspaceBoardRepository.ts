import { asc, eq } from 'drizzle-orm';
import type { WorkspaceBoard, WorkspaceBoardDocument } from '@/types';
import { getDB, runWriteTransaction, type SherlockWriteExecutor } from '../client';
import { workspaceBoardDocuments, workspaceBoards } from '../schema';
import { BoardAgentRepository } from './BoardAgentRepository';

const mapBoard = (row: typeof workspaceBoards.$inferSelect): WorkspaceBoard => ({
  id: row.id,
  workspaceId: row.workspaceId,
  name: row.name,
  description: row.description || undefined,
  sortOrder: row.sortOrder,
  presentationMode: !!row.presentationMode,
  metadata: row.metadataJson ? JSON.parse(row.metadataJson) : undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const mapBoardDocument = (
  row: typeof workspaceBoardDocuments.$inferSelect
): WorkspaceBoardDocument => ({
  boardId: row.boardId,
  snapshot: row.snapshotJson ? JSON.parse(row.snapshotJson) : null,
  updatedAt: row.updatedAt,
});

export class WorkspaceBoardRepository {
  static async getAllBoards(): Promise<WorkspaceBoard[]> {
    const db = getDB();
    const rows = await db.select().from(workspaceBoards).orderBy(asc(workspaceBoards.sortOrder));
    return rows.map(mapBoard);
  }

  static async getAllDocuments(): Promise<WorkspaceBoardDocument[]> {
    const db = getDB();
    const rows = await db.select().from(workspaceBoardDocuments);
    return rows.map(mapBoardDocument);
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
      metadataJson: board.metadata ? JSON.stringify(board.metadata) : null,
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
        metadataJson: board.metadata ? JSON.stringify(board.metadata) : null,
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
          metadataJson: board.metadata ? JSON.stringify(board.metadata) : null,
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
        metadataJson: patch.metadata ? JSON.stringify(patch.metadata) : undefined,
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
        snapshotJson: document.snapshot ? JSON.stringify(document.snapshot) : null,
        updatedAt: document.updatedAt,
      })
      .onConflictDoUpdate({
        target: workspaceBoardDocuments.boardId,
        set: {
          snapshotJson: document.snapshot ? JSON.stringify(document.snapshot) : null,
          updatedAt: document.updatedAt,
        },
      });
  }

  static async deleteBoard(boardId: string, db?: SherlockWriteExecutor): Promise<void> {
    if (!db) {
      await runWriteTransaction(async (tx) => this.deleteBoard(boardId, tx));
      return;
    }

    await BoardAgentRepository.deleteSessionsForBoard(boardId, db);
    await db.delete(workspaceBoardDocuments).where(eq(workspaceBoardDocuments.boardId, boardId));
    await db.delete(workspaceBoards).where(eq(workspaceBoards.id, boardId));
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
