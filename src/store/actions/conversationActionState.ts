import type {
  AgentAction,
  BoardAgentAction,
  BoardAgentSession,
  ChatMessage,
  ChatSession,
} from '@/types';

import type { WorkspaceState } from '../workspaceStore';

export interface CreateChatSessionInput {
  workspaceId: string;
  title?: string;
  sourceArtifactId?: string;
  packId?: string;
  purposeId?: string;
  provider?: ChatSession['provider'];
  modelId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateBoardAgentSessionInput {
  workspaceId: string;
  boardId: string;
  title?: string;
  request: string;
  provider?: BoardAgentSession['provider'];
  modelId?: string;
  metadata?: Record<string, unknown>;
}

export const buildChatSessionRecord = (input: {
  defaults: {
    provider?: ChatSession['provider'];
    modelId?: string;
  };
  id: string;
  input: CreateChatSessionInput;
  now: number;
}): ChatSession => ({
  id: input.id,
  workspaceId: input.input.workspaceId,
  title: input.input.title?.trim() || 'Untitled Chat',
  status: 'ACTIVE',
  sourceArtifactId: input.input.sourceArtifactId,
  packId: input.input.packId,
  purposeId: input.input.purposeId,
  provider: input.input.provider || input.defaults.provider,
  modelId: input.input.modelId || input.defaults.modelId,
  metadata: input.input.metadata,
  createdAt: input.now,
  updatedAt: input.now,
});

export const buildCreateChatSessionState = (
  state: WorkspaceState,
  session: ChatSession
): Partial<WorkspaceState> => ({
  chatSessions: [session, ...state.chatSessions],
  activeChatSessionId: session.id,
});

export const buildUpdateChatSessionState = (
  state: WorkspaceState,
  sessionId: string,
  patch: Partial<Omit<ChatSession, 'id' | 'workspaceId' | 'createdAt'>>,
  updatedAt: number
): Partial<WorkspaceState> => ({
  chatSessions: state.chatSessions.map((session) =>
    session.id === sessionId
      ? {
          ...session,
          ...patch,
          updatedAt,
        }
      : session
  ),
});

export const buildDeleteChatSessionState = (
  state: WorkspaceState,
  sessionId: string
): Partial<WorkspaceState> => {
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
      state.activeChatSessionId === sessionId ? chatSessions[0]?.id || null : state.activeChatSessionId,
  };
};

export const buildAddChatMessageState = (
  state: WorkspaceState,
  message: ChatMessage
): Partial<WorkspaceState> => ({
  chatMessagesBySessionId: {
    ...state.chatMessagesBySessionId,
    [message.sessionId]: [...(state.chatMessagesBySessionId[message.sessionId] || []), message],
  },
  chatSessions: state.chatSessions.map((session) =>
    session.id === message.sessionId ? { ...session, updatedAt: message.updatedAt } : session
  ),
});

export const buildUpdateChatMessageState = (
  state: WorkspaceState,
  messageId: string,
  sessionId: string,
  patch: Partial<ChatMessage>,
  updatedAt: number
): Partial<WorkspaceState> => ({
  chatMessagesBySessionId: {
    ...state.chatMessagesBySessionId,
    [sessionId]: (state.chatMessagesBySessionId[sessionId] || []).map((message) =>
      message.id === messageId
        ? {
            ...message,
            ...patch,
            updatedAt,
            attachments: patch.attachments ?? message.attachments,
          }
        : message
    ),
  },
});

export const buildAddChatActionState = (
  state: WorkspaceState,
  action: AgentAction
): Partial<WorkspaceState> => ({
  chatActionsBySessionId: {
    ...state.chatActionsBySessionId,
    [action.sessionId]: [...(state.chatActionsBySessionId[action.sessionId] || []), action],
  },
});

export const buildBoardAgentSessionRecord = (input: {
  id: string;
  input: CreateBoardAgentSessionInput;
  now: number;
}): BoardAgentSession => ({
  id: input.id,
  workspaceId: input.input.workspaceId,
  boardId: input.input.boardId,
  title: input.input.title?.trim() || 'Board Agent Session',
  status: 'PENDING',
  request: input.input.request,
  requestState: 'QUEUED',
  provider: input.input.provider,
  modelId: input.input.modelId,
  metadata: input.input.metadata,
  createdAt: input.now,
  updatedAt: input.now,
});

export const buildCreateBoardAgentSessionState = (
  state: WorkspaceState,
  session: BoardAgentSession
): Partial<WorkspaceState> => ({
  boardAgentSessions: [session, ...state.boardAgentSessions],
});

export const buildUpdateBoardAgentSessionState = (
  state: WorkspaceState,
  sessionId: string,
  patch: Partial<Omit<BoardAgentSession, 'id' | 'workspaceId' | 'boardId' | 'createdAt'>>,
  updatedAt: number
): Partial<WorkspaceState> => ({
  boardAgentSessions: state.boardAgentSessions.map((session) =>
    session.id === sessionId
      ? {
          ...session,
          ...patch,
          updatedAt,
        }
      : session
  ),
});

export const buildAddBoardAgentActionState = (
  state: WorkspaceState,
  action: BoardAgentAction
): Partial<WorkspaceState> => ({
  boardAgentActionsBySessionId: {
    ...state.boardAgentActionsBySessionId,
    [action.sessionId]: [...(state.boardAgentActionsBySessionId[action.sessionId] || []), action],
  },
  boardAgentSessions: state.boardAgentSessions.map((session) =>
    session.id === action.sessionId ? { ...session, updatedAt: action.updatedAt } : session
  ),
});

export const buildUpdateBoardAgentActionState = (
  state: WorkspaceState,
  actionId: string,
  sessionId: string,
  patch: Partial<
    Omit<BoardAgentAction, 'id' | 'sessionId' | 'workspaceId' | 'boardId' | 'createdAt'>
  >,
  updatedAt: number
): Partial<WorkspaceState> => ({
  boardAgentActionsBySessionId: {
    ...state.boardAgentActionsBySessionId,
    [sessionId]: (state.boardAgentActionsBySessionId[sessionId] || []).map((action) =>
      action.id === actionId
        ? {
            ...action,
            ...patch,
            updatedAt,
          }
        : action
    ),
  },
  boardAgentSessions: state.boardAgentSessions.map((session) =>
    session.id === sessionId ? { ...session, updatedAt } : session
  ),
});
