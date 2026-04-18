import { parseOklch, DEFAULT_ACCENT_SETTINGS } from '@/utils/accent';
import {
  DEFAULT_THEME_BACKGROUND_SETTINGS,
  parseThemeBackgroundSettings,
} from '@/utils/themeBackground';
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
import { SettingsRepository } from '@/services/db/repositories/SettingsRepository';
import { WorkspaceRepository } from '@/services/db/repositories/WorkspaceRepository';
import { ScopeRepository } from '@/services/db/repositories/ScopeRepository';
import { WorkspaceRunRepository } from '@/services/db/repositories/WorkspaceRunRepository';
import { TemplateRepository } from '@/services/db/repositories/TemplateRepository';
import { ChatRepository } from '@/services/db/repositories/ChatRepository';
import { BoardAgentRepository } from '@/services/db/repositories/BoardAgentRepository';
import { WorkspaceBoardRepository } from '@/services/db/repositories/WorkspaceBoardRepository';
import { WorkspaceItemRepository } from '@/services/db/repositories/WorkspaceItemRepository';
import { parseStoredJson } from '@/services/db/repositories/json';
import { ManualDataRepository } from '@/services/db/repositories/ManualDataRepository';
import {
  hydrateSherlockThemeWorkspace,
  migrateLegacySherlockThemeWorkspace,
  SHERLOCK_THEME_WORKSPACE_SETTING_KEY,
} from '@/system/theme/storage';
import type { SherlockThemeWorkspaceState } from '@/system/theme/schema';
import {
  getWorkspaceDataSignals,
  groupBoardAgentActionsBySessionId,
  groupChatActionsBySessionId,
  groupChatMessagesBySessionId,
} from '@/services/maintenance/workspaceData';

import type { ThemeMode, WorkspaceState } from '../workspaceStore';
import type { WorkspaceDataBackup } from '@/types';
import type { WorkspaceStoreApi } from './shared';
import { loadBootstrapResource } from './bootstrapResourceLoader';

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

let initializeStoreInFlight: Promise<void> | null = null;

