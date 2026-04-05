import { create } from 'zustand';
import type {
  AgentAction,
  Artifact,
  ArtifactSection,
  BoardAgentAction,
  BoardAgentSession,
  ChatGenerationStatus,
  ChatLaunchContext,
  ChatMessage,
  ChatSession,
  Entity,
  MonitorEvent,
  CaseTemplate,
  Headline,
  FeedItem,
  ManualConnection,
  ManualNode,
  InvestigationScope,
  EntityAliasMap,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceBoardPlacementRequest,
  WorkspaceItem,
  Workspace,
  WorkspaceDataBackup,
  WorkspaceRun,
} from '../types';
import type { BreadcrumbItem } from '../components/ui/Breadcrumbs';
import { AppView } from '../types';
import { isLikelySameEntity } from '../utils/entityUtils';
import { CaseRepository } from '../services/db/repositories/CaseRepository';
import { ScopeRepository } from '../services/db/repositories/ScopeRepository';
import { TaskRepository } from '../services/db/repositories/TaskRepository';
import { SettingsRepository } from '../services/db/repositories/SettingsRepository';
import { TemplateRepository } from '../services/db/repositories/TemplateRepository';
import { ManualDataRepository } from '../services/db/repositories/ManualDataRepository';
import { ChatRepository } from '../services/db/repositories/ChatRepository';
import { BoardAgentRepository } from '../services/db/repositories/BoardAgentRepository';
import { WorkspaceBoardRepository } from '../services/db/repositories/WorkspaceBoardRepository';
import { WorkspaceItemRepository } from '../services/db/repositories/WorkspaceItemRepository';
import { initDB } from '../services/db/client';
import { migrateLocalStorageToSqlite } from '../services/db/migrate';
import { DEFAULT_ACCENT_SETTINGS, buildAccentColor, parseOklch } from '../utils/accent';
import {
  DEFAULT_THEME_SURFACE_SETTINGS,
  parseThemeSurfaceSettings,
  type ThemeSurfaceSettings,
} from '../utils/themeSurfaces';
import {
  DEFAULT_THEME_FONT_SETTINGS,
  parseThemeFontSettings,
  type ThemeFontSettings,
} from '../utils/themeFonts';
import {
  filterManualGraphForWorkspaceRemoval,
  groupBoardAgentActionsBySessionId,
  groupChatActionsBySessionId,
  groupChatMessagesBySessionId,
} from '../services/maintenance/workspaceData';
import { normalizeWorkspaceDataBackup } from '../services/maintenance/workspaceData';
import { loadSystemConfig } from '../config/systemConfig';
import { createLocalId } from '../utils/id';
import { buildArtifactFollowUps, toFollowUpTexts } from '../domain';
import {
  clearStoredActiveWorkspaceId,
  getStringItem,
  getStoredActiveWorkspaceId,
  hasAppliedDemoWorkspaceSeed,
  markDemoWorkspaceSeedApplied,
  setStoredActiveWorkspaceId,
  STORAGE_KEYS,
} from '../utils/localStorage';

export interface Toast {
  id: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
}

export type ThemeMode = 'dark' | 'light';

const DEMO_WORKSPACE_SEED_PATH = '/seeds/demo-workspace.json';

const hasExistingWorkspaceData = (input: {
  workspaces: Workspace[];
  artifacts: Artifact[];
  workspaceRuns: WorkspaceRun[];
  chatSessions: ChatSession[];
  boardAgentSessions: BoardAgentSession[];
  headlines: Headline[];
  templates: CaseTemplate[];
  workspaceItems: WorkspaceItem[];
  workspaceBoards: WorkspaceBoard[];
  workspaceBoardDocuments: WorkspaceBoardDocument[];
  manualNodes: ManualNode[];
  manualLinks: ManualConnection[];
}) =>
  input.workspaces.length > 0 ||
  input.artifacts.length > 0 ||
  input.workspaceRuns.length > 0 ||
  input.chatSessions.length > 0 ||
  input.boardAgentSessions.length > 0 ||
  input.headlines.length > 0 ||
  input.templates.length > 0 ||
  input.workspaceItems.length > 0 ||
  input.workspaceBoards.length > 0 ||
  input.workspaceBoardDocuments.length > 0 ||
  input.manualNodes.length > 0 ||
  input.manualLinks.length > 0;

const persistWorkspaceDataBackup = async (payload: WorkspaceDataBackup) => {
  await CaseRepository.replaceWorkspaceDataBackup(payload);
};

const loadDemoWorkspaceSeed = async () => {
  if (typeof window === 'undefined') return null;
  if (hasAppliedDemoWorkspaceSeed()) return null;

  try {
    const response = await fetch(DEMO_WORKSPACE_SEED_PATH, { cache: 'no-store' });
    if (!response.ok) return null;

    const payload = normalizeWorkspaceDataBackup(await response.json());
    return payload;
  } catch (error) {
    console.warn('Demo workspace seed bootstrap skipped:', error);
    return null;
  }
};

interface WorkspaceState {
  // --- CORE DATA STATE ---
  isLoading: boolean;
  error: string | null;
  initializeStore: () => Promise<void>;

