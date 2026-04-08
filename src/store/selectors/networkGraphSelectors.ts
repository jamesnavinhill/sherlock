import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

export const selectNetworkGraphFeatureState = (state: WorkspaceState) => ({
  artifacts: state.artifacts,
  manualLinks: state.manualLinks,
  manualNodes: state.manualNodes,
  hiddenNodeIds: state.hiddenNodeIds,
  workspaces: state.workspaces,
  entityAliases: state.entityAliases,
  headlines: state.headlines,
  flaggedNodeIds: state.flaggedNodeIds,
  activeWorkspaceId: state.activeWorkspaceId,
  activeScope: state.activeScope,
  setManualLinks: state.setManualLinks,
  setManualNodes: state.setManualNodes,
  setEntityAliases: state.setEntityAliases,
  updateArtifactTitle: state.updateArtifactTitle,
  renameEntityAcrossArtifacts: state.renameEntityAcrossArtifacts,
  setActiveWorkspaceId: state.setActiveWorkspaceId,
  setFlaggedNodeIds: state.setFlaggedNodeIds,
  setHiddenNodeIds: state.setHiddenNodeIds,
  ensureWorkspaceBoard: state.ensureWorkspaceBoard,
  queueBoardPlacement: state.queueBoardPlacement,
  addToast: state.addToast,
});

export const useNetworkGraphFeatureState = () =>
  useWorkspaceStore(useShallow(selectNetworkGraphFeatureState));