export const createBootstrapActions = (
  { set }: WorkspaceStoreApi,
  { hasExistingWorkspaceData, loadDemoWorkspaceSeed, persistWorkspaceDataBackup }: BootstrapDependencies
): Pick<WorkspaceState, 'initializeStore'> => ({
  initializeStore: async () => {
    if (initializeStoreInFlight) {
      return initializeStoreInFlight;
    }

    initializeStoreInFlight = (async () => {
      try {
        set({ isLoading: true });
        // Database initialization and pending schema migrations are bootstrap hard failures.
        await initDB();
        await ScopeRepository.ensureBuiltinScopes();

        // Repository/settings reads are recoverable per-resource reads.
        const [
          workspacesResult,
          artifactsResult,
          scopes,
          workspaceRunsResult,
          chatSessionsResult,
          boardAgentSessionsResult,
          headlinesResult,
          templatesResult,
          workspaceItemsResult,
          workspaceBoardsResult,
          workspaceBoardDocumentsResult,
          manualNodesResult,
          manualLinksResult,
          hiddenNodeIdsResult,
          flaggedNodeIdsResult,
          entityAliasesResult,
          storedThemeWorkspace,
          storedThemeMode,
          storedAccent,
          storedThemeSurfaceSettings,
          storedThemeFontSettings,
          storedThemeBackgroundSettings,
        ] = await Promise.all([
          loadBootstrapResource('workspaces', () => WorkspaceRepository.getAllWorkspaces(), []),
          loadBootstrapResource('artifacts', () => WorkspaceRepository.getAllArtifacts(), []),
          loadBootstrapResource('scopes', () => ScopeRepository.getAll(), []),
          loadBootstrapResource('workspace runs', () => WorkspaceRunRepository.getAll(), []),
          loadBootstrapResource('chat sessions', () => ChatRepository.getAllSessions(), []),
          loadBootstrapResource(
            'board-agent sessions',
            () => BoardAgentRepository.getAllSessions(),
            []
          ),
          loadBootstrapResource('saved signals', () => WorkspaceRepository.getSignals(), []),
          loadBootstrapResource('templates', () => TemplateRepository.getAll(), []),
          loadBootstrapResource('workspace items', () => WorkspaceItemRepository.getAll(), []),
          loadBootstrapResource(
            'workspace boards',
            () => WorkspaceBoardRepository.getAllBoards(),
            []
          ),
          loadBootstrapResource(
            'workspace board documents',
            () => WorkspaceBoardRepository.getAllDocuments(),
            []
          ),
          loadBootstrapResource('manual graph nodes', () => ManualDataRepository.getAllNodes(), []),
          loadBootstrapResource('manual graph links', () => ManualDataRepository.getAllLinks(), []),
          loadBootstrapResource(
            'hidden graph nodes',
            () => SettingsRepository.getSetting<string[]>('hidden_nodes'),
            []
          ),
          loadBootstrapResource(
            'flagged graph nodes',
            () => SettingsRepository.getSetting<string[]>('flagged_nodes'),
            []
          ),
          loadBootstrapResource(
            'entity aliases',
            () => SettingsRepository.getSetting<Record<string, string>>('entity_aliases'),
            {}
          ),
          loadBootstrapResource(
            'theme workspace',
            () => SettingsRepository.getSetting<SherlockThemeWorkspaceState>(SHERLOCK_THEME_WORKSPACE_SETTING_KEY),
            null
          ),
          loadBootstrapResource(
            'theme mode',
            () => SettingsRepository.getSetting<ThemeMode>('theme_mode'),
            null
          ),
          loadBootstrapResource(
            'accent settings',
            () =>
              SettingsRepository.getSetting<{
                hue: number;
                lightness: number;
                chroma: number;
              }>('accent_settings'),
            null
          ),
          loadBootstrapResource(
            'theme surface settings',
            () => SettingsRepository.getSetting('theme_surface_settings'),
            null
          ),
          loadBootstrapResource(
            'theme font settings',
            () => SettingsRepository.getSetting('theme_font_settings'),
            null
          ),
          loadBootstrapResource(
            'theme background settings',
            () => SettingsRepository.getSetting('theme_background_settings'),
            null
          ),
        ]);

        let workspaces = workspacesResult;
        let artifacts = artifactsResult;
        let workspaceRunsState = workspaceRunsResult;
        let chatSessions = chatSessionsResult;
        let chatMessagesBySessionId = await loadBootstrapResource(
          'chat messages',
          () => ChatRepository.getMessagesBySessionIds(chatSessions.map((session) => session.id)),
          {}
        );
        let chatActionsBySessionId = Object.fromEntries(
          await Promise.all(
            chatSessions.map(async (session) => [
              session.id,
              await loadBootstrapResource(
                `chat actions for session ${session.id}`,
                () => ChatRepository.getActionsForSession(session.id),
                []
              ),
            ])
          )
        );
        let boardAgentSessions = boardAgentSessionsResult;
        let boardAgentActionsBySessionId = Object.fromEntries(
          await Promise.all(
            boardAgentSessions.map(async (session) => [
              session.id,
              await loadBootstrapResource(
                `board-agent actions for session ${session.id}`,
                () => BoardAgentRepository.getActionsForSession(session.id),
                []
              ),
            ])
          )
        );
        let headlines = headlinesResult;
        let templates = templatesResult;
        let workspaceItems = workspaceItemsResult;
        let workspaceBoards = workspaceBoardsResult;
        let workspaceBoardDocuments = workspaceBoardDocumentsResult;
        let manualNodes = manualNodesResult;
        let manualLinks = manualLinksResult;
        let hiddenNodeIds = hiddenNodeIdsResult || [];
        let flaggedNodeIds = flaggedNodeIdsResult || [];
        const entityAliases = entityAliasesResult || {};

        const legacyTheme = getStringItem(STORAGE_KEYS.THEME);
        const legacyConfigRaw = getStringItem(STORAGE_KEYS.SYSTEM_CONFIG);
        const legacyConfig = legacyConfigRaw
          ? parseStoredJson<Record<string, unknown>>(legacyConfigRaw, {}, 'legacy system config')
          : {};
        const legacyConfigTheme =
          typeof legacyConfig['theme'] === 'string' ? legacyConfig['theme'] : null;
        const legacyThemeMode =
          legacyConfig['themeMode'] === 'light' || legacyConfig['themeMode'] === 'dark'
            ? (legacyConfig['themeMode'] as ThemeMode)
            : null;
        const legacyThemeSurfaceSettings = parseThemeSurfaceSettings(
          legacyConfig['themeSurfaceSettings']
        );
        const legacyThemeBackgroundSettings = parseThemeBackgroundSettings(
          legacyConfig['themeBackgroundSettings']
        );
        const legacyThemeFontSettings = parseThemeFontSettings(legacyConfig['themeFontSettings']);

        const resolvedThemeWorkspace = storedThemeWorkspace
          ? hydrateSherlockThemeWorkspace(storedThemeWorkspace)
          : migrateLegacySherlockThemeWorkspace({
              accentSettings:
                storedAccent ||
                (legacyTheme ? parseOklch(legacyTheme) : null) ||
                (legacyConfigTheme ? parseOklch(legacyConfigTheme) : null) ||
                DEFAULT_ACCENT_SETTINGS,
              themeMode:
                storedThemeMode === 'light' || storedThemeMode === 'dark'
                  ? storedThemeMode
                  : legacyThemeMode,
              themeSurfaceSettings:
                parseThemeSurfaceSettings(storedThemeSurfaceSettings) ||
                legacyThemeSurfaceSettings ||
                DEFAULT_THEME_SURFACE_SETTINGS,
              themeFontSettings:
                parseThemeFontSettings(storedThemeFontSettings) ||
                legacyThemeFontSettings ||
                DEFAULT_THEME_FONT_SETTINGS,
              themeBackgroundSettings:
                parseThemeBackgroundSettings(storedThemeBackgroundSettings) ||
                legacyThemeBackgroundSettings ||
                DEFAULT_THEME_BACKGROUND_SETTINGS,
            });
        await SettingsRepository.setSetting(
          SHERLOCK_THEME_WORKSPACE_SETTING_KEY,
          resolvedThemeWorkspace
        );

        if (
          !hasExistingWorkspaceData({
            workspaces,
            artifacts,
            workspaceRuns: workspaceRunsState,
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
            workspaceRunsState = demoSeed.runs;
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
        const activeWorkspaceId = workspaces.some(
          (workspace) => workspace.id === storedActiveWorkspaceId
        )
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
          workspaceRuns: workspaceRunsState,
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
          themeWorkspace: resolvedThemeWorkspace,
          activeWorkspaceId,
          activeWorkspaceBoardId,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Store initialization failed:', error);
        set({ error: 'Failed to load data', isLoading: false });
      }
    })();

    try {
      await initializeStoreInFlight;
    } finally {
      initializeStoreInFlight = null;
    }
  },
});
