import { useState, useEffect, lazy, Suspense, useCallback, useMemo, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { ApiKeyModal } from '@/components/ui/ApiKeyModal';
import type {
  ChatOpenRequest,
  FollowUp,
  InvestigationLaunchRequest,
  Artifact,
  InvestigationRunConfig,
  InvestigationScope,
  WorkspaceRun,
  ManualNode,
  SystemConfig,
} from '@/types';
import { AppView } from '@/types';
import { useWorkspaceStore } from '@/store/caseStore';
import { hasApiKey, runWorkspaceInvestigation } from '@/services/runtime';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { createAppShortcuts } from '@/hooks/useKeyboardShortcuts';
import { HelpModal } from '@/components/ui/HelpModal';
import { buildAccentColor } from '@/utils/accent';
import { buildEntityPaletteCssVars } from '@/utils/entityPalette';
import { buildThemeSurfaceCssVars } from '@/utils/themeSurfaces';
import { buildThemeFontCssVars } from '@/utils/themeFonts';
import { createLocalId } from '@/utils/id';
import { normalizeTopicText } from '@/utils/textNormalization';
import { loadSystemConfig, migrateSystemConfig } from '@/config/systemConfig';
import { getAllScopes, getScopeById } from '@/data/presets';
import { getDomainPackForScope, getPurposeProfileById } from '@/domain';
import {
  buildChatSessionMetadata,
  buildLaunchContextPrimer,
  findReusableChatSession,
  hasLaunchContextPrimer,
} from '@/services/chat/launchContext';
import { resolveLaunchLineage } from '@/services/lineage/relationships';
import { buildPathForAppView, findWorkspaceLandingArtifact, getAppViewForPath } from '@/app/navigation';
import {
  buildDiscoverPath,
  buildFilesPath,
  buildRunPath,
  buildSettingsPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceChatSessionPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
  getRouteDefinition,
} from '@/app/routes';
import {
  ArtifactRouteView,
  BoardRouteView,
  ChatRouteView,
  NetworkRouteView,
  RunRouteView,
  TimelineRouteView,
  WorkspaceHomeRouteView,
} from '@/app/routeViews';
import { Sidebar } from '@/components/ui/Sidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { GlobalSearch } from '@/components/ui/GlobalSearch';

const Archives = lazy(() =>
  import('@/components/features/Archives').then((m) => ({ default: m.Archives }))
);
const LiveMonitor = lazy(() =>
  import('@/components/features/LiveMonitor').then((m) => ({ default: m.LiveMonitor }))
);
const Settings = lazy(() =>
  import('@/components/features/Settings').then((m) => ({ default: m.Settings }))
);
const Feed = lazy(() => import('@/components/features/Feed').then((m) => ({ default: m.Feed })));

const toSystemConfigOverride = (
  config?: InvestigationRunConfig
): Partial<SystemConfig> | undefined => {
  if (!config) return undefined;

  return {
    provider: config.provider,
    modelId: config.modelId,
    persona: config.persona,
    searchDepth: config.searchDepth,
    thinkingBudget: config.thinkingBudget,
  };
};

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationPathRef = useRef(location.pathname);
  const lastNonSettingsPathRef = useRef(buildDiscoverPath());

  const {
    setCurrentView,
    workspaceRuns,
    addTask,
    completeTask,
    failTask,
    clearCompletedTasks,
    activeTaskId,
    setActiveTaskId,
    liveEvents: _liveEvents,
    setLiveEvents: _setLiveEvents,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    themeMode,
    setThemeMode,
    themeColor,
    setThemeColor,
    accentSettings,
    setAccentSettings,
    themeSurfaceSettings,
    setThemeSurfaceSettings,
    themeFontSettings,
    setThemeFontSettings,
    showGlobalSearch,
    setShowGlobalSearch,
    archiveReport,
    artifacts,
    workspaces,
    workspaceBoards,
    chatMessagesBySessionId,
    chatSessions,
    createChatSession,
    activeWorkspaceId,
    activeWorkspaceBoardId,
    setActiveWorkspaceId,
    setActiveWorkspaceBoardId,
    activeChatSessionId,
    setActiveChatSessionId,
    addToast,
    initializeStore,
    isLoading,
    customScopes,
  } = useWorkspaceStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  useEffect(() => {
    locationPathRef.current = location.pathname;
  }, [location.pathname]);

  const routeCurrentView = useMemo(() => getAppViewForPath(location.pathname), [location.pathname]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasApiKey());
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    setCurrentView(routeCurrentView);
    if (routeCurrentView !== AppView.SETTINGS) {
      lastNonSettingsPathRef.current = location.pathname + location.search;
    }
  }, [location.pathname, location.search, routeCurrentView, setCurrentView]);

  const handleNavigateToView = useCallback(
    (view: AppView) => {
      if (view === AppView.SETTINGS) {
        if (routeCurrentView === AppView.SETTINGS) {
          navigate(lastNonSettingsPathRef.current);
        } else {
          navigate(buildSettingsPath());
        }
      } else {
        navigate(
          buildPathForAppView(view, {
            activeWorkspaceId,
            activeWorkspaceBoardId,
            activeChatSessionId,
            activeTaskId,
            artifacts,
            pathname: location.pathname,
          })
        );
      }

      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    },
    [
      routeCurrentView,
      navigate,
      activeWorkspaceId,
      activeWorkspaceBoardId,
      activeChatSessionId,
      activeTaskId,
      artifacts,
      location.pathname,
      setIsSidebarCollapsed,
    ]
  );

  const shortcuts = createAppShortcuts({
    onNewInvestigation: () => {
      navigate(buildFilesPath());
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('OPEN_NEW_WORKSPACE_MODAL'));
      }, 0);
    },
    onCloseModal: () => setShowHelpModal(false),
    onShowHelp: () => setShowHelpModal(true),
    onGlobalSearch: () => setShowGlobalSearch(!showGlobalSearch),
  });

  useKeyboardShortcuts(shortcuts);

  const handleBack = useCallback(() => {
    setActiveTaskId(null);
    navigate(buildDiscoverPath());
  }, [navigate, setActiveTaskId]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--osint-primary', themeColor);
    Object.entries(buildEntityPaletteCssVars(accentSettings)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, [accentSettings, themeColor]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(buildThemeSurfaceCssVars(themeSurfaceSettings)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, [themeSurfaceSettings]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(buildThemeFontCssVars(themeFontSettings)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, [themeFontSettings]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);

  const resolveScopeById = useCallback(
    (scopeId?: string): InvestigationScope | undefined => {
      if (!scopeId) return undefined;

      return (
        getScopeById(scopeId) || getAllScopes(customScopes).find((scope) => scope.id === scopeId)
      );
    },
    [customScopes]
  );

  const addPreseededEntitiesToGraph = useCallback(
    (taskId: string, preseededEntities?: ManualNode[]) => {
      if (!preseededEntities || preseededEntities.length === 0) return;

      const state = useWorkspaceStore.getState();
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
    },
    []
  );

  const runInvestigationTask = useCallback(
    async (
      taskId: string,
      launchRequest: InvestigationLaunchRequest,
      runConfig: InvestigationRunConfig
    ) => {
      try {
        let report = await runWorkspaceInvestigation(
          launchRequest.topic,
          launchRequest.parentContext,
          launchRequest.configOverride,
          launchRequest.scope,
          launchRequest.dateRangeOverride,
          runConfig
        );

        report = { ...report, config: { ...(report.config || {}), ...runConfig } };
        report = {
          ...report,
          config: {
            ...(report.config || {}),
            ...runConfig,
            sourceRunId: taskId,
          },
        };
        report = await archiveReport(report, launchRequest.parentContext);

        if (launchRequest.preseededEntities?.length) {
          addPreseededEntitiesToGraph(taskId, launchRequest.preseededEntities);
        }

        completeTask(taskId, report);

        if (report.id && report.caseId && locationPathRef.current === buildRunPath(taskId)) {
          navigate(buildWorkspaceArtifactPath(report.caseId, report.id), { replace: true });
        }

        if (!loadSystemConfig().quietMode) {
          addToast(`Run complete: ${launchRequest.topic}`, 'SUCCESS');
        }
      } catch (error: unknown) {
        console.error(`Task ${taskId} failed`, error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        failTask(taskId, message);
        addToast(`Run failed: ${launchRequest.topic}`, 'ERROR');
      }
    },
    [archiveReport, addPreseededEntitiesToGraph, completeTask, failTask, addToast, navigate]
  );

  const launchInvestigation = useCallback(
    (request: InvestigationLaunchRequest) => {
      const switchToView = request.switchToView ?? true;
      const effectiveConfig = migrateSystemConfig({
        ...loadSystemConfig(),
        ...(request.configOverride || {}),
      });
      const normalizedTopic = normalizeTopicText(request.topic);

      if (!hasApiKey(effectiveConfig.provider)) {
        setIsAuthenticated(false);
        addToast(`Missing ${effectiveConfig.provider} API key. Add it to continue.`, 'ERROR');
        return;
      }

      const scopeFromConfig = resolveScopeById(
        (request.configOverride as InvestigationRunConfig | undefined)?.scopeId
      );
      const effectiveScope = request.scope || scopeFromConfig;
      const effectivePack = getDomainPackForScope(effectiveScope);
      const effectivePurpose = getPurposeProfileById(
        request.purposeId ||
          (request.configOverride as InvestigationRunConfig | undefined)?.purposeId ||
          effectivePack.defaultPurposeId
      );
      const artifactType =
        request.artifactType ||
        (request.configOverride as InvestigationRunConfig | undefined)?.artifactType ||
        effectivePurpose.recommendedArtifactType;
      const labelProfileId =
        request.labelProfileId ||
        (request.configOverride as InvestigationRunConfig | undefined)?.labelProfileId ||
        effectivePack.labelProfileId;
      const derivedLineage = resolveLaunchLineage({
        request,
        artifacts,
        runs: workspaceRuns,
      });

      const launchRequest: InvestigationLaunchRequest = {
        ...request,
        topic: normalizedTopic,
        switchToView,
        scope: effectiveScope,
        packId: effectivePack.id,
        purposeId: effectivePurpose.id,
        artifactType,
        labelProfileId,
        sourceSignalId: derivedLineage.sourceSignalId,
        sourceFollowUpId: derivedLineage.sourceFollowUpId,
        parentArtifactId: derivedLineage.parentArtifactId,
        parentRunId: derivedLineage.parentRunId,
      };

      const runConfig: InvestigationRunConfig = {
        provider: effectiveConfig.provider,
        modelId: effectiveConfig.modelId,
        persona: effectiveConfig.persona,
        searchDepth: effectiveConfig.searchDepth,
        thinkingBudget: effectiveConfig.thinkingBudget,
        scopeId: effectiveScope?.id,
        scopeName: effectiveScope?.name,
        packId: effectivePack.id,
        packName: effectivePack.name,
        purposeId: effectivePurpose.id,
        purposeName: effectivePurpose.name,
        artifactType,
        labelProfileId,
        dateRangeOverride: launchRequest.dateRangeOverride,
        preseededEntities: launchRequest.preseededEntities,
        launchSource: launchRequest.launchSource,
        sourceSignalId: launchRequest.sourceSignalId,
        sourceFollowUpId: launchRequest.sourceFollowUpId,
        parentArtifactId: launchRequest.parentArtifactId,
        parentRunId: launchRequest.parentRunId,
      };

      const newTaskId = createLocalId('task');
      const newTask: WorkspaceRun = {
        id: newTaskId,
        topic: launchRequest.topic,
        status: 'RUNNING',
        startTime: Date.now(),
        parentContext: launchRequest.parentContext,
        config: runConfig,
        launchRequest,
      };

      addTask(newTask);
      if (!loadSystemConfig().quietMode) {
        addToast(`Launching run: ${launchRequest.topic}`, 'INFO');
      }

      if (switchToView) {
        setActiveTaskId(newTaskId);
        navigate(buildRunPath(newTaskId));
      }

      void runInvestigationTask(newTaskId, launchRequest, runConfig);
    },
    [
      addTask,
      addToast,
      artifacts,
      navigate,
      resolveScopeById,
      runInvestigationTask,
      setActiveTaskId,
      workspaceRuns,
    ]
  );

  const openChat = useCallback(
    async (request: ChatOpenRequest) => {
      const workspace = workspaces.find((entry) => entry.id === request.workspaceId);
      if (!workspace) {
        addToast('Unable to open chat because the target workspace was not found.', 'ERROR');
        return;
      }

      setActiveWorkspaceId(workspace.id);

      let session = findReusableChatSession(chatSessions, request);
      if (!session) {
        session = await createChatSession({
          workspaceId: workspace.id,
          title: request.launchContext?.sourceReportId
            ? artifacts.find((entry) => entry.id === request.launchContext?.sourceReportId)?.topic
            : request.launchContext?.entityName || undefined,
          sourceReportId: request.launchContext?.sourceReportId,
          packId: workspace.packId,
          purposeId: workspace.purposeId,
          metadata: buildChatSessionMetadata(undefined, request.launchContext),
        });
      }

      if (request.launchContext) {
        const existingMessages = chatMessagesBySessionId[session.id] || [];
        if (!hasLaunchContextPrimer(existingMessages, request.launchContext)) {
          const primer = buildLaunchContextPrimer({
            session,
            launchContext: request.launchContext,
            reports: artifacts.filter((entry) => entry.caseId === workspace.id),
            headlines: useWorkspaceStore
              .getState()
              .headlines.filter((entry) => entry.caseId === workspace.id),
          });

          if (primer) {
            await useWorkspaceStore.getState().addChatMessage(primer);
          }
        }
      }

      setActiveChatSessionId(session.id);
      navigate(buildWorkspaceChatSessionPath(workspace.id, session.id));
    },
    [
      addToast,
      artifacts,
      chatMessagesBySessionId,
      chatSessions,
      createChatSession,
      navigate,
      setActiveChatSessionId,
      setActiveWorkspaceId,
      workspaces,
    ]
  );

  const handleBatchInvestigate = useCallback(
    (followUps: FollowUp[], parentReport: Artifact) => {
      const parentContext = { topic: parentReport.topic, summary: parentReport.summary };
      const inheritedConfig = toSystemConfigOverride(parentReport.config);
      const inheritedScope = resolveScopeById(parentReport.config?.scopeId);

      followUps.forEach((followUp, index) => {
        setTimeout(() => {
          launchInvestigation({
            topic: followUp.actionText,
            parentContext,
            configOverride: inheritedConfig,
            scope: inheritedScope,
            dateRangeOverride: parentReport.config?.dateRangeOverride,
            switchToView: false,
            launchSource: 'FULL_SPECTRUM',
            sourceFollowUpId: followUp.id,
            parentArtifactId: parentReport.id,
          });
        }, index * 200);
      });
    },
    [launchInvestigation, resolveScopeById]
  );

  const handleViewReport = useCallback(
    (report: Artifact) => {
      setActiveWorkspaceId(report.caseId || null);

      const existingTask = workspaceRuns.find(
        (task) =>
          task.report?.id === report.id ||
          task.id === report.config?.sourceRunId ||
          task.report?.topic === report.topic
      );

      setActiveTaskId(existingTask?.id || null);

      if (report.caseId && report.id) {
        navigate(buildWorkspaceArtifactPath(report.caseId, report.id));
      } else if (existingTask) {
        navigate(buildRunPath(existingTask.id));
      } else {
        navigate(buildFilesPath());
      }
    },
    [navigate, setActiveTaskId, setActiveWorkspaceId, workspaceRuns]
  );

  const handleSelectTask = useCallback(
    (taskId: string) => {
      setActiveTaskId(taskId);
      navigate(buildRunPath(taskId));
    },
    [navigate, setActiveTaskId]
  );

  const handleNavigateRecord = useCallback(
    (id: string) => {
      const workspace = workspaces.find((entry) => entry.id === id);
      if (workspace) {
        const landingArtifact = findWorkspaceLandingArtifact(id, artifacts);
        if (landingArtifact?.id) {
          navigate(buildWorkspaceArtifactPath(id, landingArtifact.id));
        } else {
          const boardId = workspaceBoards.find((board) => board.workspaceId === id)?.id;
          navigate(boardId ? buildWorkspaceBoardDocumentPath(id, boardId) : buildWorkspaceBoardPath(id));
        }
        return;
      }

      const task = workspaceRuns.find((entry) => entry.id === id || entry.report?.id === id);
      if (task) {
        handleSelectTask(task.id);
        return;
      }

      const report = artifacts.find((entry) => entry.id === id);
      if (report) {
        handleViewReport(report);
      }
    },
    [
      artifacts,
      handleSelectTask,
      handleViewReport,
      navigate,
      workspaceBoards,
      workspaceRuns,
      workspaces,
    ]
  );

  const handleClearCompleted = useCallback(async () => {
    const activeBeforeClear = workspaceRuns.find((task) => task.id === activeTaskId);
    await clearCompletedTasks();

    if (
      activeBeforeClear &&
      (activeBeforeClear.status === 'COMPLETED' || activeBeforeClear.status === 'FAILED')
    ) {
      setActiveTaskId(null);
      if (locationPathRef.current === buildRunPath(activeBeforeClear.id)) {
        navigate(buildFilesPath(), { replace: true });
      }
    }
  }, [activeTaskId, clearCompletedTasks, navigate, setActiveTaskId, workspaceRuns]);

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
      {!isAuthenticated && (
        <ApiKeyModal
          onKeySet={() => setIsAuthenticated(hasApiKey())}
          onBypass={() => setIsAuthenticated(true)}
        />
      )}

      <Sidebar
        currentView={routeCurrentView}
        onChangeView={handleNavigateToView}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        workspaceRuns={workspaceRuns}
        activeTaskId={activeTaskId}
        onSelectTask={handleSelectTask}
        onClearCompleted={handleClearCompleted}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
      />

      <main
        className={`flex-1 flex flex-col h-screen bg-osint-dark relative transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'}`}
      >
        <div className="flex-1 overflow-hidden relative w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-black">
                <div className="text-osint-primary font-mono text-sm animate-pulse tracking-widest">
                  LOADING_PROTOCOL...
                </div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Navigate to={buildDiscoverPath()} replace />} />
              <Route
                path={getRouteDefinition('DISCOVER').path}
                element={
                  <Feed
                    onInvestigate={(request) =>
                      launchInvestigation({ ...request, switchToView: true })
                    }
                  />
                }
              />
              <Route
                path={getRouteDefinition('FILES').path}
                element={
                  <Archives
                    onSelectReport={handleViewReport}
                    onStartNewCase={(request) =>
                      launchInvestigation({ ...request, switchToView: true })
                    }
                    onOpenChat={openChat}
                  />
                }
              />
              <Route
                path={getRouteDefinition('MONITOR').path}
                element={
                  <LiveMonitor
                    events={_liveEvents}
                    setEvents={_setLiveEvents}
                    onInvestigate={(request) =>
                      launchInvestigation({ ...request, switchToView: true })
                    }
                  />
                }
              />
              <Route
                path={getRouteDefinition('RUN_DETAIL').path}
                element={
                  <RunRouteView
                    artifacts={artifacts}
                    workspaceRuns={workspaceRuns}
                    workspaces={workspaces}
                    workspaceBoards={workspaceBoards}
                    setActiveTaskId={setActiveTaskId}
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    onBack={handleBack}
                    onLaunchInvestigation={launchInvestigation}
                    onBatchInvestigate={handleBatchInvestigate}
                    onNavigateRecord={handleNavigateRecord}
                    onViewReport={handleViewReport}
                    onOpenChat={openChat}
                  />
                }
              />
              <Route
                path={getRouteDefinition('WORKSPACE_HOME').path}
                element={
                  <WorkspaceHomeRouteView
                    artifacts={artifacts}
                    workspaces={workspaces}
                    workspaceBoards={workspaceBoards}
                    setActiveWorkspaceId={setActiveWorkspaceId}
                  />
                }
              />
              <Route
                path={getRouteDefinition('WORKSPACE_ARTIFACT').path}
                element={
                  <ArtifactRouteView
                    artifacts={artifacts}
                    workspaceRuns={workspaceRuns}
                    workspaces={workspaces}
                    workspaceBoards={workspaceBoards}
                    setActiveTaskId={setActiveTaskId}
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    onBack={handleBack}
                    onLaunchInvestigation={launchInvestigation}
                    onBatchInvestigate={handleBatchInvestigate}
                    onNavigateRecord={handleNavigateRecord}
                    onViewReport={handleViewReport}
                    onOpenChat={openChat}
                  />
                }
              />
              <Route
                path={getRouteDefinition('WORKSPACE_CHAT').path}
                element={
                  <ChatRouteView
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    setActiveChatSessionId={setActiveChatSessionId}
                    onLaunchInvestigation={launchInvestigation}
                  />
                }
              />
              <Route
                path={getRouteDefinition('WORKSPACE_CHAT_SESSION').path}
                element={
                  <ChatRouteView
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    setActiveChatSessionId={setActiveChatSessionId}
                    onLaunchInvestigation={launchInvestigation}
                  />
                }
              />
              <Route
                path={getRouteDefinition('WORKSPACE_BOARD').path}
                element={
                  <BoardRouteView
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    setActiveWorkspaceBoardId={setActiveWorkspaceBoardId}
                    onViewReport={handleViewReport}
                    onOpenChat={openChat}
                    onLaunchInvestigation={launchInvestigation}
                  />
                }
              />
              <Route
                path={getRouteDefinition('WORKSPACE_BOARD_DOCUMENT').path}
                element={
                  <BoardRouteView
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    setActiveWorkspaceBoardId={setActiveWorkspaceBoardId}
                    onViewReport={handleViewReport}
                    onOpenChat={openChat}
                    onLaunchInvestigation={launchInvestigation}
                  />
                }
              />
              <Route
                path={getRouteDefinition('WORKSPACE_TIMELINE').path}
                element={
                  <TimelineRouteView
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    onViewReport={handleViewReport}
                    onOpenChat={openChat}
                    onLaunchInvestigation={launchInvestigation}
                  />
                }
              />
              <Route
                path={getRouteDefinition('WORKSPACE_NETWORK').path}
                element={
                  <NetworkRouteView
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    onViewReport={handleViewReport}
                    onOpenChat={openChat}
                    onLaunchInvestigation={launchInvestigation}
                  />
                }
              />
              <Route
                path={getRouteDefinition('SETTINGS').path}
                element={
                  <Settings
                    themeColor={themeColor}
                    themeMode={themeMode}
                    accentSettings={accentSettings}
                    onAccentChange={(settings) => {
                      setAccentSettings(settings);
                      setThemeColor(buildAccentColor(settings));
                    }}
                    themeSurfaceSettings={themeSurfaceSettings}
                    onThemeSurfaceSettingsChange={setThemeSurfaceSettings}
                    themeFontSettings={themeFontSettings}
                    onThemeFontSettingsChange={setThemeFontSettings}
                    onStartCase={(request) =>
                      launchInvestigation({
                        ...request,
                        switchToView: true,
                        launchSource: 'SETTINGS_TEMPLATE',
                      })
                    }
                    onClose={() => navigate(lastNonSettingsPathRef.current)}
                  />
                }
              />
              <Route path="*" element={<Navigate to={buildDiscoverPath()} replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
      <GlobalSearch />
      <ToastContainer />
    </div>
  );
}
