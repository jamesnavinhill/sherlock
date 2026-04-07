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
  SystemConfig,
} from '@/types';
import { AppView } from '@/types';
import type { useWorkspaceStore } from '@/store/caseStore';
import {
  useAppShellBootstrapState,
  useAppShellLaunchTaskState,
  useAppShellLookupState,
  useAppShellRouteState,
  useAppShellThemeUiState,
} from '@/store/selectors/featureSelectors';
import { hasApiKey, runWorkspaceInvestigation } from '@/services/runtime';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { createAppShortcuts } from '@/hooks/useKeyboardShortcuts';
import { createLocalId } from '@/utils/id';
import {
  clearApiKeyPromptDismissed,
  hasDismissedApiKeyPrompt,
  markApiKeyPromptDismissed,
} from '@/utils/localStorage';
import { normalizeTopicText } from '@/utils/textNormalization';
import { loadSystemConfig } from '@/config/systemConfig';
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
} from '@/app/routes';
import {
  useApplyAppShellTheme,
  useInitializeAppShell,
  useTrackAppShellLocation,
} from '@/app/useAppShellEffects';
import {
  resolveRuntimeLaunchFields,
  resolveRuntimeScope,
  toRuntimeConfigOverride,
} from '@/components/features/Runs/runtimeConfigMapping';
import {
  buildLaunchRunConfig,
  buildWorkspaceRun,
  mergeArchivedReportRunConfig,
  mergePreseededEntities,
} from '@/app/appShellLaunchHelpers';
import { openWorkspaceChatRequest } from '@/app/openChatRequest';
import { resolveNavigationRecord } from '@/app/appShellNavigationHelpers';

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
  handleApiKeyPromptBypass: () => void;
  handleApiKeySet: () => void;
  handleClearCompleted: () => Promise<void>;
  handleCloseSettings: () => void;
  handleNavigateRecord: (id: string) => void;
  handleNavigateToView: (view: AppView) => void;
  handleSelectTask: (taskId: string) => void;
  handleViewReport: (report: Artifact) => void;
  initializeStore: () => Promise<void>;
  showApiKeyPrompt: boolean;
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
  setShowApiKeyPrompt: (value: boolean) => void;
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
    activeTaskId,
    addTask,
    addToast,
    archiveReport,
    artifacts,
    clearCompletedTasks,
    completeTask,
    customScopes,
    failTask,
    manualNodes,
    setActiveTaskId,
    setManualNodes,
    workspaceRuns,
  } = useAppShellLaunchTaskState();
  const {
    activeChatSessionId,
    activeWorkspaceBoardId,
    activeWorkspaceId,
    setActiveChatSessionId,
    setActiveWorkspaceBoardId,
    setActiveWorkspaceId,
  } = useAppShellRouteState();
  const {
    accentSettings,
    isSidebarCollapsed,
    liveEvents,
    setAccentSettings,
    setIsSidebarCollapsed,
    setLiveEvents,
    setShowGlobalSearch,
    setThemeColor,
    themeFontSettings,
    setThemeFontSettings,
    setThemeMode,
    setThemeSurfaceSettings,
    showGlobalSearch,
    themeColor,
    themeMode,
    themeSurfaceSettings,
  } = useAppShellThemeUiState();
  const {
    addChatMessage,
    chatMessagesBySessionId,
    chatSessions,
    createChatSession,
    headlines,
    workspaceBoards,
    workspaces,
  } = useAppShellLookupState();
  const {
    initializeStore,
    isLoading,
  } = useAppShellBootstrapState();

  useInitializeAppShell(initializeStore);

  const routeCurrentView = useMemo(() => getAppViewForPath(location.pathname), [location.pathname]);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(
    () => !hasApiKey() && !hasDismissedApiKeyPrompt()
  );
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleApiKeySet = useCallback(() => {
    clearApiKeyPromptDismissed();
    setShowApiKeyPrompt(false);
  }, []);

  const handleApiKeyPromptBypass = useCallback(() => {
    markApiKeyPromptDismissed();
    setShowApiKeyPrompt(false);
  }, []);

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
    (scopeId?: string): InvestigationScope | undefined =>
      resolveRuntimeScope(scopeId, customScopes),
    [customScopes]
  );

  const addPreseededEntitiesToGraph = useCallback(
    async (taskId: string, preseededEntities?: InvestigationRunConfig['preseededEntities']) => {
      const nextNodes = mergePreseededEntities({
        existingNodes: manualNodes,
        preseededEntities,
        taskId,
      });
      if (nextNodes.length !== manualNodes.length) {
        await setManualNodes(nextNodes);
      }
    },
    [manualNodes, setManualNodes]
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

        report = mergeArchivedReportRunConfig(report, runConfig, taskId);
        report = await archiveReport(report, launchRequest.parentContext);

        if (launchRequest.preseededEntities?.length) {
          await addPreseededEntitiesToGraph(taskId, launchRequest.preseededEntities);
        }

        await completeTask(taskId, report);

        if (report.id && report.caseId && locationPathRef.current === buildRunPath(taskId)) {
          navigate(buildWorkspaceArtifactPath(report.caseId, report.id), { replace: true });
        }

        if (!loadSystemConfig().quietMode) {
          addToast(`Run complete: ${launchRequest.topic}`, 'SUCCESS');
        }
      } catch (error: unknown) {
        console.error(`Task ${taskId} failed`, error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        await failTask(taskId, message);
        addToast(`Run failed: ${launchRequest.topic}`, 'ERROR');
      }
    },
    [addPreseededEntitiesToGraph, addToast, archiveReport, completeTask, failTask, navigate]
  );

  const launchInvestigation = useCallback(
    (request: InvestigationLaunchRequest) => {
      void (async () => {
        const switchToView = request.switchToView ?? true;
        const storedConfig = loadSystemConfig();
        const {
          artifactType,
          effectiveConfig,
          labelProfileId,
          pack: effectivePack,
          purpose: effectivePurpose,
          scope: effectiveScope,
        } = resolveRuntimeLaunchFields({
          baseConfig: storedConfig,
          configOverride: request.configOverride as
            | (Partial<SystemConfig> & Partial<InvestigationRunConfig>)
            | undefined,
          customScopes,
          scope: request.scope,
          artifactType: request.artifactType,
          labelProfileId: request.labelProfileId,
          purposeId: request.purposeId,
        });
        const normalizedTopic = normalizeTopicText(request.topic);

        if (!hasApiKey(effectiveConfig.provider)) {
          setShowApiKeyPrompt(true);
          addToast(`Missing ${effectiveConfig.provider} API key. Add it to continue.`, 'ERROR');
          return;
        }

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

        const runConfig = buildLaunchRunConfig({
          artifactType,
          effectiveConfig,
          effectivePack,
          effectivePurpose,
          effectiveScope,
          labelProfileId,
          launchRequest,
        });

        const newTaskId = createLocalId('task');
        const newTask = buildWorkspaceRun({
          launchRequest,
          runConfig,
          taskId: newTaskId,
        });

        try {
          const addTaskPromise = addTask(newTask);
          if (!storedConfig.quietMode) {
            addToast(`Launching run: ${launchRequest.topic}`, 'INFO');
          }

          if (switchToView) {
            setActiveTaskId(newTaskId);
            navigate(buildRunPath(newTaskId));
          }

          await addTaskPromise;
          void runInvestigationTask(newTaskId, launchRequest, runConfig);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to launch run.';
          addToast(message, 'ERROR');
          setActiveTaskId(null);
        }
      })();
    },
    [
      addTask,
      addToast,
      artifacts,
      customScopes,
      navigate,
      runInvestigationTask,
      setActiveTaskId,
      workspaceRuns,
    ]
  );

  const openChat = useCallback(
    async (request: ChatOpenRequest) => {
      await openWorkspaceChatRequest({
        addChatMessage,
        addToast,
        artifacts,
        chatMessagesBySessionId,
        chatSessions,
        createChatSession,
        headlines,
        navigate,
        request,
        setActiveChatSessionId,
        setActiveWorkspaceId,
        workspaces,
      });
    },
    [
      addToast,
      addChatMessage,
      artifacts,
      chatMessagesBySessionId,
      chatSessions,
      createChatSession,
      headlines,
      navigate,
      setActiveChatSessionId,
      setActiveWorkspaceId,
      workspaces,
    ]
  );

  const handleBatchInvestigate = useCallback(
    (followUps: FollowUp[], parentReport: Artifact) => {
      const parentContext = { topic: parentReport.topic, summary: parentReport.summary };
      const inheritedConfig = toRuntimeConfigOverride(parentReport.config);
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
      const matchedRecord = resolveNavigationRecord({
        artifacts,
        id,
        workspaceRuns,
        workspaces,
      });
      if (!matchedRecord) return;

      if (matchedRecord.kind === 'WORKSPACE') {
        const landingArtifact = findWorkspaceLandingArtifact(matchedRecord.workspace.id, artifacts);
        if (landingArtifact?.id) {
          navigate(buildWorkspaceArtifactPath(matchedRecord.workspace.id, landingArtifact.id));
        } else {
          const boardId = workspaceBoards.find(
            (board) => board.workspaceId === matchedRecord.workspace.id
          )?.id;
          navigate(
            boardId
              ? buildWorkspaceBoardDocumentPath(matchedRecord.workspace.id, boardId)
              : buildWorkspaceBoardPath(matchedRecord.workspace.id)
          );
        }
        return;
      }

      if (matchedRecord.kind === 'TASK') {
        handleSelectTask(matchedRecord.task.id);
        return;
      }

      if (matchedRecord.kind === 'ARTIFACT') {
        handleViewReport(matchedRecord.artifact);
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
    handleApiKeyPromptBypass,
    handleApiKeySet,
    handleBatchInvestigate,
    handleClearCompleted,
    handleCloseSettings,
    handleNavigateRecord,
    handleNavigateToView,
    handleSelectTask,
    handleViewReport,
    initializeStore,
    showApiKeyPrompt,
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
    setShowApiKeyPrompt,
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
