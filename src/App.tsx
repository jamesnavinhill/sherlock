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
    showNewCaseModal: _showNewCaseModal, setShowNewCaseModal,
    showGlobalSearch, setShowGlobalSearch,
    archiveReport, archives, cases,
    addToast
  } = useCaseStore();

  const [isAuthenticated, setIsAuthenticated] = useState(() => hasApiKey());
  const [showHelpModal, setShowHelpModal] = useState(false);

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

  const runInvestigationTask = useCallback(async (taskId: string, topic: string, context?: { topic: string, summary: string }, configOverride?: Partial<SystemConfig>) => {
    try {
      let report = await investigateTopic(topic, context, configOverride);

      // AUTO ARCHIVE REPORT
      report = { ...report, config: configOverride };
      report = archiveReport(report, context);

      completeTask(taskId, report);
      addToast(`Investigation complete: ${topic}`, "SUCCESS");
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
    addToast(`Scanning for leads on: ${topic}`, "INFO");

    if (switchToView) {
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
    const existingTask = tasks.find(t => t.report?.id === report.id || t.report?.topic === report.topic);

    if (existingTask) {
      setActiveTaskId(existingTask.id);
    } else {
      const virtualTaskId = `virtual-${Date.now()}`;
      const virtualTask: InvestigationTask = {
        id: virtualTaskId,
        topic: report.topic,
        status: 'COMPLETED',
        startTime: Date.now(),
        report: report,
        parentContext: report.parentTopic ? { topic: report.parentTopic, summary: "Loaded from archive" } : undefined
      };
      addTask(virtualTask);
      setActiveTaskId(virtualTaskId);
    }
    setCurrentView(AppView.INVESTIGATION);
  };

  const handleSelectTask = (taskId: string) => {
    setActiveTaskId(taskId);
    setCurrentView(AppView.INVESTIGATION);
  };

  const handleClearCompleted = () => {
    clearCompletedTasks();
  };

  // Current active task object
  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Build nav stack when activeTask changes
  useEffect(() => {
    if (activeTask?.report) {
      const report = activeTask.report;
      const newStack: BreadcrumbItem[] = [];

      if (report.caseId) {
        const foundCase = cases.find(c => c.id === report.caseId);
        if (foundCase) {
          newStack.push({ type: 'CASE', id: foundCase.id, label: foundCase.title.replace('Operation: ', '') });
        }
      }

      newStack.push({ type: 'REPORT', id: report.id || activeTask.id, label: report.topic });
      setNavStack(newStack);
    }
  }, [activeTask, cases, setNavStack]);

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
                onStartCase={(topic, config) => startInvestigation(topic, undefined, true, config)}
              />
            )}
          </Suspense>
        </div>

        <Suspense fallback={<div className="flex-1 bg-black" />}>
          {currentView === AppView.INVESTIGATION && (
            <OperationView
              task={activeTask ?? null}
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