import { buildAccentColor, parseOklch } from '@/utils/accent';
import { clearStoredActiveWorkspaceId, setStoredActiveWorkspaceId } from '@/utils/localStorage';
import { SettingsRepository } from '@/services/db/repositories/SettingsRepository';
import { WorkspaceRepository } from '@/services/db/repositories/WorkspaceRepository';
import { TemplateRepository } from '@/services/db/repositories/TemplateRepository';
import { ManualDataRepository } from '@/services/db/repositories/ManualDataRepository';
import { ScopeRepository } from '@/services/db/repositories/ScopeRepository';

import type { WorkspaceState } from '../workspaceStore';
import type { WorkspaceStoreApi } from './shared';

export const createSimpleActions = ({
  get,
  set,
}: WorkspaceStoreApi): Pick<
  WorkspaceState,
  | 'setWorkspaces'
  | 'setArtifacts'
  | 'setWorkspaceRuns'
  | 'setChatSessions'
  | 'setChatMessagesBySessionId'
  | 'setBoardAgentSessions'
  | 'setBoardAgentActionsBySessionId'
  | 'setActiveChatSessionId'
  | 'setChatGenerationStatus'
  | 'setPartialAssistantOutput'
  | 'setSelectedChatLaunchContext'
  | 'setActiveRunId'
  | 'setLiveEvents'
  | 'setNavStack'
  | 'setIsSidebarCollapsed'
  | 'setThemeMode'
  | 'setThemeColor'
  | 'setAccentSettings'
  | 'setThemeSurfaceSettings'
  | 'setThemeFontSettings'
  | 'setThemeBackgroundSettings'
  | 'setShowGlobalSearch'
  | 'setTemplates'
  | 'setHeadlines'
  | 'setWorkspaceItems'
  | 'setWorkspaceBoards'
  | 'setActiveWorkspaceBoardId'
  | 'queueBoardPlacement'
  | 'clearQueuedBoardPlacement'
  | 'addHeadline'
  | 'addTemplate'
  | 'deleteTemplate'
  | 'setEntityAliases'
  | 'addAlias'
  | 'resolveEntity'
  | 'addToast'
  | 'removeToast'
  | 'setFeedItems'
  | 'setFeedConfig'
  | 'setManualLinks'
  | 'setManualNodes'
  | 'setHiddenNodeIds'
  | 'setFlaggedNodeIds'
  | 'setActiveWorkspaceId'
  | 'toggleFlag'
  | 'toggleHide'
  | 'setActiveScope'
  | 'setDefaultScope'
  | 'addScope'
  | 'deleteScope'
