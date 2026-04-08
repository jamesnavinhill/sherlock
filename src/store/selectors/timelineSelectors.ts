import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

export const selectTimelineFeatureState = (state: WorkspaceState) => ({
  activeWorkspaceId: state.activeWorkspaceId,
  artifacts: state.artifacts,
  chatActionsBySessionId: state.chatActionsBySessionId,
  chatSessions: state.chatSessions,
  headlines: state.headlines,
  isLoading: state.isLoading,
  addToast: state.addToast,
  ensureWorkspaceBoard: state.ensureWorkspaceBoard,
  queueBoardPlacement: state.queueBoardPlacement,
  saveArtifact: state.saveArtifact,
  setActiveWorkspaceId: state.setActiveWorkspaceId,
  workspaceItems: state.workspaceItems,
  workspaceRuns: state.workspaceRuns,
  workspaces: state.workspaces,
});

export const useTimelineFeatureState = () =>
  useWorkspaceStore(useShallow(selectTimelineFeatureState));
