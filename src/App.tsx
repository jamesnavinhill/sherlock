import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Sidebar } from './components/ui/Sidebar';
import { Feed } from './components/features/Feed';
import { OperationView } from './components/features/OperationView';
import { Archives } from './components/features/Archives';
import { NetworkGraph } from './components/features/NetworkGraph';
import { LiveMonitor } from './components/features/LiveMonitor';
import { Settings } from './components/features/Settings';
import { ApiKeyModal } from './components/ui/ApiKeyModal';
import { BreadcrumbItem } from './components/ui/Breadcrumbs';
import { AppView, InvestigationReport, InvestigationTask, Case, MonitorEvent, SystemConfig } from './types';
import { hasApiKey, investigateTopic } from './services/gemini';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// --- AUTO ARCHIVE LOGIC ---
const autoArchiveReport = (report: InvestigationReport, parentContext?: { topic: string, summary: string }): InvestigationReport => {
  try {
    const archivesData = localStorage.getItem('sherlock_archives');
    const casesData = localStorage.getItem('sherlock_cases');

    let archives: InvestigationReport[] = archivesData ? JSON.parse(archivesData) : [];
    let cases: Case[] = casesData ? JSON.parse(casesData) : [];

    let targetCaseId = report.caseId;

    // 1. Try to link to parent case via context
    if (!targetCaseId && parentContext) {
      // A. Check if the parent topic corresponds to an existing report in archives
      const parentReport = archives.find(r => r.topic === parentContext.topic);
      if (parentReport?.caseId) {
        targetCaseId = parentReport.caseId;
      } else {
        // B. Check if there is a Case with the parent topic title
        const parentCase = cases.find(c => c.title === parentContext.topic || c.title === `Operation: ${parentContext.topic}`);
        if (parentCase) targetCaseId = parentCase.id;
      }
    }

    // 2. If no parent context or parent case not found, check if a case already exists for THIS topic (resuming an op)
    if (!targetCaseId) {
      const existingCase = cases.find(c => c.title === report.topic || c.title === `Operation: ${report.topic}`);
      if (existingCase) targetCaseId = existingCase.id;
    }

    // 3. Create new case if still no ID
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
      localStorage.setItem('sherlock_cases', JSON.stringify(cases));
    }

    // 4. Construct the final saved report object
    const savedReport: InvestigationReport = {
      ...report,
      id: report.id || `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      caseId: targetCaseId
    };

    // 5. Upsert into archives
    const existingIndex = archives.findIndex(r => r.id === savedReport.id || (r.topic === savedReport.topic && r.dateStr === savedReport.dateStr));
    if (existingIndex >= 0) {
      archives[existingIndex] = savedReport;
    } else {
      archives.push(savedReport);
    }

    localStorage.setItem('sherlock_archives', JSON.stringify(archives));
    return savedReport;

  } catch (e) {
    console.error("Auto-archive failed", e);
    return report; // Return original if save fails
  }
};

// --- TASK REDUCER ---
type TaskAction =
  | { type: 'ADD_TASK'; payload: InvestigationTask }
  | { type: 'COMPLETE_TASK'; payload: { id: string; report: InvestigationReport } }
  | { type: 'FAIL_TASK'; payload: { id: string; error: string } }
  | { type: 'CLEAR_COMPLETED' };

function taskReducer(state: InvestigationTask[], action: TaskAction): InvestigationTask[] {
  switch (action.type) {
    case 'ADD_TASK': return [...state, action.payload];
    case 'COMPLETE_TASK': return state.map(t => t.id === action.payload.id ? { ...t, status: 'COMPLETED', report: action.payload.report, endTime: Date.now() } : t);
    case 'FAIL_TASK': return state.map(t => t.id === action.payload.id ? { ...t, status: 'FAILED', error: action.payload.error } : t);
    case 'CLEAR_COMPLETED': return state.filter(t => t.status === 'RUNNING' || t.status === 'QUEUED');
    default: return state;
  }
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.INVESTIGATION);

  // Task Management State using Reducer
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Live Monitor State (Lifted for Persistence)
  const [liveEvents, setLiveEvents] = useState<MonitorEvent[]>([]);

  // Navigation Stack for Breadcrumbs
  const [navStack, setNavStack] = useState<BreadcrumbItem[]>([]);

  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [themeColor, setThemeColor] = useState('#e4e4e7cc');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  // Global Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      action: () => {
        setShowNewCaseModal(true);
        setCurrentView(AppView.INVESTIGATION);
      },
      description: 'New Investigation'
    },
    {
      key: 'Escape',
      action: () => setShowNewCaseModal(false),
      description: 'Close Modal'
    }
  ]);

  // Initialize
  useEffect(() => {
    const savedTheme = localStorage.getItem('sherlock_theme');
    if (savedTheme) setThemeColor(savedTheme);
    setIsAuthenticated(hasApiKey());

    // Listen for custom back event from Investigation view
    const handleNavBack = () => handleBack();
    window.addEventListener('NAVIGATE_BACK', handleNavBack);
    return () => window.removeEventListener('NAVIGATE_BACK', handleNavBack);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--osint-primary', themeColor);
  }, [themeColor]);

  // --- CORE INVESTIGATION LOGIC ---

  const runInvestigationTask = useCallback(async (taskId: string, topic: string, context?: { topic: string, summary: string }, configOverride?: Partial<SystemConfig>) => {
    try {
      let report = await investigateTopic(topic, context, configOverride);

      // AUTO ARCHIVE REPORT
      report = autoArchiveReport(report, context);

      dispatch({ type: 'COMPLETE_TASK', payload: { id: taskId, report } });
    } catch (e: any) {
      console.error(`Task ${taskId} failed`, e);
      dispatch({ type: 'FAIL_TASK', payload: { id: taskId, error: e.message || "Unknown error occurred" } });
    }
  }, []);

  const startInvestigation = (topic: string, context?: { topic: string, summary: string }, switchToView: boolean = true, configOverride?: Partial<SystemConfig>) => {
    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newTask: InvestigationTask = {
      id: newTaskId,
      topic: topic,
      status: 'RUNNING',
      startTime: Date.now(),
      parentContext: context
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });

    if (switchToView) {
      setActiveTaskId(newTaskId);
      setCurrentView(AppView.INVESTIGATION);
    }

    // Run async without blocking UI
    runInvestigationTask(newTaskId, topic, context, configOverride);
  };

  const handleBatchInvestigate = (leads: string[], parentReport: InvestigationReport) => {
    // 1. Create a toast or notification (Visual feedback handled by TaskManager)
    const parentContext = { topic: parentReport.topic, summary: parentReport.summary };

    // 2. Queue all tasks
    leads.forEach((lead, index) => {
      // Stagger starts slightly to avoid immediate rate limits if possible, 
      // though Gemini usually handles parallel pretty well.
      setTimeout(() => {
        startInvestigation(lead, parentContext, false);
      }, index * 200);
    });
  };

  const handleViewReport = (report: InvestigationReport) => {
    // Check if there is already a completed task for this report to link back to
    const existingTask = tasks.find(t => t.report?.id === report.id || t.report?.topic === report.topic);

    if (existingTask) {
      setActiveTaskId(existingTask.id);
    } else {
      // Create a "virtual" completed task so we can view it in the unified Investigation component
      const virtualTaskId = `virtual-${Date.now()}`;
      const virtualTask: InvestigationTask = {
        id: virtualTaskId,
        topic: report.topic,
        status: 'COMPLETED',
        startTime: Date.now(),
        report: report,
        parentContext: report.parentTopic ? { topic: report.parentTopic, summary: "Loaded from archive" } : undefined
      };
      dispatch({ type: 'ADD_TASK', payload: virtualTask });
      setActiveTaskId(virtualTaskId);
    }
    setCurrentView(AppView.INVESTIGATION);
  };

  const handleSelectTask = (taskId: string) => {
    setActiveTaskId(taskId);
    setCurrentView(AppView.INVESTIGATION);
  };

  const handleBack = () => {
    // Check if we have a case in the stack, if so go to it
    const activeCaseItem = navStack.find(i => i.type === 'CASE');
    if (activeCaseItem && activeTaskId) {
      // We are in a task, go "back" to the case root (or clear task to show case selector if needed)
      // But handleBack is usually "exit to dashboard".
      // Let's keep handleBack as "Return to Dashboard" for global back buttons
    }
    setCurrentView(AppView.DASHBOARD);
    setActiveTaskId(null);
    setNavStack([]);
  };

  const handleClearCompleted = () => {
    dispatch({ type: 'CLEAR_COMPLETED' });
  };

  // Logic to jump to parent task/report
  const handleJumpToParent = (parentTopic: string) => {
    // Find a task that has this topic as its report topic
    const parentTask = tasks.find(t => t.report?.topic === parentTopic || t.topic === parentTopic);
    if (parentTask) {
      handleSelectTask(parentTask.id);
    } else {
      // Try to load from archives if not in current session
      try {
        const archivesData = localStorage.getItem('sherlock_archives');
        if (archivesData) {
          const archives: InvestigationReport[] = JSON.parse(archivesData);
          const archiveReport = archives.find(r => r.topic === parentTopic);
          if (archiveReport) {
            handleViewReport(archiveReport);
            return;
          }
        }
      } catch (e) { }
      console.warn("Parent report not found in session or archives");
    }
  };

  // Current active task object
  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Build nav stack when activeTask changes
  useEffect(() => {
    if (activeTask?.report) {
      const report = activeTask.report;
      const newStack: BreadcrumbItem[] = [];

      // Add case if available
      if (report.caseId) {
        try {
          const casesData = localStorage.getItem('sherlock_cases');
          if (casesData) {
            const cases: Case[] = JSON.parse(casesData);
            const foundCase = cases.find(c => c.id === report.caseId);
            if (foundCase) {
              newStack.push({ type: 'CASE', id: foundCase.id, label: foundCase.title.replace('Operation: ', '') });
            }
          }
        } catch (e) { }
      }

      // Add current report
      newStack.push({ type: 'REPORT', id: report.id || activeTask.id, label: report.topic });

      setNavStack(newStack);
    }
  }, [activeTask]);

  // Navigate via breadcrumbs or dossier report selection
  const handleBreadcrumbNavigate = (id: string) => {
    // Check if it's a case - try to load root report for that case
    const caseItem = navStack.find(item => item.id === id && item.type === 'CASE');
    if (caseItem) {
      // Find the root report for this case
      try {
        const archivesData = localStorage.getItem('sherlock_archives');
        if (archivesData) {
          const archives: InvestigationReport[] = JSON.parse(archivesData);
          const caseReports = archives.filter(r => r.caseId === id);
          if (caseReports.length > 0) {
            // Try to find root (no parent) or just first
            const root = caseReports.find(r => !r.parentTopic) || caseReports[0];
            handleViewReport(root);
            return;
          }
        }
      } catch (e) { }

      // If no reports found (unlikely), stay on investigation view but clear task?
      // Ideally we show the operation view placeholder.
      setActiveTaskId(null);
      setCurrentView(AppView.INVESTIGATION);
      return;
    }

    // Try to find task by ID (either task ID or report ID)
    const task = tasks.find(t => t.id === id || t.report?.id === id);
    if (task) {
      handleSelectTask(task.id);
      return;
    }

    // Fallback: search archives for this report ID
    try {
      const archivesData = localStorage.getItem('sherlock_archives');
      if (archivesData) {
        const archives: InvestigationReport[] = JSON.parse(archivesData);
        const archiveReport = archives.find(r => r.id === id);
        if (archiveReport) {
          handleViewReport(archiveReport);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load report from archives", e);
    }
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

      <main className={`flex-1 flex flex-col items-start h-screen bg-osint-dark relative transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'}`}>

        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative">
          {currentView === AppView.DASHBOARD && (
            <Feed onInvestigate={(topic, ctx) => startInvestigation(topic, ctx, true)} />
          )}

          {currentView === AppView.ARCHIVES && (
            <Archives
              onSelectReport={handleViewReport}
              onStartNewCase={(topic, config) => startInvestigation(topic, undefined, true, config)}
            />
          )}

          {currentView === AppView.INVESTIGATION && (
            <OperationView
              task={activeTask ?? null}
              onBack={handleBack}
              onDeepDive={(lead, report) => startInvestigation(lead, { topic: report.topic, summary: report.summary }, true)}
              onBatchDeepDive={handleBatchInvestigate}
              onJumpToParent={handleJumpToParent}
              navStack={navStack}
              onNavigate={handleBreadcrumbNavigate}
              onSelectCase={(reportId) => {
                // Find the report from archives and view it
                const archivesData = localStorage.getItem('sherlock_archives');
                if (archivesData) {
                  const archives: InvestigationReport[] = JSON.parse(archivesData);
                  const foundReport = archives.find(r => r.id === reportId);
                  if (foundReport) {
                    handleViewReport(foundReport);
                  }
                }
              }}
              onStartNewCase={(topic, config) => startInvestigation(topic, undefined, true, config)}
            />
          )}

          {currentView === AppView.NETWORK && (
            <NetworkGraph
              onOpenReport={handleViewReport}
              onInvestigateEntity={(entity, ctx) => startInvestigation(entity, ctx, true)}
            />
          )}

          {currentView === AppView.LIVE_MONITOR && (
            <LiveMonitor
              events={liveEvents}
              setEvents={setLiveEvents}
              onInvestigate={(topic, ctx, config) => startInvestigation(topic, ctx, true, config)}
            />
          )}

          {currentView === AppView.SETTINGS && (
            <Settings themeColor={themeColor} onThemeChange={(color) => {
              setThemeColor(color);
              localStorage.setItem('sherlock_theme', color);
            }} />
          )}
        </div>
      </main>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

export default App;