> => ({
  setWorkspaces: (workspaces) => set({ workspaces }),
  setArtifacts: (artifacts) => set({ artifacts }),
  setWorkspaceRuns: (workspaceRuns) => set({ workspaceRuns }),
  setChatSessions: (chatSessions) => set({ chatSessions }),
  setChatMessagesBySessionId: (chatMessagesBySessionId) => set({ chatMessagesBySessionId }),
  setBoardAgentSessions: (boardAgentSessions) => set({ boardAgentSessions }),
  setBoardAgentActionsBySessionId: (boardAgentActionsBySessionId) =>
    set({ boardAgentActionsBySessionId }),
  setActiveChatSessionId: (activeChatSessionId) => set({ activeChatSessionId }),
  setChatGenerationStatus: (chatGenerationStatus) => set({ chatGenerationStatus }),
  setPartialAssistantOutput: (partialAssistantOutput) => set({ partialAssistantOutput }),
  setSelectedChatLaunchContext: (selectedChatLaunchContext) => set({ selectedChatLaunchContext }),
  setActiveRunId: (activeRunId) => set({ activeRunId }),
  setLiveEvents: (eventsOrUpdater) => {
    if (typeof eventsOrUpdater === 'function') {
      set((state) => ({ liveEvents: eventsOrUpdater(state.liveEvents) }));
      return;
    }

    set({ liveEvents: eventsOrUpdater });
  },
  setNavStack: (navStack) => set({ navStack }),
  setIsSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  setThemeMode: (themeMode) => {
    set({ themeMode });
    void SettingsRepository.setSetting('theme_mode', themeMode);
  },
  setThemeColor: (themeColor) => {
    const parsedAccent = parseOklch(themeColor);
    set({
      themeColor,
      accentSettings: parsedAccent ?? get().accentSettings,
    });
    void SettingsRepository.setSetting('theme_color', themeColor);
    if (parsedAccent) {
      void SettingsRepository.setSetting('accent_settings', parsedAccent);
    }
  },
  setAccentSettings: (accentSettings) => {
    set({ accentSettings, themeColor: buildAccentColor(accentSettings) });
    void SettingsRepository.setSetting('accent_settings', accentSettings);
    void SettingsRepository.setSetting('theme_color', buildAccentColor(accentSettings));
  },
  setThemeSurfaceSettings: (themeSurfaceSettings) => {
    set({ themeSurfaceSettings });
    void SettingsRepository.setSetting('theme_surface_settings', themeSurfaceSettings);
  },
  setThemeFontSettings: (themeFontSettings) => {
    set({ themeFontSettings });
    void SettingsRepository.setSetting('theme_font_settings', themeFontSettings);
  },
  setThemeBackgroundSettings: (themeBackgroundSettings) => {
    set({ themeBackgroundSettings });
    void SettingsRepository.setSetting('theme_background_settings', themeBackgroundSettings);
  },
  setShowGlobalSearch: (showGlobalSearch) => set({ showGlobalSearch }),
  setTemplates: (templates) => set({ templates }),
  setHeadlines: (headlines) => set({ headlines }),
  setWorkspaceItems: (workspaceItems) => set({ workspaceItems }),
  setWorkspaceBoards: (workspaceBoards) => set({ workspaceBoards }),
  setActiveWorkspaceBoardId: (activeWorkspaceBoardId) => set({ activeWorkspaceBoardId }),
  queueBoardPlacement: (queuedBoardPlacement) => set({ queuedBoardPlacement }),
  clearQueuedBoardPlacement: () => set({ queuedBoardPlacement: null }),
  addHeadline: async (headline) => {
    await WorkspaceRepository.createSignal(headline);
    set((state) => {
      const existingIndex = state.headlines.findIndex((entry) => entry.id === headline.id);
      if (existingIndex >= 0) {
        const headlines = [...state.headlines];
        headlines[existingIndex] = headline;
        return { headlines };
      }

      return { headlines: [...state.headlines, headline] };
    });
  },
  addTemplate: async (template) => {
    await TemplateRepository.create(template);
    set((state) => ({
      templates: [...state.templates, template],
    }));
  },
  deleteTemplate: async (id) => {
    await TemplateRepository.delete(id);
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== id),
    }));
  },
  setEntityAliases: async (entityAliases) => {
    set({ entityAliases });
    await SettingsRepository.setSetting('entity_aliases', entityAliases);
  },
  addAlias: (variant, canonical) => {
    set((state) => ({
      entityAliases: { ...state.entityAliases, [variant]: canonical },
    }));
    void SettingsRepository.setSetting('entity_aliases', get().entityAliases);
  },
  resolveEntity: (name) => get().entityAliases[name] || name,
  addToast: (message, type = 'INFO') => {
    const id = `toast-${Date.now()}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  setFeedItems: (feedItems) => set({ feedItems }),
  setFeedConfig: (feedConfig) => set({ feedConfig }),
  setManualLinks: async (manualLinks) => {
    set({ manualLinks });
    await ManualDataRepository.saveAllLinks(manualLinks);
  },
  setManualNodes: async (manualNodes) => {
    set({ manualNodes });
    await ManualDataRepository.saveAllNodes(manualNodes);
  },
  setHiddenNodeIds: async (hiddenNodeIds) => {
    set({ hiddenNodeIds });
    await SettingsRepository.setSetting('hidden_nodes', hiddenNodeIds);
  },
  setFlaggedNodeIds: async (flaggedNodeIds) => {
    set({ flaggedNodeIds });
    await SettingsRepository.setSetting('flagged_nodes', flaggedNodeIds);
  },
  setActiveWorkspaceId: (activeWorkspaceId) => {
    if (activeWorkspaceId) {
      setStoredActiveWorkspaceId(activeWorkspaceId);
    } else {
      clearStoredActiveWorkspaceId();
    }

    const nextBoardId = activeWorkspaceId
      ? get().workspaceBoards.find((board) => board.workspaceId === activeWorkspaceId)?.id || null
      : null;
    set({ activeWorkspaceId, activeWorkspaceBoardId: nextBoardId });
  },
  toggleFlag: (id) => {
    const flagged = new Set(get().flaggedNodeIds);
    if (flagged.has(id)) flagged.delete(id);
    else flagged.add(id);
    const flaggedNodeIds = Array.from(flagged);
    set({ flaggedNodeIds });
    void SettingsRepository.setSetting('flagged_nodes', flaggedNodeIds);
  },
  toggleHide: (id) => {
    const hidden = new Set(get().hiddenNodeIds);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    const hiddenNodeIds = Array.from(hidden);
    set({ hiddenNodeIds });
    void SettingsRepository.setSetting('hidden_nodes', hiddenNodeIds);
  },
  setActiveScope: (activeScope) => set({ activeScope }),
  setDefaultScope: (defaultScopeId) => set({ defaultScopeId }),
  addScope: async (scope) => {
    await ScopeRepository.create(scope);
    set((state) => ({
      customScopes: [...state.customScopes, scope],
    }));
  },
  deleteScope: async (id) => {
    await ScopeRepository.delete(id);
    set((state) => ({
      customScopes: state.customScopes.filter((scope) => scope.id !== id),
    }));
  },
});
