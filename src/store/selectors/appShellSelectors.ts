import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

export const selectAppShellLaunchRunState = (state: WorkspaceState) => ({
  activeRunId: state.activeRunId,
  addRun: state.addRun,
  addToast: state.addToast,
  saveArtifact: state.saveArtifact,
  artifacts: state.artifacts,
  clearCompletedRuns: state.clearCompletedRuns,
  completeRun: state.completeRun,
  customScopes: state.customScopes,
  failRun: state.failRun,
  manualNodes: state.manualNodes,
  setActiveRunId: state.setActiveRunId,
  setManualNodes: state.setManualNodes,
  workspaceRuns: state.workspaceRuns,
});

export const useAppShellLaunchRunState = () =>
  useWorkspaceStore(useShallow(selectAppShellLaunchRunState));

export const selectAppShellRouteState = (state: WorkspaceState) => ({
  activeChatSessionId: state.activeChatSessionId,
  activeWorkspaceBoardId: state.activeWorkspaceBoardId,
  activeWorkspaceId: state.activeWorkspaceId,
  setActiveChatSessionId: state.setActiveChatSessionId,
  setActiveWorkspaceBoardId: state.setActiveWorkspaceBoardId,
  setActiveWorkspaceId: state.setActiveWorkspaceId,
});

export const useAppShellRouteState = () =>
  useWorkspaceStore(useShallow(selectAppShellRouteState));

export const selectAppShellThemeUiState = (state: WorkspaceState) => ({
  isSidebarCollapsed: state.isSidebarCollapsed,
  liveEvents: state.liveEvents,
  setIsSidebarCollapsed: state.setIsSidebarCollapsed,
  setLiveEvents: state.setLiveEvents,
  setShowGlobalSearch: state.setShowGlobalSearch,
  setThemeMode: state.setThemeMode,
  setThemeWorkspace: state.setThemeWorkspace,
  showGlobalSearch: state.showGlobalSearch,
  themeMode: state.themeMode,
  themeWorkspace: state.themeWorkspace,
});

export const useAppShellThemeUiState = () =>
  useWorkspaceStore(useShallow(selectAppShellThemeUiState));

export const selectAppShellLookupState = (state: WorkspaceState) => ({
  addChatMessage: state.addChatMessage,
  chatMessagesBySessionId: state.chatMessagesBySessionId,
  chatSessions: state.chatSessions,
  createChatSession: state.createChatSession,
  headlines: state.headlines,
  workspaceBoards: state.workspaceBoards,
  workspaceItems: state.workspaceItems,
  workspaces: state.workspaces,
});

export const useAppShellLookupState = () =>
  useWorkspaceStore(useShallow(selectAppShellLookupState));

export const selectAppShellBootstrapState = (state: WorkspaceState) => ({
  initializeStore: state.initializeStore,
  isLoading: state.isLoading,
});

export const useAppShellBootstrapState = () =>
  useWorkspaceStore(useShallow(selectAppShellBootstrapState));
