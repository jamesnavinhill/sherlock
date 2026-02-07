import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { ApiKeyModal } from './components/ui/ApiKeyModal';
import type { BreadcrumbItem } from './components/ui/Breadcrumbs';
import type {
  InvestigationLaunchRequest,
  InvestigationReport,
  InvestigationRunConfig,
  InvestigationScope,
  InvestigationTask,
  ManualNode,
  SystemConfig,
} from './types';
import { AppView } from './types';
import { useCaseStore } from './store/caseStore';
import { hasApiKey, investigateTopic } from './services/gemini';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { createAppShortcuts } from './hooks/useKeyboardShortcuts';
import { HelpModal } from './components/ui/HelpModal';
import { buildAccentColor } from './utils/accent';
import { loadSystemConfig, migrateSystemConfig } from './config/systemConfig';
import { getAllScopes, getScopeById } from './data/presets';
const Archives = lazy(() => import('./components/features/Archives').then(m => ({ default: m.Archives })));
const NetworkGraph = lazy(() => import('./components/features/NetworkGraph').then(m => ({ default: m.NetworkGraph })));
const LiveMonitor = lazy(() => import('./components/features/LiveMonitor').then(m => ({ default: m.LiveMonitor })));
const Settings = lazy(() => import('./components/features/Settings').then(m => ({ default: m.Settings })));
const TimelineView = lazy(() => import('./components/features/TimelineView').then(m => ({ default: m.TimelineView })));
const OperationView = lazy(() => import('./components/features/OperationView').then(m => ({ default: m.OperationView })));
const Feed = lazy(() => import('./components/features/Feed').then(m => ({ default: m.Feed })));
import { Sidebar } from './components/ui/Sidebar';
import { ToastContainer } from './components/ui/Toast';
import { GlobalSearch } from './components/ui/GlobalSearch';

const toSystemConfigOverride = (config?: InvestigationRunConfig): Partial<SystemConfig> | undefined => {
  if (!config) return undefined;

  return {
    provider: config.provider,
    modelId: config.modelId,
    persona: config.persona,
    searchDepth: config.searchDepth,
    thinkingBudget: config.thinkingBudget,
  };
};

