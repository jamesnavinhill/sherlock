import { create } from 'zustand';
import type {
    AgentAction,
    Artifact,
    ArtifactSection,
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
    Workspace,
    WorkspaceDataBackup,
    WorkspaceRun,
} from '../types';
import type { BreadcrumbItem } from '../components/ui/Breadcrumbs';
import {
    AppView
} from '../types';
import { isLikelySameEntity } from '../utils/entityUtils';
import { CaseRepository } from '../services/db/repositories/CaseRepository';
import { ScopeRepository } from '../services/db/repositories/ScopeRepository';
import { TaskRepository } from '../services/db/repositories/TaskRepository';
import { SettingsRepository } from '../services/db/repositories/SettingsRepository';
import { TemplateRepository } from '../services/db/repositories/TemplateRepository';
import { ManualDataRepository } from '../services/db/repositories/ManualDataRepository';
import { ChatRepository } from '../services/db/repositories/ChatRepository';
import { initDB } from '../services/db/client';
import { migrateLocalStorageToSqlite } from '../services/db/migrate';
import { DEFAULT_ACCENT_SETTINGS, buildAccentColor, parseOklch } from '../utils/accent';
import {
    DEFAULT_THEME_SURFACE_SETTINGS,
    parseThemeSurfaceSettings,
    type ThemeSurfaceSettings,
} from '../utils/themeSurfaces';
import {
    filterManualGraphForWorkspaceRemoval,
    groupChatActionsBySessionId,
    groupChatMessagesBySessionId,
} from '../services/maintenance/workspaceData';
import { normalizeWorkspaceDataBackup } from '../services/maintenance/workspaceData';
import { loadSystemConfig } from '../config/systemConfig';
import { createLocalId } from '../utils/id';
import {
    clearStoredActiveWorkspaceId,
    getStoredActiveWorkspaceId,
    setStoredActiveWorkspaceId,
} from '../utils/localStorage';

export interface Toast {
    id: string;
    message: string;
    type: 'SUCCESS' | 'ERROR' | 'INFO';
}

export type ThemeMode = 'dark' | 'light';

const DEMO_WORKSPACE_SEED_PATH = '/seeds/demo-workspace.json';
const DEMO_WORKSPACE_SEED_STORAGE_KEY = 'sherlock_demo_seed_v1_applied';

const hasExistingWorkspaceData = (input: {
    workspaces: Workspace[];
    artifacts: Artifact[];
    workspaceRuns: WorkspaceRun[];
    chatSessions: ChatSession[];
    headlines: Headline[];
    templates: CaseTemplate[];
    manualNodes: ManualNode[];
    manualLinks: ManualConnection[];
}) =>
    input.workspaces.length > 0
    || input.artifacts.length > 0
    || input.workspaceRuns.length > 0
    || input.chatSessions.length > 0
    || input.headlines.length > 0
    || input.templates.length > 0
    || input.manualNodes.length > 0
    || input.manualLinks.length > 0;

const persistWorkspaceDataBackup = async (payload: WorkspaceDataBackup) => {
    await CaseRepository.clearCaseData();

    for (const workspace of payload.workspaces) {
        await CaseRepository.createCase(workspace);
    }
    for (const artifact of payload.artifacts) {
        await CaseRepository.createReport(artifact);
    }
    for (const run of payload.runs) {
        await TaskRepository.create(run);
    }
    for (const session of payload.chat.sessions) {
        await ChatRepository.createSession(session);
    }
    for (const message of payload.chat.messages) {
        await ChatRepository.createMessage(message);
    }
    for (const action of payload.chat.actions) {
        await ChatRepository.createAction(action);
    }
    for (const headline of payload.signals.headlines) {
        await CaseRepository.createHeadline(headline);
    }
    for (const template of payload.templates) {
        await TemplateRepository.create(template);
    }

    await ManualDataRepository.saveAllNodes(payload.graph.manualNodes);
    await ManualDataRepository.saveAllLinks(payload.graph.manualLinks);
    await SettingsRepository.setSetting('hidden_nodes', []);
    await SettingsRepository.setSetting('flagged_nodes', []);
};

