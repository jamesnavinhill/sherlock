import { desc, eq, inArray } from 'drizzle-orm';
import type { AgentAction, ChatAttachment, ChatMessage, ChatSession } from '@/types';
import { getDB, runWriteTransaction, type SherlockWriteExecutor } from '../client';
import { chatActions, chatMessageAttachments, chatMessages, chatSessions } from '../schema';

const parseJson = <T>(value: string | null | undefined): T | undefined => {
  if (!value) return undefined;

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

const mapAttachment = (row: typeof chatMessageAttachments.$inferSelect): ChatAttachment => ({
  id: row.id,
  messageId: row.messageId,
  kind: row.kind as ChatAttachment['kind'],
  title: row.title,
  refId: row.refId || undefined,
  refKind: row.refKind || undefined,
  snippet: row.snippet || undefined,
  metadata: parseJson<Record<string, unknown>>(row.metadataJson),
  createdAt: row.createdAt,
});

const mapMessage = (
  row: typeof chatMessages.$inferSelect,
  attachments: ChatAttachment[] = []
): ChatMessage => ({
  id: row.id,
  sessionId: row.sessionId,
  role: row.role as ChatMessage['role'],
  content: row.content,
  status: row.status as ChatMessage['status'],
  citations: parseJson<string[]>(row.citationsJson),
  metadata: parseJson<Record<string, unknown>>(row.metadataJson),
  error: row.error || undefined,
  attachments,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const mapSession = (row: typeof chatSessions.$inferSelect): ChatSession => ({
  id: row.id,
  workspaceId: row.workspaceId,
  title: row.title,
  status: row.status as ChatSession['status'],
  sourceReportId: row.sourceReportId || undefined,
  packId: row.packId || undefined,
  purposeId: row.purposeId || undefined,
  provider: row.provider as ChatSession['provider'],
  modelId: row.modelId || undefined,
  metadata: parseJson<Record<string, unknown>>(row.metadataJson),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const mapAction = (row: typeof chatActions.$inferSelect): AgentAction => ({
  id: row.id,
  sessionId: row.sessionId,
  messageId: row.messageId || undefined,
  type: row.type as AgentAction['type'],
  status: row.status as AgentAction['status'],
  input: parseJson<Record<string, unknown>>(row.inputJson),
  result: parseJson<Record<string, unknown>>(row.resultJson),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class ChatRepository {
  static async getAllSessions(): Promise<ChatSession[]> {
    const db = getDB();
    const rows = await db.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt));
    return rows.map(mapSession);
  }

  static async getMessagesBySessionIds(
    sessionIds: string[]
  ): Promise<Record<string, ChatMessage[]>> {
    if (sessionIds.length === 0) return {};

    const db = getDB();
    const messageRows = await db
      .select()
      .from(chatMessages)
      .where(inArray(chatMessages.sessionId, sessionIds))
      .orderBy(chatMessages.createdAt);
    const messageIds = messageRows.map((row) => row.id);
    const attachmentRows = messageIds.length
      ? await db
          .select()
          .from(chatMessageAttachments)
          .where(inArray(chatMessageAttachments.messageId, messageIds))
          .orderBy(chatMessageAttachments.createdAt)
      : [];

    const attachmentsByMessageId = new Map<string, ChatAttachment[]>();
    attachmentRows.forEach((row) => {
      const existing = attachmentsByMessageId.get(row.messageId) || [];
      existing.push(mapAttachment(row));
      attachmentsByMessageId.set(row.messageId, existing);
    });

    return messageRows.reduce<Record<string, ChatMessage[]>>((acc, row) => {
      const next = acc[row.sessionId] || [];
      next.push(mapMessage(row, attachmentsByMessageId.get(row.id) || []));
      acc[row.sessionId] = next;
      return acc;
    }, {});
  }

  static async createSession(
    session: ChatSession,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.insert(chatSessions).values({
      id: session.id,
      workspaceId: session.workspaceId,
      title: session.title,
      status: session.status,
      sourceReportId: session.sourceReportId || null,
      packId: session.packId || null,
      purposeId: session.purposeId || null,
      provider: session.provider || null,
      modelId: session.modelId || null,
      metadataJson: session.metadata ? JSON.stringify(session.metadata) : null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  }

  static async updateSession(
    id: string,
    patch: Partial<Omit<ChatSession, 'id' | 'workspaceId' | 'createdAt'>>
  ): Promise<void> {
    const db = getDB();
    await db
      .update(chatSessions)
      .set({
        title: patch.title,
        status: patch.status,
        sourceReportId:
          patch.sourceReportId === undefined ? undefined : patch.sourceReportId || null,
        packId: patch.packId === undefined ? undefined : patch.packId || null,
        purposeId: patch.purposeId === undefined ? undefined : patch.purposeId || null,
        provider: patch.provider === undefined ? undefined : patch.provider || null,
        modelId: patch.modelId === undefined ? undefined : patch.modelId || null,
        metadataJson:
          patch.metadata === undefined
            ? undefined
            : patch.metadata
              ? JSON.stringify(patch.metadata)
              : null,
        updatedAt: patch.updatedAt ?? Date.now(),
      })
      .where(eq(chatSessions.id, id));
  }

  static async deleteSession(id: string, db?: SherlockWriteExecutor): Promise<void> {
    if (!db) {
      await runWriteTransaction(async (tx) => this.deleteSession(id, tx));
      return;
    }

    const messages = await db
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, id));
    const messageIds = messages.map((row) => row.id);

    if (messageIds.length > 0) {
      await db
        .delete(chatMessageAttachments)
        .where(inArray(chatMessageAttachments.messageId, messageIds));
    }

    await db.delete(chatActions).where(eq(chatActions.sessionId, id));
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, id));
    await db.delete(chatSessions).where(eq(chatSessions.id, id));
  }

  static async deleteSessionsForWorkspace(
    workspaceId: string,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    const sessions = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.workspaceId, workspaceId));

    for (const session of sessions) {
      await this.deleteSession(session.id, db);
    }
  }

  static async clearAll(db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.delete(chatMessageAttachments);
    await db.delete(chatActions);
    await db.delete(chatMessages);
    await db.delete(chatSessions);
  }

  static async createMessage(message: ChatMessage, db?: SherlockWriteExecutor): Promise<void> {
    if (!db) {
      await runWriteTransaction(async (tx) => this.createMessage(message, tx));
      return;
    }

    await db.insert(chatMessages).values({
      id: message.id,
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      status: message.status,
      citationsJson: message.citations ? JSON.stringify(message.citations) : null,
      metadataJson: message.metadata ? JSON.stringify(message.metadata) : null,
      error: message.error || null,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    });

    if (message.attachments?.length) {
      for (const attachment of message.attachments) {
        await db.insert(chatMessageAttachments).values({
          id: attachment.id,
          messageId: message.id,
          kind: attachment.kind,
          title: attachment.title,
          refId: attachment.refId || null,
          refKind: attachment.refKind || null,
          snippet: attachment.snippet || null,
          metadataJson: attachment.metadata ? JSON.stringify(attachment.metadata) : null,
          createdAt: attachment.createdAt,
        });
      }
    }
  }

  static async updateMessage(
    id: string,
    patch: Partial<Omit<ChatMessage, 'id' | 'sessionId' | 'role' | 'createdAt' | 'attachments'>>
  ): Promise<void> {
    const db = getDB();
    await db
      .update(chatMessages)
      .set({
        content: patch.content,
        status: patch.status,
        citationsJson:
          patch.citations === undefined
            ? undefined
            : patch.citations
              ? JSON.stringify(patch.citations)
              : null,
        metadataJson:
          patch.metadata === undefined
            ? undefined
            : patch.metadata
              ? JSON.stringify(patch.metadata)
              : null,
        error: patch.error === undefined ? undefined : patch.error || null,
        updatedAt: patch.updatedAt ?? Date.now(),
      })
      .where(eq(chatMessages.id, id));
  }

  static async replaceAttachments(
    messageId: string,
    attachments: ChatAttachment[],
    db?: SherlockWriteExecutor
  ): Promise<void> {
    if (!db) {
      await runWriteTransaction(async (tx) =>
        this.replaceAttachments(messageId, attachments, tx)
      );
      return;
    }

    await db.delete(chatMessageAttachments).where(eq(chatMessageAttachments.messageId, messageId));

    for (const attachment of attachments) {
      await db.insert(chatMessageAttachments).values({
        id: attachment.id,
        messageId,
        kind: attachment.kind,
        title: attachment.title,
        refId: attachment.refId || null,
        refKind: attachment.refKind || null,
        snippet: attachment.snippet || null,
        metadataJson: attachment.metadata ? JSON.stringify(attachment.metadata) : null,
        createdAt: attachment.createdAt,
      });
    }
  }

  static async createAction(
    action: AgentAction,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db.insert(chatActions).values({
      id: action.id,
      sessionId: action.sessionId,
      messageId: action.messageId || null,
      type: action.type,
      status: action.status,
      inputJson: action.input ? JSON.stringify(action.input) : null,
      resultJson: action.result ? JSON.stringify(action.result) : null,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    });
  }

  static async getActionsForSession(sessionId: string): Promise<AgentAction[]> {
    const db = getDB();
    const rows = await db
      .select()
      .from(chatActions)
      .where(eq(chatActions.sessionId, sessionId))
      .orderBy(desc(chatActions.createdAt));

    return rows.map(mapAction);
  }
}
