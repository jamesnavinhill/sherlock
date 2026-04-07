import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../caseStore';

export const selectAppShellLaunchTaskState = (state: WorkspaceState) => ({
  activeTaskId: state.activeTaskId,
  addTask: state.addTask,
  addToast: state.addToast,
  archiveReport: state.archiveReport,
  artifacts: state.artifacts,
  clearCompletedTasks: state.clearCompletedTasks,
  completeTask: state.completeTask,
  customScopes: state.customScopes,
  failTask: state.failTask,
  manualNodes: state.manualNodes,
  setActiveTaskId: state.setActiveTaskId,
  setManualNodes: state.setManualNodes,
  workspaceRuns: state.workspaceRuns,
});

export const useAppShellLaunchTaskState = () =>
  useWorkspaceStore(useShallow(selectAppShellLaunchTaskState));

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
  accentSettings: state.accentSettings,
  isSidebarCollapsed: state.isSidebarCollapsed,
  liveEvents: state.liveEvents,
  setAccentSettings: state.setAccentSettings,
  setIsSidebarCollapsed: state.setIsSidebarCollapsed,
  setLiveEvents: state.setLiveEvents,
  setShowGlobalSearch: state.setShowGlobalSearch,
  setThemeColor: state.setThemeColor,
  setThemeFontSettings: state.setThemeFontSettings,
  setThemeMode: state.setThemeMode,
  setThemeSurfaceSettings: state.setThemeSurfaceSettings,
  showGlobalSearch: state.showGlobalSearch,
  themeColor: state.themeColor,
  themeFontSettings: state.themeFontSettings,
  themeMode: state.themeMode,
  themeSurfaceSettings: state.themeSurfaceSettings,
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

export const selectChatFeatureState = (state: WorkspaceState) => ({
  artifacts: state.artifacts,
  workspaces: state.workspaces,
  chatActionsBySessionId: state.chatActionsBySessionId,
  chatGenerationStatus: state.chatGenerationStatus,
  chatMessagesBySessionId: state.chatMessagesBySessionId,
  chatSessions: state.chatSessions,
  createChatSession: state.createChatSession,
  createWorkspaceItem: state.createWorkspaceItem,
  updateChatSession: state.updateChatSession,
  activeWorkspaceId: state.activeWorkspaceId,
  activeChatSessionId: state.activeChatSessionId,
  addChatAction: state.addChatAction,
  addChatMessage: state.addChatMessage,
  addToast: state.addToast,
  archiveReport: state.archiveReport,
  appendSectionToReport: state.appendSectionToReport,
  customScopes: state.customScopes,
  deleteChatSession: state.deleteChatSession,
  ensureWorkspaceBoard: state.ensureWorkspaceBoard,
  headlines: state.headlines,
  partialAssistantOutput: state.partialAssistantOutput,
  queueBoardPlacement: state.queueBoardPlacement,
  renameChatSession: state.renameChatSession,
  setActiveWorkspaceId: state.setActiveWorkspaceId,
  setActiveChatSessionId: state.setActiveChatSessionId,
  setChatGenerationStatus: state.setChatGenerationStatus,
  setPartialAssistantOutput: state.setPartialAssistantOutput,
  themeMode: state.themeMode,
  updateChatMessage: state.updateChatMessage,
});

export const useChatFeatureState = () =>
  useWorkspaceStore(useShallow(selectChatFeatureState));

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
  appendSectionToReport: state.appendSectionToReport,
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
  workspaceRuns: state.workspaceRuns,
  workspaces: state.workspaces,
});

export const useTimelineFeatureState = () =>
  useWorkspaceStore(useShallow(selectTimelineFeatureState));

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
  updateReportTitle: state.updateReportTitle,
  renameEntityAcrossReports: state.renameEntityAcrossReports,
  setActiveWorkspaceId: state.setActiveWorkspaceId,
  setFlaggedNodeIds: state.setFlaggedNodeIds,
  setHiddenNodeIds: state.setHiddenNodeIds,
  ensureWorkspaceBoard: state.ensureWorkspaceBoard,
  queueBoardPlacement: state.queueBoardPlacement,
  addToast: state.addToast,
});

export const useNetworkGraphFeatureState = () =>
  useWorkspaceStore(useShallow(selectNetworkGraphFeatureState));

export const selectOperationFeatureState = (state: WorkspaceState) => ({
  workspaces: state.workspaces,
  artifacts: state.artifacts,
  headlines: state.headlines,
  addToast: state.addToast,
  addTemplate: state.addTemplate,
  updateArtifactSection: state.updateArtifactSection,
  updateReportSummary: state.updateReportSummary,
  updateReportTitle: state.updateReportTitle,
  renameEntityAcrossReports: state.renameEntityAcrossReports,
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

export const selectTaskSetupFeatureState = (state: WorkspaceState) => ({
  templates: state.templates,
  addTemplate: state.addTemplate,
  customScopes: state.customScopes,
  defaultScopeId: state.defaultScopeId,
});

export const useTaskSetupFeatureState = () =>
  useWorkspaceStore(useShallow(selectTaskSetupFeatureState));

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
