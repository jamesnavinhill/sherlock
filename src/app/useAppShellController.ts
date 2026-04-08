import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import type {
  ChatOpenRequest,
  FollowUp,
  InvestigationLaunchRequest,
  Artifact,
  AppView,
  InvestigationScope,
  WorkspaceRun,
} from '@/types';
import type { useWorkspaceStore } from '@/store/workspaceStore';
import {
  useAppShellBootstrapState,
  useAppShellLaunchTaskState,
  useAppShellLookupState,
  useAppShellRouteState,
  useAppShellThemeUiState,
} from '@/store/selectors/appShellSelectors';
import { hasApiKey } from '@/services/runtime';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { createAppShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  clearApiKeyPromptDismissed,
  hasDismissedApiKeyPrompt,
  markApiKeyPromptDismissed,
} from '@/utils/localStorage';
import { getAppViewForPath } from '@/app/navigation';
import { buildDiscoverPath, buildFilesPath } from '@/app/routes';
import {
  useApplyAppShellTheme,
  useInitializeAppShell,
  useTrackAppShellLocation,
} from '@/app/useAppShellEffects';
import { openWorkspaceChatRequest } from '@/app/openChatRequest';
import { requestOmniboxFocus } from '@/components/ui/omniboxFocus';
import { useAppShellLaunch } from '@/app/useAppShellLaunch';
import { useAppShellNavigation } from '@/app/useAppShellNavigation';

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
    addRun,
    addToast,
    saveArtifact,
    artifacts,
    clearCompletedRuns,
    completeRun,
    customScopes,
    failRun,
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
    workspaceItems,
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

  const {
    handleBack,
    handleClearCompleted,
    handleCloseSettings,
    handleNavigateRecord,
    handleNavigateToView,
    handleSelectTask,
    handleViewReport,
  } = useAppShellNavigation({
    navigate,
    routeCurrentView,
    location,
    locationPathRef,
    lastNonSettingsPathRef,
    activeChatSessionId,
    activeTaskId,
    activeWorkspaceBoardId,
    activeWorkspaceId,
    artifacts,
    workspaceBoards,
    workspaceRuns,
    workspaces,
    clearCompletedRuns,
    setActiveTaskId,
    setActiveWorkspaceId,
    setIsSidebarCollapsed,
  });

  const shortcuts = createAppShortcuts({
    onNewInvestigation: () => {
      navigate(buildFilesPath());
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('OPEN_NEW_WORKSPACE_MODAL'));
      }, 0);
    },
    onCloseModal: () => setShowHelpModal(false),
    onShowHelp: () => setShowHelpModal(true),
    onGlobalSearch: () => {
      if (showGlobalSearch) {
        setShowGlobalSearch(false);
        return;
      }
      setShowGlobalSearch(true);
      requestOmniboxFocus();
    },
  });

  useKeyboardShortcuts(shortcuts);

  useApplyAppShellTheme({
    accentSettings,
    themeColor,
    themeFontSettings,
    themeMode,
    themeSurfaceSettings,
  });

  const { launchInvestigation, handleBatchInvestigate } = useAppShellLaunch({
    navigate,
    locationPathRef,
    artifacts,
    customScopes,
    workspaceRuns,
    addRun,
    addToast,
    saveArtifact,
    completeRun,
    failRun,
    manualNodes,
    setManualNodes,
    setActiveTaskId,
    setShowApiKeyPrompt,
  });

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
        workspaceItems,
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
      workspaceItems,
      workspaces,
    ]
  );

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
