import { buildAccentColor, parseOklch, DEFAULT_ACCENT_SETTINGS } from '@/utils/accent';
import {
  DEFAULT_THEME_SURFACE_SETTINGS,
  parseThemeSurfaceSettings,
} from '@/utils/themeSurfaces';
import { DEFAULT_THEME_FONT_SETTINGS, parseThemeFontSettings } from '@/utils/themeFonts';
import {
  clearStoredActiveWorkspaceId,
  getStoredActiveWorkspaceId,
  getStringItem,
  markDemoWorkspaceSeedApplied,
  setStoredActiveWorkspaceId,
  STORAGE_KEYS,
} from '@/utils/localStorage';
import { initDB } from '@/services/db/client';
import { migrateLocalStorageToSqlite } from '@/services/db/migrate';
import { SettingsRepository } from '@/services/db/repositories/SettingsRepository';
import { CaseRepository } from '@/services/db/repositories/CaseRepository';
import { ScopeRepository } from '@/services/db/repositories/ScopeRepository';
import { TaskRepository } from '@/services/db/repositories/TaskRepository';
import { TemplateRepository } from '@/services/db/repositories/TemplateRepository';
import { ChatRepository } from '@/services/db/repositories/ChatRepository';
import { BoardAgentRepository } from '@/services/db/repositories/BoardAgentRepository';
import { WorkspaceBoardRepository } from '@/services/db/repositories/WorkspaceBoardRepository';
import { WorkspaceItemRepository } from '@/services/db/repositories/WorkspaceItemRepository';
import { ManualDataRepository } from '@/services/db/repositories/ManualDataRepository';
import {
  getWorkspaceDataSignals,
  groupBoardAgentActionsBySessionId,
  groupChatActionsBySessionId,
  groupChatMessagesBySessionId,
} from '@/services/maintenance/workspaceData';

import type { ThemeMode, WorkspaceState } from '../caseStore';
import type { WorkspaceDataBackup } from '@/types';
import type { WorkspaceStoreApi } from './shared';

interface BootstrapDependencies {
  hasExistingWorkspaceData: (input: {
    workspaces: WorkspaceDataBackup['workspaces'];
    artifacts: WorkspaceDataBackup['artifacts'];
    workspaceRuns: WorkspaceDataBackup['runs'];
    chatSessions: WorkspaceDataBackup['chat']['sessions'];
    boardAgentSessions: WorkspaceDataBackup['boardAgent']['sessions'];
    headlines: ReturnType<typeof getWorkspaceDataSignals>;
    templates: WorkspaceDataBackup['templates'];
    workspaceItems: WorkspaceDataBackup['workspaceSurface']['items'];
    workspaceBoards: WorkspaceDataBackup['workspaceSurface']['boards'];
    workspaceBoardDocuments: WorkspaceDataBackup['workspaceSurface']['boardDocuments'];
    manualNodes: WorkspaceDataBackup['graph']['manualNodes'];
    manualLinks: WorkspaceDataBackup['graph']['manualLinks'];
  }) => boolean;
  loadDemoWorkspaceSeed: () => Promise<WorkspaceDataBackup | null>;
  persistWorkspaceDataBackup: (payload: WorkspaceDataBackup) => Promise<void>;
}

