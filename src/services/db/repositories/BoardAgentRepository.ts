import { desc, eq } from 'drizzle-orm';
import type { BoardAgentAction, BoardAgentSession } from '@/types';
import { getDB, runWriteTransaction, type SherlockWriteExecutor } from '../client';
import { boardAgentActions, boardAgentSessions } from '../schema';
import {
  mapRowsSafely,
  parseStoredJsonOrUndefined,
  serializeStoredJsonOrNull,
  serializeStoredJsonOrUndefined,
} from './json';

const mapSession = (row: typeof boardAgentSessions.$inferSelect): BoardAgentSession => ({
  id: row.id,
  workspaceId: row.workspaceId,
  boardId: row.boardId,
  title: row.title,
  status: row.status as BoardAgentSession['status'],
  request: row.request,
  requestState: row.requestState as BoardAgentSession['requestState'],
  provider: row.provider as BoardAgentSession['provider'],
  modelId: row.modelId || undefined,
  contextSnapshotId: row.contextSnapshotId || undefined,
  lastError: row.lastError || undefined,
  metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
    row.metadataJson,
    `board-agent session metadata ${row.id}`
  ),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  startedAt: row.startedAt || undefined,
  completedAt: row.completedAt || undefined,
});

const mapAction = (row: typeof boardAgentActions.$inferSelect): BoardAgentAction => ({
  id: row.id,
  sessionId: row.sessionId,
  workspaceId: row.workspaceId,
  boardId: row.boardId,
  type: row.type as BoardAgentAction['type'],
  status: row.status as BoardAgentAction['status'],
  input: parseStoredJsonOrUndefined<Record<string, unknown>>(
    row.inputJson,
    `board-agent action input ${row.id}`
  ),
  normalizedInput: parseStoredJsonOrUndefined<Record<string, unknown>>(
    row.normalizedInputJson,
    `board-agent action normalized input ${row.id}`
  ),
  result: parseStoredJsonOrUndefined<Record<string, unknown>>(
    row.resultJson,
    `board-agent action result ${row.id}`
  ),
  affectedCanonicalIds: parseStoredJsonOrUndefined<string[]>(
    row.affectedCanonicalIdsJson,
    `board-agent action affected canonical ids ${row.id}`
  ),
  affectedBoardShapeIds: parseStoredJsonOrUndefined<string[]>(
    row.affectedBoardShapeIdsJson,
    `board-agent action affected board shape ids ${row.id}`
  ),
  error: row.error || undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class BoardAgentRepository {
  static async getAllSessions(): Promise<BoardAgentSession[]> {
    const db = getDB();
    const rows = await db.select().from(boardAgentSessions).orderBy(desc(boardAgentSessions.updatedAt));
    return mapRowsSafely(rows, {
      label: 'board-agent session',
      getRowId: (row) => row.id,
      mapRow: mapSession,
    });
  }

  static async getActionsForSession(sessionId: string): Promise<BoardAgentAction[]> {
    const db = getDB();
    const rows = await db
      .select()
      .from(boardAgentActions)
      .where(eq(boardAgentActions.sessionId, sessionId))
      .orderBy(desc(boardAgentActions.createdAt));
    return mapRowsSafely(rows, {
      label: 'board-agent action',
      getRowId: (row) => row.id,
      mapRow: mapAction,
    });
  }

  static async createSession(
    session: BoardAgentSession,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.insert(boardAgentSessions).values({
      id: session.id,
      workspaceId: session.workspaceId,
      boardId: session.boardId,
      title: session.title,
      status: session.status,
      request: session.request,
      requestState: session.requestState,
      provider: session.provider || null,
      modelId: session.modelId || null,
      contextSnapshotId: session.contextSnapshotId || null,
      lastError: session.lastError || null,
      metadataJson: serializeStoredJsonOrNull(session.metadata),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      startedAt: session.startedAt || null,
      completedAt: session.completedAt || null,
    });
  }

  static async updateSession(
    id: string,
    patch: Partial<Omit<BoardAgentSession, 'id' | 'workspaceId' | 'boardId' | 'createdAt'>>
  ): Promise<void> {
    const db = getDB();
    await db
      .update(boardAgentSessions)
      .set({
        title: patch.title,
        status: patch.status,
        request: patch.request,
        requestState: patch.requestState,
        provider: patch.provider === undefined ? undefined : patch.provider || null,
        modelId: patch.modelId === undefined ? undefined : patch.modelId || null,
        contextSnapshotId:
          patch.contextSnapshotId === undefined ? undefined : patch.contextSnapshotId || null,
        lastError: patch.lastError === undefined ? undefined : patch.lastError || null,
        metadataJson:
          serializeStoredJsonOrUndefined(patch.metadata),
        updatedAt: patch.updatedAt ?? Date.now(),
        startedAt: patch.startedAt === undefined ? undefined : patch.startedAt || null,
        completedAt: patch.completedAt === undefined ? undefined : patch.completedAt || null,
      })
      .where(eq(boardAgentSessions.id, id));
  }

  static async createAction(
    action: BoardAgentAction,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.insert(boardAgentActions).values({
      id: action.id,
      sessionId: action.sessionId,
      workspaceId: action.workspaceId,
      boardId: action.boardId,
      type: action.type,
      status: action.status,
      inputJson: serializeStoredJsonOrNull(action.input),
      normalizedInputJson: serializeStoredJsonOrNull(action.normalizedInput),
      resultJson: serializeStoredJsonOrNull(action.result),
      affectedCanonicalIdsJson: serializeStoredJsonOrNull(action.affectedCanonicalIds),
      affectedBoardShapeIdsJson: serializeStoredJsonOrNull(action.affectedBoardShapeIds),
      error: action.error || null,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    });
  }

  static async updateAction(
    id: string,
    patch: Partial<Omit<BoardAgentAction, 'id' | 'sessionId' | 'workspaceId' | 'boardId' | 'createdAt'>>
  ): Promise<void> {
    const db = getDB();
    await db
      .update(boardAgentActions)
      .set({
        type: patch.type,
        status: patch.status,
        inputJson: serializeStoredJsonOrUndefined(patch.input),
        normalizedInputJson: serializeStoredJsonOrUndefined(patch.normalizedInput),
        resultJson: serializeStoredJsonOrUndefined(patch.result),
        affectedCanonicalIdsJson: serializeStoredJsonOrUndefined(patch.affectedCanonicalIds),
        affectedBoardShapeIdsJson: serializeStoredJsonOrUndefined(patch.affectedBoardShapeIds),
        error: patch.error === undefined ? undefined : patch.error || null,
        updatedAt: patch.updatedAt ?? Date.now(),
      })
      .where(eq(boardAgentActions.id, id));
  }

  static async deleteSession(id: string, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      await executor.delete(boardAgentActions).where(eq(boardAgentActions.sessionId, id));
      await executor.delete(boardAgentSessions).where(eq(boardAgentSessions.id, id));
    }, db);
  }

  static async deleteSessionsForWorkspace(
    workspaceId: string,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    const sessions = await db
      .select({ id: boardAgentSessions.id })
      .from(boardAgentSessions)
      .where(eq(boardAgentSessions.workspaceId, workspaceId));

    for (const session of sessions) {
      await this.deleteSession(session.id, db);
    }
  }

  static async deleteSessionsForBoard(
    boardId: string,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    const sessions = await db
      .select({ id: boardAgentSessions.id })
      .from(boardAgentSessions)
      .where(eq(boardAgentSessions.boardId, boardId));

    for (const session of sessions) {
      await this.deleteSession(session.id, db);
    }
  }

  static async clearAll(db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.delete(boardAgentActions);
    await db.delete(boardAgentSessions);
  }
}