const loadDemoWorkspaceSeed = async () => {
    if (typeof window === 'undefined') return null;
    if (localStorage.getItem(DEMO_WORKSPACE_SEED_STORAGE_KEY) === 'true') return null;

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
    activeChatSessionId: string | null;
    chatGenerationStatus: ChatGenerationStatus;
    partialAssistantOutput: string;
    selectedChatLaunchContext: ChatLaunchContext | null;
    activeWorkspaceRunId: string | null;
    activeTaskId: string | null;
    liveEvents: MonitorEvent[];
    headlines: Headline[];
    templates: CaseTemplate[];
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
    customScopes: InvestigationScope[];  // User-created scopes
    activeScope: string | null;           // Currently selected scope ID for active investigation
    defaultScopeId: string;               // Global default scope ID

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
    showGlobalSearch: boolean;

    // --- ACTIONS ---
    setWorkspaces: (workspaces: Workspace[]) => void;
    setArtifacts: (artifacts: Artifact[]) => void;
    setWorkspaceRuns: (workspaceRuns: WorkspaceRun[]) => void;
    setChatSessions: (sessions: ChatSession[]) => void;
    setChatMessagesBySessionId: (messages: Record<string, ChatMessage[]>) => void;
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
    setShowGlobalSearch: (show: boolean) => void;
    setTemplates: (templates: CaseTemplate[]) => void;
    setHeadlines: (headlines: Headline[]) => void;
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
    updateChatMessage: (messageId: string, sessionId: string, patch: Partial<ChatMessage>) => Promise<void>;
    addChatAction: (action: AgentAction) => Promise<void>;
    appendSectionToReport: (reportId: string, section: ArtifactSection) => Promise<void>;
    completeWorkspaceRun: (id: string, artifact: Artifact) => Promise<void>;
    completeTask: (id: string, report: Artifact) => Promise<void>;
    failTask: (id: string, error: string) => Promise<void>;
    clearCompletedTasks: () => Promise<void>;
    saveArtifact: (artifact: Artifact, parentContext?: { topic: string, summary: string }) => Promise<Artifact>;
    archiveReport: (report: Artifact, parentContext?: { topic: string, summary: string }) => Promise<Artifact>;
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
    showGlobalSearch: false,
    templates: [],
    headlines: [],
    entityAliases: {},
    feedItems: [],
    feedConfig: {
        limit: 8,
        prioritySources: '',
        autoRefresh: false,
        refreshInterval: 60000
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
            let chatMessagesBySessionId = await ChatRepository.getMessagesBySessionIds(chatSessions.map((session) => session.id));
            let chatActionsBySessionId = Object.fromEntries(
                await Promise.all(
                    chatSessions.map(async (session) => [
                        session.id,
                        await ChatRepository.getActionsForSession(session.id),
                    ])
                )
            );
            let headlines = await CaseRepository.getHeadlines();
            let templates = await TemplateRepository.getAll();
            let manualNodes = await ManualDataRepository.getAllNodes();
            let manualLinks = await ManualDataRepository.getAllLinks();
            let hiddenNodeIds = await SettingsRepository.getSetting<string[]>('hidden_nodes') || [];
            let flaggedNodeIds = await SettingsRepository.getSetting<string[]>('flagged_nodes') || [];
            const entityAliases = await SettingsRepository.getSetting<EntityAliasMap>('entity_aliases') || {};
            const storedThemeMode = await SettingsRepository.getSetting<ThemeMode>('theme_mode');
            const storedAccent = await SettingsRepository.getSetting<{ hue: number; lightness: number; chroma: number }>('accent_settings');
            const storedTheme = await SettingsRepository.getSetting<string>('theme_color');
            const storedThemeSurfaceSettings = await SettingsRepository.getSetting<ThemeSurfaceSettings>('theme_surface_settings');

            const legacyTheme = localStorage.getItem('sherlock_theme');
            const legacyConfigRaw = localStorage.getItem('sherlock_config');
            const legacyConfigTheme = legacyConfigRaw ? (() => {
                try {
                    const parsed = JSON.parse(legacyConfigRaw);
                    return typeof parsed?.theme === 'string' ? parsed.theme : null;
                } catch {
                    return null;
                }
            })() : null;
            const legacyThemeMode = legacyConfigRaw ? (() => {
                try {
                    const parsed = JSON.parse(legacyConfigRaw);
                    return parsed?.themeMode === 'light' || parsed?.themeMode === 'dark' ? parsed.themeMode as ThemeMode : null;
                } catch {
                    return null;
                }
            })() : null;
            const legacyThemeSurfaceSettings = legacyConfigRaw ? (() => {
                try {
                    const parsed = JSON.parse(legacyConfigRaw);
                    return parseThemeSurfaceSettings(parsed?.themeSurfaceSettings);
                } catch {
                    return null;
                }
            })() : null;

            const resolvedAccent = storedAccent
                || (legacyTheme ? parseOklch(legacyTheme) : null)
                || (legacyConfigTheme ? parseOklch(legacyConfigTheme) : null)
                || DEFAULT_ACCENT_SETTINGS;

            const resolvedTheme = storedTheme
                || (legacyTheme || legacyConfigTheme || buildAccentColor(resolvedAccent));
            const resolvedThemeMode: ThemeMode = storedThemeMode === 'light' || storedThemeMode === 'dark'
                ? storedThemeMode
                : (legacyThemeMode ?? 'dark');
            const resolvedThemeSurfaceSettings = parseThemeSurfaceSettings(storedThemeSurfaceSettings)
                || legacyThemeSurfaceSettings
                || DEFAULT_THEME_SURFACE_SETTINGS;

            await SettingsRepository.setSetting('theme_mode', resolvedThemeMode);
            await SettingsRepository.setSetting('accent_settings', resolvedAccent);
            await SettingsRepository.setSetting('theme_color', resolvedTheme);
            await SettingsRepository.setSetting('theme_surface_settings', resolvedThemeSurfaceSettings);

            if (!hasExistingWorkspaceData({
                workspaces,
                artifacts,
                workspaceRuns,
                chatSessions,
                headlines,
                templates,
                manualNodes,
                manualLinks,
            })) {
                const demoSeed = await loadDemoWorkspaceSeed();

                if (demoSeed) {
                    await persistWorkspaceDataBackup(demoSeed);
                    localStorage.setItem(DEMO_WORKSPACE_SEED_STORAGE_KEY, 'true');

                    workspaces = demoSeed.workspaces;
                    artifacts = demoSeed.artifacts;
                    workspaceRuns = demoSeed.runs;
                    chatSessions = demoSeed.chat.sessions;
                    chatMessagesBySessionId = groupChatMessagesBySessionId(demoSeed.chat.messages);
                    chatActionsBySessionId = groupChatActionsBySessionId(demoSeed.chat.actions);
                    headlines = demoSeed.signals.headlines;
                    templates = demoSeed.templates;
                    manualNodes = demoSeed.graph.manualNodes;
                    manualLinks = demoSeed.graph.manualLinks;
                    hiddenNodeIds = [];
                    flaggedNodeIds = [];
                }
            }

            const storedActiveWorkspaceId = getStoredActiveWorkspaceId();
            const resolvedActiveWorkspaceId = workspaces.some((workspace) => workspace.id === storedActiveWorkspaceId)
                ? storedActiveWorkspaceId
                : workspaces[0]?.id || null;

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
                headlines,
                templates,
                manualNodes,
                manualLinks,
                hiddenNodeIds,
                flaggedNodeIds,
                entityAliases,
                themeMode: resolvedThemeMode,
                accentSettings: resolvedAccent,
                themeColor: resolvedTheme,
                themeSurfaceSettings: resolvedThemeSurfaceSettings,
                activeWorkspaceId: resolvedActiveWorkspaceId,
                isLoading: false
            });
        } catch (err) {
            console.error("Store initialization failed:", err);
            set({ error: "Failed to load data", isLoading: false });
        }
    },

    // SIMPLE ACTIONS
    setWorkspaces: (workspaces) => set({ workspaces }),
    setArtifacts: (artifacts) => set({ artifacts }),
    setWorkspaceRuns: (workspaceRuns) => set({ workspaceRuns }),
    setChatSessions: (chatSessions) => set({ chatSessions }),
    setChatMessagesBySessionId: (chatMessagesBySessionId) => set({ chatMessagesBySessionId }),
    setActiveChatSessionId: (activeChatSessionId) => set({ activeChatSessionId }),
    setChatGenerationStatus: (chatGenerationStatus) => set({ chatGenerationStatus }),
    setPartialAssistantOutput: (partialAssistantOutput) => set({ partialAssistantOutput }),
    setSelectedChatLaunchContext: (selectedChatLaunchContext) => set({ selectedChatLaunchContext }),
    setActiveWorkspaceRunId: (activeWorkspaceRunId) => set({ activeWorkspaceRunId, activeTaskId: activeWorkspaceRunId }),
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
    setShowGlobalSearch: (showGlobalSearch) => set({ showGlobalSearch }),
    setTemplates: (templates) => set({ templates }),
    setHeadlines: (headlines) => set({ headlines }),

    addHeadline: async (headline) => {
        await CaseRepository.createHeadline(headline);
        set((state) => {
            const existingIndex = state.headlines.findIndex(h => h.id === headline.id);
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
            templates: [...state.templates, template]
        }));
    },

    deleteTemplate: async (id) => {
        await TemplateRepository.delete(id);
        set((state) => ({
            templates: state.templates.filter(t => t.id !== id)
        }));
    },

    setEntityAliases: async (entityAliases) => {
        set({ entityAliases });
        await SettingsRepository.setSetting('entity_aliases', entityAliases);
    },

    addAlias: (variant, canonical) => {
        set((state) => ({
            entityAliases: { ...state.entityAliases, [variant]: canonical }
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
            toasts: [...state.toasts, { id, message, type }]
        }));
        // Auto-remove after 5 seconds
        setTimeout(() => {
            get().removeToast(id);
        }, 5000);
    },

    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
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
        set({ activeWorkspaceId });
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
            customScopes: [...state.customScopes, scope]
        }));
    },
    deleteScope: async (id) => {
        await ScopeRepository.delete(id);
        set((state) => ({
            customScopes: state.customScopes.filter(s => s.id !== id)
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
                    state.activeChatSessionId === sessionId ? nextSessions[0]?.id || null : state.activeChatSessionId,
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
                session.id === message.sessionId
                    ? { ...session, updatedAt: message.updatedAt }
                    : session
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
        const tasksToRemove = state.workspaceRuns.filter((workspaceRun) => workspaceRun.status === 'COMPLETED' || workspaceRun.status === 'FAILED');
        await Promise.all(tasksToRemove.map((workspaceRun) => TaskRepository.delete(workspaceRun.id)));

        set((current) => {
            const workspaceRuns = current.workspaceRuns.filter((workspaceRun) =>
                workspaceRun.status === 'RUNNING' || workspaceRun.status === 'QUEUED'
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
            artifact.config?.parentArtifactId
            || sourceRun?.config?.parentArtifactId
        const sourceSignalId =
            artifact.config?.sourceSignalId
            || sourceRun?.config?.sourceSignalId;
        const parentRunId =
            artifact.config?.parentRunId
            || sourceRun?.config?.parentRunId;
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
            const parentWorkspace = workspaces.find((workspace) => workspace.title === parentContext.topic);
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
            const newWorkspaceId = `case-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
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
                    .map((entry) => typeof entry === 'string' ? entry : entry.name);

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
            id: artifact.id || `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            createdAt: artifact.createdAt ?? Date.now(),
            config: artifact.config
                ? {
                      ...artifact.config,
                      sourceRunId: artifact.config.sourceRunId || sourceRun?.id,
                      sourceSignalId,
                      parentArtifactId,
                      parentRunId,
                  }
                : undefined,
            caseId: targetWorkspaceId
        };

        // 6. Persistence
        if (isNewWorkspace) {
            const workspaceToSave = workspaces.find((workspace) => workspace.id === targetWorkspaceId);
            if (workspaceToSave) await CaseRepository.createCase(workspaceToSave);
        }
        await CaseRepository.createReport(savedArtifact);

        // 7. Local update
        const existingIndex = artifacts.findIndex(
            (entry) => entry.id === savedArtifact.id || (entry.topic === savedArtifact.topic && entry.dateStr === savedArtifact.dateStr)
        );
        if (existingIndex >= 0) {
            artifacts[existingIndex] = savedArtifact;
        } else {
            artifacts.push(savedArtifact);
        }

        set({
            workspaces,
            artifacts,
            activeWorkspaceId: targetWorkspaceId,
        });

        if (sourceSignalId && savedArtifact.id) {
            const matchingHeadline = state.headlines.find((headline) => headline.id === sourceSignalId);
            if (matchingHeadline) {
                const updatedHeadline = {
                    ...matchingHeadline,
                    linkedReportId: savedArtifact.id,
                };

                await CaseRepository.createHeadline(updatedHeadline);
                set((current) => ({
                    headlines: current.headlines.map((headline) =>
                        headline.id === sourceSignalId
                            ? updatedHeadline
                            : headline
                    ),
                }));
            }
        }

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
                )
            }));

            return {
                artifacts,
            };
        });
    },

    renameEntityAcrossReports: async (oldName, newName) => get().renameEntityAcrossArtifacts(oldName, newName),

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
            const workspaces = state.workspaces.filter((item) => item.id !== workspaceId);
            const artifacts = state.artifacts.map((artifact) =>
                artifact.caseId === workspaceId ? { ...artifact, caseId: undefined } : artifact
            );
            const workspaceRuns = state.workspaceRuns.map((workspaceRun) => {
                if (workspaceRun.workspaceId !== workspaceId && workspaceRun.report?.caseId !== workspaceId) {
                    return workspaceRun;
                }

                return {
                    ...workspaceRun,
                    workspaceId: undefined,
                    report: workspaceRun.report ? { ...workspaceRun.report, caseId: undefined } : workspaceRun.report,
                };
            });

            return {
                chatSessions: state.chatSessions.filter((session) => session.workspaceId !== workspaceId),
            chatMessagesBySessionId: Object.fromEntries(
                Object.entries(state.chatMessagesBySessionId).filter(([sessionId]) =>
                    !state.chatSessions.some((session) => session.id === sessionId && session.workspaceId === workspaceId)
                )
            ),
            chatActionsBySessionId: Object.fromEntries(
                Object.entries(state.chatActionsBySessionId).filter(([sessionId]) =>
                    !state.chatSessions.some((session) => session.id === sessionId && session.workspaceId === workspaceId)
                )
            ),
            workspaces,
            artifacts,
            headlines: state.headlines.filter((headline) => headline.caseId !== workspaceId),
            workspaceRuns,
            activeChatSessionId:
                state.activeChatSessionId
                && state.chatSessions.some((session) => session.id === state.activeChatSessionId && session.workspaceId === workspaceId)
                    ? null
                    : state.activeChatSessionId,
            activeWorkspaceId: state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceId
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
            const nextWorkspaceRuns = state.workspaceRuns.filter(
                (workspaceRun) => workspaceRun.workspaceId !== workspaceId && workspaceRun.report?.caseId !== workspaceId
            );
            const activeTaskStillExists =
                !state.activeWorkspaceRunId || nextWorkspaceRuns.some((workspaceRun) => workspaceRun.id === state.activeWorkspaceRunId);
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
                workspaces: state.workspaces.filter((item) => item.id !== workspaceId),
                artifacts: state.artifacts.filter((artifact) => artifact.caseId !== workspaceId),
                headlines: state.headlines.filter((headline) => headline.caseId !== workspaceId),
                workspaceRuns: nextWorkspaceRuns,
                manualNodes: nextGraph.manualNodes,
                manualLinks: nextGraph.manualLinks,
                hiddenNodeIds: nextGraph.hiddenNodeIds,
                flaggedNodeIds: nextGraph.flaggedNodeIds,
                activeWorkspaceRunId: activeTaskStillExists ? state.activeWorkspaceRunId : null,
                activeTaskId: activeTaskStillExists ? state.activeWorkspaceRunId : null,
                activeChatSessionId: activeChatSessionStillExists ? state.activeChatSessionId : null,
                activeWorkspaceId: state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceId
            };
        });
    },

    purgeCase: async (caseId) => get().purgeWorkspace(caseId),

    importWorkspaceData: async (payload) => {
        await persistWorkspaceDataBackup(payload);

        set({
            workspaces: payload.workspaces,
            artifacts: payload.artifacts,
            workspaceRuns: payload.runs,
            chatSessions: payload.chat.sessions,
            chatMessagesBySessionId: groupChatMessagesBySessionId(payload.chat.messages),
            chatActionsBySessionId: groupChatActionsBySessionId(payload.chat.actions),
            headlines: payload.signals.headlines,
            templates: payload.templates,
            manualNodes: payload.graph.manualNodes,
            manualLinks: payload.graph.manualLinks,
            hiddenNodeIds: [],
            flaggedNodeIds: [],
            activeWorkspaceRunId: null,
            activeTaskId: null,
            activeChatSessionId: null,
            activeWorkspaceId: null
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
            headlines: [],
            templates: [],
            manualNodes: [],
            manualLinks: [],
            hiddenNodeIds: [],
            flaggedNodeIds: [],
            activeWorkspaceRunId: null,
            activeTaskId: null,
            activeChatSessionId: null,
            activeWorkspaceId: null
        });
    }
}));
