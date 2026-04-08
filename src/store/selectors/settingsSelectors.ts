import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

export const selectSettingsDataMaintenanceState = (state: WorkspaceState) => ({
  artifacts: state.artifacts,
  workspaces: state.workspaces,
  workspaceRuns: state.workspaceRuns,
  chatSessions: state.chatSessions,
  chatMessagesBySessionId: state.chatMessagesBySessionId,
  chatActionsBySessionId: state.chatActionsBySessionId,
  boardAgentSessions: state.boardAgentSessions,
  boardAgentActionsBySessionId: state.boardAgentActionsBySessionId,
  headlines: state.headlines,
  templates: state.templates,
  manualNodes: state.manualNodes,
  manualLinks: state.manualLinks,
  workspaceItems: state.workspaceItems,
  workspaceBoards: state.workspaceBoards,
  workspaceBoardDocuments: state.workspaceBoardDocuments,
  importWorkspaceData: state.importWorkspaceData,
  clearWorkspaceData: state.clearWorkspaceData,
});

export const useSettingsDataMaintenanceState = () =>
  useWorkspaceStore(useShallow(selectSettingsDataMaintenanceState));

export const selectSettingsScopeState = (state: WorkspaceState) => ({
  customScopes: state.customScopes,
});

export const useSettingsScopeState = () =>
  useWorkspaceStore(useShallow(selectSettingsScopeState));

export const selectTemplateGalleryFeatureState = (state: WorkspaceState) => ({
  templates: state.templates,
  deleteTemplate: state.deleteTemplate,
  addTemplate: state.addTemplate,
  customScopes: state.customScopes,
  defaultScopeId: state.defaultScopeId,
  addToast: state.addToast,
});

export const useTemplateGalleryFeatureState = () =>
  useWorkspaceStore(useShallow(selectTemplateGalleryFeatureState));
