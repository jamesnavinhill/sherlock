import { createLocalId } from '@/utils/id';
import { loadSystemConfig } from '@/config/systemConfig';
import { ChatRepository } from '@/services/db/repositories/ChatRepository';
import { BoardAgentRepository } from '@/services/db/repositories/BoardAgentRepository';

import {
  buildAddBoardAgentActionState,
  buildAddChatActionState,
  buildAddChatMessageState,
  buildBoardAgentSessionRecord,
  buildChatSessionRecord,
  buildCreateBoardAgentSessionState,
  buildCreateChatSessionState,
  buildDeleteChatSessionState,
  buildUpdateBoardAgentActionState,
  buildUpdateBoardAgentSessionState,
  buildUpdateChatMessageState,
  buildUpdateChatSessionState,
} from './conversationActionState';
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
    const session = buildChatSessionRecord({
      defaults: {
        provider: systemConfig.provider,
        modelId: systemConfig.modelId,
      },
      id: createLocalId('chat-session'),
      input,
      now,
    });

    await ChatRepository.createSession(session);
    set((state) => buildCreateChatSessionState(state, session));

    return session;
  },
  updateChatSession: async (sessionId, patch) => {
    const updatedAt = patch.updatedAt ?? Date.now();
    await ChatRepository.updateSession(sessionId, { ...patch, updatedAt });
    set((state) => buildUpdateChatSessionState(state, sessionId, patch, updatedAt));
  },
  renameChatSession: async (sessionId, title) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    await get().updateChatSession(sessionId, { title: trimmedTitle });
  },
  deleteChatSession: async (sessionId) => {
    await ChatRepository.deleteSession(sessionId);
    set((state) => buildDeleteChatSessionState(state, sessionId));
  },
  addChatMessage: async (message) => {
    await ChatRepository.createMessage(message);
    set((state) => buildAddChatMessageState(state, message));
  },
  updateChatMessage: async (messageId, sessionId, patch) => {
    await ChatRepository.updateMessage(messageId, patch);
    if (patch.attachments) {
      await ChatRepository.replaceAttachments(messageId, patch.attachments);
    }

    const updatedAt = patch.updatedAt ?? Date.now();
    set((state) => buildUpdateChatMessageState(state, messageId, sessionId, patch, updatedAt));
  },
  addChatAction: async (action) => {
    await ChatRepository.createAction(action);
    set((state) => buildAddChatActionState(state, action));
  },
  createBoardAgentSession: async (input) => {
    const now = Date.now();
    const session = buildBoardAgentSessionRecord({
      id: createLocalId('board-agent-session'),
      input,
      now,
    });

    await BoardAgentRepository.createSession(session);
    set((state) => buildCreateBoardAgentSessionState(state, session));
    return session;
  },
  updateBoardAgentSession: async (sessionId, patch) => {
    const updatedAt = patch.updatedAt ?? Date.now();
    await BoardAgentRepository.updateSession(sessionId, patch);
    set((state) => buildUpdateBoardAgentSessionState(state, sessionId, patch, updatedAt));
  },
  addBoardAgentAction: async (action) => {
    await BoardAgentRepository.createAction(action);
    set((state) => buildAddBoardAgentActionState(state, action));
  },
  updateBoardAgentAction: async (actionId, sessionId, patch) => {
    const updatedAt = patch.updatedAt ?? Date.now();
    await BoardAgentRepository.updateAction(actionId, patch);
    set((state) =>
      buildUpdateBoardAgentActionState(state, actionId, sessionId, patch, updatedAt)
    );
  },
});
