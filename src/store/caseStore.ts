import { create } from 'zustand';
import type {
    InvestigationReport,
    InvestigationTask,
    Case,
    MonitorEvent,
    SystemConfig,
    BreadcrumbItem,
    CaseTemplate,
    Headline,
    FeedItem,
    ManualConnection,
    ManualNode,
    InvestigationScope
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
import { initDB } from '../services/db/client';
import { migrateLocalStorageToSqlite } from '../services/db/migrate';
import { DEFAULT_ACCENT_SETTINGS, buildAccentColor, parseOklch } from '../utils/accent';

export interface Toast {
    id: string;
    message: string;
    type: 'SUCCESS' | 'ERROR' | 'INFO';
}

interface CaseState {
    // --- CORE DATA STATE ---
    isLoading: boolean;
    error: string | null;
    initializeStore: () => Promise<void>;

    archives: InvestigationReport[];
    cases: Case[];
    tasks: InvestigationTask[];
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
    themeColor: string;
    accentSettings: {
        hue: number;
        lightness: number;
        chroma: number;
    };
    showNewCaseModal: boolean;
    showGlobalSearch: boolean;

    // --- ACTIONS ---
    setArchives: (archives: InvestigationReport[]) => void;
    setCases: (cases: Case[]) => void;
    setTasks: (tasks: InvestigationTask[]) => void;
    setActiveTaskId: (id: string | null) => void;
    setLiveEvents: (events: MonitorEvent[]) => void;
    setCurrentView: (view: AppView) => void;
    setNavStack: (stack: BreadcrumbItem[]) => void;
    setIsSidebarCollapsed: (collapsed: boolean) => void;
    setThemeColor: (color: string) => void;
    setAccentSettings: (settings: { hue: number; lightness: number; chroma: number }) => void;
    setShowNewCaseModal: (show: boolean) => void;
    setShowGlobalSearch: (show: boolean) => void;
    setTemplates: (templates: CaseTemplate[]) => void;
    setHeadlines: (headlines: Headline[]) => void;
    addHeadline: (headline: Headline) => void;
    addTemplate: (template: CaseTemplate) => void;
    deleteTemplate: (id: string) => void;
    setEntityAliases: (aliases: EntityAliasMap) => void;
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
    completeTask: (id: string, report: InvestigationReport) => Promise<void>;
    failTask: (id: string, error: string) => Promise<void>;
    clearCompletedTasks: () => Promise<void>;
    archiveReport: (report: InvestigationReport, parentContext?: { topic: string, summary: string }) => Promise<InvestigationReport>;
}

export const useCaseStore = create<CaseState>()((set, get) => ({
    // INITIAL STATE
    isLoading: true,
    error: null,

    archives: [],
    cases: [],
    tasks: [],
    activeTaskId: null,
    liveEvents: [],
    toasts: [],
    currentView: AppView.DASHBOARD,
    navStack: [],
    isSidebarCollapsed: true,
    themeColor: '#e4e4e7cc',
    accentSettings: DEFAULT_ACCENT_SETTINGS,
    showNewCaseModal: false,
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
            const headlines = await CaseRepository.getHeadlines();
            const templates = await TemplateRepository.getAll();
            const manualNodes = await ManualDataRepository.getAllNodes();
            const manualLinks = await ManualDataRepository.getAllLinks();
            const hiddenNodeIds = await SettingsRepository.getSetting<string[]>('hidden_nodes') || [];
            const flaggedNodeIds = await SettingsRepository.getSetting<string[]>('flagged_nodes') || [];
            const storedAccent = await SettingsRepository.getSetting<{ hue: number; lightness: number; chroma: number }>('accent_settings');
            const storedTheme = await SettingsRepository.getSetting<string>('theme_color');

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

            const resolvedAccent = storedAccent
                || (legacyTheme ? parseOklch(legacyTheme) : null)
                || (legacyConfigTheme ? parseOklch(legacyConfigTheme) : null)
                || DEFAULT_ACCENT_SETTINGS;

            const resolvedTheme = storedTheme
                || (legacyTheme || legacyConfigTheme || buildAccentColor(resolvedAccent));

            await SettingsRepository.setSetting('accent_settings', resolvedAccent);
            await SettingsRepository.setSetting('theme_color', resolvedTheme);

            set({
                cases,
                archives,
                customScopes: scopes,
                tasks,
                headlines,
                templates,
                manualNodes,
                manualLinks,
                hiddenNodeIds,
                flaggedNodeIds,
                accentSettings: resolvedAccent,
                themeColor: resolvedTheme,
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
    setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
    setLiveEvents: (liveEvents) => set({ liveEvents }),
    setCurrentView: (currentView) => set({ currentView }),
    setNavStack: (navStack) => set({ navStack }),
    setIsSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
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
    setShowNewCaseModal: (showNewCaseModal) => set({ showNewCaseModal }),
    setShowGlobalSearch: (showGlobalSearch) => set({ showGlobalSearch }),
    setTemplates: (templates) => set({ templates }),
    setHeadlines: (headlines) => set({ headlines }),

    addHeadline: (headline) => set((state) => ({
        headlines: [...state.headlines, headline]
    })),

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

    setEntityAliases: (entityAliases) => set({ entityAliases }),

    addAlias: (variant, canonical) => set((state) => ({
        entityAliases: { ...state.entityAliases, [variant]: canonical }
    })),

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
    addTask: async (task) => {
        await TaskRepository.create(task);
        set((state) => ({
            tasks: [...state.tasks, task]
        }));
    },

    completeTask: async (id, report) => {
        // Persist completion status
        await TaskRepository.updateStatus(id, 'COMPLETED');
        // Report persistence is handled in archiveReport before this is called

        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id
                    ? { ...t, status: 'COMPLETED', report, endTime: Date.now() }
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
            const newCaseId = `case-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const newCase: Case = {
                id: newCaseId,
                title: `Operation: ${report.topic}`,
                status: 'ACTIVE',
                dateOpened: new Date().toLocaleDateString(),
                description: `Investigation started on ${report.topic}`
            };
            cases.push(newCase);
            targetCaseId = newCaseId;
            isNewCase = true;
        }

        // 4. Entity Normalization & Alias Application
        const storedConfig = localStorage.getItem('sherlock_config');
        const config: SystemConfig | null = storedConfig ? JSON.parse(storedConfig) : null;
        const autoNormalize = config?.autoNormalizeEntities ?? true;

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

        set({ archives, cases });
        return savedReport;
    }
}));
