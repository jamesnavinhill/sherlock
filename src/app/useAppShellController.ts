import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AppView } from '@/types';
import type {
  ChatOpenRequest,
  FollowUp,
  InvestigationLaunchRequest,
  Artifact,
  InvestigationScope,
  WorkspaceRun,
} from '@/types';
import type { useWorkspaceStore } from '@/store/workspaceStore';
import {
  useAppShellBootstrapState,
  useAppShellLaunchRunState,
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
  activeRunId: string | null;
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
  handleLandingOpenWorkspace: () => void;
  handleNavigateRecord: (id: string) => void;
  handleNavigateToView: (view: AppView) => void;
  handleSelectRun: (runId: string) => void;
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
  setActiveRunId: (id: string | null) => void;
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
  showLandingApiKeyPrompt: boolean;
  showGlobalSearch: boolean;
  shouldHideRouteHeader: boolean;
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
    activeRunId,
    addRun,
    addToast,
    saveArtifact,
    artifacts,
    clearCompletedRuns,
    completeRun,
    customScopes,
    failRun,
    manualNodes,
    setActiveRunId,
    setManualNodes,
    workspaceRuns,
  } = useAppShellLaunchRunState();
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
  const [showLandingApiKeyPrompt, setShowLandingApiKeyPrompt] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isHeaderManuallyHidden, setIsHeaderManuallyHidden] = useState(false);

  const handleApiKeySet = useCallback(() => {
    clearApiKeyPromptDismissed();
    setShowApiKeyPrompt(false);
    if (showLandingApiKeyPrompt) {
      setShowLandingApiKeyPrompt(false);
      navigate(buildFilesPath());
    }
  }, [navigate, showLandingApiKeyPrompt]);

  const handleApiKeyPromptBypass = useCallback(() => {
    markApiKeyPromptDismissed();
    setShowApiKeyPrompt(false);
    if (showLandingApiKeyPrompt) {
      setShowLandingApiKeyPrompt(false);
      navigate(buildFilesPath());
    }
  }, [navigate, showLandingApiKeyPrompt]);

  const handleLandingOpenWorkspace = useCallback(() => {
    if (hasApiKey()) {
      clearApiKeyPromptDismissed();
      setShowApiKeyPrompt(false);
      setShowLandingApiKeyPrompt(false);
      navigate(buildFilesPath());
      return;
    }

    setShowLandingApiKeyPrompt(true);
    setShowApiKeyPrompt(true);
  }, [navigate]);

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
    handleSelectRun,
    handleViewReport,
  } = useAppShellNavigation({
    navigate,
    routeCurrentView,
    location,
    locationPathRef,
    lastNonSettingsPathRef,
    activeChatSessionId,
    activeRunId,
    activeWorkspaceBoardId,
    activeWorkspaceId,
    artifacts,
    workspaceBoards,
    workspaceRuns,
    workspaces,
    clearCompletedRuns,
    setActiveRunId,
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
      setIsHeaderManuallyHidden(false);
      setShowGlobalSearch(true);
      requestOmniboxFocus();
    },
    onToggleHeader: () => {
      if (routeCurrentView === AppView.SETTINGS) return;
      setShowGlobalSearch(false);
      setIsHeaderManuallyHidden((current) => !current);
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
    setActiveRunId,
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
    activeRunId,
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
    handleLandingOpenWorkspace,
    handleNavigateRecord,
    handleNavigateToView,
    handleSelectRun,
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
    setActiveRunId,
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
    showLandingApiKeyPrompt,
    showGlobalSearch,
    shouldHideRouteHeader:
      routeCurrentView !== AppView.SETTINGS && isHeaderManuallyHidden && !showGlobalSearch,
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
