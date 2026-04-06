import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
import {
  buildPathForAppView,
  findWorkspaceLandingArtifact,
  getAppViewForPath,
} from '@/app/navigation';
import {
  buildDiscoverPath,
  buildFilesPath,
  buildRunPath,
  buildSettingsPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
  buildWorkspaceChatSessionPath,
} from '@/app/routes';
import {
  useApplyAppShellTheme,
  useInitializeAppShell,
  useTrackAppShellLocation,
} from '@/app/useAppShellEffects';

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

export interface AppShellController {
  activeChatSessionId: string | null;
  activeTaskId: string | null;
  activeWorkspaceBoardId: string | null;
  activeWorkspaceId: string | null;
  accentSettings: {
    hue: number;
    lightness: number;
    chroma: number;
  };
  artifacts: Artifact[];
  chatMessagesBySessionId: ReturnType<typeof useWorkspaceStore.getState>['chatMessagesBySessionId'];
  chatSessions: ReturnType<typeof useWorkspaceStore.getState>['chatSessions'];
  customScopes: InvestigationScope[];
  handleBack: () => void;
  handleBatchInvestigate: (followUps: FollowUp[], parentReport: Artifact) => void;
  handleClearCompleted: () => Promise<void>;
  handleCloseSettings: () => void;
  handleNavigateRecord: (id: string) => void;
  handleNavigateToView: (view: AppView) => void;
  handleSelectTask: (taskId: string) => void;
  handleViewReport: (report: Artifact) => void;
  initializeStore: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSidebarCollapsed: boolean;
  launchInvestigation: (request: InvestigationLaunchRequest) => void;
  liveEvents: ReturnType<typeof useWorkspaceStore.getState>['liveEvents'];
  locationPathname: string;
  openChat: (request: ChatOpenRequest) => Promise<void>;
  routeCurrentView: AppView;
  setActiveChatSessionId: (id: string | null) => void;
  setActiveTaskId: (id: string | null) => void;
  setActiveWorkspaceBoardId: (id: string | null) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  setAccentSettings: (settings: { hue: number; lightness: number; chroma: number }) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  setShowHelpModal: (value: boolean) => void;
  setLiveEvents: ReturnType<typeof useWorkspaceStore.getState>['setLiveEvents'];
  setThemeColor: (color: string) => void;
  setThemeFontSettings: ReturnType<typeof useWorkspaceStore.getState>['setThemeFontSettings'];
  setThemeMode: (mode: 'dark' | 'light') => void;
  setThemeSurfaceSettings: ReturnType<typeof useWorkspaceStore.getState>['setThemeSurfaceSettings'];
  showGlobalSearch: boolean;
  showHelpModal: boolean;
  themeColor: string;
  themeFontSettings: ReturnType<typeof useWorkspaceStore.getState>['themeFontSettings'];
  themeMode: 'dark' | 'light';
  themeSurfaceSettings: ReturnType<typeof useWorkspaceStore.getState>['themeSurfaceSettings'];
  workspaceBoards: ReturnType<typeof useWorkspaceStore.getState>['workspaceBoards'];
  workspaceRuns: WorkspaceRun[];
  workspaces: ReturnType<typeof useWorkspaceStore.getState>['workspaces'];
}

export function useAppShellController(): AppShellController {
  const navigate = useNavigate();
  const location = useLocation();
  const locationPathRef = useRef(location.pathname);
  const lastNonSettingsPathRef = useRef(buildDiscoverPath());

  const {
    workspaceRuns,
    addTask,
    completeTask,
    failTask,
    clearCompletedTasks,
    activeTaskId,
    setActiveTaskId,
    liveEvents,
    setLiveEvents,
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

  useInitializeAppShell(initializeStore);

  const routeCurrentView = useMemo(() => getAppViewForPath(location.pathname), [location.pathname]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasApiKey());
  const [showHelpModal, setShowHelpModal] = useState(false);

  useTrackAppShellLocation({
    pathname: location.pathname,
    search: location.search,
    routeCurrentView,
    locationPathRef,
    lastNonSettingsPathRef,
  });

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
            search: location.search,
          })
        );
      }

      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    },
    [
      activeChatSessionId,
      activeTaskId,
      activeWorkspaceBoardId,
      activeWorkspaceId,
      artifacts,
      location.pathname,
      location.search,
      navigate,
      routeCurrentView,
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

  const handleCloseSettings = useCallback(() => {
    navigate(lastNonSettingsPathRef.current);
  }, [navigate]);

  useApplyAppShellTheme({
    accentSettings,
    themeColor,
    themeFontSettings,
    themeMode,
    themeSurfaceSettings,
  });

  const resolveScopeById = useCallback(
    (scopeId?: string): InvestigationScope | undefined => {
      if (!scopeId) return undefined;

      return (
        getScopeById(scopeId) || getAllScopes(customScopes).find((scope) => scope.id === scopeId)
      );
    },
    [customScopes]
  );

  const addPreseededEntitiesToGraph = useCallback((taskId: string, preseededEntities?: ManualNode[]) => {
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
  }, []);

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
    [addPreseededEntitiesToGraph, addToast, archiveReport, completeTask, failTask, navigate]
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
          navigate(
            boardId ? buildWorkspaceBoardDocumentPath(id, boardId) : buildWorkspaceBoardPath(id)
          );
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

  return {
    activeChatSessionId,
    activeTaskId,
    activeWorkspaceBoardId,
    activeWorkspaceId,
    accentSettings,
    artifacts,
    chatMessagesBySessionId,
    chatSessions,
    customScopes,
    handleBack,
    handleBatchInvestigate,
    handleClearCompleted,
    handleCloseSettings,
    handleNavigateRecord,
    handleNavigateToView,
    handleSelectTask,
    handleViewReport,
    initializeStore,
    isAuthenticated,
    isLoading,
    isSidebarCollapsed,
    launchInvestigation,
    liveEvents,
    locationPathname: location.pathname,
    openChat,
    routeCurrentView,
    setActiveChatSessionId,
    setActiveTaskId,
    setActiveWorkspaceBoardId,
    setActiveWorkspaceId,
    setAccentSettings,
    setIsAuthenticated,
    setIsSidebarCollapsed,
    setShowHelpModal,
    setLiveEvents,
    setThemeColor,
    setThemeFontSettings,
    setThemeMode,
    setThemeSurfaceSettings,
    showGlobalSearch,
    showHelpModal,
    themeColor,
    themeFontSettings,
    themeMode,
    themeSurfaceSettings,
    workspaceBoards,
    workspaceRuns,
    workspaces,
  };
}