  workspaces: Workspace[];
  artifacts: Artifact[];
  workspaceRuns: WorkspaceRun[];
  chatSessions: ChatSession[];
  chatMessagesBySessionId: Record<string, ChatMessage[]>;
  chatActionsBySessionId: Record<string, AgentAction[]>;
  boardAgentSessions: BoardAgentSession[];
  boardAgentActionsBySessionId: Record<string, BoardAgentAction[]>;
  activeChatSessionId: string | null;
  chatGenerationStatus: ChatGenerationStatus;
  partialAssistantOutput: string;
  selectedChatLaunchContext: ChatLaunchContext | null;
  activeWorkspaceRunId: string | null;
  activeTaskId: string | null;
  liveEvents: MonitorEvent[];
  headlines: Headline[];
  templates: CaseTemplate[];
  workspaceItems: WorkspaceItem[];
  workspaceBoards: WorkspaceBoard[];
  workspaceBoardDocuments: Record<string, WorkspaceBoardDocument>;
  activeWorkspaceBoardId: string | null;
  queuedBoardPlacement: WorkspaceBoardPlacementRequest | null;
  entityAliases: EntityAliasMap;
  toasts: Toast[];
  feedItems: FeedItem[];
  feedConfig: {
    limit: number;
    prioritySources: string;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  manualLinks: ManualConnection[];
  manualNodes: ManualNode[];
  hiddenNodeIds: string[]; // Store as array for persistence
  flaggedNodeIds: string[]; // Store as array for persistence
  activeWorkspaceId: string | null;

  // --- INVESTIGATION SCOPE STATE ---
  customScopes: InvestigationScope[]; // User-created scopes
  activeScope: string | null; // Currently selected scope ID for active investigation
  defaultScopeId: string; // Global default scope ID

  // --- UI STATE ---
  currentView: AppView;
  navStack: BreadcrumbItem[];
  isSidebarCollapsed: boolean;
  themeMode: ThemeMode;
  themeColor: string;
  accentSettings: {
    hue: number;
    lightness: number;
    chroma: number;
  };
  themeSurfaceSettings: ThemeSurfaceSettings;
  themeFontSettings: ThemeFontSettings;
  showGlobalSearch: boolean;

  // --- ACTIONS ---
  setWorkspaces: (workspaces: Workspace[]) => void;
  setArtifacts: (artifacts: Artifact[]) => void;
  setWorkspaceRuns: (workspaceRuns: WorkspaceRun[]) => void;
  setChatSessions: (sessions: ChatSession[]) => void;
  setChatMessagesBySessionId: (messages: Record<string, ChatMessage[]>) => void;
  setBoardAgentSessions: (sessions: BoardAgentSession[]) => void;
  setBoardAgentActionsBySessionId: (actions: Record<string, BoardAgentAction[]>) => void;
  setActiveChatSessionId: (id: string | null) => void;
  setChatGenerationStatus: (status: ChatGenerationStatus) => void;
  setPartialAssistantOutput: (value: string) => void;
  setSelectedChatLaunchContext: (context: ChatLaunchContext | null) => void;
  setActiveWorkspaceRunId: (id: string | null) => void;
  setActiveTaskId: (id: string | null) => void;
  setLiveEvents: (events: MonitorEvent[] | ((prev: MonitorEvent[]) => MonitorEvent[])) => void;
  setCurrentView: (view: AppView) => void;
  setNavStack: (stack: BreadcrumbItem[]) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: string) => void;
  setAccentSettings: (settings: { hue: number; lightness: number; chroma: number }) => void;
  setThemeSurfaceSettings: (settings: ThemeSurfaceSettings) => void;
  setThemeFontSettings: (settings: ThemeFontSettings) => void;
  setShowGlobalSearch: (show: boolean) => void;
  setTemplates: (templates: CaseTemplate[]) => void;
  setHeadlines: (headlines: Headline[]) => void;
  setWorkspaceItems: (items: WorkspaceItem[]) => void;
  setWorkspaceBoards: (boards: WorkspaceBoard[]) => void;
  setActiveWorkspaceBoardId: (id: string | null) => void;
  queueBoardPlacement: (request: WorkspaceBoardPlacementRequest | null) => void;
  clearQueuedBoardPlacement: () => void;
  addHeadline: (headline: Headline) => Promise<void>;
  addTemplate: (template: CaseTemplate) => void;
  deleteTemplate: (id: string) => void;
  setEntityAliases: (aliases: EntityAliasMap) => Promise<void>;
  addAlias: (variant: string, canonical: string) => void;
  resolveEntity: (name: string) => string;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  setFeedItems: (items: FeedItem[]) => void;
  setFeedConfig: (config: WorkspaceState['feedConfig']) => void;
  setManualLinks: (links: ManualConnection[]) => void;
  setManualNodes: (nodes: ManualNode[]) => void;
  setHiddenNodeIds: (ids: string[]) => void;
  setFlaggedNodeIds: (ids: string[]) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  toggleFlag: (id: string) => void;
  toggleHide: (id: string) => void;

  // --- SCOPE ACTIONS ---
  setActiveScope: (id: string | null) => void;
  setDefaultScope: (id: string) => void;
  addScope: (scope: InvestigationScope) => void;
  deleteScope: (id: string) => void;

