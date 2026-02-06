import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { ApiKeyModal } from './components/ui/ApiKeyModal';
import type { BreadcrumbItem } from './components/ui/Breadcrumbs';
import type { InvestigationReport, InvestigationTask, SystemConfig } from './types';
import { AppView } from './types';
import { useCaseStore } from './store/caseStore';
import { hasApiKey, investigateTopic } from './services/gemini';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { createAppShortcuts } from './hooks/useKeyboardShortcuts';
import { HelpModal } from './components/ui/HelpModal';
import { buildAccentColor } from './utils/accent';
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


function App() {
  const {
    currentView, setCurrentView,
    tasks, addTask, completeTask, failTask, clearCompletedTasks,
    activeTaskId, setActiveTaskId,
    liveEvents: _liveEvents, setLiveEvents: _setLiveEvents,
    navStack, setNavStack,
    isSidebarCollapsed, setIsSidebarCollapsed,
    themeColor, setThemeColor,
    accentSettings, setAccentSettings,
    showNewCaseModal: _showNewCaseModal, setShowNewCaseModal,
    showGlobalSearch, setShowGlobalSearch,
    archiveReport, archives, cases,
    setActiveCaseId,
    addToast,
    initializeStore, isLoading
  } = useCaseStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => hasApiKey());
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [focusedReportId, setFocusedReportId] = useState<string | null>(null);

  // Global Keyboard Shortcuts
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

  // Initialize
  useEffect(() => {
    // Listen for custom back event from Investigation view
    const handleNavBack = () => handleBack();
    window.addEventListener('NAVIGATE_BACK', handleNavBack);
    return () => window.removeEventListener('NAVIGATE_BACK', handleNavBack);
  }, [handleBack]);

  useEffect(() => {
    document.documentElement.style.setProperty('--osint-primary', themeColor);
  }, [themeColor]);

  // --- CORE INVESTIGATION LOGIC ---

  const shouldNotify = () => {
    try {
      const configStr = localStorage.getItem('sherlock_config');
      if (!configStr) return true;
      const config = JSON.parse(configStr);
      return !config.quietMode;
    } catch { return true; }
  };

  const runInvestigationTask = useCallback(async (taskId: string, topic: string, context?: { topic: string, summary: string }, configOverride?: Partial<SystemConfig>) => {
    try {
      let report = await investigateTopic(topic, context, configOverride);

      // AUTO ARCHIVE REPORT
      report = { ...report, config: configOverride };
      report = await archiveReport(report, context);

      completeTask(taskId, report);
      if (useCaseStore.getState().activeTaskId === taskId) {
        setFocusedReportId(report.id || null);
      }
      if (shouldNotify()) addToast(`Investigation complete: ${topic}`, "SUCCESS");
    } catch (error: unknown) {
      console.error(`Task ${taskId} failed`, error);
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      failTask(taskId, message);
      addToast(`Investigation failed: ${topic}`, "ERROR");
    }
  }, [archiveReport, completeTask, failTask, addToast]);

  const startInvestigation = (topic: string, context?: { topic: string, summary: string }, switchToView: boolean = true, configOverride?: Partial<SystemConfig>) => {
    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newTask: InvestigationTask = {
      id: newTaskId,
      topic: topic,
      status: 'RUNNING',
      startTime: Date.now(),
      parentContext: context,
      config: configOverride
    };

    addTask(newTask);
    if (shouldNotify()) addToast(`Scanning for leads on: ${topic}`, "INFO");

    if (switchToView) {
      setFocusedReportId(null);
      setActiveTaskId(newTaskId);
      setCurrentView(AppView.INVESTIGATION);
    }

    // Run async without blocking UI
    runInvestigationTask(newTaskId, topic, context, configOverride);
  };

  const handleBatchInvestigate = (leads: string[], parentReport: InvestigationReport) => {
    const parentContext = { topic: parentReport.topic, summary: parentReport.summary };

    leads.forEach((lead, index) => {
      setTimeout(() => {
        startInvestigation(lead, parentContext, false);
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

  // Current active task object
  const activeTask = tasks.find(t => t.id === activeTaskId);
  const focusedReport = focusedReportId ? archives.find(r => r.id === focusedReportId) || null : null;
  const activeReport = activeTask?.report || focusedReport || null;

  // Build nav stack from the currently visible report (task-driven or archive-driven)
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

  // Navigate via breadcrumbs or dossier report selection
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

  const handleInvestigateEntity = (entity: string, context?: { topic: string, summary: string }) => {
    startInvestigation(entity, context, true);
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

      {!isAuthenticated && <ApiKeyModal onKeySet={() => setIsAuthenticated(true)} />}

      <Sidebar
        currentView={currentView}
        onChangeView={(view) => {
          setCurrentView(view);
          // Mobile: close sidebar when navigating
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
                onInvestigate={(topic) => startInvestigation(topic, undefined, true)}
              />
            )}
            {currentView === AppView.ARCHIVES && (
              <Archives
                onSelectReport={handleSelectReport}
                onStartNewCase={(topic, config) => startInvestigation(topic, undefined, true, config)}
              />
            )}
            {currentView === AppView.NETWORK && (
              <NetworkGraph
                onOpenReport={handleSelectReport}
                onInvestigateEntity={handleInvestigateEntity}
              />
            )}
            {currentView === AppView.LIVE_MONITOR && (
              <LiveMonitor
                events={_liveEvents}
                setEvents={_setLiveEvents}
                onInvestigate={(topic, ctx, config) => startInvestigation(topic, ctx, true, config)}
              />
            )}
            {currentView === AppView.TIMELINE && (
              <TimelineView />
            )}
            {currentView === AppView.SETTINGS && (
              <Settings
                themeColor={themeColor}
                onThemeChange={(color) => setThemeColor(color)}
                accentSettings={accentSettings}
                onAccentChange={(settings) => {
                  setAccentSettings(settings);
                  const newColor = buildAccentColor(settings);
                  setThemeColor(newColor);
                }}
                onStartCase={(topic, config) => startInvestigation(topic, undefined, true, config)}
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
              onDeepDive={(lead, report) => startInvestigation(lead, { topic: report.topic, summary: report.summary }, true)}
              onBatchDeepDive={handleBatchInvestigate}
              navStack={navStack}
              onNavigate={handleBreadcrumbNavigate}
              onSelectCase={(reportId) => {
                const foundReport = archives.find(r => r.id === reportId);
                if (foundReport) {
                  handleViewReport(foundReport);
                }
              }}
              onStartNewCase={(topic, config) => startInvestigation(topic, undefined, true, config)}
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
