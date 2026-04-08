import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

export const selectWorkspaceBoardFeatureState = (state: WorkspaceState) => ({
  activeWorkspaceBoardId: state.activeWorkspaceBoardId,
  activeWorkspaceId: state.activeWorkspaceId,
  artifacts: state.artifacts,
  boardAgentActionsBySessionId: state.boardAgentActionsBySessionId,
  boardAgentSessions: state.boardAgentSessions,
  createBoardAgentSession: state.createBoardAgentSession,
  createWorkspaceBoard: state.createWorkspaceBoard,
  createWorkspaceItem: state.createWorkspaceItem,
  deleteWorkspaceItem: state.deleteWorkspaceItem,
  ensureWorkspaceBoard: state.ensureWorkspaceBoard,
  headlines: state.headlines,
  queuedBoardPlacement: state.queuedBoardPlacement,
  saveArtifact: state.saveArtifact,
  saveWorkspaceBoardDocument: state.saveWorkspaceBoardDocument,
  setActiveWorkspaceId: state.setActiveWorkspaceId,
  appendSectionToArtifact: state.appendSectionToArtifact,
  addBoardAgentAction: state.addBoardAgentAction,
  updateWorkspaceBoard: state.updateWorkspaceBoard,
  updateBoardAgentAction: state.updateBoardAgentAction,
  updateBoardAgentSession: state.updateBoardAgentSession,
  workspaceBoardDocuments: state.workspaceBoardDocuments,
  workspaceBoards: state.workspaceBoards,
  workspaceItems: state.workspaceItems,
  workspaces: state.workspaces,
  clearQueuedBoardPlacement: state.clearQueuedBoardPlacement,
  deleteWorkspaceBoard: state.deleteWorkspaceBoard,
  addToast: state.addToast,
  themeMode: state.themeMode,
});

export const useWorkspaceBoardFeatureState = () =>
  useWorkspaceStore(useShallow(selectWorkspaceBoardFeatureState));