  // --- DERIVED/COMPLEX ACTIONS ---
  addWorkspaceRun: (workspaceRun: WorkspaceRun) => Promise<void>;
  addTask: (task: WorkspaceRun) => Promise<void>;
  createChatSession: (input: {
    workspaceId: string;
    title?: string;
    sourceReportId?: string;
    packId?: string;
    purposeId?: string;
    provider?: ChatSession['provider'];
    modelId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<ChatSession>;
  updateChatSession: (
    sessionId: string,
    patch: Partial<Omit<ChatSession, 'id' | 'workspaceId' | 'createdAt'>>
  ) => Promise<void>;
  renameChatSession: (sessionId: string, title: string) => Promise<void>;
  deleteChatSession: (sessionId: string) => Promise<void>;
  addChatMessage: (message: ChatMessage) => Promise<void>;
  updateChatMessage: (
    messageId: string,
    sessionId: string,
    patch: Partial<ChatMessage>
  ) => Promise<void>;
  addChatAction: (action: AgentAction) => Promise<void>;
  createBoardAgentSession: (input: {
    workspaceId: string;
    boardId: string;
    title?: string;
    request: string;
    provider?: BoardAgentSession['provider'];
    modelId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<BoardAgentSession>;
  updateBoardAgentSession: (
    sessionId: string,
    patch: Partial<Omit<BoardAgentSession, 'id' | 'workspaceId' | 'boardId' | 'createdAt'>>
  ) => Promise<void>;
  addBoardAgentAction: (action: BoardAgentAction) => Promise<void>;
  updateBoardAgentAction: (
    actionId: string,
    sessionId: string,
    patch: Partial<Omit<BoardAgentAction, 'id' | 'sessionId' | 'workspaceId' | 'boardId' | 'createdAt'>>
  ) => Promise<void>;
  appendSectionToReport: (reportId: string, section: ArtifactSection) => Promise<void>;
  completeWorkspaceRun: (id: string, artifact: Artifact) => Promise<void>;
  completeTask: (id: string, report: Artifact) => Promise<void>;
  failTask: (id: string, error: string) => Promise<void>;
  clearCompletedTasks: () => Promise<void>;
  saveArtifact: (
    artifact: Artifact,
    parentContext?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  archiveReport: (
    report: Artifact,
    parentContext?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  updateArtifactTitle: (artifactId: string, title: string) => Promise<void>;
  updateReportTitle: (reportId: string, title: string) => Promise<void>;
  renameEntityAcrossArtifacts: (oldName: string, newName: string) => Promise<void>;
  renameEntityAcrossReports: (oldName: string, newName: string) => Promise<void>;
  deleteArtifact: (artifactId: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  deleteCase: (caseId: string) => Promise<void>;
  purgeWorkspace: (workspaceId: string) => Promise<void>;
  purgeCase: (caseId: string) => Promise<void>;
  ensureWorkspaceBoard: (workspaceId: string) => Promise<WorkspaceBoard>;
  createWorkspaceBoard: (input: {
    workspaceId: string;
    name?: string;
    description?: string;
    presentationMode?: boolean;
  }) => Promise<WorkspaceBoard>;
  updateWorkspaceBoard: (boardId: string, patch: Partial<WorkspaceBoard>) => Promise<void>;
  deleteWorkspaceBoard: (boardId: string) => Promise<void>;
  saveWorkspaceBoardDocument: (document: WorkspaceBoardDocument) => Promise<void>;
  createWorkspaceItem: (item: WorkspaceItem) => Promise<void>;
  updateWorkspaceItem: (itemId: string, patch: Partial<WorkspaceItem>) => Promise<void>;
  deleteWorkspaceItem: (itemId: string) => Promise<void>;
  importWorkspaceData: (payload: WorkspaceDataBackup) => Promise<void>;
  clearWorkspaceData: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  // INITIAL STATE
  isLoading: true,
  error: null,

  workspaces: [],
  artifacts: [],
  workspaceRuns: [],
  chatSessions: [],
  chatMessagesBySessionId: {},
  chatActionsBySessionId: {},
  boardAgentSessions: [],
  boardAgentActionsBySessionId: {},
  activeChatSessionId: null,
  chatGenerationStatus: 'IDLE',
  partialAssistantOutput: '',
  selectedChatLaunchContext: null,
  activeWorkspaceRunId: null,
  activeTaskId: null,
  liveEvents: [],
  toasts: [],
  currentView: AppView.INVESTIGATION,
  navStack: [],
  isSidebarCollapsed: true,
  themeMode: 'dark',
  themeColor: buildAccentColor(DEFAULT_ACCENT_SETTINGS),
  accentSettings: DEFAULT_ACCENT_SETTINGS,
  themeSurfaceSettings: DEFAULT_THEME_SURFACE_SETTINGS,
  themeFontSettings: DEFAULT_THEME_FONT_SETTINGS,
  showGlobalSearch: false,
  templates: [],
  headlines: [],
  workspaceItems: [],
  workspaceBoards: [],
  workspaceBoardDocuments: {},
  activeWorkspaceBoardId: null,
  queuedBoardPlacement: null,
  entityAliases: {},
  feedItems: [],
  feedConfig: {
    limit: 8,
    prioritySources: '',
    autoRefresh: false,
    refreshInterval: 60000,
  },
  manualLinks: [],
  manualNodes: [],
  hiddenNodeIds: [],
  flaggedNodeIds: [],
  activeWorkspaceId: null,

  // Scope state
  customScopes: [],
  activeScope: null,
  defaultScopeId: 'open-investigation',

  initializeStore: async () => {
    try {
      set({ isLoading: true });
      await initDB();
      await migrateLocalStorageToSqlite();

      // Load data
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
      let headlines = await CaseRepository.getHeadlines();
      let templates = await TemplateRepository.getAll();
      let workspaceItems = await WorkspaceItemRepository.getAll();
      let workspaceBoards = await WorkspaceBoardRepository.getAllBoards();
      let workspaceBoardDocuments = await WorkspaceBoardRepository.getAllDocuments();
      let manualNodes = await ManualDataRepository.getAllNodes();
      let manualLinks = await ManualDataRepository.getAllLinks();
      let hiddenNodeIds = (await SettingsRepository.getSetting<string[]>('hidden_nodes')) || [];
      let flaggedNodeIds = (await SettingsRepository.getSetting<string[]>('flagged_nodes')) || [];
      const entityAliases =
        (await SettingsRepository.getSetting<EntityAliasMap>('entity_aliases')) || {};
      const storedThemeMode = await SettingsRepository.getSetting<ThemeMode>('theme_mode');
      const storedAccent = await SettingsRepository.getSetting<{
        hue: number;
        lightness: number;
        chroma: number;
      }>('accent_settings');
      const storedTheme = await SettingsRepository.getSetting<string>('theme_color');
      const storedThemeSurfaceSettings =
        await SettingsRepository.getSetting<ThemeSurfaceSettings>('theme_surface_settings');
      const storedThemeFontSettings =
        await SettingsRepository.getSetting<ThemeFontSettings>('theme_font_settings');

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
      const resolvedThemeMode: ThemeMode =
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
          headlines = demoSeed.signals.headlines;
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
      const resolvedActiveWorkspaceId = workspaces.some(
        (workspace) => workspace.id === storedActiveWorkspaceId
      )
        ? storedActiveWorkspaceId
        : workspaces[0]?.id || null;
      const resolvedActiveWorkspaceBoardId = workspaceBoards.find(
        (board) => board.workspaceId === resolvedActiveWorkspaceId
      )?.id;

      if (resolvedActiveWorkspaceId) {
        setStoredActiveWorkspaceId(resolvedActiveWorkspaceId);
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
        activeWorkspaceId: resolvedActiveWorkspaceId,
        activeWorkspaceBoardId: resolvedActiveWorkspaceBoardId || null,
        isLoading: false,
      });
    } catch (err) {
      console.error('Store initialization failed:', err);
      set({ error: 'Failed to load data', isLoading: false });
    }
  },

  // SIMPLE ACTIONS
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
  setActiveWorkspaceRunId: (activeWorkspaceRunId) =>
    set({ activeWorkspaceRunId, activeTaskId: activeWorkspaceRunId }),
  setActiveTaskId: (activeTaskId) => set({ activeWorkspaceRunId: activeTaskId, activeTaskId }),
  setLiveEvents: (eventsOrUpdater) => {
    if (typeof eventsOrUpdater === 'function') {
      set((state) => ({ liveEvents: eventsOrUpdater(state.liveEvents) }));
    } else {
      set({ liveEvents: eventsOrUpdater });
    }
  },
  setCurrentView: (currentView) => set({ currentView }),
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
  setShowGlobalSearch: (showGlobalSearch) => set({ showGlobalSearch }),
  setTemplates: (templates) => set({ templates }),
  setHeadlines: (headlines) => set({ headlines }),
  setWorkspaceItems: (workspaceItems) => set({ workspaceItems }),
  setWorkspaceBoards: (workspaceBoards) => set({ workspaceBoards }),
  setActiveWorkspaceBoardId: (activeWorkspaceBoardId) => set({ activeWorkspaceBoardId }),
  queueBoardPlacement: (queuedBoardPlacement) => set({ queuedBoardPlacement }),
  clearQueuedBoardPlacement: () => set({ queuedBoardPlacement: null }),

  addHeadline: async (headline) => {
    await CaseRepository.createHeadline(headline);
    set((state) => {
      const existingIndex = state.headlines.findIndex((h) => h.id === headline.id);
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
      templates: state.templates.filter((t) => t.id !== id),
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

  resolveEntity: (name) => {
    const state = get();
    return state.entityAliases[name] || name;
  },

  addToast: (message, type = 'INFO') => {
    const id = `toast-${Date.now()}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
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
    const state = get();
    const flagged = new Set(state.flaggedNodeIds);
    if (flagged.has(id)) flagged.delete(id);
    else flagged.add(id);
    const newList = Array.from(flagged);
    set({ flaggedNodeIds: newList });
    void SettingsRepository.setSetting('flagged_nodes', newList);
  },

  toggleHide: (id) => {
    const state = get();
    const hidden = new Set(state.hiddenNodeIds);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    const newList = Array.from(hidden);
    set({ hiddenNodeIds: newList });
    void SettingsRepository.setSetting('hidden_nodes', newList);
  },

  // Scope actions
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
      customScopes: state.customScopes.filter((s) => s.id !== id),
    }));
  },

  // COMPLEX ACTIONS
  createChatSession: async (input) => {
    const systemConfig = loadSystemConfig();
    const now = Date.now();
    const session: ChatSession = {
      id: createLocalId('chat-session'),
      workspaceId: input.workspaceId,
      title: input.title?.trim() || 'Untitled Chat',
      status: 'ACTIVE',
      sourceReportId: input.sourceReportId,
      packId: input.packId,
      purposeId: input.purposeId,
      provider: input.provider || systemConfig.provider,
      modelId: input.modelId || systemConfig.modelId,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    await ChatRepository.createSession(session);
    set((state) => ({
      chatSessions: [session, ...state.chatSessions],
      activeChatSessionId: session.id,
    }));

    return session;
  },

  updateChatSession: async (sessionId, patch) => {
    const updatedAt = patch.updatedAt ?? Date.now();
    await ChatRepository.updateSession(sessionId, { ...patch, updatedAt });
    set((state) => ({
      chatSessions: state.chatSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              ...patch,
              updatedAt,
            }
          : session
      ),
    }));
  },

  renameChatSession: async (sessionId, title) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    await get().updateChatSession(sessionId, { title: trimmedTitle });
  },

  deleteChatSession: async (sessionId) => {
    await ChatRepository.deleteSession(sessionId);
    set((state) => {
      const nextSessions = state.chatSessions.filter((session) => session.id !== sessionId);
      const nextMessages = { ...state.chatMessagesBySessionId };
      const nextActions = { ...state.chatActionsBySessionId };
      delete nextMessages[sessionId];
      delete nextActions[sessionId];

      return {
        chatSessions: nextSessions,
        chatMessagesBySessionId: nextMessages,
        chatActionsBySessionId: nextActions,
        activeChatSessionId:
          state.activeChatSessionId === sessionId
            ? nextSessions[0]?.id || null
            : state.activeChatSessionId,
      };
    });
  },

  addChatMessage: async (message) => {
    await ChatRepository.createMessage(message);
    set((state) => ({
      chatMessagesBySessionId: {
        ...state.chatMessagesBySessionId,
        [message.sessionId]: [...(state.chatMessagesBySessionId[message.sessionId] || []), message],
      },
      chatSessions: state.chatSessions.map((session) =>
        session.id === message.sessionId ? { ...session, updatedAt: message.updatedAt } : session
      ),
    }));
  },

  updateChatMessage: async (messageId, sessionId, patch) => {
    await ChatRepository.updateMessage(messageId, patch);
    if (patch.attachments) {
      await ChatRepository.replaceAttachments(messageId, patch.attachments);
    }

    set((state) => ({
      chatMessagesBySessionId: {
        ...state.chatMessagesBySessionId,
        [sessionId]: (state.chatMessagesBySessionId[sessionId] || []).map((message) =>
          message.id === messageId
            ? {
                ...message,
                ...patch,
                updatedAt: patch.updatedAt ?? Date.now(),
                attachments: patch.attachments ?? message.attachments,
              }
            : message
        ),
      },
    }));
  },

  addChatAction: async (action) => {
    await ChatRepository.createAction(action);
    set((state) => ({
      chatActionsBySessionId: {
        ...state.chatActionsBySessionId,
        [action.sessionId]: [...(state.chatActionsBySessionId[action.sessionId] || []), action],
      },
    }));
  },

  createBoardAgentSession: async (input) => {
    const now = Date.now();
    const session: BoardAgentSession = {
      id: createLocalId('board-agent-session'),
      workspaceId: input.workspaceId,
      boardId: input.boardId,
      title: input.title?.trim() || 'Board Agent Session',
      status: 'PENDING',
      request: input.request,
      requestState: 'QUEUED',
      provider: input.provider,
      modelId: input.modelId,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    await BoardAgentRepository.createSession(session);
    set((state) => ({
      boardAgentSessions: [session, ...state.boardAgentSessions],
    }));
    return session;
  },

  updateBoardAgentSession: async (sessionId, patch) => {
    await BoardAgentRepository.updateSession(sessionId, patch);
    set((state) => ({
      boardAgentSessions: state.boardAgentSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              ...patch,
              updatedAt: patch.updatedAt ?? Date.now(),
            }
          : session
      ),
    }));
  },

  addBoardAgentAction: async (action) => {
    await BoardAgentRepository.createAction(action);
    set((state) => ({
      boardAgentActionsBySessionId: {
        ...state.boardAgentActionsBySessionId,
        [action.sessionId]: [
          ...(state.boardAgentActionsBySessionId[action.sessionId] || []),
          action,
        ],
      },
      boardAgentSessions: state.boardAgentSessions.map((session) =>
        session.id === action.sessionId ? { ...session, updatedAt: action.updatedAt } : session
      ),
    }));
  },

  updateBoardAgentAction: async (actionId, sessionId, patch) => {
    await BoardAgentRepository.updateAction(actionId, patch);
    set((state) => ({
      boardAgentActionsBySessionId: {
        ...state.boardAgentActionsBySessionId,
        [sessionId]: (state.boardAgentActionsBySessionId[sessionId] || []).map((action) =>
          action.id === actionId
            ? {
                ...action,
                ...patch,
                updatedAt: patch.updatedAt ?? Date.now(),
              }
            : action
        ),
      },
      boardAgentSessions: state.boardAgentSessions.map((session) =>
        session.id === sessionId
          ? { ...session, updatedAt: patch.updatedAt ?? Date.now() }
          : session
      ),
    }));
  },

  appendSectionToReport: async (reportId, section) => {
    await CaseRepository.appendSectionToReport(reportId, section);
    set((state) => {
      const artifacts = state.artifacts.map((artifact) =>
        artifact.id === reportId
          ? {
              ...artifact,
              sections: [...(artifact.sections || []), section],
            }
          : artifact
      );

      return {
        artifacts,
      };
    });
  },

  addWorkspaceRun: async (workspaceRun) => {
    await TaskRepository.create(workspaceRun);
    set((state) => {
      const workspaceRuns = [...state.workspaceRuns, workspaceRun];
      return { workspaceRuns };
    });
  },

  addTask: async (task) => get().addWorkspaceRun(task),

  completeWorkspaceRun: async (id, artifact) => {
    const existingTask = get().workspaceRuns.find((task) => task.id === id);
    const nextConfig = existingTask?.config
      ? {
          ...existingTask.config,
          producedArtifactId: artifact.id,
        }
      : existingTask?.config;

    // Persist completion status
    await TaskRepository.updateStatus(id, 'COMPLETED');
    if (artifact.caseId) {
      await TaskRepository.updateWorkspace(id, artifact.caseId);
    }
    if (nextConfig) {
      await TaskRepository.updateConfig(id, nextConfig);
    }
    // Artifact persistence is handled in saveArtifact before this is called.

    set((state) => {
      const workspaceRuns = state.workspaceRuns.map((workspaceRun) =>
        workspaceRun.id === id
          ? {
              ...workspaceRun,
              status: 'COMPLETED' as const,
              report: artifact,
              config: nextConfig || workspaceRun.config,
              workspaceId: artifact.caseId ?? workspaceRun.workspaceId,
              endTime: Date.now(),
            }
          : workspaceRun
      );

      return {
        workspaceRuns,
      };
    });
  },

  completeTask: async (id, report) => get().completeWorkspaceRun(id, report),

  failTask: async (id, error) => {
    await TaskRepository.updateStatus(id, 'FAILED', error);
    set((state) => {
      const workspaceRuns = state.workspaceRuns.map((workspaceRun) =>
        workspaceRun.id === id
          ? { ...workspaceRun, status: 'FAILED' as const, error }
          : workspaceRun
      );

      return {
        workspaceRuns,
      };
    });
  },

  clearCompletedTasks: async () => {
    const state = get();
    const tasksToRemove = state.workspaceRuns.filter(
      (workspaceRun) => workspaceRun.status === 'COMPLETED' || workspaceRun.status === 'FAILED'
    );
    await Promise.all(tasksToRemove.map((workspaceRun) => TaskRepository.delete(workspaceRun.id)));

    set((current) => {
      const workspaceRuns = current.workspaceRuns.filter(
        (workspaceRun) => workspaceRun.status === 'RUNNING' || workspaceRun.status === 'QUEUED'
      );

      return {
        workspaceRuns,
      };
    });
  },

  saveArtifact: async (artifact, parentContext) => {
    const state = get();
    const artifacts = [...state.artifacts];
    const workspaces = [...state.workspaces];
    const sourceRun = artifact.config?.sourceRunId
      ? state.workspaceRuns.find((workspaceRun) => workspaceRun.id === artifact.config?.sourceRunId)
      : undefined;
    const parentArtifactId =
      artifact.config?.parentArtifactId || sourceRun?.config?.parentArtifactId;
    const sourceSignalId = artifact.config?.sourceSignalId || sourceRun?.config?.sourceSignalId;
    const parentRunId = artifact.config?.parentRunId || sourceRun?.config?.parentRunId;
    let targetWorkspaceId = artifact.caseId;
    let isNewWorkspace = false;

    // 1. Link to parent workspace
    if (!targetWorkspaceId && parentArtifactId) {
      const parentArtifact = artifacts.find((entry) => entry.id === parentArtifactId);
      if (parentArtifact?.caseId) {
        targetWorkspaceId = parentArtifact.caseId;
      }
    }
    if (!targetWorkspaceId && sourceRun?.workspaceId) {
      targetWorkspaceId = sourceRun.workspaceId;
    }
    if (!targetWorkspaceId && parentContext) {
      const parentWorkspace = workspaces.find(
        (workspace) => workspace.title === parentContext.topic
      );
      if (parentWorkspace) {
        targetWorkspaceId = parentWorkspace.id;
      }
    }

    // 2. Reuse an existing workspace for this topic if one already exists.
    if (!targetWorkspaceId) {
      const existingWorkspace = workspaces.find((workspace) => workspace.title === artifact.topic);
      if (existingWorkspace) targetWorkspaceId = existingWorkspace.id;
    }

    // 3. Create a new workspace when the artifact starts a new thread.
    if (!targetWorkspaceId) {
      const now = Date.now();
      const newWorkspaceId = createLocalId('workspace');
      const newWorkspace: Workspace = {
        id: newWorkspaceId,
        scopeId: artifact.config?.scopeId,
        title: artifact.topic,
        status: 'ACTIVE',
        dateOpened: new Date().toLocaleDateString(),
        createdAt: now,
        updatedAt: now,
        description: artifact.summary || `Workspace started on ${artifact.topic}`,
        mode: (artifact.metadata?.workspaceMode as Workspace['mode']) || undefined,
        packId: artifact.packId || artifact.config?.packId,
        purposeId: artifact.purposeId || artifact.config?.purposeId,
        labelProfileId: artifact.labelProfileId || artifact.config?.labelProfileId,
        metadata: artifact.metadata,
      };
      workspaces.push(newWorkspace);
      targetWorkspaceId = newWorkspaceId;
      isNewWorkspace = true;
    }

    // 4. Entity Normalization & Alias Application
    const autoNormalize = loadSystemConfig().autoNormalizeEntities ?? true;

    const processedEntities: Entity[] = artifact.entities.map((entity) => {
      const name = entity.name;
      // Check direct alias first
      let resolvedName = state.entityAliases[name] || name;

      if (autoNormalize && resolvedName === name) {
        // Try fuzzy match against all known entities in this case
        const existingWorkspaceEntities = artifacts
          .filter((entry) => entry.caseId === targetWorkspaceId)
          .flatMap((entry) => entry.entities)
          .map((entry) => (typeof entry === 'string' ? entry : entry.name));

        const match = existingWorkspaceEntities.find((existingName) =>
          isLikelySameEntity(name, existingName)
        );

        if (match && match !== name) {
          resolvedName = match;
          // Persist this auto-resolution
          state.addAlias(name, match);
        }
      }

      return { ...entity, name: resolvedName };
    });

    // 5. Finalize artifact with explicit lineage only.
    const savedArtifact: Artifact = {
      ...artifact,
      entities: processedEntities,
      id: artifact.id || createLocalId('rep'),
      createdAt: artifact.createdAt ?? Date.now(),
      config: artifact.config
        ? {
            ...artifact.config,
            sourceRunId: artifact.config.sourceRunId || sourceRun?.id,
            sourceSignalId,
            sourceFollowUpId:
              artifact.config.sourceFollowUpId || sourceRun?.config?.sourceFollowUpId,
            parentArtifactId,
            parentRunId,
          }
        : undefined,
      caseId: targetWorkspaceId,
    };
    savedArtifact.followUps = buildArtifactFollowUps({
      existing: savedArtifact.followUps,
      leads: savedArtifact.leads,
      artifactId: savedArtifact.id,
      workspaceId: targetWorkspaceId,
      sourceSignalId,
      createdAt: savedArtifact.createdAt,
    });
    savedArtifact.leads = toFollowUpTexts(savedArtifact.followUps);

    // 6. Persistence
    if (isNewWorkspace) {
      const workspaceToSave = workspaces.find((workspace) => workspace.id === targetWorkspaceId);
      if (workspaceToSave) await CaseRepository.createCase(workspaceToSave);
    }
    await CaseRepository.createReport(savedArtifact);

    // 7. Local update
    const existingIndex = artifacts.findIndex(
      (entry) =>
        entry.id === savedArtifact.id ||
        (entry.topic === savedArtifact.topic && entry.dateStr === savedArtifact.dateStr)
    );
    if (existingIndex >= 0) {
      artifacts[existingIndex] = savedArtifact;
    } else {
      artifacts.push(savedArtifact);
    }

    let nextArtifacts = artifacts;

    if (sourceSignalId && savedArtifact.id) {
      const matchingHeadline = state.headlines.find((headline) => headline.id === sourceSignalId);
      if (matchingHeadline) {
        const updatedHeadline = {
          ...matchingHeadline,
          linkedReportId: savedArtifact.id,
        };

        set((current) => ({
          headlines: current.headlines.map((headline) =>
            headline.id === sourceSignalId ? updatedHeadline : headline
          ),
        }));
      }
    }

    const sourceFollowUpId = savedArtifact.config?.sourceFollowUpId;
    if (sourceFollowUpId && savedArtifact.id) {
      nextArtifacts = nextArtifacts.map((entry) => ({
        ...entry,
        followUps: (entry.followUps || []).map((followUp) =>
          followUp.id === sourceFollowUpId
            ? {
                ...followUp,
                status: 'RESOLVED',
                resolvedByArtifactId: savedArtifact.id,
                updatedAt: Date.now(),
              }
            : followUp
        ),
      }));
    }

    set({
      workspaces,
      artifacts: nextArtifacts,
      activeWorkspaceId: targetWorkspaceId,
    });

    return savedArtifact;
  },

  archiveReport: async (report, parentContext) => get().saveArtifact(report, parentContext),

  updateArtifactTitle: async (artifactId, title) => {
    await CaseRepository.updateReportTopic(artifactId, title);
    set((state) => {
      const artifacts = state.artifacts.map((artifact) =>
        artifact.id === artifactId ? { ...artifact, topic: title } : artifact
      );

      return {
        artifacts,
      };
    });
  },

  updateReportTitle: async (reportId, title) => get().updateArtifactTitle(reportId, title),

  renameEntityAcrossArtifacts: async (oldName, newName) => {
    await CaseRepository.renameEntity(oldName, newName);
    set((state) => {
      const artifacts = state.artifacts.map((artifact) => ({
        ...artifact,
        entities: (artifact.entities || []).map((entity) =>
          entity.name !== oldName ? entity : { ...entity, name: newName }
        ),
      }));

      return {
        artifacts,
      };
    });
  },

  renameEntityAcrossReports: async (oldName, newName) =>
    get().renameEntityAcrossArtifacts(oldName, newName),

  deleteArtifact: async (artifactId) => {
    await CaseRepository.deleteReport(artifactId);
    set((state) => {
      const artifacts = state.artifacts.filter((artifact) => artifact.id !== artifactId);
      return { artifacts };
    });
  },

  deleteReport: async (reportId) => get().deleteArtifact(reportId),

  deleteWorkspace: async (workspaceId) => {
    await CaseRepository.unassignReportsFromCase(workspaceId);
    await CaseRepository.deleteCase(workspaceId);
    set((state) => {
      const boardAgentSessionIds = state.boardAgentSessions
        .filter((session) => session.workspaceId === workspaceId)
        .map((session) => session.id);
      const workspaces = state.workspaces.filter((item) => item.id !== workspaceId);
      const artifacts = state.artifacts.map((artifact) =>
        artifact.caseId === workspaceId ? { ...artifact, caseId: undefined } : artifact
      );
      const workspaceRuns = state.workspaceRuns.map((workspaceRun) => {
        if (
          workspaceRun.workspaceId !== workspaceId &&
          workspaceRun.report?.caseId !== workspaceId
        ) {
          return workspaceRun;
        }

        return {
          ...workspaceRun,
          workspaceId: undefined,
          report: workspaceRun.report
            ? { ...workspaceRun.report, caseId: undefined }
            : workspaceRun.report,
        };
      });
      const nextBoards = state.workspaceBoards.filter((board) => board.workspaceId !== workspaceId);
      const nextBoardDocuments = Object.fromEntries(
        Object.entries(state.workspaceBoardDocuments).filter(
          ([boardId]) => !state.workspaceBoards.some((board) => board.id === boardId && board.workspaceId === workspaceId)
        )
      );

      return {
        chatSessions: state.chatSessions.filter((session) => session.workspaceId !== workspaceId),
        chatMessagesBySessionId: Object.fromEntries(
          Object.entries(state.chatMessagesBySessionId).filter(
            ([sessionId]) =>
              !state.chatSessions.some(
                (session) => session.id === sessionId && session.workspaceId === workspaceId
              )
          )
        ),
        chatActionsBySessionId: Object.fromEntries(
          Object.entries(state.chatActionsBySessionId).filter(
            ([sessionId]) =>
              !state.chatSessions.some(
                (session) => session.id === sessionId && session.workspaceId === workspaceId
              )
          )
        ),
        boardAgentSessions: state.boardAgentSessions.filter(
          (session) => session.workspaceId !== workspaceId
        ),
        boardAgentActionsBySessionId: Object.fromEntries(
          Object.entries(state.boardAgentActionsBySessionId).filter(
            ([sessionId]) => !boardAgentSessionIds.includes(sessionId)
          )
        ),
        workspaces,
        artifacts,
        headlines: state.headlines.filter((headline) => headline.caseId !== workspaceId),
        workspaceItems: state.workspaceItems.filter((item) => item.workspaceId !== workspaceId),
        workspaceBoards: nextBoards,
        workspaceBoardDocuments: nextBoardDocuments,
        workspaceRuns,
        activeChatSessionId:
          state.activeChatSessionId &&
          state.chatSessions.some(
            (session) =>
              session.id === state.activeChatSessionId && session.workspaceId === workspaceId
          )
            ? null
            : state.activeChatSessionId,
        activeWorkspaceId: state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceId,
        activeWorkspaceBoardId:
          state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceBoardId,
      };
    });
  },

  deleteCase: async (caseId) => get().deleteWorkspace(caseId),

  purgeWorkspace: async (workspaceId) => {
    await CaseRepository.purgeCase(workspaceId);
    set((state) => {
      const artifactIds = state.artifacts
        .filter((artifact) => artifact.caseId === workspaceId && !!artifact.id)
        .map((artifact) => artifact.id as string);
      const chatSessionIds = state.chatSessions
        .filter((session) => session.workspaceId === workspaceId)
        .map((session) => session.id);
      const boardAgentSessionIds = state.boardAgentSessions
        .filter((session) => session.workspaceId === workspaceId)
        .map((session) => session.id);
      const nextWorkspaceRuns = state.workspaceRuns.filter(
        (workspaceRun) =>
          workspaceRun.workspaceId !== workspaceId && workspaceRun.report?.caseId !== workspaceId
      );
      const activeWorkspaceRunStillExists =
        !state.activeWorkspaceRunId ||
        nextWorkspaceRuns.some((workspaceRun) => workspaceRun.id === state.activeWorkspaceRunId);
      const activeTaskStillExists =
        !state.activeTaskId ||
        nextWorkspaceRuns.some((workspaceRun) => workspaceRun.id === state.activeTaskId);
      const nextGraph = filterManualGraphForWorkspaceRemoval({
        manualNodes: state.manualNodes,
        manualLinks: state.manualLinks,
        hiddenNodeIds: state.hiddenNodeIds,
        flaggedNodeIds: state.flaggedNodeIds,
        workspaceId,
        artifactIds,
      });
      const activeChatSessionStillExists =
        !state.activeChatSessionId || !chatSessionIds.includes(state.activeChatSessionId);
      const removedBoardIds = new Set(
        state.workspaceBoards
          .filter((board) => board.workspaceId === workspaceId)
          .map((board) => board.id)
      );

      return {
        chatSessions: state.chatSessions.filter((session) => session.workspaceId !== workspaceId),
        chatMessagesBySessionId: Object.fromEntries(
          Object.entries(state.chatMessagesBySessionId).filter(
            ([sessionId]) => !chatSessionIds.includes(sessionId)
          )
        ),
        chatActionsBySessionId: Object.fromEntries(
          Object.entries(state.chatActionsBySessionId).filter(
            ([sessionId]) => !chatSessionIds.includes(sessionId)
          )
        ),
        boardAgentSessions: state.boardAgentSessions.filter(
          (session) => session.workspaceId !== workspaceId
        ),
        boardAgentActionsBySessionId: Object.fromEntries(
          Object.entries(state.boardAgentActionsBySessionId).filter(
            ([sessionId]) => !boardAgentSessionIds.includes(sessionId)
          )
        ),
        workspaces: state.workspaces.filter((item) => item.id !== workspaceId),
        artifacts: state.artifacts.filter((artifact) => artifact.caseId !== workspaceId),
        headlines: state.headlines.filter((headline) => headline.caseId !== workspaceId),
        workspaceItems: state.workspaceItems.filter((item) => item.workspaceId !== workspaceId),
        workspaceBoards: state.workspaceBoards.filter((board) => board.workspaceId !== workspaceId),
        workspaceBoardDocuments: Object.fromEntries(
          Object.entries(state.workspaceBoardDocuments).filter(
            ([boardId]) => !removedBoardIds.has(boardId)
          )
        ),
        workspaceRuns: nextWorkspaceRuns,
        manualNodes: nextGraph.manualNodes,
        manualLinks: nextGraph.manualLinks,
        hiddenNodeIds: nextGraph.hiddenNodeIds,
        flaggedNodeIds: nextGraph.flaggedNodeIds,
        activeWorkspaceRunId: activeWorkspaceRunStillExists ? state.activeWorkspaceRunId : null,
        activeTaskId: activeTaskStillExists ? state.activeTaskId : null,
        activeChatSessionId: activeChatSessionStillExists ? state.activeChatSessionId : null,
        activeWorkspaceId: state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceId,
        activeWorkspaceBoardId:
          state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceBoardId,
      };
    });
  },

  purgeCase: async (caseId) => get().purgeWorkspace(caseId),

  ensureWorkspaceBoard: async (workspaceId) => {
    const existing = get().workspaceBoards.find((board) => board.workspaceId === workspaceId);
    if (existing) {
      if (get().activeWorkspaceId !== workspaceId) {
        get().setActiveWorkspaceId(workspaceId);
      } else {
        set({ activeWorkspaceBoardId: existing.id });
      }
      return existing;
    }

    return get().createWorkspaceBoard({
      workspaceId,
      name: 'Primary Board',
    });
  },

  createWorkspaceBoard: async (input) => {
    const existingBoards = get().workspaceBoards.filter(
      (board) => board.workspaceId === input.workspaceId
    );
    const now = Date.now();
    const board: WorkspaceBoard = {
      id: createLocalId('workspace-board'),
      workspaceId: input.workspaceId,
      name: input.name?.trim() || `Board ${existingBoards.length + 1}`,
      description: input.description?.trim() || undefined,
      sortOrder: existingBoards.length,
      presentationMode: input.presentationMode ?? false,
      createdAt: now,
      updatedAt: now,
    };

    await WorkspaceBoardRepository.createBoard(board);
    set((state) => ({
      workspaceBoards: [...state.workspaceBoards, board].sort((left, right) => left.sortOrder - right.sortOrder),
      activeWorkspaceBoardId: board.id,
      activeWorkspaceId: input.workspaceId,
    }));
    setStoredActiveWorkspaceId(input.workspaceId);
    return board;
  },

  updateWorkspaceBoard: async (boardId, patch) => {
    await WorkspaceBoardRepository.updateBoard(boardId, patch);
    set((state) => ({
      workspaceBoards: state.workspaceBoards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              ...patch,
              updatedAt: patch.updatedAt ?? Date.now(),
            }
          : board
      ),
    }));
  },

  deleteWorkspaceBoard: async (boardId) => {
    await WorkspaceBoardRepository.deleteBoard(boardId);
    set((state) => {
      const nextBoards = state.workspaceBoards.filter((board) => board.id !== boardId);
      const nextDocuments = { ...state.workspaceBoardDocuments };
      const nextBoardAgentSessions = state.boardAgentSessions.filter(
        (session) => session.boardId !== boardId
      );
      const removedSessionIds = new Set(
        state.boardAgentSessions
          .filter((session) => session.boardId === boardId)
          .map((session) => session.id)
      );
      const nextBoardAgentActions = Object.fromEntries(
        Object.entries(state.boardAgentActionsBySessionId).filter(
          ([sessionId]) => !removedSessionIds.has(sessionId)
        )
      );
      delete nextDocuments[boardId];
      const nextActiveBoardId =
        state.activeWorkspaceBoardId === boardId
          ? nextBoards.find((board) => board.workspaceId === state.activeWorkspaceId)?.id || null
          : state.activeWorkspaceBoardId;

      return {
        workspaceBoards: nextBoards,
        workspaceBoardDocuments: nextDocuments,
        boardAgentSessions: nextBoardAgentSessions,
        boardAgentActionsBySessionId: nextBoardAgentActions,
        activeWorkspaceBoardId: nextActiveBoardId,
      };
    });
  },

  saveWorkspaceBoardDocument: async (document) => {
    await WorkspaceBoardRepository.upsertDocument(document);
    set((state) => ({
      workspaceBoardDocuments: {
        ...state.workspaceBoardDocuments,
        [document.boardId]: document,
      },
      workspaceBoards: state.workspaceBoards.map((board) =>
        board.id === document.boardId ? { ...board, updatedAt: document.updatedAt } : board
      ),
    }));
  },

  createWorkspaceItem: async (item) => {
    await WorkspaceItemRepository.create(item);
    set((state) => ({
      workspaceItems: [item, ...state.workspaceItems],
    }));
  },

  updateWorkspaceItem: async (itemId, patch) => {
    await WorkspaceItemRepository.update(itemId, patch);
    set((state) => ({
      workspaceItems: state.workspaceItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...patch,
              updatedAt: patch.updatedAt ?? Date.now(),
            }
          : item
      ),
    }));
  },

  deleteWorkspaceItem: async (itemId) => {
    await WorkspaceItemRepository.delete(itemId);
    set((state) => ({
      workspaceItems: state.workspaceItems.filter((item) => item.id !== itemId),
    }));
  },

  importWorkspaceData: async (payload) => {
    await persistWorkspaceDataBackup(payload);

    set({
      workspaces: payload.workspaces,
      artifacts: payload.artifacts,
      workspaceRuns: payload.runs,
      chatSessions: payload.chat.sessions,
      chatMessagesBySessionId: groupChatMessagesBySessionId(payload.chat.messages),
      chatActionsBySessionId: groupChatActionsBySessionId(payload.chat.actions),
      boardAgentSessions: payload.boardAgent.sessions,
      boardAgentActionsBySessionId: groupBoardAgentActionsBySessionId(payload.boardAgent.actions),
      headlines: payload.signals.headlines,
      templates: payload.templates,
      workspaceItems: payload.workspaceSurface.items,
      workspaceBoards: payload.workspaceSurface.boards,
      workspaceBoardDocuments: Object.fromEntries(
        payload.workspaceSurface.boardDocuments.map((document) => [document.boardId, document])
      ),
      manualNodes: payload.graph.manualNodes,
      manualLinks: payload.graph.manualLinks,
      hiddenNodeIds: [],
      flaggedNodeIds: [],
      activeWorkspaceRunId: null,
      activeTaskId: null,
      activeChatSessionId: null,
      activeWorkspaceId: null,
      activeWorkspaceBoardId: null,
      queuedBoardPlacement: null,
    });
  },

  clearWorkspaceData: async () => {
    await CaseRepository.clearCaseData();
    await SettingsRepository.setSetting('hidden_nodes', []);
    await SettingsRepository.setSetting('flagged_nodes', []);
    set({
      workspaces: [],
      artifacts: [],
      workspaceRuns: [],
      chatSessions: [],
      chatMessagesBySessionId: {},
      chatActionsBySessionId: {},
      boardAgentSessions: [],
      boardAgentActionsBySessionId: {},
      headlines: [],
      templates: [],
      workspaceItems: [],
      workspaceBoards: [],
      workspaceBoardDocuments: {},
      manualNodes: [],
      manualLinks: [],
      hiddenNodeIds: [],
      flaggedNodeIds: [],
      activeWorkspaceRunId: null,
      activeTaskId: null,
      activeChatSessionId: null,
      activeWorkspaceId: null,
      activeWorkspaceBoardId: null,
      queuedBoardPlacement: null,
    });
  },
}));