function App() {
  const {
    currentView, setCurrentView,
    tasks, addTask, completeTask, failTask, clearCompletedTasks,
    activeTaskId, setActiveTaskId,
    liveEvents: _liveEvents, setLiveEvents: _setLiveEvents,
    navStack, setNavStack,
    isSidebarCollapsed, setIsSidebarCollapsed,
    themeMode, setThemeMode,
    themeColor, setThemeColor,
    accentSettings, setAccentSettings,
    showNewCaseModal: _showNewCaseModal, setShowNewCaseModal,
    showGlobalSearch, setShowGlobalSearch,
    archiveReport, archives, cases,
    setActiveCaseId,
    addToast,
    initializeStore, isLoading,
    customScopes,
  } = useCaseStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => hasApiKey());
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [focusedReportId, setFocusedReportId] = useState<string | null>(null);
  const [lastNonSettingsView, setLastNonSettingsView] = useState<AppView>(AppView.INVESTIGATION);

  const shortcuts = createAppShortcuts({
    onNewInvestigation: () => {
      setShowNewCaseModal(true);
      setCurrentView(AppView.INVESTIGATION);
    },
    onCloseModal: () => {
      setShowNewCaseModal(false);
      setShowHelpModal(false);
    },
    onShowHelp: () => setShowHelpModal(true),
    onGlobalSearch: () => {
      setShowGlobalSearch(!showGlobalSearch);
    }
  });

  useKeyboardShortcuts(shortcuts);

  const handleBack = useCallback(() => {
    setCurrentView(AppView.DASHBOARD);
    setActiveTaskId(null);
    setFocusedReportId(null);
    setNavStack([]);
  }, [setActiveTaskId, setCurrentView, setNavStack]);

  useEffect(() => {
    const handleNavBack = () => handleBack();
    window.addEventListener('NAVIGATE_BACK', handleNavBack);
    return () => window.removeEventListener('NAVIGATE_BACK', handleNavBack);
  }, [handleBack]);

  useEffect(() => {
    document.documentElement.style.setProperty('--osint-primary', themeColor);
  }, [themeColor]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    if (currentView !== AppView.SETTINGS) {
      setLastNonSettingsView(currentView);
    }
  }, [currentView]);

  const shouldNotify = () => {
    const config = loadSystemConfig();
    return !config.quietMode;
  };

  const resolveScopeById = useCallback((scopeId?: string): InvestigationScope | undefined => {
    if (!scopeId) return undefined;

    return getScopeById(scopeId)
      || getAllScopes(customScopes).find((scope) => scope.id === scopeId);
  }, [customScopes]);

  const addPreseededEntitiesToGraph = useCallback((taskId: string, preseededEntities?: ManualNode[]) => {
    if (!preseededEntities || preseededEntities.length === 0) return;

    const state = useCaseStore.getState();
    const existingNodes = state.manualNodes;
    const nextNodes = [...existingNodes];

    preseededEntities.forEach((entity, index) => {
      const nodeId = `seed-${taskId}-${index}`;
      if (nextNodes.some((node) => node.id === nodeId)) return;
      nextNodes.push({
        ...entity,
        id: nodeId,
        timestamp: Date.now(),
      });
    });

    if (nextNodes.length !== existingNodes.length) {
      void state.setManualNodes(nextNodes);
    }
  }, []);

  const runInvestigationTask = useCallback(async (
    taskId: string,
    launchRequest: InvestigationLaunchRequest,
    runConfig: InvestigationRunConfig
  ) => {
    try {
      let report = await investigateTopic(
        launchRequest.topic,
        launchRequest.parentContext,
        launchRequest.configOverride,
        launchRequest.scope,
        launchRequest.dateRangeOverride
      );

      report = { ...report, config: { ...(report.config || {}), ...runConfig } };
      report = await archiveReport(report, launchRequest.parentContext);

      if (launchRequest.preseededEntities?.length) {
        addPreseededEntitiesToGraph(taskId, launchRequest.preseededEntities);
      }

      completeTask(taskId, report);
      if (useCaseStore.getState().activeTaskId === taskId) {
        setFocusedReportId(report.id || null);
      }
      if (shouldNotify()) addToast(`Investigation complete: ${launchRequest.topic}`, 'SUCCESS');
    } catch (error: unknown) {
      console.error(`Task ${taskId} failed`, error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      failTask(taskId, message);
      addToast(`Investigation failed: ${launchRequest.topic}`, 'ERROR');
    }
  }, [archiveReport, completeTask, failTask, addToast, addPreseededEntitiesToGraph]);

  const launchInvestigation = useCallback((request: InvestigationLaunchRequest) => {
    const switchToView = request.switchToView ?? true;
    const effectiveConfig = migrateSystemConfig({ ...loadSystemConfig(), ...(request.configOverride || {}) });

    if (!hasApiKey(effectiveConfig.provider)) {
      setIsAuthenticated(false);
      addToast(`Missing ${effectiveConfig.provider} API key. Add it to continue.`, 'ERROR');
      return;
    }

    const scopeFromConfig = resolveScopeById((request.configOverride as InvestigationRunConfig | undefined)?.scopeId);
    const effectiveScope = request.scope || scopeFromConfig;

    const launchRequest: InvestigationLaunchRequest = {
      ...request,
      switchToView,
      scope: effectiveScope,
    };

    const runConfig: InvestigationRunConfig = {
      provider: effectiveConfig.provider,
      modelId: effectiveConfig.modelId,
      persona: effectiveConfig.persona,
      searchDepth: effectiveConfig.searchDepth,
      thinkingBudget: effectiveConfig.thinkingBudget,
      scopeId: effectiveScope?.id,
      scopeName: effectiveScope?.name,
      dateRangeOverride: launchRequest.dateRangeOverride,
      preseededEntities: launchRequest.preseededEntities,
      launchSource: launchRequest.launchSource,
    };

    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newTask: InvestigationTask = {
      id: newTaskId,
      topic: launchRequest.topic,
      status: 'RUNNING',
      startTime: Date.now(),
      parentContext: launchRequest.parentContext,
      config: runConfig,
      launchRequest,
    };

    addTask(newTask);
    if (shouldNotify()) addToast(`Scanning for leads on: ${launchRequest.topic}`, 'INFO');

    if (switchToView) {
      setFocusedReportId(null);
      setActiveTaskId(newTaskId);
      setCurrentView(AppView.INVESTIGATION);
    }

    void runInvestigationTask(newTaskId, launchRequest, runConfig);
  }, [addTask, addToast, resolveScopeById, runInvestigationTask, setActiveTaskId, setCurrentView]);

  const handleBatchInvestigate = (leads: string[], parentReport: InvestigationReport) => {
    const parentContext = { topic: parentReport.topic, summary: parentReport.summary };
    const inheritedConfig = toSystemConfigOverride(parentReport.config);
    const inheritedScope = resolveScopeById(parentReport.config?.scopeId);

    leads.forEach((lead, index) => {
      setTimeout(() => {
        launchInvestigation({
          topic: lead,
          parentContext,
          configOverride: inheritedConfig,
          scope: inheritedScope,
          dateRangeOverride: parentReport.config?.dateRangeOverride,
          switchToView: false,
          launchSource: 'FULL_SPECTRUM',
        });
      }, index * 200);
    });
  };

  const handleViewReport = (report: InvestigationReport) => {
    setFocusedReportId(report.id || null);
    setActiveCaseId(report.caseId || null);

    const existingTask = tasks.find(t => t.report?.id === report.id || t.report?.topic === report.topic);

    if (existingTask) {
      setActiveTaskId(existingTask.id);
    } else {
      setActiveTaskId(null);
    }
    setCurrentView(AppView.INVESTIGATION);
  };

  const handleSelectTask = (taskId: string) => {
    setActiveTaskId(taskId);
    setCurrentView(AppView.INVESTIGATION);
  };

  const handleClearCompleted = async () => {
    const activeBeforeClear = tasks.find(t => t.id === activeTaskId);
    await clearCompletedTasks();
    if (activeBeforeClear && (activeBeforeClear.status === 'COMPLETED' || activeBeforeClear.status === 'FAILED')) {
      setActiveTaskId(null);
    }
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);
  const focusedReport = focusedReportId ? archives.find(r => r.id === focusedReportId) || null : null;
  const activeReport = activeTask?.report || focusedReport || null;

  useEffect(() => {
    if (activeReport) {
      const report = activeReport;
      const newStack: BreadcrumbItem[] = [];

      if (report.caseId) {
        const foundCase = cases.find(c => c.id === report.caseId);
        if (foundCase) {
          newStack.push({ type: 'CASE', id: foundCase.id, label: foundCase.title.replace('Operation: ', '') });
        }
      }

      newStack.push({ type: 'REPORT', id: report.id || activeTaskId || 'report', label: report.topic });
      setNavStack(newStack);
    }
  }, [activeReport, cases, setNavStack, activeTaskId]);

  const handleBreadcrumbNavigate = (id: string) => {
    const caseItem = navStack.find(item => item.id === id && item.type === 'CASE');
    if (caseItem) {
      const caseReports = archives.filter(r => r.caseId === id);
      if (caseReports.length > 0) {
        const root = caseReports.find(r => !r.parentTopic) || caseReports[0];
        handleViewReport(root);
        return;
      }
      setActiveTaskId(null);
      setCurrentView(AppView.INVESTIGATION);
      return;
    }

    const task = tasks.find(t => t.id === id || t.report?.id === id);
    if (task) {
      handleSelectTask(task.id);
      return;
    }

    const archiveReport = archives.find(r => r.id === id);
    if (archiveReport) {
      handleViewReport(archiveReport);
    }
  };

  const handleSelectReport = (report: InvestigationReport) => {
    handleViewReport(report);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
          <p>Initializing Secure Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-osint-dark text-osint-text font-sans selection:bg-osint-primary selection:text-black overflow-hidden">

      {!isAuthenticated && <ApiKeyModal onKeySet={() => setIsAuthenticated(hasApiKey())} />}

      <Sidebar
        currentView={currentView}
        onChangeView={(view) => {
          if (view === AppView.SETTINGS) {
            if (currentView === AppView.SETTINGS) {
              setCurrentView(lastNonSettingsView);
            } else {
              setCurrentView(AppView.SETTINGS);
            }
          } else {
            setCurrentView(view);
          }
          if (window.innerWidth < 768) {
            setIsSidebarCollapsed(true);
          }
        }}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        tasks={tasks}
        activeTaskId={activeTaskId}
        onSelectTask={handleSelectTask}
        onClearCompleted={handleClearCompleted}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
      />

      <main className={`flex-1 flex flex-col h-screen bg-osint-dark relative transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'}`}>

        <div className="flex-1 overflow-hidden relative w-full">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-black">
              <div className="text-osint-primary font-mono text-sm animate-pulse tracking-widest">LOADING_PROTOCOL...</div>
            </div>
          }>
            {currentView === AppView.DASHBOARD && (
              <Feed
                onInvestigate={(request) => launchInvestigation({ ...request, switchToView: true })}
              />
            )}
            {currentView === AppView.ARCHIVES && (
              <Archives
                onSelectReport={handleSelectReport}
                onStartNewCase={(request) => launchInvestigation({ ...request, switchToView: true })}
              />
            )}
            {currentView === AppView.NETWORK && (
              <NetworkGraph
                onOpenReport={handleSelectReport}
                onInvestigateEntity={(request) => launchInvestigation({ ...request, switchToView: true })}
              />
            )}
            {currentView === AppView.LIVE_MONITOR && (
              <LiveMonitor
                events={_liveEvents}
                setEvents={_setLiveEvents}
                onInvestigate={(request) => launchInvestigation({ ...request, switchToView: true })}
              />
            )}
            {currentView === AppView.TIMELINE && (
              <TimelineView />
            )}
            {currentView === AppView.SETTINGS && (
              <Settings
                themeColor={themeColor}
                onThemeChange={(color) => setThemeColor(color)}
                themeMode={themeMode}
                onThemeModeChange={setThemeMode}
                accentSettings={accentSettings}
                onAccentChange={(settings) => {
                  setAccentSettings(settings);
                  const newColor = buildAccentColor(settings);
                  setThemeColor(newColor);
                }}
                onStartCase={(topic, config) => launchInvestigation({
                  topic,
                  configOverride: config,
                  switchToView: true,
                  launchSource: 'SETTINGS_TEMPLATE',
                })}
                onClose={() => setCurrentView(lastNonSettingsView)}
              />
            )}
          </Suspense>
        </div>

        <Suspense fallback={<div className="flex-1 bg-black" />}>
          {currentView === AppView.INVESTIGATION && (
            <OperationView
              task={activeTask ?? null}
              reportOverride={activeReport}
              onBack={handleBack}
              onDeepDive={(request) => launchInvestigation({ ...request, switchToView: true })}
              onBatchDeepDive={handleBatchInvestigate}
              navStack={navStack}
              onNavigate={handleBreadcrumbNavigate}
              onSelectCase={(reportId) => {
                const foundReport = archives.find(r => r.id === reportId);
                if (foundReport) {
                  handleViewReport(foundReport);
                }
              }}
              onStartNewCase={(request) => launchInvestigation({ ...request, switchToView: true })}
              onInvestigateHeadline={(request) => launchInvestigation({ ...request, switchToView: true })}
            />
          )}
        </Suspense>
      </main>
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
      <GlobalSearch />
      <ToastContainer />
    </div>
  );
}

export default App;
