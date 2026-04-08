import {
  filterManualGraphForWorkspaceRemoval,
  getWorkspaceDataSignals,
  groupBoardAgentActionsBySessionId,
  groupChatActionsBySessionId,
  groupChatMessagesBySessionId,
} from '@/services/maintenance/workspaceData';
import { SettingsRepository } from '@/services/db/repositories/SettingsRepository';
import { WorkspaceRepository } from '@/services/db/repositories/WorkspaceRepository';
import { WorkspaceBoardRepository } from '@/services/db/repositories/WorkspaceBoardRepository';
import { WorkspaceItemRepository } from '@/services/db/repositories/WorkspaceItemRepository';
import { createLocalId } from '@/utils/id';
import { setStoredActiveWorkspaceId } from '@/utils/localStorage';

import type { WorkspaceDataBackup } from '@/types';
import type { WorkspaceState } from '../workspaceStore';
import type { WorkspaceStoreApi } from './shared';

interface WorkspaceActionDependencies {
  persistWorkspaceDataBackup: (payload: WorkspaceDataBackup) => Promise<void>;
}

export const createWorkspaceActions = (
  { get, set }: WorkspaceStoreApi,
  { persistWorkspaceDataBackup }: WorkspaceActionDependencies
): Pick<
  WorkspaceState,
  | 'deleteWorkspace'
  | 'purgeWorkspace'
  | 'ensureWorkspaceBoard'
  | 'createWorkspaceBoard'
  | 'updateWorkspaceBoard'
  | 'deleteWorkspaceBoard'
  | 'saveWorkspaceBoardDocument'
  | 'createWorkspaceItem'
  | 'updateWorkspaceItem'
  | 'deleteWorkspaceItem'
  | 'importWorkspaceData'
  | 'clearWorkspaceData'
