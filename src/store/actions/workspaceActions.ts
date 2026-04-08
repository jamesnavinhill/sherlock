import { SettingsRepository } from '@/services/db/repositories/SettingsRepository';
import { WorkspaceRepository } from '@/services/db/repositories/WorkspaceRepository';
import { WorkspaceBoardRepository } from '@/services/db/repositories/WorkspaceBoardRepository';
import { WorkspaceItemRepository } from '@/services/db/repositories/WorkspaceItemRepository';
import { createLocalId } from '@/utils/id';
import { setStoredActiveWorkspaceId } from '@/utils/localStorage';
import {
  buildClearedWorkspaceDataState,
  buildDeleteWorkspaceState,
  buildImportedWorkspaceDataState,
  buildPurgeWorkspaceState,
} from './workspaceActionState';

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
    set((state) => buildDeleteWorkspaceState(state, workspaceId));
  },
  purgeWorkspace: async (workspaceId) => {
    await WorkspaceRepository.purgeWorkspace(workspaceId);
    set((state) => buildPurgeWorkspaceState(state, workspaceId));
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
    set(buildImportedWorkspaceDataState(payload));
  },
  clearWorkspaceData: async () => {
    await WorkspaceRepository.clearWorkspaceData();
    await SettingsRepository.setSetting('hidden_nodes', []);
    await SettingsRepository.setSetting('flagged_nodes', []);
    set(buildClearedWorkspaceDataState());
  },
});
