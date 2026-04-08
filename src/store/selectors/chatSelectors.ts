import { useShallow } from 'zustand/react/shallow';

import { useWorkspaceStore, type WorkspaceState } from '../workspaceStore';

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
  saveArtifact: state.saveArtifact,
  appendSectionToArtifact: state.appendSectionToArtifact,
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
  workspaceItems: state.workspaceItems,
});

export const useChatFeatureState = () =>
  useWorkspaceStore(useShallow(selectChatFeatureState));
