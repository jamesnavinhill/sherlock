import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

export const selectWorkspaceHomeReadinessState = (state: WorkspaceState) => ({
  artifacts: state.artifacts,
  chatSessions: state.chatSessions,
  headlines: state.headlines,
  workspaceBoardDocuments: state.workspaceBoardDocuments,
  workspaceBoards: state.workspaceBoards,
  workspaceItems: state.workspaceItems,
  workspaceRuns: state.workspaceRuns,
  workspaces: state.workspaces,
});

export const useWorkspaceHomeReadinessState = () =>
  useWorkspaceStore(useShallow(selectWorkspaceHomeReadinessState));
