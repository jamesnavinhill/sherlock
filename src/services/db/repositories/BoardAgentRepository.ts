import { desc, eq } from 'drizzle-orm';
import type { BoardAgentAction, BoardAgentSession } from '@/types';
import { getDB, runWriteTransaction, type SherlockWriteExecutor } from '../client';
import { boardAgentActions, boardAgentSessions } from '../schema';

const parseJson = <T>(value: string | null | undefined): T | undefined => {
  if (!value) return undefined;

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

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
  metadata: parseJson<Record<string, unknown>>(row.metadataJson),
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
  input: parseJson<Record<string, unknown>>(row.inputJson),
  normalizedInput: parseJson<Record<string, unknown>>(row.normalizedInputJson),
  result: parseJson<Record<string, unknown>>(row.resultJson),
  affectedCanonicalIds: parseJson<string[]>(row.affectedCanonicalIdsJson),
  affectedBoardShapeIds: parseJson<string[]>(row.affectedBoardShapeIdsJson),
  error: row.error || undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class BoardAgentRepository {
  static async getAllSessions(): Promise<BoardAgentSession[]> {
    const db = getDB();
    const rows = await db.select().from(boardAgentSessions).orderBy(desc(boardAgentSessions.updatedAt));
    return rows.map(mapSession);
  }

  static async getActionsForSession(sessionId: string): Promise<BoardAgentAction[]> {
    const db = getDB();
    const rows = await db
      .select()
      .from(boardAgentActions)
      .where(eq(boardAgentActions.sessionId, sessionId))
      .orderBy(desc(boardAgentActions.createdAt));
    return rows.map(mapAction);
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
      metadataJson: session.metadata ? JSON.stringify(session.metadata) : null,
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
          patch.metadata === undefined
            ? undefined
            : patch.metadata
              ? JSON.stringify(patch.metadata)
              : null,
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
      inputJson: action.input ? JSON.stringify(action.input) : null,
      normalizedInputJson: action.normalizedInput ? JSON.stringify(action.normalizedInput) : null,
      resultJson: action.result ? JSON.stringify(action.result) : null,
      affectedCanonicalIdsJson: action.affectedCanonicalIds
        ? JSON.stringify(action.affectedCanonicalIds)
        : null,
      affectedBoardShapeIdsJson: action.affectedBoardShapeIds
        ? JSON.stringify(action.affectedBoardShapeIds)
        : null,
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
        inputJson: patch.input === undefined ? undefined : patch.input ? JSON.stringify(patch.input) : null,
        normalizedInputJson:
          patch.normalizedInput === undefined
            ? undefined
            : patch.normalizedInput
              ? JSON.stringify(patch.normalizedInput)
              : null,
        resultJson: patch.result === undefined ? undefined : patch.result ? JSON.stringify(patch.result) : null,
        affectedCanonicalIdsJson:
          patch.affectedCanonicalIds === undefined
            ? undefined
            : patch.affectedCanonicalIds
              ? JSON.stringify(patch.affectedCanonicalIds)
              : null,
        affectedBoardShapeIdsJson:
          patch.affectedBoardShapeIds === undefined
            ? undefined
            : patch.affectedBoardShapeIds
              ? JSON.stringify(patch.affectedBoardShapeIds)
              : null,
        error: patch.error === undefined ? undefined : patch.error || null,
        updatedAt: patch.updatedAt ?? Date.now(),
      })
      .where(eq(boardAgentActions.id, id));
  }

  static async deleteSession(id: string, db?: SherlockWriteExecutor): Promise<void> {
    if (!db) {
      await runWriteTransaction(async (tx) => this.deleteSession(id, tx));
      return;
    }

    await db.delete(boardAgentActions).where(eq(boardAgentActions.sessionId, id));
    await db.delete(boardAgentSessions).where(eq(boardAgentSessions.id, id));
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
