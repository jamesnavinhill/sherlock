import { createLocalId } from '@/utils/id';
import { loadSystemConfig } from '@/config/systemConfig';
import { ChatRepository } from '@/services/db/repositories/ChatRepository';
import { BoardAgentRepository } from '@/services/db/repositories/BoardAgentRepository';

import type { WorkspaceState } from '../workspaceStore';
import type { WorkspaceStoreApi } from './shared';

export const createConversationActions = ({
  get,
  set,
}: WorkspaceStoreApi): Pick<
  WorkspaceState,
  | 'createChatSession'
  | 'updateChatSession'
  | 'renameChatSession'
  | 'deleteChatSession'
  | 'addChatMessage'
  | 'updateChatMessage'
  | 'addChatAction'
  | 'createBoardAgentSession'
  | 'updateBoardAgentSession'
  | 'addBoardAgentAction'
  | 'updateBoardAgentAction'
> => ({
  createChatSession: async (input) => {
    const systemConfig = loadSystemConfig();
    const now = Date.now();
    const session = {
      id: createLocalId('chat-session'),
      workspaceId: input.workspaceId,
      title: input.title?.trim() || 'Untitled Chat',
      status: 'ACTIVE' as const,
      sourceArtifactId: input.sourceArtifactId,
      packId: input.packId,
      purposeId: input.purposeId,
      provider: input.provider || systemConfig.provider,
      modelId: input.modelId || systemConfig.modelId,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    await ChatRepository.createSession(session);
    set((state) => ({
      chatSessions: [session, ...state.chatSessions],
      activeChatSessionId: session.id,
    }));

    return session;
  },
  updateChatSession: async (sessionId, patch) => {
    const updatedAt = patch.updatedAt ?? Date.now();
    await ChatRepository.updateSession(sessionId, { ...patch, updatedAt });
    set((state) => ({
      chatSessions: state.chatSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              ...patch,
              updatedAt,
            }
          : session
      ),
    }));
  },
  renameChatSession: async (sessionId, title) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    await get().updateChatSession(sessionId, { title: trimmedTitle });
  },
  deleteChatSession: async (sessionId) => {
    await ChatRepository.deleteSession(sessionId);
    set((state) => {
      const chatSessions = state.chatSessions.filter((session) => session.id !== sessionId);
      const chatMessagesBySessionId = { ...state.chatMessagesBySessionId };
      const chatActionsBySessionId = { ...state.chatActionsBySessionId };
      delete chatMessagesBySessionId[sessionId];
      delete chatActionsBySessionId[sessionId];

      return {
        chatSessions,
        chatMessagesBySessionId,
        chatActionsBySessionId,
        activeChatSessionId:
          state.activeChatSessionId === sessionId
            ? chatSessions[0]?.id || null
            : state.activeChatSessionId,
      };
    });
  },
  addChatMessage: async (message) => {
    await ChatRepository.createMessage(message);
    set((state) => ({
      chatMessagesBySessionId: {
        ...state.chatMessagesBySessionId,
        [message.sessionId]: [...(state.chatMessagesBySessionId[message.sessionId] || []), message],
      },
      chatSessions: state.chatSessions.map((session) =>
        session.id === message.sessionId ? { ...session, updatedAt: message.updatedAt } : session
      ),
    }));
  },
  updateChatMessage: async (messageId, sessionId, patch) => {
    await ChatRepository.updateMessage(messageId, patch);
    if (patch.attachments) {
      await ChatRepository.replaceAttachments(messageId, patch.attachments);
    }

    set((state) => ({
      chatMessagesBySessionId: {
        ...state.chatMessagesBySessionId,
        [sessionId]: (state.chatMessagesBySessionId[sessionId] || []).map((message) =>
          message.id === messageId
            ? {
                ...message,
                ...patch,
                updatedAt: patch.updatedAt ?? Date.now(),
                attachments: patch.attachments ?? message.attachments,
              }
            : message
        ),
      },
    }));
  },
  addChatAction: async (action) => {
    await ChatRepository.createAction(action);
    set((state) => ({
      chatActionsBySessionId: {
        ...state.chatActionsBySessionId,
        [action.sessionId]: [...(state.chatActionsBySessionId[action.sessionId] || []), action],
      },
    }));
  },
  createBoardAgentSession: async (input) => {
    const now = Date.now();
    const session = {
      id: createLocalId('board-agent-session'),
      workspaceId: input.workspaceId,
      boardId: input.boardId,
      title: input.title?.trim() || 'Board Agent Session',
      status: 'PENDING' as const,
      request: input.request,
      requestState: 'QUEUED' as const,
      provider: input.provider,
      modelId: input.modelId,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    await BoardAgentRepository.createSession(session);
    set((state) => ({
      boardAgentSessions: [session, ...state.boardAgentSessions],
    }));
    return session;
  },
  updateBoardAgentSession: async (sessionId, patch) => {
    await BoardAgentRepository.updateSession(sessionId, patch);
    set((state) => ({
      boardAgentSessions: state.boardAgentSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              ...patch,
              updatedAt: patch.updatedAt ?? Date.now(),
            }
          : session
      ),
    }));
  },
  addBoardAgentAction: async (action) => {
    await BoardAgentRepository.createAction(action);
    set((state) => ({
      boardAgentActionsBySessionId: {
        ...state.boardAgentActionsBySessionId,
        [action.sessionId]: [
          ...(state.boardAgentActionsBySessionId[action.sessionId] || []),
          action,
        ],
      },
      boardAgentSessions: state.boardAgentSessions.map((session) =>
        session.id === action.sessionId ? { ...session, updatedAt: action.updatedAt } : session
      ),
    }));
  },
  updateBoardAgentAction: async (actionId, sessionId, patch) => {
    await BoardAgentRepository.updateAction(actionId, patch);
    set((state) => ({
      boardAgentActionsBySessionId: {
        ...state.boardAgentActionsBySessionId,
        [sessionId]: (state.boardAgentActionsBySessionId[sessionId] || []).map((action) =>
          action.id === actionId
            ? {
                ...action,
                ...patch,
                updatedAt: patch.updatedAt ?? Date.now(),
              }
            : action
        ),
      },
      boardAgentSessions: state.boardAgentSessions.map((session) =>
        session.id === sessionId ? { ...session, updatedAt: patch.updatedAt ?? Date.now() } : session
      ),
    }));
  },
});