> => ({
  deleteWorkspace: async (workspaceId) => {
    await WorkspaceRepository.unassignArtifactsFromWorkspace(workspaceId);
    await WorkspaceRepository.deleteWorkspace(workspaceId);
    set((state) => {
      const boardAgentSessionIds = state.boardAgentSessions
        .filter((session) => session.workspaceId === workspaceId)
        .map((session) => session.id);
      const workspaces = state.workspaces.filter((item) => item.id !== workspaceId);
      const artifacts = state.artifacts.map((artifact) =>
        artifact.workspaceId === workspaceId ? { ...artifact, workspaceId: undefined } : artifact
      );
      const workspaceRuns = state.workspaceRuns.map((workspaceRun) => {
        if (
          workspaceRun.workspaceId !== workspaceId &&
          workspaceRun.report?.workspaceId !== workspaceId
        ) {
          return workspaceRun;
        }

        return {
          ...workspaceRun,
          workspaceId: undefined,
          report: workspaceRun.report
            ? { ...workspaceRun.report, workspaceId: undefined }
            : workspaceRun.report,
        };
      });
      const workspaceBoards = state.workspaceBoards.filter(
        (board) => board.workspaceId !== workspaceId
      );
      const workspaceBoardDocuments = Object.fromEntries(
        Object.entries(state.workspaceBoardDocuments).filter(
          ([boardId]) =>
            !state.workspaceBoards.some(
              (board) => board.id === boardId && board.workspaceId === workspaceId
            )
        )
      );

      return {
        chatSessions: state.chatSessions.filter((session) => session.workspaceId !== workspaceId),
        chatMessagesBySessionId: Object.fromEntries(
          Object.entries(state.chatMessagesBySessionId).filter(
            ([sessionId]) =>
              !state.chatSessions.some(
                (session) => session.id === sessionId && session.workspaceId === workspaceId
              )
          )
        ),
        chatActionsBySessionId: Object.fromEntries(
          Object.entries(state.chatActionsBySessionId).filter(
            ([sessionId]) =>
              !state.chatSessions.some(
                (session) => session.id === sessionId && session.workspaceId === workspaceId
              )
          )
        ),
        boardAgentSessions: state.boardAgentSessions.filter(
          (session) => session.workspaceId !== workspaceId
        ),
        boardAgentActionsBySessionId: Object.fromEntries(
          Object.entries(state.boardAgentActionsBySessionId).filter(
            ([sessionId]) => !boardAgentSessionIds.includes(sessionId)
          )
        ),
        workspaces,
        artifacts,
        headlines: state.headlines.filter((headline) => headline.workspaceId !== workspaceId),
        workspaceItems: state.workspaceItems.filter((item) => item.workspaceId !== workspaceId),
        workspaceBoards,
        workspaceBoardDocuments,
        workspaceRuns,
        activeChatSessionId:
          state.activeChatSessionId &&
          state.chatSessions.some(
            (session) =>
              session.id === state.activeChatSessionId && session.workspaceId === workspaceId
          )
            ? null
            : state.activeChatSessionId,
        activeWorkspaceId: state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceId,
        activeWorkspaceBoardId:
          state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceBoardId,
      };
    });
  },
  purgeWorkspace: async (workspaceId) => {
    await WorkspaceRepository.purgeWorkspace(workspaceId);
    set((state) => {
      const artifactIds = state.artifacts
        .filter((artifact) => artifact.workspaceId === workspaceId && !!artifact.id)
        .map((artifact) => artifact.id as string);
      const chatSessionIds = state.chatSessions
        .filter((session) => session.workspaceId === workspaceId)
        .map((session) => session.id);
      const boardAgentSessionIds = state.boardAgentSessions
        .filter((session) => session.workspaceId === workspaceId)
        .map((session) => session.id);
      const workspaceRuns = state.workspaceRuns.filter(
        (workspaceRun) =>
          workspaceRun.workspaceId !== workspaceId && workspaceRun.report?.workspaceId !== workspaceId
      );
      const activeTaskId =
        !state.activeTaskId ||
        workspaceRuns.some((workspaceRun) => workspaceRun.id === state.activeTaskId)
          ? state.activeTaskId
          : null;
      const nextGraph = filterManualGraphForWorkspaceRemoval({
        manualNodes: state.manualNodes,
        manualLinks: state.manualLinks,
        hiddenNodeIds: state.hiddenNodeIds,
        flaggedNodeIds: state.flaggedNodeIds,
        workspaceId,
        artifactIds,
      });
      const activeChatSessionId =
        !state.activeChatSessionId || !chatSessionIds.includes(state.activeChatSessionId)
          ? state.activeChatSessionId
          : null;
      const removedBoardIds = new Set(
        state.workspaceBoards
          .filter((board) => board.workspaceId === workspaceId)
          .map((board) => board.id)
      );

      return {
        chatSessions: state.chatSessions.filter((session) => session.workspaceId !== workspaceId),
        chatMessagesBySessionId: Object.fromEntries(
          Object.entries(state.chatMessagesBySessionId).filter(
            ([sessionId]) => !chatSessionIds.includes(sessionId)
          )
        ),
        chatActionsBySessionId: Object.fromEntries(
          Object.entries(state.chatActionsBySessionId).filter(
            ([sessionId]) => !chatSessionIds.includes(sessionId)
          )
        ),
        boardAgentSessions: state.boardAgentSessions.filter(
          (session) => session.workspaceId !== workspaceId
        ),
        boardAgentActionsBySessionId: Object.fromEntries(
          Object.entries(state.boardAgentActionsBySessionId).filter(
            ([sessionId]) => !boardAgentSessionIds.includes(sessionId)
          )
        ),
        workspaces: state.workspaces.filter((item) => item.id !== workspaceId),
        artifacts: state.artifacts.filter((artifact) => artifact.workspaceId !== workspaceId),
        headlines: state.headlines.filter((headline) => headline.workspaceId !== workspaceId),
        workspaceItems: state.workspaceItems.filter((item) => item.workspaceId !== workspaceId),
        workspaceBoards: state.workspaceBoards.filter((board) => board.workspaceId !== workspaceId),
        workspaceBoardDocuments: Object.fromEntries(
          Object.entries(state.workspaceBoardDocuments).filter(
            ([boardId]) => !removedBoardIds.has(boardId)
          )
        ),
        workspaceRuns,
        manualNodes: nextGraph.manualNodes,
        manualLinks: nextGraph.manualLinks,
        hiddenNodeIds: nextGraph.hiddenNodeIds,
        flaggedNodeIds: nextGraph.flaggedNodeIds,
        activeTaskId,
        activeChatSessionId,
        activeWorkspaceId: state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceId,
        activeWorkspaceBoardId:
          state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceBoardId,
      };
    });
  },
  ensureWorkspaceBoard: async (workspaceId) => {
    const existing = get().workspaceBoards.find((board) => board.workspaceId === workspaceId);
    if (existing) {
      if (get().activeWorkspaceId !== workspaceId) {
        get().setActiveWorkspaceId(workspaceId);
      } else {
        set({ activeWorkspaceBoardId: existing.id });
      }
      return existing;
    }

    return get().createWorkspaceBoard({
      workspaceId,
      name: 'Primary Board',
    });
  },
  createWorkspaceBoard: async (input) => {
    const existingBoards = get().workspaceBoards.filter(
      (board) => board.workspaceId === input.workspaceId
    );
    const now = Date.now();
    const board = {
      id: createLocalId('workspace-board'),
      workspaceId: input.workspaceId,
      name: input.name?.trim() || `Board ${existingBoards.length + 1}`,
      description: input.description?.trim() || undefined,
      sortOrder: existingBoards.length,
      presentationMode: input.presentationMode ?? false,
      createdAt: now,
      updatedAt: now,
    };

    await WorkspaceBoardRepository.createBoard(board);
    set((state) => ({
      workspaceBoards: [...state.workspaceBoards, board].sort(
        (left, right) => left.sortOrder - right.sortOrder
      ),
      activeWorkspaceBoardId: board.id,
      activeWorkspaceId: input.workspaceId,
    }));
    setStoredActiveWorkspaceId(input.workspaceId);
    return board;
  },
  updateWorkspaceBoard: async (boardId, patch) => {
    await WorkspaceBoardRepository.updateBoard(boardId, patch);
    set((state) => ({
      workspaceBoards: state.workspaceBoards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              ...patch,
              updatedAt: patch.updatedAt ?? Date.now(),
            }
          : board
      ),
    }));
  },
  deleteWorkspaceBoard: async (boardId) => {
    await WorkspaceBoardRepository.deleteBoard(boardId);
    set((state) => {
      const workspaceBoards = state.workspaceBoards.filter((board) => board.id !== boardId);
      const workspaceBoardDocuments = { ...state.workspaceBoardDocuments };
      const boardAgentSessions = state.boardAgentSessions.filter((session) => session.boardId !== boardId);
      const removedSessionIds = new Set(
        state.boardAgentSessions
          .filter((session) => session.boardId === boardId)
          .map((session) => session.id)
      );
      const boardAgentActionsBySessionId = Object.fromEntries(
        Object.entries(state.boardAgentActionsBySessionId).filter(
          ([sessionId]) => !removedSessionIds.has(sessionId)
        )
      );
      delete workspaceBoardDocuments[boardId];
      const activeWorkspaceBoardId =
        state.activeWorkspaceBoardId === boardId
          ? workspaceBoards.find((board) => board.workspaceId === state.activeWorkspaceId)?.id || null
          : state.activeWorkspaceBoardId;

      return {
        workspaceBoards,
        workspaceBoardDocuments,
        boardAgentSessions,
        boardAgentActionsBySessionId,
        activeWorkspaceBoardId,
      };
    });
  },
  saveWorkspaceBoardDocument: async (document) => {
    await WorkspaceBoardRepository.upsertDocument(document);
    set((state) => ({
      workspaceBoardDocuments: {
        ...state.workspaceBoardDocuments,
        [document.boardId]: document,
      },
      workspaceBoards: state.workspaceBoards.map((board) =>
        board.id === document.boardId ? { ...board, updatedAt: document.updatedAt } : board
      ),
    }));
  },
  createWorkspaceItem: async (item) => {
    await WorkspaceItemRepository.create(item);
    set((state) => ({
      workspaceItems: [item, ...state.workspaceItems],
    }));
  },
  updateWorkspaceItem: async (itemId, patch) => {
    await WorkspaceItemRepository.update(itemId, patch);
    set((state) => ({
      workspaceItems: state.workspaceItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...patch,
              updatedAt: patch.updatedAt ?? Date.now(),
            }
          : item
      ),
    }));
  },
  deleteWorkspaceItem: async (itemId) => {
    await WorkspaceItemRepository.delete(itemId);
    set((state) => ({
      workspaceItems: state.workspaceItems.filter((item) => item.id !== itemId),
    }));
  },
  importWorkspaceData: async (payload) => {
    await persistWorkspaceDataBackup(payload);
    set({
      workspaces: payload.workspaces,
      artifacts: payload.artifacts,
      workspaceRuns: payload.runs,
      chatSessions: payload.chat.sessions,
      chatMessagesBySessionId: groupChatMessagesBySessionId(payload.chat.messages),
      chatActionsBySessionId: groupChatActionsBySessionId(payload.chat.actions),
      boardAgentSessions: payload.boardAgent.sessions,
      boardAgentActionsBySessionId: groupBoardAgentActionsBySessionId(payload.boardAgent.actions),
      headlines: getWorkspaceDataSignals(payload.signals),
      templates: payload.templates,
      workspaceItems: payload.workspaceSurface.items,
      workspaceBoards: payload.workspaceSurface.boards,
      workspaceBoardDocuments: Object.fromEntries(
        payload.workspaceSurface.boardDocuments.map((document) => [document.boardId, document])
      ),
      manualNodes: payload.graph.manualNodes,
      manualLinks: payload.graph.manualLinks,
      hiddenNodeIds: [],
      flaggedNodeIds: [],
      activeTaskId: null,
      activeChatSessionId: null,
      activeWorkspaceId: null,
      activeWorkspaceBoardId: null,
      queuedBoardPlacement: null,
    });
  },
  clearWorkspaceData: async () => {
    await WorkspaceRepository.clearWorkspaceData();
    await SettingsRepository.setSetting('hidden_nodes', []);
    await SettingsRepository.setSetting('flagged_nodes', []);
    set({
      workspaces: [],
      artifacts: [],
      workspaceRuns: [],
      chatSessions: [],
      chatMessagesBySessionId: {},
      chatActionsBySessionId: {},
      boardAgentSessions: [],
      boardAgentActionsBySessionId: {},
      headlines: [],
      templates: [],
      workspaceItems: [],
      workspaceBoards: [],
      workspaceBoardDocuments: {},
      manualNodes: [],
      manualLinks: [],
      hiddenNodeIds: [],
      flaggedNodeIds: [],
      activeTaskId: null,
      activeChatSessionId: null,
      activeWorkspaceId: null,
      activeWorkspaceBoardId: null,
      queuedBoardPlacement: null,
    });
  },
});
