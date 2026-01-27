import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    AppView,
    InvestigationReport,
    InvestigationTask,
    Case,
    MonitorEvent,
    SystemConfig,
    BreadcrumbItem,
    CaseTemplate,
    Entity,
    Headline
} from '../types';
import { getCoreName, isLikelySameEntity } from '../utils/entityUtils';

export interface Toast {
    id: string;
    message: string;
    type: 'SUCCESS' | 'ERROR' | 'INFO';
}

interface CaseState {
    // --- CORE DATA STATE ---
    archives: InvestigationReport[];
    cases: Case[];
    cases: Case[];
    tasks: InvestigationTask[];
    activeTaskId: string | null;
    liveEvents: MonitorEvent[];
    headlines: Headline[];
    templates: CaseTemplate[];
    entityAliases: EntityAliasMap;
    toasts: Toast[];

    // --- UI STATE ---
    currentView: AppView;
    navStack: BreadcrumbItem[];
    isSidebarCollapsed: boolean;
    themeColor: string;
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

    // --- DERIVED/COMPLEX ACTIONS ---
    addTask: (task: InvestigationTask) => void;
    completeTask: (id: string, report: InvestigationReport) => void;
    failTask: (id: string, error: string) => void;
    clearCompletedTasks: () => void;
    archiveReport: (report: InvestigationReport, parentContext?: { topic: string, summary: string }) => InvestigationReport;
}

export const useCaseStore = create<CaseState>()(
    persist(
        (set, get) => ({
            // INITIAL STATE
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
            showNewCaseModal: false,
            showGlobalSearch: false,
            templates: [],
            headlines: [],
            entityAliases: {},

            // SIMPLE ACTIONS
            setArchives: (archives) => set({ archives }),
            setCases: (cases) => set({ cases }),
            setTasks: (tasks) => set({ tasks }),
            setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
            setLiveEvents: (liveEvents) => set({ liveEvents }),
            setCurrentView: (currentView) => set({ currentView }),
            setNavStack: (navStack) => set({ navStack }),
            setIsSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
            setThemeColor: (themeColor) => set({ themeColor }),
            setShowNewCaseModal: (showNewCaseModal) => set({ showNewCaseModal }),
            setShowGlobalSearch: (showGlobalSearch) => set({ showGlobalSearch }),
            setTemplates: (templates) => set({ templates }),
            setHeadlines: (headlines) => set({ headlines }),

            addHeadline: (headline) => set((state) => ({
                headlines: [...state.headlines, headline]
            })),

            addTemplate: (template) => set((state) => ({
                templates: [...state.templates, template]
            })),

            deleteTemplate: (id) => set((state) => ({
                templates: state.templates.filter(t => t.id !== id)
            })),

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

            // COMPLEX ACTIONS
            addTask: (task) => set((state) => ({
                tasks: [...state.tasks, task]
            })),

            completeTask: (id, report) => set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id
                        ? { ...t, status: 'COMPLETED', report, endTime: Date.now() }
                        : t
                )
            })),

            failTask: (id, error) => set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id
                        ? { ...t, status: 'FAILED', error }
                        : t
                )
            })),

            clearCompletedTasks: () => set((state) => ({
                tasks: state.tasks.filter((t) =>
                    t.status === 'RUNNING' || t.status === 'QUEUED'
                )
            })),

            archiveReport: (report, parentContext) => {
                const state = get();
                let archives = [...state.archives];
                let cases = [...state.cases];
                let targetCaseId = report.caseId;

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

                // 6. Upsert
                const existingIndex = archives.findIndex(r => r.id === savedReport.id || (r.topic === savedReport.topic && r.dateStr === savedReport.dateStr));
                if (existingIndex >= 0) {
                    archives[existingIndex] = savedReport;
                } else {
                    archives.push(savedReport);
                }

                set({ archives, cases });
                return savedReport;
            }
        }),
        {
            name: 'sherlock-storage',
            // Only persist specific pieces of state if needed
            partialize: (state) => ({
                archives: state.archives,
                cases: state.cases,
                templates: state.templates,
                headlines: state.headlines,
                entityAliases: state.entityAliases,
                themeColor: state.themeColor,
                // We might not want to persist current tasks or views across sessions
                // but archives and cases are essential.
            }),
        }
    )
);