export const createBootstrapActions = (
  { set }: WorkspaceStoreApi,
  { hasExistingWorkspaceData, loadDemoWorkspaceSeed, persistWorkspaceDataBackup }: BootstrapDependencies
): Pick<WorkspaceState, 'initializeStore'> => ({
  initializeStore: async () => {
    try {
      set({ isLoading: true });
      await initDB();
      await migrateLocalStorageToSqlite();

      let workspaces = await CaseRepository.getAllCases();
      let artifacts = await CaseRepository.getAllReports();
      const scopes = await ScopeRepository.getAll();
      let workspaceRuns = await TaskRepository.getAll();
      let chatSessions = await ChatRepository.getAllSessions();
      let chatMessagesBySessionId = await ChatRepository.getMessagesBySessionIds(
        chatSessions.map((session) => session.id)
      );
      let chatActionsBySessionId = Object.fromEntries(
        await Promise.all(
          chatSessions.map(async (session) => [
            session.id,
            await ChatRepository.getActionsForSession(session.id),
          ])
        )
      );
      let boardAgentSessions = await BoardAgentRepository.getAllSessions();
      let boardAgentActionsBySessionId = Object.fromEntries(
        await Promise.all(
          boardAgentSessions.map(async (session) => [
            session.id,
            await BoardAgentRepository.getActionsForSession(session.id),
          ])
        )
      );
      let headlines = await CaseRepository.getSignals();
      let templates = await TemplateRepository.getAll();
      let workspaceItems = await WorkspaceItemRepository.getAll();
      let workspaceBoards = await WorkspaceBoardRepository.getAllBoards();
      let workspaceBoardDocuments = await WorkspaceBoardRepository.getAllDocuments();
      let manualNodes = await ManualDataRepository.getAllNodes();
      let manualLinks = await ManualDataRepository.getAllLinks();
      let hiddenNodeIds = (await SettingsRepository.getSetting<string[]>('hidden_nodes')) || [];
      let flaggedNodeIds = (await SettingsRepository.getSetting<string[]>('flagged_nodes')) || [];
      const entityAliases =
        (await SettingsRepository.getSetting<Record<string, string>>('entity_aliases')) || {};
      const storedThemeMode = await SettingsRepository.getSetting<ThemeMode>('theme_mode');
      const storedAccent = await SettingsRepository.getSetting<{
        hue: number;
        lightness: number;
        chroma: number;
      }>('accent_settings');
      const storedTheme = await SettingsRepository.getSetting<string>('theme_color');
      const storedThemeSurfaceSettings = await SettingsRepository.getSetting('theme_surface_settings');
      const storedThemeFontSettings = await SettingsRepository.getSetting('theme_font_settings');

      const legacyTheme = getStringItem(STORAGE_KEYS.THEME);
      const legacyConfigRaw = getStringItem(STORAGE_KEYS.SYSTEM_CONFIG);
      const legacyConfigTheme = legacyConfigRaw
        ? (() => {
            try {
              const parsed = JSON.parse(legacyConfigRaw);
              return typeof parsed?.theme === 'string' ? parsed.theme : null;
            } catch {
              return null;
            }
          })()
        : null;
      const legacyThemeMode = legacyConfigRaw
        ? (() => {
            try {
              const parsed = JSON.parse(legacyConfigRaw);
              return parsed?.themeMode === 'light' || parsed?.themeMode === 'dark'
                ? (parsed.themeMode as ThemeMode)
                : null;
            } catch {
              return null;
            }
          })()
        : null;
      const legacyThemeSurfaceSettings = legacyConfigRaw
        ? (() => {
            try {
              const parsed = JSON.parse(legacyConfigRaw);
              return parseThemeSurfaceSettings(parsed?.themeSurfaceSettings);
            } catch {
              return null;
            }
          })()
        : null;
      const legacyThemeFontSettings = legacyConfigRaw
        ? (() => {
            try {
              const parsed = JSON.parse(legacyConfigRaw);
              return parseThemeFontSettings(parsed?.themeFontSettings);
            } catch {
              return null;
            }
          })()
        : null;

      const resolvedAccent =
        storedAccent ||
        (legacyTheme ? parseOklch(legacyTheme) : null) ||
        (legacyConfigTheme ? parseOklch(legacyConfigTheme) : null) ||
        DEFAULT_ACCENT_SETTINGS;
      const resolvedTheme =
        storedTheme || legacyTheme || legacyConfigTheme || buildAccentColor(resolvedAccent);
      const resolvedThemeMode =
        storedThemeMode === 'light' || storedThemeMode === 'dark'
          ? storedThemeMode
          : (legacyThemeMode ?? 'dark');
      const resolvedThemeSurfaceSettings =
        parseThemeSurfaceSettings(storedThemeSurfaceSettings) ||
        legacyThemeSurfaceSettings ||
        DEFAULT_THEME_SURFACE_SETTINGS;
      const resolvedThemeFontSettings =
        parseThemeFontSettings(storedThemeFontSettings) ||
        legacyThemeFontSettings ||
        DEFAULT_THEME_FONT_SETTINGS;

      await SettingsRepository.setSetting('theme_mode', resolvedThemeMode);
      await SettingsRepository.setSetting('accent_settings', resolvedAccent);
      await SettingsRepository.setSetting('theme_color', resolvedTheme);
      await SettingsRepository.setSetting('theme_surface_settings', resolvedThemeSurfaceSettings);
      await SettingsRepository.setSetting('theme_font_settings', resolvedThemeFontSettings);

      if (
        !hasExistingWorkspaceData({
          workspaces,
          artifacts,
          workspaceRuns,
          chatSessions,
          boardAgentSessions,
          headlines,
          templates,
          workspaceItems,
          workspaceBoards,
          workspaceBoardDocuments,
          manualNodes,
          manualLinks,
        })
      ) {
        const demoSeed = await loadDemoWorkspaceSeed();
        if (demoSeed) {
          await persistWorkspaceDataBackup(demoSeed);
          markDemoWorkspaceSeedApplied();

          workspaces = demoSeed.workspaces;
          artifacts = demoSeed.artifacts;
          workspaceRuns = demoSeed.runs;
          chatSessions = demoSeed.chat.sessions;
          chatMessagesBySessionId = groupChatMessagesBySessionId(demoSeed.chat.messages);
          chatActionsBySessionId = groupChatActionsBySessionId(demoSeed.chat.actions);
          boardAgentSessions = demoSeed.boardAgent.sessions;
          boardAgentActionsBySessionId = groupBoardAgentActionsBySessionId(
            demoSeed.boardAgent.actions
          );
          headlines = getWorkspaceDataSignals(demoSeed.signals);
          templates = demoSeed.templates;
          workspaceItems = demoSeed.workspaceSurface.items;
          workspaceBoards = demoSeed.workspaceSurface.boards;
          workspaceBoardDocuments = demoSeed.workspaceSurface.boardDocuments;
          manualNodes = demoSeed.graph.manualNodes;
          manualLinks = demoSeed.graph.manualLinks;
          hiddenNodeIds = [];
          flaggedNodeIds = [];
        }
      }

      const storedActiveWorkspaceId = getStoredActiveWorkspaceId();
      const activeWorkspaceId = workspaces.some((workspace) => workspace.id === storedActiveWorkspaceId)
        ? storedActiveWorkspaceId
        : workspaces[0]?.id || null;
      const activeWorkspaceBoardId =
        workspaceBoards.find((board) => board.workspaceId === activeWorkspaceId)?.id || null;

      if (activeWorkspaceId) {
        setStoredActiveWorkspaceId(activeWorkspaceId);
      } else {
        clearStoredActiveWorkspaceId();
      }

      set({
        workspaces,
        artifacts,
        workspaceRuns,
        customScopes: scopes,
        chatSessions,
        chatMessagesBySessionId,
        chatActionsBySessionId,
        boardAgentSessions,
        boardAgentActionsBySessionId,
        headlines,
        templates,
        workspaceItems,
        workspaceBoards,
        workspaceBoardDocuments: Object.fromEntries(
          workspaceBoardDocuments.map((document) => [document.boardId, document])
        ),
        manualNodes,
        manualLinks,
        hiddenNodeIds,
        flaggedNodeIds,
        entityAliases,
        themeMode: resolvedThemeMode,
        accentSettings: resolvedAccent,
        themeColor: resolvedTheme,
        themeSurfaceSettings: resolvedThemeSurfaceSettings,
        themeFontSettings: resolvedThemeFontSettings,
        activeWorkspaceId,
        activeWorkspaceBoardId,
        isLoading: false,
      });
    } catch (error) {
      console.error('Store initialization failed:', error);
      set({ error: 'Failed to load data', isLoading: false });
    }
  },
});
