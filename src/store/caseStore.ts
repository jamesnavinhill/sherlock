import { create } from 'zustand';
import type {
    AgentAction,
    ArtifactSection,
    InvestigationReport,
    InvestigationTask,
    Case,
    ChatGenerationStatus,
    ChatLaunchContext,
    ChatMessage,
    ChatSession,
    MonitorEvent,
    BreadcrumbItem,
    CaseTemplate,
    Headline,
    FeedItem,
    ManualConnection,
    ManualNode,
    InvestigationScope,
    EntityAliasMap,
    WorkspaceDataBackup,
} from '../types';
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
import { loadSystemConfig } from '../config/systemConfig';
import { createLocalId } from '../utils/id';

export interface Toast {
    id: string;
    message: string;
    type: 'SUCCESS' | 'ERROR' | 'INFO';
}

export type ThemeMode = 'dark' | 'light';

interface CaseState {
    // --- CORE DATA STATE ---
    isLoading: boolean;
    error: string | null;
    initializeStore: () => Promise<void>;

    archives: InvestigationReport[];
    cases: Case[];
    tasks: InvestigationTask[];
    chatSessions: ChatSession[];
    chatMessagesBySessionId: Record<string, ChatMessage[]>;
    chatActionsBySessionId: Record<string, AgentAction[]>;
    activeChatSessionId: string | null;
    chatGenerationStatus: ChatGenerationStatus;
    partialAssistantOutput: string;
    selectedChatLaunchContext: ChatLaunchContext | null;
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
    activeCaseId: string | null;

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
    setArchives: (archives: InvestigationReport[]) => void;
    setCases: (cases: Case[]) => void;
    setTasks: (tasks: InvestigationTask[]) => void;
    setChatSessions: (sessions: ChatSession[]) => void;
    setChatMessagesBySessionId: (messages: Record<string, ChatMessage[]>) => void;
    setActiveChatSessionId: (id: string | null) => void;
    setChatGenerationStatus: (status: ChatGenerationStatus) => void;
    setPartialAssistantOutput: (value: string) => void;
    setSelectedChatLaunchContext: (context: ChatLaunchContext | null) => void;
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
    setFeedConfig: (config: CaseState['feedConfig']) => void;
    setManualLinks: (links: ManualConnection[]) => void;
    setManualNodes: (nodes: ManualNode[]) => void;
    setHiddenNodeIds: (ids: string[]) => void;
    setFlaggedNodeIds: (ids: string[]) => void;
    setActiveCaseId: (id: string | null) => void;
    toggleFlag: (id: string) => void;
    toggleHide: (id: string) => void;

    // --- SCOPE ACTIONS ---
    setActiveScope: (id: string | null) => void;
    setDefaultScope: (id: string) => void;
    addScope: (scope: InvestigationScope) => void;
    deleteScope: (id: string) => void;

    // --- DERIVED/COMPLEX ACTIONS ---
    addTask: (task: InvestigationTask) => Promise<void>;
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
    completeTask: (id: string, report: InvestigationReport) => Promise<void>;
    failTask: (id: string, error: string) => Promise<void>;
    clearCompletedTasks: () => Promise<void>;
    archiveReport: (report: InvestigationReport, parentContext?: { topic: string, summary: string }) => Promise<InvestigationReport>;
    updateReportTitle: (reportId: string, title: string) => Promise<void>;
    renameEntityAcrossReports: (oldName: string, newName: string) => Promise<void>;
    deleteReport: (reportId: string) => Promise<void>;
    deleteCase: (caseId: string) => Promise<void>;
    purgeCase: (caseId: string) => Promise<void>;
    importWorkspaceData: (payload: WorkspaceDataBackup) => Promise<void>;
    clearWorkspaceData: () => Promise<void>;
}

