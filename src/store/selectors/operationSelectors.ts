import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

export const selectOperationFeatureState = (state: WorkspaceState) => ({
  workspaces: state.workspaces,
  artifacts: state.artifacts,
  headlines: state.headlines,
  addToast: state.addToast,
  addTemplate: state.addTemplate,
  updateArtifactSection: state.updateArtifactSection,
  updateArtifactSummary: state.updateArtifactSummary,
  updateArtifactTitle: state.updateArtifactTitle,
  renameEntityAcrossArtifacts: state.renameEntityAcrossArtifacts,
  activeWorkspaceId: state.activeWorkspaceId,
  setActiveWorkspaceId: state.setActiveWorkspaceId,
  ensureWorkspaceBoard: state.ensureWorkspaceBoard,
  queueBoardPlacement: state.queueBoardPlacement,
  customScopes: state.customScopes,
  flaggedNodeIds: state.flaggedNodeIds,
  toggleFlag: state.toggleFlag,
});

export const useOperationFeatureState = () =>
  useWorkspaceStore(useShallow(selectOperationFeatureState));