export const useCaseStore = create<CaseState>()((set, get) => ({
    // INITIAL STATE
    isLoading: true,
    error: null,

    archives: [],
    cases: [],
    tasks: [],
    chatSessions: [],
    chatMessagesBySessionId: {},
    chatActionsBySessionId: {},
    activeChatSessionId: null,
    chatGenerationStatus: 'IDLE',
    partialAssistantOutput: '',
    selectedChatLaunchContext: null,
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
    activeCaseId: null,

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
            const cases = await CaseRepository.getAllCases();
            const archives = await CaseRepository.getAllReports();
            const scopes = await ScopeRepository.getAll();
            const tasks = await TaskRepository.getAll();
            const chatSessions = await ChatRepository.getAllSessions();
            const chatMessagesBySessionId = await ChatRepository.getMessagesBySessionIds(chatSessions.map((session) => session.id));
            const chatActionsBySessionId = Object.fromEntries(
                await Promise.all(
                    chatSessions.map(async (session) => [
                        session.id,
                        await ChatRepository.getActionsForSession(session.id),
                    ])
                )
            );
            const headlines = await CaseRepository.getHeadlines();
            const templates = await TemplateRepository.getAll();
            const manualNodes = await ManualDataRepository.getAllNodes();
            const manualLinks = await ManualDataRepository.getAllLinks();
            const hiddenNodeIds = await SettingsRepository.getSetting<string[]>('hidden_nodes') || [];
            const flaggedNodeIds = await SettingsRepository.getSetting<string[]>('flagged_nodes') || [];
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

            set({
                cases,
                archives,
                customScopes: scopes,
                tasks,
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
                isLoading: false
            });
        } catch (err) {
            console.error("Store initialization failed:", err);
            set({ error: "Failed to load data", isLoading: false });
        }
    },

    // SIMPLE ACTIONS
    setArchives: (archives) => set({ archives }),
    setCases: (cases) => set({ cases }),
    setTasks: (tasks) => set({ tasks }),
    setChatSessions: (chatSessions) => set({ chatSessions }),
    setChatMessagesBySessionId: (chatMessagesBySessionId) => set({ chatMessagesBySessionId }),
    setActiveChatSessionId: (activeChatSessionId) => set({ activeChatSessionId }),
    setChatGenerationStatus: (chatGenerationStatus) => set({ chatGenerationStatus }),
    setPartialAssistantOutput: (partialAssistantOutput) => set({ partialAssistantOutput }),
    setSelectedChatLaunchContext: (selectedChatLaunchContext) => set({ selectedChatLaunchContext }),
    setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
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
    setActiveCaseId: (activeCaseId) => set({ activeCaseId }),

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
        set((state) => ({
            archives: state.archives.map((report) =>
                report.id === reportId
                    ? {
                          ...report,
                          sections: [...(report.sections || []), section],
                      }
                    : report
            ),
        }));
    },

    addTask: async (task) => {
        await TaskRepository.create(task);
        set((state) => ({
            tasks: [...state.tasks, task]
        }));
    },

    completeTask: async (id, report) => {
        // Persist completion status
        await TaskRepository.updateStatus(id, 'COMPLETED');
        if (report.caseId) {
            await TaskRepository.updateWorkspace(id, report.caseId);
        }
        // Report persistence is handled in archiveReport before this is called

        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id
                    ? { ...t, status: 'COMPLETED', report, workspaceId: report.caseId ?? t.workspaceId, endTime: Date.now() }
                    : t
            )
        }));
    },

    failTask: async (id, error) => {
        await TaskRepository.updateStatus(id, 'FAILED', error);
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id
                    ? { ...t, status: 'FAILED', error }
                    : t
            )
        }));
    },

    clearCompletedTasks: async () => {
        const state = get();
        const tasksToRemove = state.tasks.filter(t => t.status === 'COMPLETED' || t.status === 'FAILED');
        await Promise.all(tasksToRemove.map(t => TaskRepository.delete(t.id)));

        set((state) => ({
            tasks: state.tasks.filter((t) =>
                t.status === 'RUNNING' || t.status === 'QUEUED'
            )
        }));
    },

    archiveReport: async (report, parentContext) => {
        const state = get();
        const archives = [...state.archives];
        const cases = [...state.cases];
        let targetCaseId = report.caseId;
        let isNewCase = false;

        // 1. Link to parent case
        if (!targetCaseId && parentContext) {
            const parentReport = archives.find(r => r.topic === parentContext.topic);
            if (parentReport?.caseId) {
                targetCaseId = parentReport.caseId;
            } else {
                const parentCase = cases.find(c => c.title === parentContext.topic || c.title === `Operation: ${parentContext.topic}`);
                if (parentCase) targetCaseId = parentCase.id;
            }
        }

        // 2. Check existing case for this topic
        if (!targetCaseId) {
            const existingCase = cases.find(c => c.title === report.topic || c.title === `Operation: ${report.topic}`);
            if (existingCase) targetCaseId = existingCase.id;
        }

        // 3. Create new case
        if (!targetCaseId) {
            const now = Date.now();
            const newCaseId = `case-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const newCase: Case = {
                id: newCaseId,
                scopeId: report.config?.scopeId,
                title: report.topic,
                status: 'ACTIVE',
                dateOpened: new Date().toLocaleDateString(),
                createdAt: now,
                updatedAt: now,
                description: report.summary || `Workspace started on ${report.topic}`,
                mode: (report.metadata?.workspaceMode as Case['mode']) || undefined,
                packId: report.packId || report.config?.packId,
                purposeId: report.purposeId || report.config?.purposeId,
                labelProfileId: report.labelProfileId || report.config?.labelProfileId,
                metadata: report.metadata,
            };
            cases.push(newCase);
            targetCaseId = newCaseId;
            isNewCase = true;
        }

        // 4. Entity Normalization & Alias Application
        const autoNormalize = loadSystemConfig().autoNormalizeEntities ?? true;

        const processedEntities = report.entities.map(e => {
            const name = typeof e === 'string' ? e : e.name;
            // Check direct alias first
            let resolvedName = state.entityAliases[name] || name;

            if (autoNormalize && resolvedName === name) {
                // Try fuzzy match against all known entities in this case
                const existingCaseEntities = archives
                    .filter(r => r.caseId === targetCaseId)
                    .flatMap(r => r.entities)
                    .map(ent => typeof ent === 'string' ? ent : ent.name);

                const match = existingCaseEntities.find(existingName =>
                    isLikelySameEntity(name, existingName)
                );

                if (match && match !== name) {
                    resolvedName = match;
                    // Persist this auto-resolution
                    state.addAlias(name, match);
                }
            }

            if (typeof e === 'string') return resolvedName;
            return { ...e, name: resolvedName };
        });

        // 5. Finalize report
        const savedReport: InvestigationReport = {
            ...report,
            entities: processedEntities,
            id: report.id || `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            createdAt: report.createdAt ?? Date.now(),
            caseId: targetCaseId
        };

        // 6. Persistence
        if (isNewCase) {
            const caseToSave = cases.find(c => c.id === targetCaseId);
            if (caseToSave) await CaseRepository.createCase(caseToSave);
        }
        await CaseRepository.createReport(savedReport);

        // 7. Local Update
        const existingIndex = archives.findIndex(r => r.id === savedReport.id || (r.topic === savedReport.topic && r.dateStr === savedReport.dateStr));
        if (existingIndex >= 0) {
            archives[existingIndex] = savedReport;
        } else {
            archives.push(savedReport);
        }

        set({ archives, cases, activeCaseId: targetCaseId });
        return savedReport;
    },

    updateReportTitle: async (reportId, title) => {
        await CaseRepository.updateReportTopic(reportId, title);
        set((state) => ({
            archives: state.archives.map((report) =>
                report.id === reportId ? { ...report, topic: title } : report
            )
        }));
    },

    renameEntityAcrossReports: async (oldName, newName) => {
        await CaseRepository.renameEntity(oldName, newName);
        set((state) => ({
            archives: state.archives.map((report) => ({
                ...report,
                entities: (report.entities || []).map((entity) => {
                    const name = typeof entity === 'string' ? entity : entity.name;
                    if (name !== oldName) return entity;
                    return typeof entity === 'string' ? newName : { ...entity, name: newName };
                })
            }))
        }));
    },

    deleteReport: async (reportId) => {
        await CaseRepository.deleteReport(reportId);
        set((state) => ({
            archives: state.archives.filter((report) => report.id !== reportId)
        }));
    },

    deleteCase: async (caseId) => {
        await CaseRepository.unassignReportsFromCase(caseId);
        await CaseRepository.deleteCase(caseId);
        set((state) => ({
            chatSessions: state.chatSessions.filter((session) => session.workspaceId !== caseId),
            chatMessagesBySessionId: Object.fromEntries(
                Object.entries(state.chatMessagesBySessionId).filter(([sessionId]) =>
                    !state.chatSessions.some((session) => session.id === sessionId && session.workspaceId === caseId)
                )
            ),
            chatActionsBySessionId: Object.fromEntries(
                Object.entries(state.chatActionsBySessionId).filter(([sessionId]) =>
                    !state.chatSessions.some((session) => session.id === sessionId && session.workspaceId === caseId)
                )
            ),
            cases: state.cases.filter((item) => item.id !== caseId),
            archives: state.archives.map((report) =>
                report.caseId === caseId ? { ...report, caseId: undefined } : report
            ),
            headlines: state.headlines.filter((headline) => headline.caseId !== caseId),
            tasks: state.tasks.map((task) => {
                if (task.workspaceId !== caseId && task.report?.caseId !== caseId) {
                    return task;
                }

                return {
                    ...task,
                    workspaceId: undefined,
                    report: task.report ? { ...task.report, caseId: undefined } : task.report,
                };
            }),
            activeChatSessionId:
                state.activeChatSessionId
                && state.chatSessions.some((session) => session.id === state.activeChatSessionId && session.workspaceId === caseId)
                    ? null
                    : state.activeChatSessionId,
            activeCaseId: state.activeCaseId === caseId ? null : state.activeCaseId
        }));
    },

    purgeCase: async (caseId) => {
        await CaseRepository.purgeCase(caseId);
        set((state) => {
            const reportIds = state.archives
                .filter((report) => report.caseId === caseId && !!report.id)
                .map((report) => report.id as string);
            const chatSessionIds = state.chatSessions
                .filter((session) => session.workspaceId === caseId)
                .map((session) => session.id);
            const nextTasks = state.tasks.filter(
                (task) => task.workspaceId !== caseId && task.report?.caseId !== caseId
            );
            const activeTaskStillExists = !state.activeTaskId || nextTasks.some((task) => task.id === state.activeTaskId);
            const nextGraph = filterManualGraphForWorkspaceRemoval({
                manualNodes: state.manualNodes,
                manualLinks: state.manualLinks,
                hiddenNodeIds: state.hiddenNodeIds,
                flaggedNodeIds: state.flaggedNodeIds,
                workspaceId: caseId,
                artifactIds: reportIds,
            });
            const activeChatSessionStillExists =
                !state.activeChatSessionId || !chatSessionIds.includes(state.activeChatSessionId);

            return {
                chatSessions: state.chatSessions.filter((session) => session.workspaceId !== caseId),
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
                cases: state.cases.filter((item) => item.id !== caseId),
                archives: state.archives.filter((report) => report.caseId !== caseId),
                headlines: state.headlines.filter((headline) => headline.caseId !== caseId),
                tasks: nextTasks,
                manualNodes: nextGraph.manualNodes,
                manualLinks: nextGraph.manualLinks,
                hiddenNodeIds: nextGraph.hiddenNodeIds,
                flaggedNodeIds: nextGraph.flaggedNodeIds,
                activeTaskId: activeTaskStillExists ? state.activeTaskId : null,
                activeChatSessionId: activeChatSessionStillExists ? state.activeChatSessionId : null,
                activeCaseId: state.activeCaseId === caseId ? null : state.activeCaseId
            };
        });
    },

    importWorkspaceData: async (payload) => {
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

        set({
            cases: payload.workspaces,
            archives: payload.artifacts,
            tasks: payload.runs,
            chatSessions: payload.chat.sessions,
            chatMessagesBySessionId: groupChatMessagesBySessionId(payload.chat.messages),
            chatActionsBySessionId: groupChatActionsBySessionId(payload.chat.actions),
            headlines: payload.signals.headlines,
            templates: payload.templates,
            manualNodes: payload.graph.manualNodes,
            manualLinks: payload.graph.manualLinks,
            hiddenNodeIds: [],
            flaggedNodeIds: [],
            activeTaskId: null,
            activeChatSessionId: null,
            activeCaseId: null
        });
    },

    clearWorkspaceData: async () => {
        await CaseRepository.clearCaseData();
        await SettingsRepository.setSetting('hidden_nodes', []);
        await SettingsRepository.setSetting('flagged_nodes', []);
        set({
            cases: [],
            archives: [],
            tasks: [],
            chatSessions: [],
            chatMessagesBySessionId: {},
            chatActionsBySessionId: {},
            headlines: [],
            templates: [],
            manualNodes: [],
            manualLinks: [],
            hiddenNodeIds: [],
            flaggedNodeIds: [],
            activeTaskId: null,
            activeChatSessionId: null,
            activeCaseId: null
        });
    }
}));
